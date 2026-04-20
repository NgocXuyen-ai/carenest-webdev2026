import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CARENEST_LOGO_HOUSE } from '../../assets/branding';
import Icon from '../../components/common/Icon';
import { voiceChat } from '../../api/ai';
import { useFamily } from '../../context/FamilyContext';
import { useAuth } from '../../context/AuthContext';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useAudioPlayback } from '../../hooks/useAudioPlayback';

function toUploadUri(path: string): string {
  if (path.startsWith('file://')) {
    return path;
  }
  return `file://${path}`;
}

export default function VoiceAssistantScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { selectedProfileId } = useFamily();
  const { user } = useAuth();
  const { isRecording, startRecording, stopRecording } = useAudioRecorder();
  const { isPlaying, playBase64, stopPlayback } = useAudioPlayback();

  const [transcript, setTranscript] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyAudioBase64, setReplyAudioBase64] = useState('');
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const activeProfileId = selectedProfileId || (user?.profileId ? Number(user.profileId) : null);

  const statusLabel = useMemo(() => {
    if (loading) {
      return 'ĐANG XỬ LÝ VOICE';
    }
    if (isRecording) {
      return 'ĐANG GHI ÂM';
    }
    if (isPlaying) {
      return 'ĐANG PHÁT PHẢN HỒI';
    }
    return 'TRỢ LÝ GIỌNG NÓI SẴN SÀNG';
  }, [isPlaying, isRecording, loading]);

  const submitVoice = useCallback(async (audioPath: string) => {
    const formData = new FormData();
    formData.append('audio', {
      uri: toUploadUri(audioPath),
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
    setTranscript(response.transcribed_text || '');
    setReplyText(response.reply_text || '');
    setReplyAudioBase64(response.audio_base64 || '');
    if (response.conversation_id) {
      setConversationId(response.conversation_id);
    }

    if (response.audio_base64) {
      await playBase64(response.audio_base64);
    }
  }, [activeProfileId, conversationId, playBase64]);

  const handlePrimaryAction = useCallback(async () => {
    if (loading) {
      return;
    }

    try {
      if (!isRecording) {
        setReplyText('');
        setTranscript('');
        setReplyAudioBase64('');
        await startRecording();
        return;
      }

      const recordedPath = await stopRecording();
      if (!recordedPath) {
        throw new Error('Không tìm thấy file ghi âm để gửi đi.');
      }

      setLoading(true);
      await submitVoice(recordedPath);
    } catch (error) {
      Alert.alert(
        'Không thể xử lý trợ lý giọng nói',
        error instanceof Error ? error.message : 'Đã có lỗi xảy ra',
      );
    } finally {
      setLoading(false);
    }
  }, [isRecording, loading, startRecording, stopRecording, submitVoice]);

  const handleReplay = useCallback(async () => {
    if (!replyAudioBase64 || loading) {
      return;
    }

    try {
      await playBase64(replyAudioBase64);
    } catch (error) {
      Alert.alert(
        'Không thể phát lại audio',
        error instanceof Error ? error.message : 'Đã có lỗi xảy ra',
      );
    }
  }, [loading, playBase64, replyAudioBase64]);

  const handleStopPlayback = useCallback(async () => {
    try {
      await stopPlayback();
    } catch {
      // ignore stop errors
    }
  }, [stopPlayback]);

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Icon name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={[styles.mainMic, isRecording && styles.mainMicActive]}>
          <Icon name={isRecording ? 'graphic_eq' : 'mic'} size={40} color="#fff" />
        </View>

        <Text style={styles.badgeText}>{statusLabel}</Text>
        <Text style={styles.caption}>
          Bấm vào nút bên dưới để bắt đầu ghi âm. Bấm lần nữa để gửi audio đến CareNest AI.
        </Text>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={() => void handlePrimaryAction()}
          disabled={loading}
        >
          <Text style={styles.submitText}>
            {loading ? 'Đang xử lý...' : isRecording ? 'Dừng và gửi voice' : 'Bắt đầu ghi âm'}
          </Text>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.loadingText}>Đang xử lý voice request...</Text>
          </View>
        ) : null}

        {isPlaying ? (
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => void handleStopPlayback()}>
            <Text style={styles.secondaryBtnText}>Dừng phát audio</Text>
          </TouchableOpacity>
        ) : null}

        {replyAudioBase64 ? (
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => void handleReplay()}>
            <Text style={styles.secondaryBtnText}>Phát lại phản hồi</Text>
          </TouchableOpacity>
        ) : null}

        {transcript ? (
          <View style={styles.transcriptCard}>
            <Text style={styles.cardLabel}>TRANSCRIPT</Text>
            <Text style={styles.cardText}>{transcript}</Text>
          </View>
        ) : null}

        {replyText ? (
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <View style={styles.aiAvatar}>
                <Image source={CARENEST_LOGO_HOUSE} style={styles.aiAvatarIcon} resizeMode="contain" />
              </View>
              <Text style={styles.aiName}>AI Care Assistant</Text>
            </View>
            <Text style={styles.aiText}>{replyText}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f131a' },
  header: { height: 60, alignItems: 'flex-end', paddingHorizontal: 24, justifyContent: 'center' },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 24, gap: 18 },
  mainMic: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  mainMicActive: { backgroundColor: '#e74c3c' },
  badgeText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1.2 },
  caption: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  submitBtn: {
    width: '100%',
    height: 54,
    borderRadius: 20,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  loadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  secondaryBtn: {
    width: '100%',
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  secondaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  transcriptCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  cardText: { color: '#fff', fontSize: 15, lineHeight: 22 },
  aiCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAvatarIcon: { width: 20, height: 20 },
  aiName: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '700' },
  aiText: { color: 'rgba(255,255,255,0.85)', fontSize: 16, lineHeight: 24, fontFamily: 'Inter' },
});
