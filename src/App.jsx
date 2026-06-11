import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useAuth } from './features/auth/useAuth';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { PublicRoute } from './features/auth/PublicRoute';
import { ROLES, ROLE_ROUTES } from './utils/constants';
import AppLayout from './components/layout/AppLayout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Buyer pages
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import ProductSearchPage from './pages/buyer/ProductSearchPage';
import ProductDetailPage from './pages/buyer/ProductDetailPage';
import StoreSearchPage from './pages/buyer/StoreSearchPage';
import StoreDetailPage from './pages/buyer/StoreDetailPage';
import StoreProductsPage from './pages/buyer/StoreProductsPage';
import StoreRatingsPage from './pages/buyer/StoreRatingsPage';
import FavoritesPage from './pages/buyer/FavoritesPage';
import ShoppingListPage from './pages/buyer/ShoppingListPage';
import ShoppingHistoryPage from './pages/buyer/ShoppingHistoryPage';
import MyRatingsPage from './pages/buyer/MyRatingsPage';
import BuyerProfilePage from './pages/buyer/BuyerProfilePage';
import FAQPage from './pages/buyer/FAQPage';
import TermsPage from './pages/buyer/TermsPage';
import ComplaintsPage from './pages/buyer/ComplaintsPage';
import LocationChangePage from './pages/buyer/LocationChangePage';

// Seller pages
import SellerDashboard from './pages/seller/SellerDashboard';
import MyStoresPage from './pages/seller/MyStoresPage';
import CreateStorePage from './pages/seller/CreateStorePage';
import EditStorePage from './pages/seller/EditStorePage';
import MyProductsPage from './pages/seller/MyProductsPage';
import CreateProductPage from './pages/seller/CreateProductPage';
import EditProductPage from './pages/seller/EditProductPage';
import SubscriptionsPage from './pages/seller/SubscriptionsPage';
import SellerProfilePage from './pages/seller/SellerProfilePage';
import SellerComplaintsPage from './pages/seller/SellerComplaintsPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ApprovalsPage from './pages/admin/ApprovalsPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import BuyersPage from './pages/admin/BuyersPage';
import SellersPage from './pages/admin/SellersPage';
import StoreRequestsPage from './pages/admin/StoreRequestsPage';
import ProductRequestsPage from './pages/admin/ProductRequestsPage';
import StoreManagementPage from './pages/admin/StoreManagementPage';
import ProductManagementPage from './pages/admin/ProductManagementPage';
import AdminSubscriptionsPage from './pages/admin/AdminSubscriptionsPage';
import ComplaintsManagementPage from './pages/admin/ComplaintsManagementPage';
import FinancePage from './pages/admin/FinancePage';
import ConfigPage from './pages/admin/ConfigPage';
import ReportsPage from './pages/admin/ReportsPage';
import AdminsManagementPage from './pages/admin/AdminsManagementPage';
import PushNotificationsPage from './pages/admin/PushNotificationsPage';


// Pages where Android back button should minimize the app instead of navigating back
const EXIT_PATHS = [
  '/comprador/dashboard', '/vendedor/dashboard', '/admin/dashboard',
  '/comprador', '/vendedor', '/admin',
  '/login', '/register', '/',
];

function App() {
  const { usuario, isAuthenticated } = useAuth();
  const location = useLocation();
  const pathRef = useRef(location.pathname);

  useEffect(() => { pathRef.current = location.pathname; }, [location.pathname]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let removed = false;
    let handle;
    import('@capacitor/app').then(({ App: CapApp }) => {
      if (removed) return;
      handle = CapApp.addListener('backButton', () => {
        if (EXIT_PATHS.includes(pathRef.current)) {
          CapApp.minimizeApp();
        } else {
          window.history.back();
        }
      });
    });
    return () => { removed = true; handle?.then?.((h) => h.remove()); };
  }, []);

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Buyer routes */}
      <Route
        path="/comprador"
        element={
          <ProtectedRoute roles={[ROLES.COMPRADOR]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<BuyerDashboard />} />
        <Route path="productos" element={<ProductSearchPage />} />
        <Route path="productos/:id" element={<ProductDetailPage />} />
        <Route path="tiendas" element={<StoreSearchPage />} />
        <Route path="tiendas/:id" element={<StoreDetailPage />} />
        <Route path="tiendas/:id/productos" element={<StoreProductsPage />} />
        <Route path="tiendas/:id/calificaciones" element={<StoreRatingsPage />} />
        <Route path="favoritos" element={<FavoritesPage />} />
        <Route path="lista-compras" element={<ShoppingListPage />} />
        <Route path="historial" element={<ShoppingHistoryPage />} />
        <Route path="historial-compras" element={<Navigate to="/comprador/historial" replace />} />
        <Route path="calificaciones" element={<MyRatingsPage />} />
        <Route path="perfil" element={<BuyerProfilePage />} />
        <Route path="configuracion" element={<BuyerProfilePage />} />
        <Route path="preguntas-frecuentes" element={<FAQPage />} />
        <Route path="terminos" element={<TermsPage />} />
        <Route path="quejas" element={<ComplaintsPage />} />
        <Route path="cambiar-ubicacion" element={<LocationChangePage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Seller routes */}
      <Route
        path="/vendedor"
        element={
          <ProtectedRoute roles={[ROLES.VENDEDOR]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<SellerDashboard />} />
        <Route path="tiendas" element={<MyStoresPage />} />
        <Route path="tiendas/nueva" element={<CreateStorePage />} />
        <Route path="tiendas/:id" element={<EditStorePage />} />
        <Route path="productos" element={<MyProductsPage />} />
        <Route path="productos/nuevo" element={<CreateProductPage />} />
        <Route path="productos/:id" element={<EditProductPage />} />
        <Route path="suscripciones" element={<SubscriptionsPage />} />
        <Route path="perfil" element={<SellerProfilePage />} />
        <Route path="quejas" element={<SellerComplaintsPage />} />
        <Route path="preguntas-frecuentes" element={<FAQPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={[ROLES.ADMINISTRADOR]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        {/* Legacy routes - keep for backwards compat */}
        <Route path="aprobaciones" element={<ApprovalsPage />} />
        <Route path="usuarios" element={<UserManagementPage />} />
        {/* New dedicated admin pages */}
        <Route path="compradores" element={<BuyersPage />} />
        <Route path="vendedores" element={<SellersPage />} />
        <Route path="solicitudes-productos" element={<ProductRequestsPage />} />
        <Route path="solicitudes-tiendas" element={<StoreRequestsPage />} />
        <Route path="gestion-productos" element={<ProductManagementPage />} />
        <Route path="gestion-tiendas" element={<StoreManagementPage />} />
        <Route path="suscripciones" element={<AdminSubscriptionsPage />} />
        <Route path="finanzas" element={<FinancePage />} />
        <Route path="reportes" element={<ReportsPage />} />
        <Route path="quejas" element={<ComplaintsManagementPage />} />
        <Route path="administradores" element={<AdminsManagementPage />} />
        <Route path="notificaciones-push" element={<PushNotificationsPage />} />
        <Route path="configuracion" element={<ConfigPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Root redirect */}
      <Route
        path="/"
        element={
          isAuthenticated && usuario ? (
            <Navigate to={ROLE_ROUTES[usuario.rol] || '/login'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* 404 */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center gradient-primary-radial pb-safe-bottom relative overflow-hidden">
            <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full" />
            <div className="absolute bottom-32 right-16 w-48 h-48 bg-white/5 rounded-full" />
            <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-white/5 rounded-full" />
            <div className="text-center relative z-10 animate-fade-in">
              <h1 className="text-8xl font-display font-bold text-white/20 mb-2">404</h1>
              <p className="text-white/70 mb-6 text-lg">Pagina no encontrada</p>
              <a href="/" className="inline-block bg-white/15 hover:bg-white/25 text-white font-semibold py-3 px-8 rounded-xl transition-all border border-white/20 backdrop-blur-sm">
                Volver al inicio
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
