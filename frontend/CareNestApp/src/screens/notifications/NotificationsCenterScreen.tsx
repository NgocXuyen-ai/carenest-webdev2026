import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { TOP_BAR_HEIGHT, BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import Icon from '../../components/common/Icon';
import TopAppBar from '../../components/layout/TopAppBar';
import type { Notification } from '../../types';
import { getNotifications, markNotificationRead, type NotificationItem } from '../../api/notifications';
import { useFamily } from '../../context/FamilyContext';
import { useAuth } from '../../context/AuthContext';

type NotifType = Notification['type'];

interface IconConfig {
  iconName: string;
  bg: string;
  iconColor: string;
}

const typeIconConfig: Record<NotifType, IconConfig> = {
  medicine: { iconName: 'pill', bg: '#E3F2FD', iconColor: '#1565C0' },
  appointment: { iconName: 'calendar_month', bg: '#E0F2F1', iconColor: '#00695C' },
  vaccine: { iconName: 'syringe', bg: '#E8F5E9', iconColor: '#2E7D32' },
  warning: { iconName: 'warning', bg: '#ffdad6', iconColor: '#93000a' },
  ai_insight: { iconName: 'smart_toy', bg: '#cfe5ff', iconColor: '#00629d' },
  system: { iconName: 'info', bg: '#e5e8ec', iconColor: '#404751' },
};

const dateGroupLabel: Record<string, string> = {
  today: 'Hôm nay',
  yesterday: 'Hôm qua',
  this_week: 'Tuần này',
  older: 'Cũ hơn',
};

const dateGroupOrder = ['today', 'yesterday', 'this_week', 'older'];

function formatTime(timestamp: string): string {
  try {
    const d = new Date(timestamp);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return '';
  }
}

export default function NotificationsCenterScreen() {
  const insets = useSafeAreaInsets();
  const { hasFamily, selectedProfileId } = useFamily();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const profileId =
      selectedProfileId !== null
        ? selectedProfileId
        : hasFamily
          ? undefined
          : user?.profileId
            ? Number(user.profileId)
            : undefined;

    void getNotifications(profileId)
      .then(items => setNotifications(items.map(mapNotification)))
      .catch(() => setNotifications([]));
  }, [hasFamily, selectedProfileId, user?.profileId]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  async function handleMarkAllRead() {
    const unread = notifications.filter(item => !item.isRead);
    await Promise.all(unread.map(item => markNotificationRead(Number(item.id)).catch(() => {})));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }

  const grouped = useMemo(
    () =>
      dateGroupOrder.reduce<Record<string, Notification[]>>((acc, group) => {
        const items = notifications.filter(n => n.dateGroup === group);
        if (items.length > 0) {
          acc[group] = items;
        }
        return acc;
      }, {}),
    [notifications],
  );

  const markAllBtn = (
    <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn} activeOpacity={0.75}>
      <Text style={styles.markAllText}>Đánh dấu tất cả đã đọc</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <TopAppBar
        variant="detail"
        title="Thông báo"
        rightAction={unreadCount > 0 ? markAllBtn : undefined}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: TOP_BAR_HEIGHT + insets.top + 16, paddingBottom: BOTTOM_NAV_HEIGHT + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {unreadCount > 0 ? (
          <View style={styles.unreadBanner}>
            <Icon name="notifications" size={16} color={colors.primary} />
            <Text style={styles.unreadBannerText}>{unreadCount} thông báo chưa đọc</Text>
          </View>
        ) : null}

        {Object.keys(grouped).length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="notifications" size={56} color={colors.outlineVariant} />
            <Text style={styles.emptyTitle}>Không có thông báo nào</Text>
            <Text style={styles.emptySubtitle}>
              Mọi nhắc nhở và cập nhật sức khỏe sẽ xuất hiện ở đây.
            </Text>
          </View>
        ) : null}

        {Object.entries(grouped).map(([group, items]) => (
          <View key={group} style={styles.section}>
            <Text style={styles.sectionLabel}>{dateGroupLabel[group] ?? group}</Text>
            <View style={[styles.card, shadows.sm]}>
              {items.map((notif, index) => {
                const cfg = typeIconConfig[notif.type] ?? typeIconConfig.system;
                const isLast = index === items.length - 1;
                return (
                  <TouchableOpacity
                    key={notif.id}
                    style={[
                      styles.row,
                      !notif.isRead && styles.rowUnread,
                      !isLast && styles.rowDivider,
                    ]}
                    activeOpacity={0.7}
                    onPress={async () => {
                      setNotifications(prev =>
                        prev.map(n => (n.id === notif.id ? { ...n, isRead: true } : n)),
                      );
                      await markNotificationRead(Number(notif.id)).catch(() => {});
                    }}
                  >
                    <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
                      <Icon name={cfg.iconName} size={20} color={cfg.iconColor} />
                    </View>
                    <View style={styles.rowContent}>
                      <View style={styles.rowTopRow}>
                        <Text
                          style={[styles.rowTitle, !notif.isRead && styles.rowTitleUnread]}
                          numberOfLines={1}
                        >
                          {notif.title}
                        </Text>
                        <Text style={styles.rowTime}>{formatTime(notif.timestamp)}</Text>
                      </View>
                      <Text style={styles.rowDesc} numberOfLines={2}>
                        {notif.description}
                      </Text>
                    </View>
                    {!notif.isRead ? <View style={styles.unreadDot} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 16 },
  markAllBtn: { paddingHorizontal: 4, paddingVertical: 6 },
  markAllText: { fontSize: 13, fontFamily: 'Inter', fontWeight: '600', color: colors.primary },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryFixed,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 16,
  },
  unreadBannerText: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: colors.primary,
  },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 14,
    position: 'relative',
  },
  rowUnread: { backgroundColor: '#f4f8ff' },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
    marginTop: 1,
  },
  rowContent: { flex: 1, paddingRight: 16 },
  rowTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  rowTitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: colors.onSurface,
    flex: 1,
    marginRight: 8,
  },
  rowTitleUnread: { fontWeight: '700' },
  rowTime: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: colors.onSurfaceVariant,
    flexShrink: 0,
  },
  rowDesc: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 72,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: colors.onSurface,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
});

function mapNotification(item: NotificationItem): Notification {
  const timestamp = item.scheduledTime || new Date().toISOString();
  return {
    id: String(item.notificationId),
    type: mapNotificationType(item.type),
    title: item.title,
    description: item.content,
    timestamp,
    isRead: item.isRead,
    dateGroup: getDateGroup(timestamp),
    referenceId: item.referenceId ? String(item.referenceId) : undefined,
  };
}

function mapNotificationType(type: string): Notification['type'] {
  const normalized = type.toUpperCase();
  if (normalized.includes('MEDICINE')) return 'medicine';
  if (normalized.includes('APPOINT')) return 'appointment';
  if (normalized.includes('VACC')) return 'vaccine';
  if (normalized.includes('WARN')) return 'warning';
  return 'system';
}

function getDateGroup(timestamp: string): Notification['dateGroup'] {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays <= 7) return 'this_week';
  return 'older';
}
