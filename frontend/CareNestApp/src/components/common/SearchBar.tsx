import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import Icon from './Icon';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChangeText, placeholder = 'Tìm kiếm...' }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Icon name="search" size={20} color={colors.outline} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.outline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter',
    color: colors.onSurface,
    paddingVertical: 0,
  },
});
