import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { BOTTOM_NAV_HEIGHT, TOP_BAR_HEIGHT } from '../../utils/constants';

interface ScreenContainerProps {
  children: React.ReactNode;
  hasTopBar?: boolean;
  hasBottomNav?: boolean;
  scrollable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  backgroundColor?: string;
}

export default function ScreenContainer({
  children,
  hasTopBar = true,
  hasBottomNav = true,
  scrollable = true,
  style,
  contentStyle,
  backgroundColor = colors.surface,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  const paddingTop = hasTopBar ? TOP_BAR_HEIGHT + insets.top : insets.top + 16;
  const paddingBottom = hasBottomNav ? BOTTOM_NAV_HEIGHT + 16 : insets.bottom + 16;

  if (!scrollable) {
    return (
      <View style={[styles.container, { backgroundColor }, style]}>
        <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
        <View style={[{ paddingTop, paddingBottom, flex: 1 }, contentStyle]}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          { paddingTop, paddingBottom, paddingHorizontal: 20 },
          contentStyle,
        ]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
