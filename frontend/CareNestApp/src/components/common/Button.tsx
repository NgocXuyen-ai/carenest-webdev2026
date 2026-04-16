import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../theme/colors';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  fullWidth = false,
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
}: ButtonProps) {
  const containerStyle = [
    styles.base,
    sizeStyles[size],
    variantStyles[variant],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
  ];

  const textStyle = [
    styles.label,
    labelSizeStyles[size],
    variantLabelStyles[variant],
    disabled && styles.disabledLabel,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.primary} size="small" />
      ) : (
        <View style={styles.inner}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text style={textStyle}>{label}</Text>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  disabledLabel: {},
  inner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconLeft: { marginRight: 2 },
  iconRight: { marginLeft: 2 },
  label: { fontFamily: 'Inter', fontWeight: '700' },
});

const sizeStyles = StyleSheet.create({
  sm: { height: 36, paddingHorizontal: 16 },
  md: { height: 44, paddingHorizontal: 20 },
  lg: { height: 52, paddingHorizontal: 24 },
});

const labelSizeStyles = StyleSheet.create({
  sm: { fontSize: 13 },
  md: { fontSize: 14 },
  lg: { fontSize: 16 },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.secondaryContainer },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.outline },
  text: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.error },
});

const variantLabelStyles = StyleSheet.create({
  primary: { color: colors.onPrimary },
  secondary: { color: colors.secondary },
  outline: { color: colors.onSurface },
  text: { color: colors.primary },
  danger: { color: colors.onError },
});
