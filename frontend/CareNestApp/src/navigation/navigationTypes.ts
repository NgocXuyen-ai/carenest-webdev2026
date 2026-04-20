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
  AppointmentList: { memberId?: string } | undefined;
  AddAppointment: { editId?: string; memberId?: string } | undefined;
  VaccinationTracker: { memberId: string };
  GrowthTracker: { memberId: string };
  MedicineSchedule: { memberId?: string } | undefined;
  AddMedicineSchedule: { editId?: string; memberId?: string } | undefined;
  AddVaccinationSchedule: { profileId: number };
};

export type FamilyStackParamList = {
  FamilyManagement: undefined;
  HealthProfileDetail: { memberId: string };
  VaccinationTracker: { memberId: string };
  GrowthTracker: { memberId: string };
  UserMedical: { memberId?: string };
  MedicineSchedule: { memberId?: string } | undefined;
  AddMedicineSchedule: { editId?: string; memberId?: string } | undefined;
  AppointmentList: { memberId?: string } | undefined;
  AddAppointment: { editId?: string; memberId?: string } | undefined;
  AddVaccinationSchedule: { profileId: number };
};

export type MedicineStackParamList = {
  MedicineSchedule: { memberId?: string } | undefined;
  MedicineCabinet: undefined;
  AddMedicineSchedule: { editId?: string; memberId?: string } | undefined;
  AddMedicineToCabinet: { editId?: string };
  OcrScanner: undefined;
  AppointmentList: { memberId?: string } | undefined;
  AddAppointment: { editId?: string; memberId?: string } | undefined;
};

export type AiChatStackParamList = {
  AiChatbot: undefined;
  VoiceAssistant: undefined;
};

export type ProfileStackParamList = {
  UserProfileSettings: undefined;
  UserMedical: { memberId?: string };
};
