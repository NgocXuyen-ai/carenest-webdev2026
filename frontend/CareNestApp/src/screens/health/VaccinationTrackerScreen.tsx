import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { TOP_BAR_HEIGHT, BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import Icon from '../../components/common/Icon';
import TopAppBar from '../../components/layout/TopAppBar';
import { mockVaccinations } from '../../data/mockVaccinations';
import { mockFamilyMembers } from '../../data/mockFamilyMembers';
import type { FamilyStackParamList } from '../../navigation/navigationTypes';

type RouteT = RouteProp<FamilyStackParamList, 'VaccinationTracker'>;

const STATUS_CONFIG: Record<string, { label: string; icon: string; iconColor: string; bg: string }> = {
  completed: { label: 'Đã tiêm',   icon: 'check_circle', iconColor: '#2E7D32', bg: '#E8F5E9' },
  scheduled: { label: 'Đã lên lịch', icon: 'schedule', iconColor: '#E65100', bg: '#FFF3E0' },
  future:    { label: 'Chưa đến',  icon: 'radio_button_unchecked', iconColor: colors.outlineVariant, bg: colors.surfaceContainerHigh },
};

export default function VaccinationTrackerScreen() {
  const route = useRoute<RouteT>();
  const insets = useSafeAreaInsets();
  const { memberId } = route.params;

  const member = mockFamilyMembers.find(m => m.id === memberId);
  const vaccinations = mockVaccinations.filter(v => v.profileId === member?.profileId);

  // Group by ageGroup
  const groups = vaccinations.reduce<Record<string, typeof vaccinations>>((acc, v) => {
    const key = v.ageGroup ?? 'Khác';
    if (!acc[key]) acc[key] = [];
    acc[key].push(v);
    return acc;
  }, {});

  const completedCount = vaccinations.filter(v => v.status === 'completed').length;
  const totalCount = vaccinations.length;

  return (
    <View style={styles.root}>
      <TopAppBar variant="detail" title="Lịch tiêm chủng" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: TOP_BAR_HEIGHT + insets.top + 16, paddingBottom: BOTTOM_NAV_HEIGHT + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Member & progress card */}
        <View style={styles.progressCard}>
          <View style={styles.progressLeft}>
            <Text style={styles.progressName}>{member?.fullName ?? 'Thành viên'}</Text>
            <Text style={styles.progressSub}>{completedCount}/{totalCount} mũi đã tiêm</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${(completedCount / totalCount) * 100}%` as any }]} />
            </View>
          </View>
          <View style={styles.progressCircle}>
            <Text style={styles.progressPct}>{Math.round((completedCount / totalCount) * 100)}%</Text>
          </View>
        </View>

        {/* Scheduled alert */}
        {vaccinations.some(v => v.status === 'scheduled') && (
          <View style={styles.alertBanner}>
            <Icon name="notification_important" size={18} color={colors.onErrorContainer} />
            <Text style={styles.alertText}>Có mũi tiêm đã lên lịch sắp tới – nhớ đưa bé đi tiêm đúng hẹn!</Text>
          </View>
        )}

        {/* Vaccination groups */}
        {Object.entries(groups).map(([ageGroup, items]) => (
          <View key={ageGroup} style={styles.section}>
            <Text style={styles.groupLabel}>{ageGroup}</Text>
            <View style={[styles.card, shadows.sm]}>
              {items.map((vac, index) => {
                const cfg = STATUS_CONFIG[vac.status] ?? STATUS_CONFIG.future;
                return (
                  <View
                    key={vac.id}
                    style={[
                      styles.vacRow,
                      index < items.length - 1 && styles.vacRowDivider,
                    ]}
                  >
                    <View style={[styles.statusIcon, { backgroundColor: cfg.bg }]}>
                      <Icon name={cfg.icon} size={18} color={cfg.iconColor} />
                    </View>
                    <View style={styles.vacContent}>
                      <Text style={styles.vacName}>{vac.name}</Text>
                      <Text style={styles.vacMeta}>
                        {vac.status === 'completed' && vac.date && `Đã tiêm: ${vac.date}`}
                        {vac.status === 'scheduled' && vac.plannedDate && `Lịch hẹn: ${vac.plannedDate}`}
                        {vac.status === 'future' && 'Chưa lên lịch'}
                        {vac.facility && ` · ${vac.facility}`}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.statusText, { color: cfg.iconColor }]}>{cfg.label}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 16, gap: 14 },

  progressCard: {
    backgroundColor: colors.primary, borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  progressLeft: { flex: 1, gap: 6 },
  progressName: { fontSize: 16, fontFamily: 'Manrope', fontWeight: '800', color: '#fff' },
  progressSub: { fontSize: 13, fontFamily: 'Inter', color: 'rgba(255,255,255,0.85)' },
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: 6, backgroundColor: '#fff', borderRadius: 3 },
  progressCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  progressPct: { fontSize: 15, fontFamily: 'Manrope', fontWeight: '800', color: '#fff' },

  alertBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: colors.errorContainer, borderRadius: 12, padding: 12,
  },
  alertText: { flex: 1, fontSize: 13, fontFamily: 'Inter', fontWeight: '500', color: colors.onErrorContainer },

  section: { gap: 6 },
  groupLabel: {
    fontSize: 12, fontFamily: 'Inter', fontWeight: '700',
    color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, marginLeft: 2,
  },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, overflow: 'hidden' },
  vacRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, gap: 12,
  },
  vacRowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.outlineVariant },
  statusIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  vacContent: { flex: 1 },
  vacName: { fontSize: 13, fontFamily: 'Inter', fontWeight: '600', color: colors.onSurface },
  vacMeta: { fontSize: 11, fontFamily: 'Inter', color: colors.onSurfaceVariant, marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontFamily: 'Inter', fontWeight: '700' },
});
