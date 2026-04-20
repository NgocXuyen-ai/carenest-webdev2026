import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { TOP_BAR_HEIGHT, BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import Icon from '../../components/common/Icon';
import TopAppBar from '../../components/layout/TopAppBar';
import FAB from '../../components/common/FAB';
import type { HomeStackParamList } from '../../navigation/navigationTypes';
import { getAppointmentOverview, type AppointmentOverview } from '../../api/appointments';
import { useFamily } from '../../context/FamilyContext';
import { useAuth } from '../../context/AuthContext';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'AppointmentList'>;
type FilterKey = 'all' | 'upcoming' | 'past';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'upcoming', label: 'Sắp tới' },
  { key: 'past', label: 'Đã qua' },
];

export default function AppointmentListScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { selectedProfileId } = useFamily();
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [overview, setOverview] = useState<AppointmentOverview | null>(null);
  const memberId = route.params?.memberId as string | undefined;

  const activeProfileId = memberId
    ? Number(memberId)
    : selectedProfileId || (user?.profileId ? Number(user.profileId) : null);

  const loadOverview = useCallback(async () => {
    if (!activeProfileId) {
      setOverview(null);
      return;
    }

    await getAppointmentOverview(activeProfileId)
      .then(setOverview)
      .catch(() => setOverview(null));
  }, [activeProfileId]);

  useFocusEffect(
    useCallback(() => {
      void loadOverview();
      return undefined;
    }, [loadOverview]),
  );

  const appointments = useMemo(() => {
    const upcoming = (overview?.upcomingAppointments || []).map(item => ({ ...item, kind: 'upcoming' as const }));
    const history = (overview?.appointmentHistory || []).map(item => ({ ...item, kind: 'past' as const }));
    const merged = [...upcoming, ...history];
    if (filter === 'all') return merged;
    return merged.filter(item => item.kind === filter);
  }, [overview, filter]);

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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map(item => (
            <TouchableOpacity
              key={item.key}
              style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[styles.filterChipText, filter === item.key && styles.filterChipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {appointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="calendar_month" size={56} color={colors.outlineVariant} />
            <Text style={styles.emptyTitle}>Không có lịch nào</Text>
            <Text style={styles.emptySubtitle}>Nhấn + để thêm lịch tái khám mới</Text>
          </View>
        ) : (
          appointments.map(item => {
            const appointmentDate = 'appointmentDate' in item ? item.appointmentDate : '';
            const date = appointmentDate ? new Date(appointmentDate) : null;
            const day = date ? String(date.getDate()).padStart(2, '0') : '--';
            const month = date ? `Th${String(date.getMonth() + 1).padStart(2, '0')}` : '--';
            const meta = item.kind === 'past'
              ? item.displayDate
              : (date ? date.toLocaleString('vi-VN') : '');
            return (
              <View key={`${item.kind}-${item.appointmentId}`} style={[styles.apptCard, shadows.sm, item.kind === 'past' && styles.apptCardPast]}>
                <View style={[styles.datePill, item.kind === 'past' && styles.datePillPast]}>
                  <Text style={[styles.dateDay, item.kind === 'past' && styles.dateDayPast]}>{day}</Text>
                  <Text style={[styles.dateMonth, item.kind === 'past' && styles.dateMonthPast]}>{month}</Text>
                </View>
                <View style={styles.apptContent}>
                  <Text style={styles.apptFacility}>{item.title}</Text>
                  {'doctorName' in item ? <Text style={styles.apptDoctor}>{item.doctorName}</Text> : null}
                  <View style={styles.apptMeta}>
                    <Icon name="access_time" size={12} color={colors.onSurfaceVariant} />
                    <Text style={styles.apptMetaText}>{meta}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, item.kind === 'upcoming' ? styles.statusUpcoming : styles.statusPast]}>
                  <Text style={[styles.statusText, item.kind === 'upcoming' ? styles.statusTextUpcoming : styles.statusTextPast]}>
                    {item.kind === 'upcoming' ? 'Sắp tới' : 'Đã qua'}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
      <FAB
        iconName="add"
        onPress={() => navigation.navigate('AddAppointment', memberId ? { memberId } : {})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 16, gap: 12 },
  filterRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.surfaceContainerHigh, borderRadius: 999 },
  filterChipActive: { backgroundColor: colors.primary },
  filterChipText: { fontSize: 13, fontFamily: 'Inter', fontWeight: '600', color: colors.onSurface },
  filterChipTextActive: { color: colors.onPrimary },
  emptyState: { alignItems: 'center', paddingVertical: 64, gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: 'Manrope', fontWeight: '700', color: colors.onSurface, marginTop: 8 },
  emptySubtitle: { fontSize: 13, fontFamily: 'Inter', color: colors.onSurfaceVariant },
  apptCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  apptCardPast: { opacity: 0.7 },
  datePill: { width: 48, minHeight: 56, borderRadius: 12, backgroundColor: colors.primaryFixed, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 8 },
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
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  statusUpcoming: { backgroundColor: colors.tertiaryFixed },
  statusPast: { backgroundColor: colors.surfaceContainerHigh },
  statusText: { fontSize: 11, fontFamily: 'Inter', fontWeight: '700' },
  statusTextUpcoming: { color: colors.tertiary },
  statusTextPast: { color: colors.onSurfaceVariant },
});
