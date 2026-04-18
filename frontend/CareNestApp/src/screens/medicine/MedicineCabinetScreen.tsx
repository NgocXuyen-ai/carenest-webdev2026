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
import { mockMedicines } from '../../data/mockMedicines';
import type { MedicineStackParamList } from '../../navigation/navigationTypes';
import type { CabinetMedicine } from '../../types';

type Nav = NativeStackNavigationProp<MedicineStackParamList, 'MedicineCabinet'>;

type FilterKey = 'all' | 'expiring' | 'expired' | 'out_of_stock';

const STATUS_CONFIG: Record<string, { label: string; bg: string; textColor: string }> = {
  stable:       { label: 'Còn hạn',    bg: '#E8F5E9', textColor: '#2E7D32' },
  expiring:     { label: 'Sắp hết hạn', bg: '#FFF3E0', textColor: '#E65100' },
  expired:      { label: 'Hết hạn',    bg: colors.errorContainer, textColor: colors.onErrorContainer },
  out_of_stock: { label: 'Hết hàng',   bg: '#ECEFF1', textColor: '#546E7A' },
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',          label: 'Tất cả' },
  { key: 'expiring',     label: 'Sắp hết hạn' },
  { key: 'expired',      label: 'Hết hạn' },
  { key: 'out_of_stock', label: 'Hết hàng' },
];

export default function MedicineCabinetScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterKey>('all');

  const medicines = filter === 'all'
    ? mockMedicines
    : mockMedicines.filter(m => m.status === filter);

  const alertCount = mockMedicines.filter(m => m.status === 'expired' || m.status === 'expiring').length;

  return (
    <View style={styles.root}>
      <TopAppBar variant="detail" title="Tủ thuốc gia đình" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: TOP_BAR_HEIGHT + insets.top + 16, paddingBottom: BOTTOM_NAV_HEIGHT + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Alert banner */}
        {alertCount > 0 && (
          <View style={styles.alertBanner}>
            <Icon name="warning" size={18} color={colors.onErrorContainer} />
            <Text style={styles.alertBannerText}>
              {alertCount} loại thuốc cần kiểm tra
            </Text>
          </View>
        )}

        {/* OCR scan shortcut */}
        <TouchableOpacity
          style={styles.ocrCard}
          onPress={() => navigation.navigate('OcrScanner')}
          activeOpacity={0.85}
        >
          <View style={styles.ocrIconWrap}>
            <Icon name="document_scanner" size={24} color={colors.primary} />
          </View>
          <View style={styles.ocrInfo}>
            <Text style={styles.ocrTitle}>Quét toa thuốc</Text>
            <Text style={styles.ocrSub}>Thêm thuốc nhanh bằng camera OCR</Text>
          </View>
          <Icon name="chevron_right" size={20} color={colors.outlineVariant} />
        </TouchableOpacity>

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

        {/* Medicine list */}
        <View style={styles.section}>
          <Text style={styles.countText}>{medicines.length} loại thuốc</Text>
          <View style={[styles.card, shadows.sm]}>
            {medicines.length === 0 && (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>Không có thuốc nào</Text>
              </View>
            )}
            {medicines.map((med, index) => {
              const cfg = STATUS_CONFIG[med.status] ?? STATUS_CONFIG.stable;
              return (
                <TouchableOpacity
                  key={med.id}
                  style={[
                    styles.medRow,
                    index < medicines.length - 1 && styles.medRowDivider,
                  ]}
                  activeOpacity={0.75}
                >
                  <View style={styles.medIconWrap}>
                    <Icon name={med.iconName} size={22} color={colors.primary} />
                  </View>
                  <View style={styles.medContent}>
                    <Text style={styles.medName}>{med.name}</Text>
                    <Text style={styles.medMeta}>
                      {med.quantity > 0 ? `${med.quantity} ${med.unit}` : 'Hết hàng'}
                      {' · '}HSD: {med.expiryDate}
                    </Text>
                    {med.notes && <Text style={styles.medNote}>{med.notes}</Text>}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.statusText, { color: cfg.textColor }]}>{cfg.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
      <FAB iconName="add" onPress={() => navigation.navigate('AddMedicineToCabinet', {})} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 16, gap: 14 },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.errorContainer, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  alertBannerText: { fontSize: 13, fontFamily: 'Inter', fontWeight: '600', color: colors.onErrorContainer },

  ocrCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.primaryFixed, borderRadius: 14, padding: 14,
  },
  ocrIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  ocrInfo: { flex: 1 },
  ocrTitle: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '700', color: colors.primary },
  ocrSub: { fontSize: 12, fontFamily: 'Inter', color: colors.primary + 'CC', marginTop: 2 },

  filterRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: colors.surfaceContainerHigh, borderRadius: 999,
  },
  filterChipActive: { backgroundColor: colors.primary },
  filterChipText: { fontSize: 13, fontFamily: 'Inter', fontWeight: '600', color: colors.onSurface },
  filterChipTextActive: { color: colors.onPrimary },

  section: { gap: 6 },
  countText: { fontSize: 12, fontFamily: 'Inter', color: colors.onSurfaceVariant, marginLeft: 2 },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, overflow: 'hidden' },
  emptyRow: { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, fontFamily: 'Inter', color: colors.onSurfaceVariant, fontStyle: 'italic' },
  medRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 14, gap: 12,
  },
  medRowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.outlineVariant },
  medIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.primaryFixed, alignItems: 'center', justifyContent: 'center',
  },
  medContent: { flex: 1 },
  medName: { fontSize: 14, fontFamily: 'Inter', fontWeight: '600', color: colors.onSurface },
  medMeta: { fontSize: 12, fontFamily: 'Inter', color: colors.onSurfaceVariant, marginTop: 2 },
  medNote: { fontSize: 12, fontFamily: 'Inter', color: '#E65100', marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontFamily: 'Inter', fontWeight: '700' },
});
