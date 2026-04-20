import React from 'react';
import { Image, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '../../theme/colors';
import { BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import { CARENEST_LOGO_HOUSE } from '../../assets/branding';
import Icon from '../common/Icon';

const TAB_CONFIG = [
  { name: 'HomeTab', iconName: 'home', label: 'Trang chủ' },
  { name: 'FamilyTab', iconName: 'group', label: 'Gia đình' },
  { name: 'MedicineTab', iconName: 'medication', label: 'Thuốc' },
  { name: 'AiChatTab', iconName: 'smart_toy', label: 'Trợ lý ảo', useBrandIcon: true },
  { name: 'ProfileTab', iconName: 'person', label: 'Tôi' },
];

export default function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const height = BOTTOM_NAV_HEIGHT + (Platform.OS === 'ios' ? insets.bottom : 0);

  return (
    <View style={[styles.bar, { height }]}>
      {state.routes.map((route, index) => {
        const isActive = state.index === index;
        const config = TAB_CONFIG.find(t => t.name === route.name) ?? TAB_CONFIG[0];

        return (
          <TouchableOpacity
            key={route.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.8}
          >
            {config.useBrandIcon ? (
              <Image
                source={CARENEST_LOGO_HOUSE}
                style={[styles.brandIcon, isActive ? styles.brandIconActive : styles.brandIconInactive]}
                resizeMode="contain"
              />
            ) : (
              <Icon
                name={config.iconName}
                size={24}
                color={isActive ? colors.primary : colors.outline}
              />
            )}
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 12,
    alignItems: 'center',
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 4,
    gap: 2,
  },
  tabActive: {
    backgroundColor: '#EFF6FF',
  },
  brandIcon: {
    width: 24,
    height: 24,
  },
  brandIconActive: { opacity: 1 },
  brandIconInactive: { opacity: 0.65 },
  label: {
    fontSize: 10,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: colors.outline,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  labelActive: {
    color: colors.primary,
  },
});
