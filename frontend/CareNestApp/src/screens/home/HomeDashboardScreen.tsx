import React, { useCallback, useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { shadows } from '../../theme/spacing';
import { BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import { CARENEST_LOGO_HOUSE } from '../../assets/branding';
import Icon from '../../components/common/Icon';
import Avatar from '../../components/common/Avatar';
import type { HomeStackParamList, MainTabParamList } from '../../navigation/navigationTypes';
import { useAuth } from '../../context/AuthContext';
import { useFamily } from '../../context/FamilyContext';
import { getDashboard, type DashboardPayload } from '../../api/dashboard';
import { getAppointmentOverview } from '../../api/appointments';
import { getDailySchedule } from '../../api/medicine';
import { getVaccinationTracker } from '../../api/vaccinations';
import { formatLocalDate } from '../../utils/dateTime';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'HomeDashboard'>,
  BottomTabNavigationProp<MainTabParamList>
>;

type TaskCard = {
  id: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  badge?: string;
};

type ProfileContext = {
  profile?: { profileId?: number; fullName?: string };
  dailyMedicine?: {
    sections?: Array<{
      session: string;
      items: Array<{
        doseId: number;
        medicineName: string;
        dosage: string;
        isTaken: boolean;
      }>;
    }>;
  };
  appointments?: {
    upcomingAppointments?: Array<{
      appointmentId: number;
      title: string;
      appointmentDate: string;
      location?: string | null;
      doctorName?: string | null;
    }>;
  };
  vaccinations?: Array<{
    stageLabel: string;
    vaccinations: Array<{
      vaccineLogId: number;
      vaccineName: string;
      plannedDate?: string | null;
      dateGiven?: string | null;
      status: string;
    }>;
  }>;
};

const AI_SUMMARY_FALLBACK =
  'CareNest AI sẽ tóm tắt nhanh các việc cần chú ý trong ngày của gia đình bạn.';

const AI_SUMMARY_NORMALIZERS: Array<{ pattern: RegExp; value: string }> = [
  {
    pattern:
      /^hom nay chua co canh bao lon\.? ban co the kiem tra lich thuoc, lich kham va hoi carenest ai neu can tra cuu nhanh\.?$/i,
    value:
      'Hôm nay chưa có cảnh báo lớn. Bạn có thể kiểm tra lịch thuốc, lịch khám và hỏi CareNest AI nếu cần tra cứu nhanh.',
  },
  {
    pattern:
      /^che do ca nha dang tong hop suc khoe cua toan bo thanh vien\.? ban co the xem nhac nho, lich kham va hoi carenest ai de tra cuu nhanh\.?$/i,
    value:
      'Chế độ Cả nhà đang tổng hợp sức khỏe của toàn bộ thành viên. Bạn có thể xem nhắc nhở, lịch khám và hỏi CareNest AI để tra cứu nhanh.',
  },
];

function normalizeAiSummaryText(summary?: string | null): string {
  if (!summary || !summary.trim()) {
    return AI_SUMMARY_FALLBACK;
  }

  const trimmed = summary.trim();
  const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ');

  for (const item of AI_SUMMARY_NORMALIZERS) {
    if (item.pattern.test(normalized)) {
      return item.value;
    }
  }

  return trimmed;
}

function buildTasks(context?: ProfileContext): TaskCard[] {
  if (!context) {
    return [];
  }

  const nextTasks: TaskCard[] = [];
  const medicineSections = context.dailyMedicine?.sections || [];
  const firstDose = medicineSections.flatMap(section =>
    section.items.map(item => ({
      id: `dose-${item.doseId}`,
      icon: 'pill',
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
      title: item.medicineName,
      subtitle: `${section.session} · ${item.dosage}`,
      badge: item.isTaken ? 'ĐÃ UỐNG' : 'CHƯA UỐNG',
    })),
  )[0];

  if (firstDose) {
    nextTasks.push(firstDose);
  }

  const nextAppointment = context.appointments?.upcomingAppointments?.[0];
  if (nextAppointment) {
    nextTasks.push({
      id: `appt-${nextAppointment.appointmentId}`,
      icon: 'calendar_month',
      iconBg: '#F0FDF4',
      iconColor: '#16A34A',
      title: nextAppointment.title,
      subtitle: new Date(nextAppointment.appointmentDate).toLocaleString('vi-VN'),
    });
  }

  const nextVaccination = context.vaccinations
    ?.flatMap(group => group.vaccinations)
    .find(item => item.status !== 'DONE');

  if (nextVaccination) {
    nextTasks.push({
      id: `vac-${nextVaccination.vaccineLogId}`,
      icon: 'syringe',
      iconBg: '#FFF7ED',
      iconColor: '#EA580C',
      title: nextVaccination.vaccineName,
      subtitle:
        nextVaccination.plannedDate ||
        nextVaccination.dateGiven ||
        'Theo dõi lịch tiêm',
    });
  }

  return nextTasks;
}

export default function HomeDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { members, selectedProfileId, setSelectedProfileId } = useFamily();
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);

  const loadDashboard = useCallback(async () => {
    await getDashboard(selectedProfileId || undefined)
      .then(setDashboard)
      .catch(() => setDashboard(null));
  }, [selectedProfileId]);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
      return undefined;
    }, [loadDashboard]),
  );

  const profileContexts = useMemo(
    () => (dashboard?.profileContexts || []) as ProfileContext[],
    [dashboard],
  );

  const selectedProfileContext = useMemo(
    () =>
      profileContexts.find(item => {
        const profile = item.profile as { profileId?: number } | undefined;
        return profile?.profileId === dashboard?.selectedProfileId;
      }),
    [dashboard?.selectedProfileId, profileContexts],
  );

  const tasks = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    if (dashboard.scopeType === 'FAMILY') {
      return profileContexts.flatMap(context => buildTasks(context)).slice(0, 4);
    }

    return buildTasks(selectedProfileContext);
  }, [dashboard, profileContexts, selectedProfileContext]);

  const unreadCount = dashboard?.unreadNotificationCount ?? 0;
  const aiSummaryText = normalizeAiSummaryText(dashboard?.aiSummary);
  const selectedProfileRouteId = String(
    selectedProfileId || user?.profileId || members[0]?.profileId || '',
  );
  const activeShortcutProfileId = Number(selectedProfileRouteId);

  const prefetchMedicineSchedule = useCallback(() => {
    if (!Number.isFinite(activeShortcutProfileId) || activeShortcutProfileId <= 0) {
      return;
    }

    const today = formatLocalDate(new Date());
    void getDailySchedule(activeShortcutProfileId, today);
  }, [activeShortcutProfileId]);

  const prefetchAppointments = useCallback(() => {
    if (!Number.isFinite(activeShortcutProfileId) || activeShortcutProfileId <= 0) {
      return;
    }

    void getAppointmentOverview(activeShortcutProfileId);
  }, [activeShortcutProfileId]);

  const prefetchVaccinations = useCallback(() => {
    if (!Number.isFinite(activeShortcutProfileId) || activeShortcutProfileId <= 0) {
      return;
    }

    void getVaccinationTracker(activeShortcutProfileId);
  }, [activeShortcutProfileId]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.brandLeft}>
          <Image source={CARENEST_LOGO_HOUSE} style={styles.brandGlyph} resizeMode="contain" />
          <Text style={styles.logoText}>CareNest</Text>
        </View>
        <Avatar uri={user?.avatarUrl} name={user?.fullName || 'CareNest'} size="sm" bordered />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetingSection}>
          <Text style={styles.greetingTitle}>
            Xin chào, {user?.fullName || 'bạn'}!
          </Text>
          <Text style={styles.greetingSubtitle}>
            Hy vọng gia đình mình có một ngày khỏe mạnh.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THÀNH VIÊN</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.memberList}
          >
            <TouchableOpacity
              style={[styles.memberPill, selectedProfileId === null && styles.memberPillActive]}
              onPress={() => setSelectedProfileId(null)}
            >
              <Text
                style={[
                  styles.memberPillText,
                  selectedProfileId === null && styles.memberPillTextActive,
                ]}
              >
                Cả nhà
              </Text>
            </TouchableOpacity>
            {members.map(member => (
              <TouchableOpacity
                key={member.profileId}
                style={[
                  styles.memberPill,
                  selectedProfileId === member.profileId && styles.memberPillActive,
                ]}
                onPress={() => setSelectedProfileId(member.profileId)}
              >
                <Text
                  style={[
                    styles.memberPillText,
                    selectedProfileId === member.profileId && styles.memberPillTextActive,
                  ]}
                >
                  {member.fullName.split(' ').pop()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.shortcutGrid}>
          <TouchableOpacity
            style={styles.shortcutCard}
            onPressIn={prefetchMedicineSchedule}
            onPress={() => navigation.navigate('MedicineSchedule')}
          >
            <View style={[styles.shortcutIconWrap, { backgroundColor: '#E0F2FE' }]}>
              <Icon name="pill" size={26} color="#0EA5E9" />
            </View>
            <Text style={styles.shortcutLabel}>Lịch thuốc</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shortcutCard}
            onPressIn={prefetchAppointments}
            onPress={() => navigation.navigate('AppointmentList')}
          >
            <View style={[styles.shortcutIconWrap, { backgroundColor: '#F3E8FF' }]}>
              <Icon name="calendar_month" size={26} color="#A855F7" />
            </View>
            <Text style={styles.shortcutLabel}>Lịch hẹn</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shortcutCard}
            onPressIn={prefetchVaccinations}
            onPress={() =>
              navigation.navigate('VaccinationTracker', { memberId: selectedProfileRouteId })
            }
          >
            <View style={[styles.shortcutIconWrap, { backgroundColor: '#E0F7FA' }]}>
              <Icon name="syringe" size={26} color="#0097A7" />
            </View>
            <Text style={styles.shortcutLabel}>Tiêm chủng</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.heroCard, shadows.lg]}>
          <View style={StyleSheet.absoluteFill}>
            <Svg height="100%" width="100%">
              <Defs>
                <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#007BFF" />
                  <Stop offset="100%" stopColor="#0047AB" />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#grad)" />
            </Svg>
          </View>

          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroDate}>
                {dashboard?.generatedAt || new Date().toLocaleDateString('vi-VN')}
              </Text>
              <Text style={styles.heroStatus}>
                {unreadCount > 0
                  ? 'Có việc cần chú ý'
                  : 'Mọi thứ đều ổn'}
              </Text>
            </View>
            <Icon name="sunny" size={40} color="rgba(255,255,255,0.8)" />
          </View>

          <View style={styles.glassStatsRow}>
            <View style={styles.glassModule}>
              <Icon name="group" size={18} color="#fff" />
              <Text
                style={styles.moduleLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                Thành viên
              </Text>
              <Text style={styles.moduleValue}>{members.length}</Text>
            </View>
            <View style={styles.glassModule}>
              <Icon name="notifications" size={18} color="#fff" />
              <Text
                style={styles.moduleLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                Nhắc nhở
              </Text>
              <Text style={styles.moduleValue}>{unreadCount}</Text>
            </View>
            <View style={styles.glassModule}>
              <Icon name="pill" size={18} color="#fff" />
              <Text
                style={styles.moduleLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                Thuốc hôm nay
              </Text>
              <Text style={styles.moduleValue}>
                {tasks.filter(task => task.icon === 'pill').length}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>HÔM NAY CẦN LÀM</Text>
          </View>

          {tasks.length === 0 ? (
            <View style={styles.taskCard}>
              <View style={[styles.taskIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <Icon name="check_circle" size={24} color="#2563EB" />
              </View>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>Chưa có việc nào cần xử lý</Text>
                <Text style={styles.taskTime}>
                  Dashboard sẽ tự cập nhật khi có lịch thuốc, khám
                  hoặc tiêm chủng.
                </Text>
              </View>
            </View>
          ) : (
            tasks.map(task => (
              <View key={task.id} style={styles.taskCard}>
                <View style={[styles.taskIconWrap, { backgroundColor: task.iconBg }]}>
                  <Icon name={task.icon} size={24} color={task.iconColor} />
                </View>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskTime}>{task.subtitle}</Text>
                </View>
                {task.badge ? (
                  <View style={styles.tagChuaUong}>
                    <Text style={styles.tagText}>{task.badge}</Text>
                  </View>
                ) : (
                  <Icon name="chevron_right" size={20} color="#94A3B8" />
                )}
              </View>
            ))
          )}
        </View>

        <View style={[styles.aiAdvisorCard, { backgroundColor: '#E1F5FE' }]}>
          <View style={styles.aiHeader}>
            <View style={styles.aiAvatar}>
              <Image source={CARENEST_LOGO_HOUSE} style={styles.aiAvatarIcon} resizeMode="contain" />
            </View>
            <Text style={styles.aiLabel}>AI CỐ VẤN</Text>
          </View>
          <Text style={styles.aiAdviceText}>
            "
            {aiSummaryText}
            "
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 15,
  },
  brandLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandGlyph: { width: 22, height: 22 },
  logoText: {
    fontSize: 22,
    fontFamily: 'Manrope',
    fontWeight: '800',
    color: '#0047AB',
    letterSpacing: -0.5,
  },
  scroll: { paddingHorizontal: 20, paddingTop: 10 },
  greetingSection: { marginBottom: 24 },
  greetingTitle: {
    fontSize: 26,
    fontFamily: 'Manrope',
    fontWeight: '800',
    color: '#1E293B',
  },
  greetingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#64748B',
    marginTop: 4,
  },
  section: { marginBottom: 24 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  memberList: { paddingBottom: 5, gap: 12 },
  memberPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
  },
  memberPillActive: {
    backgroundColor: '#0047AB',
    ...shadows.sm,
  },
  memberPillText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#475569',
  },
  memberPillTextActive: { color: '#fff' },
  shortcutGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  shortcutCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.sm,
  },
  shortcutIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  shortcutLabel: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#1E293B',
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
    height: 240,
    justifyContent: 'space-between',
    overflow: 'hidden',
    marginBottom: 24,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroDate: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: 'rgba(255,255,255,0.7)',
  },
  heroStatus: {
    fontSize: 28,
    fontFamily: 'Manrope',
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
  },
  glassStatsRow: { flexDirection: 'row', gap: 10 },
  glassModule: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    gap: 4,
  },
  moduleLabel: {
    fontSize: 9,
    fontFamily: 'Inter',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    textAlign: 'center',
    width: '100%',
  },
  moduleValue: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#fff',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.sm,
  },
  taskIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  taskInfo: { flex: 1 },
  taskTitle: {
    fontSize: 15,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#1E293B',
  },
  taskTime: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: '#64748B',
    marginTop: 2,
  },
  tagChuaUong: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 10,
    fontFamily: 'Inter',
    fontWeight: '800',
    color: '#4F46E5',
  },
  aiAdvisorCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 71, 171, 0.05)',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#0047AB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAvatarIcon: { width: 20, height: 20 },
  aiLabel: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '800',
    color: '#0047AB',
    letterSpacing: 1,
  },
  aiAdviceText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#1E293B',
    fontStyle: 'italic',
    lineHeight: 22,
  },
});
