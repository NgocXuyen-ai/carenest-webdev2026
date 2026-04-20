import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { TOP_BAR_HEIGHT, BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import Icon from '../../components/common/Icon';
import TopAppBar from '../../components/layout/TopAppBar';
import FAB from '../../components/common/FAB';
import type { MedicineStackParamList } from '../../navigation/navigationTypes';
import { getCabinetMedicines, type MedicineItem } from '../../api/medicine';

type Nav = NativeStackNavigationProp<MedicineStackParamList, 'MedicineCabinet'>;
type FilterKey = 'all' | 'expiring' | 'expired';
type CabinetStatus = 'stable' | 'expiring' | 'expired' | 'out_of_stock';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'expiring', label: 'Sắp hết hạn' },
  { key: 'expired', label: 'Hết hạn' },
];

export default function MedicineCabinetScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);

  const loadMedicines = useCallback(async () => {
    await getCabinetMedicines()
      .then(setMedicines)
      .catch(() => setMedicines([]));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadMedicines();
      return undefined;
    }, [loadMedicines]),
  );

  const filteredMedicines = useMemo(() => {
    if (filter === 'all') {
      return medicines;
    }

    return medicines.filter(item => mapStatus(item.status) === filter);
  }, [filter, medicines]);

  const alertCount = medicines.filter(item => {
    const status = mapStatus(item.status);
    return status === 'expired' || status === 'expiring';
  }).length;

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
        {alertCount > 0 ? (
          <View style={styles.alertBanner}>
            <Icon name="warning" size={18} color={colors.onErrorContainer} />
            <Text style={styles.alertBannerText}>{alertCount} loại thuốc cần kiểm tra</Text>
          </View>
        ) : null}

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
            <Text style={styles.ocrSub}>Dùng AI để thêm thuốc và lịch uống nhanh hơn</Text>
          </View>
          <Icon name="chevron_right" size={20} color={colors.outlineVariant} />
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map(item => (
            <TouchableOpacity
              key={item.key}
              style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
              onPress={() => setFilter(item.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, filter === item.key && styles.filterChipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.section}>
          <Text style={styles.countText}>{filteredMedicines.length} loại thuốc</Text>
          <View style={[styles.card, shadows.sm]}>
            {filteredMedicines.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>Chưa có thuốc nào trong tủ</Text>
              </View>
            ) : (
              filteredMedicines.map((medicine, index) => {
                const status = mapStatus(medicine.status);
                const config = STATUS_CONFIG[status];
                return (
                  <View
                    key={medicine.medicineId}
                    style={[styles.medRow, index < filteredMedicines.length - 1 && styles.medRowDivider]}
                  >
                    <View style={styles.medIconWrap}>
                      <Icon name="pill" size={22} color={colors.primary} />
                    </View>
                    <View style={styles.medContent}>
                      <Text style={styles.medName}>{medicine.name}</Text>
                      <Text style={styles.medMeta}>
                        {medicine.quantity} {medicine.unit}
                        {medicine.expiryDate ? ` · HSD: ${medicine.expiryDate}` : ''}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                      <Text style={[styles.statusText, { color: config.textColor }]}>{config.label}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
      <FAB
        iconName="add"
        onPress={() => navigation.navigate('AddMedicineToCabinet', {})}
        bottomOffset={BOTTOM_NAV_HEIGHT - 55}
      />
    </View>
  );
}

const STATUS_CONFIG: Record<CabinetStatus, { label: string; bg: string; textColor: string }> = {
  stable: { label: 'Ổn định', bg: '#E8F5E9', textColor: '#2E7D32' },
  expiring: { label: 'Sắp hết hạn', bg: '#FFF3E0', textColor: '#E65100' },
  expired: { label: 'Hết hạn', bg: colors.errorContainer, textColor: colors.onErrorContainer },
  out_of_stock: { label: 'Hết hàng', bg: '#ECEFF1', textColor: '#546E7A' },
};

function mapStatus(status: string): CabinetStatus {
  const normalized = status.toUpperCase();
  if (normalized.includes('EXPIRED')) return 'expired';
  if (normalized.includes('LOW') || normalized.includes('EXPIR')) return 'expiring';
  if (normalized.includes('OUT')) return 'out_of_stock';
  return 'stable';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 16, gap: 14 },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.errorContainer,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  alertBannerText: { fontSize: 13, fontFamily: 'Inter', fontWeight: '600', color: colors.onErrorContainer },
  ocrCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primaryFixed,
    borderRadius: 14,
    padding: 14,
  },
  ocrIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ocrInfo: { flex: 1 },
  ocrTitle: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '700', color: colors.primary },
  ocrSub: { fontSize: 12, fontFamily: 'Inter', color: `${colors.primary}CC`, marginTop: 2 },
  filterRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 999,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  medRowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.outlineVariant },
  medIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medContent: { flex: 1 },
  medName: { fontSize: 14, fontFamily: 'Inter', fontWeight: '600', color: colors.onSurface },
  medMeta: { fontSize: 12, fontFamily: 'Inter', color: colors.onSurfaceVariant, marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontFamily: 'Inter', fontWeight: '700' },
});
