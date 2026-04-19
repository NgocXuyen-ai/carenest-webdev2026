import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AiChatStackParamList } from './navigationTypes';

import AiChatbotScreen from '../screens/ai/AiChatbotScreen';
import VoiceAssistantScreen from '../screens/ai/VoiceAssistantScreen';

const Stack = createNativeStackNavigator<AiChatStackParamList>();

export default function AiChatStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AiChatbot" component={AiChatbotScreen} />
      <Stack.Screen
        name="VoiceAssistant"
        component={VoiceAssistantScreen}
        options={{ presentation: 'transparentModal', animation: 'fade' }}
      />
    </Stack.Navigator>
  );
}
