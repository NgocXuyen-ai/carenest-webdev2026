import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MedicineStackParamList } from './navigationTypes';

import MedicineScheduleScreen from '../screens/medicine/MedicineScheduleScreen';
import MedicineCabinetScreen from '../screens/medicine/MedicineCabinetScreen';
import AddMedicineScheduleScreen from '../screens/medicine/AddMedicineScheduleScreen';
import AddMedicineToCabinetScreen from '../screens/medicine/AddMedicineToCabinetScreen';
import OcrScannerScreen from '../screens/medicine/OcrScannerScreen';
import AppointmentListScreen from '../screens/appointment/AppointmentListScreen';
import AddAppointmentScreen from '../screens/appointment/AddAppointmentScreen';

const Stack = createNativeStackNavigator<MedicineStackParamList>();

export default function MedicineStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MedicineCabinet" component={MedicineCabinetScreen} />
      <Stack.Screen name="MedicineSchedule" component={MedicineScheduleScreen} />
      <Stack.Screen name="AddMedicineSchedule" component={AddMedicineScheduleScreen} />
      <Stack.Screen name="AddMedicineToCabinet" component={AddMedicineToCabinetScreen} />
      <Stack.Screen name="OcrScanner" component={OcrScannerScreen} />
      <Stack.Screen name="AppointmentList" component={AppointmentListScreen} />
      <Stack.Screen name="AddAppointment" component={AddAppointmentScreen} />
    </Stack.Navigator>
  );
}
