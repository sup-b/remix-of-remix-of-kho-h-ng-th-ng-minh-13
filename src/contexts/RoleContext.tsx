import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from '@/types';
import { getCurrentRole, setCurrentRole } from '@/lib/storage';

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isAdmin: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(getCurrentRole());

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    setCurrentRole(newRole);
  };

  const isAdmin = role === 'admin';

  return (
    <RoleContext.Provider value={{ role, setRole, isAdmin }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
