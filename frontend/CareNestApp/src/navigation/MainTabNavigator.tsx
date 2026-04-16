import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './navigationTypes';

import HomeStack from './HomeStack';
import FamilyStack from './FamilyStack';
import MedicineStack from './MedicineStack';
import AiChatStack from './AiChatStack';
import ProfileStack from './ProfileStack';
import BottomTabBar from '../components/layout/BottomTabBar';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
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
