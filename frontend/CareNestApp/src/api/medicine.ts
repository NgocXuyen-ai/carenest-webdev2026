import { apiDelete, apiGetCached, apiPost, invalidateApiGetCache } from './client';

export interface MedicineItem {
  medicineId: number;
  name: string;
  quantity: number;
  unit: string;
  expiryDate?: string | null;
  status: string;
}

export interface DailyMedicineSchedule {
  profileName: string;
  date: string;
  sections: Array<{
    session: string;
    label?: string | null;
    items: Array<{
      doseId: number;
      medicineName: string;
      dosage: string;
      note?: string | null;
      isTaken: boolean;
    }>;
  }>;
}

export interface MedicineScheduleItem {
  scheduleId: number;
  profileName: string;
  medicineName: string;
  dosage: string;
  frequency: number;
  sessions?: string[];
  note?: string | null;
  startDate: string;
  endDate: string;
}

export interface MedicineScheduleFormData {
  profiles: Array<{ profileId: number; fullName: string }>;
  medicines: Array<{ medicineId: number; name: string; quantity: number; unit: string }>;
}

export async function getCabinetMedicines(): Promise<MedicineItem[]> {
  return apiGetCached<MedicineItem[]>('/medicine/cabinet', undefined, { ttlMs: 20000 });
}

export async function createCabinetMedicine(payload: {
  name: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
}): Promise<void> {
  await apiPost('/medicine/cabinet/create-medicine', payload);
  invalidateApiGetCache(['/medicine/cabinet', '/medicine/schedules/form-data', '/dashboard']);
}

export async function getDailySchedule(profileId: number, date: string): Promise<DailyMedicineSchedule> {
  return apiGetCached<DailyMedicineSchedule>(
    `/medicine/medicine-schedules/${profileId}/daily`,
    { date },
    { ttlMs: 15000 },
  );
}

export async function getMedicineSchedules(profileId: number): Promise<MedicineScheduleItem[]> {
  return apiGetCached<MedicineScheduleItem[]>(`/medicine/medicine-schedules/${profileId}`, undefined, {
    ttlMs: 20000,
  });
}

export async function getScheduleFormData(): Promise<MedicineScheduleFormData> {
  return apiGetCached<MedicineScheduleFormData>('/medicine/schedules/form-data', undefined, {
    ttlMs: 30000,
  });
}

export async function createMedicineSchedule(payload: {
  profile: number;
  medicineId: number;
  medicineName: string;
  dosage: string;
  frequency: number;
  note?: string;
  startDate: string;
  endDate: string;
}): Promise<void> {
  await apiPost('/medicine/schedules', payload);
  invalidateApiGetCache([
    '/medicine/medicine-schedules/',
    '/medicine/schedules/form-data',
    '/dashboard',
    '/notifications',
  ]);
}

export async function takeDose(payload: { doseId: number; isTaken: boolean; note?: string }): Promise<void> {
  await apiPost('/medicine/medicine-schedules/take-dose', payload);
  invalidateApiGetCache(['/medicine/medicine-schedules/', '/dashboard', '/notifications']);
}

export async function deleteMedicineSchedule(scheduleId: number): Promise<void> {
  await apiDelete(`/medicine/medicine-schedules/${scheduleId}`);
  invalidateApiGetCache(['/medicine/medicine-schedules/', '/dashboard', '/notifications']);
}
