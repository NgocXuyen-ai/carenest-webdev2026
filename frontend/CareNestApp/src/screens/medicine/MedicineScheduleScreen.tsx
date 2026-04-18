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
import { mockMedicineSchedule } from '../../data/mockMedicineSchedule';
import type { MedicineStackParamList } from '../../navigation/navigationTypes';
import type { ScheduledMedicine } from '../../types';

type Nav = NativeStackNavigationProp<MedicineStackParamList, 'MedicineSchedule'>;

const TIME_GROUPS = [
  { key: 'morning',   label: 'Buổi sáng',  icon: 'wb_sunny',    bg: '#FFF9C4', iconColor: '#F9A825' },
  { key: 'afternoon', label: 'Buổi trưa',  icon: 'partly_cloudy_day', bg: '#E3F2FD', iconColor: '#1976D2' },
  { key: 'evening',   label: 'Buổi tối',   icon: 'bedtime',     bg: '#EDE7F6', iconColor: '#7B1FA2' },
];

export default function MedicineScheduleScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [schedule, setSchedule] = useState(mockMedicineSchedule);

  function toggleTaken(id: string) {
    setSchedule(prev => prev.map(s => s.id === id ? { ...s, taken: !s.taken } : s));
  }

  const takenCount = schedule.filter(s => s.taken).length;
  const totalCount = schedule.length;

  return (
    <View style={styles.root}>
      <TopAppBar variant="detail" title="Lịch uống thuốc" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: TOP_BAR_HEIGHT + insets.top + 16, paddingBottom: BOTTOM_NAV_HEIGHT + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress banner */}
        <View style={styles.progressCard}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressTitle}>Hôm nay</Text>
            <Text style={styles.progressSub}>{takenCount}/{totalCount} lần uống đã hoàn thành</Text>
          </View>
          <View style={styles.progressCircle}>
            <Text style={styles.progressCircleText}>{Math.round((takenCount / totalCount) * 100)}%</Text>
          </View>
        </View>

        {/* Schedule by time group */}
        {TIME_GROUPS.map(group => {
          const items = schedule.filter(s => s.timeOfDay === group.key);
          if (items.length === 0) return null;
          return (
            <View key={group.key} style={styles.section}>
              <View style={styles.groupHeader}>
                <View style={[styles.groupIconWrap, { backgroundColor: group.bg }]}>
                  <Icon name={group.icon} size={18} color={group.iconColor} />
                </View>
                <Text style={styles.groupLabel}>{group.label}</Text>
                <Text style={styles.groupTime}>{items[0].times[0]}</Text>
              </View>
              <View style={[styles.card, shadows.sm]}>
                {items.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.schedRow,
                      index < items.length - 1 && styles.schedRowDivider,
                      item.taken && styles.schedRowTaken,
                    ]}
                    onPress={() => toggleTaken(item.id)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.checkCircle, item.taken && styles.checkCircleActive]}>
                      {item.taken && <Icon name="check" size={14} color="#fff" />}
                    </View>
                    <View style={styles.schedContent}>
                      <Text style={[styles.schedName, item.taken && styles.schedNameTaken]}>
                        {item.name}
                      </Text>
                      <Text style={styles.schedDosage}>{item.dosage} · {item.instruction}</Text>
                    </View>
                    {item.isOverdue && !item.taken && (
                      <View style={styles.overdueBadge}>
                        <Text style={styles.overdueBadgeText}>Trễ</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
      <FAB iconName="add" onPress={() => navigation.navigate('AddMedicineSchedule', {})} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 16, gap: 16 },

  progressCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressInfo: { gap: 4 },
  progressTitle: { fontSize: 16, fontFamily: 'Manrope', fontWeight: '800', color: '#fff' },
  progressSub: { fontSize: 13, fontFamily: 'Inter', color: 'rgba(255,255,255,0.85)' },
  progressCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  progressCircleText: { fontSize: 16, fontFamily: 'Manrope', fontWeight: '800', color: '#fff' },

  section: { gap: 8 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupIconWrap: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  groupLabel: { flex: 1, fontSize: 14, fontFamily: 'Manrope', fontWeight: '700', color: colors.onSurface },
  groupTime: { fontSize: 13, fontFamily: 'Inter', color: colors.onSurfaceVariant },

  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, overflow: 'hidden' },
  schedRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 14, gap: 12,
  },
  schedRowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.outlineVariant },
  schedRowTaken: { opacity: 0.55 },
  checkCircle: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: colors.outlineVariant,
    alignItems: 'center', justifyContent: 'center',
  },
  checkCircleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  schedContent: { flex: 1 },
  schedName: { fontSize: 14, fontFamily: 'Inter', fontWeight: '600', color: colors.onSurface },
  schedNameTaken: { textDecorationLine: 'line-through', color: colors.onSurfaceVariant },
  schedDosage: { fontSize: 12, fontFamily: 'Inter', color: colors.onSurfaceVariant, marginTop: 2 },
  overdueBadge: { backgroundColor: colors.errorContainer, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  overdueBadgeText: { fontSize: 11, fontFamily: 'Inter', fontWeight: '700', color: colors.onErrorContainer },
});
