import { createContext, useContext, useEffect, useState } from 'react';
import { watchAuth, signIn, signOut } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = checking, null = signed out
  useEffect(() => watchAuth(setUser), []);
  return <AuthContext.Provider value={{ user, signIn, signOut, loading: user === undefined }}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => useContext(AuthContext);
