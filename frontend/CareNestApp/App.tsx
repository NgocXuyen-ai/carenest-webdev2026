import './src/global.css';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import { FamilyProvider } from './src/context/FamilyContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <FamilyProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </FamilyProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
