import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

// Component bảo vệ route theo quyền đăng nhập và vai trò (role)
export default function ProtectedRoute({ allowedRoles, children }) {
  const { currentUser } = useContext(AuthContext);

  // Chưa đăng nhập thì chuyển hướng sang trang đăng nhập
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Đăng nhập nhưng role không hợp lệ thì chuyển về trang chủ
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

