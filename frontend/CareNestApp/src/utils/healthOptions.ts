export const BLOOD_TYPE_OPTIONS = [
  { value: 'A_POSITIVE', label: 'A+' },
  { value: 'A_NEGATIVE', label: 'A-' },
  { value: 'B_POSITIVE', label: 'B+' },
  { value: 'B_NEGATIVE', label: 'B-' },
  { value: 'AB_POSITIVE', label: 'AB+' },
  { value: 'AB_NEGATIVE', label: 'AB-' },
  { value: 'O_POSITIVE', label: 'O+' },
  { value: 'O_NEGATIVE', label: 'O-' },
] as const;

export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
] as const;

const BLOOD_TYPE_LABELS = new Map<string, string>(BLOOD_TYPE_OPTIONS.map(option => [option.value, option.label]));
const GENDER_LABELS = new Map<string, string>(GENDER_OPTIONS.map(option => [option.value, option.label]));

export function formatBloodType(value?: string | null): string {
  if (!value) {
    return 'Chưa rõ';
  }
  return BLOOD_TYPE_LABELS.get(value) || value;
}

export function formatGender(value?: string | null): string {
  if (!value) {
    return 'Chưa rõ';
  }
  return GENDER_LABELS.get(value) || value;
}
