import { apiClient, apiGet, apiPost } from './client';

export interface ChatReply {
  reply: string;
  conversation_id: number;
  message_id?: number;
  sql_generated?: string | null;
  data?: unknown;
}

export interface OcrReply {
  raw_text: string;
  structured_data: {
    medicines: Array<{
      name: string;
      dosage?: string | null;
      frequency?: number | null;
      duration?: string | null;
      note?: string | null;
    }>;
    doctor_name?: string | null;
    clinic_name?: string | null;
    date?: string | null;
  };
  ocr_id?: number | null;
}

export interface VoiceReply {
  transcribed_text: string;
  reply_text: string;
  audio_base64: string;
  conversation_id: number;
}

export async function chatAi(payload: { message: string; conversationId?: number | null; profileId?: number | null }): Promise<ChatReply> {
  return apiPost<ChatReply, { message: string; conversationId?: number | null; profileId?: number | null }>('/ai/chat', payload);
}

export async function listConversations(): Promise<{ conversations: Array<Record<string, unknown>>; total: number }> {
  return apiGet('/ai/conversations');
}

export async function getConversationMessages(conversationId: number): Promise<{ conversation_id: number; messages: Array<Record<string, unknown>> }> {
  return apiGet(`/ai/conversations/${conversationId}/messages`);
}

export async function submitOcr(payload: { profileId: number; imageBase64: string }): Promise<OcrReply> {
  return apiPost<OcrReply, { profileId: number; imageBase64: string }>('/ai/ocr', payload);
}

export async function confirmOcr(ocrId: number, payload: { profileId: number; structuredData: Record<string, unknown> }): Promise<{
  ocrId?: number;
  medicineIds: number[];
  scheduleIds: number[];
}> {
  return apiPost(`/ai/ocr/${ocrId}/confirm`, payload);
}

export async function voiceChat(payload: FormData): Promise<VoiceReply> {
  const response = await apiClient.post('/ai/voice/chat', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000,
  });
  return response.data.data as VoiceReply;
}
