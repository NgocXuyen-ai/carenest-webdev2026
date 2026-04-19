import { apiDelete, apiGet, apiPost, apiPut } from './client';

export interface FamilyMemberSummary {
  profileId: number;
  fullName: string;
  role: string;
  avatarUrl?: string | null;
  age?: number | null;
  healthStatus?: string | null;
}

export interface FamilyResponse {
  familyId: number;
  familyName: string;
  memberCount: number;
  members: FamilyMemberSummary[];
}

export interface ProfileDetails {
  profileId: number;
  fullName: string;
  birthday?: string | null;
  age?: number | null;
  gender?: string | null;
  bloodType?: string | null;
  height?: number | null;
  weight?: number | null;
  medicalHistory?: string | null;
  allergy?: string | null;
  healthStatus?: string | null;
}

export async function getMyFamily(): Promise<FamilyResponse> {
  return apiGet<FamilyResponse>('/family/family');
}

export async function createFamily(name: string): Promise<void> {
  await apiPost('/family/create-family', { name });
}

export async function getFamilyProfile(profileId: number): Promise<ProfileDetails> {
  return apiGet<ProfileDetails>(`/family/profiles/${profileId}`);
}

export async function updateProfile(profileId: number, payload: Record<string, unknown>): Promise<void> {
  await apiPut(`/family/update-healthprofile/${profileId}`, payload);
}

export async function inviteMember(receiverEmail: string): Promise<void> {
  await apiPost('/family/family/invitations', { receiverEmail });
}

export async function getReceivedInvitations(): Promise<Array<Record<string, unknown>>> {
  return apiGet<Array<Record<string, unknown>>>('/family/invitations/received');
}

export async function acceptInvitation(inviteId: number): Promise<void> {
  await apiPost(`/family/${inviteId}/accept`);
}

export async function rejectInvitation(inviteId: number): Promise<void> {
  await apiPost(`/family/${inviteId}/reject`);
}

export async function removeMember(profileId: number): Promise<void> {
  await apiDelete(`/family/members/${profileId}`);
}
