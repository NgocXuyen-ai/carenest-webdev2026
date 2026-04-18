import React from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getIconName } from '../../utils/iconMap';

interface IconProps {
  name: string;       // Material Symbols name (from prototype) or MCIcons name
  size?: number;
  color?: string;
  style?: object;
}

export default function Icon({ name, size = 24, color = '#181c1f', style }: IconProps) {
  const iconName = getIconName(name);
  return <MaterialCommunityIcons name={iconName} size={size} color={color} style={style} />;
}
