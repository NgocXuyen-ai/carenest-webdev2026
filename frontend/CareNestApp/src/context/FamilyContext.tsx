import React, { createContext, useState, useContext, ReactNode } from 'react';

interface FamilyState {
  hasFamily: boolean;
  familyName: string;
  familyImage: string | null;
}

interface FamilyContextType extends FamilyState {
  createFamily: (name: string, image: string | null) => void;
  resetFamily: () => void;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FamilyState>({
    hasFamily: false, // Mặc định chưa có gia đình
    familyName: 'Tổ ấm thân thương',
    familyImage: null,
  });

  const createFamily = (name: string, image: string | null) => {
    setState({
      hasFamily: true,
      familyName: name || 'Tổ ấm thân thương',
      familyImage: image,
    });
  };

  const resetFamily = () => {
    setState({
      hasFamily: false,
      familyName: 'Tổ ấm thân thương',
      familyImage: null,
    });
  };

  return (
    <FamilyContext.Provider value={{ ...state, createFamily, resetFamily }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
}
