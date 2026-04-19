import { apiGet, apiPatch } from './client';

export interface NotificationItem {
  notificationId: number;
  type: string;
  title: string;
  content: string;
  scheduledTime: string;
  isRead: boolean;
  referenceId?: number | null;
}

export async function getNotifications(profileId?: number, isRead?: boolean): Promise<NotificationItem[]> {
  return apiGet<NotificationItem[]>('/notifications', {
    ...(typeof profileId === 'number' ? { profileId } : {}),
    ...(typeof isRead === 'boolean' ? { isRead } : {}),
  });
}

export async function markNotificationRead(notificationId: number): Promise<void> {
  await apiPatch(`/notifications/${notificationId}/read`);
}
