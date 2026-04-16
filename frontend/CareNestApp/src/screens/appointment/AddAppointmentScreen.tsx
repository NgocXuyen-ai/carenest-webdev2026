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

export default function AddAppointmentScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedMember, setSelectedMember] = useState(mockFamilyMembers[0].id);
  const [facility, setFacility] = useState('');
  const [doctor, setDoctor] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const canSubmit = facility.trim().length > 0 && date.trim().length > 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.root}>
        <TopAppBar variant="detail" title="Thêm lịch tái khám" />
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
            <Text style={styles.sectionLabel}>Người khám</Text>
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

          {/* Appointment info */}
          <View style={[styles.card, shadows.sm]}>
            <Input
              label="Cơ sở y tế *"
              value={facility}
              onChangeText={setFacility}
              placeholder="VD: BV Nhi Đồng 1"
              leftIcon={<Icon name="local_hospital" size={18} color={colors.outline} />}
            />
            <Input
              label="Bác sĩ"
              value={doctor}
              onChangeText={setDoctor}
              placeholder="VD: BS. Nguyễn Văn A"
              leftIcon={<Icon name="stethoscope" size={18} color={colors.outline} />}
            />
            <Input
              label="Địa chỉ"
              value={address}
              onChangeText={setAddress}
              placeholder="Địa chỉ phòng khám"
              leftIcon={<Icon name="location_on" size={18} color={colors.outline} />}
            />
          </View>

          {/* Date & time */}
          <View style={[styles.card, shadows.sm]}>
            <Input
              label="Ngày khám *"
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              leftIcon={<Icon name="calendar_today" size={18} color={colors.outline} />}
              keyboardType="numbers-and-punctuation"
            />
            <Input
              label="Giờ khám"
              value={time}
              onChangeText={setTime}
              placeholder="HH:MM"
              leftIcon={<Icon name="access_time" size={18} color={colors.outline} />}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          {/* Notes */}
          <View style={[styles.card, shadows.sm]}>
            <Input
              label="Ghi chú"
              value={notes}
              onChangeText={setNotes}
              placeholder="VD: Tái khám huyết áp"
              leftIcon={<Icon name="edit_note" size={18} color={colors.outline} />}
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
            <Text style={styles.submitBtnText}>Lưu lịch tái khám</Text>
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
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 52, backgroundColor: colors.primary, borderRadius: 999, gap: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 16, fontFamily: 'Inter', fontWeight: '700', color: colors.onPrimary },
});
