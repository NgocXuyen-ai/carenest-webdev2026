import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Markdown from 'react-native-markdown-display';
import { colors } from '../../theme/colors';
import { CARENEST_LOGO_HOUSE } from '../../assets/branding';
import { chatAi, voiceChat, speakText } from '../../api/ai';
import { useFamily } from '../../context/FamilyContext';
import { useAuth } from '../../context/AuthContext';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useAudioPlayback } from '../../hooks/useAudioPlayback';
import { normalizeUploadUri } from '../../utils/uploadUri';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  audioBase64?: string;
}

const QUICK_PROMPTS = [
  'Hôm nay cần uống thuốc gì?',
  'Thuốc nào sắp hết hạn?',
  'Tóm tắt sức khỏe của gia đình',
];

function normalizeMarkdown(content: string): string {
  return content.replace(/\r\n/g, '\n').replace(/\\n/g, '\n').trim();
}

interface MessageBubbleProps {
  message: Message;
  isSpeaking: boolean;
  isTtsLoading: boolean;
  onSpeak: (messageId: string, text: string, audioBase64?: string) => void;
}

const MessageBubble = memo(function MessageBubble({
  message,
  isSpeaking,
  isTtsLoading,
  onSpeak,
}: MessageBubbleProps) {
  const normalizedContent = useMemo(() => normalizeMarkdown(message.content), [message.content]);
  const isAssistant = message.role === 'assistant';

  return (
    <View style={[styles.messageRow, isAssistant ? styles.rowAI : styles.rowUser]}>
      {isAssistant ? (
        <View style={styles.aiAvatarSmall}>
          <Image source={CARENEST_LOGO_HOUSE} style={styles.aiAvatarIconSmall} resizeMode="contain" />
        </View>
      ) : null}

      <View style={styles.bubbleGroup}>
        <View style={[styles.bubble, isAssistant ? styles.bubbleAI : styles.bubbleUser]}>
          {isAssistant ? (
            <Markdown style={markdownStyles}>{normalizedContent}</Markdown>
          ) : (
            <Text style={[styles.bubbleText, styles.textUser]}>{message.content}</Text>
          )}
        </View>

        {isAssistant ? (
          <TouchableOpacity
            style={styles.speakBtn}
            onPress={() => onSpeak(message.id, message.content, message.audioBase64)}
            disabled={isTtsLoading}
          >
            <MaterialCommunityIcons
              name={isTtsLoading ? 'timer-sand' : isSpeaking ? 'volume-high' : 'volume-medium'}
              size={16}
              color={isSpeaking ? '#1a73e8' : '#94a3b8'}
            />
          </TouchableOpacity>
        ) : null}

        <Text style={[styles.timestamp, isAssistant ? styles.timestampAI : styles.timestampUser]}>
          {message.timestamp}
        </Text>
      </View>
    </View>
  );
});

const TypingIndicator = memo(function TypingIndicator() {
  const progress = useRef(new Animated.Value(0)).current;

  const dotConfigs = useMemo(() => [0.06, 0.26, 0.46].map(offset => ({
    opacity: progress.interpolate({
      inputRange: [0, offset, offset + 0.12, offset + 0.24, 1],
      outputRange: [0.45, 0.45, 1, 0.45, 0.45],
    }),
    translateY: progress.interpolate({
      inputRange: [0, offset, offset + 0.12, offset + 0.24, 1],
      outputRange: [0, 0, -3, 0, 0],
    }),
    scale: progress.interpolate({
      inputRange: [0, offset, offset + 0.12, offset + 0.24, 1],
      outputRange: [1, 1, 1.2, 1, 1],
    }),
  })), [progress]);

  useEffect(() => {
    progress.setValue(0);
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => {
      loop.stop();
      progress.stopAnimation();
      progress.setValue(0);
    };
  }, [progress]);

  return (
    <View style={styles.typingDotsWrap}>
      {dotConfigs.map((dot, index) => (
        <Animated.View
          key={`typing-dot-${index}`}
          style={[
            styles.typingDot,
            {
              opacity: dot.opacity,
              transform: [{ translateY: dot.translateY }, { scale: dot.scale }],
            },
          ]}
        />
      ))}
    </View>
  );
});

export default function AiChatbotScreen() {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Message>>(null);
  const { selectedProfileId } = useFamily();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [ttsLoadingId, setTtsLoadingId] = useState<string | null>(null);

  const { isRecording, startRecording, stopRecording } = useAudioRecorder();
  const { isPlaying, playBase64, stopPlayback } = useAudioPlayback();

  const shouldShowSuggestions = messages.length === 0 && !isRecording;
  const activeProfileId = selectedProfileId || (user?.profileId ? Number(user.profileId) : null);

  // Pulse animation cho mic button khi đang ghi âm
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isRecording) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.35, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  // Xoá speakingMessageId khi audio dừng
  useEffect(() => {
    if (!isPlaying) {
      setSpeakingMessageId(null);
    }
  }, [isPlaying]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages.length, isTyping]);

  const sendMessage = useCallback(async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isTyping) {
      return;
    }

    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: ts,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

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
      Alert.alert(
        'AI chưa phản hồi được',
        error instanceof Error ? error.message : 'Đã có lỗi xảy ra',
      );
    } finally {
      setIsTyping(false);
    }
  }, [activeProfileId, conversationId, isTyping]);

  const handleMicPress = useCallback(async () => {
    if (isTyping) {
      return;
    }

    try {
      if (!isRecording) {
        await startRecording();
        return;
      }

      // Đang ghi âm → dừng và gửi
      const recordedPath = await stopRecording();
      if (!recordedPath) {
        throw new Error('Không tìm thấy file ghi âm.');
      }

      setIsTyping(true);

      const formData = new FormData();
      formData.append('audio', {
        uri: normalizeUploadUri(recordedPath),
        type: 'audio/mp4',
        name: `voice-${Date.now()}.m4a`,
      } as any);
      if (activeProfileId) {
        formData.append('profileId', String(activeProfileId));
      }
      if (conversationId) {
        formData.append('conversationId', String(conversationId));
      }

      const response = await voiceChat(formData);

      const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const now = Date.now();
      const userVoiceId = `user-voice-${now}`;
      const aiVoiceId = `assistant-voice-${now}`;

      setConversationId(response.conversation_id);
      setMessages(prev => [
        ...prev,
        {
          id: userVoiceId,
          role: 'user',
          content: response.transcribed_text || '(giọng nói)',
          timestamp: ts,
        },
        {
          id: aiVoiceId,
          role: 'assistant',
          content: response.reply_text || '',
          timestamp: ts,
          audioBase64: response.audio_base64 || undefined,
        },
      ]);

      // Tự phát audio phản hồi
      if (response.audio_base64) {
        setSpeakingMessageId(aiVoiceId);
        await playBase64(response.audio_base64);
      }
    } catch (error) {
      Alert.alert(
        'Không xử lý được giọng nói',
        error instanceof Error ? error.message : 'Đã có lỗi xảy ra',
      );
    } finally {
      setIsTyping(false);
    }
  }, [activeProfileId, conversationId, isRecording, isTyping, playBase64, startRecording, stopRecording]);

  const handleSpeak = useCallback(async (messageId: string, text: string, audioBase64?: string) => {
    // Nếu đang phát message này → dừng
    if (speakingMessageId === messageId) {
      await stopPlayback();
      setSpeakingMessageId(null);
      return;
    }

    // Dừng audio đang phát (nếu có)
    if (isPlaying) {
      await stopPlayback();
    }

    setSpeakingMessageId(messageId);

    try {
      // Nếu message đã có audio từ voice chat → phát luôn
      if (audioBase64) {
        await playBase64(audioBase64);
        return;
      }

      // Gọi TTS endpoint để tổng hợp giọng
      setTtsLoadingId(messageId);
      const base64Audio = await speakText(text);
      setTtsLoadingId(null);
      await playBase64(base64Audio);
    } catch (error) {
      setTtsLoadingId(null);
      setSpeakingMessageId(null);
      Alert.alert(
        'Không thể đọc phản hồi',
        error instanceof Error ? error.message : 'Đã có lỗi xảy ra',
      );
    }
  }, [isPlaying, playBase64, speakingMessageId, stopPlayback]);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => (
      <MessageBubble
        message={item}
        isSpeaking={speakingMessageId === item.id}
        isTtsLoading={ttsLoadingId === item.id}
        onSpeak={handleSpeak}
      />
    ),
    [handleSpeak, speakingMessageId, ttsLoadingId],
  );

  return (
    <View style={[styles.root, { backgroundColor: '#fff' }]}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarCircle}>
              <Image source={CARENEST_LOGO_HOUSE} style={styles.aiAvatarIconLarge} resizeMode="contain" />
            </View>
            <View>
              <Text style={styles.headerTitle}>CareNest AI</Text>
              <View style={styles.onlineStatus}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>ONLINE</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={listRef}
          style={styles.chatArea}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={16}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Image source={CARENEST_LOGO_HOUSE} style={styles.emptyBrandIcon} resizeMode="contain" />
              <Text style={styles.emptyTitle}>Hỏi CareNest AI</Text>
              <Text style={styles.emptyText}>
                Bạn có thể hỏi về thuốc hôm nay, lịch hẹn sắp tới, tiêm chủng hoặc thông tin
                sức khỏe của gia đình.
              </Text>
            </View>
          }
          ListFooterComponent={
            isTyping ? (
              <View style={[styles.messageRow, styles.rowAI]}>
                <View style={styles.aiAvatarSmall}>
                  <Image source={CARENEST_LOGO_HOUSE} style={styles.aiAvatarIconSmall} resizeMode="contain" />
                </View>
                <View style={[styles.bubble, styles.bubbleAI]}>
                  <TypingIndicator />
                </View>
              </View>
            ) : null
          }
        />

        {shouldShowSuggestions ? (
          <View style={styles.suggestionSection}>
            <Text style={styles.suggestionLabel}>GỢI Ý CÂU HỎI</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionList}
            >
              {QUICK_PROMPTS.map(prompt => (
                <TouchableOpacity
                  key={prompt}
                  style={styles.suggestionChip}
                  onPress={() => void sendMessage(prompt)}
                >
                  <Text style={styles.suggestionText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={[styles.inputBar, isRecording && styles.inputBarRecording]}>
            <TextInput
              style={styles.input}
              placeholder={isRecording ? 'Đang ghi âm...' : 'Hỏi tôi về sức khỏe...'}
              placeholderTextColor={isRecording ? '#e74c3c' : colors.outline}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => void sendMessage(input)}
              editable={!isRecording}
            />

            {/* Mic button với pulse animation */}
            <TouchableOpacity
              style={[styles.micBtn, isRecording && styles.micBtnRecording]}
              onPress={() => void handleMicPress()}
              disabled={isTyping}
            >
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <MaterialCommunityIcons
                  name={isRecording ? 'stop' : 'microphone'}
                  size={20}
                  color={isRecording ? '#fff' : colors.outline}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isRecording) && styles.sendBtnDisabled]}
            onPress={() => void sendMessage(input)}
            disabled={!input.trim() || isRecording}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAvatarIconLarge: { width: 26, height: 26 },
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
  emptyBrandIcon: { width: 54, height: 54, opacity: 0.75 },
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAvatarIconSmall: { width: 16, height: 16 },
  bubbleGroup: {
    maxWidth: '85%',
    alignItems: 'flex-start',
  },
  bubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
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
  textUser: { color: '#fff' },
  speakBtn: {
    marginTop: 4,
    marginLeft: 4,
    padding: 4,
  },
  timestamp: { fontSize: 10, color: '#94a3b8', marginTop: 4 },
  timestampAI: { marginLeft: 2 },
  timestampUser: { alignSelf: 'flex-end' },
  typingDotsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 34,
    paddingVertical: 2,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
    backgroundColor: '#94a3b8',
  },
  suggestionSection: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  suggestionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  suggestionList: { paddingHorizontal: 16, gap: 10 },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  suggestionText: { fontSize: 12, color: '#1a73e8', fontWeight: '500' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  inputBar: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 23,
    paddingHorizontal: 8,
  },
  inputBarRecording: {
    backgroundColor: '#fff0f0',
    borderWidth: 1.5,
    borderColor: '#e74c3c',
  },
  micBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
  },
  micBtnRecording: {
    backgroundColor: '#e74c3c',
  },
  input: { flex: 1, fontSize: 14, color: '#1e293b', paddingHorizontal: 8 },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
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
