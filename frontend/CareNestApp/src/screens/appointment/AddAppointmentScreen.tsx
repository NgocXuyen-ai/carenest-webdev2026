import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Image, Switch, Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { TOP_BAR_HEIGHT, BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import Icon from '../../components/common/Icon';
import TopAppBar from '../../components/layout/TopAppBar';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { mockFamilyMembers } from '../../data/mockFamilyMembers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AddAppointmentScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // States
  const [selectedMember, setSelectedMember] = useState(mockFamilyMembers[0].id);
  const [facility, setFacility] = useState('');
  const [doctor, setDoctor] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Date & Time States
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Reminder States
  const [smartReminders, setSmartReminders] = useState(true);
  const [reminderTime, setReminderTime] = useState<'1day' | '3hours'>('1day');

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const onTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.root}>
      <TopAppBar variant="detail" title="Lịch hẹn mới" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: TOP_BAR_HEIGHT + insets.top, paddingBottom: 40 }
        ]}
      >
        {/* Header Intro */}
        <View style={styles.headerIntro}>
          <Text style={styles.subTag}>HEALTHCARE SCHEDULING</Text>
          <Text style={styles.mainTitle}>Tạo lịch hẹn mới</Text>
          <Text style={styles.introDesc}>
            Sắp xếp các buổi khám bệnh của gia đình bạn với hệ thống thông minh của CareNest.
          </Text>
        </View>

        {/* Member Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>THÀNH VIÊN GIA ĐÌNH</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.memberRow}>
            {mockFamilyMembers.map(m => (
              <TouchableOpacity
                key={m.id}
                style={[styles.memberCard, selectedMember === m.id && styles.memberCardActive]}
                onPress={() => setSelectedMember(m.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.avatarWrap, selectedMember === m.id && styles.avatarWrapActive]}>
                  <Image
                    source={{ uri: `https://i.pravatar.cc/150?u=${m.id}` }}
                    style={styles.avatar}
                  />
                </View>
                <Text style={[styles.memberName, selectedMember === m.id && styles.memberNameActive]}>
                  {m.fullName.split(' ').pop()}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.addMemberBtn}>
              <View style={styles.addIconWrap}>
                <Icon name="add" size={24} color={colors.outline} />
              </View>
              <Text style={styles.addMemberText}>THÊM</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Clinic & Specialist */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PHÒNG KHÁM / BỆNH VIỆN</Text>
          <TouchableOpacity style={styles.inputCard}>
            <View style={styles.inputIconWrap}>
              <Icon name="local_hospital" size={20} color={colors.outline} />
            </View>
            <Text style={styles.inputText}>{facility || 'Chọn phòng khám...'}</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>BÁC SĨ CHUYÊN KHOA</Text>
          <TouchableOpacity style={styles.inputCard}>
            <View style={styles.inputIconWrap}>
              <Icon name="medical_services" size={20} color={colors.outline} />
            </View>
            <Text style={styles.inputText}>{doctor || 'Tên bác sĩ (nếu có)...'}</Text>
          </TouchableOpacity>
        </View>

        {/* Date & Time */}
        <View style={styles.rowSection}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionLabel}>NGÀY KHÁM</Text>
            <TouchableOpacity style={styles.inputCard} onPress={() => setShowDatePicker(true)}>
              <View style={styles.inputIconWrap}>
                <Icon name="calendar_today" size={20} color={colors.outline} />
              </View>
              <Text style={styles.inputTextText}>{formatDate(date)}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionLabel}>GIỜ KHÁM</Text>
            <TouchableOpacity style={styles.inputCard} onPress={() => setShowTimePicker(true)}>
              <View style={styles.inputIconWrap}>
                <Icon name="access_time" size={20} color={colors.outline} />
              </View>
              <Text style={styles.inputTextText}>{formatTime(date)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Address Input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ĐỊA CHỈ</Text>
          <View style={styles.inputCard}>
            <View style={styles.inputIconWrap}>
              <Icon name="location_on" size={20} color={colors.outline} />
            </View>
            <Text style={styles.inputText}>{address || 'Nhập địa chỉ phòng khám...'}</Text>
          </View>
        </View>

        {/* Consultation Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GHI CHÚ THĂM KHÁM</Text>
          <View style={styles.notesCard}>
            <Text style={styles.notesPlaceholder}>
              Ghi chú các triệu chứng cụ thể hoặc câu hỏi để hỏi bác sĩ...
            </Text>
          </View>
        </View>

        {/* Smart Reminders */}
        <View style={styles.reminderCard}>
          <View style={styles.reminderHeader}>
            <View style={styles.reminderIconWrap}>
              <Icon name="notifications_active" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reminderTitle}>Nhắc nhở thông minh</Text>
              <Text style={styles.reminderSub}>BẬT THÔNG BÁO NHẮC HẸN</Text>
            </View>
            <Switch
              value={smartReminders}
              onValueChange={setSmartReminders}
              trackColor={{ false: '#E2E8F0', true: colors.primary + '80' }}
              thumbColor={smartReminders ? colors.primary : '#F8FAFC'}
            />
          </View>

          <View style={styles.reminderOptions}>
            <TouchableOpacity
              style={[styles.remChip, reminderTime === '1day' && styles.remChipActive]}
              onPress={() => setReminderTime('1day')}
            >
              <Icon name="alarm" size={16} color={reminderTime === '1day' ? colors.primary : colors.outline} />
              <Text style={[styles.remChipText, reminderTime === '1day' && styles.remChipTextActive]}>
                1 NGÀY TRƯỚC
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.remChip, reminderTime === '3hours' && styles.remChipActive]}
              onPress={() => setReminderTime('3hours')}
            >
              <Icon name="alarm" size={16} color={reminderTime === '3hours' ? colors.primary : colors.outline} />
              <Text style={[styles.remChipText, reminderTime === '3hours' && styles.remChipTextActive]}>
                3 GIỜ TRƯỚC
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitBtn} activeOpacity={0.9} onPress={() => navigation.goBack()}>
          <Text style={styles.submitText}>Lưu lịch hẹn</Text>
        </TouchableOpacity>
        <Text style={styles.syncFooter}>Lịch hẹn này sẽ được đồng bộ với lịch chung của gia đình.</Text>

      </ScrollView>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}
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
  memberCard: {
    width: 90, paddingVertical: 16, backgroundColor: '#fff', borderRadius: 20,
    alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#F1F5F9'
  },
  memberCardActive: { borderColor: colors.primary, backgroundColor: colors.primary + '05', ...shadows.sm },
  avatarWrap: {
    width: 52, height: 52, borderRadius: 26, padding: 2,
    borderWidth: 2, borderColor: 'transparent'
  },
  avatarWrapActive: { borderColor: colors.primary },
  avatar: { width: '100%', height: '100%', borderRadius: 24 },
  memberName: { fontSize: 12, fontFamily: 'Inter', fontWeight: '700', color: '#64748B' },
  memberNameActive: { color: colors.primary },

  addMemberBtn: {
    width: 90, paddingVertical: 16, backgroundColor: '#F8FAFC', borderRadius: 20,
    alignItems: 'center', gap: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1'
  },
  addIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  addMemberText: { fontSize: 11, fontFamily: 'Inter', fontWeight: '800', color: '#94A3B8' },

  inputCard: {
    flexDirection: 'row', alignItems: 'center',
    height: 56, backgroundColor: '#E2E8F066', borderRadius: 12, paddingHorizontal: 16, gap: 12
  },
  inputIconWrap: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  inputText: { fontSize: 14, fontFamily: 'Inter', color: '#94A3B8' },
  inputTextText: { fontSize: 14, fontFamily: 'Inter', color: '#1E293B', fontWeight: '600' },

  rowSection: { flexDirection: 'row', gap: 16 },

  notesCard: {
    height: 120, backgroundColor: '#E2E8F066', borderRadius: 16,
    padding: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1'
  },
  notesPlaceholder: { fontSize: 14, fontFamily: 'Inter', color: '#94A3B8', lineHeight: 20 },

  reminderCard: { backgroundColor: '#F1F5F9', borderRadius: 24, padding: 20, gap: 16 },
  reminderHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reminderIconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  reminderTitle: { fontSize: 15, fontFamily: 'Manrope', fontWeight: '800', color: '#1E293B' },
  reminderSub: { fontSize: 10, fontFamily: 'Inter', fontWeight: '800', color: '#64748B', letterSpacing: 0.5 },

  reminderOptions: { flexDirection: 'row', gap: 12 },
  remChip: {
    flex: 1, height: 46, backgroundColor: '#fff', borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8
  },
  remChipActive: { backgroundColor: colors.primary + '15', borderWidth: 1, borderColor: colors.primary },
  remChipText: { fontSize: 11, fontFamily: 'Inter', fontWeight: '800', color: '#64748B' },
  remChipTextActive: { color: colors.primary },

  submitBtn: {
    height: 60, backgroundColor: '#3498DB', borderRadius: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginTop: 10, ...shadows.lg
  },
  submitText: { fontSize: 17, fontFamily: 'Manrope', fontWeight: '800', color: '#fff' },
  syncFooter: { fontSize: 11, fontFamily: 'Inter', textAlign: 'center', color: '#94A3B8', marginTop: 12 },
});
