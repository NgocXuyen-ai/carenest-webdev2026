import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface FilterChipProps {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}

export default function FilterChip({ options, selected, onSelect }: FilterChipProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map(option => {
        const isActive = option === selected;
        return (
          <TouchableOpacity
            key={option}
            onPress={() => onSelect(option)}
            style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, paddingVertical: 2 },
  chip: { borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10 },
  chipActive: { backgroundColor: colors.primary },
  chipInactive: { backgroundColor: colors.surfaceContainerHigh },
  label: { fontSize: 14, fontFamily: 'Inter', fontWeight: '600' },
  labelActive: { color: colors.onPrimary },
  labelInactive: { color: colors.onSurface },
});
