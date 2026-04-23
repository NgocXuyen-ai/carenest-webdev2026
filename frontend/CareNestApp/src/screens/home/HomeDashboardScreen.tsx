import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
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
import { colors } from '../../theme/colors';
import { BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import { CARENEST_LOGO_HOUSE } from '../../assets/branding';
import Icon from '../../components/common/Icon';
import Avatar from '../../components/common/Avatar';
import NotificationBell from '../../components/common/NotificationBell';
import type { HomeStackParamList, MainTabParamList } from '../../navigation/navigationTypes';
import { useAuth } from '../../context/AuthContext';
import { useFamily } from '../../context/FamilyContext';
import { getDashboard, type DashboardPayload } from '../../api/dashboard';
import { getAppointmentOverview } from '../../api/appointments';
import { getDailySchedule, takeDose } from '../../api/medicine';
import { getVaccinationTracker } from '../../api/vaccinations';
import { formatLocalDate } from '../../utils/dateTime';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'HomeDashboard'>,
  BottomTabNavigationProp<MainTabParamList>
>;

type BaseTask = {
  id: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  sortOrder: number;
};

type MedicineTask = BaseTask & {
  kind: 'medicine';
  doseId: number;
  isTaken: boolean;
  session: string;
};

type EventTask = BaseTask & {
  kind: 'event';
};

type TaskCard = MedicineTask | EventTask;

type DailyMedicineSection = {
  session: string;
  label?: string | null;
  items: Array<{
    doseId: number;
    medicineName: string;
    dosage: string;
    note?: string | null;
    isTaken: boolean;
  }>;
};

type ProfileContext = {
  profile?: { profileId?: number; fullName?: string };
  dailyMedicine?: {
    sections?: DailyMedicineSection[];
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
      doseNumber: number;
      plannedDate?: string | null;
      dateGiven?: string | null;
      clinicName?: string | null;
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

const SESSION_META: Record<string, { label: string; order: number; icon: string; bg: string; iconColor: string }> = {
  MORNING: { label: 'Buổi sáng', order: 10, icon: 'sunny', bg: '#FFF7CC', iconColor: '#D97706' },
  NOON: { label: 'Buổi trưa', order: 20, icon: 'schedule', bg: '#DBEAFE', iconColor: '#2563EB' },
  EVENING: { label: 'Buổi tối', order: 30, icon: 'bedtime', bg: '#EDE9FE', iconColor: '#7C3AED' },
};

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

function getDateKey(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return formatLocalDate(parsed);
}

function formatTimeLabel(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function joinTaskSubtitle(...parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(' · ');
}

function buildTodayTasks(
  context?: ProfileContext,
  todayKey?: string,
  includeProfileName = false,
): TaskCard[] {
  if (!context || !todayKey) {
    return [];
  }

  const profileName = context.profile?.fullName;
  const nextTasks: TaskCard[] = [];

  (context.dailyMedicine?.sections || []).forEach(section => {
    const sessionMeta = SESSION_META[section.session] || {
      label: section.label || section.session,
      order: 90,
      icon: 'schedule',
      bg: '#E2E8F0',
      iconColor: '#475569',
    };

    section.items.forEach((item, index) => {
      nextTasks.push({
        kind: 'medicine',
        id: `dose-${item.doseId}`,
        doseId: item.doseId,
        session: section.session,
        isTaken: item.isTaken,
        icon: 'pill',
        iconBg: '#EFF6FF',
        iconColor: '#2563EB',
        title: item.medicineName,
        subtitle: joinTaskSubtitle(
          includeProfileName ? profileName : null,
          item.dosage,
          item.note,
        ),
        sortOrder: sessionMeta.order + index,
      });
    });
  });

  (context.appointments?.upcomingAppointments || [])
    .filter(appointment => getDateKey(appointment.appointmentDate) === todayKey)
    .forEach((appointment, index) => {
      nextTasks.push({
        kind: 'event',
        id: `appt-${appointment.appointmentId}`,
        icon: 'calendar_month',
        iconBg: '#F0FDF4',
        iconColor: '#16A34A',
        title: appointment.title,
        subtitle: joinTaskSubtitle(
          includeProfileName ? profileName : null,
          formatTimeLabel(appointment.appointmentDate),
          appointment.location || appointment.doctorName,
        ),
        sortOrder: 100 + index,
      });
    });

  (context.vaccinations || [])
    .flatMap(group => group.vaccinations)
    .filter(item => item.status !== 'DONE' && getDateKey(item.plannedDate) === todayKey)
    .forEach((item, index) => {
      nextTasks.push({
        kind: 'event',
        id: `vac-${item.vaccineLogId}`,
        icon: 'syringe',
        iconBg: '#FFF7ED',
        iconColor: '#EA580C',
        title: `${item.vaccineName} - Mũi ${item.doseNumber}`,
        subtitle: joinTaskSubtitle(
          includeProfileName ? profileName : null,
          item.clinicName || 'Lịch tiêm trong ngày',
        ),
        sortOrder: 200 + index,
      });
    });

  return nextTasks.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, 'vi'));
}

function updateDoseStatusInContexts(contexts: ProfileContext[], doseId: number, isTaken: boolean): ProfileContext[] {
  return contexts.map(context => ({
    ...context,
    dailyMedicine: context.dailyMedicine
      ? {
          ...context.dailyMedicine,
          sections: (context.dailyMedicine.sections || []).map(section => ({
            ...section,
            items: section.items.map(item =>
              item.doseId === doseId ? { ...item, isTaken } : item,
            ),
          })),
        }
      : context.dailyMedicine,
  }));
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

    const todayKey = dashboard.generatedAt || formatLocalDate(new Date());

    if (dashboard.scopeType === 'FAMILY') {
      return profileContexts.flatMap(context => buildTodayTasks(context, todayKey, true));
    }

    return buildTodayTasks(selectedProfileContext, todayKey);
  }, [dashboard, profileContexts, selectedProfileContext]);

  const medicineTasks = useMemo(
    () => tasks.filter((task): task is MedicineTask => task.kind === 'medicine'),
    [tasks],
  );

  const otherTasks = useMemo(
    () => tasks.filter((task): task is EventTask => task.kind === 'event'),
    [tasks],
  );

  const medicineTasksBySession = useMemo(
    () =>
      Object.keys(SESSION_META).map(sessionKey => ({
        sessionKey,
        meta: SESSION_META[sessionKey],
        items: medicineTasks.filter(task => task.session === sessionKey),
      })),
    [medicineTasks],
  );

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

  const handleToggleTaken = useCallback(
    async (task: MedicineTask) => {
      const nextIsTaken = !task.isTaken;

      setDashboard(prev => {
        if (!prev) {
          return prev;
        }

        const nextContexts = updateDoseStatusInContexts(
          (prev.profileContexts || []) as ProfileContext[],
          task.doseId,
          nextIsTaken,
        );

        return {
          ...prev,
          profileContexts: nextContexts as Array<Record<string, unknown>>,
        };
      });

      try {
        await takeDose({ doseId: task.doseId, isTaken: nextIsTaken });
        await loadDashboard();
      } catch (error) {
        setDashboard(prev => {
          if (!prev) {
            return prev;
          }

          const revertedContexts = updateDoseStatusInContexts(
            (prev.profileContexts || []) as ProfileContext[],
            task.doseId,
            task.isTaken,
          );

          return {
            ...prev,
            profileContexts: revertedContexts as Array<Record<string, unknown>>,
          };
        });

        Alert.alert(
          'Không thể cập nhật thuốc',
          error instanceof Error ? error.message : 'Đã có lỗi xảy ra',
        );
      }
    },
    [loadDashboard],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.brandLeft}>
          <Image source={CARENEST_LOGO_HOUSE} style={styles.brandGlyph} resizeMode="contain" />
          <Text style={styles.logoText}>CareNest</Text>
        </View>
        <View style={styles.headerActions}>
          <Avatar uri={user?.avatarUrl} name={user?.fullName || 'CareNest'} size="sm" bordered />
          <NotificationBell iconColor={colors.onSurfaceVariant} hasNotification={unreadCount > 0} />
        </View>
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
                {unreadCount > 0 ? 'Có việc cần chú ý' : 'Mọi thứ đều ổn'}
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
              <Text style={styles.moduleValue}>{medicineTasks.length}</Text>
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
                  Dashboard sẽ tự cập nhật khi có lịch thuốc, lịch khám hoặc lịch tiêm nếu có.
                </Text>
              </View>
            </View>
          ) : (
            <>
              {medicineTasksBySession.map(group => (
                group.items.length > 0 ? (
                  <View key={group.sessionKey} style={styles.sessionBlock}>
                    <View style={styles.sessionHeader}>
                      <View style={[styles.sessionIconWrap, { backgroundColor: group.meta.bg }]}>
                        <Icon name={group.meta.icon} size={18} color={group.meta.iconColor} />
                      </View>
                      <Text style={styles.sessionTitle}>{group.meta.label}</Text>
                    </View>

                    <View style={[styles.sessionCard, shadows.sm]}>
                      {group.items.map((task, index) => (
                        <TouchableOpacity
                          key={task.id}
                          style={[
                            styles.medicineTaskRow,
                            index < group.items.length - 1 && styles.medicineTaskDivider,
                            task.isTaken && styles.medicineTaskDone,
                          ]}
                          onPress={() => void handleToggleTaken(task)}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.checkCircle, task.isTaken && styles.checkCircleActive]}>
                            {task.isTaken ? <Icon name="check" size={14} color="#fff" /> : null}
                          </View>
                          <View style={styles.taskInfo}>
                            <Text style={[styles.taskTitle, task.isTaken && styles.taskTitleDone]}>
                              {task.title}
                            </Text>
                            <Text style={styles.taskTime}>{task.subtitle}</Text>
                          </View>
                          <View style={[styles.statusBadge, task.isTaken ? styles.statusBadgeDone : styles.statusBadgePending]}>
                            <Text style={[styles.statusBadgeText, task.isTaken ? styles.statusBadgeTextDone : styles.statusBadgeTextPending]}>
                              {task.isTaken ? 'Đã uống' : 'Chưa uống'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : null
              ))}

              {otherTasks.length > 0 ? (
                <View style={styles.otherTasksBlock}>
                  {otherTasks.map(task => (
                    <View key={task.id} style={styles.taskCard}>
                      <View style={[styles.taskIconWrap, { backgroundColor: task.iconBg }]}>
                        <Icon name={task.icon} size={24} color={task.iconColor} />
                      </View>
                      <View style={styles.taskInfo}>
                        <Text style={styles.taskTitle}>{task.title}</Text>
                        <Text style={styles.taskTime}>{task.subtitle}</Text>
                      </View>
                      <Icon name="chevron_right" size={20} color="#94A3B8" />
                    </View>
                  ))}
                </View>
              ) : null}
            </>
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  sessionBlock: { gap: 10, marginBottom: 16 },
  sessionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sessionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionTitle: {
    fontSize: 15,
    fontFamily: 'Manrope',
    fontWeight: '800',
    color: '#1E293B',
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  medicineTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  medicineTaskDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  medicineTaskDone: { opacity: 0.72 },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#64748B',
  },
  taskTime: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: '#64748B',
    marginTop: 2,
    lineHeight: 19,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusBadgeDone: { backgroundColor: '#DCFCE7' },
  statusBadgePending: { backgroundColor: '#EEF2FF' },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter',
    fontWeight: '800',
  },
  statusBadgeTextDone: { color: '#166534' },
  statusBadgeTextPending: { color: '#4F46E5' },
  otherTasksBlock: { marginTop: 4 },
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
