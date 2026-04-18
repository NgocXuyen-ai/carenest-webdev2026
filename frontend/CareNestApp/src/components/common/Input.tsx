import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../../theme/colors';

interface InputProps extends TextInputProps {
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  error?: string;
}

export default function Input({
  label,
  leftIcon,
  rightIcon,
  onRightIconPress,
  error,
  style,
  ...props
}: InputProps) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.container, error ? styles.containerError : null]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, leftIcon ? styles.inputWithLeftIcon : null, style]}
          placeholderTextColor={colors.outlineVariant}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    marginLeft: 4,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 16,
  },
  containerError: {
    borderColor: colors.error,
  },
  leftIcon: { marginRight: 10 },
  rightIcon: { marginLeft: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter',
    color: colors.onSurface,
    paddingVertical: 0,
  },
  inputWithLeftIcon: {
    paddingLeft: 4,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginLeft: 4,
    fontFamily: 'Inter',
  },
});
