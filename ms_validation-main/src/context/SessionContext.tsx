import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface SessionContextType {
  sessionId: string | null;
  annotatorName: string | null;
  startSession: (id: string, name: string) => void;
  endSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string | null>(() => {
    return localStorage.getItem('sessionId');
  });
  const [annotatorName, setAnnotatorName] = useState<string | null>(() => {
    return localStorage.getItem('annotatorName');
  });

  const startSession = (id: string, name: string) => {
    setSessionId(id);
    setAnnotatorName(name);
    localStorage.setItem('sessionId', id);
    localStorage.setItem('annotatorName', name);
  };

  const endSession = () => {
    setSessionId(null);
    setAnnotatorName(null);
    localStorage.removeItem('sessionId');
    localStorage.removeItem('annotatorName');
  };

  return (
    <SessionContext.Provider value={{ sessionId, annotatorName, startSession, endSession }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
