import React, { useState } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors } from '../../theme/colors';
import type { FamilyStackParamList } from '../../navigation/navigationTypes';
import { createVaccination } from '../../api/vaccinations';
import { formatLocalDate } from '../../utils/dateTime';

type AddVaccinationRoute = RouteProp<FamilyStackParamList, 'AddVaccinationSchedule'>;

export default function AddVaccinationScheduleScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<AddVaccinationRoute>();
  const { profileId } = route.params;

  const [vaccineName, setVaccineName] = useState('');
  const [doseNumber, setDoseNumber] = useState('1');
  const [date, setDate] = useState(new Date());
  const [clinicName, setClinicName] = useState('');
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isCompleted, setIsCompleted] = useState(true);

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  async function handleSave() {
    if (!vaccineName) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên vaccine.');
      return;
    }

    try {
      const dateValue = formatLocalDate(date);
      await createVaccination(profileId, {
        vaccineName,
        doseNumber: Number(doseNumber) || 1,
        dateGiven: isCompleted ? dateValue : null,
        plannedDate: isCompleted ? null : dateValue,
        clinicName,
      });
      Alert.alert('Đã lưu thông tin tiêm chủng', 'Mũi tiêm đã được thêm vào hồ sơ của trẻ.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Không thể lưu dữ liệu', error instanceof Error ? error.message : 'Đã có lỗi xảy ra');
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0369a1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ghi nhận tiêm chủng</Text>
        <View style={styles.helpBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.introText}>Ghi lại lịch sử tiêm chủng của hồ sơ #{profileId} để duy trì hồ sơ sức khỏe đầy đủ.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin vaccine</Text>

          <Text style={styles.inputLabel}>TÊN VACCINE</Text>
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="needle" size={20} color="#64748b" />
            <TextInput style={styles.input} value={vaccineName} onChangeText={setVaccineName} placeholder="Ví dụ: Vắc xin 6 trong 1" placeholderTextColor="#94a3b8" />
          </View>

          <Text style={[styles.inputLabel, { marginTop: 20 }]}>SỐ MŨI</Text>
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="numeric" size={20} color="#64748b" />
            <TextInput style={styles.input} value={doseNumber} onChangeText={setDoseNumber} keyboardType="numeric" placeholder="1" placeholderTextColor="#94a3b8" />
          </View>

          <Text style={[styles.inputLabel, { marginTop: 20 }]}>TRẠNG THÁI</Text>
          <View style={styles.choiceRow}>
            <TouchableOpacity style={[styles.choiceChip, isCompleted && styles.choiceChipActive]} onPress={() => setIsCompleted(true)}>
              <Text style={[styles.choiceText, isCompleted && styles.choiceTextActive]}>Đã tiêm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.choiceChip, !isCompleted && styles.choiceChipActive]} onPress={() => setIsCompleted(false)}>
              <Text style={[styles.choiceText, !isCompleted && styles.choiceTextActive]}>Lịch dự kiến</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin mũi tiêm</Text>

          <Text style={styles.inputLabel}>{isCompleted ? 'NGÀY TIÊM' : 'NGÀY DỰ KIẾN'}</Text>
          <TouchableOpacity style={styles.inputWrap} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#64748b" />
            <Text style={styles.input}>{date.toLocaleDateString('vi-VN')}</Text>
            <MaterialCommunityIcons name="calendar" size={20} color="#64748b" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <Text style={[styles.inputLabel, { marginTop: 20 }]}>NƠI TIÊM / PHÒNG KHÁM</Text>
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="hospital-building" size={20} color="#64748b" />
            <TextInput style={styles.input} value={clinicName} onChangeText={setClinicName} placeholder="Ví dụ: Phòng khám Nhi thành phố" placeholderTextColor="#94a3b8" />
          </View>

          <Text style={[styles.inputLabel, { marginTop: 20 }]}>GHI CHÚ</Text>
          <View style={[styles.inputWrap, styles.notesInputWrap]}>
            <MaterialCommunityIcons name="file-document-edit-outline" size={20} color="#64748b" style={{ marginTop: 2 }} />
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Phản ứng sau tiêm hoặc lời khuyên của bác sĩ..."
              placeholderTextColor="#94a3b8"
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.submitBtn} activeOpacity={0.8} onPress={() => void handleSave()}>
          <MaterialCommunityIcons name="check-circle-outline" size={24} color="#fff" />
          <Text style={styles.submitBtnText}>Lưu hồ sơ tiêm chủng</Text>
        </TouchableOpacity>
      </View>

      {showDatePicker ? <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} /> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f7ff' },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, backgroundColor: 'transparent' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  helpBtn: { width: 40, height: 40 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0369a1' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  introText: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20, marginTop: 20, marginBottom: 30, paddingHorizontal: 10 },
  card: { backgroundColor: '#fff', borderRadius: 32, padding: 24, marginBottom: 20, shadowColor: '#1a73e8', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.03, shadowRadius: 20, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 24 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#64748b', marginBottom: 10, letterSpacing: 0.5, marginLeft: 4 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 16, height: 60 },
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: '#1e293b', fontWeight: '600' },
  choiceRow: { flexDirection: 'row', gap: 12 },
  choiceChip: { flex: 1, height: 48, borderRadius: 16, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  choiceChipActive: { backgroundColor: colors.primary },
  choiceText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  choiceTextActive: { color: '#fff' },
  notesInputWrap: { height: 120, alignItems: 'flex-start', paddingVertical: 16 },
  notesInput: { marginLeft: 12, height: '100%' },
  footer: { paddingHorizontal: 24, paddingVertical: 10 },
  submitBtn: { height: 64, backgroundColor: '#3498db', borderRadius: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
