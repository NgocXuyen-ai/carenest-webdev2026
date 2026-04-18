import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue,
  withTiming,
  interpolateColor
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import Icon from '../common/Icon';

const TAB_CONFIG = [
  { name: 'HomeTab', iconName: 'home', label: 'Trang chủ' },
  { name: 'FamilyTab', iconName: 'group', label: 'Gia đình' },
  { name: 'MedicineTab', iconName: 'medication', label: 'Tủ thuốc' },
  { name: 'AiChatTab', iconName: 'smart_toy', label: 'Trợ lý' },
  { name: 'ProfileTab', iconName: 'person', label: 'Tôi' },
];

export default function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const height = BOTTOM_NAV_HEIGHT + (Platform.OS === 'ios' ? insets.bottom : 0);
  
  // Animation for the sliding pill
  const translateIndicator = useSharedValue(0);
  const tabWidth = windowWidth / TAB_CONFIG.length;

  useEffect(() => {
    translateIndicator.value = withSpring(state.index * tabWidth, {
      damping: 20,
      stiffness: 150,
    });
  }, [state.index, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateIndicator.value }],
  }));

  return (
    <View style={[styles.bar, { height }]}>
      {/* Sliding Pill Indicator */}
      <Animated.View 
        style={[
          styles.pillIndicator, 
          { width: tabWidth - 16 }, 
          indicatorStyle
        ]} 
      />

      {state.routes.map((route, index) => {
        const isActive = state.index === index;
        const config = TAB_CONFIG.find(t => t.name === route.name) ?? TAB_CONFIG[0];

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isActive && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            activeOpacity={0.7}
          >
            <TabItem 
              isActive={isActive} 
              iconName={config.iconName} 
              label={config.label} 
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Sub-component for individual tab items to handle their own local animations
function TabItem({ isActive, iconName, label }: { isActive: boolean, iconName: string, label: string }) {
  const scale = useSharedValue(isActive ? 1.1 : 1);
  const colorProgress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1.1 : 1);
    colorProgress.value = withTiming(isActive ? 1 : 0, { duration: 300 });
  }, [isActive]);

  const animatedStyles = useAnimatedStyle(() => {
    const color = interpolateColor(
      colorProgress.value,
      [0, 1],
      [colors.outline, colors.primary]
    );

    return {
      transform: [{ scale: scale.value }],
      color,
    };
  });

  return (
    <View style={styles.tabContent}>
      <Icon
        name={iconName}
        size={24}
        color={isActive ? colors.primary : colors.outline}
      />
      <Animated.Text style={[styles.label, { color: isActive ? colors.primary : colors.outline }, animatedStyles]}>
        {label}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,1)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 20,
    alignItems: 'center',
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  pillIndicator: {
    position: 'absolute',
    height: 48,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    left: 8,
    top: 12,
  },
  tab: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Inter',
    fontWeight: '700',
    letterSpacing: 0.2,
    marginTop: 2,
  },
});

