import { Routes, Route } from "react-router";
import { lazy, Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";

// Student pages
const StudentLayout = lazy(() => import("./pages/student/StudentLayout"));
const StudentHome = lazy(() => import("./pages/student/StudentHome"));
const StudentMenu = lazy(() => import("./pages/student/StudentMenu"));
const StudentCart = lazy(() => import("./pages/student/StudentCart"));
const StudentCheckout = lazy(() => import("./pages/student/StudentCheckout"));
const StudentOrders = lazy(() => import("./pages/student/StudentOrders"));
const StudentQR = lazy(() => import("./pages/student/StudentQR"));
const StudentProfile = lazy(() => import("./pages/student/StudentProfile"));
const StudentLogin = lazy(() => import("./pages/student/StudentLogin"));
const StudentRegister = lazy(() => import("./pages/student/StudentRegister"));

// Admin pages
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminMenu = lazy(() => import("./pages/admin/AdminMenu"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminQRScanner = lazy(() => import("./pages/admin/AdminQRScanner"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

// Shared
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Spinner className="h-8 w-8 text-green-600" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Admin Login (OAuth) */}
        <Route path="/login" element={<Login />} />

        {/* Student Auth */}
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/student-register" element={<StudentRegister />} />

        {/* Student App */}
        <Route element={<StudentLayout />}>
          <Route path="/" element={<StudentHome />} />
          <Route path="/menu" element={<StudentMenu />} />
          <Route path="/cart" element={<StudentCart />} />
          <Route path="/checkout" element={<StudentCheckout />} />
          <Route path="/orders" element={<StudentOrders />} />
          <Route path="/qr/:orderId" element={<StudentQR />} />
          <Route path="/profile" element={<StudentProfile />} />
        </Route>

        {/* Admin Dashboard */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="menu" element={<AdminMenu />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="qr-scanner" element={<AdminQRScanner />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
