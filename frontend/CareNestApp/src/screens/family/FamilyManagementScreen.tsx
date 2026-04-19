import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, TextInput, Dimensions, KeyboardAvoidingView, Platform, Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { useFamily } from '../../context/FamilyContext';
import { BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import { mockFamilyMembers } from '../../data/mockFamilyMembers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HEALTH_CONFIG = {
  good: { color: '#10b981', label: 'SỨC KHỎE TỐT', icon: 'heart' },
  warning: { color: '#f59e0b', label: 'ĐANG UỐNG THUỐC', icon: 'medical-bag' },
  critical: { color: '#ef4444', label: 'SỨC KHỎE YẾU', icon: 'alert-circle' },
};

export default function FamilyManagementScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { hasFamily, familyName, familyImage, createFamily } = useFamily();

  const calculateAge = (birthday?: string) => {
    if (!birthday) return 0;
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const [step, setStep] = useState(1);
  const [tempName, setTempName] = useState('Tổ ấm thân thương');
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedRelation, setSelectedRelation] = useState('Mẹ');

  const handlePickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.assets && result.assets.length > 0) {
      setTempImage(result.assets[0].uri || null);
    }
  };

  const handleFinishSetup = () => {
    createFamily(tempName, tempImage);
  };

  // ── INVITE / ADD MEMBER CONTENT ─────────────────────────────────────────────
  // Single source of truth – reused by both the modal and renderInviteStep
  const renderInviteContent = () => (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View style={styles.centerContainer}>
        <Text style={styles.joinTitle}>Mời người thân</Text>
        <Text style={styles.joinSubText}>
          Chia sẻ không gian lưu trữ và theo dõi sức khỏe cùng gia đình bạn.
          Người được mời sẽ có quyền truy cập vào các hồ sơ chung.
        </Text>

        <View style={styles.inviteCard}>
          <Text style={styles.inputLabel}>EMAIL HOẶC SỐ ĐIỆN THOẠI</Text>
          <View style={[styles.joinInputWrap, { backgroundColor: '#e2e8f0' }]}>
            <MaterialCommunityIcons name="account-box-outline" size={20} color="#64748b" />
            <TextInput
              style={styles.joinInput}
              placeholder="vidu@email.com hoặc 090..."
              placeholderTextColor="#94a3b8"
            />
          </View>

          <Text style={[styles.inputLabel, { marginTop: 24 }]}>MỐI QUAN HỆ</Text>
          <View style={styles.relationGrid}>
            {['Bố', 'Mẹ', 'Anh', 'Chị', 'Em', 'Khác'].map((rel) => (
              <TouchableOpacity
                key={rel}
                style={[
                  styles.relationItem,
                  selectedRelation === rel && styles.relationItemSelected,
                ]}
                onPress={() => setSelectedRelation(rel)}
              >
                <MaterialCommunityIcons
                  name={
                    rel === 'Bố'
                      ? 'human-male'
                      : rel === 'Mẹ'
                        ? 'human-female'
                        : rel === 'Khác'
                          ? 'dots-horizontal'
                          : 'account'
                  }
                  size={24}
                  color={selectedRelation === rel ? '#0369a1' : '#64748b'}
                />
                <Text
                  style={[
                    styles.relationText,
                    selectedRelation === rel && styles.relationTextSelected,
                  ]}
                >
                  {rel}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.joinSubmitBtn, { marginTop: 32 }]} activeOpacity={0.8}>
            <Text style={styles.submitBtnText}>Gửi lời mời</Text>
            <MaterialCommunityIcons name="send" size={20} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <View style={[styles.infoIconWrap, { backgroundColor: '#dbeafe' }]}>
            <MaterialCommunityIcons name="shield-check" size={24} color="#2563eb" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoBoxTitle}>Bảo mật tuyệt đối</Text>
            <Text style={styles.infoBoxSub}>
              Chỉ những người bạn xác nhận mới có quyền xem dữ liệu nhạy cảm.
            </Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <View style={[styles.infoIconWrap, { backgroundColor: '#f1f5f9' }]}>
            <MaterialCommunityIcons name="sync" size={24} color="#64748b" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoBoxTitle}>Cập nhật tức thì</Text>
            <Text style={styles.infoBoxSub}>
              Thông tin sức khỏe được đồng bộ hóa ngay lập tức cho cả gia đình.
            </Text>
          </View>
        </View>

        <View style={styles.pendingSection}>
          <View style={styles.pendingHeader}>
            <MaterialCommunityIcons name="account-clock" size={22} color="#0369a1" />
            <Text style={styles.pendingTitle}>Lời mời đang chờ</Text>
          </View>
          <View style={styles.pendingItem}>
            <View style={styles.pendingAvatar}>
              <Text style={styles.avatarInitial}>T</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.pendingEmail}>tran.anh@email.com</Text>
              <Text style={styles.pendingStatus}>Đang chờ xác nhận • Chị</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.cancelLink}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // ── ADD MEMBER MODAL (triggered by FAB "+" in renderManagementStep) ─────────
  const renderAddMemberModal = () => (
    <Modal
      visible={addModalVisible}
      transparent={false}
      animationType="slide"
      onRequestClose={() => setAddModalVisible(false)}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {/* Modal Header */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => setAddModalVisible(false)}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Mời người thân</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Reuse same invite content */}
        {renderInviteContent()}
      </View>
    </Modal>
  );

  // ── STEP RENDERERS ──────────────────────────────────────────────────────────

  const renderInviteStep = () => renderInviteContent();

  const renderJoinStep = () => (
    <View style={styles.centerContainer}>
      <View style={styles.joinCard}>
        <View style={styles.blueBar} />
        <View style={styles.joinHeroIcon}>
          <MaterialCommunityIcons name="account-group" size={40} color="#1e293b" />
        </View>
        <Text style={styles.joinTitle}>Tham gia gia đình</Text>
        <Text style={styles.joinSubText}>
          Nhập mã được chia sẻ bởi người thân để kết nối với tổ ấm của bạn.
        </Text>
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Mã gia đình hoặc Số điện thoại</Text>
          <View style={styles.joinInputWrap}>
            <MaterialCommunityIcons name="key-variant" size={20} color="#94a3b8" />
            <TextInput
              style={styles.joinInput}
              placeholder="Nhập mã hoặc số điện thoại"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>
        <TouchableOpacity style={styles.joinSubmitBtn} activeOpacity={0.8}>
          <Text style={styles.submitBtnText}>Gửi yêu cầu tham gia</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.dividerWrap}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>HOẶC</Text>
          <View style={styles.dividerLine} />
        </View>
        <TouchableOpacity style={styles.qrBtn} activeOpacity={0.8}>
          <MaterialCommunityIcons name="qrcode-scan" size={20} color="#0369a1" />
          <Text style={styles.qrBtnText}>Quét mã QR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.joinBackBtn} onPress={() => setStep(1)}>
          <MaterialCommunityIcons name="arrow-left" size={18} color="#1e293b" />
          <Text style={styles.joinBackText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderWelcomeStep = () => (
    <View style={styles.centerContainer}>
      <View style={styles.heroCircle}>
        <MaterialCommunityIcons name="account-group-outline" size={120} color={colors.primary} />
      </View>
      <Text style={styles.stepTitle}>Bắt đầu tổ ấm của bạn</Text>
      <Text style={styles.stepSub}>
        Tạo gia đình để bắt đầu quản lý sức khỏe cho những người thân yêu.
      </Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(2)}>
        <MaterialCommunityIcons name="plus" size={24} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.primaryBtnText}>Tạo gia đình</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(4)}>
        <Text style={styles.secondaryBtnText}>Tham gia một gia đình hiện có</Text>
      </TouchableOpacity>
      <View style={styles.tipCard}>
        <View style={styles.tipIconWrap}>
          <MaterialCommunityIcons name="lightbulb-outline" size={24} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.tipTitle}>Mẹo nhỏ cho bạn</Text>
          <Text style={styles.tipText}>
            Việc kết nối các thành viên giúp bạn theo dõi lịch tiêm chủng và nhắc nhở uống thuốc tự động.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSetupStep = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.centerContainer}
    >
      <TouchableOpacity style={styles.photoUpload} onPress={handlePickImage} activeOpacity={0.9}>
        {tempImage ? (
          <Image source={{ uri: tempImage }} style={styles.fullPhoto} />
        ) : (
          <MaterialCommunityIcons name="account-group" size={100} color={colors.outline} />
        )}
        <View style={styles.cameraIcon}>
          <MaterialCommunityIcons name="camera" size={20} color="#fff" />
        </View>
      </TouchableOpacity>
      <Text style={styles.stepTitle}>Đặt tên cho tổ ấm</Text>
      <Text style={styles.stepSub}>
        Tên này sẽ hiển thị trên dashboard và các báo cáo sức khỏe chung của gia đình.
      </Text>
      <View style={styles.inputWrap}>
        <MaterialCommunityIcons
          name="account-group-outline"
          size={20}
          color={colors.outline}
          style={{ marginRight: 12 }}
        />
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: Gia đình hạnh phúc..."
          value={tempName}
          onChangeText={setTempName}
        />
      </View>
      <View style={[styles.tipCard, { marginTop: 20 }]}>
        <View style={styles.tipIconWrap}>
          <MaterialCommunityIcons name="information-outline" size={24} color={colors.secondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.tipTitle}>Mẹo nhỏ</Text>
          <Text style={styles.tipText}>
            Bạn có thể thay đổi tên này bất cứ lúc nào trong phần cài đặt gia đình.
          </Text>
        </View>
      </View>
      <View style={{ flex: 1 }} />
      <TouchableOpacity style={styles.primaryBtn} onPress={handleFinishSetup}>
        <Text style={styles.primaryBtnText}>Tiếp tục</Text>
        <MaterialCommunityIcons name="arrow-right" size={24} color="#fff" style={{ marginLeft: 8 }} />
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );

  // ── MANAGEMENT SCREEN (step after hasFamily = true) ─────────────────────────
  const renderManagementStep = () => (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.root}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={styles.managementTitleArea}>
          <View style={styles.titleRow}>
            <Text style={styles.managementTitle}>{familyName}</Text>
            <View style={styles.memberPill}>
              <Text style={styles.memberPillText}>{mockFamilyMembers.length} Thành viên</Text>
            </View>
          </View>
          <Text style={styles.managementSub}>
            Quản lý sức khỏe và lịch trình của cả gia đình.
          </Text>
        </View>

        <View style={styles.memberList}>
          {mockFamilyMembers.map((member) => {
            const age = calculateAge(member.birthday);
            const isChild = age < 20;

            return (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberCardMain}>
                  <View style={styles.avatarWrapper}>
                    <Image
                      source={{
                        uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          member.fullName
                        )}&background=${member.gender === 'Nữ' ? 'fdf2f8' : 'eff6ff'}&color=${
                          member.gender === 'Nữ' ? 'db2777' : '2563eb'
                        }&bold=true`,
                      }}
                      style={styles.memberImage}
                    />
                    <View style={[styles.statusDot, { backgroundColor: '#60a5fa' }]} />
                  </View>

                  <TouchableOpacity 
                    style={styles.memberInfo}
                    onPress={() => navigation.navigate('UserMedical', { memberId: member.profileId || member.id })}
                  >
                    <View style={styles.nameRow}>
                      <Text style={styles.memberName}>{member.fullName}</Text>
                      <View style={styles.roleTag}>
                        <Text style={styles.roleTagText}>{member.role}</Text>
                      </View>
                    </View>
                    <Text style={styles.memberAge}>{age} Tuổi</Text>
                  </TouchableOpacity>
                </View>

                {isChild && (
                  <TouchableOpacity 
                    style={styles.growthBar}
                    onPress={() => navigation.navigate('GrowthTracker', { memberId: member.id })}
                  >
                    <MaterialCommunityIcons name="human-male-female-child" size={18} color="#0369a1" />
                    <Text style={styles.growthBarText}>THEO DÕI PHÁT TRIỂN</Text>
                    <MaterialCommunityIcons name="chevron-right" size={18} color="#0369a1" style={{ marginLeft: 'auto' }} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* FAB "+" → opens Add Member modal */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.9}
        onPress={() => setAddModalVisible(true)}
      >
        <MaterialCommunityIcons name="plus" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  // ── ROOT RENDER ─────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity style={styles.profileBtn}>
            <Image
              source={{ uri: 'https://ui-avatars.com/api/?name=User&background=1a73e8&color=fff' }}
              style={styles.smallAvatar}
            />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>{familyName}</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <MaterialCommunityIcons name="bell" size={24} color="#0369a1" />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      {!hasFamily ? (
        step === 1
          ? renderWelcomeStep()
          : step === 4
            ? renderJoinStep()
            : renderSetupStep()
      ) : step === 5 ? (
        renderInviteStep()
      ) : (
        renderManagementStep()
      )}

      {/* Add Member Modal – always mounted so it can animate in */}
      {renderAddMemberModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  topBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  topBarTitle: { fontSize: 18, fontWeight: '800', color: '#0369a1' },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  smallAvatar: { width: 36, height: 36, borderRadius: 18 },
  notifBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },

  centerContainer: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  heroCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
    marginBottom: 40,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepSub: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  primaryBtn: {
    width: '100%',
    height: 56,
    backgroundColor: '#1a73e8',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  secondaryBtn: { marginTop: 20, padding: 10 },
  secondaryBtnText: { color: '#1a73e8', fontSize: 15, fontWeight: '600' },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    padding: 20,
    marginTop: 60,
    alignItems: 'center',
    gap: 16,
  },
  tipIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: { fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 2 },
  tipText: { fontSize: 13, color: '#64748b', lineHeight: 18 },
  photoUpload: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 40,
    position: 'relative',
    overflow: 'hidden',
  },
  fullPhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
  cameraIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a73e8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  inputWrap: {
    width: '100%',
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  input: { flex: 1, fontSize: 16, color: '#1e293b', fontWeight: '500' },

  managementTitleArea: { padding: 24, paddingBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  managementTitle: { fontSize: 32, fontWeight: '900', color: '#1e293b' },
  memberPill: {
    backgroundColor: '#dcf0ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  memberPillText: { fontSize: 13, fontWeight: '700', color: '#0369a1' },
  managementSub: { fontSize: 15, color: '#64748b', lineHeight: 22, width: '80%' },

  memberList: { paddingHorizontal: 20 },
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  memberCardMain: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarWrapper: { position: 'relative' },
  memberImage: { width: 64, height: 64, borderRadius: 32 },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  memberInfo: { flex: 1, marginLeft: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  memberName: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  roleTag: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  roleTagText: { fontSize: 11, fontWeight: '800', color: '#64748b' },
  memberAge: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  growthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 14,
    borderRadius: 20,
    gap: 10,
  },
  growthBarText: { fontSize: 13, fontWeight: '800', color: '#0369a1', letterSpacing: 0.5 },

  settingsArea: { marginHorizontal: 16, marginTop: 8, padding: 20, backgroundColor: '#f1f5f9', borderRadius: 24 },
  settingsTitle: { fontSize: 17, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingText: { fontSize: 15, fontWeight: '600', color: '#334155' },

  fab: {
    position: 'absolute',
    bottom: BOTTOM_NAV_HEIGHT + 12,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },

  // ── Invite / Add Member ──────────────────────────────────────────────────────
  inviteCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    width: '100%',
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 24,
  },
  inputLabel: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 10, marginLeft: 4 },
  joinInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 60,
  },
  joinInput: { flex: 1, marginLeft: 12, fontSize: 16, color: '#0f172a', fontWeight: '600' },
  relationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  relationItem: {
    width: (SCREEN_WIDTH - 48 - 48 - 12) / 2,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  relationItemSelected: { borderColor: '#1a73e8', backgroundColor: '#eff6ff' },
  relationText: { fontSize: 14, fontWeight: '700', color: '#64748b', marginTop: 8 },
  relationTextSelected: { color: '#0369a1' },
  joinSubmitBtn: {
    width: '100%',
    height: 60,
    borderRadius: 20,
    backgroundColor: '#1a73e8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  submitBtnText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  infoIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoBoxTitle: { fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 2 },
  infoBoxSub: { fontSize: 13, color: '#64748b', lineHeight: 18 },
  pendingSection: { width: '100%', marginTop: 24 },
  pendingHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, paddingHorizontal: 12 },
  pendingTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  pendingAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 18, fontWeight: '800', color: '#1a73e8' },
  pendingEmail: { fontSize: 14, fontWeight: '700', color: '#334155' },
  pendingStatus: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  cancelLink: { fontSize: 14, fontWeight: '800', color: '#ef4444', padding: 10 },

  // ── Join Family ──────────────────────────────────────────────────────────────
  joinCard: {
    backgroundColor: '#fff',
    borderRadius: 40,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 10,
    marginTop: 40,
    overflow: 'hidden',
    width: '100%',
  },
  blueBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 6, backgroundColor: '#1a73e8' },
  joinHeroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  joinTitle: { fontSize: 32, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 12 },
  joinSubText: { fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  inputSection: { width: '100%', marginBottom: 24 },
  dividerWrap: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 32 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#f1f5f9' },
  dividerText: { marginHorizontal: 16, fontSize: 14, fontWeight: '800', color: '#cbd5e1', letterSpacing: 1 },
  qrBtn: {
    width: '100%',
    height: 60,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  qrBtnText: { fontSize: 16, fontWeight: '800', color: '#0369a1' },
  joinBackBtn: { marginTop: 32, flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10 },
  joinBackText: { fontSize: 16, fontWeight: '700', color: '#1a73e8' },
});