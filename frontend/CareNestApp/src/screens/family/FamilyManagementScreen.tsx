import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { TOP_BAR_HEIGHT, BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import Icon from '../../components/common/Icon';
import Avatar from '../../components/common/Avatar';
import FAB from '../../components/common/FAB';
import { mockFamilyMembers } from '../../data/mockFamilyMembers';
import type { FamilyStackParamList } from '../../navigation/navigationTypes';
import type { FamilyMember } from '../../types';

type NavProp = NativeStackNavigationProp<FamilyStackParamList, 'FamilyManagement'>;

const healthDotColor: Record<FamilyMember['healthStatus'], string> = {
  good:     '#2E7D32',
  warning:  '#E65100',
  critical: '#B71C1C',
};

export default function FamilyManagementScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const members = mockFamilyMembers;

  return (
    <View style={styles.root}>
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.headerTitle}>Gia dinh minh</Text>
          <Text style={styles.headerSub}>{members.length} thanh vien</Text>
        </View>
        <TouchableOpacity style={styles.headerAddBtn} activeOpacity={0.8} onPress={() => {}}>
          <Icon name='person_add' size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: TOP_BAR_HEIGHT + insets.top + 64, paddingBottom: BOTTOM_NAV_HEIGHT + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {members.map(member => (
          <TouchableOpacity
            key={member.id}
            style={[styles.memberCard, shadows.sm]}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('HealthProfileDetail', { memberId: member.id })}
          >
            <View style={styles.cardLeft}>
              <View style={styles.avatarWrapper}>
                <Avatar name={member.fullName} size='md' />
                <View style={[styles.healthDot, { backgroundColor: healthDotColor[member.healthStatus] }]} />
              </View>
            </View>
            <View style={styles.cardMid}>
              <Text style={styles.memberName}>{member.fullName}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{member.role}</Text>
              </View>
              {member.allergies && member.allergies.length > 0 && (
                <View style={styles.allergyRow}>
                  <Icon name='warning' size={12} color='#E65100' />
                  <Text style={styles.allergyText}>{member.allergies.length} di ung</Text>
                </View>
              )}
            </View>
            <View style={styles.cardRight}>
              {member.isCurrentUser && (
                <View style={styles.youBadge}><Text style={styles.youText}>Ban</Text></View>
              )}
              <Icon name='chevron_right' size={20} color={colors.onSurfaceVariant} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FAB iconName='add' onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
    backgroundColor: 'rgba(247,250,254,0.95)',
    paddingHorizontal: 20, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 24, fontFamily: 'Manrope', fontWeight: '800', color: colors.onSurface },
  headerSub: { fontSize: 13, fontFamily: 'Inter', color: colors.onSurfaceVariant, marginTop: 2 },
  headerAddBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { paddingHorizontal: 16, gap: 10 },
  memberCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center',
  },
  cardLeft: { marginRight: 12 },
  avatarWrapper: { position: 'relative' },
  healthDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: colors.surfaceContainerLowest,
  },
  cardMid: { flex: 1 },
  memberName: { fontSize: 15, fontFamily: 'Manrope', fontWeight: '700', color: colors.onSurface },
  roleBadge: {
    alignSelf: 'flex-start', marginTop: 3,
    backgroundColor: colors.secondaryContainer, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  roleText: { fontSize: 11, fontFamily: 'Inter', fontWeight: '600', color: colors.secondary },
  allergyRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  allergyText: { fontSize: 12, fontFamily: 'Inter', color: '#E65100' },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  youBadge: {
    backgroundColor: colors.tertiaryFixed, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  youText: { fontSize: 11, fontFamily: 'Inter', fontWeight: '700', color: colors.tertiary },
});