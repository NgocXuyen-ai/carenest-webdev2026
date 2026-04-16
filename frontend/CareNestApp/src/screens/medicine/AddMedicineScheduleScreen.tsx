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
import { mockFamilyMembers } from '../../data/mockFamilyMembers';

const TIME_OF_DAY = [
  { key: 'morning',   label: 'Sáng', icon: 'wb_sunny' },
  { key: 'afternoon', label: 'Trưa', icon: 'partly_cloudy_day' },
  { key: 'evening',   label: 'Tối',  icon: 'bedtime' },
];

export default function AddMedicineScheduleScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedMember, setSelectedMember] = useState(mockFamilyMembers[0].id);
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [instruction, setInstruction] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('morning');
  const [time, setTime] = useState('08:00');

  const canSubmit = medicineName.trim().length > 0 && dosage.trim().length > 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.root}>
        <TopAppBar variant="detail" title="Thêm lịch uống thuốc" />
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: TOP_BAR_HEIGHT + insets.top + 16, paddingBottom: BOTTOM_NAV_HEIGHT + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Member selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Người uống thuốc</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {mockFamilyMembers.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.memberChip, selectedMember === m.id && styles.memberChipActive]}
                  onPress={() => setSelectedMember(m.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.memberChipText, selectedMember === m.id && styles.memberChipTextActive]}>
                    {m.fullName.split(' ').pop()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Medicine info */}
          <View style={[styles.card, shadows.sm]}>
            <Input
              label="Tên thuốc *"
              value={medicineName}
              onChangeText={setMedicineName}
              placeholder="VD: Paracetamol 500mg"
              leftIcon={<Icon name="pill" size={18} color={colors.outline} />}
            />
            <Input
              label="Liều dùng *"
              value={dosage}
              onChangeText={setDosage}
              placeholder="VD: 1 viên"
              leftIcon={<Icon name="medication" size={18} color={colors.outline} />}
            />
            <Input
              label="Hướng dẫn"
              value={instruction}
              onChangeText={setInstruction}
              placeholder="VD: Uống sau ăn"
              leftIcon={<Icon name="info" size={18} color={colors.outline} />}
            />
          </View>

          {/* Time of day selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Buổi trong ngày</Text>
            <View style={styles.timeOfDayRow}>
              {TIME_OF_DAY.map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.timeOfDayChip, timeOfDay === t.key && styles.timeOfDayChipActive]}
                  onPress={() => setTimeOfDay(t.key)}
                  activeOpacity={0.8}
                >
                  <Icon name={t.icon} size={18} color={timeOfDay === t.key ? colors.onPrimary : colors.onSurfaceVariant} />
                  <Text style={[styles.timeOfDayText, timeOfDay === t.key && styles.timeOfDayTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Time picker (simplified) */}
          <View style={[styles.card, shadows.sm]}>
            <Input
              label="Giờ uống"
              value={time}
              onChangeText={setTime}
              placeholder="08:00"
              keyboardType="numbers-and-punctuation"
              leftIcon={<Icon name="access_time" size={18} color={colors.outline} />}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            disabled={!canSubmit}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Icon name="check" size={20} color={colors.onPrimary} />
            <Text style={styles.submitBtnText}>Lưu lịch uống thuốc</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 16, gap: 16 },
  section: { gap: 8 },
  sectionLabel: {
    fontSize: 12, fontFamily: 'Inter', fontWeight: '700',
    color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  chipRow: { flexDirection: 'row', gap: 8 },
  memberChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: colors.surfaceContainerHigh, borderRadius: 999,
  },
  memberChipActive: { backgroundColor: colors.primary },
  memberChipText: { fontSize: 13, fontFamily: 'Inter', fontWeight: '600', color: colors.onSurface },
  memberChipTextActive: { color: colors.onPrimary },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 16, gap: 12 },
  timeOfDayRow: { flexDirection: 'row', gap: 10 },
  timeOfDayChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, backgroundColor: colors.surfaceContainerHigh, borderRadius: 12,
  },
  timeOfDayChipActive: { backgroundColor: colors.primary },
  timeOfDayText: { fontSize: 13, fontFamily: 'Inter', fontWeight: '600', color: colors.onSurfaceVariant },
  timeOfDayTextActive: { color: colors.onPrimary },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 52, backgroundColor: colors.primary, borderRadius: 999, gap: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 16, fontFamily: 'Inter', fontWeight: '700', color: colors.onPrimary },
});
