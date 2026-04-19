import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
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
import { formatBloodType, formatGender } from '../../utils/healthOptions';
import { useFamily } from '../../context/FamilyContext';

type NavProp = NativeStackNavigationProp<FamilyStackParamList, 'HealthProfileDetail'>;

function mapRoleLabel(role?: string) {
  switch (role) {
    case 'OWNER':
      return 'Chủ gia đình';
    case 'FATHER':
      return 'Bố';
    case 'MOTHER':
      return 'Mẹ';
    case 'OLDER_BROTHER':
      return 'Anh';
    case 'OLDER_SISTER':
      return 'Chị';
    case 'YOUNGER':
      return 'Em';
    default:
      return 'Thành viên';
  }
}

function formatBirthday(value?: string) {
  if (!value) {
    return 'Chưa cập nhật';
  }

  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export default function HealthProfileDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProp<FamilyStackParamList, 'HealthProfileDetail'>>();
  const { members } = useFamily();
  const [member, setMember] = useState<ProfileDetails | null>(null);

  const loadProfile = useCallback(async () => {
    const profileId = Number(route.params.memberId);
    await getFamilyProfile(profileId).then(setMember).catch(() => setMember(null));
  }, [route.params.memberId]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const statusColor = member?.healthStatus?.includes('THEO') ? '#E65100' : '#2E7D32';
  const statusLabel = member?.healthStatus || 'Sức khỏe tốt';
  const roleLabel = useMemo(() => {
    const familyMember = members.find(item => String(item.profileId) === String(route.params.memberId));
    return mapRoleLabel(familyMember?.role);
  }, [members, route.params.memberId]);

  return (
    <View style={styles.root}>
      <TopAppBar variant="detail" title={member?.fullName || 'Chi tiết hồ sơ'} />
      <ScrollView
        contentContainerStyle={{
          paddingTop: TOP_BAR_HEIGHT + insets.top + 16,
          paddingBottom: BOTTOM_NAV_HEIGHT + 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Avatar name={member?.fullName || 'Thành viên'} size="xl" />
          <Text style={styles.heroName}>{member?.fullName || 'Đang tải...'}</Text>
          <View style={styles.heroBadgeRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{roleLabel}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, shadows.sm]}>
          <Text style={styles.cardTitle}>Thông tin cơ bản</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Icon name="healing" size={16} color={colors.primary} />
              <View>
                <Text style={styles.infoLabel}>Nhóm máu</Text>
                <Text style={styles.infoValue}>{formatBloodType(member?.bloodType)}</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Icon name="cake" size={16} color={colors.primary} />
              <View>
                <Text style={styles.infoLabel}>Ngày sinh</Text>
                <Text style={styles.infoValue}>{formatBirthday(member?.birthday || undefined)}</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Icon name="person" size={16} color={colors.primary} />
              <View>
                <Text style={styles.infoLabel}>Giới tính</Text>
                <Text style={styles.infoValue}>{formatGender(member?.gender)}</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Icon name="height" size={16} color={colors.primary} />
              <View>
                <Text style={styles.infoLabel}>Chiều cao / Cân nặng</Text>
                <Text style={styles.infoValue}>
                  {member?.height ?? '--'} cm / {member?.weight ?? '--'} kg
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.card, shadows.sm]}>
          <Text style={styles.cardTitle}>Tiền sử bệnh</Text>
          {member?.medicalHistory ? (
            <View style={styles.historyItem}>
              <View style={styles.historyDot} />
              <View style={styles.historyContent}>
                <Text style={styles.historyName}>Ghi chú bệnh lý</Text>
                <Text style={styles.historyDesc}>{member.medicalHistory}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>Chưa có thông tin</Text>
          )}
        </View>

        <View style={[styles.card, shadows.sm]}>
          <Text style={styles.cardTitle}>Dị ứng</Text>
          <View style={styles.chipRow}>
            {member?.allergy ? (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{member.allergy}</Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>Không có dị ứng</Text>
            )}
          </View>
        </View>

        <View style={[styles.card, shadows.sm]}>
          <Text style={styles.cardTitle}>Thông tin bổ sung</Text>
          <View style={styles.infoBox}>
            <Icon name="info" size={32} color={colors.onSurfaceVariant} />
            <Text style={styles.infoHint}>
              Hồ sơ đang hiển thị dữ liệu sức khỏe thật từ backend.
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('VaccinationTracker', {
                memberId: String(route.params.memberId),
              })
            }
          >
            <Icon name="syringe" size={18} color={colors.onPrimary} />
            <Text style={styles.actionBtnPrimaryText}>Lịch tiêm chủng</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSecondary]}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('GrowthTracker', {
                memberId: String(route.params.memberId),
              })
            }
          >
            <Icon name="trending_up" size={18} color={colors.primary} />
            <Text style={styles.actionBtnSecondaryText}>Theo dõi phát triển</Text>
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
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: colors.surfaceContainerLowest,
    marginHorizontal: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  heroName: {
    fontSize: 22,
    fontFamily: 'Manrope',
    fontWeight: '800',
    color: colors.onSurface,
    marginTop: 12,
  },
  heroBadgeRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
  roleBadge: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleText: { fontSize: 12, fontFamily: 'Inter', fontWeight: '700', color: colors.secondary },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontFamily: 'Inter', fontWeight: '600' },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 12,
  },
  infoGrid: { gap: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoLabel: { fontSize: 11, fontFamily: 'Inter', color: colors.onSurfaceVariant, marginBottom: 2 },
  infoValue: { fontSize: 14, fontFamily: 'Inter', fontWeight: '600', color: colors.onSurface },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  historyItem: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 5,
  },
  historyContent: { flex: 1 },
  historyName: { fontSize: 14, fontFamily: 'Inter', fontWeight: '600', color: colors.onSurface },
  historyDesc: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: colors.onSurfaceVariant,
    lineHeight: 18,
    marginTop: 2,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: colors.errorContainer,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: colors.onErrorContainer,
  },
  infoBox: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  infoHint: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  actionRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 4 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  actionBtnPrimary: { backgroundColor: colors.primary },
  actionBtnPrimaryText: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: colors.onPrimary,
  },
  actionBtnSecondary: { backgroundColor: colors.primaryFixed },
  actionBtnSecondaryText: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: colors.primary,
  },
});
