import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { TOP_BAR_HEIGHT, BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import Icon from '../../components/common/Icon';
import Avatar from '../../components/common/Avatar';
import TopAppBar from '../../components/layout/TopAppBar';
import type { FamilyStackParamList } from '../../navigation/navigationTypes';
import { getFamilyProfile, type ProfileDetails } from '../../api/family';

type NavProp = NativeStackNavigationProp<FamilyStackParamList, 'HealthProfileDetail'>;

export default function HealthProfileDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProp<FamilyStackParamList, 'HealthProfileDetail'>>();
  const [member, setMember] = useState<ProfileDetails | null>(null);

  useEffect(() => {
    const profileId = Number(route.params.memberId);
    void getFamilyProfile(profileId).then(setMember).catch(() => setMember(null));
  }, [route.params.memberId]);

  const statusColor = member?.healthStatus?.includes('THEO') ? '#E65100' : '#2E7D32';
  const statusLabel = member?.healthStatus || 'Sức khỏe tốt';

  function formatBirthday(d?: string) {
    if (!d) return 'Chua cap nhat';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  }

  return (
    <View style={styles.root}>
      <TopAppBar variant='detail' title={member?.fullName || 'Chi tiết hồ sơ'} />
      <ScrollView
        contentContainerStyle={{ paddingTop: TOP_BAR_HEIGHT + insets.top + 16, paddingBottom: BOTTOM_NAV_HEIGHT + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Avatar name={member?.fullName || 'Thành viên'} size='xl' />
          <Text style={styles.heroName}>{member?.fullName || 'Đang tải...'}</Text>
          <View style={styles.heroBadgeRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>Thành viên</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
        </View>
        {/* Basic Info Card */}
        <View style={[styles.card, shadows.sm]}>
          <Text style={styles.cardTitle}>Thong tin co ban</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Icon name='healing' size={16} color={colors.primary} />
              <View>
                <Text style={styles.infoLabel}>Nhom mau</Text>
                <Text style={styles.infoValue}>{member?.bloodType ?? 'Chua ro'}</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Icon name='cake' size={16} color={colors.primary} />
              <View>
                <Text style={styles.infoLabel}>Ngay sinh</Text>
                <Text style={styles.infoValue}>{formatBirthday(member?.birthday || undefined)}</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Icon name='person' size={16} color={colors.primary} />
              <View>
                <Text style={styles.infoLabel}>Gioi tinh</Text>
                <Text style={styles.infoValue}>{member?.gender ?? 'Chua ro'}</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Icon name='height' size={16} color={colors.primary} />
              <View>
                <Text style={styles.infoLabel}>Chieu cao / Can nang</Text>
                <Text style={styles.infoValue}>{member?.height ?? '--'} cm / {member?.weight ?? '--'} kg</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Medical History */}
        <View style={[styles.card, shadows.sm]}>
          <Text style={styles.cardTitle}>Tien su benh</Text>
          {member?.medicalHistory ? (
            <View style={styles.historyItem}>
              <View style={styles.historyDot} />
              <View style={styles.historyContent}>
                <Text style={styles.historyName}>Ghi chú bệnh lý</Text>
                <Text style={styles.historyDesc}>{member.medicalHistory}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>Chua co thong tin</Text>
          )}
        </View>

        {/* Allergies */}
        <View style={[styles.card, shadows.sm]}>
          <Text style={styles.cardTitle}>Di ung</Text>
          <View style={styles.chipRow}>
            {member?.allergy ? (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{member.allergy}</Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>Khong co di ung</Text>
            )}
          </View>
        </View>

        {/* QR Code Section */}
        <View style={[styles.card, shadows.sm]}>
          <Text style={styles.cardTitle}>Ma QR khan cap</Text>
          <View style={styles.qrBox}>
            <Icon name='qr_code' size={48} color={colors.onSurfaceVariant} />
            <Text style={styles.qrHint}>Ma QR chua nhan thong tin y te khi can cap cuu</Text>
          </View>
        </View>
        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('VaccinationTracker', { memberId: String(route.params.memberId) })}
          >
            <Icon name='syringe' size={18} color={colors.onPrimary} />
            <Text style={styles.actionBtnPrimaryText}>Lich tiem chung</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSecondary]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('GrowthTracker', { memberId: String(route.params.memberId) })}
          >
            <Icon name='trending_up' size={18} color={colors.primary} />
            <Text style={styles.actionBtnSecondaryText}>Theo doi phat trien</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24, paddingHorizontal: 16,
    backgroundColor: colors.surfaceContainerLowest,
    marginHorizontal: 16, borderRadius: 20, marginBottom: 12,
  },
  heroName: { fontSize: 22, fontFamily: 'Manrope', fontWeight: '800', color: colors.onSurface, marginTop: 12 },
  heroBadgeRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
  roleBadge: { backgroundColor: colors.secondaryContainer, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  roleText: { fontSize: 12, fontFamily: 'Inter', fontWeight: '700', color: colors.secondary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, gap: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontFamily: 'Inter', fontWeight: '600' },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16, padding: 16,
    marginHorizontal: 16, marginBottom: 12,
  },
  cardTitle: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '700', color: colors.onSurface, marginBottom: 12 },
  infoGrid: { gap: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoLabel: { fontSize: 11, fontFamily: 'Inter', color: colors.onSurfaceVariant, marginBottom: 2 },
  infoValue: { fontSize: 14, fontFamily: 'Inter', fontWeight: '600', color: colors.onSurface },
  emptyText: { fontSize: 13, fontFamily: 'Inter', color: colors.onSurfaceVariant, fontStyle: 'italic' },
  historyItem: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  historyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 5 },
  historyContent: { flex: 1 },
  historyName: { fontSize: 14, fontFamily: 'Inter', fontWeight: '600', color: colors.onSurface },
  historyDesc: { fontSize: 13, fontFamily: 'Inter', color: colors.onSurfaceVariant, lineHeight: 18, marginTop: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.errorContainer, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { fontSize: 13, fontFamily: 'Inter', fontWeight: '600', color: colors.onErrorContainer },
  qrBox: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  qrHint: { fontSize: 13, fontFamily: 'Inter', color: colors.onSurfaceVariant, textAlign: 'center' },
  emergencyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emergencyAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primaryFixed, alignItems: 'center', justifyContent: 'center' },
  emergencyInfo: { flex: 1 },
  emergencyName: { fontSize: 15, fontFamily: 'Manrope', fontWeight: '700', color: colors.onSurface },
  emergencyRelation: { fontSize: 12, fontFamily: 'Inter', color: colors.onSurfaceVariant, marginTop: 2 },
  callBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  actionRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 4 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 14, gap: 8 },
  actionBtnPrimary: { backgroundColor: colors.primary },
  actionBtnPrimaryText: { fontSize: 13, fontFamily: 'Inter', fontWeight: '700', color: colors.onPrimary },
  actionBtnSecondary: { backgroundColor: colors.primaryFixed },
  actionBtnSecondaryText: { fontSize: 13, fontFamily: 'Inter', fontWeight: '700', color: colors.primary },
});
