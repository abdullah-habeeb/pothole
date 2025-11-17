import { createContext, useContext, useState, ReactNode } from 'react';

interface GovernmentContextType {
  isAuthorized: boolean;
  authorize: () => void;
  revoke: () => void;
}

const GovernmentContext = createContext<GovernmentContextType | undefined>(undefined);

export const GovernmentProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthorized, setIsAuthorized] = useState(() => {
    // Check localStorage for persistent authorization
    return localStorage.getItem('govt_authorized') === 'true';
  });

  const authorize = () => {
    setIsAuthorized(true);
    localStorage.setItem('govt_authorized', 'true');
  };

  const revoke = () => {
    setIsAuthorized(false);
    localStorage.removeItem('govt_authorized');
  };

  return (
    <GovernmentContext.Provider value={{ isAuthorized, authorize, revoke }}>
      {children}
    </GovernmentContext.Provider>
  );
};

export const useGovernment = () => {
  const context = useContext(GovernmentContext);
  if (context === undefined) {
    throw new Error('useGovernment must be used within a GovernmentProvider');
  }
  return context;
};

