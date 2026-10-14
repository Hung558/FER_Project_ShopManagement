import { createContext, useState } from "react";

export const AuthContext = createContext();

// Đọc user đã đăng nhập từ localStorage để tải lại trang không bị mất
function getSavedUser() {
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    return JSON.parse(savedUser);
  }
  return null;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(getSavedUser());

  function login(user) {
    setCurrentUser(user);
    localStorage.setItem("currentUser", JSON.stringify(user));
  }

  function logout() {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
