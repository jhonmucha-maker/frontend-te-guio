import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';
import { ROLES } from '../../utils/constants';
import { HiOutlineX } from 'react-icons/hi';
import {
  HiOutlineHome,
  HiOutlineSearch,
  HiOutlineHeart,
  HiOutlineClipboardList,
  HiOutlineOfficeBuilding,
  HiOutlineCube,
  HiOutlineCreditCard,
  HiOutlineUsers,
  HiOutlineCurrencyDollar,
  HiOutlineCog,
  HiOutlineDocumentReport,
  HiOutlineDownload,
  HiOutlineUser,
  HiOutlineClock,
  HiOutlineQuestionMarkCircle,
  HiOutlineExclamationCircle,
  HiOutlineDocumentText,
  HiOutlineLocationMarker,
  HiOutlineBell,
  HiOutlineShieldCheck,
} from 'react-icons/hi';
import logoImg from '../../assets/logo-Photoroom.png';
import { useAdminPendingCounts } from '../../hooks/useAdminPendingCounts';
import { useShoppingCount } from '../../hooks/useShoppingCount';
import { useTicketUnreadCount } from '../../hooks/useTicketUnreadCount';
import { useAppVersion } from '../../hooks/useAppVersion';

const buyerLinks = [
  { section: 'TE GUÍO', items: [
    { to: '/comprador/dashboard', label: 'Inicio', icon: HiOutlineHome },
    { to: '/comprador/productos', label: 'Busqueda de Productos', icon: HiOutlineSearch },
    { to: '/comprador/favoritos', label: 'Favoritos', icon: HiOutlineHeart },
    { to: '/comprador/lista-compras', label: 'Lista de Compras', icon: HiOutlineClipboardList, badgeKey: 'shoppingCount' },
    { to: '/comprador/historial', label: 'Historial', icon: HiOutlineClock },
  ]},
  { section: 'AYUDA', items: [
    { to: '/comprador/preguntas-frecuentes', label: 'Preguntas Frecuentes', icon: HiOutlineQuestionMarkCircle },
    { to: '/comprador/quejas', label: 'Quejas y Sugerencias', icon: HiOutlineExclamationCircle, badgeKey: 'unreadTickets' },
  ]},
  { section: 'INFORMACIÓN', items: [
    { to: '/comprador/terminos', label: 'Terminos y Condiciones', icon: HiOutlineDocumentText },
  ]},
  { section: 'CUENTA', items: [
    { to: '/comprador/configuracion', label: 'Configuracion', icon: HiOutlineCog },
    { to: '/comprador/cambiar-ubicacion', label: 'Cambiar Ubicacion', icon: HiOutlineLocationMarker },
  ]},
];

const sellerLinks = [
  { section: 'MI NEGOCIO', items: [
    { to: '/vendedor/dashboard', label: 'Inicio', icon: HiOutlineHome },
    { to: '/vendedor/tiendas', label: 'Mis Tiendas', icon: HiOutlineOfficeBuilding },
    { to: '/vendedor/productos', label: 'Mis Productos', icon: HiOutlineCube },
    { to: '/vendedor/suscripciones', label: 'Mi Suscripcion', icon: HiOutlineCreditCard },
  ]},
  { section: 'MI CUENTA', items: [
    { to: '/vendedor/perfil', label: 'Mi Perfil', icon: HiOutlineUser },
  ]},
  { section: 'AYUDA', items: [
    { to: '/vendedor/quejas', label: 'Quejas y Sugerencias', icon: HiOutlineExclamationCircle, badgeKey: 'unreadTickets' },
    { to: '/vendedor/preguntas-frecuentes', label: 'Preguntas Frecuentes', icon: HiOutlineQuestionMarkCircle },
  ]},
];

const getAdminLinks = (usuario) => {
  const isPrimaryAdmin = !usuario?.id_usuario_registro || usuario.id_usuario_registro === usuario.id;
  const sistemaItems = [
    { to: '/admin/quejas', label: 'Quejas y Sugerencias', icon: HiOutlineExclamationCircle, badgeKey: 'openTickets' },
    ...(isPrimaryAdmin ? [{ to: '/admin/administradores', label: 'Administradores', icon: HiOutlineShieldCheck }] : []),
    { to: '/admin/notificaciones-push', label: 'Notificaciones Push', icon: HiOutlineBell },
    { to: '/admin/configuracion', label: 'Configuración', icon: HiOutlineCog },
  ];
  return [
    { section: 'PANEL', items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: HiOutlineHome },
    ]},
    { section: 'GESTIÓN DE USUARIOS', items: [
      { to: '/admin/compradores', label: 'Compradores', icon: HiOutlineUsers },
      { to: '/admin/vendedores', label: 'Vendedores', icon: HiOutlineOfficeBuilding },
    ]},
    { section: 'SOLICITUDES', items: [
      { to: '/admin/solicitudes-productos', label: 'Solicitudes de Productos', icon: HiOutlineCube, badgeKey: 'pendingProducts' },
      { to: '/admin/solicitudes-tiendas', label: 'Solicitudes de Tiendas', icon: HiOutlineOfficeBuilding, badgeKey: 'pendingStores' },
    ]},
    { section: 'GESTIÓN DE CONTENIDO', items: [
      { to: '/admin/gestion-productos', label: 'Gestión de Productos', icon: HiOutlineCube },
      { to: '/admin/gestion-tiendas', label: 'Gestión de Tiendas', icon: HiOutlineOfficeBuilding },
    ]},
    { section: 'NEGOCIO', items: [
      { to: '/admin/suscripciones', label: 'Suscripciones', icon: HiOutlineCreditCard, badgeKey: 'pendingSubscriptions' },
      { to: '/admin/finanzas', label: 'Finanzas', icon: HiOutlineCurrencyDollar },
      { to: '/admin/reportes', label: 'Reportes y Análisis', icon: HiOutlineDocumentReport },
      { to: '/admin/exportaciones', label: 'Exportaciones', icon: HiOutlineDownload },
    ]},
    { section: 'SISTEMA', items: sistemaItems },
  ];
};

export default function Sidebar({ open, onClose }) {
  const { usuario } = useAuth();
  const adminCounts = useAdminPendingCounts();
  const shoppingCount = useShoppingCount();
  const unreadTickets = useTicketUnreadCount();
  const appVersion = useAppVersion();
  const badgeCounts = { ...adminCounts, shoppingCount, unreadTickets };

  const adminLinks = useMemo(() => getAdminLinks(usuario), [usuario]);

  let sections = [];
  if (usuario?.rol === ROLES.COMPRADOR) sections = buyerLinks;
  else if (usuario?.rol === ROLES.VENDEDOR) sections = sellerLinks;
  else if (usuario?.rol === ROLES.ADMINISTRADOR) sections = adminLinks;

  const getLinkClass = ({ isActive }, hasBadge) => {
    if (hasBadge) {
      return `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-warning-100 text-warning-800 shadow-sm'
          : 'bg-warning-50 text-warning-700 hover:bg-warning-100'
      }`;
    }
    return `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-primary-100 text-primary-700 shadow-sm'
        : 'text-gray-600 hover:bg-primary-50 hover:text-primary-700'
    }`;
  };

  const getIconClass = (isActive, hasBadge) =>
    `w-5 h-5 flex-shrink-0 transition-colors ${isActive ? (hasBadge ? 'text-warning-700' : 'text-primary-700') : hasBadge ? 'text-warning-600' : ''}`;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 z-40 w-64 bg-surface border-r border-gray-100 transform transition-transform duration-300 ease-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          top: 'var(--nav-h)',
          height: 'calc(100vh - var(--nav-h) - var(--android-nav-h, 0px))',
        }}
      >
        {/* Sidebar Header - Mobile */}
        <div className="lg:hidden gradient-primary p-4 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            <HiOutlineX className="w-5 h-5 text-white" />
          </button>
          <img src={logoImg} alt="Te Guio" className="w-10 h-10 object-contain mx-auto mb-1" />
          <h3 className="text-white font-display font-bold text-sm">Te Guío</h3>
          <p className="text-white/70 text-[10px] font-medium tracking-wider">Panel Administrativo</p>
        </div>

        {/* Sidebar Header - Desktop */}
        <div className="hidden lg:block px-4 pt-5 pb-3">
          <div className="gradient-primary rounded-2xl p-4 text-center">
            <img src={logoImg} alt="Te Guio" className="w-10 h-10 object-contain mx-auto mb-2" />
            <h3 className="text-white font-display font-bold text-sm">Te Guio</h3>
            {usuario?.rol === ROLES.VENDEDOR ? (
              <>
                <p className="text-white/60 text-[10px] font-medium tracking-wider">Panel de Vendedor</p>
                <div className="mt-2 inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full">
                  <HiOutlineUser className="w-3 h-3 text-white/80" />
                  <span className="text-white text-[11px] font-semibold">{usuario?.nombre || 'Usuario'}</span>
                </div>
              </>
            ) : (
              <p className="text-white/60 text-[10px] font-medium tracking-wider">MARKETPLACE</p>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-2 overflow-y-auto h-[calc(100%-8rem)] lg:h-[calc(100%-10rem)] pb-20">
          {sections.map((section, idx) => (
            <div key={section.section} className={idx > 0 ? 'mt-5' : ''}>
              <p className="section-title px-3 mb-2">{section.section}</p>
              <div className="space-y-1">
                {section.items.map((link) => {
                  const hasBadge = link.badgeKey && badgeCounts[link.badgeKey] > 0;
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={(props) => getLinkClass(props, hasBadge)}
                      onClick={onClose}
                    >
                      {({ isActive }) => (
                        <>
                          <link.icon className={getIconClass(isActive, hasBadge)} />
                          <span className="flex-1">{link.label}</span>
                          {hasBadge && (
                            <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold rounded-full bg-warning-500 text-white">
                              {badgeCounts[link.badgeKey] > 99 ? '99+' : badgeCounts[link.badgeKey]}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100 bg-surface">
          <p className="text-[10px] text-gray-400 text-center font-medium">{appVersion ? `Versión ${appVersion}` : ''}</p>
        </div>
      </aside>
    </>
  );
}
