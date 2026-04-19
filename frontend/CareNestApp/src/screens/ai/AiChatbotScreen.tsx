import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';

interface MedicineData {
  name: string;
  dosage: string;
  icon?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  type?: 'text' | 'medicine_card';
  medicines?: MedicineData[];
}

const QUICK_PROMPTS = [
  'Hôm nay cần uống thuốc gì?',
  'Thuốc nào sắp hết hạn?',
  'Tóm tắt sức khỏe của gia đình',
];



const MedicineCard = ({ item }: { item: MedicineData }) => (
  <View style={styles.medicineCard}>
    <View style={styles.medIconWrap}>
      <MaterialCommunityIcons name={item.icon || 'pill'} size={20} color={colors.primary} />
    </View>
    <View style={styles.medContent}>
      <Text style={styles.medName}>{item.name}</Text>
      <Text style={styles.medDosage}>{item.dosage}</Text>
    </View>
  </View>
);

export default function AiChatbotScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Giả lập phản hồi từ AI
    setTimeout(() => {
      let reply: Partial<Message> = {
        content: 'Tôi đã nhận được câu hỏi. Đây là mẫu phản hồi từ CareNest AI.',
      };

      if (text.includes('thuốc')) {
        reply = {
          content: 'Dạ, đây là danh sách thuốc bà Lan cần uống vào buổi chiều (14:00 - 16:00):',
          type: 'medicine_card',
          medicines: [
            { name: 'Amlodipine 5mg', dosage: '1 viên - Sau ăn 30p', icon: 'pill' },
            { name: 'Vitamin B12', dosage: '1 viên - Uống nhiều nước', icon: 'help-circle-outline' },
          ],
        };
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply.content || '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: reply.type || 'text',
        medicines: reply.medicines,
      };

      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, 1500);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <View style={[styles.root, { backgroundColor: '#fff' }]}>
      {/* Header */}
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(msg => (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                msg.role === 'user' ? styles.rowUser : styles.rowAI
              ]}
            >
              {msg.role === 'assistant' && (
                <View style={styles.aiAvatarSmall}>
                  <MaterialCommunityIcons name="robot" size={16} color="#fff" />
                </View>
              )}
              <View style={[
                styles.bubble,
                msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI
              ]}>
                <Text style={[
                  styles.bubbleText,
                  msg.role === 'user' ? styles.textUser : styles.textAI
                ]}>
                  {msg.content}
                </Text>
                {msg.type === 'medicine_card' && msg.medicines && (
                  <View style={styles.medList}>
                    {msg.medicines.map((med, idx) => (
                      <MedicineCard key={idx} item={med} />
                    ))}
                    <Text style={[styles.bubbleText, styles.textAI, { marginTop: 12 }]}>
                      Tôi sẽ gửi thông báo nhắc nhở vào điện thoại của bạn và máy tính bảng của bà lúc 14:00 nhé.
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.timestamp}>
                {msg.timestamp}
              </Text>
            </View>
          ))}

          {isTyping && (
            <View style={[styles.messageRow, styles.rowAI]}>
              <View style={styles.aiAvatarSmall}>
                <MaterialCommunityIcons name="robot" size={16} color="#fff" />
              </View>
              <View style={[styles.bubble, styles.bubbleAI]}>
                <Text style={styles.typingDots}>• • •</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggestion Section */}
        <View style={styles.suggestionSection}>
          <Text style={styles.suggestionLabel}>GỢI Ý CÂU HỎI</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionList}
          >
            {QUICK_PROMPTS.map((prompt, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.suggestionChip}
                onPress={() => sendMessage(prompt)}
              >
                <Text style={styles.suggestionText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input Bar */}
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.inputBar}>
            <TouchableOpacity style={styles.inputActionBtn}>
              <MaterialCommunityIcons name="plus" size={24} color={colors.outline} />
            </TouchableOpacity>
            
            <TextInput
              style={styles.input}
              placeholder="Hỏi tôi về sức khỏe..."
              placeholderTextColor={colors.outline}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => sendMessage(input)}
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
            onPress={() => sendMessage(input)}
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
  
  messageRow: {
    marginBottom: 24,
    position: 'relative',
  },
  rowAI: {
    alignItems: 'flex-start',
    paddingLeft: 42,
  },
  rowUser: {
    alignItems: 'flex-end',
  },
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
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: '85%',
  },
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
  bubbleText: {
    fontSize: 15,
    fontFamily: 'Inter',
    lineHeight: 22,
  },
  textAI: { color: '#334155' },
  textUser: { color: '#fff' },
  
  timestamp: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 6,
  },

  typingDots: {
    fontSize: 18,
    color: '#94a3b8',
    letterSpacing: 4,
  },

  medList: {
    marginTop: 16,
    gap: 10,
  },
  medicineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  medIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ffe8ec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medContent: { flex: 1 },
  medName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  medDosage: { fontSize: 12, color: '#64748b', marginTop: 2 },

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
  input: { flex: 1, fontSize: 15, color: '#1e293b', paddingHorizontal: 4 },
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
