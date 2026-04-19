export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  FamilyTab: undefined;
  MedicineTab: undefined;
  AiChatTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  HomeDashboard: undefined;
  NotificationsCenter: undefined;
  AppointmentList: undefined;
  AddAppointment: { editId?: string };
  VaccinationTracker: { memberId: string };
  GrowthTracker: { memberId: string };
  MedicineSchedule: undefined;
  AddMedicineSchedule: { editId?: string };
  AddVaccinationSchedule: { profileId: number };
};

export type FamilyStackParamList = {
  FamilyManagement: undefined;
  HealthProfileDetail: { memberId: string };
  VaccinationTracker: { memberId: string };
  GrowthTracker: { memberId: string };
  UserMedical: { memberId?: string };
  AddVaccinationSchedule: { profileId: number };
};

export type MedicineStackParamList = {
  MedicineSchedule: undefined;
  MedicineCabinet: undefined;
  AddMedicineSchedule: { editId?: string };
  AddMedicineToCabinet: { editId?: string };
  OcrScanner: undefined;
  AppointmentList: undefined;
  AddAppointment: { editId?: string };
};

export type AiChatStackParamList = {
  AiChatbot: undefined;
  VoiceAssistant: undefined;
};

export type ProfileStackParamList = {
  UserProfileSettings: undefined;
  UserMedical: { memberId?: string };
};
