import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import Icon from '../../components/common/Icon';
import Avatar from '../../components/common/Avatar';
import { mockFamilyMembers } from '../../data/mockFamilyMembers';
import type { HomeStackParamList, MainTabParamList } from '../../navigation/navigationTypes';

const { width } = Dimensions.get('window');

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'HomeDashboard'>,
  BottomTabNavigationProp<MainTabParamList>
>;

export default function HomeDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Constants based on request
  const PRIMARY_BLUE = '#0047AB';
  const LIGHT_BLUE_BG = '#E0F7FA';
  const GRADIENT_START = '#007BFF';
  const GRADIENT_END = '#0047AB';
  const AI_PASTEL = '#E1F5FE';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Custom Header Bar */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <Avatar 
            uri="https://i.pravatar.cc/150?u=lananh" 
            name="Lan Anh" 
            size="sm" 
            bordered 
          />
          <Text style={styles.logoText}>CareNest</Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationBtn}
          onPress={() => navigation.navigate('NotificationsCenter')}
        >
          <Icon name="notifications" size={24} color={PRIMARY_BLUE} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting Section */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingTitle}>Xin chào, Lan Anh!</Text>
          <Text style={styles.greetingSubtitle}>Hy vọng gia đình mình có một ngày khỏe mạnh.</Text>
        </View>

        {/* Members Pill Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THÀNH VIÊN</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.memberList}
          >
            <TouchableOpacity
              style={[styles.memberPill, selectedMemberId === null && styles.memberPillActive]}
              onPress={() => setSelectedMemberId(null)}
            >
              <Text style={[styles.memberPillText, selectedMemberId === null && styles.memberPillTextActive]}>
                Cả nhà
              </Text>
            </TouchableOpacity>
            {mockFamilyMembers.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.memberPill,
                  selectedMemberId === member.profileId && styles.memberPillActive,
                ]}
                onPress={() => setSelectedMemberId(member.profileId)}
              >
                <Text style={[
                  styles.memberPillText,
                  selectedMemberId === member.profileId && styles.memberPillTextActive,
                ]}>
                  {member.fullName.split(' ').pop()}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.addMemberBtn}>
              <Icon name="add" size={20} color={PRIMARY_BLUE} />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Shortcut Grid */}
        <View style={styles.shortcutGrid}>
          <TouchableOpacity 
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('MedicineSchedule')}
          >
            <View style={[styles.shortcutIconWrap, { backgroundColor: '#E0F2FE' }]}>
              <Icon name="pill" size={26} color="#0EA5E9" />
            </View>
            <Text style={styles.shortcutLabel}>Lịch thuốc</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('AppointmentList')}
          >
            <View style={[styles.shortcutIconWrap, { backgroundColor: '#F3E8FF' }]}>
              <Icon name="calendar_month" size={26} color="#A855F7" />
            </View>
            <Text style={styles.shortcutLabel}>Lịch hẹn</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('VaccinationTracker', { 
              memberId: selectedMemberId || mockFamilyMembers[0].profileId 
            })}
          >
            <View style={[styles.shortcutIconWrap, { backgroundColor: LIGHT_BLUE_BG }]}>
              <Icon name="syringe" size={26} color="#0097A7" />
            </View>
            <Text style={styles.shortcutLabel}>Tiêm chủng</Text>
          </TouchableOpacity>
        </View>

        {/* Health Summary Hero Card */}
        <View style={[styles.heroCard, shadows.lg]}>
          <View style={StyleSheet.absoluteFill}>
            <Svg height="100%" width="100%">
              <Defs>
                <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={GRADIENT_START} />
                  <Stop offset="100%" stopColor={GRADIENT_END} />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#grad)" />
            </Svg>
          </View>
          
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroDate}>Thứ Ba, 24 Tháng 10</Text>
              <Text style={styles.heroStatus}>Mọi thứ đều ổn</Text>
            </View>
            <Icon name="sunny" size={40} color="rgba(255,255,255,0.8)" />
          </View>

          <View style={styles.glassStatsRow}>
            <View style={styles.glassModule}>
              <Icon name="thermometer" size={18} color="#fff" />
              <Text style={styles.moduleLabel}>Nhiệt độ</Text>
              <Text style={styles.moduleValue}>36.5°C</Text>
            </View>
            <View style={styles.glassModule}>
              <Icon name="favorite" size={18} color="#fff" />
              <Text style={styles.moduleLabel}>Nhịp tim</Text>
              <Text style={styles.moduleValue}>72 bpm</Text>
            </View>
            <View style={styles.glassModule}>
              <Icon name="steps" size={18} color="#fff" />
              <Text style={styles.moduleLabel}>Vận động</Text>
              <Text style={styles.moduleValue}>4.2k b</Text>
            </View>
          </View>
        </View>

        {/* Actionable Tasks Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>HÔM NAY CẦN LÀM</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.taskCard}>
            <View style={[styles.taskIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Icon name="pill" size={24} color="#2563EB" />
            </View>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>Metformin 500mg</Text>
              <Text style={styles.taskTime}>Uống lúc 8:00 SA</Text>
            </View>
            <View style={styles.tagChuaUong}>
              <Text style={styles.tagText}>CHƯA UỐNG</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.taskCard}>
            <View style={[styles.taskIconWrap, { backgroundColor: '#F0FDF4' }]}>
              <Icon name="calendar_month" size={24} color="#16A34A" />
            </View>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>Tái khám tim mạch</Text>
              <Text style={styles.taskTime}>14:00 - BV Tâm Đức</Text>
            </View>
            <Icon name="chevron_right" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.taskCard}>
            <View style={[styles.taskIconWrap, { backgroundColor: '#FFF7ED' }]}>
              <Icon name="syringe" size={24} color="#EA580C" />
            </View>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>Tiêm Vaccine cho bé Nam</Text>
              <Text style={styles.taskTime}>Lịch hẹn trong tuần này</Text>
            </View>
            <Icon name="chevron_right" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* AI Advisor Card */}
        <View style={[styles.aiAdvisorCard, { backgroundColor: AI_PASTEL }]}>
          <View style={styles.aiHeader}>
            <View style={styles.aiAvatar}>
              <Icon name="smart_toy" size={20} color="#fff" />
            </View>
            <Text style={styles.aiLabel}>AI CỐ VẤN</Text>
          </View>
          <Text style={styles.aiAdviceText}>
            "Bà Lan có dấu hiệu mệt mỏi vào buổi chiều, bạn nên kiểm tra huyết áp cho bà nhé."
          </Text>
        </View>
      </ScrollView>

      {/* NO FAB HERE as per instructions */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoText: {
    fontSize: 22,
    fontFamily: 'Manrope',
    fontWeight: '800',
    color: '#0047AB',
    letterSpacing: -0.5,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 12,
    right: 13,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  greetingSection: {
    marginBottom: 24,
  },
  greetingTitle: {
    fontSize: 26,
    fontFamily: 'Manrope',
    fontWeight: '800',
    color: '#1E293B',
  },
  greetingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#64748B',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#0047AB',
  },
  memberList: {
    paddingBottom: 5,
    gap: 12,
  },
  memberPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
  },
  memberPillActive: {
    backgroundColor: '#0047AB',
    ...shadows.sm,
  },
  memberPillText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#475569',
  },
  memberPillTextActive: {
    color: '#fff',
  },
  addMemberBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  shortcutCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.sm,
  },
  shortcutIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  shortcutLabel: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#1E293B',
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
    height: 240,
    justifyContent: 'space-between',
    overflow: 'hidden',
    marginBottom: 24,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroDate: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: 'rgba(255,255,255,0.7)',
  },
  heroStatus: {
    fontSize: 28,
    fontFamily: 'Manrope',
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
  },
  glassStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  glassModule: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    gap: 4,
  },
  moduleLabel: {
    fontSize: 10,
    fontFamily: 'Inter',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
  },
  moduleValue: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#fff',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.sm,
  },
  taskIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#1E293B',
  },
  taskTime: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: '#64748B',
    marginTop: 2,
  },
  tagChuaUong: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 10,
    fontFamily: 'Inter',
    fontWeight: '800',
    color: '#4F46E5',
  },
  aiAdvisorCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 71, 171, 0.05)',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#0047AB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiLabel: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '800',
    color: '#0047AB',
    letterSpacing: 1,
  },
  aiAdviceText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#1E293B',
    fontStyle: 'italic',
    lineHeight: 22,
  },
});
