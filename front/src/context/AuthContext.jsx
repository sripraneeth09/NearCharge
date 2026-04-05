import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const stored = sessionStorage.getItem('nc_user');
  const [currentUser, setCurrentUser]     = useState(stored ? JSON.parse(stored) : null);
  const [currentUserType, setCurrentUserType] = useState(
    stored ? JSON.parse(stored)?.type : null
  );

  const login = useCallback((user) => {
    setCurrentUser(user);
    setCurrentUserType(user.type);
    sessionStorage.setItem('nc_user', JSON.stringify(user));
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setCurrentUserType(null);
    sessionStorage.removeItem('nc_user');
  }, []);

  const refreshUser = useCallback((updatedUser) => {
    setCurrentUser(updatedUser);
    sessionStorage.setItem('nc_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, currentUserType, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
