import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user,          setUserState]    = useState(null);
  const [token,         setToken]        = useState("");
  const [activeProfile, setActiveProfileState] = useState(null);

  useEffect(() => {
    const savedUser    = localStorage.getItem("apexplay_user");
    const savedToken   = localStorage.getItem("apexplay_token");
    const savedProfile = localStorage.getItem("apexplay_profile");
    if (savedUser && savedToken) {
      setUserState(JSON.parse(savedUser));
      setToken(savedToken);
    }
    if (savedProfile) {
      setActiveProfileState(JSON.parse(savedProfile));
    }
  }, []);

  const login = (userData, authToken) => {
    setUserState(userData);
    setToken(authToken);
    localStorage.setItem("apexplay_user",  JSON.stringify(userData));
    localStorage.setItem("apexplay_token", authToken);
    // Clear active profile on new login
    localStorage.removeItem("apexplay_profile");
    setActiveProfileState(null);
  };

  const setUser = (updated) => {
    setUserState(updated);
    localStorage.setItem("apexplay_user", JSON.stringify(updated));
  };

  const setActiveProfile = (profile) => {
    setActiveProfileState(profile);
    if (profile) {
      localStorage.setItem("apexplay_profile", JSON.stringify(profile));
    } else {
      localStorage.removeItem("apexplay_profile");
    }
  };

  const logout = () => {
    setUserState(null);
    setToken("");
    setActiveProfileState(null);
    localStorage.removeItem("apexplay_user");
    localStorage.removeItem("apexplay_token");
    localStorage.removeItem("apexplay_profile");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, setUser, activeProfile, setActiveProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}