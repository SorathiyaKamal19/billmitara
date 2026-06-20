import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { BillingPage } from './pages/BillingPage';
import { CustomersPage } from './pages/CustomersPage';
import { DashboardPage } from './pages/DashboardPage';
import { KitchenPage } from './pages/KitchenPage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { MenuPage } from './pages/MenuPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OrderPage } from './pages/OrderPage';
import { OrderDetailsPage } from './pages/OrderDetailsPage';
import { ParcelPage } from './pages/ParcelPage';
import { QrMenuPage } from './pages/QrMenuPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterOwnerPage } from './pages/RegisterOwnerPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { StaffPage } from './pages/StaffPage';
import { TablesPage } from './pages/TablesPage';
import './index.css';

if (localStorage.getItem('poss_theme') === 'dark') {
  document.documentElement.classList.add('dark');
}

function HomeRedirect() {
  const { user } = useAuth();
  if (user?.role === 'owner') return <DashboardPage />;
  if (user?.role === 'chef') return <Navigate to="/kitchen" replace />;
  return <Navigate to="/tables" replace />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/register-owner" element={<RegisterOwnerPage />} />
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
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
    </LanguageProvider>
  </React.StrictMode>
);
