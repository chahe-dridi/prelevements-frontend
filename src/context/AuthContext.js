import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [userRole, setUserRole] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  const setUser = (role, email) => {
    setUserRole(role);
    setUserEmail(email);
  };

  const logout = () => {
    setUserRole(null);
    setUserEmail(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ userRole, userEmail, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
