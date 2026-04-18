import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import Icon from '../../components/common/Icon';
import Avatar from '../../components/common/Avatar';
import { useAuth } from '../../context/AuthContext';

interface SettingsRowProps {
  icon: string;
  label: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  isFirst?: boolean;
  isLast?: boolean;
  danger?: boolean;
}

function SettingsRow({ icon, label, onPress, rightElement, isFirst, isLast, danger }: SettingsRowProps) {
  return (
    <TouchableOpacity
      style={[styles.row, !isFirst && styles.rowDivider, isFirst && styles.rowFirst, isLast && styles.rowLast]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.rowIconWrap, { backgroundColor: danger ? colors.errorContainer : colors.primaryFixed }]}>
        <Icon name={icon} size={18} color={danger ? colors.onErrorContainer : colors.primary} />
      </View>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {rightElement ?? (onPress ? <Icon name="chevron_right" size={18} color={colors.onSurfaceVariant} /> : null)}
    </TouchableOpacity>
  );
}

export default function UserProfileSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [medReminder, setMedReminder] = useState(true);
  const [apptReminder, setApptReminder] = useState(true);

  const switchMed = (
    <Switch
      value={medReminder}
      onValueChange={setMedReminder}
      trackColor={{ false: colors.outlineVariant, true: colors.primary }}
      thumbColor={colors.onPrimary}
    />
  );
  const switchAppt = (
    <Switch
      value={apptReminder}
      onValueChange={setApptReminder}
      trackColor={{ false: colors.outlineVariant, true: colors.primary }}
      thumbColor={colors.onPrimary}
    />
  );

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 24, paddingBottom: BOTTOM_NAV_HEIGHT + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header */}
        <View style={styles.profileCard}>
          <Avatar name={user?.fullName} size="xl" bordered />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.fullName ?? 'Người dùng'}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} activeOpacity={0.8}>
            <Icon name="edit" size={16} color={colors.primary} />
            <Text style={styles.editBtnText}>Chỉnh sửa</Text>
          </TouchableOpacity>
        </View>

        {/* Tài khoản */}
        <Text style={styles.sectionLabel}>Tài khoản</Text>
        <View style={[styles.card, shadows.sm]}>
          <SettingsRow icon="manage_accounts" label="Chỉnh sửa hồ sơ" onPress={() => {}} isFirst />
          <SettingsRow icon="lock" label="Đổi mật khẩu" onPress={() => {}} />
          <SettingsRow icon="google" label="Tài khoản Google" onPress={() => {}} isLast />
        </View>

        {/* Thông báo */}
        <Text style={styles.sectionLabel}>Thông báo</Text>
        <View style={[styles.card, shadows.sm]}>
          <SettingsRow icon="medication" label="Nhắc uống thuốc" rightElement={switchMed} isFirst />
          <SettingsRow icon="calendar_month" label="Nhắc lịch tái khám" rightElement={switchAppt} isLast />
        </View>

        {/* Ứng dụng */}
        <Text style={styles.sectionLabel}>Ứng dụng</Text>
        <View style={[styles.card, shadows.sm]}>
          <SettingsRow
            icon="language"
            label="Ngôn ngữ"
            rightElement={<Text style={styles.valueText}>Tiếng Việt</Text>}
            isFirst
          />
          <SettingsRow icon="info" label="Về CareNest" onPress={() => {}} />
          <SettingsRow icon="privacy_tip" label="Chính sách bảo mật" onPress={() => {}} isLast />
        </View>

        {/* Hỗ trợ */}
        <Text style={styles.sectionLabel}>Hỗ trợ</Text>
        <View style={[styles.card, shadows.sm]}>
          <SettingsRow icon="help" label="Trung tâm hỗ trợ" onPress={() => {}} isFirst />
          <SettingsRow icon="bug_report" label="Báo cáo sự cố" onPress={() => {}} isLast />
        </View>

        {/* Đăng xuất */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Icon name="logout" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 16, gap: 8 },

  profileCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    ...shadows.sm,
  },
  profileInfo: { alignItems: 'center', gap: 4 },
  profileName: { fontSize: 20, fontFamily: 'Manrope', fontWeight: '800', color: colors.onSurface },
  profileEmail: { fontSize: 13, fontFamily: 'Inter', color: colors.onSurfaceVariant },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryFixed,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editBtnText: { fontSize: 13, fontFamily: 'Inter', fontWeight: '600', color: colors.primary },

  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
    marginLeft: 4,
    marginTop: 8,
    marginBottom: 4,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  rowFirst: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  rowLast: { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
  },
  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter', fontWeight: '500', color: colors.onSurface },
  rowLabelDanger: { color: colors.error },
  valueText: { fontSize: 13, fontFamily: 'Inter', color: colors.onSurfaceVariant },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
    paddingVertical: 16,
    backgroundColor: colors.errorContainer,
    borderRadius: 16,
  },
  logoutText: { fontSize: 15, fontFamily: 'Inter', fontWeight: '700', color: colors.error },
});
