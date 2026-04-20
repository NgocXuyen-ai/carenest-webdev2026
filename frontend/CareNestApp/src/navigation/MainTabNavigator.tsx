import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './navigationTypes';

import HomeStack from './HomeStack';
import FamilyStack from './FamilyStack';
import MedicineStack from './MedicineStack';
import AiChatStack from './AiChatStack';
import ProfileStack from './ProfileStack';
import BottomTabBar from '../components/layout/BottomTabBar';
import { useFamily } from '../context/FamilyContext';
import { useAuth } from '../context/AuthContext';
import { getDashboard } from '../api/dashboard';
import { getAppointmentOverview } from '../api/appointments';
import { getCabinetMedicines, getDailySchedule, getScheduleFormData } from '../api/medicine';
import { getNotifications } from '../api/notifications';
import { listConversations } from '../api/ai';
import { formatLocalDate } from '../utils/dateTime';
import { getGrowthSummary } from '../api/growth';
import { getVaccinationTracker } from '../api/vaccinations';
import { getCurrentUserProfile } from '../api/auth';
import { getFamilyProfile } from '../api/family';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { hasFamily, members, selectedProfileId } = useFamily();
  const { user } = useAuth();

  const ownProfileId = user?.profileId ? Number(user.profileId) : undefined;
  const activeProfileId = selectedProfileId ?? ownProfileId;
  const notificationProfileId =
    selectedProfileId !== null
      ? selectedProfileId
      : hasFamily
        ? undefined
        : ownProfileId;

  useEffect(() => {
    const today = formatLocalDate(new Date());
    const prefetchTasks: Array<Promise<unknown>> = [
      getDashboard(selectedProfileId ?? undefined),
      getCabinetMedicines(),
      getScheduleFormData(),
      getNotifications(notificationProfileId),
      listConversations(),
      getCurrentUserProfile(),
    ];

    for (const member of members) {
      prefetchTasks.push(getFamilyProfile(member.profileId));
    }

    if (typeof activeProfileId === 'number') {
      prefetchTasks.push(getAppointmentOverview(activeProfileId));
      prefetchTasks.push(getDailySchedule(activeProfileId, today));
      prefetchTasks.push(getGrowthSummary(activeProfileId));
      prefetchTasks.push(getVaccinationTracker(activeProfileId));
    }

    void Promise.allSettled(prefetchTasks);
  }, [activeProfileId, members, notificationProfileId, selectedProfileId]);

  return (
    <Tab.Navigator
      screenOptions={{ 
        headerShown: false,
        animation: 'shift', // Smooth transition between tabs
      }}
      tabBar={props => <BottomTabBar {...props} />}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="FamilyTab" component={FamilyStack} />
      <Tab.Screen name="MedicineTab" component={MedicineStack} />
      <Tab.Screen name="AiChatTab" component={AiChatStack} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} />
    </Tab.Navigator>
  );
}
