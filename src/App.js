import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import HomePage from "./components/HomePage";
import Login from "./components/Login";
import Register from "./components/Register";
import ProductDetail from "./components/ProductDetail";
import Profile from "./components/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

// Customer components
import Cart from "./components/customer/Cart";
import CustomerOrders from "./components/customer/CustomerOrders";

// Seller components
import SellerOrders from "./components/seller/SellerOrders";

// Admin components
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminProducts from "./components/admin/AdminProducts";
import AdminUsers from "./components/admin/AdminUsers";

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        {/* Tuyến đường công khai */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/products/:id" element={<ProductDetail />} />

        {/* Thông tin cá nhân (dành cho người đã đăng nhập: Customer, Seller, Admin) */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["Customer", "Seller", "Admin"]}>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Tuyến đường cho Customer */}
        <Route
          path="/cart"
          element={
            <ProtectedRoute allowedRoles={["Customer"]}>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/orders"
          element={
            <ProtectedRoute allowedRoles={["Customer"]}>
              <CustomerOrders />
            </ProtectedRoute>
          }
        />

        {/* Tuyến đường cho Seller */}
        <Route
          path="/seller/orders"
          element={
            <ProtectedRoute allowedRoles={["Seller"]}>
              <SellerOrders />
            </ProtectedRoute>
          }
        />

        {/* Tuyến đường cho Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        {/* Mặc định chuyển về trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
