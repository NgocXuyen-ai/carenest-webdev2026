import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  Animated,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ProfileStackParamList } from '../../navigation/navigationTypes';
import Icon from '../../components/common/Icon';
import { colors } from '../../theme/colors';
import { getCurrentUserProfile } from '../../api/auth';
import { getFamilyProfile } from '../../api/family';

import Emergency from './Emergency';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_WIDTH = (SCREEN_WIDTH - 40) / 2;

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────

const HealthCard = ({ title, value, icon, bgColor, textColor, isEditing, onChange, children }: any) => (
  <View style={[styles.healthCard, { backgroundColor: bgColor }]}>
    <View style={styles.cardHeader}>
      <Icon name={icon} size={20} color={textColor} />
      <Text style={[styles.cardTitle, { color: textColor }]}>{title}</Text>
    </View>
    {isEditing ? (
      <TextInput
        style={[styles.cardInput, { color: textColor }]}
        value={value}
        onChangeText={onChange}
        multiline={title === 'DỊ ỨNG'}
      />
    ) : (
      children ? children : (
        <Text style={[styles.cardValue, { color: textColor }]}>{value}</Text>
      )
    )}
  </View>
);

const StatItem = ({ label, value, unit, isBmi = false, isEditing, onChange }: any) => {
  const numericValue = parseFloat(String(value));
  const isInvalid = !isBmi && isEditing && value !== '' && (isNaN(numericValue) || numericValue <= 0);

  return (
    <View style={[styles.statItem, isBmi && { flex: 1.3 }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statLine}>
        {isEditing && !isBmi ? (
          <TextInput
            style={[styles.statInput, isInvalid && { color: '#ef4444', borderBottomColor: '#ef4444' }]}
            value={String(value)}
            onChangeText={onChange}
            keyboardType="numeric"
            placeholder="0"
          />
        ) : (
          <Text style={styles.statValue}>{value}</Text>
        )}
        {unit && <Text style={styles.statUnit}>{unit}</Text>}
        {isBmi && (
          <View style={styles.bmiMiniBar}>
            <View style={styles.bmiBarBg}><View style={[styles.bmiBarFill, { width: '60%' }]} /></View>
          </View>
        )}
      </View>
      {isInvalid && (
        <Text style={{ fontSize: 9, color: '#ef4444', fontWeight: 'bold', marginTop: 2 }}>
          {"PHẢI > 0"}
        </Text>
      )}
    </View>
  );
};

// ── MAIN SCREEN ───────────────────────────────────────────────────────────────

export default function UserMedicalScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ProfileStackParamList, 'UserMedical'>>();
  const { memberId } = route.params || {};

  const [activeTab, setActiveTab] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [isEditing, setIsEditing] = useState(false);

  // Editable States
  const [fullName, setFullName] = useState('Nguyễn Thị An');
  const [role, setRole] = useState('BÀ NỘI');
  const [bloodType, setBloodType] = useState('O+');
  const [allergies, setAllergies] = useState('HẢI SẢN, THUỐC');
  const [height, setHeight] = useState('158');
  const [weight, setWeight] = useState('54');
  const [bmi, setBmi] = useState('21.6');
  const [age, setAge] = useState('72');

  // Load member data if memberId is provided
  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        if (memberId) {
          const profile = await getFamilyProfile(Number(memberId));
          setFullName(profile.fullName);
          setRole('THÀNH VIÊN');
          setBloodType(profile.bloodType || 'O+');
          setHeight(String(profile.height || '158'));
          setWeight(String(profile.weight || '54'));
          setAllergies((profile.allergy || 'KHÔNG').toUpperCase());
          setAge(String(profile.age || ''));
          return;
        }

        const profile = await getCurrentUserProfile();
        setFullName(profile.fullName);
        setRole('TÀI KHOẢN CỦA BẠN');
        setBloodType(profile.bloodType || 'O+');
        setHeight(String(profile.height || '158'));
        setWeight(String(profile.weight || '54'));
        setAllergies((profile.allergy || 'KHÔNG').toUpperCase());
        if (profile.birthday) {
          const birthDate = new Date(profile.birthday);
          const today = new Date();
          let ageVal = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            ageVal--;
          }
          setAge(String(ageVal));
        }
      } catch {
        // keep fallback UI state
      }
    };

    void loadProfile();
  }, [memberId]);

  // Dynamic BMI Calculation
  React.useEffect(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    // Chỉ tính BMI khi chiều cao và cân nặng nằm trong khoảng thực tế (> 30cm và > 2kg)
    if (h > 30 && w > 2) {
      const bmiVal = (w / ((h / 100) ** 2)).toFixed(1);
      setBmi(bmiVal);
    } else {
      setBmi('--');
    }
  }, [height, weight]);

  const handleTabPress = (index: number) => {
    setActiveTab(index);
    Animated.spring(slideAnim, {
      toValue: index * TAB_WIDTH,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const renderTabContent = () => {
    if (activeTab === 1) {
      return <Emergency />;
    }

    return (
      <View style={{ paddingHorizontal: 16 }}>
        {/* Health Stats Grid */}
        <View style={styles.grid}>
          <HealthCard 
            title="NHÓM MÁU" 
            value={bloodType} 
            icon="bloodtype" 
            bgColor="#FFEBEB" 
            textColor="#B91C1C" 
            isEditing={isEditing}
            onChange={setBloodType}
          />
          <HealthCard 
            title="DỊ ỨNG" 
            value={allergies}
            icon="warning" 
            bgColor="#FFF4E6" 
            textColor="#9A3412"
            isEditing={isEditing}
            onChange={setAllergies}
          >
            <View style={styles.pillContainer}>
              {allergies.split(',').map((tag, idx) => (
                <View key={idx} style={styles.pill}>
                  <Text style={styles.pillText}>{tag.trim().toUpperCase()}</Text>
                </View>
              ))}
            </View>
          </HealthCard>
        </View>

        {/* Basic Stats Row */}
        <View style={styles.statsRow}>
          <StatItem 
            label="CHIỀU CAO" value={height} unit="cm" 
            isEditing={isEditing} onChange={setHeight}
          />
          <StatItem 
            label="CÂN NẶNG" value={weight} unit="kg" 
            isEditing={isEditing} onChange={setWeight}
          />
          <StatItem 
            label="BMI" value={bmi} isBmi 
            isEditing={isEditing} onChange={setBmi}
          />
        </View>

        {/* Medical History Section */}
        <View style={styles.sectionHeader}>
          <Icon name="history_edu" size={20} color="#666" />
          <Text style={styles.sectionTitle}>TIỀN SỬ BỆNH LÝ</Text>
        </View>

        <View style={styles.historyList}>
          <View style={styles.historyItem}>
            <Text style={styles.historyName}>Cao huyết áp mãn tính</Text>
            <Text style={styles.historyDesc}>Dùng thuốc hằng ngày, chỉ số hiện ổn định.</Text>
          </View>
          <View style={[styles.historyItem, { borderBottomWidth: 0 }]}>
            <Text style={styles.historyName}>Thoái hóa khớp gối</Text>
            <Text style={styles.historyDesc}>Hạn chế vận động mạnh sau phẫu thuật năm 2021.</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow_back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CareNest</Text>
        <TouchableOpacity style={styles.editBtn} onPress={toggleEdit}>
          {isEditing ? (
            <Text style={styles.saveText}>Lưu</Text>
          ) : (
            <Icon name="edit" size={22} color="#333" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrap}>
            <Image 
              source={{ uri: 'https://img.freepik.com/free-photo/portrait-beautiful-older-woman-smiling_23-2148761801.jpg' }} 
              style={styles.avatar} 
            />
            <TouchableOpacity style={styles.verifiedBadge}>
              <Icon name={isEditing ? 'photo_camera' : 'verified'} size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {isEditing ? (
            <TextInput
              style={styles.nameInput}
              value={fullName}
              onChangeText={setFullName}
              textAlign="center"
            />
          ) : (
            <Text style={styles.userName}>{fullName}</Text>
          )}

          <View style={styles.roleChip}>
            {isEditing ? (
              <TextInput
                style={styles.roleInput}
                value={role}
                onChangeText={setRole}
              />
            ) : (
              <Text style={styles.roleText}>{role}</Text>
            )}
          </View>
          <Text style={styles.userMeta}>{age} Tuổi • TP. Hồ Chí Minh</Text>
        </View>

        {/* Animated Tab Switcher */}
        {!isEditing && (
          <View style={styles.tabContainer}>
            <Animated.View style={[styles.slideBg, { transform: [{ translateX: slideAnim }] }]} />
            <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress(0)}>
              <Text style={[styles.tabLabel, activeTab === 0 && styles.activeLabel]}>Thông tin</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress(1)}>
              <Text style={[styles.tabLabel, activeTab === 1 && styles.activeLabel]}>Khẩn cấp</Text>
            </TouchableOpacity>
          </View>
        )}

        {renderTabContent()}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCFDFF' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 8, paddingBottom: 10, backgroundColor: '#fff' 
  },
  circleBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E3A8A', fontFamily: 'Inter' },
  editBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#059669', fontSize: 16, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 120 },

  profileSection: { alignItems: 'center', marginTop: 24, marginBottom: 32 },
  avatarWrap: { 
    width: 120, height: 120, borderRadius: 60, padding: 4, 
    backgroundColor: '#fff', elevation: 12, shadowColor: '#000', 
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 10
  },
  avatar: { width: '100%', height: '100%', borderRadius: 60 },
  verifiedBadge: {
    position: 'absolute', bottom: 4, right: 4, width: 28, height: 28, 
    borderRadius: 14, backgroundColor: '#3B82F6', alignItems: 'center', 
    justifyContent: 'center', borderWidth: 2, borderColor: '#fff'
  },
  userName: { fontSize: 28, fontWeight: '800', color: '#1E293B', marginTop: 16, fontFamily: 'Inter' },
  nameInput: { fontSize: 24, fontWeight: '800', color: '#1E293B', marginTop: 12, backgroundColor: '#F1F5F9', width: '80%', borderRadius: 12, paddingVertical: 8 },
  roleChip: { 
    backgroundColor: '#EBF2FF', paddingHorizontal: 16, paddingVertical: 4, 
    borderRadius: 20, marginTop: 10 
  },
  roleText: { color: '#3B82F6', fontSize: 13, fontWeight: '800', fontFamily: 'Inter' },
  roleInput: { color: '#3B82F6', fontSize: 13, fontWeight: '800', padding: 0, textAlign: 'center' },
  userMeta: { fontSize: 15, color: '#64748B', marginTop: 8, fontFamily: 'Inter', fontWeight: '500' },

  tabContainer: { 
    flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 24, 
    padding: 6, marginBottom: 32, position: 'relative' 
  },
  slideBg: { 
    position: 'absolute', top: 6, left: 6, width: TAB_WIDTH, height: 44, 
    backgroundColor: '#fff', borderRadius: 18, elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4
  },
  tabItem: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 16, fontWeight: '700', color: '#64748B', fontFamily: 'Inter' },
  activeLabel: { color: '#1E3A8A' },

  grid: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  healthCard: { flex: 1, padding: 20, borderRadius: 28 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  cardTitle: { fontSize: 12, fontWeight: '800', fontFamily: 'Inter' },
  cardValue: { fontSize: 40, fontWeight: '800' },
  cardInput: { fontSize: 32, fontWeight: '800', padding: 0 },
  pillContainer: { gap: 6 },
  pill: { backgroundColor: 'rgba(255,255,255,0.7)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pillText: { fontSize: 11, fontWeight: '700', color: '#9A3412' },

  statsRow: { 
    flexDirection: 'row', gap: 20, paddingHorizontal: 4, 
    marginBottom: 40, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 24 
  },
  statItem: { flex: 1 },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', marginBottom: 8, fontFamily: 'Inter' },
  statLine: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#1E293B', fontFamily: 'Inter' },
  statInput: { 
    fontSize: 24, fontWeight: '800', color: '#3B82F6', 
    padding: 0, borderBottomWidth: 1, borderBottomColor: '#3B82F6',
    minWidth: 40, textAlign: 'left'
  },
  statUnit: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  bmiMiniBar: { flex: 1, marginLeft: 10, alignSelf: 'center' },
  bmiBarBg: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  bmiBarFill: { height: '100%', backgroundColor: '#3B82F6' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#444', fontFamily: 'Inter' },
  historyList: { backgroundColor: '#F8FAFC', borderRadius: 24, padding: 8 },
  historyItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
  historyName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  historyDesc: { fontSize: 14, color: '#64748B', lineHeight: 20 },

  emergencyBar: { 
    position: 'absolute', left: 16, right: 16, 
    backgroundColor: '#006DA4', borderRadius: 28, 
    padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8
  },
  emergencyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emerIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  emerBtnLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  emerName: { fontSize: 16, fontWeight: '800', color: '#fff' },
  callIconBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});
