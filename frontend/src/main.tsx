import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { AppLoader } from './components/AppLoader';
import { GlobalLoadingIndicator } from './components/GlobalLoadingIndicator';
import { ProtectedRoute } from './components/ProtectedRoute';
import './index.css';

const AppLayout = lazy(() => import('./layouts/AppLayout').then((module) => ({ default: module.AppLayout })));
const BillingPage = lazy(() => import('./pages/BillingPage').then((module) => ({ default: module.BillingPage })));
const CustomersPage = lazy(() => import('./pages/CustomersPage').then((module) => ({ default: module.CustomersPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then((module) => ({ default: module.ForgotPasswordPage })));
const KitchenPage = lazy(() => import('./pages/KitchenPage').then((module) => ({ default: module.KitchenPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const MenuPage = lazy(() => import('./pages/MenuPage').then((module) => ({ default: module.MenuPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));
const OrderDetailsPage = lazy(() => import('./pages/OrderDetailsPage').then((module) => ({ default: module.OrderDetailsPage })));
const OrderPage = lazy(() => import('./pages/OrderPage').then((module) => ({ default: module.OrderPage })));
const ParcelPage = lazy(() => import('./pages/ParcelPage').then((module) => ({ default: module.ParcelPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const PublicInvoicePage = lazy(() => import('./pages/PublicInvoicePage').then((module) => ({ default: module.PublicInvoicePage })));
const QrMenuPage = lazy(() => import('./pages/QrMenuPage').then((module) => ({ default: module.QrMenuPage })));
const RegisterOwnerPage = lazy(() => import('./pages/RegisterOwnerPage').then((module) => ({ default: module.RegisterOwnerPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((module) => ({ default: module.ReportsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const StaffPage = lazy(() => import('./pages/StaffPage').then((module) => ({ default: module.StaffPage })));
const SubscriptionExpiredPage = lazy(() => import('./pages/SubscriptionExpiredPage').then((module) => ({ default: module.SubscriptionExpiredPage })));
const SuperAdminPage = lazy(() => import('./pages/SuperAdminPage').then((module) => ({ default: module.SuperAdminPage })));
const SupportPage = lazy(() => import('./pages/SupportPage').then((module) => ({ default: module.SupportPage })));
const TablesPage = lazy(() => import('./pages/TablesPage').then((module) => ({ default: module.TablesPage })));

if (localStorage.getItem('poss_theme') === 'dark') {
  document.documentElement.classList.add('dark');
}

function HomeRedirect() {
  const { user } = useAuth();
  if (user?.role === 'superadmin') return <Navigate to="/superadmin" replace />;
  if (user?.role === 'owner') return <DashboardPage />;
  if (user?.role === 'chef') return <Navigate to="/kitchen" replace />;
  return <Navigate to="/tables" replace />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<AppLoader fullScreen />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/register-owner" element={<RegisterOwnerPage />} />
              <Route path="/subscription-expired" element={<SubscriptionExpiredPage />} />
              <Route path="/i/:code" element={<PublicInvoicePage />} />
              <Route path="/superadmin" element={<ProtectedRoute roles={['superadmin']}><SuperAdminPage /></ProtectedRoute>} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<HomeRedirect />} />
                <Route path="/tables" element={<ProtectedRoute roles={['owner', 'manager', 'waiter']}><TablesPage /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute roles={['owner', 'manager', 'waiter']}><OrderPage /></ProtectedRoute>} />
                <Route path="/orders/:tableId" element={<ProtectedRoute roles={['owner', 'manager', 'waiter']}><OrderPage /></ProtectedRoute>} />
                <Route path="/order-details/:orderId" element={<ProtectedRoute roles={['owner', 'manager', 'waiter']}><OrderDetailsPage /></ProtectedRoute>} />
                <Route path="/parcel" element={<ProtectedRoute roles={['owner', 'manager', 'waiter']}><ParcelPage /></ProtectedRoute>} />
                <Route path="/billing/:orderId" element={<ProtectedRoute roles={['owner', 'manager']}><BillingPage /></ProtectedRoute>} />
                <Route path="/kitchen" element={<KitchenPage />} />
                <Route path="/menu" element={<ProtectedRoute roles={['owner']}><MenuPage /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute roles={['owner']}><ReportsPage /></ProtectedRoute>} />
                <Route path="/customers" element={<ProtectedRoute roles={['owner', 'manager']}><CustomersPage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute roles={['owner']}><SettingsPage /></ProtectedRoute>} />
                <Route path="/staff" element={<ProtectedRoute roles={['owner']}><StaffPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/qr-menu" element={<ProtectedRoute roles={['owner', 'manager']}><QrMenuPage /></ProtectedRoute>} />
                <Route path="/support" element={<ProtectedRoute roles={['owner', 'manager', 'waiter', 'chef']}><SupportPage /></ProtectedRoute>} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <GlobalLoadingIndicator />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3200,
            style: {
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.72)",
              background: "rgba(255,255,255,0.94)",
              color: "#101828",
              boxShadow: "0 18px 60px rgba(16, 24, 40, 0.16)",
              backdropFilter: "blur(16px)",
              fontSize: "14px",
              fontWeight: 700,
              padding: "12px 14px"
            },
            success: {
              iconTheme: {
                primary: "rgb(20 130 122)",
                secondary: "#ffffff"
              }
            },
            error: {
              iconTheme: {
                primary: "#dc2626",
                secondary: "#ffffff"
              },
              style: {
                border: "1px solid rgba(254, 202, 202, 0.9)"
              }
            }
          }}
        />
      </AuthProvider>
    </LanguageProvider>
  </React.StrictMode>
);
