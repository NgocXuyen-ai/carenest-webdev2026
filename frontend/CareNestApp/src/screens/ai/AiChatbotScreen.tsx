import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Markdown from 'react-native-markdown-display';
import { colors } from '../../theme/colors';
import { chatAi } from '../../api/ai';
import { useFamily } from '../../context/FamilyContext';
import { useAuth } from '../../context/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'Hôm nay cần uống thuốc gì?',
  'Thuốc nào sắp hết hạn?',
  'Tóm tắt sức khỏe của gia đình',
];

function normalizeMarkdown(content: string): string {
  return content.replace(/\r\n/g, '\n').replace(/\\n/g, '\n').trim();
}

export default function AiChatbotScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { selectedProfileId } = useFamily();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);

  const activeProfileId = selectedProfileId || (user?.profileId ? Number(user.profileId) : null);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await chatAi({
        message: text,
        conversationId,
        profileId: activeProfileId,
      });

      setConversationId(response.conversation_id);
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-${response.message_id || Date.now()}`,
          role: 'assistant',
          content: response.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (error) {
      Alert.alert('AI chưa phản hồi được', error instanceof Error ? error.message : 'Đã có lỗi xảy ra');
    } finally {
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: '#fff' }]}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarCircle}>
              <MaterialCommunityIcons name="robot" size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>CareNest AI</Text>
              <View style={styles.onlineStatus}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>ONLINE</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity>
            <MaterialCommunityIcons name="dots-vertical" size={24} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="robot-outline" size={54} color="#94a3b8" />
              <Text style={styles.emptyTitle}>Hỏi CareNest AI</Text>
              <Text style={styles.emptyText}>
                Bạn có thể hỏi về thuốc hôm nay, lịch hẹn sắp tới, tiêm chủng hoặc thông tin sức khỏe của gia đình.
              </Text>
            </View>
          ) : null}

          {messages.map(msg => (
            <View
              key={msg.id}
              style={[styles.messageRow, msg.role === 'user' ? styles.rowUser : styles.rowAI]}
            >
              {msg.role === 'assistant' ? (
                <View style={styles.aiAvatarSmall}>
                  <MaterialCommunityIcons name="robot" size={16} color="#fff" />
                </View>
              ) : null}
              <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
                {msg.role === 'assistant' ? (
                  <Markdown style={markdownStyles}>{normalizeMarkdown(msg.content)}</Markdown>
                ) : (
                  <Text style={[styles.bubbleText, styles.textUser]}>{msg.content}</Text>
                )}
              </View>
              <Text style={styles.timestamp}>{msg.timestamp}</Text>
            </View>
          ))}

          {isTyping ? (
            <View style={[styles.messageRow, styles.rowAI]}>
              <View style={styles.aiAvatarSmall}>
                <MaterialCommunityIcons name="robot" size={16} color="#fff" />
              </View>
              <View style={[styles.bubble, styles.bubbleAI]}>
                <Text style={styles.typingDots}>• • •</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.suggestionSection}>
          <Text style={styles.suggestionLabel}>GỢI Ý CÂU HỎI</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionList}>
            {QUICK_PROMPTS.map(prompt => (
              <TouchableOpacity key={prompt} style={styles.suggestionChip} onPress={() => void sendMessage(prompt)}>
                <Text style={styles.suggestionText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Hỏi tôi về sức khỏe..."
              placeholderTextColor={colors.outline}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => void sendMessage(input)}
            />

            <TouchableOpacity
              style={styles.inputActionBtn}
              onPress={() => navigation.navigate('VoiceAssistant')}
            >
              <MaterialCommunityIcons name="microphone" size={22} color={colors.outline} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={() => void sendMessage(input)}
            disabled={!input.trim()}
          >
            <MaterialCommunityIcons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerContent: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a73e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '800',
    color: '#00395e',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4caf50',
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4caf50',
    letterSpacing: 0.5,
  },
  chatArea: { flex: 1, backgroundColor: '#fff' },
  chatContent: { padding: 16, paddingBottom: 32 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 56, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22 },
  messageRow: { marginBottom: 24, position: 'relative' },
  rowAI: { alignItems: 'flex-start', paddingLeft: 42 },
  rowUser: { alignItems: 'flex-end' },
  aiAvatarSmall: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#004a78',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, maxWidth: '85%' },
  bubbleAI: {
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  bubbleUser: {
    backgroundColor: '#4fa5e8',
    borderTopRightRadius: 4,
  },
  bubbleText: { fontSize: 15, fontFamily: 'Inter', lineHeight: 22 },
  textAI: { color: '#334155' },
  textUser: { color: '#fff' },
  timestamp: { fontSize: 10, color: '#94a3b8', marginTop: 6 },
  typingDots: { fontSize: 18, color: '#94a3b8', letterSpacing: 4 },
  suggestionSection: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  suggestionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  suggestionList: { paddingHorizontal: 16, gap: 10 },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  suggestionText: { fontSize: 13, color: '#1a73e8', fontWeight: '500' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  inputBar: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 26,
    paddingHorizontal: 8,
  },
  inputActionBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: { flex: 1, fontSize: 15, color: '#1e293b', paddingHorizontal: 8 },
  sendBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1a73e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});

const markdownStyles = StyleSheet.create({
  body: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter',
    marginTop: 0,
    marginBottom: 0,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 10,
  },
  heading1: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 0,
    marginBottom: 10,
  },
  heading2: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 2,
    marginBottom: 8,
  },
  bullet_list: {
    marginTop: 0,
    marginBottom: 10,
  },
  ordered_list: {
    marginTop: 0,
    marginBottom: 10,
  },
  list_item: {
    marginBottom: 4,
  },
  code_inline: {
    backgroundColor: '#e2e8f0',
    color: '#0f172a',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontFamily: 'Inter',
  },
  fence: {
    backgroundColor: '#e2e8f0',
    color: '#0f172a',
    borderRadius: 10,
    padding: 10,
    fontFamily: 'Inter',
    marginBottom: 10,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: '#94a3b8',
    paddingLeft: 10,
    marginTop: 0,
    marginBottom: 10,
  },
  strong: {
    fontWeight: '800',
    color: '#0f172a',
  },
  em: {
    fontStyle: 'italic',
  },
  link: {
    color: '#1a73e8',
    textDecorationLine: 'underline',
  },
});
