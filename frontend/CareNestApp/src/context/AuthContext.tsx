import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types';
import {
  getCurrentUserProfile,
  login as loginRequest,
  type CurrentUserProfile,
} from '../api/auth';
import { getStoredSession, setStoredSession } from '../api/storage';

interface AuthContextValue {
  isLoggedIn: boolean;
  user: User | null;
  isOnboardingDone: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY_ONBOARDING = '@carenest_onboarding_done';

function mapProfileToUser(profile: CurrentUserProfile, token?: string): User {
  return {
    id: String(profile.userId),
    userId: profile.userId,
    profileId: String(profile.profileId),
    email: profile.email,
    fullName: profile.fullName,
    avatarUrl: profile.avatarUrl || undefined,
    createdAt: new Date().toISOString(),
    phoneNumber: profile.phoneNumber || undefined,
    token,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isOnboardingDone, setIsOnboardingDone] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const [session, onboardingValue] = await Promise.all([
        getStoredSession(),
        AsyncStorage.getItem(STORAGE_KEY_ONBOARDING),
      ]);

      if (session) {
        const profile = await getCurrentUserProfile();
        setUser(mapProfileToUser(profile, session.token));
        setIsLoggedIn(true);
      }

      if (onboardingValue) {
        setIsOnboardingDone(true);
      }
    } catch {
      await setStoredSession(null);
      setUser(null);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshUser() {
    const session = await getStoredSession();
    if (!session) {
      setUser(null);
      setIsLoggedIn(false);
      return;
    }

    const profile = await getCurrentUserProfile();
    setUser(mapProfileToUser(profile, session.token));
    setIsLoggedIn(true);
  }

  async function login(email: string, password: string) {
    const session = await loginRequest({ email, password });
    await setStoredSession(session);
    const profile = await getCurrentUserProfile();
    setUser(mapProfileToUser(profile, session.token));
    setIsLoggedIn(true);
  }

  async function logout() {
    await setStoredSession(null);
    setUser(null);
    setIsLoggedIn(false);
  }

  async function completeOnboarding() {
    await AsyncStorage.setItem(STORAGE_KEY_ONBOARDING, 'true');
    setIsOnboardingDone(true);
  }

  if (isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, isOnboardingDone, login, logout, completeOnboarding, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
