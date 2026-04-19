import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import Icon from './Icon';

interface FABProps {
  iconName?: string;
  onPress: () => void;
  style?: ViewStyle;
}

export default function FAB({ iconName = 'add', onPress, style }: FABProps) {
  return (
    <TouchableOpacity style={[styles.fab, style]} onPress={onPress} activeOpacity={0.85}>
      <Icon name={iconName} size={28} color={colors.onPrimary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: BOTTOM_NAV_HEIGHT + 12,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
});
