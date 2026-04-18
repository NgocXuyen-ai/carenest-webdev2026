import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { TOP_BAR_HEIGHT } from '../../utils/constants';
import Icon from '../../components/common/Icon';
import TopAppBar from '../../components/layout/TopAppBar';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

const STATE_CONFIG: Record<VoiceState, { label: string; subLabel: string; iconColor: string; ringColor: string }> = {
  idle:       { label: 'Nhấn để nói',     subLabel: 'Hỏi về sức khỏe gia đình',      iconColor: colors.primary,        ringColor: colors.primaryFixed },
  listening:  { label: 'Đang nghe...',    subLabel: 'Đang ghi âm giọng nói của bạn', iconColor: '#fff',                 ringColor: colors.primary + '40' },
  processing: { label: 'Đang xử lý...',   subLabel: 'AI đang phân tích câu hỏi',     iconColor: colors.primary,        ringColor: colors.primaryFixed },
  speaking:   { label: 'Đang phát âm...', subLabel: 'Nhấn để dừng',                  iconColor: '#2E7D32',              ringColor: '#E8F5E9' },
};

const EXAMPLE_Q = 'Hôm nay bà Lan cần uống thuốc gì?';
const EXAMPLE_A = 'Hôm nay bà Lan cần uống 3 loại thuốc: Aspirin lúc 8 giờ sáng, Insulin lúc 11 giờ 30 trưa, và Atorvastatin lúc 8 giờ tối. Aspirin và Insulin chưa uống, bạn có muốn tôi nhắc nhở không?';

export default function VoiceAssistantScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');

  function handleMicPress() {
    if (voiceState === 'idle') {
      setTranscript('');
      setResponse('');
      setVoiceState('listening');
      setTimeout(() => {
        setTranscript(EXAMPLE_Q);
        setVoiceState('processing');
        setTimeout(() => {
          setResponse(EXAMPLE_A);
          setVoiceState('speaking');
          setTimeout(() => setVoiceState('idle'), 4000);
        }, 1500);
      }, 2000);
    } else if (voiceState === 'speaking') {
      setVoiceState('idle');
    }
  }

  const cfg = STATE_CONFIG[voiceState];

  return (
    <View style={styles.root}>
      <TopAppBar variant="detail" title="Trợ lý giọng nói" />
      <View style={[styles.content, { paddingTop: TOP_BAR_HEIGHT + insets.top, paddingBottom: insets.bottom + 32 }]}>

        {/* Transcript / response area */}
        <View style={styles.dialogArea}>
          {transcript ? (
            <View style={styles.transcriptBox}>
              <Icon name="mic" size={14} color={colors.onSurfaceVariant} />
              <Text style={styles.transcriptText}>"{transcript}"</Text>
            </View>
          ) : (
            <View style={styles.emptyDialog}>
              <Icon name="mic" size={32} color={colors.outlineVariant} />
              <Text style={styles.emptyDialogText}>Câu hỏi của bạn sẽ hiện ở đây</Text>
            </View>
          )}
          {response ? (
            <View style={styles.responseBox}>
              <View style={styles.responseHeader}>
                <Icon name="smart_toy" size={16} color={colors.primary} />
                <Text style={styles.responseHeaderText}>AI CareNest</Text>
                {voiceState === 'speaking' && (
                  <View style={styles.speakingBadge}>
                    <Text style={styles.speakingBadgeText}>Đang đọc</Text>
                  </View>
                )}
              </View>
              <Text style={styles.responseText}>{response}</Text>
            </View>
          ) : null}
        </View>

        {/* Status label */}
        <View style={styles.statusArea}>
          <Text style={styles.statusLabel}>{cfg.label}</Text>
          <Text style={styles.statusSubLabel}>{cfg.subLabel}</Text>
        </View>

        {/* Mic button */}
        <View style={styles.micArea}>
          <View style={[styles.micRing, { backgroundColor: cfg.ringColor }]}>
            <TouchableOpacity
              style={[
                styles.micBtn,
                voiceState === 'listening' && styles.micBtnListening,
              ]}
              onPress={handleMicPress}
              activeOpacity={0.85}
            >
              <Icon
                name={voiceState === 'speaking' ? 'stop' : 'mic'}
                size={36}
                color={voiceState === 'listening' ? '#fff' : cfg.iconColor}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Example prompts */}
        {voiceState === 'idle' && (
          <View style={styles.examplesArea}>
            <Text style={styles.examplesLabel}>Thử hỏi:</Text>
            {['Hôm nay ai cần uống thuốc?', 'Thuốc nào sắp hết hạn?', 'Tái khám tuần này có lịch gì?'].map(q => (
              <TouchableOpacity key={q} style={styles.exampleChip} onPress={() => {}} activeOpacity={0.75}>
                <Icon name="mic_none" size={14} color={colors.primary} />
                <Text style={styles.exampleText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { flex: 1, paddingHorizontal: 20 },

  dialogArea: { flex: 1, justifyContent: 'flex-end', paddingBottom: 24, gap: 12 },
  emptyDialog: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyDialogText: { fontSize: 14, fontFamily: 'Inter', color: colors.onSurfaceVariant },
  transcriptBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: colors.surfaceContainerHigh, borderRadius: 14, padding: 14,
  },
  transcriptText: { flex: 1, fontSize: 14, fontFamily: 'Inter', color: colors.onSurfaceVariant, fontStyle: 'italic' },
  responseBox: {
    backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 14,
    borderLeftWidth: 3, borderLeftColor: colors.primary,
  },
  responseHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  responseHeaderText: { flex: 1, fontSize: 12, fontFamily: 'Inter', fontWeight: '700', color: colors.primary },
  speakingBadge: { backgroundColor: colors.primaryFixed, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  speakingBadgeText: { fontSize: 10, fontFamily: 'Inter', fontWeight: '700', color: colors.primary },
  responseText: { fontSize: 14, fontFamily: 'Inter', color: colors.onSurface, lineHeight: 22 },

  statusArea: { alignItems: 'center', marginBottom: 24, gap: 4 },
  statusLabel: { fontSize: 18, fontFamily: 'Manrope', fontWeight: '800', color: colors.onSurface },
  statusSubLabel: { fontSize: 13, fontFamily: 'Inter', color: colors.onSurfaceVariant },

  micArea: { alignItems: 'center', marginBottom: 32 },
  micRing: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
  },
  micBtn: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.onSurface, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8,
  },
  micBtnListening: { backgroundColor: colors.primary },

  examplesArea: { gap: 8 },
  examplesLabel: { fontSize: 12, fontFamily: 'Inter', fontWeight: '700', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8 },
  exampleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primaryFixed, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
  },
  exampleText: { fontSize: 13, fontFamily: 'Inter', fontWeight: '500', color: colors.primary, flex: 1 },
});
