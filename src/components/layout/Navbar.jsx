import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';
import { ROLES, ROLE_ROUTES } from '../../utils/constants';
import {
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineLogout,
  HiOutlineUser,
  HiOutlineSun,
  HiOutlineMoon,
} from 'react-icons/hi';
import NotificationBell from '../ui/NotificationBell';
import { useTheme } from '../../hooks/useTheme';
import logoImg from '../../assets/logo-Photoroom.png';

const BUYER_PAGE_TITLES = {
  '/comprador/dashboard': 'Inicio',
  '/comprador/productos': 'Busqueda de Productos',
  '/comprador/favoritos': 'Favoritos',
  '/comprador/lista-compras': 'Lista de Compras',
  '/comprador/historial': 'Historial',
  '/comprador/calificaciones': 'Mis Calificaciones',
  '/comprador/perfil': 'Mi Perfil',
  '/comprador/configuracion': 'Configuracion',
  '/comprador/preguntas-frecuentes': 'Preguntas Frecuentes',
  '/comprador/quejas': 'Quejas y Sugerencias',
  '/comprador/terminos': 'Terminos y Condiciones',
  '/comprador/cambiar-ubicacion': 'Cambiar Ubicacion',
};

const SELLER_PAGE_TITLES = {
  '/vendedor/dashboard': 'Inicio',
  '/vendedor/tiendas': 'Mis Tiendas',
  '/vendedor/tiendas/nueva': 'Mis Tiendas',
  '/vendedor/productos': 'Mis Productos',
  '/vendedor/productos/nuevo': 'Mis Productos',
  '/vendedor/suscripciones': 'Mi Suscripcion',
  '/vendedor/perfil': 'Mi Perfil',
  '/vendedor/quejas': 'Quejas y Sugerencias',
  '/vendedor/preguntas-frecuentes': 'Preguntas Frecuentes',
};

const ADMIN_PAGE_TITLES = {
  '/admin/dashboard': 'Dashboard',
  '/admin/compradores': 'Compradores',
  '/admin/vendedores': 'Vendedores',
  '/admin/solicitudes-productos': 'Solicitudes de Productos',
  '/admin/solicitudes-tiendas': 'Solicitudes de Tiendas',
  '/admin/gestion-productos': 'Gestion de Productos',
  '/admin/gestion-tiendas': 'Gestion de Tiendas',
  '/admin/suscripciones': 'Suscripciones',
  '/admin/finanzas': 'Finanzas',
  '/admin/reportes': 'Reportes y Analisis',
  '/admin/exportaciones': 'Exportaciones',
  '/admin/quejas': 'Quejas y Sugerencias',
  '/admin/administradores': 'Administradores',
  '/admin/configuracion': 'Configuracion',
};

function getPageTitle(pathname, rol) {
  if (rol === ROLES.COMPRADOR) {
    if (BUYER_PAGE_TITLES[pathname]) return BUYER_PAGE_TITLES[pathname];
    if (pathname.startsWith('/comprador/productos/')) return 'Detalle de Producto';
    if (pathname.startsWith('/comprador/tiendas/')) return 'Detalle de Tienda';
    return 'Te Guio';
  }
  if (rol === ROLES.VENDEDOR) {
    if (SELLER_PAGE_TITLES[pathname]) return SELLER_PAGE_TITLES[pathname];
    if (pathname.startsWith('/vendedor/tiendas/')) return 'Mis Tiendas';
    if (pathname.startsWith('/vendedor/productos/')) return 'Mis Productos';
    return 'Te Guio';
  }
  if (rol === ROLES.ADMINISTRADOR) {
    if (ADMIN_PAGE_TITLES[pathname]) return ADMIN_PAGE_TITLES[pathname];
    return 'Dashboard';
  }
  return 'Te Guio';
}

export default function Navbar({ onToggleSidebar }) {
  const { usuario, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const dashboardRoute = usuario ? ROLE_ROUTES[usuario.rol] || '/' : '/';
  const isBuyer = usuario?.rol === ROLES.COMPRADOR;
  const isSeller = usuario?.rol === ROLES.VENDEDOR;
  const isAdmin = usuario?.rol === ROLES.ADMINISTRADOR;
  const useSimpleLayout = isBuyer || isAdmin || isSeller;

  const pageTitle = isAuthenticated && usuario ? getPageTitle(location.pathname, usuario.rol) : 'Te Guio';

  return (
    <nav className="gradient-primary shadow-navbar sticky top-0 z-50" style={{ paddingTop: 'var(--sat, 0px)' }}>
      <div className="max-w-full mx-auto px-3 sm:px-6">
        <div className="flex justify-between items-center h-10 sm:h-12 lg:h-14">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {isAuthenticated && (
              <button
                onClick={onToggleSidebar}
                className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 transition-colors lg:hidden"
              >
                <HiOutlineMenu className="w-5 h-5 text-white" />
              </button>
            )}
            <Link to={dashboardRoute} className="flex items-center gap-1.5 min-w-0">
              <img src={logoImg} alt="Te Guio" className="w-6 h-6 sm:w-7 sm:h-7 object-contain drop-shadow-sm shrink-0" />
              <span className="text-[13px] sm:text-sm font-display font-bold text-white tracking-tight truncate">
                {pageTitle}
              </span>
            </Link>
          </div>

          {isAuthenticated && usuario ? (
            <div className="flex items-center gap-1 sm:gap-2">
              {useSimpleLayout ? (
                <>
                  <button
                    onClick={toggleTheme}
                    className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    title={isDark ? 'Modo claro' : 'Modo oscuro'}
                  >
                    {isDark ? <HiOutlineSun className="w-5 h-5 text-white" /> : <HiOutlineMoon className="w-5 h-5 text-white" />}
                  </button>
                  <NotificationBell />
                  <button
                    onClick={handleLogout}
                    className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    title="Cerrar sesion"
                  >
                    <HiOutlineLogout className="w-5 h-5 text-white" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={toggleTheme}
                    className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    title={isDark ? 'Modo claro' : 'Modo oscuro'}
                  >
                    {isDark ? <HiOutlineSun className="w-5 h-5 text-white" /> : <HiOutlineMoon className="w-5 h-5 text-white" />}
                  </button>
                  <NotificationBell />
                  <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
                      <HiOutlineUser className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-semibold text-white leading-tight">
                        {usuario.nombre}
                      </p>
                    </div>
                  </button>

                  {menuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-52 bg-surface rounded-2xl shadow-elevated border border-gray-100 z-50 overflow-hidden animate-slide-up">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                          <p className="text-sm font-bold text-gray-800">
                            {usuario.nombre}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{usuario.correo}</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full px-4 py-3.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <HiOutlineLogout className="w-4.5 h-4.5" />
                          Cerrar sesion
                        </button>
                      </div>
                    </>
                  )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-semibold text-white/80 hover:text-white transition-colors"
              >
                Iniciar sesion
              </Link>
              <Link to="/register" className="bg-white/15 hover:bg-white/25 text-white font-semibold text-sm py-2 px-4 rounded-xl transition-all border border-white/20 backdrop-blur-sm">
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
