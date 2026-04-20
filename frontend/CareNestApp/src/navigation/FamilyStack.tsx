import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { FamilyStackParamList } from './navigationTypes';

import FamilyManagementScreen from '../screens/family/FamilyManagementScreen';
import HealthProfileDetailScreen from '../screens/family/HealthProfileDetailScreen';
import VaccinationTrackerScreen from '../screens/health/VaccinationTrackerScreen';
import GrowthTrackerScreen from '../screens/health/GrowthTrackerScreen';
import UserMedicalScreen from '../screens/profile/UserMedicalScreen';
import AddVaccinationScheduleScreen from '../screens/health/AddVaccinationScheduleScreen';
import MedicineScheduleScreen from '../screens/medicine/MedicineScheduleScreen';
import AddMedicineScheduleScreen from '../screens/medicine/AddMedicineScheduleScreen';
import AppointmentListScreen from '../screens/appointment/AppointmentListScreen';
import AddAppointmentScreen from '../screens/appointment/AddAppointmentScreen';

const Stack = createNativeStackNavigator<FamilyStackParamList>();

export default function FamilyStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FamilyManagement" component={FamilyManagementScreen} />
      <Stack.Screen name="HealthProfileDetail" component={HealthProfileDetailScreen} />
      <Stack.Screen name="VaccinationTracker" component={VaccinationTrackerScreen} />
      <Stack.Screen name="GrowthTracker" component={GrowthTrackerScreen} />
      <Stack.Screen name="UserMedical" component={UserMedicalScreen} />
      <Stack.Screen name="MedicineSchedule" component={MedicineScheduleScreen} />
      <Stack.Screen name="AddMedicineSchedule" component={AddMedicineScheduleScreen} />
      <Stack.Screen name="AppointmentList" component={AppointmentListScreen} />
      <Stack.Screen name="AddAppointment" component={AddAppointmentScreen} />
      <Stack.Screen name="AddVaccinationSchedule" component={AddVaccinationScheduleScreen} />
    </Stack.Navigator>
  );
}
