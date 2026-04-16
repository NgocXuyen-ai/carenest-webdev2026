import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { TOP_BAR_HEIGHT, BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import Icon from '../../components/common/Icon';
import TopAppBar from '../../components/layout/TopAppBar';
import FAB from '../../components/common/FAB';
import { mockAppointments } from '../../data/mockAppointments';
import type { HomeStackParamList } from '../../navigation/navigationTypes';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'AppointmentList'>;

type FilterKey = 'all' | 'upcoming' | 'past';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',      label: 'Tất cả' },
  { key: 'upcoming', label: 'Sắp tới' },
  { key: 'past',     label: 'Đã qua' },
];

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  const date = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  return { time, date };
}

export default function AppointmentListScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterKey>('all');

  const appointments = filter === 'all'
    ? mockAppointments
    : mockAppointments.filter(a => a.status === filter);

  return (
    <View style={styles.root}>
      <TopAppBar variant="detail" title="Lịch tái khám" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: TOP_BAR_HEIGHT + insets.top + 16, paddingBottom: BOTTOM_NAV_HEIGHT + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Appointment list */}
        {appointments.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="calendar_month" size={56} color={colors.outlineVariant} />
            <Text style={styles.emptyTitle}>Không có lịch nào</Text>
            <Text style={styles.emptySubtitle}>Nhấn + để thêm lịch tái khám mới</Text>
          </View>
        )}
        {appointments.map(appt => {
          const { time, date } = formatDateTime(appt.dateTime);
          const isUpcoming = appt.status === 'upcoming';
          return (
            <TouchableOpacity
              key={appt.id}
              style={[styles.apptCard, shadows.sm, !isUpcoming && styles.apptCardPast]}
              activeOpacity={0.8}
            >
              {/* Date pill */}
              <View style={[styles.datePill, !isUpcoming && styles.datePillPast]}>
                <Text style={[styles.dateDay, !isUpcoming && styles.dateDayPast]}>
                  {date.split('/')[0]}
                </Text>
                <Text style={[styles.dateMonth, !isUpcoming && styles.dateMonthPast]}>
                  {`Th${date.split('/')[1]}`}
                </Text>
              </View>
              {/* Content */}
              <View style={styles.apptContent}>
                <Text style={styles.apptFacility}>{appt.facility}</Text>
                <Text style={styles.apptDoctor}>{appt.doctor}</Text>
                <View style={styles.apptMeta}>
                  <Icon name="access_time" size={12} color={colors.onSurfaceVariant} />
                  <Text style={styles.apptMetaText}>{time} · {date}</Text>
                </View>
                {appt.notes && (
                  <Text style={styles.apptNotes} numberOfLines={1}>{appt.notes}</Text>
                )}
              </View>
              {/* Status badge */}
              <View style={[styles.statusBadge, isUpcoming ? styles.statusUpcoming : styles.statusPast]}>
                <Text style={[styles.statusText, isUpcoming ? styles.statusTextUpcoming : styles.statusTextPast]}>
                  {isUpcoming ? 'Sắp tới' : 'Đã qua'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <FAB iconName="add" onPress={() => navigation.navigate('AddAppointment', {})} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 16, gap: 12 },

  filterRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: colors.surfaceContainerHigh, borderRadius: 999,
  },
  filterChipActive: { backgroundColor: colors.primary },
  filterChipText: { fontSize: 13, fontFamily: 'Inter', fontWeight: '600', color: colors.onSurface },
  filterChipTextActive: { color: colors.onPrimary },

  emptyState: { alignItems: 'center', paddingVertical: 64, gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: 'Manrope', fontWeight: '700', color: colors.onSurface, marginTop: 8 },
  emptySubtitle: { fontSize: 13, fontFamily: 'Inter', color: colors.onSurfaceVariant },

  apptCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  },
  apptCardPast: { opacity: 0.7 },
  datePill: {
    width: 48, minHeight: 56, borderRadius: 12,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center', gap: 2,
    paddingVertical: 8,
  },
  datePillPast: { backgroundColor: colors.surfaceContainerHigh },
  dateDay: { fontSize: 20, fontFamily: 'Manrope', fontWeight: '800', color: colors.primary },
  dateDayPast: { color: colors.onSurfaceVariant },
  dateMonth: { fontSize: 11, fontFamily: 'Inter', fontWeight: '600', color: colors.primary },
  dateMonthPast: { color: colors.onSurfaceVariant },
  apptContent: { flex: 1, gap: 3 },
  apptFacility: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '700', color: colors.onSurface },
  apptDoctor: { fontSize: 13, fontFamily: 'Inter', color: colors.onSurfaceVariant },
  apptMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  apptMetaText: { fontSize: 12, fontFamily: 'Inter', color: colors.onSurfaceVariant },
  apptNotes: { fontSize: 12, fontFamily: 'Inter', color: colors.primary, marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  statusUpcoming: { backgroundColor: colors.tertiaryFixed },
  statusPast: { backgroundColor: colors.surfaceContainerHigh },
  statusText: { fontSize: 11, fontFamily: 'Inter', fontWeight: '700' },
  statusTextUpcoming: { color: colors.tertiary },
  statusTextPast: { color: colors.onSurfaceVariant },
});
