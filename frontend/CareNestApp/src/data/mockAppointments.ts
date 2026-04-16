import type { Appointment } from '../types';

export const mockAppointments: Appointment[] = [
  {
    id: 'appt-1',
    profileId: 'profile-3',
    facility: 'Phòng khám Nhi Đồng 1',
    doctor: 'BS. Nguyễn Văn An',
    dateTime: '2025-04-24T08:30:00',
    address: '341 Sư Vạn Hạnh, Quận 10, TP.HCM',
    status: 'upcoming',
    notes: 'Tái khám viêm mũi dị ứng',
  },
  {
    id: 'appt-2',
    profileId: 'profile-4',
    facility: 'Bệnh viện Mắt TP.HCM',
    doctor: 'BS. Trần Thị Mai',
    dateTime: '2025-04-30T14:00:00',
    address: '280 Điện Biên Phủ, Bình Thạnh, TP.HCM',
    status: 'upcoming',
    notes: 'Kiểm tra thị lực định kỳ',
  },
  {
    id: 'appt-3',
    profileId: 'profile-1',
    facility: 'Phòng khám Tim mạch FV',
    doctor: 'BS. Lê Minh Khoa',
    dateTime: '2025-03-10T09:00:00',
    address: '6 Nguyễn Lương Bằng, Quận 7, TP.HCM',
    status: 'past',
    notes: 'Tái khám huyết áp',
  },
  {
    id: 'appt-4',
    profileId: 'profile-2',
    facility: 'Nha Khoa Smile',
    doctor: 'BS. Phạm Hải Yến',
    dateTime: '2025-03-25T15:00:00',
    address: '123 Trần Hưng Đạo, Quận 1, TP.HCM',
    status: 'past',
    notes: 'Lấy cao răng định kỳ',
  },
];
