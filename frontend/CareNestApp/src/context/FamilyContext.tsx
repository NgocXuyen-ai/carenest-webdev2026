import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { createFamily as createFamilyRequest, getMyFamily, type FamilyMemberSummary, type FamilyResponse } from '../api/family';
import { useAuth } from './AuthContext';

interface FamilyContextType {
  hasFamily: boolean;
  family: FamilyResponse | null;
  familyName: string;
  familyImage: string | null;
  members: FamilyMemberSummary[];
  selectedProfileId: number | null;
  setSelectedProfileId: (profileId: number | null) => void;
  createFamily: (name: string, image: string | null) => Promise<void>;
  resetFamily: () => void;
  refreshFamily: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function FamilyProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, user } = useAuth();
  const [family, setFamily] = useState<FamilyResponse | null>(null);
  const [familyImage, setFamilyImage] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [hasInitializedSelection, setHasInitializedSelection] = useState(false);

  useEffect(() => {
    if (!hasInitializedSelection && family?.members?.length) {
      const preferredProfileId = user?.profileId ? Number(user.profileId) : family.members[0].profileId;
      setSelectedProfileId(preferredProfileId);
      setHasInitializedSelection(true);
    }
  }, [family, hasInitializedSelection, user?.profileId]);

  const refreshFamily = useCallback(async () => {
    if (!isLoggedIn) {
      return;
    }

    try {
      const nextFamily = await getMyFamily();
      setFamily(nextFamily);
    } catch {
      setFamily(null);
      setSelectedProfileId(user?.profileId ? Number(user.profileId) : null);
    }
  }, [isLoggedIn, user?.profileId]);

  useEffect(() => {
    if (isLoggedIn) {
      void refreshFamily();
    } else {
      resetFamily();
    }
  }, [isLoggedIn, refreshFamily]);

  async function createFamily(name: string, image: string | null) {
    await createFamilyRequest(name);
    setFamilyImage(image);
    await refreshFamily();
  }

  function resetFamily() {
    setFamily(null);
    setFamilyImage(null);
    setSelectedProfileId(null);
    setHasInitializedSelection(false);
  }

  return (
    <FamilyContext.Provider
      value={{
        hasFamily: Boolean(family),
        family,
        familyName: family?.familyName || 'Tổ ấm thân thương',
        familyImage,
        members: family?.members || [],
        selectedProfileId,
        setSelectedProfileId,
        createFamily,
        resetFamily,
        refreshFamily,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
}
