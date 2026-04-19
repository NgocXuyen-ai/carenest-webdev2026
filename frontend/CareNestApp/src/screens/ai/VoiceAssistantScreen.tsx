import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from '../../components/common/Icon';
import { chatAi } from '../../api/ai';
import { useFamily } from '../../context/FamilyContext';
import { useAuth } from '../../context/AuthContext';

export default function VoiceAssistantScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { selectedProfileId } = useFamily();
  const { user } = useAuth();
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const activeProfileId = selectedProfileId || (user?.profileId ? Number(user.profileId) : null);

  async function handleSubmit() {
    if (!transcript.trim() || loading) {
      return;
    }

    try {
      setLoading(true);
      const reply = await chatAi({
        message: transcript,
        profileId: activeProfileId,
      });
      setResponse(reply.reply);
    } catch (error) {
      Alert.alert(
        'Không thể xử lý trợ lý giọng nói',
        error instanceof Error ? error.message : 'Đã có lỗi xảy ra',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Icon name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.mainMic}>
          <Icon name="mic" size={40} color="#fff" />
        </View>

        <Text style={styles.badgeText}>VOICE FALLBACK MODE</Text>
        <Text style={styles.caption}>
          Repo hiện chưa có native audio recorder. Màn này vẫn cho phép thử luồng hỏi đáp AI
          bằng transcript văn bản để tránh để lộ một flow ghi âm giả chưa hoàn thiện.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nhập câu nói muốn hỏi CareNest AI..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={transcript}
          onChangeText={setTranscript}
          multiline
        />

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={() => void handleSubmit()}
          disabled={loading}
        >
          <Text style={styles.submitText}>{loading ? 'Đang xử lý...' : 'Gửi đến trợ lý'}</Text>
        </TouchableOpacity>

        {response ? (
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <View style={styles.aiAvatar}>
                <Icon name="smart_toy" size={20} color="#fff" />
              </View>
              <Text style={styles.aiName}>AI Care Assistant</Text>
            </View>
            <Text style={styles.aiText}>{response}</Text>
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
  badgeText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1.2 },
  caption: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  input: {
    width: '100%',
    minHeight: 120,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    color: '#fff',
    textAlignVertical: 'top',
  },
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
    backgroundColor: '#1a73e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiName: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '700' },
  aiText: { color: 'rgba(255,255,255,0.85)', fontSize: 16, lineHeight: 24, fontFamily: 'Inter' },
});
