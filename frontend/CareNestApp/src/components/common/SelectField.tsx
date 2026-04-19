import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from './Icon';

type Option = {
  value: string;
  label: string;
};

interface SelectFieldProps {
  icon: string;
  label: string;
  value: string;
  displayValue: string;
  options: readonly Option[];
  onChange: (nextValue: string) => void;
  disabled?: boolean;
}

export default function SelectField({
  icon,
  label,
  value,
  displayValue,
  options,
  onChange,
  disabled = false,
}: SelectFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[styles.inputContainer, disabled && styles.inputContainerDisabled]}
        onPress={() => setVisible(true)}
        activeOpacity={disabled ? 1 : 0.85}
        disabled={disabled}
      >
        <View style={styles.inputIconWrap}>
          <Icon name={icon} size={20} color="#3B82F6" />
        </View>
        <View style={styles.inputContent}>
          <Text style={styles.inputLabel}>{label}</Text>
          <Text style={styles.inputValue}>{displayValue}</Text>
        </View>
        <Icon name="expand_more" size={24} color={disabled ? '#CBD5E1' : '#94A3B8'} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionRow, option.value === value && styles.optionRowActive]}
                  onPress={() => {
                    onChange(option.value);
                    setVisible(false);
                  }}
                >
                  <Text style={[styles.optionText, option.value === value && styles.optionTextActive]}>
                    {option.label}
                  </Text>
                  {option.value === value ? <Icon name="check" size={18} color="#3B82F6" /> : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 16,
  },
  inputContainerDisabled: {
    opacity: 0.8,
  },
  inputIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 2,
  },
  inputValue: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#1E293B',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    maxHeight: 420,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 16,
  },
  optionRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  optionRowActive: {
    backgroundColor: '#EFF6FF',
  },
  optionText: {
    fontSize: 15,
    fontFamily: 'Inter',
    color: '#1E293B',
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#2563EB',
  },
});
