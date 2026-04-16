import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { FamilyStackParamList } from './navigationTypes';

import FamilyManagementScreen from '../screens/family/FamilyManagementScreen';
import HealthProfileDetailScreen from '../screens/family/HealthProfileDetailScreen';
import VaccinationTrackerScreen from '../screens/health/VaccinationTrackerScreen';
import GrowthTrackerScreen from '../screens/health/GrowthTrackerScreen';

const Stack = createNativeStackNavigator<FamilyStackParamList>();

export default function FamilyStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FamilyManagement" component={FamilyManagementScreen} />
      <Stack.Screen name="HealthProfileDetail" component={HealthProfileDetailScreen} />
      <Stack.Screen name="VaccinationTracker" component={VaccinationTrackerScreen} />
      <Stack.Screen name="GrowthTracker" component={GrowthTrackerScreen} />
    </Stack.Navigator>
  );
}
