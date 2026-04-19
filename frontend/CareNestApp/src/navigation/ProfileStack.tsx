import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from './navigationTypes';

import UserProfileSettingsScreen from '../screens/profile/UserProfileSettingsScreen';
import UserMedicalScreen from '../screens/profile/UserMedicalScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserProfileSettings" component={UserProfileSettingsScreen} />
      <Stack.Screen name="UserMedical" component={UserMedicalScreen} />
    </Stack.Navigator>
  );
}
