import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import Icon from '../../components/common/Icon';
import Avatar from '../../components/common/Avatar';
import { mockFamilyMembers } from '../../data/mockFamilyMembers';
import type { FamilyStackParamList } from '../../navigation/navigationTypes';
import type { FamilyMember } from '../../types';

const { width: windowWidth } = Dimensions.get('window');
const CARD_WIDTH = (windowWidth - 48) / 2;

type NavProp = NativeStackNavigationProp<FamilyStackParamList, 'FamilyManagement'>;

const calculateAge = (birthday: string) => {
  const today = new Date();
  const birthDate = new Date(birthday);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const getHealthInfo = (status: FamilyMember['healthStatus']) => {
  switch (status) {
    case 'good':
      return { label: 'SỨC KHỎE TỐT', icon: 'favorite', color: '#2E7D32', theme: '#E8F5E9' };
    case 'warning':
      return { label: 'SỨC KHỎE ỔN ĐỊNH', icon: 'favorite', color: '#0288D1', theme: '#E1F5FE' };
    case 'critical':
      return { label: 'ĐANG UỐNG THUỐC', icon: 'medication', color: '#D32F2F', theme: '#FFEBEE' };
    default:
      return { label: 'SỨC KHỎE TỐT', icon: 'favorite', color: '#2E7D32', theme: '#E8F5E9' };
  }
};

const getRoleBadgeStyle = (role: string) => {
  switch (role.toLowerCase()) {
    case 'mẹ': return { bg: '#E1F5FE', text: '#0288D1' };
    case 'bố': return { bg: '#F3E5F5', text: '#7B1FA2' };
    case 'con': return { bg: '#E8F5E9', text: '#2E7D32' };
    case 'bà': return { bg: '#FFF3E0', text: '#F57C00' };
    default: return { bg: '#F5F5F5', text: '#616161' };
  }
};

export default function FamilyManagementScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const members = mockFamilyMembers;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerUser}>
          <TouchableOpacity style={styles.headerProfile}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100' }}
              style={styles.headerAvatar}
            />
          </TouchableOpacity>
          <Text style={styles.headerAppName}>CareNest</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Icon name="notifications" size={24} color={colors.primary} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.tinyTitle}>TỔ ẤM CỦA BẠN</Text>
          <View style={styles.mainTitleRow}>
            <Text style={styles.mainTitle}>Gia đình của tôi</Text>
            <View style={styles.countBadge}>
              <View style={styles.blueDot} />
              <Text style={styles.countText}>{members.length} Thành viên</Text>
            </View>
          </View>
          <Text style={styles.description}>
            Quản lý hồ sơ sức khỏe và lịch trình sinh hoạt cho mọi thành viên trong gia đình bạn.
          </Text>
        </View>

        {/* Members Grid */}
        <View style={styles.grid}>
          {members.map((member, index) => {
            const age = member.birthday ? calculateAge(member.birthday) : 0;
            const health = getHealthInfo(member.healthStatus);
            const roleStyle = getRoleBadgeStyle(member.role);

            return (
              <TouchableOpacity
                key={member.id}
                style={[styles.memberCard, shadows.sm]}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('HealthProfileDetail', { memberId: member.id })}
              >
                {/* Control Icons */}
                <View style={styles.cardControls}>
                  <TouchableOpacity style={styles.controlBtn}>
                    <Icon name="visibility" size={16} color="#757575" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.controlBtn}>
                    <Icon name="edit" size={16} color="#757575" />
                  </TouchableOpacity>
                </View>

                {/* Avatar */}
                <View style={styles.cardAvatarWrapper}>
                  <Avatar name={member.fullName} size="xl" />
                  <View style={[styles.statusDot, { backgroundColor: member.healthStatus === 'good' ? '#4CAF50' : '#FF9800' }]} />
                </View>

                {/* Info */}
                <View style={styles.cardInfo}>
                  <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
                    <Text style={[styles.roleBadgeText, { color: roleStyle.text }]}>{member.role.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.memberName} numberOfLines={1}>{member.fullName}</Text>
                  <Text style={styles.memberAge}>{age} Tuổi</Text>
                </View>

                {/* Health Footer */}
                <View style={[styles.healthFooter, { borderColor: colors.outlineVariant }]}>
                  <Icon name={health.icon} size={14} color={health.color} />
                  <Text style={[styles.healthLabel, { color: health.color }]}>{health.label}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Family Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.settingsTitle}>Cài đặt gia đình</Text>
          <TouchableOpacity style={styles.settingsItem}>
            <View style={styles.settingsIconWrapper}>
              <Icon name="share" size={20} color={colors.onSurfaceVariant} />
            </View>
            <Text style={styles.settingsItemText}>Chia sẻ hồ sơ</Text>
            <Icon name="chevron_right" size={20} color={colors.outline} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingsItem}>
            <View style={styles.settingsIconWrapper}>
              <Icon name="verified_user" size={20} color={colors.onSurfaceVariant} />
            </View>
            <Text style={styles.settingsItemText}>Quyền truy cập y tế</Text>
            <Icon name="chevron_right" size={20} color={colors.outline} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, shadows.md]}
        activeOpacity={0.8}
        onPress={() => { }}
      >
        <Icon name="add" size={32} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: colors.background,
    paddingBottom: 10,
  },
  headerUser: { flexDirection: 'row', alignItems: 'center' },
  headerProfile: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFF',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  headerAvatar: { width: 36, height: 36, borderRadius: 18 },
  headerAppName: {
    marginLeft: 12,
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '800',
    color: '#004A78'
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  notificationDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D32F2F',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  scrollContent: { paddingHorizontal: 16 },
  titleSection: { marginTop: 24, marginBottom: 20 },
  tinyTitle: {
    fontSize: 11,
    fontFamily: 'Inter',
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  mainTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  mainTitle: {
    fontSize: 32,
    fontFamily: 'Manrope',
    fontWeight: '800',
    color: colors.onSurface,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  blueDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  countText: { fontSize: 11, fontFamily: 'Inter', fontWeight: '700', color: colors.primary },
  description: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Inter',
    color: colors.onSurfaceVariant,
    lineHeight: 20
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  memberCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 16,
    alignItems: 'center',
    marginBottom: 4,
  },
  cardControls: {
    position: 'absolute',
    right: 12,
    top: 16,
    gap: 8,
    zIndex: 10
  },
  controlBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarWrapper: {
    marginTop: 10,
    marginBottom: 12,
    position: 'relative'
  },
  statusDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  cardInfo: { alignItems: 'center', marginBottom: 12 },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 6,
  },
  roleBadgeText: { fontSize: 10, fontFamily: 'Inter', fontWeight: '800' },
  memberName: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '800',
    color: colors.onSurface,
    textAlign: 'center',
  },
  memberAge: { fontSize: 13, fontFamily: 'Inter', color: colors.outline, marginTop: 2 },
  healthFooter: {
    width: '100%',
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  healthLabel: { fontSize: 10, fontFamily: 'Inter', fontWeight: '700' },
  settingsSection: {
    marginTop: 32,
    backgroundColor: '#F1F4F8',
    borderRadius: 28,
    padding: 24,
  },
  settingsTitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: colors.outline,
    marginBottom: 16,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8
  },
  settingsIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingsItemText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: colors.onSurface
  },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 8, marginLeft: 56 },
  fab: {
    position: 'absolute',
    bottom: BOTTOM_NAV_HEIGHT + 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
});
