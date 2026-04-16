import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

type BadgeVariant = 'expired' | 'expiring' | 'stable' | 'out_of_stock' | 'upcoming' | 'completed' | 'pending' | 'cancelled';

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
}

const variantConfig: Record<BadgeVariant, { bg: string; text: string; defaultLabel: string }> = {
  expired: { bg: colors.errorContainer, text: colors.onErrorContainer, defaultLabel: 'HẾT HẠN' },
  expiring: { bg: '#FFF3E0', text: '#E65100', defaultLabel: 'SẮP HẾT HẠN' },
  stable: { bg: colors.tertiaryFixed, text: colors.tertiary, defaultLabel: 'ỔN ĐỊNH' },
  out_of_stock: { bg: colors.surfaceContainerHighest, text: colors.outline, defaultLabel: 'HẾT HÀNG' },
  upcoming: { bg: colors.tertiaryFixed, text: colors.tertiary, defaultLabel: 'SẮP TỚI' },
  completed: { bg: '#E8F5E9', text: '#2E7D32', defaultLabel: 'HOÀN THÀNH' },
  pending: { bg: colors.primaryFixed, text: colors.primary, defaultLabel: 'CHỜ XỬ LÝ' },
  cancelled: { bg: colors.surfaceContainerHighest, text: colors.outline, defaultLabel: 'ĐÃ HỦY' },
};

export default function StatusBadge({ variant, label }: StatusBadgeProps) {
  const config = variantConfig[variant];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{label ?? config.defaultLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontFamily: 'Inter',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
