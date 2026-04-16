import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from './navigationTypes';

import HomeDashboardScreen from '../screens/home/HomeDashboardScreen';
import NotificationsCenterScreen from '../screens/notifications/NotificationsCenterScreen';
import AppointmentListScreen from '../screens/appointment/AppointmentListScreen';
import AddAppointmentScreen from '../screens/appointment/AddAppointmentScreen';
import VaccinationTrackerScreen from '../screens/health/VaccinationTrackerScreen';
import GrowthTrackerScreen from '../screens/health/GrowthTrackerScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeDashboard" component={HomeDashboardScreen} />
      <Stack.Screen name="NotificationsCenter" component={NotificationsCenterScreen} />
      <Stack.Screen name="AppointmentList" component={AppointmentListScreen} />
      <Stack.Screen name="AddAppointment" component={AddAppointmentScreen} />
      <Stack.Screen name="VaccinationTracker" component={VaccinationTrackerScreen} />
      <Stack.Screen name="GrowthTracker" component={GrowthTrackerScreen} />
    </Stack.Navigator>
  );
}
