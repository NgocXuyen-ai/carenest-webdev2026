import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: AvatarSize;
  bordered?: boolean;
}

const sizeValues: Record<AvatarSize, number> = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 56,
  xl: 80,
};

const fontSizes: Record<AvatarSize, number> = {
  xs: 11,
  sm: 14,
  md: 17,
  lg: 22,
  xl: 32,
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function Avatar({ uri, name, size = 'md', bordered = false }: AvatarProps) {
  const dimension = sizeValues[size];
  const containerStyle = [
    styles.container,
    { width: dimension, height: dimension, borderRadius: dimension / 2 },
    bordered && styles.bordered,
  ];

  if (uri) {
    return (
      <View style={containerStyle}>
        <Image
          source={{ uri }}
          style={{ width: dimension, height: dimension, borderRadius: dimension / 2 }}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View style={[containerStyle, styles.placeholder]}>
      <Text style={[styles.initials, { fontSize: fontSizes[size] }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  bordered: {
    borderWidth: 2,
    borderColor: colors.primaryContainer,
  },
  placeholder: {
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.primary,
    fontFamily: 'Manrope',
    fontWeight: '700',
  },
});
