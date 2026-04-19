import { Platform } from 'react-native';

const API_HOST = Platform.select({
  android: 'https://webdev.eiyuumiru.it.eu.org',
  default: 'https://webdev.eiyuumiru.it.eu.org',
});

export const API_BASE_URL = `${API_HOST}/api/v1`;
