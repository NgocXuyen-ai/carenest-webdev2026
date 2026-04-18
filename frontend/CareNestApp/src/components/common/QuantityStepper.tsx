import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function QuantityStepper({ value, onChange, min = 0, max = 999 }: QuantityStepperProps) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <Text style={styles.btnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.value}>{value}</Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <Text style={styles.btnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 20, fontFamily: 'Inter', color: colors.onSurface, lineHeight: 24 },
  value: {
    minWidth: 48,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: colors.onSurface,
  },
});
