import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { TOP_BAR_HEIGHT, BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import Icon from '../../components/common/Icon';
import TopAppBar from '../../components/layout/TopAppBar';
import Input from '../../components/common/Input';

type OcrState = 'idle' | 'scanning' | 'result';

const MOCK_OCR_RESULT = {
  medicineName: 'Amoxicillin 500mg',
  dosage: '1 viên × 3 lần/ngày',
  instruction: 'Uống sau ăn no',
  duration: '7 ngày',
};

export default function OcrScannerScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [ocrState, setOcrState] = useState<OcrState>('idle');
  const [editedResult, setEditedResult] = useState(MOCK_OCR_RESULT);

  function handleScan() {
    setOcrState('scanning');
    setTimeout(() => {
      setOcrState('result');
      setEditedResult(MOCK_OCR_RESULT);
    }, 1800);
  }

  return (
    <View style={styles.root}>
      <TopAppBar variant="detail" title="Quét toa thuốc OCR" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: TOP_BAR_HEIGHT + insets.top + 16, paddingBottom: BOTTOM_NAV_HEIGHT + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Camera preview area */}
        <View style={styles.cameraBox}>
          {ocrState === 'scanning' ? (
            <View style={styles.scanningOverlay}>
              <View style={styles.scanLine} />
              <Text style={styles.scanningText}>Đang nhận diện...</Text>
            </View>
          ) : ocrState === 'result' ? (
            <View style={styles.resultPreview}>
              <Icon name="check_circle" size={48} color="#2E7D32" />
              <Text style={styles.resultPreviewText}>Nhận diện thành công!</Text>
            </View>
          ) : (
            <View style={styles.idleOverlay}>
              <View style={styles.scanFrame} />
              <Icon name="document_scanner" size={40} color="rgba(255,255,255,0.7)" />
              <Text style={styles.idleText}>Đặt toa thuốc vào khung</Text>
            </View>
          )}
        </View>

        {/* Scan button */}
        {ocrState === 'idle' && (
          <TouchableOpacity style={styles.scanBtn} onPress={handleScan} activeOpacity={0.85}>
            <Icon name="camera" size={22} color={colors.onPrimary} />
            <Text style={styles.scanBtnText}>Chụp toa thuốc</Text>
          </TouchableOpacity>
        )}

        {/* OCR result editing */}
        {ocrState === 'result' && (
          <>
            <View style={styles.resultHeader}>
              <Icon name="auto_awesome" size={18} color={colors.primary} />
              <Text style={styles.resultHeaderText}>Kết quả nhận diện – kiểm tra và chỉnh sửa</Text>
            </View>
            <View style={[styles.card, shadows.sm]}>
              <Input
                label="Tên thuốc"
                value={editedResult.medicineName}
                onChangeText={v => setEditedResult(p => ({ ...p, medicineName: v }))}
                leftIcon={<Icon name="pill" size={18} color={colors.outline} />}
              />
              <Input
                label="Liều dùng"
                value={editedResult.dosage}
                onChangeText={v => setEditedResult(p => ({ ...p, dosage: v }))}
                leftIcon={<Icon name="medication" size={18} color={colors.outline} />}
              />
              <Input
                label="Hướng dẫn"
                value={editedResult.instruction}
                onChangeText={v => setEditedResult(p => ({ ...p, instruction: v }))}
                leftIcon={<Icon name="info" size={18} color={colors.outline} />}
              />
              <Input
                label="Thời gian điều trị"
                value={editedResult.duration}
                onChangeText={v => setEditedResult(p => ({ ...p, duration: v }))}
                leftIcon={<Icon name="schedule" size={18} color={colors.outline} />}
              />
            </View>
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.85}
            >
              <Icon name="check" size={20} color={colors.onPrimary} />
              <Text style={styles.submitBtnText}>Xác nhận và lưu lịch uống thuốc</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rescanBtn}
              onPress={() => setOcrState('idle')}
              activeOpacity={0.8}
            >
              <Icon name="refresh" size={16} color={colors.primary} />
              <Text style={styles.rescanBtnText}>Quét lại</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 16, gap: 16 },

  cameraBox: {
    height: 240, borderRadius: 20,
    backgroundColor: '#1a1a2e',
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  idleOverlay: { alignItems: 'center', gap: 12 },
  scanFrame: {
    width: 180, height: 120, borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 8, marginBottom: 8,
  },
  idleText: { fontSize: 13, fontFamily: 'Inter', color: 'rgba(255,255,255,0.7)' },
  scanningOverlay: { alignItems: 'center', gap: 16, width: '100%' },
  scanLine: {
    position: 'absolute', top: 80, left: 20, right: 20,
    height: 2, backgroundColor: colors.primary,
    opacity: 0.9,
  },
  scanningText: { fontSize: 14, fontFamily: 'Inter', fontWeight: '600', color: '#fff', marginTop: 100 },
  resultPreview: { alignItems: 'center', gap: 10 },
  resultPreviewText: { fontSize: 16, fontFamily: 'Manrope', fontWeight: '700', color: '#fff' },

  scanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 52, backgroundColor: colors.primary, borderRadius: 999, gap: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  scanBtnText: { fontSize: 16, fontFamily: 'Inter', fontWeight: '700', color: colors.onPrimary },

  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultHeaderText: { fontSize: 13, fontFamily: 'Inter', fontWeight: '600', color: colors.primary, flex: 1 },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 16, gap: 12 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 52, backgroundColor: colors.primary, borderRadius: 999, gap: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  submitBtnText: { fontSize: 15, fontFamily: 'Inter', fontWeight: '700', color: colors.onPrimary },
  rescanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 44, gap: 6,
  },
  rescanBtnText: { fontSize: 14, fontFamily: 'Inter', fontWeight: '600', color: colors.primary },
});
