import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from './config';
import { getStoredSession } from './storage';

export interface ApiEnvelope<T> {
  status: string;
  message: string;
  data: T;
  errorCode?: string | null;
  timestamp?: string;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

apiClient.interceptors.request.use(async config => {
  const session = await getStoredSession();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

function extractApiError(error: unknown): string {
  const axiosError = error as AxiosError<ApiEnvelope<unknown>>;
  return axiosError.response?.data?.message || axiosError.message || 'Đã có lỗi xảy ra';
}

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  try {
    const response = await apiClient.get<ApiEnvelope<T>>(url, { params });
    return response.data.data;
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}

export async function apiPost<T, B = unknown>(url: string, body?: B, config?: Record<string, unknown>): Promise<T> {
  try {
    const response = await apiClient.post<ApiEnvelope<T>>(url, body, config);
    return response.data.data;
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}

export async function apiPatch<T, B = unknown>(url: string, body?: B): Promise<T> {
  try {
    const response = await apiClient.patch<ApiEnvelope<T>>(url, body);
    return response.data.data;
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}

export async function apiPut<T, B = unknown>(url: string, body?: B): Promise<T> {
  try {
    const response = await apiClient.put<ApiEnvelope<T>>(url, body);
    return response.data.data;
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}

export async function apiDelete<T>(url: string): Promise<T> {
  try {
    const response = await apiClient.delete<ApiEnvelope<T>>(url);
    return response.data.data;
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}
