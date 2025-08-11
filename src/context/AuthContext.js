import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [userRole, setUserRole] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [token, setToken] = useState(null);

  // Optional: load token and user info from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");
    const savedEmail = localStorage.getItem("email");
    if (savedToken) {
      setToken(savedToken);
      setUserRole(savedRole);
      setUserEmail(savedEmail);
    }
  }, []);

  // setUser should accept token, role, and email
  const setUser = (newRole, newEmail, newToken) => {
    setUserRole(newRole);
    setUserEmail(newEmail);
    setToken(newToken);

    // Save to localStorage to persist on reload
    localStorage.setItem("token", newToken);
    localStorage.setItem("role", newRole);
    localStorage.setItem("email", newEmail);
  };

  const logout = () => {
    setUserRole(null);
    setUserEmail(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
  };

  return (
    <AuthContext.Provider value={{ userRole, userEmail, token, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
