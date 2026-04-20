import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthSession {
  token: string;
  userId: number;
  email: string;
}

const STORAGE_KEY_SESSION = '@carenest_session';

let inMemorySession: AuthSession | null = null;

export async function getStoredSession(): Promise<AuthSession | null> {
  if (inMemorySession) {
    return inMemorySession;
  }

  const raw = await AsyncStorage.getItem(STORAGE_KEY_SESSION);
  if (!raw) {
    return null;
  }

  try {
    inMemorySession = JSON.parse(raw) as AuthSession;
    return inMemorySession;
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY_SESSION);
    return null;
  }
}

export async function setStoredSession(session: AuthSession | null): Promise<void> {
  inMemorySession = session;
  if (!session) {
    await AsyncStorage.removeItem(STORAGE_KEY_SESSION);
    return;
  }

  await AsyncStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
}
