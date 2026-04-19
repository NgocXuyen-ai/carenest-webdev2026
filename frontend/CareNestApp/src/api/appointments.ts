import { apiGet, apiPatch, apiPost } from './client';

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
  return apiGet<AppointmentOverview>(`/appointments/appointment/overview/${profileId}`);
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
}

export async function cancelAppointment(appointmentId: number): Promise<void> {
  await apiPatch(`/appointments/${appointmentId}/cancel`);
}
