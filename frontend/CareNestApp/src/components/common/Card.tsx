import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: number;
}

export default function Card({ children, style, variant = 'default', padding = 16 }: CardProps) {
  return (
    <View style={[styles.base, variantStyles[variant], { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLowest,
    overflow: 'hidden',
  },
});

const variantStyles = StyleSheet.create({
  default: {
    ...shadows.sm,
  },
  elevated: {
    ...shadows.md,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
});
