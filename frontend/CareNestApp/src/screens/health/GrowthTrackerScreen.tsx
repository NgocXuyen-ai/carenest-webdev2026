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
import { mockGrowthData } from '../../data/mockGrowthData';
import { mockFamilyMembers } from '../../data/mockFamilyMembers';
import type { FamilyStackParamList } from '../../navigation/navigationTypes';

type RouteT = RouteProp<FamilyStackParamList, 'GrowthTracker'>;

type MetricKey = 'weight' | 'height';

export default function GrowthTrackerScreen() {
  const route = useRoute<RouteT>();
  const insets = useSafeAreaInsets();
  const { memberId } = route.params;
  const [metric, setMetric] = useState<MetricKey>('weight');

  const member = mockFamilyMembers.find(m => m.id === memberId);
  const growthData = mockGrowthData.filter(g => g.profileId === member?.profileId);
  const hasEnoughData = growthData.length >= 5;

  const latest = growthData[growthData.length - 1];
  const prev = growthData[growthData.length - 2];
  const latestWeight = latest?.weight ?? 0;
  const latestHeight = latest?.height ?? 0;
  const weightDelta = prev ? (latestWeight - (prev.weight ?? 0)).toFixed(1) : '—';
  const heightDelta = prev ? (latestHeight - (prev.height ?? 0)).toFixed(1) : '—';

  // Simple inline chart: normalize values for bar chart
  const chartValues = growthData.map(g => metric === 'weight' ? (g.weight ?? 0) : (g.height ?? 0));
  const minV = Math.min(...chartValues);
  const maxV = Math.max(...chartValues);
  const range = maxV - minV || 1;

  return (
    <View style={styles.root}>
      <TopAppBar variant="detail" title="Theo dõi phát triển" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: TOP_BAR_HEIGHT + insets.top + 16, paddingBottom: BOTTOM_NAV_HEIGHT + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Latest stats cards */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[styles.statCard, shadows.sm, metric === 'weight' && styles.statCardActive]}
            onPress={() => setMetric('weight')}
            activeOpacity={0.85}
          >
            <Icon name="monitor_weight" size={20} color={metric === 'weight' ? colors.onPrimary : colors.primary} />
            <Text style={[styles.statValue, metric === 'weight' && styles.statValueActive]}>
              {latestWeight} <Text style={[styles.statUnit, metric === 'weight' && styles.statValueActive]}>kg</Text>
            </Text>
            <Text style={[styles.statLabel, metric === 'weight' && styles.statValueActive]}>Cân nặng</Text>
            <Text style={[styles.statDelta, metric === 'weight' && styles.statValueActive]}>
              {weightDelta !== '—' ? `+${weightDelta} kg` : '—'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statCard, shadows.sm, metric === 'height' && styles.statCardActive]}
            onPress={() => setMetric('height')}
            activeOpacity={0.85}
          >
            <Icon name="height" size={20} color={metric === 'height' ? colors.onPrimary : colors.primary} />
            <Text style={[styles.statValue, metric === 'height' && styles.statValueActive]}>
              {latestHeight} <Text style={[styles.statUnit, metric === 'height' && styles.statValueActive]}>cm</Text>
            </Text>
            <Text style={[styles.statLabel, metric === 'height' && styles.statValueActive]}>Chiều cao</Text>
            <Text style={[styles.statDelta, metric === 'height' && styles.statValueActive]}>
              {heightDelta !== '—' ? `+${heightDelta} cm` : '—'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chart area */}
        <View style={[styles.chartCard, shadows.sm]}>
          <Text style={styles.chartTitle}>
            {metric === 'weight' ? 'Biểu đồ cân nặng (kg)' : 'Biểu đồ chiều cao (cm)'}
          </Text>
          {!hasEnoughData ? (
            <View style={styles.chartEmpty}>
              <Icon name="show_chart" size={36} color={colors.outlineVariant} />
              <Text style={styles.chartEmptyTitle}>Cần thêm dữ liệu</Text>
              <Text style={styles.chartEmptyText}>Nhập ít nhất 5 lần để hiển thị biểu đồ</Text>
              <Text style={styles.chartEmptyCount}>Hiện có {growthData.length}/5 lần ghi nhận</Text>
            </View>
          ) : (
            <View style={styles.barChart}>
              {growthData.map((g, i) => {
                const v = metric === 'weight' ? (g.weight ?? 0) : (g.height ?? 0);
                const pct = (v - minV) / range;
                const barH = Math.max(20, pct * 100);
                const dateLabel = g.date.substring(5); // MM-DD
                return (
                  <View key={g.id} style={styles.barCol}>
                    <Text style={styles.barValue}>{v}</Text>
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, { height: barH, backgroundColor: i === growthData.length - 1 ? colors.primary : colors.primaryFixed }]} />
                    </View>
                    <Text style={styles.barLabel}>{dateLabel}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Log table */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Lịch sử ghi nhận</Text>
          <View style={[styles.card, shadows.sm]}>
            {/* Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1.5 }]}>Ngày</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Cân nặng</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Chiều cao</Text>
            </View>
            {[...growthData].reverse().map((g, index) => (
              <View
                key={g.id}
                style={[styles.tableRow, index < growthData.length - 1 && styles.tableRowDivider]}
              >
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{g.date}</Text>
                <Text style={styles.tableCell}>{g.weight} kg</Text>
                <Text style={styles.tableCell}>{g.height} cm</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Add button */}
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.85}>
          <Icon name="add" size={20} color={colors.onPrimary} />
          <Text style={styles.addBtnText}>Thêm lần ghi nhận mới</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 16, gap: 14 },

  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, backgroundColor: colors.surfaceContainerLowest, borderRadius: 16,
    padding: 16, gap: 4, alignItems: 'flex-start',
  },
  statCardActive: { backgroundColor: colors.primary },
  statValue: { fontSize: 26, fontFamily: 'Manrope', fontWeight: '800', color: colors.onSurface },
  statValueActive: { color: colors.onPrimary },
  statUnit: { fontSize: 14, fontFamily: 'Inter', fontWeight: '500', color: colors.onSurfaceVariant },
  statLabel: { fontSize: 12, fontFamily: 'Inter', color: colors.onSurfaceVariant },
  statDelta: { fontSize: 12, fontFamily: 'Inter', fontWeight: '600', color: '#2E7D32' },

  chartCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 16, gap: 12 },
  chartTitle: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '700', color: colors.onSurface },
  chartEmpty: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  chartEmptyTitle: { fontSize: 15, fontFamily: 'Manrope', fontWeight: '700', color: colors.onSurface },
  chartEmptyText: { fontSize: 13, fontFamily: 'Inter', color: colors.onSurfaceVariant, textAlign: 'center' },
  chartEmptyCount: { fontSize: 13, fontFamily: 'Inter', fontWeight: '600', color: colors.primary },

  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 140 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barValue: { fontSize: 9, fontFamily: 'Inter', color: colors.onSurfaceVariant },
  barBg: { flex: 1, width: '100%', justifyContent: 'flex-end', backgroundColor: colors.surfaceContainerHigh, borderRadius: 6, overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 6 },
  barLabel: { fontSize: 9, fontFamily: 'Inter', color: colors.onSurfaceVariant },

  section: { gap: 6 },
  sectionLabel: {
    fontSize: 12, fontFamily: 'Inter', fontWeight: '700',
    color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, marginLeft: 2,
  },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 11 },
  tableRowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.outlineVariant },
  tableHeader: { backgroundColor: colors.surfaceContainerHigh },
  tableCell: { flex: 1, fontSize: 13, fontFamily: 'Inter', color: colors.onSurface },
  tableHeaderText: { fontWeight: '700', color: colors.onSurfaceVariant, fontSize: 12 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 52, backgroundColor: colors.primary, borderRadius: 999, gap: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  addBtnText: { fontSize: 16, fontFamily: 'Inter', fontWeight: '700', color: colors.onPrimary },
});
