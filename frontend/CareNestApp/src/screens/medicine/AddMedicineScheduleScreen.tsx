import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import Icon from '../../components/common/Icon';
import { useFamily } from '../../context/FamilyContext';
import { useAuth } from '../../context/AuthContext';
import { createMedicineSchedule, getScheduleFormData, type MedicineScheduleFormData } from '../../api/medicine';
import { formatLocalDate } from '../../utils/dateTime';

export default function AddMedicineScheduleScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { selectedProfileId } = useFamily();
  const { user } = useAuth();
  const [formData, setFormData] = useState<MedicineScheduleFormData | null>(null);
  const [selectedMember, setSelectedMember] = useState<number | null>(selectedProfileId || (user?.profileId ? Number(user.profileId) : null));
  const [selectedMedicineId, setSelectedMedicineId] = useState<number | null>(null);
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState(2);
  const [startDate, setStartDate] = useState(formatLocalDate(new Date()));
  const [endDate, setEndDate] = useState(formatLocalDate(new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)));
  const [notes, setNotes] = useState('');

  useEffect(() => {
    void getScheduleFormData()
      .then(data => {
        setFormData(data);
        if (data.medicines[0]) {
          setSelectedMedicineId(data.medicines[0].medicineId);
        }
        if (!selectedMember && data.profiles[0]) {
          setSelectedMember(data.profiles[0].profileId);
        }
      })
      .catch(() => setFormData(null));
  }, []);

  const selectedMedicine = useMemo(
    () => formData?.medicines.find(item => item.medicineId === selectedMedicineId) || null,
    [formData, selectedMedicineId],
  );

  async function handleSubmit() {
    if (!selectedMember || !selectedMedicine) {
      Alert.alert('Thiếu dữ liệu', 'Vui lòng chọn hồ sơ và thuốc trước khi lưu lịch.');
      return;
    }

    try {
      await createMedicineSchedule({
        profile: selectedMember,
        medicineId: selectedMedicine.medicineId,
        medicineName: selectedMedicine.name,
        dosage: dosage || '1 viên',
        frequency,
        note: notes,
        startDate,
        endDate,
      });
      Alert.alert('Đã lưu lịch thuốc', 'Lịch uống thuốc mới đã được tạo thành công.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Không thể tạo lịch thuốc', error instanceof Error ? error.message : 'Đã có lỗi xảy ra');
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#F8FAFC' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow_back" size={20} color={colors.primary} />
            <Text style={styles.backBtnText}>QUẢN LÝ Y TẾ</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thêm lịch uống thuốc</Text>
          <Text style={styles.headerSubtitle}>Thiết lập lịch nhắc uống thuốc thật từ dữ liệu tủ thuốc gia đình.</Text>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Thành viên gia đình</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.memberContainer}>
              {(formData?.profiles || []).map(profile => (
                <TouchableOpacity
                  key={profile.profileId}
                  style={[styles.memberCard, selectedMember === profile.profileId && styles.memberCardActive]}
                  onPress={() => setSelectedMember(profile.profileId)}
                >
                  <View style={[styles.avatarWrap, selectedMember === profile.profileId && styles.avatarWrapActive]}>
                    <Text style={styles.memberInitial}>{profile.fullName.charAt(0)}</Text>
                  </View>
                  <Text style={[styles.memberName, selectedMember === profile.profileId && styles.memberNameActive]}>
                    {profile.fullName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Chọn thuốc từ tủ</Text>
            <View style={styles.whiteCard}>
              {(formData?.medicines || []).map(medicine => (
                <TouchableOpacity
                  key={medicine.medicineId}
                  style={[styles.medicineChoice, selectedMedicineId === medicine.medicineId && styles.medicineChoiceActive]}
                  onPress={() => setSelectedMedicineId(medicine.medicineId)}
                >
                  <View style={styles.medicineChoiceIcon}>
                    <Icon name="pill" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medicineChoiceName}>{medicine.name}</Text>
                    <Text style={styles.medicineChoiceMeta}>{medicine.quantity} {medicine.unit}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.whiteCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>LIỀU DÙNG</Text>
              <TextInput
                style={styles.textInput}
                value={dosage}
                onChangeText={setDosage}
                placeholder="VD: 1 viên sau ăn"
                placeholderTextColor="#CBD5E1"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SỐ LẦN / NGÀY</Text>
              <TextInput
                style={styles.textInput}
                value={String(frequency)}
                onChangeText={value => setFrequency(Number(value) || 1)}
                keyboardType="numeric"
                placeholderTextColor="#CBD5E1"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NGÀY BẮT ĐẦU</Text>
              <TextInput style={styles.textInput} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NGÀY KẾT THÚC</Text>
              <TextInput style={styles.textInput} value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>GHI CHÚ</Text>
              <TextInput
                style={styles.textInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="VD: Uống sau ăn"
                placeholderTextColor="#CBD5E1"
              />
            </View>
          </View>

          <TouchableOpacity style={[styles.submitBtn, shadows.md]} onPress={() => void handleSubmit()} activeOpacity={0.9}>
            <Text style={styles.submitBtnText}>Lưu lịch</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 24, marginBottom: 20 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginLeft: -4 },
  backBtnText: { fontSize: 12, fontFamily: 'Manrope', fontWeight: '800', color: '#1283DA', marginLeft: 6, letterSpacing: 0.5 },
  headerTitle: { fontSize: 28, fontFamily: 'Manrope', fontWeight: '800', color: colors.onSurface, marginBottom: 8 },
  headerSubtitle: { fontSize: 13, fontFamily: 'Inter', color: colors.onSurfaceVariant, lineHeight: 18 },
  scroll: { paddingHorizontal: 20, gap: 20 },
  section: { gap: 12 },
  sectionLabel: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '700', color: '#475569' },
  memberContainer: { flexDirection: 'row', gap: 12 },
  memberCard: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 20, gap: 10, backgroundColor: '#EDF2F7' },
  memberCardActive: { backgroundColor: '#fff', ...shadows.sm },
  avatarWrap: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DBEAFE' },
  avatarWrapActive: { borderWidth: 2, borderColor: colors.primary },
  memberInitial: { fontSize: 24, fontWeight: '800', color: colors.primary },
  memberName: { fontSize: 13, fontFamily: 'Inter', fontWeight: '600', color: '#64748B' },
  memberNameActive: { color: colors.primary },
  whiteCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, gap: 16, ...shadows.sm },
  medicineChoice: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  medicineChoiceActive: { backgroundColor: '#EFF6FF', borderRadius: 16, paddingHorizontal: 12 },
  medicineChoiceIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primaryFixed, alignItems: 'center', justifyContent: 'center' },
  medicineChoiceName: { fontSize: 14, fontFamily: 'Inter', fontWeight: '700', color: colors.onSurface },
  medicineChoiceMeta: { fontSize: 12, fontFamily: 'Inter', color: colors.onSurfaceVariant },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 10, fontFamily: 'Manrope', fontWeight: '800', color: '#1283DA', letterSpacing: 0.5 },
  textInput: { height: 48, backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 16, fontSize: 14, fontFamily: 'Inter', color: colors.onSurface },
  submitBtn: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  submitBtnText: { fontSize: 16, fontFamily: 'Manrope', fontWeight: '800', color: '#fff' },
});
