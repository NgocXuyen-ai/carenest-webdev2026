import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, TextInput, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { TOP_BAR_HEIGHT, BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import Icon from '../../components/common/Icon';
import { mockFamilyMembers } from '../../data/mockFamilyMembers';

export default function AddMedicineScheduleScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [selectedMember, setSelectedMember] = useState(mockFamilyMembers[0].id);
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState(2);
  const [mealTime, setMealTime] = useState<'before' | 'after'>('before');
  const [startDate, setStartDate] = useState('24 Oct 2023');
  const [endDate, setEndDate] = useState('31 Oct 2023');
  const [notes, setNotes] = useState('');

  // Sample reminders based on frequency
  const reminders = [
    { id: 1, label: 'LẦN 1', time: '08:00 AM' },
    { id: 2, label: 'LẦN 2', time: '08:00 PM' },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.root}>
        {/* Header Section */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow_back" size={20} color={colors.primary} />
            <Text style={styles.backBtnText}>QUẢN LÝ Y TẾ</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thêm lịch uống thuốc</Text>
          <Text style={styles.headerSubtitle}>
            Thiết lập cảnh báo nhắc nhở uống thuốc định kỳ cho thành viên gia đình bạn.
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Family Member Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Thành viên gia đình</Text>
            <View style={styles.memberContainer}>
              {mockFamilyMembers.slice(0, 3).map(m => {
                const isSelected = selectedMember === m.id;
                const firstName = m.fullName.split(' ').pop();
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.memberCard, isSelected && styles.memberCardActive]}
                    onPress={() => setSelectedMember(m.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.avatarWrap, isSelected && styles.avatarWrapActive]}>
                      {/* Placeholder Image based on member ID for demo */}
                      <Image
                        source={{ uri: `https://i.pravatar.cc/150?u=${m.id}` }}
                        style={styles.avatar}
                      />
                    </View>
                    <Text style={[styles.memberName, isSelected && styles.memberNameActive]}>
                      {firstName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Medicine Info Card */}
          <View style={styles.whiteCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>TÊN THUỐC</Text>
              <TextInput
                style={styles.textInput}
                value={medicineName}
                onChangeText={setMedicineName}
                placeholder="VD: Paracetamol"
                placeholderTextColor="#CBD5E1"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>LIỀU DÙNG</Text>
              <TextInput
                style={styles.textInput}
                value={dosage}
                onChangeText={setDosage}
                placeholder="VD: 500mg"
                placeholderTextColor="#CBD5E1"
              />
            </View>
          </View>

          {/* Frequency Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TẦN SUẤT</Text>
            <View style={styles.counterCard}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => setFrequency(Math.max(1, frequency - 1))}
              >
                <Icon name="remove" size={24} color="#64748B" />
              </TouchableOpacity>
              <View style={styles.counterValueWrap}>
                <Text style={styles.counterValue}>{frequency}</Text>
                <Text style={styles.counterUnit}>lần/ngày</Text>
              </View>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => setFrequency(frequency + 1)}
              >
                <Icon name="add" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Reminders Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Cài đặt nhắc nhở</Text>
            <View style={styles.reminderRow}>
              {reminders.slice(0, Math.min(frequency, 2)).map(r => (
                <View key={r.id} style={styles.reminderCard}>
                  <View style={styles.reminderHeader}>
                    <Icon name="notifications" size={16} color={colors.primary} />
                    <Text style={styles.reminderTitle}>{r.label}</Text>
                  </View>
                  <View style={styles.timeWrap}>
                    <Text style={styles.timeText}>{r.time}</Text>
                    <Icon name="access_time" size={16} color="#94A3B8" />
                  </View>
                </View>
              ))}
            </View>

            {/* Meal Time Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleBtn, mealTime === 'before' && styles.toggleBtnActive]}
                onPress={() => setMealTime('before')}
              >
                <Text style={[styles.toggleText, mealTime === 'before' && styles.toggleTextActive]}>
                  Trước khi ăn
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, mealTime === 'after' && styles.toggleBtnActive]}
                onPress={() => setMealTime('after')}
              >
                <Text style={[styles.toggleText, mealTime === 'after' && styles.toggleTextActive]}>
                  Sau khi ăn
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Picker Section */}
          <View style={styles.dateRow}>
            <View style={styles.dateCard}>
              <Text style={styles.inputLabel}>NGÀY BẮT ĐẦU</Text>
              <View style={styles.dateContent}>
                <Icon name="calendar_today" size={18} color="#64748B" />
                <Text style={styles.dateText}>{startDate}</Text>
              </View>
            </View>
            <View style={styles.dateCard}>
              <Text style={styles.inputLabel}>NGÀY KẾT THÚC</Text>
              <View style={styles.dateContent}>
                <Icon name="calendar_today" size={18} color="#64748B" />
                <Text style={styles.dateText}>{endDate}</Text>
              </View>
            </View>
          </View>

          {/* Notes Section */}
          <View style={styles.whiteCard}>
            <Text style={styles.noteLabel}>Ghi chú</Text>
            <TextInput
              style={styles.noteInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Thêm hướng dẫn bổ sung (VD: Không uống cùng với sữa)"
              placeholderTextColor="#CBD5E1"
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, shadows.md]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.9}
          >
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
  backBtnText: {
    fontSize: 12, fontFamily: 'Manrope', fontWeight: '800',
    color: '#1283DA', marginLeft: 6, letterSpacing: 0.5
  },
  headerTitle: { fontSize: 28, fontFamily: 'Manrope', fontWeight: '800', color: colors.onSurface, marginBottom: 8 },
  headerSubtitle: { fontSize: 13, fontFamily: 'Inter', color: colors.onSurfaceVariant, lineHeight: 18 },

  scroll: { paddingHorizontal: 20, gap: 20 },
  section: { gap: 12 },
  sectionLabel: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '700', color: '#475569' },

  memberContainer: {
    flexDirection: 'row', gap: 12, backgroundColor: '#EDF2F7',
    borderRadius: 24, padding: 16
  },
  memberCard: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 20, gap: 10
  },
  memberCardActive: { backgroundColor: '#fff', ...shadows.sm },
  avatarWrap: {
    width: 60, height: 60, borderRadius: 30, overflow: 'hidden',
    borderWidth: 2, borderColor: 'transparent'
  },
  avatarWrapActive: { borderColor: colors.primary },
  avatar: { width: '100%', height: '100%' },
  memberName: { fontSize: 13, fontFamily: 'Inter', fontWeight: '600', color: '#64748B' },
  memberNameActive: { color: colors.primary },

  whiteCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, gap: 16, ...shadows.sm },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 10, fontFamily: 'Manrope', fontWeight: '800', color: '#1283DA', letterSpacing: 0.5 },
  textInput: {
    height: 48, backgroundColor: '#F1F5F9', borderRadius: 12,
    paddingHorizontal: 16, fontSize: 14, fontFamily: 'Inter', color: colors.onSurface
  },

  counterCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F1F5F9', borderRadius: 20, padding: 8
  },
  counterBtn: {
    width: 44, height: 44, borderRadius: 16, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', ...shadows.sm
  },
  counterValueWrap: { alignItems: 'center' },
  counterValue: { fontSize: 18, fontFamily: 'Manrope', fontWeight: '800', color: colors.onSurface },
  counterUnit: { fontSize: 11, fontFamily: 'Inter', color: '#64748B', marginTop: -2 },

  reminderRow: { flexDirection: 'row', gap: 12 },
  reminderCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 16, gap: 12, ...shadows.sm
  },
  reminderHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reminderTitle: { fontSize: 10, fontFamily: 'Manrope', fontWeight: '800', color: '#94A3B8' },
  timeWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeText: { fontSize: 15, fontFamily: 'Inter', fontWeight: '700', color: colors.onSurface },

  toggleContainer: {
    flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4, marginTop: 4
  },
  toggleBtn: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  toggleBtnActive: { backgroundColor: '#fff', ...shadows.sm },
  toggleText: { fontSize: 13, fontFamily: 'Inter', fontWeight: '600', color: '#64748B' },
  toggleTextActive: { color: colors.onSurface },

  dateRow: { flexDirection: 'row', gap: 12 },
  dateCard: { flex: 1, backgroundColor: '#fff', borderRadius: 24, padding: 16, gap: 8, ...shadows.sm },
  dateContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateText: { fontSize: 14, fontFamily: 'Inter', fontWeight: '700', color: colors.onSurface },

  noteLabel: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '700', color: colors.onSurface, marginBottom: -4 },
  noteInput: {
    height: 100, backgroundColor: '#F1F5F9', borderRadius: 16,
    padding: 16, fontSize: 13, fontFamily: 'Inter', color: colors.onSurface
  },

  submitBtn: {
    height: 56, backgroundColor: colors.primary, borderRadius: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginTop: 10,
  },
  submitBtnText: { fontSize: 16, fontFamily: 'Manrope', fontWeight: '800', color: '#fff' },
});
