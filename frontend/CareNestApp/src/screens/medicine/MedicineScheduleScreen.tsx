import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
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
import { getMedicineSchedules, type MedicineScheduleItem } from '../../api/medicine';
import { useFamily } from '../../context/FamilyContext';
import { useAuth } from '../../context/AuthContext';

type Nav = NativeStackNavigationProp<any, 'MedicineSchedule'>;

const SESSION_LABELS: Record<string, string> = {
  MORNING: 'Buổi sáng',
  NOON: 'Buổi trưa',
  EVENING: 'Buổi tối',
};

function formatDate(value?: string | null): string {
  if (!value) {
    return 'Chưa có ngày';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('vi-VN');
}

function formatSessions(sessions?: string[]): string {
  if (!sessions?.length) {
    return 'Chưa có buổi uống';
  }

  return sessions.map(session => SESSION_LABELS[session] || session).join(', ');
}

export default function MedicineScheduleScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { selectedProfileId } = useFamily();
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<MedicineScheduleItem[]>([]);

  const memberId = route.params?.memberId as string | undefined;
  const activeProfileId = memberId
    ? Number(memberId)
    : selectedProfileId || (user?.profileId ? Number(user.profileId) : null);

  const loadSchedules = useCallback(async () => {
    if (!activeProfileId) {
      setSchedules([]);
      return;
    }

    await getMedicineSchedules(activeProfileId)
      .then(setSchedules)
      .catch(() => setSchedules([]));
  }, [activeProfileId]);

  useFocusEffect(
    useCallback(() => {
      void loadSchedules();
      return undefined;
    }, [loadSchedules]),
  );

  const profileName = useMemo(
    () => schedules[0]?.profileName || 'Lịch thuốc',
    [schedules],
  );

  return (
    <View style={styles.root}>
      <TopAppBar variant="detail" title="Lịch thuốc" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: TOP_BAR_HEIGHT + insets.top + 16, paddingBottom: BOTTOM_NAV_HEIGHT + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconWrap}>
            <Icon name="pill" size={22} color="#fff" />
          </View>
          <View style={styles.summaryTextWrap}>
            <Text style={styles.summaryTitle}>{profileName}</Text>
            <Text style={styles.summarySubtitle}>
              {schedules.length > 0
                ? `${schedules.length} lịch thuốc đang được theo dõi`
                : 'Chưa có lịch thuốc nào được tạo'}
            </Text>
          </View>
        </View>

        {schedules.length === 0 ? (
          <View style={[styles.emptyCard, shadows.sm]}>
            <Icon name="medication" size={26} color={colors.outlineVariant} />
            <Text style={styles.emptyTitle}>Chưa có lịch thuốc</Text>
            <Text style={styles.emptyText}>
              Khi bạn tạo lịch mới, thông tin thuốc, liều dùng và thời gian áp dụng sẽ hiển thị ở đây.
            </Text>
          </View>
        ) : (
          schedules.map(schedule => (
            <View key={schedule.scheduleId} style={[styles.scheduleCard, shadows.sm]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.medicineName}>{schedule.medicineName}</Text>
                  <Text style={styles.profileChip}>{schedule.profileName}</Text>
                </View>
                <View style={styles.frequencyBadge}>
                  <Text style={styles.frequencyBadgeText}>{schedule.frequency} lần/ngày</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Icon name="medication" size={16} color={colors.primary} />
                <Text style={styles.metaText}>Liều dùng: {schedule.dosage}</Text>
              </View>

              <View style={styles.metaRow}>
                <Icon name="schedule" size={16} color={colors.primary} />
                <Text style={styles.metaText}>Buổi uống: {formatSessions(schedule.sessions)}</Text>
              </View>

              <View style={styles.metaRow}>
                <Icon name="calendar_month" size={16} color={colors.primary} />
                <Text style={styles.metaText}>
                  Thời gian: {formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}
                </Text>
              </View>

              {schedule.note ? (
                <View style={styles.noteBox}>
                  <Text style={styles.noteLabel}>Ghi chú</Text>
                  <Text style={styles.noteText}>{schedule.note}</Text>
                </View>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
      <FAB
        iconName="add"
        onPress={() => navigation.navigate('AddMedicineSchedule', memberId ? { memberId } : {})}
        bottomOffset={BOTTOM_NAV_HEIGHT - 55}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 16, gap: 16 },
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  summaryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextWrap: { flex: 1, gap: 4 },
  summaryTitle: { fontSize: 18, fontFamily: 'Manrope', fontWeight: '800', color: '#fff' },
  summarySubtitle: { fontSize: 13, fontFamily: 'Inter', color: 'rgba(255,255,255,0.88)' },
  emptyCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontFamily: 'Manrope', fontWeight: '800', color: colors.onSurface },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
  scheduleCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardHeaderText: { flex: 1, gap: 6 },
  medicineName: { fontSize: 17, fontFamily: 'Manrope', fontWeight: '800', color: colors.onSurface },
  profileChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    color: '#0369A1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 11,
    fontFamily: 'Inter',
    fontWeight: '700',
  },
  frequencyBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  frequencyBadgeText: { fontSize: 11, fontFamily: 'Inter', fontWeight: '800', color: '#4338CA' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaText: { flex: 1, fontSize: 13, fontFamily: 'Inter', color: colors.onSurfaceVariant, lineHeight: 20 },
  noteBox: {
    marginTop: 2,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  noteLabel: { fontSize: 11, fontFamily: 'Inter', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' },
  noteText: { fontSize: 13, fontFamily: 'Inter', color: colors.onSurface, lineHeight: 20 },
});
