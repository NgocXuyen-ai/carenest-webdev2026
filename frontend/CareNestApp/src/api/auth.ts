import { apiGet, apiPatch, apiPost } from './client';
import type { AuthSession } from './storage';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
}

export interface CurrentUserProfile {
  userId: number;
  profileId: number;
  email: string;
  phoneNumber?: string | null;
  fullName: string;
  birthday?: string | null;
  gender?: string | null;
  bloodType?: string | null;
  medicalHistory?: string | null;
  allergy?: string | null;
  height?: number | null;
  weight?: number | null;
  emergencyContactPhone?: string | null;
  avatarUrl?: string | null;
}

export interface UpdateCurrentUserProfilePayload {
  fullName: string;
  email: string;
  phoneNumber: string;
  birthday: string;
  gender: string;
  bloodType: string;
  medicalHistory?: string;
  allergy?: string;
  height: number;
  weight: number;
  emergencyContactPhone?: string;
}

interface LoginResponse {
  userId: number;
  email: string;
  token: string;
}

export async function login(payload: LoginPayload): Promise<AuthSession> {
  const data = await apiPost<LoginResponse, LoginPayload>('/auth/login', payload);
  return {
    token: data.token,
    userId: data.userId,
    email: data.email,
  };
}

export async function register(payload: RegisterPayload): Promise<void> {
  await apiPost('/auth/register', {
    ...payload,
    confirmPassword: payload.password,
  });
}

export async function forgotPassword(email: string): Promise<void> {
  await apiPost('/auth/forgot-password', { email });
}

export async function getCurrentUserProfile(): Promise<CurrentUserProfile> {
  return apiGet<CurrentUserProfile>('/users/me/profile');
}

export async function updateCurrentUserProfile(payload: UpdateCurrentUserProfilePayload): Promise<CurrentUserProfile> {
  return apiPatch<CurrentUserProfile, UpdateCurrentUserProfilePayload>('/users/me/profile', payload);
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  await apiPatch<void, { oldPassword: string; newPassword: string; confirmPassword: string }>('/users/change-password', {
    oldPassword,
    newPassword,
    confirmPassword: newPassword,
  });
}

export async function getUsers(): Promise<Array<{ userId: number; email: string }>> {
  return apiGet<Array<{ userId: number; email: string }>>('/auth/users');
}
