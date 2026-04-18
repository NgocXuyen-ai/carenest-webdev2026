import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { TOP_BAR_HEIGHT, BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import Icon from '../../components/common/Icon';
import TopAppBar from '../../components/layout/TopAppBar';
import { mockFamilyMembers } from '../../data/mockFamilyMembers';
import { mockMedicineSchedule } from '../../data/mockMedicineSchedule';
import { mockAppointments } from '../../data/mockAppointments';
import { mockMedicines } from '../../data/mockMedicines';
import type { HomeStackParamList } from '../../navigation/navigationTypes';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'HomeDashboard'>;

const ROLE_ICONS: Record<string, string> = {
  'Mẹ': '👩',
  'Bố': '👨',
  'Con': '👦',
  'Bà': '👵',
  'Ông': '👴',
};

export default function HomeDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const expiredMeds = mockMedicines.filter(m => m.status === 'expired' || m.status === 'expiring');
  const todaySchedule = mockMedicineSchedule.filter(s =>
    selectedMemberId ? s.profileId === selectedMemberId : true
  );
  const upcomingAppts = mockAppointments.filter(a => a.status === 'upcoming');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <TopAppBar
        variant="home"
        userName="Lan Anh"
        notificationCount={3}
        onNotificationsPress={() => navigation.navigate('NotificationsCenter')}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: TOP_BAR_HEIGHT + insets.top + 16, paddingBottom: BOTTOM_NAV_HEIGHT + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingTitle}>Xin chào, Lan Anh!</Text>
          <Text style={styles.greetingSubtitle}>Hy vọng gia đình mình có một ngày khỏe mạnh 🌿</Text>
        </View>

        {/* Family member chips */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>THÀNH VIÊN</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.memberChipsRow}
          >
            <TouchableOpacity
              style={[styles.memberChip, selectedMemberId === null && styles.memberChipActive]}
              onPress={() => setSelectedMemberId(null)}
              activeOpacity={0.8}
            >
              <Text style={[styles.memberChipText, selectedMemberId === null && styles.memberChipTextActive]}>
                Cả nhà
              </Text>
            </TouchableOpacity>
            {mockFamilyMembers.map(member => (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.memberChip,
                  selectedMemberId === member.profileId && styles.memberChipActive,
                ]}
                onPress={() => setSelectedMemberId(
                  selectedMemberId === member.profileId ? null : member.profileId
                )}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.memberChipText,
                  selectedMemberId === member.profileId && styles.memberChipTextActive,
                ]}>
                  {ROLE_ICONS[member.role] ?? '👤'} {member.fullName.split(' ').pop()}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.addMemberChip} activeOpacity={0.8}>
              <Icon name="add" size={20} color={colors.primary} />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Hero summary card */}
        <View style={[styles.heroCard, shadows.lg]}>
          <View style={styles.heroOverlayIcon}>
            <Icon name="cloud_done" size={60} color="rgba(255,255,255,0.2)" />
          </View>
          <View style={styles.heroContent}>
            <View>
              <Text style={styles.heroDate}>Thứ Ba, 15 Tháng 4</Text>
              <Text style={styles.heroTitle}>Mọi thứ đều ổn</Text>
            </View>
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Icon name="thermometer" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroStatLabel}>Nhiệt độ</Text>
                <Text style={styles.heroStatValue}>36.5°C</Text>
              </View>
              <View style={styles.heroStat}>
                <Icon name="favorite" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroStatLabel}>Nhịp tim</Text>
                <Text style={styles.heroStatValue}>72 bpm</Text>
              </View>
              <View style={styles.heroStat}>
                <Icon name="steps" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroStatLabel}>Vận động</Text>
                <Text style={styles.heroStatValue}>4.2k b</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Alerts */}
        {expiredMeds.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CẢNH BÁO</Text>
            {expiredMeds.slice(0, 2).map(med => (
              <TouchableOpacity key={med.id} style={styles.alertCard} activeOpacity={0.85}>
                <View style={styles.alertIconWrap}>
                  <Icon name="warning" size={22} color={colors.onErrorContainer} />
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>
                    {med.status === 'expired' ? 'Thuốc đã hết hạn' : 'Thuốc sắp hết hạn'}
                  </Text>
                  <Text style={styles.alertDesc} numberOfLines={1}>
                    {med.name}{med.notes ? ` — ${med.notes}` : ''}
                  </Text>
                </View>
                <Icon name="chevron_right" size={20} color={colors.onErrorContainer + '80'} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Today's tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>HÔM NAY CẦN LÀM</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {todaySchedule.slice(0, 3).map(sched => (
            <View key={sched.id} style={styles.taskCard}>
              <View style={[styles.taskIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <Icon name="pill" size={26} color="#2563EB" />
              </View>
              <View style={styles.taskContent}>
                <Text style={styles.taskTitle}>{sched.name}</Text>
                <Text style={styles.taskSubtitle}>{sched.instruction} — {sched.times[0]}</Text>
              </View>
              {sched.taken ? (
                <View style={styles.takenBadge}>
                  <Text style={styles.takenBadgeText}>✓ Đã uống</Text>
                </View>
              ) : (
                <View style={styles.notTakenBadge}>
                  <Text style={styles.notTakenBadgeText}>Chưa uống</Text>
                </View>
              )}
            </View>
          ))}

          {upcomingAppts.slice(0, 1).map(appt => (
            <TouchableOpacity
              key={appt.id}
              style={styles.taskCard}
              onPress={() => navigation.navigate('AppointmentList')}
              activeOpacity={0.85}
            >
              <View style={[styles.taskIconWrap, { backgroundColor: colors.tertiaryFixed }]}>
                <Icon name="calendar_month" size={26} color={colors.tertiary} />
              </View>
              <View style={styles.taskContent}>
                <Text style={styles.taskTitle}>{appt.notes ?? 'Lịch tái khám'}</Text>
                <Text style={styles.taskSubtitle} numberOfLines={1}>{appt.facility}</Text>
              </View>
              <Icon name="chevron_right" size={20} color={colors.outlineVariant} />
            </TouchableOpacity>
          ))}
        </View>

        {/* AI insight */}
        <View style={styles.aiCard}>
          <View style={styles.aiAvatarWrap}>
            <Icon name="smart_toy" size={20} color="#fff" />
          </View>
          <View style={styles.aiContent}>
            <Text style={styles.aiLabel}>AI CỐ VẤN</Text>
            <Text style={styles.aiText}>
              "Bà An có dấu hiệu mệt mỏi vào buổi chiều, bạn nên kiểm tra huyết áp cho bà nhé."
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 20, gap: 20 },
  greeting: { gap: 4 },
  greetingTitle: { fontSize: 22, fontFamily: 'Manrope', fontWeight: '800', color: colors.onSurface },
  greetingSubtitle: { fontSize: 14, fontFamily: 'Inter', color: colors.onSurfaceVariant },

  section: { gap: 12 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter',
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant + 'AA',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seeAllText: { fontSize: 12, fontFamily: 'Inter', fontWeight: '700', color: colors.primary },

  memberChipsRow: { flexDirection: 'row', gap: 10, paddingVertical: 2 },
  memberChip: { paddingHorizontal: 18, paddingVertical: 10, backgroundColor: colors.surfaceContainerHigh, borderRadius: 999 },
  memberChipActive: { backgroundColor: colors.primary },
  memberChipText: { fontSize: 13, fontFamily: 'Inter', fontWeight: '600', color: colors.onSurface },
  memberChipTextActive: { color: colors.onPrimary },
  addMemberChip: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1.5, borderColor: colors.outlineVariant,
    borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },

  heroCard: {
    borderRadius: 20, backgroundColor: colors.primary, padding: 20, overflow: 'hidden', position: 'relative',
  },
  heroOverlayIcon: { position: 'absolute', top: 8, right: 8 },
  heroContent: { gap: 20 },
  heroDate: { fontSize: 13, fontFamily: 'Inter', color: 'rgba(255,255,255,0.85)', marginBottom: 2 },
  heroTitle: { fontSize: 26, fontFamily: 'Manrope', fontWeight: '800', color: '#fff' },
  heroStats: { flexDirection: 'row', gap: 10 },
  heroStat: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12, padding: 10, gap: 3, alignItems: 'flex-start',
  },
  heroStatLabel: { fontSize: 10, fontFamily: 'Inter', color: 'rgba(255,255,255,0.8)' },
  heroStatValue: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '700', color: '#fff' },

  alertCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.errorContainer, borderRadius: 16, padding: 14, gap: 12,
  },
  alertIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center',
  },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '700', color: colors.onErrorContainer },
  alertDesc: { fontSize: 12, fontFamily: 'Inter', color: colors.onErrorContainer + 'CC' },

  taskCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 14, gap: 12, ...shadows.sm,
  },
  taskIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '700', color: colors.onSurface },
  taskSubtitle: { fontSize: 12, fontFamily: 'Inter', color: colors.onSurfaceVariant, marginTop: 2 },
  takenBadge: { backgroundColor: '#DCFCE7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  takenBadgeText: { fontSize: 11, fontFamily: 'Inter', fontWeight: '600', color: '#15803D' },
  notTakenBadge: { backgroundColor: '#DBEAFE', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  notTakenBadgeText: { fontSize: 11, fontFamily: 'Inter', fontWeight: '600', color: '#1D4ED8' },

  aiCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: colors.surfaceContainerLow, borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, borderColor: colors.outlineVariant + '20',
  },
  aiAvatarWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  aiContent: { flex: 1, gap: 4 },
  aiLabel: {
    fontSize: 10, fontFamily: 'Inter', fontWeight: '700',
    color: colors.primary, letterSpacing: 1, textTransform: 'uppercase',
  },
  aiText: { fontSize: 13, fontFamily: 'Inter', color: colors.onSurface, lineHeight: 20, fontStyle: 'italic' },
});
