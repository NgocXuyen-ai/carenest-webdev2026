import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import Icon from '../../components/common/Icon';
import FAB from '../../components/common/FAB';
import { mockVaccinations } from '../../data/mockVaccinations';
import { mockFamilyMembers } from '../../data/mockFamilyMembers';
import NotificationBell from '../../components/common/NotificationBell';
import type { FamilyStackParamList } from '../../navigation/navigationTypes';

type RouteT = RouteProp<FamilyStackParamList, 'VaccinationTracker'>;

const AGE_GROUP_ICONS: Record<string, string> = {
  'Sơ sinh': 'face',
  '2 tháng': 'calendar_today',
  '6 tháng': 'hourglass_empty',
  '9 tháng': 'trending_up',
  '12 tháng': 'cake',
};

const AGE_GROUP_DESC: Record<string, string> = {
  'Sơ sinh': 'Giai đoạn đầu tiên sau khi chào đời',
  '2 tháng': 'Sắp tới: 3 mũi quan trọng',
  '6 tháng': 'Kế hoạch tương lai',
  '9 tháng': 'Phát triển thể chất',
  '12 tháng': 'Cột mốc 1 năm tuổi',
};

export default function VaccinationTrackerScreen() {
  const route = useRoute<RouteT>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { memberId } = route.params;

  const member = mockFamilyMembers.find(m => m.id === memberId);
  const initialVaccinations = mockVaccinations.filter(v => 
    v.profileId === (member?.role === 'Con' ? member.profileId : 'profile-3')
  );

  const [vaccinations, setVaccinations] = React.useState(initialVaccinations);

  const toggleVaccinationStatus = (id: string) => {
    setVaccinations(prev => prev.map(v => {
      if (v.id === id) {
        return {
          ...v,
          status: v.status === 'completed' ? 'scheduled' : 'completed',
          date: v.status === 'completed' ? undefined : new Date().toLocaleDateString('vi-VN')
        };
      }
      return v;
    }));
  };

  // Group by ageGroup
  const groups = vaccinations.reduce<Record<string, typeof vaccinations>>((acc, v) => {
    const key = v.ageGroup ?? 'Khác';
    if (!acc[key]) acc[key] = [];
    acc[key].push(v);
    return acc;
  }, {});

  const renderVaccineCard = (vac: any) => {
    const isCompleted = vac.status === 'completed';
    const isScheduled = vac.status === 'scheduled';
    const isFuture = vac.status === 'future';

    return (
      <TouchableOpacity
        key={vac.id}
        activeOpacity={0.7}
        onPress={() => toggleVaccinationStatus(vac.id)}
        style={[
          styles.vacCard,
          isScheduled && styles.vacCardScheduled,
          shadows.sm
        ]}
      >
        <View style={[
          styles.vacIconWrap,
          isCompleted && styles.vacIconWrapCompleted,
          isFuture && styles.vacIconWrapFuture
        ]}>
          <Icon
            name={isCompleted ? 'check' : isScheduled ? 'calendar_today' : 'access_time'}
            size={20}
            color={isCompleted ? '#fff' : isScheduled ? colors.primary : '#94A3B8'}
          />
        </View>

        <View style={styles.vacInfo}>
          <Text style={[styles.vacName, isFuture && styles.textDimmed]}>{vac.name}</Text>
          <Text style={[styles.vacDetail, isScheduled && styles.vacDetailActive, isFuture && styles.textDimmed]}>
            {isCompleted ? `Mũi ${vac.doseNumber || 1} • ${vac.date || new Date().toLocaleDateString('vi-VN')}` : isScheduled ? `HẸN: ${vac.plannedDate || 'Sắp tới'}` : `Dự kiến: ${vac.plannedDate || '20/07/2023'}`}
          </Text>
          {vac.facility && <Text style={[styles.vacFacility, isFuture && styles.textDimmed]}>{vac.facility}</Text>}
        </View>

        {isScheduled && (
          <View style={styles.scheduledAlert}>
            <Icon name="notifications" size={24} color="#1E3A8A" />
          </View>
        )}

        {isCompleted && (
          <Icon name="chevron_right" size={20} color="#CBD5E1" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* Custom Header Based on Mockup */}
      <View style={[styles.customHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow_back" size={26} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.headerProfileRow}>
          <View style={styles.avatarWrap}>
            <Image
              source={{ uri: `https://i.pravatar.cc/150?u=${memberId}` }}
              style={styles.avatarImg}
            />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Lịch tiêm chủng</Text>
            <Text style={styles.headerSubtitle}>{(member?.fullName || 'BÉ MINH QUÂN').toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + 80 }
        ]}
      >
        {/* Timeline Content */}
        {Object.entries(groups).map(([ageGroup, items]) => (
          <View key={ageGroup} style={styles.timelineSection}>
            <View style={styles.ageHeaderRow}>
              <View style={styles.ageIconCircle}>
                <Icon name={AGE_GROUP_ICONS[ageGroup] || 'face'} size={24} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.ageTitleText}>{ageGroup}</Text>
                <Text style={styles.ageSubTitleText}>{AGE_GROUP_DESC[ageGroup] || 'Giai đoạn phát triển'}</Text>
              </View>
            </View>

            <View style={styles.cardListContainer}>
              {items.map(vac => renderVaccineCard(vac))}
            </View>
          </View>
        ))}
      </ScrollView>

      <FAB
        iconName="add"
        onPress={() => navigation.navigate('AddVaccinationSchedule' as never)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },

  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerProfileRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 60, height: 60, borderRadius: 30,
    overflow: 'hidden', borderWidth: 2, borderColor: '#fff', ...shadows.sm
  },
  avatarImg: { width: '100%', height: '100%' },
  headerTextWrap: { flex: 1 },
  headerTitle: { fontSize: 20, fontFamily: 'Manrope', fontWeight: '800', color: '#1E3A8A' },
  headerSubtitle: { fontSize: 12, fontFamily: 'Inter', fontWeight: '700', color: '#64748B', marginTop: 1, letterSpacing: 0.5 },
  bellBtn: { padding: 4 },

  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },

  timelineSection: { marginBottom: 32 },
  ageHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  ageIconCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center'
  },
  ageTitleText: { fontSize: 20, fontFamily: 'Manrope', fontWeight: '800', color: '#1E293B' },
  ageSubTitleText: { fontSize: 13, fontFamily: 'Inter', color: '#64748B', marginTop: 2 },

  cardListContainer: { gap: 14 },
  vacCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 28, padding: 18, gap: 16
  },
  vacCardScheduled: {
    borderWidth: 2, borderColor: '#3B82F6',
    borderLeftWidth: 8, borderLeftColor: '#3B82F6'
  },
  vacIconWrap: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center'
  },
  vacIconWrapCompleted: { backgroundColor: '#3B82F6' },
  vacIconWrapFuture: { backgroundColor: '#F1F5F9' },

  vacInfo: { flex: 1 },
  vacName: { fontSize: 16, fontFamily: 'Inter', fontWeight: '700', color: '#1E293B' },
  vacDetail: { fontSize: 13, fontFamily: 'Inter', fontWeight: '600', color: '#64748B', marginTop: 4 },
  vacDetailActive: { color: '#3B82F6' },
  vacFacility: { fontSize: 12, fontFamily: 'Inter', color: '#94A3B8', marginTop: 3 },

  scheduledAlert: { padding: 4 },
  textDimmed: { opacity: 0.5 },
});
