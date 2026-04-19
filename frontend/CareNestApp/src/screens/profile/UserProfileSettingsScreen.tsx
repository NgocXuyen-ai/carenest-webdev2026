import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Image, Alert, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import Icon from '../../components/common/Icon';
import NotificationBell from '../../components/common/NotificationBell';
import { useAuth } from '../../context/AuthContext';
import { mockFamilyMembers } from '../../data/mockFamilyMembers';
import { getCurrentUserProfile, updateCurrentUserProfile } from '../../api/auth';

interface InputFieldProps {
  icon: string;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}

function InputField({ icon, label, value, onChangeText, placeholder, keyboardType = 'default' }: InputFieldProps) {
  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputIconWrap}>
        <Icon name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.inputContent}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          placeholderTextColor="#94A3B8"
        />
      </View>
    </View>
  );
}

export default function UserProfileSettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  
  // Local state for app settings
  const [medReminder, setMedReminder] = useState(true);
  const [apptReminder, setApptReminder] = useState(true);
  
  // Local state for user info
  const [fullName, setFullName] = useState(user?.fullName || 'Nguyễn Lan Anh');
  const [email, setEmail] = useState(user?.email || 'lananh@gmail.com');
  const [phone, setPhone] = useState('0909654321');
  const [birthday, setBirthday] = useState('15/03/1990');
  const [bloodType, setBloodType] = useState('A+');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [gender, setGender] = useState('OTHER');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [allergy, setAllergy] = useState('');
  const [height, setHeight] = useState(160);
  const [weight, setWeight] = useState(55);
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Find corresponding member for medical record
  const member = mockFamilyMembers.find(m => m.isCurrentUser || m.fullName === fullName);

  React.useEffect(() => {
    void getCurrentUserProfile()
      .then(profile => {
        setFullName(profile.fullName);
        setEmail(profile.email);
        setPhone(profile.phoneNumber || '');
        setBirthday(profile.birthday ? new Date(profile.birthday).toLocaleDateString('vi-VN') : '');
        setBloodType(profile.bloodType || 'O_POSITIVE');
        setGender(profile.gender || 'OTHER');
        setMedicalHistory(profile.medicalHistory || '');
        setAllergy(profile.allergy || '');
        setHeight(profile.height || 160);
        setWeight(profile.weight || 55);
        setEmergencyContactPhone(profile.emergencyContactPhone || '');
        if (profile.avatarUrl) {
          setAvatarUri(profile.avatarUrl);
        }
      })
      .catch(() => {});
  }, []);

  const handleChoosePhoto = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
      if (response.assets && response.assets.length > 0) {
        setAvatarUri(response.assets[0].uri || null);
      }
    });
  };

  const handleSave = async () => {
    try {
      const [day, month, year] = birthday.split('/');
      const isoBirthday = day && month && year ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` : '1990-01-01';

      await updateCurrentUserProfile({
        fullName,
        email,
        phoneNumber: phone,
        birthday: isoBirthday,
        gender,
        bloodType,
        medicalHistory,
        allergy,
        height,
        weight,
        emergencyContactPhone,
      });
      Alert.alert('Thành công', 'Thông tin của bạn đã được cập nhật.');
    } catch (error) {
      Alert.alert('Không thể lưu', error instanceof Error ? error.message : 'Đã có lỗi xảy ra');
    }
  };

  return (
    <View style={styles.root}>
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow_back" size={26} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin tài khoản</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Lưu</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: BOTTOM_NAV_HEIGHT + 40 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarContainer, shadows.md]}>
            <Image
              source={{ uri: avatarUri || `https://i.pravatar.cc/150?u=${user?.id || '1'}` }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.cameraBtn} onPress={handleChoosePhoto}>
              <Icon name="photo_camera" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userNameText}>{fullName}</Text>
          <Text style={styles.userRoleText}>{member?.role || 'Thành viên gia đình'}</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.medicalRecordBtn, shadows.sm]}
            onPress={() => navigation.navigate('UserMedical', { memberId: user?.profileId })}
          >
            <View style={styles.medicalIconWrap}>
              <Icon name="description" size={22} color="#fff" />
            </View>
            <View style={styles.medicalTextWrap}>
              <Text style={styles.medicalTitle}>Hồ sơ y tế</Text>
              <Text style={styles.medicalSub}>Xem tiền sử, dị ứng & nhóm máu</Text>
            </View>
            <Icon name="chevron_right" size={22} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* Info Form */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Thông tin cá nhân</Text>
          <View style={[styles.formCard, shadows.sm]}>
            <InputField
              icon="person"
              label="Họ và tên"
              value={fullName}
              onChangeText={setFullName}
            />
            <InputField
              icon="mail"
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <InputField
              icon="phone"
              label="Số điện thoại"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <InputField
              icon="calendar_today"
              label="Ngày sinh"
              value={birthday}
              onChangeText={setBirthday}
            />
            <InputField
              icon="bloodtype"
              label="Nhóm máu"
              value={bloodType}
              onChangeText={setBloodType}
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Cài đặt thông báo</Text>
          <View style={[styles.formCard, shadows.sm]}>
            <View style={styles.settingsRow}>
              <View style={[styles.rowIconWrap, { backgroundColor: '#F0F9FF' }]}>
                <Icon name="medication" size={20} color="#0EA5E9" />
              </View>
              <Text style={styles.rowLabelText}>Nhắc uống thuốc</Text>
              <Switch
                value={medReminder}
                onValueChange={setMedReminder}
                trackColor={{ false: '#E2E8F0', true: '#3B82F6' }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.settingsRow}>
              <View style={[styles.rowIconWrap, { backgroundColor: '#FDF2F8' }]}>
                <Icon name="calendar_month" size={20} color="#DB2777" />
              </View>
              <Text style={styles.rowLabelText}>Nhắc lịch tái khám</Text>
              <Switch
                value={apptReminder}
                onValueChange={setApptReminder}
                trackColor={{ false: '#E2E8F0', true: '#3B82F6' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Ứng dụng</Text>
          <View style={[styles.formCard, shadows.sm]}>
            <TouchableOpacity style={styles.settingsRow}>
              <View style={[styles.rowIconWrap, { backgroundColor: '#F5F3FF' }]}>
                <Icon name="language" size={20} color="#7C3AED" />
              </View>
              <Text style={styles.rowLabelText}>Ngôn ngữ</Text>
              <Text style={styles.rowValueText}>Tiếng Việt</Text>
              <Icon name="chevron_right" size={20} color="#CBD5E1" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsRow}>
              <View style={[styles.rowIconWrap, { backgroundColor: '#F0FDFA' }]}>
                <Icon name="security" size={20} color="#0D9488" />
              </View>
              <Text style={styles.rowLabelText}>Chính sách bảo mật</Text>
              <Icon name="chevron_right" size={20} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Hỗ trợ</Text>
          <View style={[styles.formCard, shadows.sm]}>
            <TouchableOpacity style={styles.settingsRow}>
              <View style={[styles.rowIconWrap, { backgroundColor: '#FFF7ED' }]}>
                <Icon name="help_center" size={20} color="#EA580C" />
              </View>
              <Text style={styles.rowLabelText}>Trung tâm hỗ trợ</Text>
              <Icon name="chevron_right" size={20} color="#CBD5E1" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsRow}>
              <View style={[styles.rowIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <Icon name="bug_report" size={20} color="#2563EB" />
              </View>
              <Text style={styles.rowLabelText}>Báo cáo sự cố</Text>
              <Icon name="chevron_right" size={20} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Icon name="logout" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  headerBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: 'Manrope', fontWeight: '800', color: '#1E3A8A' },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  saveBtnText: { fontSize: 16, fontFamily: 'Inter', fontWeight: '700', color: '#3B82F6' },

  scroll: { paddingHorizontal: 20 },
  
  avatarSection: { alignItems: 'center', marginVertical: 24 },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'relative',
    backgroundColor: '#fff',
    padding: 4,
  },
  avatar: { width: '100%', height: '100%', borderRadius: 56 },
  cameraBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#3B82F6',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userNameText: { fontSize: 22, fontFamily: 'Manrope', fontWeight: '800', color: '#1E293B', marginTop: 16 },
  userRoleText: { fontSize: 14, fontFamily: 'Inter', color: '#64748B', marginTop: 4 },

  section: { marginBottom: 24 },
  sectionLabel: { 
    fontSize: 14, fontFamily: 'Inter', fontWeight: '800', 
    color: '#64748B', marginBottom: 12, marginLeft: 4,
    textTransform: 'uppercase', letterSpacing: 0.5
  },
  
  formCard: { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  inputIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  inputContent: { flex: 1 },
  inputLabel: { fontSize: 12, fontFamily: 'Inter', fontWeight: '600', color: '#94A3B8', marginBottom: 2 },
  textInput: { fontSize: 16, fontFamily: 'Inter', fontWeight: '700', color: '#1E293B', padding: 0 },

  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 16,
  },
  rowIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabelText: { flex: 1, fontSize: 15, fontFamily: 'Inter', fontWeight: '600', color: '#1E293B' },
  rowValueText: { fontSize: 14, fontFamily: 'Inter', color: '#64748B', marginRight: 4 },

  medicalRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 24,
    gap: 16,
  },
  medicalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicalTextWrap: { flex: 1 },
  medicalTitle: { fontSize: 16, fontFamily: 'Inter', fontWeight: '700', color: '#1E293B' },
  medicalSub: { fontSize: 12, fontFamily: 'Inter', color: '#64748B', marginTop: 2 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    backgroundColor: '#FEF2F2',
    borderRadius: 24,
    marginBottom: 20,
  },
  logoutText: { fontSize: 16, fontFamily: 'Inter', fontWeight: '700', color: '#EF4444' },
});
