import { apiGetCached } from './client';

export interface DashboardPayload {
  generatedAt: string;
  scopeType: 'PROFILE' | 'FAMILY';
  family?: {
    familyId: number;
    familyName: string;
    memberCount: number;
    members: Array<{
      profileId: number;
      fullName: string;
      role: string;
      avatarUrl?: string | null;
      age?: number | null;
      healthStatus?: string | null;
    }>;
  } | null;
  selectedProfileId: number | null;
  selectedProfile?: Record<string, unknown> | null;
  profiles: Array<Record<string, unknown>>;
  profileContexts: Array<Record<string, unknown>>;
  medicineCabinet: Array<Record<string, unknown>>;
  notifications: Array<Record<string, unknown>>;
  unreadNotificationCount: number;
  aiSummary: string;
}

export async function getDashboard(profileId?: number): Promise<DashboardPayload> {
  return apiGetCached<DashboardPayload>('/dashboard', profileId ? { profileId } : undefined, {
    ttlMs: 20000,
  });
}
