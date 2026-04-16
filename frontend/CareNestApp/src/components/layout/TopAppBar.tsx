import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { TOP_BAR_HEIGHT } from '../../utils/constants';
import Avatar from '../common/Avatar';
import Icon from '../common/Icon';

type TopAppBarVariant = 'home' | 'detail' | 'chat';

interface TopAppBarProps {
  variant?: TopAppBarVariant;
  title?: string;
  userName?: string;
  avatarUri?: string;
  onNotificationsPress?: () => void;
  notificationCount?: number;
  rightAction?: React.ReactNode;
}

export default function TopAppBar({
  variant = 'detail',
  title,
  userName,
  avatarUri,
  onNotificationsPress,
  notificationCount = 0,
  rightAction,
}: TopAppBarProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const barHeight = TOP_BAR_HEIGHT + (Platform.OS === 'ios' ? insets.top : 0);

  if (variant === 'home') {
    return (
      <View style={[styles.bar, styles.homeBar, { paddingTop: insets.top || 12, height: barHeight }]}>
        <View style={styles.homeLeft}>
          <Avatar uri={avatarUri} name={userName} size="sm" bordered />
          <Text style={styles.logoText}>CareNest</Text>
        </View>
        <View style={styles.homeRight}>
          {onNotificationsPress && (
            <TouchableOpacity onPress={onNotificationsPress} style={styles.bellBtn} activeOpacity={0.8}>
              <Icon name="notifications" size={24} color={colors.onSurfaceVariant} />
              {notificationCount > 0 && <View style={styles.badge} />}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (variant === 'chat') {
    return (
      <View style={[styles.bar, styles.chatBar, { paddingTop: insets.top || 12, height: barHeight }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow_back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.chatTitle}>
          <View style={styles.chatAvatarWrap}>
            <Icon name="smart_toy" size={22} color="#fff" />
          </View>
          <View>
            <Text style={styles.chatName}>CareNest AI</Text>
            <Text style={styles.chatSubtitle}>Trực tuyến</Text>
          </View>
        </View>
        {rightAction ?? <View style={styles.backBtn} />}
      </View>
    );
  }

  // detail variant (default)
  return (
    <View style={[styles.bar, styles.detailBar, { paddingTop: insets.top || 12, height: barHeight }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
        <Icon name="arrow_back" size={24} color={colors.onSurface} />
      </TouchableOpacity>
      <Text style={styles.detailTitle} numberOfLines={1}>
        {title ?? ''}
      </Text>
      {rightAction ?? <View style={styles.backBtn} />}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: 'rgba(247,250,254,0.92)',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 10,
  },
  homeBar: { justifyContent: 'space-between' },
  detailBar: { justifyContent: 'space-between', alignItems: 'center' },
  chatBar: { alignItems: 'center', gap: 10 },
  homeLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  homeRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: {
    fontSize: 20,
    fontFamily: 'Manrope',
    fontWeight: '800',
    color: colors.onTertiaryContainer,
    letterSpacing: -0.5,
  },
  bellBtn: { padding: 6, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  detailTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: colors.onSurface,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  chatAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  chatName: {
    fontSize: 15,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: colors.onSurface,
  },
  chatSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#2E7D32',
  },
});
