import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { TOP_BAR_HEIGHT, BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import Icon from '../../components/common/Icon';
import TopAppBar from '../../components/layout/TopAppBar';
import type { FamilyStackParamList } from '../../navigation/navigationTypes';
import { createGrowthLog, getGrowthSummary, type GrowthSummary } from '../../api/growth';
import { formatLocalDate } from '../../utils/dateTime';

type RouteT = RouteProp<FamilyStackParamList, 'GrowthTracker'>;
type MetricKey = 'weight' | 'height';

const CHART_MESSAGE_FALLBACK = 'Chưa có đủ dữ liệu để hiển thị biểu đồ.';

function normalizeGrowthChartMessage(message?: string | null): string {
  if (!message?.trim()) {
    return CHART_MESSAGE_FALLBACK;
  }

  const normalized = message
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  if (normalized.startsWith('ban can nhap it nhat 5 chi so do (hien co ')) {
    const count = message.match(/\(\s*h[ií]e?n\s+c[oó]\s*(\d+)\s*\)/i)?.[1];
    if (count) {
      return `Bạn cần nhập ít nhất 5 chỉ số đo (hiện có ${count}) để hệ thống vẽ biểu đồ tăng trưởng.`;
    }
    return 'Bạn cần nhập ít nhất 5 chỉ số đo để hệ thống vẽ biểu đồ tăng trưởng.';
  }

  return message;
}

export default function GrowthTrackerScreen() {
  const route = useRoute<RouteT>();
  const insets = useSafeAreaInsets();
  const { memberId } = route.params;
  const [metric, setMetric] = useState<MetricKey>('weight');
  const [summary, setSummary] = useState<GrowthSummary | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [heightInput, setHeightInput] = useState('');
  const [noteInput, setNoteInput] = useState('');

  const loadSummary = useCallback(async () => {
    await getGrowthSummary(Number(memberId))
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [memberId]);

  useFocusEffect(
    useCallback(() => {
      void loadSummary();
      return undefined;
    }, [loadSummary]),
  );

  const latest = summary?.history?.[0];
  const latestWeight = latest?.weight ?? 0;
  const latestHeight = latest?.height ?? 0;
  const chartValues = (metric === 'weight' ? summary?.weightChart : summary?.heightChart) || [];
  const maxValue = Math.max(...chartValues.map(item => item.value), 1);
  const chartMessage = normalizeGrowthChartMessage(summary?.chartMessage);

  async function handleCreateGrowthLog() {
    try {
      await createGrowthLog({
        profileId: Number(memberId),
        weight: Number(weightInput) || undefined,
        height: Number(heightInput) || undefined,
        recordDate: formatLocalDate(new Date()),
        note: noteInput,
      });
      setShowModal(false);
      setWeightInput('');
      setHeightInput('');
      setNoteInput('');
      await loadSummary();
    } catch (error) {
      Alert.alert('Không thể ghi log', error instanceof Error ? error.message : 'Đã có lỗi xảy ra');
    }
  }

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
          </TouchableOpacity>
        </View>

        <View style={[styles.chartCard, shadows.sm]}>
          <Text style={styles.chartTitle}>
            {metric === 'weight' ? 'Biểu đồ cân nặng (kg)' : 'Biểu đồ chiều cao (cm)'}
          </Text>
          {!summary?.canDrawChart ? (
            <View style={styles.chartEmpty}>
              <Icon name="show_chart" size={36} color={colors.outlineVariant} />
              <Text style={styles.chartEmptyTitle}>Cần thêm dữ liệu</Text>
              <Text style={styles.chartEmptyText}>{chartMessage}</Text>
            </View>
          ) : (
            <View style={styles.barChart}>
              {chartValues.map(item => (
                <View key={item.label} style={styles.barCol}>
                  <Text style={styles.barValue}>{item.value}</Text>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { height: `${(item.value / maxValue) * 100}%` }]} />
                  </View>
                  <Text style={styles.barLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Lịch sử ghi nhận</Text>
          <View style={[styles.card, shadows.sm]}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1.5 }]}>Ngày</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Cân nặng</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Chiều cao</Text>
            </View>
            {(summary?.history || []).map((item, index) => (
              <View key={`${item.date}-${index}`} style={[styles.tableRow, index < (summary?.history.length || 0) - 1 && styles.tableRowDivider]}>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.date}</Text>
                <Text style={styles.tableCell}>{item.weight ?? '--'} kg</Text>
                <Text style={styles.tableCell}>{item.height ?? '--'} cm</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.addBtn} activeOpacity={0.85} onPress={() => setShowModal(true)}>
          <Icon name="add" size={20} color={colors.onPrimary} />
          <Text style={styles.addBtnText}>Thêm lần ghi nhận mới</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ghi nhận chỉ số mới</Text>
            <TextInput style={styles.modalInput} value={weightInput} onChangeText={setWeightInput} placeholder="Cân nặng (kg)" keyboardType="numeric" />
            <TextInput style={styles.modalInput} value={heightInput} onChangeText={setHeightInput} placeholder="Chiều cao (cm)" keyboardType="numeric" />
            <TextInput style={styles.modalInput} value={noteInput} onChangeText={setNoteInput} placeholder="Ghi chú" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalSecondaryBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.modalSecondaryText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimaryBtn} onPress={() => void handleCreateGrowthLog()}>
                <Text style={styles.modalPrimaryText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 16, gap: 14 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 16, gap: 4, alignItems: 'flex-start' },
  statCardActive: { backgroundColor: colors.primary },
  statValue: { fontSize: 26, fontFamily: 'Manrope', fontWeight: '800', color: colors.onSurface },
  statValueActive: { color: colors.onPrimary },
  statUnit: { fontSize: 14, fontFamily: 'Inter', fontWeight: '500', color: colors.onSurfaceVariant },
  statLabel: { fontSize: 12, fontFamily: 'Inter', color: colors.onSurfaceVariant },
  chartCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 16, gap: 12 },
  chartTitle: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '700', color: colors.onSurface },
  chartEmpty: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  chartEmptyTitle: { fontSize: 15, fontFamily: 'Manrope', fontWeight: '700', color: colors.onSurface },
  chartEmptyText: { fontSize: 13, fontFamily: 'Inter', color: colors.onSurfaceVariant, textAlign: 'center' },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 160 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barValue: { fontSize: 9, fontFamily: 'Inter', color: colors.onSurfaceVariant },
  barBg: { flex: 1, width: '100%', justifyContent: 'flex-end', backgroundColor: colors.surfaceContainerHigh, borderRadius: 6, overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 6, backgroundColor: colors.primary },
  barLabel: { fontSize: 9, fontFamily: 'Inter', color: colors.onSurfaceVariant },
  section: { gap: 6 },
  sectionLabel: { fontSize: 12, fontFamily: 'Inter', fontWeight: '700', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, marginLeft: 2 },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 11 },
  tableRowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.outlineVariant },
  tableHeader: { backgroundColor: colors.surfaceContainerHigh },
  tableCell: { flex: 1, fontSize: 13, fontFamily: 'Inter', color: colors.onSurface },
  tableHeaderText: { fontWeight: '700', color: colors.onSurfaceVariant, fontSize: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, backgroundColor: colors.primary, borderRadius: 999, gap: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  addBtnText: { fontSize: 16, fontFamily: 'Inter', fontWeight: '700', color: colors.onPrimary },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.onSurface },
  modalInput: { height: 48, borderRadius: 12, backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: 14, color: colors.onSurface },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  modalSecondaryBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  modalSecondaryText: { fontSize: 14, fontWeight: '700', color: colors.onSurfaceVariant },
  modalPrimaryBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  modalPrimaryText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
