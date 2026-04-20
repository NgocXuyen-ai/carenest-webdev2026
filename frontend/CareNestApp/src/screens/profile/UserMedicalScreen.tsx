import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ProfileStackParamList } from '../../navigation/navigationTypes';
import Icon from '../../components/common/Icon';
import { useAuth } from '../../context/AuthContext';
import { useFamily } from '../../context/FamilyContext';
import { getCurrentUserProfile } from '../../api/auth';
import { getFamilyProfile, type FamilyRole, type ProfileDetails, updateFamilyMemberRole } from '../../api/family';
import { formatBloodType, formatGender } from '../../utils/healthOptions';
import Emergency from './Emergency';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_WIDTH = (SCREEN_WIDTH - 40) / 2;
const DEFAULT_EDITABLE_ROLE_OPTIONS: FamilyRole[] = [
  'MEMBER',
  'FATHER',
  'MOTHER',
  'OLDER_BROTHER',
  'OLDER_SISTER',
  'YOUNGER',
  'OTHER',
];

const HealthCard = ({ title, value, icon, bgColor, textColor, children }: any) => (
  <View style={[styles.healthCard, { backgroundColor: bgColor }]}>
    <View style={styles.cardHeader}>
      <Icon name={icon} size={20} color={textColor} />
      <Text style={[styles.cardTitle, { color: textColor }]}>{title}</Text>
    </View>
    {children ? children : <Text style={[styles.cardValue, { color: textColor }]}>{value}</Text>}
  </View>
);

const StatItem = ({ label, value, unit, isBmi = false }: any) => (
  <View style={[styles.statItem, isBmi && { flex: 1.3 }]}>
    <Text style={styles.statLabel}>{label}</Text>
    <View style={styles.statLine}>
      <Text style={styles.statValue}>{value}</Text>
      {unit ? <Text style={styles.statUnit}>{unit}</Text> : null}
      {isBmi ? (
        <View style={styles.bmiMiniBar}>
          <View style={styles.bmiBarBg}>
            <View style={[styles.bmiBarFill, { width: '60%' }]} />
          </View>
        </View>
      ) : null}
    </View>
  </View>
);

function calculateAge(birthday?: string | null) {
  if (!birthday) {
    return '';
  }
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return String(age);
}

function formatRole(role?: FamilyRole | null) {
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
    case 'OTHER':
      return 'Người thân';
    case 'MEMBER':
    default:
      return 'Thành viên';
  }
}

export default function UserMedicalScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ProfileStackParamList, 'UserMedical'>>();
  const { memberId } = route.params || {};
  const { user } = useAuth();
  const { family, members, refreshFamily } = useFamily();

  const [activeTab, setActiveTab] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [profile, setProfile] = useState<ProfileDetails | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isRoleDropdownVisible, setIsRoleDropdownVisible] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      if (memberId) {
        const response = await getFamilyProfile(Number(memberId));
        setProfile(response);
        return;
      }

      const response = await getCurrentUserProfile();
      setProfile({
        profileId: response.profileId,
        fullName: response.fullName,
        birthday: response.birthday,
        gender: response.gender,
        bloodType: response.bloodType,
        height: response.height,
        weight: response.weight,
        medicalHistory: response.medicalHistory,
        allergy: response.allergy,
        emergencyContactPhone: response.emergencyContactPhone,
      });
    } catch {
      setProfile(null);
    }
  }, [memberId]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const age = useMemo(() => calculateAge(profile?.birthday), [profile?.birthday]);
  const viewedProfileId = useMemo(() => {
    if (memberId) {
      return Number(memberId);
    }

    if (profile?.profileId) {
      return Number(profile.profileId);
    }

    return user?.profileId ? Number(user.profileId) : null;
  }, [memberId, profile?.profileId, user?.profileId]);

  const myMember = useMemo(
    () => members.find(member => String(member.profileId) === user?.profileId),
    [members, user?.profileId],
  );

  const targetMember = useMemo(() => {
    if (!viewedProfileId) {
      return undefined;
    }
    return members.find(member => member.profileId === viewedProfileId);
  }, [members, viewedProfileId]);

  const isOwner = family?.ownerUserId ? family.ownerUserId === user?.userId : myMember?.role === 'OWNER';
  const isSelfProfile = viewedProfileId !== null && String(viewedProfileId) === user?.profileId;
  const isTargetOwner =
    targetMember?.role === 'OWNER' || (Boolean(targetMember) && isOwner && isSelfProfile);
  const canEditRole = Boolean(targetMember) && !isTargetOwner && (isOwner || isSelfProfile);

  const editableRoleOptions = useMemo(() => {
    if (!targetMember) {
      return [] as FamilyRole[];
    }

    return DEFAULT_EDITABLE_ROLE_OPTIONS;
  }, [targetMember]);

  const roleLabel = useMemo(() => {
    if (targetMember?.role) {
      return formatRole(targetMember.role);
    }

    if (!memberId) {
      return 'Tài khoản của bạn';
    }

    return 'Thành viên';
  }, [memberId, targetMember?.role]);
  const bmi = useMemo(() => {
    const height = Number(profile?.height || 0);
    const weight = Number(profile?.weight || 0);
    if (height <= 30 || weight <= 2) {
      return '--';
    }
    return (weight / ((height / 100) ** 2)).toFixed(1);
  }, [profile?.height, profile?.weight]);

  const handleTabPress = (index: number) => {
    setActiveTab(index);
    Animated.spring(slideAnim, {
      toValue: index * TAB_WIDTH,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  };

  const allergies = (profile?.allergy || 'Không có')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

  const handleUpdateMemberRole = async (nextRole: FamilyRole) => {
    if (!viewedProfileId) {
      return;
    }

    try {
      setIsUpdatingRole(true);
      await updateFamilyMemberRole(viewedProfileId, nextRole);
      await Promise.all([refreshFamily(), loadProfile()]);
      Alert.alert('Cập nhật thành công', 'Vai trò thành viên đã được cập nhật.');
    } catch (error) {
      Alert.alert(
        'Không thể cập nhật vai trò',
        error instanceof Error ? error.message : 'Đã có lỗi xảy ra',
      );
    } finally {
      setIsUpdatingRole(false);
      setIsRoleDropdownVisible(false);
    }
  };

  const openRoleEditor = () => {
    if (!canEditRole || !targetMember || isUpdatingRole) {
      return;
    }

    setIsRoleDropdownVisible(prev => !prev);
  };

  const handleSelectRole = (role: FamilyRole) => {
    if (!targetMember || isUpdatingRole) {
      return;
    }

    setIsRoleDropdownVisible(false);
    if (targetMember.role === role) {
      return;
    }

    void handleUpdateMemberRole(role);
  };

  const renderTabContent = () => {
    if (activeTab === 1) {
      return (
        <Emergency
          fullName={profile?.fullName}
          bloodType={profile?.bloodType}
          allergy={profile?.allergy}
          medicalHistory={profile?.medicalHistory}
          emergencyContactPhone={profile?.emergencyContactPhone}
        />
      );
    }

    return (
      <View style={styles.tabContent}>
        <View style={styles.grid}>
          <HealthCard
            title="NHÓM MÁU"
            value={formatBloodType(profile?.bloodType)}
            icon="bloodtype"
            bgColor="#FFEBEB"
            textColor="#B91C1C"
          />
          <HealthCard
            title="DỊ ỨNG"
            value={profile?.allergy || 'Không có'}
            icon="warning"
            bgColor="#FFF4E6"
            textColor="#9A3412"
          >
            <View style={styles.pillContainer}>
              {allergies.map((tag, idx) => (
                <View key={`${tag}-${idx}`} style={styles.pill}>
                  <Text style={styles.pillText}>{tag.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          </HealthCard>
        </View>

        <View style={styles.statsRow}>
          <StatItem label="CHIỀU CAO" value={profile?.height ?? '--'} unit="cm" />
          <StatItem label="CÂN NẶNG" value={profile?.weight ?? '--'} unit="kg" />
          <StatItem label="BMI" value={bmi} isBmi />
        </View>

        <View style={styles.sectionHeader}>
          <Icon name="history_edu" size={20} color="#666" />
          <Text style={styles.sectionTitle}>TIỀN SỬ BỆNH LÝ</Text>
        </View>

        <View style={styles.historyList}>
          {profile?.medicalHistory ? (
            <View style={styles.historyItemLast}>
              <Text style={styles.historyName}>Ghi chú bệnh lý</Text>
              <Text style={styles.historyDesc}>{profile.medicalHistory}</Text>
            </View>
          ) : (
            <View style={styles.historyItemLast}>
              <Text style={styles.historyName}>Chưa có dữ liệu</Text>
              <Text style={styles.historyDesc}>
                Thông tin bệnh lý sẽ hiển thị tại đây khi được cập nhật.
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow_back" size={24} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CareNest</Text>
        <View style={styles.editBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          <View style={styles.avatarWrap}>
            <Image
              source={{
                uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  profile?.fullName || 'CareNest',
                )}&background=eff6ff&color=2563eb&bold=true`,
              }}
              style={styles.avatar}
            />
            <View style={styles.verifiedBadge}>
              <Icon name="verified" size={16} color="#fff" />
            </View>
          </View>

          <Text style={styles.userName}>{profile?.fullName || 'Đang tải...'}</Text>
          <View style={styles.roleEditorWrap}>
            <View style={styles.roleRow}>
              <View style={styles.roleChip}>
                <Text style={styles.roleText}>{roleLabel}</Text>
              </View>
              {canEditRole ? (
                <TouchableOpacity
                  style={styles.roleEditBtn}
                  onPress={openRoleEditor}
                  disabled={isUpdatingRole}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="pencil" size={14} color="#3B82F6" />
                </TouchableOpacity>
              ) : null}
            </View>

            {canEditRole && isRoleDropdownVisible && targetMember ? (
              <View style={styles.roleDropdown}>
                {editableRoleOptions.map(role => {
                  const isCurrentRole = targetMember.role === role;
                  return (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleDropdownItem,
                        isCurrentRole && styles.roleDropdownItemSelected,
                      ]}
                      onPress={() => handleSelectRole(role)}
                      disabled={isUpdatingRole}
                    >
                      <Text
                        style={[
                          styles.roleDropdownText,
                          isCurrentRole && styles.roleDropdownTextSelected,
                        ]}
                      >
                        {formatRole(role)}
                      </Text>
                      {isCurrentRole ? (
                        <MaterialCommunityIcons name="check" size={16} color="#3B82F6" />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </View>
          <Text style={styles.userMeta}>
            {age || '--'} Tuổi • {formatGender(profile?.gender)}
          </Text>
        </View>

        <View style={styles.tabContainer}>
          <Animated.View style={[styles.slideBg, { transform: [{ translateX: slideAnim }] }]} />
          <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress(0)}>
            <Text style={[styles.tabLabel, activeTab === 0 && styles.activeLabel]}>
              Thông tin
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress(1)}>
            <Text style={[styles.tabLabel, activeTab === 1 && styles.activeLabel]}>
              Khẩn cấp
            </Text>
          </TouchableOpacity>
        </View>

        {renderTabContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCFDFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E3A8A', fontFamily: 'Inter' },
  editBtn: { width: 44, height: 44 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 120 },
  profileSection: { alignItems: 'center', marginTop: 24, marginBottom: 32 },
  avatarWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 4,
    backgroundColor: '#fff',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatar: { width: '100%', height: '100%', borderRadius: 60 },
  verifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 16,
    fontFamily: 'Inter',
  },
  roleEditorWrap: { alignItems: 'center', marginTop: 10 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleChip: {
    backgroundColor: '#EBF2FF',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: { color: '#3B82F6', fontSize: 13, fontWeight: '800', fontFamily: 'Inter' },
  roleEditBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF2FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  roleDropdown: {
    width: 200,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    overflow: 'hidden',
  },
  roleDropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleDropdownItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  roleDropdownText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    fontFamily: 'Inter',
  },
  roleDropdownTextSelected: {
    color: '#3B82F6',
  },
  userMeta: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 8,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    padding: 6,
    marginBottom: 32,
    position: 'relative',
  },
  slideBg: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: TAB_WIDTH,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabItem: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 16, fontWeight: '700', color: '#64748B', fontFamily: 'Inter' },
  activeLabel: { color: '#1E3A8A' },
  tabContent: { paddingHorizontal: 16 },
  grid: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  healthCard: { flex: 1, padding: 20, borderRadius: 28 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 12, fontWeight: '800', fontFamily: 'Inter', textAlign: 'center' },
  cardValue: { fontSize: 40, fontWeight: '800', textAlign: 'center' },
  pillContainer: { gap: 6, alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pillText: { fontSize: 11, fontWeight: '700', color: '#9A3412' },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 4,
    marginBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 24,
  },
  statItem: { flex: 1 },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  statLine: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#1E293B', fontFamily: 'Inter' },
  statUnit: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  bmiMiniBar: { flex: 1, marginLeft: 10, alignSelf: 'center' },
  bmiBarBg: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  bmiBarFill: { height: '100%', backgroundColor: '#3B82F6' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#444', fontFamily: 'Inter' },
  historyList: { backgroundColor: '#F8FAFC', borderRadius: 24, padding: 8 },
  historyItemLast: { padding: 16 },
  historyName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  historyDesc: { fontSize: 14, color: '#64748B', lineHeight: 20 },
});
