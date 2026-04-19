import { apiGetCached, apiPost, invalidateApiGetCache } from './client';

export interface GrowthSummary {
  childName: string;
  ageString: string;
  statusLabel: string;
  canDrawChart: boolean;
  chartMessage?: string | null;
  weightChart: Array<{ label: string; value: number }>;
  heightChart: Array<{ label: string; value: number }>;
  history: Array<{
    date: string;
    weight?: number | null;
    height?: number | null;
    note?: string | null;
  }>;
}

export async function getGrowthSummary(profileId: number): Promise<GrowthSummary> {
  return apiGetCached<GrowthSummary>(`/growth/${profileId}`, undefined, { ttlMs: 20000 });
}

export async function createGrowthLog(payload: {
  profileId: number;
  weight?: number;
  height?: number;
  recordDate: string;
  note?: string;
}): Promise<void> {
  await apiPost('/growth/log', payload);
  invalidateApiGetCache(['/growth/', '/dashboard']);
}
