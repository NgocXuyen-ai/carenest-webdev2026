export interface User {
  id: string;
  userId?: number;
  profileId?: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  createdAt: string;
  phoneNumber?: string;
  token?: string;
}

export interface FamilyMember {
  id: string;
  profileId: string;
  fullName: string;
  role: string; // 'Bố' | 'Mẹ' | 'Con' | 'Ông' | 'Bà' | 'Khác'
  avatarUrl?: string;
  birthday?: string;
  gender?: 'Nam' | 'Nữ' | 'Khác';
  bloodType?: string;
  allergies?: string[];
  medicalHistory?: MedicalCondition[];
  height?: number;
  weight?: number;
  emergencyContact?: EmergencyContact;
  healthStatus: 'good' | 'warning' | 'critical';
  isCurrentUser?: boolean;
}

export interface MedicalCondition {
  name: string;
  description: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface CabinetMedicine {
  id: string;
  cabinetId: string;
  name: string;
  iconName: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  purchaseDate?: string;
  status: 'expired' | 'expiring' | 'stable' | 'out_of_stock';
  notes?: string;
  lastUsed?: string;
}

export interface ScheduledMedicine {
  id: string;
  profileId: string;
  medicineId?: string;
  name: string;
  dosage: string;
  instruction: string;
  times: string[];
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  taken: boolean;
  isOverdue?: boolean;
  startDate: string;
  endDate?: string;
  frequency: number;
  note?: string;
}

export interface Appointment {
  id: string;
  profileId: string;
  facility: string;
  doctor?: string;
  dateTime: string;
  address?: string;
  status: 'upcoming' | 'past' | 'cancelled';
  notes?: string;
  reminderBefore?: number;
}

export interface Vaccination {
  id: string;
  profileId: string;
  name: string;
  doseNumber: number;
  date?: string;
  plannedDate?: string;
  status: 'completed' | 'upcoming' | 'scheduled' | 'future';
  facility?: string;
  ageGroup: string;
}

export interface GrowthEntry {
  id: string;
  profileId: string;
  date: string;
  weight?: number;
  height?: number;
  note?: string;
}

export interface Notification {
  id: string;
  type: 'medicine' | 'appointment' | 'vaccine' | 'warning' | 'ai_insight' | 'system';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  dateGroup: 'today' | 'yesterday' | 'this_week' | 'older';
  referenceId?: string;
}

export interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;
  timestamp: string;
  embeddedMedicines?: EmbeddedMedicine[];
}

export interface EmbeddedMedicine {
  name: string;
  dosage: string;
  instruction: string;
}

export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  imageSource: any;
}
