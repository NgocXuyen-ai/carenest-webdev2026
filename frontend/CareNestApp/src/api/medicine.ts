import { apiDelete, apiGet, apiPost } from './client';

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
  return apiGet<MedicineItem[]>('/medicine/cabinet');
}

export async function createCabinetMedicine(payload: {
  name: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
}): Promise<void> {
  await apiPost('/medicine/cabinet/create-medicine', payload);
}

export async function getDailySchedule(profileId: number, date: string): Promise<DailyMedicineSchedule> {
  return apiGet<DailyMedicineSchedule>(`/medicine/medicine-schedules/${profileId}/daily`, { date });
}

export async function getMedicineSchedules(profileId: number): Promise<MedicineScheduleItem[]> {
  return apiGet<MedicineScheduleItem[]>(`/medicine/medicine-schedules/${profileId}`);
}

export async function getScheduleFormData(): Promise<MedicineScheduleFormData> {
  return apiGet<MedicineScheduleFormData>('/medicine/schedules/form-data');
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
}

export async function takeDose(payload: { doseId: number; isTaken: boolean; note?: string }): Promise<void> {
  await apiPost('/medicine/medicine-schedules/take-dose', payload);
}

export async function deleteMedicineSchedule(scheduleId: number): Promise<void> {
  await apiDelete(`/medicine/medicine-schedules/${scheduleId}`);
}
