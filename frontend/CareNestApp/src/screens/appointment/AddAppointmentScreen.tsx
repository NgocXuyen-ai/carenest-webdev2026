import React, { useMemo, useState } from 'react';
import {
  Alert,
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
import { TOP_BAR_HEIGHT, BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import Icon from '../../components/common/Icon';
import TopAppBar from '../../components/layout/TopAppBar';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFamily } from '../../context/FamilyContext';
import { useAuth } from '../../context/AuthContext';
import { createAppointment } from '../../api/appointments';

export default function AddAppointmentScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { members, selectedProfileId } = useFamily();
  const { user } = useAuth();

  const [selectedMember, setSelectedMember] = useState<number | null>(selectedProfileId || (user?.profileId ? Number(user.profileId) : null));
  const [facility, setFacility] = useState('');
  const [doctor, setDoctor] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const canSubmit = Boolean(selectedMember && facility && doctor);

  const currentMember = useMemo(
    () => members.find(member => member.profileId === selectedMember),
    [members, selectedMember],
  );

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const onTimeChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  async function handleSave() {
    if (!selectedMember) {
      Alert.alert('Thiếu hồ sơ', 'Vui lòng chọn thành viên cho lịch hẹn này.');
      return;
    }

    try {
      await createAppointment({
        profileId: selectedMember,
        clinicName: facility,
        doctorName: doctor,
        appointmentDate: date.toISOString().slice(0, 19),
        location: address,
        note: notes,
      });
      Alert.alert('Đã lưu lịch hẹn', 'Lịch tái khám mới đã được tạo thành công.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Không thể lưu lịch hẹn', error instanceof Error ? error.message : 'Đã có lỗi xảy ra');
    }
  }

  return (
    <View style={styles.root}>
      <TopAppBar variant="detail" title="Lịch hẹn mới" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: TOP_BAR_HEIGHT + insets.top, paddingBottom: BOTTOM_NAV_HEIGHT + 40 },
        ]}
      >
        <View style={styles.headerIntro}>
          <Text style={styles.subTag}>HEALTHCARE SCHEDULING</Text>
          <Text style={styles.mainTitle}>Tạo lịch hẹn mới</Text>
          <Text style={styles.introDesc}>Sắp xếp các buổi khám bệnh của gia đình bạn với dữ liệu thật từ hệ thống CareNest.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>THÀNH VIÊN GIA ĐÌNH</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.memberRow}>
            {members.map(member => (
              <TouchableOpacity
                key={member.profileId}
                style={[styles.memberCard, selectedMember === member.profileId && styles.memberCardActive]}
                onPress={() => setSelectedMember(member.profileId)}
              >
                <View style={[styles.avatarWrap, selectedMember === member.profileId && styles.avatarWrapActive]}>
                  <Text style={styles.avatarText}>{member.fullName.charAt(0)}</Text>
                </View>
                <Text style={[styles.memberName, selectedMember === member.profileId && styles.memberNameActive]}>
                  {member.fullName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PHÒNG KHÁM / BỆNH VIỆN</Text>
          <View style={styles.inputCard}>
            <View style={styles.inputIconWrap}>
              <Icon name="local_hospital" size={20} color={colors.outline} />
            </View>
            <TextInput style={styles.inputText} value={facility} onChangeText={setFacility} placeholder="Tên phòng khám..." placeholderTextColor="#94A3B8" />
          </View>

          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>BÁC SĨ CHUYÊN KHOA</Text>
          <View style={styles.inputCard}>
            <View style={styles.inputIconWrap}>
              <Icon name="medical_services" size={20} color={colors.outline} />
            </View>
            <TextInput style={styles.inputText} value={doctor} onChangeText={setDoctor} placeholder="Tên bác sĩ..." placeholderTextColor="#94A3B8" />
          </View>
        </View>

        <View style={styles.rowSection}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionLabel}>NGÀY KHÁM</Text>
            <TouchableOpacity style={styles.inputCard} onPress={() => setShowDatePicker(true)}>
              <View style={styles.inputIconWrap}>
                <Icon name="calendar_today" size={20} color={colors.outline} />
              </View>
              <Text style={styles.inputTextText}>{date.toLocaleDateString('vi-VN')}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionLabel}>GIỜ KHÁM</Text>
            <TouchableOpacity style={styles.inputCard} onPress={() => setShowTimePicker(true)}>
              <View style={styles.inputIconWrap}>
                <Icon name="access_time" size={20} color={colors.outline} />
              </View>
              <Text style={styles.inputTextText}>{date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ĐỊA CHỈ</Text>
          <View style={styles.inputCard}>
            <View style={styles.inputIconWrap}>
              <Icon name="location_on" size={20} color={colors.outline} />
            </View>
            <TextInput style={styles.inputText} value={address} onChangeText={setAddress} placeholder="Địa chỉ phòng khám..." placeholderTextColor="#94A3B8" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GHI CHÚ THĂM KHÁM</Text>
          <View style={styles.notesCard}>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Ghi chú các triệu chứng hoặc điều cần hỏi bác sĩ..."
              placeholderTextColor="#94A3B8"
              multiline
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          activeOpacity={0.9}
          onPress={() => void handleSave()}
          disabled={!canSubmit}
        >
          <Text style={styles.submitText}>Lưu lịch hẹn</Text>
        </TouchableOpacity>
        <Text style={styles.syncFooter}>
          {currentMember ? `Lịch hẹn này sẽ được gắn với hồ sơ ${currentMember.fullName}.` : 'Lịch hẹn này sẽ được đồng bộ với hồ sơ sức khỏe đã chọn.'}
        </Text>
      </ScrollView>

      {showDatePicker ? <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} /> : null}
      {showTimePicker ? <DateTimePicker value={date} mode="time" display="default" onChange={onTimeChange} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingHorizontal: 20, gap: 24 },
  headerIntro: { marginTop: 10 },
  subTag: { fontSize: 11, fontFamily: 'Inter', fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  mainTitle: { fontSize: 28, fontFamily: 'Manrope', fontWeight: '800', color: '#0F172A', marginTop: 8 },
  introDesc: { fontSize: 13, fontFamily: 'Inter', color: '#64748B', lineHeight: 20, marginTop: 8 },
  section: { gap: 12 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter', fontWeight: '800', color: '#475569', letterSpacing: 0.5 },
  memberRow: { gap: 12, paddingRight: 20 },
  memberCard: { width: 100, paddingVertical: 16, backgroundColor: '#fff', borderRadius: 20, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  memberCardActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}05`, ...shadows.sm },
  avatarWrap: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DBEAFE' },
  avatarWrapActive: { borderWidth: 2, borderColor: colors.primary },
  avatarText: { fontSize: 24, fontWeight: '800', color: colors.primary },
  memberName: { fontSize: 12, fontFamily: 'Inter', fontWeight: '700', color: '#64748B', textAlign: 'center' },
  memberNameActive: { color: colors.primary },
  inputCard: { flexDirection: 'row', alignItems: 'center', minHeight: 56, backgroundColor: '#E2E8F066', borderRadius: 12, paddingHorizontal: 16, gap: 12 },
  inputIconWrap: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  inputText: { flex: 1, fontSize: 14, fontFamily: 'Inter', color: '#1E293B' },
  inputTextText: { fontSize: 14, fontFamily: 'Inter', color: '#1E293B', fontWeight: '600' },
  rowSection: { flexDirection: 'row', gap: 16 },
  notesCard: { minHeight: 120, backgroundColor: '#E2E8F066', borderRadius: 16, padding: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' },
  notesInput: { minHeight: 88, fontSize: 14, fontFamily: 'Inter', color: '#1E293B', textAlignVertical: 'top' },
  submitBtn: { height: 60, backgroundColor: '#3498DB', borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10, ...shadows.lg },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { fontSize: 17, fontFamily: 'Manrope', fontWeight: '800', color: '#fff' },
  syncFooter: { fontSize: 11, fontFamily: 'Inter', textAlign: 'center', color: '#94A3B8', marginTop: 12 },
});
