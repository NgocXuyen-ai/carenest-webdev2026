import { apiGetCached, apiPost, invalidateApiGetCache } from './client';

export interface VaccinationTrackerGroup {
  stageLabel: string;
  description: string;
  vaccinations: Array<{
    vaccineLogId: number;
    profileId: number;
    fullName: string;
    vaccineName: string;
    doseNumber: number;
    dateGiven?: string | null;
    plannedDate?: string | null;
    clinicName?: string | null;
    status: string;
  }>;
}

export async function getVaccinationTracker(profileId: number): Promise<VaccinationTrackerGroup[]> {
  return apiGetCached<VaccinationTrackerGroup[]>(`/vaccinations/${profileId}`, undefined, {
    ttlMs: 20000,
  });
}

export async function createVaccination(profileId: number, payload: {
  vaccineName: string;
  doseNumber: number;
  dateGiven?: string | null;
  plannedDate?: string | null;
  clinicName?: string;
}): Promise<void> {
  await apiPost(`/vaccinations/${profileId}`, payload);
  invalidateApiGetCache(['/vaccinations/', '/dashboard', '/notifications']);
}
