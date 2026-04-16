import type { Notification } from '../types';

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'medicine',
    title: 'Nhắc uống thuốc',
    description: 'Đã đến giờ uống Metformin 500mg của Lan Anh',
    timestamp: '2025-04-15T08:00:00',
    isRead: false,
    dateGroup: 'today',
  },
  {
    id: 'notif-2',
    type: 'appointment',
    title: 'Lịch khám định kỳ',
    description: 'Tái khám tim mạch của Lan Anh vào ngày mai lúc 14:00',
    timestamp: '2025-04-15T07:30:00',
    isRead: true,
    dateGroup: 'today',
  },
  {
    id: 'notif-3',
    type: 'vaccine',
    title: 'Lịch tiêm chủng',
    description: 'Bé Gia Bảo cần tiêm mũi Cúm Vaxigrip tuần này',
    timestamp: '2025-04-14T09:00:00',
    isRead: false,
    dateGroup: 'yesterday',
  },
  {
    id: 'notif-4',
    type: 'warning',
    title: 'Thuốc sắp hết hạn',
    description: 'Augmentin 625mg (Bà An) còn 2 ngày đến hạn dùng',
    timestamp: '2025-04-14T08:00:00',
    isRead: false,
    dateGroup: 'yesterday',
  },
  {
    id: 'notif-5',
    type: 'ai_insight',
    title: 'Phân tích sức khỏe AI',
    description: 'Bà An có xu hướng huyết áp cao vào buổi chiều, nên đo kiểm tra',
    timestamp: '2025-04-11T10:00:00',
    isRead: true,
    dateGroup: 'this_week',
  },
];
