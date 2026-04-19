import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary, type Asset } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { TOP_BAR_HEIGHT, BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import Icon from '../../components/common/Icon';
import TopAppBar from '../../components/layout/TopAppBar';
import Input from '../../components/common/Input';
import { confirmOcr, submitOcr } from '../../api/ai';
import { useFamily } from '../../context/FamilyContext';
import { useAuth } from '../../context/AuthContext';

type OcrState = 'idle' | 'scanning' | 'result';

type EditableMedicine = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  note: string;
};

export default function OcrScannerScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { selectedProfileId } = useFamily();
  const { user } = useAuth();
  const [ocrState, setOcrState] = useState<OcrState>('idle');
  const [ocrId, setOcrId] = useState<number | null>(null);
  const [medicines, setMedicines] = useState<EditableMedicine[]>([]);
  const [clinicName, setClinicName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState('');

  const activeProfileId = selectedProfileId || (user?.profileId ? Number(user.profileId) : null);

  async function processSelectedImage(asset?: Asset) {
    if (!activeProfileId) {
      Alert.alert('Chưa có hồ sơ', 'Vui lòng tạo hoặc chọn hồ sơ sức khỏe trước khi quét toa thuốc.');
      return;
    }

    if (!asset?.base64) {
      return;
    }

    try {
      setOcrState('scanning');
      const response = await submitOcr({
        profileId: activeProfileId,
        imageBase64: asset.base64,
      });

      setOcrId(response.ocr_id || null);
      setMedicines(
        (response.structured_data.medicines || []).map(item => ({
          name: item.name || '',
          dosage: item.dosage || '',
          frequency: item.frequency ? String(item.frequency) : '1',
          duration: item.duration || '7 ngày',
          note: item.note || '',
        })),
      );
      setClinicName(response.structured_data.clinic_name || '');
      setDoctorName(response.structured_data.doctor_name || '');
      setPrescriptionDate(response.structured_data.date || '');
      setOcrState('result');
    } catch (error) {
      setOcrState('idle');
      Alert.alert('Không thể OCR', error instanceof Error ? error.message : 'Đã có lỗi xảy ra');
    }
  }

  async function handleScanFromLibrary() {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.8,
      selectionLimit: 1,
    });
    await processSelectedImage(result.assets?.[0]);
  }

  async function handleScanFromCamera() {
    const result = await launchCamera({
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.8,
      saveToPhotos: false,
    });
    await processSelectedImage(result.assets?.[0]);
  }

  async function handleConfirm() {
    if (!activeProfileId || !ocrId) {
      return;
    }

    try {
      await confirmOcr(ocrId, {
        profileId: activeProfileId,
        structuredData: {
          medicines: medicines.map(item => ({
            name: item.name,
            dosage: item.dosage,
            frequency: Number(item.frequency) || 1,
            duration: item.duration,
            note: item.note,
          })),
          clinicName,
          doctorName,
          date: prescriptionDate,
        },
      });
      Alert.alert('Đã nhập toa thuốc', 'Thông tin thuốc và lịch uống đã được thêm vào hệ thống.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Không thể xác nhận OCR', error instanceof Error ? error.message : 'Đã có lỗi xảy ra');
    }
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
        <View style={styles.cameraBox}>
          {ocrState === 'scanning' ? (
            <View style={styles.scanningOverlay}>
              <View style={styles.scanLine} />
              <Text style={styles.scanningText}>Đang nhận diện toa thuốc...</Text>
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
              <Text style={styles.idleText}>Dùng camera hoặc chọn ảnh toa thuốc để AI trích xuất</Text>
            </View>
          )}
        </View>

        {ocrState !== 'scanning' ? (
          <View style={styles.scanActions}>
            <TouchableOpacity style={styles.scanBtn} onPress={() => void handleScanFromCamera()} activeOpacity={0.85}>
              <Icon name="photo_camera" size={22} color={colors.onPrimary} />
              <Text style={styles.scanBtnText}>Chụp trực tiếp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryScanBtn} onPress={() => void handleScanFromLibrary()} activeOpacity={0.85}>
              <Icon name="photo_library" size={22} color={colors.primary} />
              <Text style={styles.secondaryScanBtnText}>
                {ocrState === 'result' ? 'Chọn ảnh khác' : 'Chọn từ thư viện'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {ocrState === 'result' ? (
          <>
            <View style={styles.resultHeader}>
              <Icon name="auto_awesome" size={18} color={colors.primary} />
              <Text style={styles.resultHeaderText}>Kiểm tra và chỉnh sửa kết quả OCR trước khi lưu</Text>
            </View>

            <View style={[styles.card, shadows.sm]}>
              <Input label="Phòng khám" value={clinicName} onChangeText={setClinicName} />
              <Input label="Bác sĩ" value={doctorName} onChangeText={setDoctorName} />
              <Input label="Ngày kê toa" value={prescriptionDate} onChangeText={setPrescriptionDate} />

              {medicines.map((medicine, index) => (
                <View key={`${medicine.name}-${index}`} style={styles.medicineBlock}>
                  <Text style={styles.medicineBlockTitle}>Thuốc {index + 1}</Text>
                  <Input
                    label="Tên thuốc"
                    value={medicine.name}
                    onChangeText={value => setMedicines(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, name: value } : item))}
                  />
                  <Input
                    label="Liều dùng"
                    value={medicine.dosage}
                    onChangeText={value => setMedicines(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, dosage: value } : item))}
                  />
                  <Input
                    label="Số lần/ngày"
                    value={medicine.frequency}
                    onChangeText={value => setMedicines(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, frequency: value } : item))}
                    keyboardType="numeric"
                  />
                  <Input
                    label="Thời gian dùng"
                    value={medicine.duration}
                    onChangeText={value => setMedicines(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, duration: value } : item))}
                  />
                  <Input
                    label="Ghi chú"
                    value={medicine.note}
                    onChangeText={value => setMedicines(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, note: value } : item))}
                  />
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={() => void handleConfirm()} activeOpacity={0.85}>
              <Icon name="check" size={20} color={colors.onPrimary} />
              <Text style={styles.submitBtnText}>Xác nhận và lưu vào hệ thống</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 16, gap: 16 },
  cameraBox: {
    height: 240,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idleOverlay: { alignItems: 'center', gap: 12 },
  scanFrame: {
    width: 180,
    height: 120,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 8,
    marginBottom: 8,
  },
  idleText: { fontSize: 13, fontFamily: 'Inter', color: 'rgba(255,255,255,0.7)', textAlign: 'center', paddingHorizontal: 12 },
  scanningOverlay: { alignItems: 'center', gap: 16, width: '100%' },
  scanLine: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.9,
  },
  scanningText: { fontSize: 14, fontFamily: 'Inter', fontWeight: '600', color: '#fff', marginTop: 100 },
  resultPreview: { alignItems: 'center', gap: 10 },
  resultPreviewText: { fontSize: 16, fontFamily: 'Manrope', fontWeight: '700', color: '#fff' },
  scanActions: { gap: 12 },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 999,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  scanBtnText: { fontSize: 16, fontFamily: 'Inter', fontWeight: '700', color: colors.onPrimary },
  secondaryScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    backgroundColor: '#E0F2FE',
    borderRadius: 999,
    gap: 8,
  },
  secondaryScanBtnText: { fontSize: 15, fontFamily: 'Inter', fontWeight: '700', color: colors.primary },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultHeaderText: { fontSize: 13, fontFamily: 'Inter', fontWeight: '600', color: colors.primary, flex: 1 },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 16, gap: 12 },
  medicineBlock: {
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
  },
  medicineBlockTitle: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '700', color: colors.onSurface, marginBottom: 8 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 999,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnText: { fontSize: 15, fontFamily: 'Inter', fontWeight: '700', color: colors.onPrimary },
});
