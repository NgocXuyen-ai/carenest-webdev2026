import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from './Icon';
import { colors } from '../../theme/colors';

interface NotificationBellProps {
  size?: number;
  iconColor?: string;
  hasNotification?: boolean;
}

export default function NotificationBell({ 
  size = 26, 
  iconColor = colors.onSurfaceVariant,
  hasNotification = false,
}: NotificationBellProps) {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.7}
      onPress={() => navigation.navigate('NotificationsCenter')}
    >
      <Icon name="notifications" size={size} color={iconColor} />
      {hasNotification && (
        <View style={[styles.badge, { top: size * 0.1, right: size * 0.1 }]} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
});
