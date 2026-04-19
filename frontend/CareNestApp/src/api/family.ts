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

export async function inviteMember(receiverEmail: string, role: string): Promise<void> {
  await apiPost('/family/family/invitations', { receiverEmail, role });
}

export async function getReceivedInvitations(): Promise<FamilyInvitationItem[]> {
  return apiGet<FamilyInvitationItem[]>('/family/invitations/received');
}

export async function getSentInvitations(): Promise<FamilyInvitationItem[]> {
  return apiGet<FamilyInvitationItem[]>('/family/invitations/sent');
}

export async function acceptInvitation(inviteId: number): Promise<void> {
  await apiPost(`/family/${inviteId}/accept`);
}

export async function rejectInvitation(inviteId: number): Promise<void> {
  await apiPost(`/family/${inviteId}/reject`);
}

export async function getFamilyJoinCode(): Promise<FamilyJoinCodeResponse> {
  return apiGet<FamilyJoinCodeResponse>('/family/join-code');
}

export async function rotateFamilyJoinCode(): Promise<FamilyJoinCodeResponse> {
  return apiPost<FamilyJoinCodeResponse>('/family/join-code/rotate');
}

export async function joinFamilyByCode(joinCode: string): Promise<FamilyResponse> {
  return apiPost<FamilyResponse, { joinCode: string }>('/family/join-by-code', { joinCode });
}

export async function joinFamilyByQr(formData: FormData): Promise<FamilyResponse> {
  return apiPost<FamilyResponse, FormData>('/family/join-by-qr', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export async function removeMember(profileId: number): Promise<void> {
  await apiDelete(`/family/members/${profileId}`);
}
