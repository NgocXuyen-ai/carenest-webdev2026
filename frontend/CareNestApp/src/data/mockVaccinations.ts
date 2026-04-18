import type { Vaccination } from '../types';

export const mockVaccinations: Vaccination[] = [
  // Sơ sinh
  { id: 'vac-1', profileId: 'profile-3', name: 'BCG (Lao)', doseNumber: 1, date: '2016-11-05', status: 'completed', facility: 'BV Từ Dũ', ageGroup: 'Sơ sinh' },
  { id: 'vac-2', profileId: 'profile-3', name: 'VGB (Viêm gan B sơ sinh)', doseNumber: 1, date: '2016-11-05', status: 'completed', facility: 'BV Từ Dũ', ageGroup: 'Sơ sinh' },
  // 2 tháng
  { id: 'vac-3', profileId: 'profile-3', name: 'Hexaxim (6 trong 1)', doseNumber: 1, date: '2017-01-05', status: 'completed', facility: 'Trung tâm tiêm chủng VNVC', ageGroup: '2 tháng' },
  { id: 'vac-4', profileId: 'profile-3', name: 'Phế cầu Synflorix', doseNumber: 1, date: '2017-01-05', status: 'completed', facility: 'Trung tâm tiêm chủng VNVC', ageGroup: '2 tháng' },
  { id: 'vac-5', profileId: 'profile-3', name: 'Rota virus Rotateq', doseNumber: 1, date: '2017-01-05', status: 'completed', facility: 'Trung tâm tiêm chủng VNVC', ageGroup: '2 tháng' },
  // 6 tháng
  { id: 'vac-6', profileId: 'profile-3', name: 'Cúm Vaxigrip Tetra', doseNumber: 1, plannedDate: '2017-05-05', status: 'scheduled', facility: 'Trung tâm tiêm chủng VNVC', ageGroup: '6 tháng' },
  // 9 tháng
  { id: 'vac-7', profileId: 'profile-3', name: 'Sởi đơn', doseNumber: 1, status: 'future', ageGroup: '9 tháng' },
  // 12 tháng
  { id: 'vac-8', profileId: 'profile-3', name: 'MMR (Sởi - Quai bị - Rubella)', doseNumber: 1, status: 'future', ageGroup: '12 tháng' },
  { id: 'vac-9', profileId: 'profile-3', name: 'Thủy đậu Varivax', doseNumber: 1, status: 'future', ageGroup: '12 tháng' },
  { id: 'vac-10', profileId: 'profile-3', name: 'Viêm não Nhật Bản Jevax', doseNumber: 1, status: 'future', ageGroup: '12 tháng' },
];
