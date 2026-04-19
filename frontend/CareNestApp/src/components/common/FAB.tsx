import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import Icon from './Icon';

const FAB_BOTTOM_OFFSET = BOTTOM_NAV_HEIGHT;

interface FABProps {
  iconName?: string;
  onPress: () => void;
  style?: ViewStyle;
  bottomOffset?: number;
}

export default function FAB({
  iconName = 'add',
  onPress,
  style,
  bottomOffset = FAB_BOTTOM_OFFSET,
}: FABProps) {
  return (
    <TouchableOpacity
      style={[styles.fab, { bottom: bottomOffset }, style]}
      onPress={onPress}
      activeOpacity={0.85}
      hitSlop={{ top: 10, left: 10, right: 10, bottom: 14 }}
    >
      <Icon name={iconName} size={28} color={colors.onPrimary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: FAB_BOTTOM_OFFSET,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    ...shadows.lg,
  },
});
