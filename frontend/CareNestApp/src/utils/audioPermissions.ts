import { PermissionsAndroid, Platform } from 'react-native';

export async function ensureMicrophonePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  const permission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
  const alreadyGranted = await PermissionsAndroid.check(permission);
  if (alreadyGranted) {
    return true;
  }

  const status = await PermissionsAndroid.request(permission, {
    title: 'Quyền micro',
    message: 'CareNest cần quyền micro để ghi âm câu hỏi cho trợ lý giọng nói.',
    buttonPositive: 'Cho phép',
    buttonNegative: 'Từ chối',
  });

  return status === PermissionsAndroid.RESULTS.GRANTED;
}
