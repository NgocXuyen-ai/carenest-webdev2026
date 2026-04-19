import { apiGetCached, apiPatch, apiPost, invalidateApiGetCache } from './client';

export interface AppointmentOverview {
  upcomingCount: number;
  upcomingAppointments: Array<{
    appointmentId: number;
    title: string;
    doctorName: string;
    appointmentDate: string;
    location?: string | null;
    status: string;
    dayOfWeek?: string;
    dayOfMonth?: number;
  }>;
  appointmentHistory: Array<{
    appointmentId: number;
    title: string;
    appointmentDate: string;
    displayDate: string;
    status: string;
  }>;
}

export async function getAppointmentOverview(profileId: number): Promise<AppointmentOverview> {
  return apiGetCached<AppointmentOverview>(`/appointments/appointment/overview/${profileId}`, undefined, {
    ttlMs: 20000,
  });
}

export async function createAppointment(payload: {
  profileId: number;
  clinicName: string;
  doctorName: string;
  appointmentDate: string;
  location?: string;
  note?: string;
}): Promise<void> {
  await apiPost('/appointments/create-appointment', payload);
  invalidateApiGetCache(['/appointments/appointment/overview/', '/dashboard', '/notifications']);
}

export async function cancelAppointment(appointmentId: number): Promise<void> {
  await apiPatch(`/appointments/${appointmentId}/cancel`);
  invalidateApiGetCache(['/appointments/appointment/overview/', '/dashboard', '/notifications']);
}
