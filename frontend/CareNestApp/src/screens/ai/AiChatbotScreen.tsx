import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { TOP_BAR_HEIGHT } from '../../utils/constants';
import Icon from '../../components/common/Icon';
import TopAppBar from '../../components/layout/TopAppBar';
import type { AiChatStackParamList } from '../../navigation/navigationTypes';

type Nav = NativeStackNavigationProp<AiChatStackParamList, 'AiChatbot'>;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'init-1',
    role: 'assistant',
    content: 'Xin chào! Tôi là trợ lý sức khỏe AI của CareNest. Bạn có thể hỏi tôi về lịch uống thuốc, tủ thuốc, hay lịch tái khám của gia đình bạn.',
  },
];

const QUICK_PROMPTS = [
  'Hôm nay cần uống thuốc gì?',
  'Thuốc nào sắp hết hạn?',
  'Lịch tái khám tuần này?',
  'Tóm tắt sức khỏe gia đình',
];

const MOCK_REPLIES: Record<string, string> = {
  'Hôm nay cần uống thuốc gì?': 'Hôm nay gia đình bạn có 4 lần uống thuốc:\n• **8:00 SA** – Aspirin 100mg, Vitamin D3 (Bà Lan)\n• **11:30 SA** – Insulin Glargine (Bà Lan)\n• **20:00 TỐI** – Atorvastatin 20mg (Bà Lan), Metformin 500mg (Lan Anh)\n\nBạn có muốn đánh dấu đã uống không?',
  'Thuốc nào sắp hết hạn?': '⚠️ Phát hiện **2 loại thuốc** cần chú ý:\n\n1. **Augmentin 625mg** – còn 2 ngày (hết hạn 17/04/2025)\n2. **Amoxicillin 500mg** – còn 12 ngày (hết hạn 27/04/2025)\n\nBạn có muốn tôi nhắc nhở khi nào?',
  'Lịch tái khám tuần này?': '📅 Lịch tái khám trong tuần:\n\n• **24/04 – 8:30 SA** – Con Nam tái khám viêm mũi dị ứng tại Phòng khám Nhi Đồng 1\n\nTuần tới:\n• **30/04 – 14:00** – Bà Lan kiểm tra thị lực tại BV Mắt TP.HCM',
  'Tóm tắt sức khỏe gia đình': '🏥 **Tóm tắt sức khỏe gia đình:**\n\n👤 **Lan Anh** – Sức khỏe ổn định, đang dùng Metformin\n👴 **Bà Lan** – Cần theo dõi, có 1 thuốc hết hạn sắp tới\n👦 **Con Nam** – Có lịch tái khám ngày 24/04\n\nTổng: 5 lần uống thuốc hôm nay, 1 lịch khám tuần này.',
};

function getReply(input: string): string {
  const match = Object.keys(MOCK_REPLIES).find(k =>
    input.toLowerCase().includes(k.toLowerCase().substring(0, 12))
  );
  return match
    ? MOCK_REPLIES[match]
    : 'Tôi đã nhận được câu hỏi của bạn. Đây là trợ lý demo – trong phiên bản chính thức, tôi sẽ kết nối với dữ liệu sức khỏe thực của gia đình bạn để trả lời chính xác hơn.';
}

export default function AiChatbotScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getReply(trimmed),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, 1200);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.root}>
        <TopAppBar
          variant="detail"
          title="AI Cố vấn sức khỏe"
          rightAction={
            <TouchableOpacity
              onPress={() => navigation.navigate('VoiceAssistant')}
              style={styles.voiceBtn}
            >
              <Icon name="mic" size={22} color={colors.primary} />
            </TouchableOpacity>
          }
        />

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={[
            styles.messageContent,
            { paddingTop: TOP_BAR_HEIGHT + insets.top + 12 },
          ]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map(msg => (
            <View
              key={msg.id}
              style={[styles.bubbleRow, msg.role === 'user' ? styles.bubbleRowUser : styles.bubbleRowAI]}
            >
              {msg.role === 'assistant' && (
                <View style={styles.aiAvatar}>
                  <Icon name="smart_toy" size={16} color={colors.primary} />
                </View>
              )}
              <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
                <Text style={[styles.bubbleText, msg.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAI]}>
                  {msg.content}
                </Text>
              </View>
            </View>
          ))}
          {isTyping && (
            <View style={[styles.bubbleRow, styles.bubbleRowAI]}>
              <View style={styles.aiAvatar}>
                <Icon name="smart_toy" size={16} color={colors.primary} />
              </View>
              <View style={[styles.bubble, styles.bubbleAI]}>
                <Text style={styles.typingDots}>• • •</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick prompts */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickPromptsRow}
          style={styles.quickPromptsBar}
        >
          {QUICK_PROMPTS.map(p => (
            <TouchableOpacity
              key={p}
              style={styles.quickPromptChip}
              onPress={() => sendMessage(p)}
              activeOpacity={0.75}
            >
              <Text style={styles.quickPromptText} numberOfLines={1}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input bar */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Hỏi về sức khỏe gia đình..."
              placeholderTextColor={colors.onSurfaceVariant + '99'}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => sendMessage(input)}
              returnKeyType="send"
              multiline={false}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim()}
            activeOpacity={0.8}
          >
            <Icon name="send" size={20} color={input.trim() ? colors.onPrimary : colors.outlineVariant} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  voiceBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.primaryFixed, alignItems: 'center', justifyContent: 'center',
  },

  messageList: { flex: 1 },
  messageContent: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubbleRowAI: { justifyContent: 'flex-start' },
  aiAvatar: {
    width: 28, height: 28, borderRadius: 10,
    backgroundColor: colors.primaryFixed, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: { maxWidth: '75%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleAI: { backgroundColor: colors.surfaceContainerLowest, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, fontFamily: 'Inter', lineHeight: 20 },
  bubbleTextUser: { color: colors.onPrimary },
  bubbleTextAI: { color: colors.onSurface },
  typingDots: { fontSize: 18, color: colors.onSurfaceVariant, letterSpacing: 4 },

  quickPromptsBar: { flexShrink: 0, backgroundColor: colors.surface },
  quickPromptsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  quickPromptChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: colors.primaryFixed, borderRadius: 999,
  },
  quickPromptText: { fontSize: 12, fontFamily: 'Inter', fontWeight: '600', color: colors.primary },

  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingTop: 8,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.outlineVariant,
  },
  inputWrap: {
    flex: 1, height: 48, borderRadius: 24,
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 16, justifyContent: 'center',
  },
  input: { fontSize: 14, fontFamily: 'Inter', color: colors.onSurface },
  sendBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.surfaceContainerHigh },
});
