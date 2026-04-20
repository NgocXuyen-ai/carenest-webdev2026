import { apiDelete, apiGet, apiGetCached, apiPost, apiPut, invalidateApiGetCache } from './client';

export type FamilyRole =
  | 'OWNER'
  | 'MEMBER'
  | 'FATHER'
  | 'MOTHER'
  | 'OLDER_BROTHER'
  | 'OLDER_SISTER'
  | 'YOUNGER'
  | 'OTHER';

export interface FamilyMemberSummary {
  profileId: number;
  fullName: string;
  role: FamilyRole;
  avatarUrl?: string | null;
  age?: number | null;
  healthStatus?: string | null;
}

export interface FamilyResponse {
  familyId: number;
  familyName: string;
  ownerUserId?: number;
  memberCount: number;
  members: FamilyMemberSummary[];
}

export interface FamilyJoinCodeResponse {
  joinCode: string;
  joinLink: string;
  qrCodeBase64?: string;
  expiresAt: string;
  familyId: number;
  familyName: string;
}

export interface FamilyInvitationItem {
  inviteId: number;
  familyId?: number;
  familyName?: string;
  senderEmail?: string;
  receiverEmail?: string;
  status?: string;
  createdAt?: string;
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
  emergencyContactPhone?: string | null;
  healthStatus?: string | null;
}

export async function getMyFamily(): Promise<FamilyResponse> {
  return apiGetCached<FamilyResponse>('/family/family', undefined, { ttlMs: 20000 });
}

export async function createFamily(name: string): Promise<void> {
  await apiPost('/family/create-family', { name });
  invalidateApiGetCache(['/family/family', '/family/profiles/', '/dashboard']);
}

export async function getFamilyProfile(profileId: number): Promise<ProfileDetails> {
  return apiGetCached<ProfileDetails>(`/family/profiles/${profileId}`, undefined, { ttlMs: 20000 });
}

export async function updateProfile(profileId: number, payload: Record<string, unknown>): Promise<void> {
  await apiPut(`/family/update-healthprofile/${profileId}`, payload);
  invalidateApiGetCache([`/family/profiles/${profileId}`, '/family/family', '/dashboard']);
}

export async function inviteMember(receiverEmail: string, role: FamilyRole): Promise<void> {
  await apiPost('/family/family/invitations', { receiverEmail, role });
  invalidateApiGetCache(['/family/invitations/']);
}

export async function getReceivedInvitations(): Promise<FamilyInvitationItem[]> {
  return apiGet<FamilyInvitationItem[]>('/family/invitations/received');
}

export async function getSentInvitations(): Promise<FamilyInvitationItem[]> {
  return apiGet<FamilyInvitationItem[]>('/family/invitations/sent');
}

export async function acceptInvitation(inviteId: number): Promise<void> {
  await apiPost(`/family/${inviteId}/accept`);
  invalidateApiGetCache(['/family/family', '/family/invitations/', '/family/profiles/', '/dashboard']);
}

export async function rejectInvitation(inviteId: number): Promise<void> {
  await apiPost(`/family/${inviteId}/reject`);
  invalidateApiGetCache(['/family/invitations/']);
}

export async function getFamilyJoinCode(): Promise<FamilyJoinCodeResponse> {
  return apiGet<FamilyJoinCodeResponse>('/family/join-code');
}

export async function rotateFamilyJoinCode(): Promise<FamilyJoinCodeResponse> {
  return apiPost<FamilyJoinCodeResponse>('/family/join-code/rotate');
}

export async function joinFamilyByCode(joinCode: string, role?: FamilyRole): Promise<FamilyResponse> {
  const response = await apiPost<FamilyResponse, { joinCode: string; role?: FamilyRole }>('/family/join-by-code', {
    joinCode,
    role,
  });
  invalidateApiGetCache(['/family/family', '/family/invitations/', '/dashboard']);
  return response;
}

export async function joinFamilyByQr(formData: FormData): Promise<FamilyResponse> {
  const response = await apiPost<FamilyResponse, FormData>('/family/join-by-qr', formData);
  invalidateApiGetCache(['/family/family', '/family/invitations/', '/dashboard']);
  return response;
}

export async function updateFamilyMemberRole(profileId: number, role: FamilyRole): Promise<FamilyResponse> {
  const response = await apiPut<FamilyResponse, { role: FamilyRole }>(`/family/members/${profileId}/role`, {
    role,
  });
  invalidateApiGetCache(['/family/family', '/dashboard']);
  return response;
}

export async function removeMember(profileId: number): Promise<void> {
  await apiDelete(`/family/members/${profileId}`);
  invalidateApiGetCache(['/family/family', '/family/profiles/', '/dashboard']);
}
