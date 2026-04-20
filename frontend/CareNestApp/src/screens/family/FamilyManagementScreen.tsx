import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { Permission } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchCamera, launchImageLibrary, type Asset, type ImagePickerResponse } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import { useFamily } from '../../context/FamilyContext';
import { useAuth } from '../../context/AuthContext';
import FAB from '../../components/common/FAB';
import {
  acceptInvitation,
  type FamilyRole,
  getFamilyJoinCode,
  getReceivedInvitations,
  getSentInvitations,
  inviteMember,
  joinFamilyByCode,
  joinFamilyByQr,
  rejectInvitation,
  rotateFamilyJoinCode,
  getFamilyProfile,
  type FamilyInvitationItem,
  type FamilyJoinCodeResponse,
} from '../../api/family';
import { getGrowthSummary } from '../../api/growth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RELATIONS = ['Bố', 'Mẹ', 'Anh', 'Chị', 'Em', 'Khác'] as const;
const JOIN_ROLE_OPTIONS = [
  { label: 'Thành viên', value: 'MEMBER', icon: 'account' },
  { label: 'Bố', value: 'FATHER', icon: 'human-male' },
  { label: 'Mẹ', value: 'MOTHER', icon: 'human-female' },
  { label: 'Anh', value: 'OLDER_BROTHER', icon: 'face-man' },
  { label: 'Chị', value: 'OLDER_SISTER', icon: 'face-woman' },
  { label: 'Em', value: 'YOUNGER', icon: 'human-child' },
  { label: 'Người thân', value: 'OTHER', icon: 'account-heart' },
] as const;

type JoinRoleValue = (typeof JOIN_ROLE_OPTIONS)[number]['value'];

function mapRelationToRole(relation: string): FamilyRole {
  switch (relation) {
    case 'Bố':
      return 'FATHER';
    case 'Mẹ':
      return 'MOTHER';
    case 'Anh':
      return 'OLDER_BROTHER';
    case 'Chị':
      return 'OLDER_SISTER';
    case 'Em':
      return 'YOUNGER';
    default:
      return 'OTHER';
  }
}

function formatRole(role?: string | null) {
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
    case 'MEMBER':
      return 'Thành viên';
    case 'OTHER':
      return 'Người thân';
    default:
      return role || 'Thành viên';
  }
}

function formatInvitationStatus(status?: string) {
  switch (status) {
    case 'PENDING':
      return 'Đang chờ xác nhận';
    case 'ACCEPTED':
      return 'Đã chấp nhận';
    case 'REJECTED':
      return 'Đã từ chối';
    default:
      return 'Đang xử lý';
  }
}

export default function FamilyManagementScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { hasFamily, family, familyName, createFamily, members, refreshFamily } = useFamily();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [tempName, setTempName] = useState('Tổ ấm thân thương');
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedRelation, setSelectedRelation] =
    useState<(typeof RELATIONS)[number]>('Mẹ');
  const [inviteValue, setInviteValue] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [selectedJoinRole, setSelectedJoinRole] = useState<JoinRoleValue>('MEMBER');
  const [receivedInvitations, setReceivedInvitations] = useState<FamilyInvitationItem[]>([]);
  const [sentInvitations, setSentInvitations] = useState<FamilyInvitationItem[]>([]);
  const [joinCodeInfo, setJoinCodeInfo] = useState<FamilyJoinCodeResponse | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const myMember = useMemo(
    () => members.find(member => String(member.profileId) === user?.profileId),
    [members, user?.profileId],
  );
  const isOwner = family?.ownerUserId
    ? family.ownerUserId === user?.userId
    : myMember?.role === 'OWNER';

  const prefetchMemberMedical = (profileId: number) => {
    void getFamilyProfile(profileId);
  };

  const prefetchMemberGrowth = (profileId: number) => {
    void Promise.allSettled([getFamilyProfile(profileId), getGrowthSummary(profileId)]);
  };

  useEffect(() => {
    async function loadFamilyExtras() {
      if (hasFamily) {
        try {
          const sent = isOwner ? await getSentInvitations() : [];
          setSentInvitations(sent);
        } catch {
          setSentInvitations([]);
        }
        setReceivedInvitations([]);
        return;
      }

      try {
        const invites = await getReceivedInvitations();
        setReceivedInvitations(invites);
      } catch {
        setReceivedInvitations([]);
      }
      setSentInvitations([]);
      setJoinCodeInfo(null);
    }

    void loadFamilyExtras();
  }, [hasFamily, isOwner]);

  const ensureAndroidPermission = async (
    permission: Permission,
    title: string,
    message: string,
  ): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }

    const alreadyGranted = await PermissionsAndroid.check(permission);
    if (alreadyGranted) {
      return true;
    }

    const granted = await PermissionsAndroid.request(permission, {
      title,
      message,
      buttonPositive: 'Cho phép',
      buttonNegative: 'Từ chối',
      buttonNeutral: 'Để sau',
    });
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const ensureCameraPermission = async (): Promise<boolean> => {
    return ensureAndroidPermission(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      'Cho phép dùng camera',
      'CareNest cần quyền camera để quét mã QR gia đình.',
    );
  };

  const ensureLibraryPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }

    const permissions = PermissionsAndroid.PERMISSIONS as Record<string, string | undefined>;
    const permission =
      Platform.Version >= 33
        ? permissions.READ_MEDIA_IMAGES
        : permissions.READ_EXTERNAL_STORAGE;

    if (!permission) {
      return true;
    }

    return ensureAndroidPermission(
      permission as Permission,
      'Cho phép truy cập ảnh',
      'CareNest cần quyền truy cập ảnh để quét mã QR từ thư viện.',
    );
  };

  const getAssetFromPickerResponse = (
    response: ImagePickerResponse,
    sourceName: 'camera' | 'thư viện',
  ): Asset | null => {
    if (response.didCancel) {
      return null;
    }

    if (response.errorCode) {
      Alert.alert(
        `Không thể mở ${sourceName}`,
        response.errorMessage || 'Vui lòng kiểm tra quyền truy cập và thử lại.',
      );
      return null;
    }

    const asset = response.assets?.[0];
    if (!asset) {
      Alert.alert('Không có ảnh', `Chưa nhận được ảnh từ ${sourceName}.`);
      return null;
    }

    if (!asset.uri) {
      Alert.alert('Không thể đọc ảnh', 'Ảnh chưa có dữ liệu hợp lệ. Vui lòng thử ảnh khác.');
      return null;
    }

    return asset;
  };

  const handlePickImage = async () => {
    const granted = await ensureLibraryPermission();
    if (!granted) {
      Alert.alert('Thiếu quyền truy cập ảnh', 'Vui lòng cấp quyền để chọn ảnh từ thư viện.');
      return;
    }

    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1 });
    const asset = getAssetFromPickerResponse(result, 'thư viện');
    if (!asset?.uri) {
      return;
    }

    setTempImage(asset.uri);
  };

  const handleFinishSetup = async () => {
    if (!tempName.trim()) {
      Alert.alert(
        'Thiếu tên gia đình',
        'Vui lòng nhập tên trước khi tạo gia đình.',
      );
      return;
    }

    try {
      setIsBusy(true);
      await createFamily(tempName.trim(), tempImage);
      setStep(1);
    } catch (error) {
      Alert.alert(
        'Không thể tạo gia đình',
        error instanceof Error ? error.message : 'Đã có lỗi xảy ra',
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteValue.trim()) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng nhập email người thân.',
      );
      return;
    }

    try {
      setIsBusy(true);
      await inviteMember(inviteValue.trim(), mapRelationToRole(selectedRelation));
      setInviteValue('');
      setSentInvitations(await getSentInvitations());
      Alert.alert(
        'Đã gửi lời mời',
        'Người thân của bạn sẽ nhận được lời mời tham gia gia đình.',
      );
    } catch (error) {
      Alert.alert(
        'Không thể gửi lời mời',
        error instanceof Error ? error.message : 'Đã có lỗi xảy ra',
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleJoinByCode = async () => {
    const code = joinCodeInput.trim();
    if (!code) {
      Alert.alert(
        'Thiếu mã tham gia',
        'Vui lòng nhập mã hoặc quét mã QR để tham gia gia đình.',
      );
      return;
    }

    try {
      setIsBusy(true);
      await joinFamilyByCode(code, selectedJoinRole);
      await refreshFamily();
      setJoinCodeInput('');
      setSelectedJoinRole('MEMBER');
      Alert.alert(
        'Tham gia thành công',
        'Bạn đã được thêm vào gia đình.',
      );
    } catch (error) {
      Alert.alert(
        'Không thể tham gia',
        error instanceof Error ? error.message : 'Đã có lỗi xảy ra',
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleJoinByQrImage = async (source: 'camera' | 'library') => {
    const granted = source === 'camera'
      ? await ensureCameraPermission()
      : await ensureLibraryPermission();

    if (!granted) {
      Alert.alert(
        source === 'camera' ? 'Thiếu quyền camera' : 'Thiếu quyền truy cập ảnh',
        source === 'camera'
          ? 'Vui lòng cấp quyền camera để quét mã QR.'
          : 'Vui lòng cấp quyền để chọn ảnh QR từ thư viện.',
      );
      return;
    }

    const picker = source === 'camera' ? launchCamera : launchImageLibrary;
    const result = await picker({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });

    const sourceName = source === 'camera' ? 'camera' : 'thư viện';
    const asset = getAssetFromPickerResponse(result, sourceName);
    if (!asset?.uri) {
      return;
    }

    try {
      setIsBusy(true);
      const formData = new FormData();
      formData.append('image', {
        uri: asset.uri,
        name: asset.fileName || 'family-qr.jpg',
        type: asset.type || 'image/jpeg',
      } as never);
      formData.append('role', selectedJoinRole);
      await joinFamilyByQr(formData);
      await refreshFamily();
      setSelectedJoinRole('MEMBER');
      Alert.alert(
        'Tham gia thành công',
        'Bạn đã quét QR và tham gia gia đình.',
      );
    } catch (error) {
      Alert.alert(
        'Không thể quét QR',
        error instanceof Error ? error.message : 'Đã có lỗi xảy ra',
      );
    } finally {
      setIsBusy(false);
    }
  };

  const openQrScannerOptions = () => {
    Alert.alert('Quét mã QR', 'Chọn cách quét mã gia đình.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Chụp bằng camera',
        onPress: () => {
          setTimeout(() => {
            handleJoinByQrImage('camera');
          }, 150);
        },
      },
      {
        text: 'Chọn từ thư viện',
        onPress: () => {
          setTimeout(() => {
            handleJoinByQrImage('library');
          }, 150);
        },
      },
    ]);
  };

  const handleInvitationAction = async (inviteId: number, action: 'accept' | 'reject') => {
    try {
      setIsBusy(true);
      if (action === 'accept') {
        await acceptInvitation(inviteId);
        const [nextInvitations] = await Promise.all([
          getReceivedInvitations(),
          refreshFamily(),
        ]);
        setReceivedInvitations(nextInvitations);
      } else {
        await rejectInvitation(inviteId);
        setReceivedInvitations(await getReceivedInvitations());
      }
    } catch (error) {
      Alert.alert(
        'Không thể cập nhật lời mời',
        error instanceof Error ? error.message : 'Đã có lỗi xảy ra',
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleCreateQr = async () => {
    try {
      setIsBusy(true);
      const nextJoinCode = joinCodeInfo
        ? await rotateFamilyJoinCode()
        : await getFamilyJoinCode();
      setJoinCodeInfo(nextJoinCode);
    } catch (error) {
      Alert.alert(
        'Không thể tạo mã QR',
        error instanceof Error ? error.message : 'Đã có lỗi xảy ra',
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleOpenAddMemberModal = async () => {
    setAddModalVisible(true);

    if (!isOwner || joinCodeInfo) {
      return;
    }

    try {
      const nextJoinCode = await getFamilyJoinCode();
      setJoinCodeInfo(nextJoinCode);
    } catch {
      setJoinCodeInfo(null);
    }
  };

  const renderOwnerTools = () => {
    if (!isOwner) {
      return null;
    }

    return (
      <View style={styles.inviteCard}>
        <Text style={styles.inputLabel}>THÊM THÀNH VIÊN BẰNG QR</Text>
        <Text style={styles.ownerToolsText}>
          Tạo mã QR để người thân quét và tham gia gia đình ngay trên ứng dụng.
        </Text>

        <TouchableOpacity
          style={[styles.qrCreateBtn, isBusy && styles.disabledBtn]}
          activeOpacity={0.85}
          onPress={() => void handleCreateQr()}
          disabled={isBusy}
        >
          <MaterialCommunityIcons name="qrcode-plus" size={20} color="#fff" />
          <Text style={styles.qrCreateBtnText}>
            {joinCodeInfo ? 'Tạo lại mã QR' : 'Tạo mã QR tham gia'}
          </Text>
        </TouchableOpacity>

        {joinCodeInfo ? (
          <View style={styles.qrPanel}>
            <Image
              source={{ uri: `data:image/png;base64,${joinCodeInfo.qrCodeBase64}` }}
              style={styles.qrPreview}
            />
            <View style={styles.joinCodeBadge}>
              <Text style={styles.joinCodeBadgeText}>{joinCodeInfo.joinCode}</Text>
            </View>
            <Text style={styles.joinCodeHint}>Gia đình: {joinCodeInfo.familyName}</Text>
            <Text style={styles.joinCodeHint}>
              Hết hạn: {new Date(joinCodeInfo.expiresAt).toLocaleString('vi-VN')}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  const renderInviteContent = () => (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.modalContent}
    >
      <View style={styles.centerContainer}>
        <Text style={styles.joinTitle}>Thêm thành viên</Text>
        <Text style={styles.joinSubText}>
          Mời người thân bằng email hoặc tạo mã QR để họ tham gia nhanh vào gia đình của bạn.
        </Text>

        <View style={styles.inviteCard}>
          <Text style={styles.inputLabel}>EMAIL NGƯỜI THÂN</Text>
          <View style={styles.inviteInputWrap}>
            <MaterialCommunityIcons name="account-box-outline" size={20} color="#64748b" />
            <TextInput
              style={styles.joinInput}
              value={inviteValue}
              onChangeText={setInviteValue}
              placeholder="vidu@email.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.relationLabel}>MỐI QUAN HỆ</Text>
          <View style={styles.relationGrid}>
            {RELATIONS.map(rel => (
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

          <TouchableOpacity
            style={[styles.joinSubmitBtn, isBusy && styles.disabledBtn]}
            activeOpacity={0.8}
            disabled={isBusy}
            onPress={() => void handleInviteMember()}
          >
            <Text style={styles.submitBtnText}>
              {isBusy ? 'Đang gửi...' : 'Gửi lời mời'}
            </Text>
            <MaterialCommunityIcons
              name="send"
              size={20}
              color="#fff"
              style={styles.inlineIcon}
            />
          </TouchableOpacity>
        </View>

        {renderOwnerTools()}

        <View style={styles.pendingSection}>
          <View style={styles.pendingHeader}>
            <MaterialCommunityIcons name="account-clock" size={22} color="#0369a1" />
            <Text style={styles.pendingTitle}>Lời mời đang chờ</Text>
          </View>

          {sentInvitations.length === 0 ? (
            <View style={styles.pendingItem}>
              <View style={styles.pendingAvatar}>
                <Text style={styles.avatarInitial}>0</Text>
              </View>
              <View style={styles.pendingTextWrap}>
                <Text style={styles.pendingEmail}>Chưa có lời mời nào</Text>
                <Text style={styles.pendingStatus}>
                  Danh sách sẽ hiện tại đây sau khi gửi.
                </Text>
              </View>
            </View>
          ) : (
            sentInvitations.map(item => (
              <View key={item.inviteId} style={styles.pendingItem}>
                <View style={styles.pendingAvatar}>
                  <Text style={styles.avatarInitial}>
                    {(item.receiverEmail || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.pendingTextWrap}>
                  <Text style={styles.pendingEmail}>
                    {item.receiverEmail || 'Người thân'}
                  </Text>
                  <Text style={styles.pendingStatus}>{formatInvitationStatus(item.status)}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );

  const renderAddMemberModal = () => (
    <Modal
      visible={addModalVisible}
      transparent={false}
      animationType="slide"
      onRequestClose={() => setAddModalVisible(false)}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.profileBtn} onPress={() => setAddModalVisible(false)}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Thêm thành viên</Text>
          <View style={styles.headerSpacer} />
        </View>

        {renderInviteContent()}
      </View>
    </Modal>
  );

  const renderJoinStep = () => (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.modalContent}
      showsVerticalScrollIndicator={false}
    >
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
            <Text style={styles.inputLabel}>MÃ GIA ĐÌNH</Text>
            <View style={styles.joinInputWrap}>
              <MaterialCommunityIcons name="key-variant" size={20} color="#94a3b8" />
              <TextInput
                style={styles.joinInput}
                value={joinCodeInput}
                onChangeText={setJoinCodeInput}
                placeholder="Nhập mã hoặc quét mã QR"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
              />
            </View>

            <Text style={styles.relationLabel}>VAI TRÒ CỦA BẠN</Text>
            <View style={styles.joinRoleWrap}>
              {JOIN_ROLE_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.joinRoleChip,
                    selectedJoinRole === option.value && styles.joinRoleChipSelected,
                  ]}
                  onPress={() => setSelectedJoinRole(option.value)}
                >
                  <MaterialCommunityIcons
                    name={option.icon}
                    size={17}
                    color={selectedJoinRole === option.value ? '#0369a1' : '#64748b'}
                  />
                  <Text
                    style={[
                      styles.joinRoleChipText,
                      selectedJoinRole === option.value && styles.joinRoleChipTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity
            style={[styles.joinSubmitBtn, isBusy && styles.disabledBtn]}
            activeOpacity={0.8}
            onPress={() => void handleJoinByCode()}
          >
            <Text style={styles.submitBtnText}>
              {isBusy ? 'Đang xử lý...' : 'Tham gia bằng mã'}
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.dividerWrap}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>HOẶC</Text>
            <View style={styles.dividerLine} />
          </View>
          <TouchableOpacity style={styles.qrBtn} activeOpacity={0.8} onPress={openQrScannerOptions}>
            <MaterialCommunityIcons name="qrcode-scan" size={20} color="#0369a1" />
            <Text style={styles.qrBtnText}>Quét mã QR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.joinBackBtn} onPress={() => setStep(1)}>
            <MaterialCommunityIcons name="arrow-left" size={18} color="#1e293b" />
            <Text style={styles.joinBackText}>Quay lại</Text>
          </TouchableOpacity>
        </View>

        {receivedInvitations.length > 0 ? (
          <View style={[styles.inviteCard, styles.receivedCard]}>
            <Text style={styles.pendingTitle}>Lời mời bạn đã nhận</Text>
            {receivedInvitations.map(item => (
              <View key={item.inviteId} style={styles.receivedItem}>
                <View style={styles.pendingAvatar}>
                  <Text style={styles.avatarInitial}>
                    {(item.familyName || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.pendingTextWrap}>
                  <Text style={styles.pendingEmail}>{item.familyName || 'Gia đình'}</Text>
                  <Text style={styles.pendingStatus}>
                    {item.senderEmail || 'Không rõ người gửi'}
                  </Text>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.inlineActionBtn, styles.inlineAcceptBtn]}
                    onPress={() => void handleInvitationAction(item.inviteId, 'accept')}
                  >
                    <Text style={styles.inlineAcceptText}>Nhận</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.inlineActionBtn, styles.inlineRejectBtn]}
                    onPress={() => void handleInvitationAction(item.inviteId, 'reject')}
                  >
                    <Text style={styles.inlineRejectText}>Từ chối</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );

  const renderWelcomeStep = () => (
    <View style={styles.centerContainer}>
      <View style={styles.heroCircle}>
        <MaterialCommunityIcons
          name="account-group-outline"
          size={120}
          color={colors.primary}
        />
      </View>
      <Text style={styles.stepTitle}>Bắt đầu tổ ấm của bạn</Text>
      <Text style={styles.stepSub}>
        Tạo gia đình để bắt đầu quản lý sức khỏe cho những người thân yêu.
      </Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(2)}>
        <MaterialCommunityIcons name="plus" size={24} color="#fff" style={styles.inlineIcon} />
        <Text style={styles.primaryBtnText}>Tạo gia đình</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(4)}>
        <Text style={styles.secondaryBtnText}>Tham gia một gia đình hiện có</Text>
      </TouchableOpacity>
      <View style={styles.tipCard}>
        <View style={styles.tipIconWrap}>
          <MaterialCommunityIcons name="lightbulb-outline" size={24} color={colors.primary} />
        </View>
        <View style={styles.tipTextWrap}>
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
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: Gia đình hạnh phúc..."
          value={tempName}
          onChangeText={setTempName}
          placeholderTextColor="#94A3B8"
        />
      </View>
      <View style={styles.tipCardCompact}>
        <View style={styles.tipIconWrap}>
          <MaterialCommunityIcons
            name="information-outline"
            size={24}
            color={colors.secondary}
          />
        </View>
        <View style={styles.tipTextWrap}>
          <Text style={styles.tipTitle}>Mẹo nhỏ</Text>
          <Text style={styles.tipText}>
            Bạn có thể thay đổi tên này bất cứ lúc nào trong phần cài đặt gia đình.
          </Text>
        </View>
      </View>
      <View style={styles.flexSpacer} />
      <TouchableOpacity
        style={[styles.primaryBtn, isBusy && styles.disabledBtn]}
        onPress={() => void handleFinishSetup()}
        disabled={isBusy}
      >
        <Text style={styles.primaryBtnText}>
          {isBusy ? 'Đang tạo...' : 'Tiếp tục'}
        </Text>
        <MaterialCommunityIcons name="arrow-right" size={24} color="#fff" style={styles.inlineIcon} />
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );

  const renderManagementStep = () => (
    <View style={styles.managementRoot}>
      <ScrollView
        style={styles.root}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.managementContent}
      >
        <View style={styles.managementTitleArea}>
          <View style={styles.titleRow}>
            <Text style={styles.managementTitle}>{familyName}</Text>
            <View style={styles.memberPill}>
              <Text style={styles.memberPillText}>{members.length} Thành viên</Text>
            </View>
          </View>
          <Text style={styles.managementSub}>
            Quản lý sức khỏe và lịch trình của cả gia đình.
          </Text>
        </View>

        <View style={styles.memberList}>
          {members.map(member => {
            const age = member.age ?? 0;
            const isUnder18 = typeof member.age === 'number' && member.age < 18;

            return (
              <View key={member.profileId} style={styles.memberCard}>
                <View style={styles.memberCardMain}>
                  <View style={styles.avatarWrapper}>
                    <Image
                      source={{
                        uri:
                          member.avatarUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            member.fullName,
                          )}&background=eff6ff&color=2563eb&bold=true`,
                      }}
                      style={styles.memberImage}
                    />
                    <View style={styles.statusDot} />
                  </View>

                  <TouchableOpacity
                    style={styles.memberInfo}
                    onPressIn={() => prefetchMemberMedical(member.profileId)}
                    onPress={() =>
                      navigation.navigate('UserMedical', {
                        memberId: String(member.profileId),
                      })
                    }
                  >
                    <View style={styles.nameRow}>
                      <Text style={styles.memberName}>{member.fullName}</Text>
                      <View style={styles.roleTag}>
                        <Text style={styles.roleTagText}>{formatRole(member.role)}</Text>
                      </View>
                    </View>
                    <View style={styles.memberMetaRow}>
                      <Text style={styles.memberAge}>{age || '--'} Tuổi</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {isUnder18 ? (
                  <TouchableOpacity
                    style={styles.growthBar}
                    onPressIn={() => prefetchMemberGrowth(member.profileId)}
                    onPress={() =>
                      navigation.navigate('GrowthTracker', {
                        memberId: String(member.profileId),
                      })
                    }
                  >
                    <MaterialCommunityIcons
                      name="human-male-female-child"
                      size={18}
                      color="#0369a1"
                    />
                    <Text style={styles.growthBarText}>THEO DÕI PHÁT TRIỂN</Text>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={18}
                      color="#0369a1"
                      style={styles.autoMarginLeft}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {isOwner ? (
        <FAB
          onPress={() => void handleOpenAddMemberModal()}
          iconName="add"
          bottomOffset={BOTTOM_NAV_HEIGHT - 55}
        />
      ) : null}
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity style={styles.profileBtn}>
            <Image
              source={{
                uri:
                  user?.avatarUrl ||
                  'https://ui-avatars.com/api/?name=User&background=1a73e8&color=fff',
              }}
              style={styles.smallAvatar}
            />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>{hasFamily ? familyName : 'Gia đình'}</Text>
        </View>
      </View>

      {!hasFamily
        ? step === 1
          ? renderWelcomeStep()
          : step === 4
            ? renderJoinStep()
            : renderSetupStep()
        : renderManagementStep()}

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
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
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
  tipCardCompact: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    padding: 20,
    marginTop: 20,
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
  tipTextWrap: { flex: 1 },
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
  inputIcon: { marginRight: 12 },
  managementRoot: { flex: 1 },
  managementContent: { paddingBottom: 120 },
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
    backgroundColor: '#60a5fa',
  },
  memberInfo: { flex: 1, marginLeft: 16 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  memberName: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  roleTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleTagText: { fontSize: 11, fontWeight: '800', color: '#64748b' },
  memberMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 10 },
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
  autoMarginLeft: { marginLeft: 'auto' },
  modalContent: { paddingBottom: 40 },
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
    marginLeft: 4,
  },
  relationLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginTop: 24,
    marginBottom: 10,
    marginLeft: 4,
  },
  inviteInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 60,
  },
  joinInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 60,
  },
  joinInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '600',
  },
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
  joinRoleWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  joinRoleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  joinRoleChipSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#1a73e8',
  },
  joinRoleChipText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  joinRoleChipTextSelected: { color: '#0369a1' },
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
    marginTop: 32,
  },
  submitBtnText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  disabledBtn: { opacity: 0.7 },
  inlineIcon: { marginLeft: 8 },
  ownerToolsText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
  },
  qrCreateBtn: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#1a73e8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  qrCreateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  qrPanel: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 18,
  },
  qrPreview: {
    width: 180,
    height: 180,
    borderRadius: 16,
    marginBottom: 16,
  },
  joinCodeBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
  },
  joinCodeBadgeText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0369a1',
    letterSpacing: 2,
  },
  joinCodeHint: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 10,
    textAlign: 'center',
  },
  pendingSection: { width: '100%', marginTop: 24 },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
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
    marginBottom: 10,
  },
  receivedCard: { marginTop: 24 },
  receivedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 12,
    marginTop: 16,
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
  pendingTextWrap: { flex: 1, marginLeft: 12 },
  pendingEmail: { fontSize: 14, fontWeight: '700', color: '#334155' },
  pendingStatus: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  headerSpacer: { width: 44 },
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
  blueBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#1a73e8',
  },
  joinHeroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  joinTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 12,
  },
  joinSubText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  inputSection: { width: '100%', marginBottom: 24 },
  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 32,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#f1f5f9' },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '800',
    color: '#cbd5e1',
    letterSpacing: 1,
  },
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
  joinBackBtn: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
  },
  joinBackText: { fontSize: 16, fontWeight: '700', color: '#1a73e8' },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  inlineActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  inlineAcceptBtn: {
    backgroundColor: '#dbeafe',
  },
  inlineRejectBtn: {
    backgroundColor: '#fee2e2',
  },
  inlineAcceptText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  inlineRejectText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
  flexSpacer: { flex: 1 },
});
