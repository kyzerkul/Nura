import { useContext } from 'react';
import { AuthContext, type AuthContextType } from '@/providers/AuthProvider';

export function useSession(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSession must be used within AuthProvider');
  }
  return context;
}
