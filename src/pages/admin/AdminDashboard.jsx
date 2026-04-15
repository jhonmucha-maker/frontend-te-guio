import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { useSSEListener } from '../../hooks/useSSEListener';
import { useAppResume } from '../../hooks/useAppResume';
import { ADMIN_SSE_EVENTS } from '../../hooks/useAdminPendingCounts';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  HiOutlineUsers,
  HiOutlineOfficeBuilding,
  HiOutlineClipboardList,
  HiOutlineCube,
  HiOutlineCreditCard,
  HiOutlineCurrencyDollar,
  HiOutlineExclamationCircle,
  HiOutlineChevronRight,
  HiOutlineBell,
} from 'react-icons/hi';

const capitalizeWords = (str) =>
  str.replace(/\b\w/g, (c) => c.toUpperCase());

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(() => {
    adminService.getDashboard()
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Actualizar contadores en tiempo real (mismos eventos que el sidebar)
  useSSEListener(ADMIN_SSE_EVENTS, loadDashboard);
  // Refrescar datos al volver de background (eventos perdidos mientras app cerrada)
  useAppResume(loadDashboard);

  if (loading) return <LoadingSpinner />;

  const today = capitalizeWords(
    new Date().toLocaleDateString('es-PE', {
      timeZone: 'America/Lima',
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  );

  /* 8 cards exactas como la referencia, grid 2 columnas, diseño vertical centrado */
  const cards = [
    {
      label: 'Total Compradores',
      value: data?.totalBuyers || 0,
      subtitle: `${data?.totalBuyers || 0} activos`,
      icon: HiOutlineUsers,
      borderColor: 'border-t-blue-500',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-500',
      valueColor: 'text-blue-600',
      btnBg: 'bg-blue-500',
      to: '/admin/compradores',
    },
    {
      label: 'Total Vendedores',
      value: data?.totalSellers || 0,
      subtitle: `${data?.premiumSellers || 0} Premium · ${data?.standardSellers || 0} Estándar`,
      icon: HiOutlineOfficeBuilding,
      borderColor: 'border-t-seller-500',
      iconBg: 'bg-seller-100',
      iconColor: 'text-seller-500',
      valueColor: 'text-seller-600',
      btnBg: 'bg-seller-500',
      to: '/admin/vendedores',
    },
    {
      label: 'Solicitudes de Registro',
      value: data?.pendingSellers || 0,
      subtitle: 'Nuevos vendedores',
      icon: HiOutlineClipboardList,
      borderColor: 'border-t-warning-500',
      iconBg: 'bg-warning-100',
      iconColor: 'text-warning-600',
      valueColor: 'text-warning-600',
      btnBg: 'bg-warning-500',
      to: '/admin/solicitudes-registro',
    },
    {
      label: 'Solicitudes de Tiendas',
      value: data?.pendingStores || 0,
      subtitle: 'Nuevas tiendas',
      icon: HiOutlineOfficeBuilding,
      borderColor: 'border-t-accent-400',
      iconBg: 'bg-accent-100',
      iconColor: 'text-accent-500',
      valueColor: 'text-accent-500',
      btnBg: 'bg-accent-400',
      to: '/admin/solicitudes-tiendas',
    },
    {
      label: 'Solicitudes de Productos',
      value: data?.pendingProducts || 0,
      subtitle: 'Nuevos productos',
      icon: HiOutlineCube,
      borderColor: 'border-t-green-500',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      valueColor: 'text-green-600',
      btnBg: 'bg-green-500',
      to: '/admin/solicitudes-productos',
    },
    {
      label: 'Suscripciones Pendientes',
      value: data?.pendingSubscriptions || 0,
      subtitle: 'Por aprobar',
      icon: HiOutlineCreditCard,
      borderColor: 'border-t-primary-600',
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
      valueColor: 'text-primary-600',
      btnBg: 'bg-primary-600',
      to: '/admin/suscripciones',
    },
    {
      label: 'Ingresos Totales',
      value: `S/ ${data?.totalRevenue || 0}`,
      subtitle: `S/ ${data?.monthlyRevenue || 0} este mes`,
      icon: HiOutlineCurrencyDollar,
      borderColor: 'border-t-seller-500',
      iconBg: 'bg-seller-100',
      iconColor: 'text-seller-500',
      valueColor: 'text-seller-600',
      btnBg: 'bg-seller-500',
      to: '/admin/finanzas',
    },
    {
      label: 'Quejas Pendientes',
      value: data?.openTickets || 0,
      subtitle: 'Por atender',
      icon: HiOutlineExclamationCircle,
      borderColor: 'border-t-red-500',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-500',
      valueColor: 'text-red-600',
      btnBg: 'bg-red-500',
      to: '/admin/quejas',
    },
  ];

  /* Acciones pendientes - solo las que tienen valor > 0 */
  const pendingActions = [
    { value: data?.pendingSellers || 0, label: 'Solicitud(es) de registro', to: '/admin/solicitudes-registro', color: 'bg-warning-500' },
    { value: data?.pendingStores || 0, label: 'Solicitud(es) de tiendas', to: '/admin/solicitudes-tiendas', color: 'bg-warning-500' },
    { value: data?.pendingProducts || 0, label: 'Solicitud(es) de productos', to: '/admin/solicitudes-productos', color: 'bg-warning-500' },
    { value: data?.pendingSubscriptions || 0, label: 'Suscripción(es) pendiente(s)', to: '/admin/suscripciones', color: 'bg-warning-500' },
    { value: data?.openTickets || 0, label: 'Queja(s) pendiente(s)', to: '/admin/quejas', color: 'bg-red-500' },
  ].filter(a => a.value > 0);

  return (
    <div className="animate-fade-in">
      {/* Hero edge-to-edge */}
      <div className="-mx-4 sm:-mx-6 -mt-4">
        <div className="gradient-hero px-6 pt-6 pb-14 relative">
          <div className="absolute top-[-25%] left-[-20%] w-[65%] h-[170%] rounded-full bg-white/[0.07]" />
          <div className="absolute top-[5%] right-[-25%] w-[60%] h-[150%] rounded-full bg-white/[0.05]" />
          <div className="absolute bottom-[-50%] left-[15%] w-[50%] h-[120%] rounded-full bg-white/[0.04]" />
          <div className="relative z-10">
            <p className="text-base text-white/70 font-medium">Bienvenido, Admin</p>
            <h1 className="text-3xl font-bold font-display text-white mt-1">Dashboard</h1>
            <p className="text-sm text-white/50 mt-2">{today}</p>
          </div>
        </div>
      </div>

      {/* Stats Summary Bar - superpuesta al hero */}
      <div className="relative z-10 -mt-8 mx-2 mb-6">
        <div className="bg-surface rounded-2xl shadow-elevated border border-gray-100/80 px-2 py-4">
          <div className="grid grid-cols-3 divide-x divide-gray-200">
            <div className="flex flex-col items-center justify-center px-1">
              <p className="text-2xl font-bold font-display text-primary-700">{(data?.totalBuyers || 0) + (data?.totalSellers || 0)}</p>
              <p className="text-[11px] text-gray-500 mt-1">Usuarios</p>
            </div>
            <div className="flex flex-col items-center justify-center px-1">
              <p className="text-2xl font-bold font-display text-primary-700">{data?.subscribedSellers || 0}</p>
              <p className="text-[11px] text-gray-500 mt-1">Suscritos</p>
            </div>
            <div className="flex flex-col items-center justify-center px-1">
              <p className="text-lg font-bold font-display text-primary-700 whitespace-nowrap">
                S/ {parseFloat(data?.totalRevenue || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">Ingresos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen General - título de sección */}
      <h2 className="text-lg font-bold font-display text-gray-900 mb-4">Resumen General</h2>

      {/* Cards Grid - 2 columnas, diseño vertical centrado */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {cards.map((card, i) => (
          <Link
            key={i}
            to={card.to}
            className={`relative bg-surface rounded-2xl shadow-card border border-gray-100/80 p-5 pt-4 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 block border-t-4 ${card.borderColor}`}
          >
            {/* Botón circular ">" en esquina superior derecha */}
            <div className={`absolute top-3 right-3 w-7 h-7 rounded-full ${card.btnBg} flex items-center justify-center`}>
              <HiOutlineChevronRight className="w-4 h-4 text-white" />
            </div>

            {/* Contenido centrado vertical */}
            <div className="flex flex-col items-center text-center pt-2">
              {/* Icono en círculo */}
              <div className={`w-14 h-14 rounded-full ${card.iconBg} flex items-center justify-center mb-3`}>
                <card.icon className={`w-7 h-7 ${card.iconColor}`} />
              </div>

              {/* Número grande */}
              <p className={`text-2xl font-bold font-display ${card.valueColor}`}>{card.value}</p>

              {/* Título */}
              <p className="text-sm font-bold text-gray-900 mt-1">{card.label}</p>

              {/* Subtítulo */}
              <p className="text-xs text-gray-400 mt-0.5">{card.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Acciones Pendientes */}
      {pendingActions.length > 0 && (
        <div className="bg-orange-50 rounded-2xl border border-orange-200/60 border-l-4 border-l-warning-500 p-5 mb-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center">
              <HiOutlineBell className="w-5 h-5 text-warning-600" />
            </div>
            <h3 className="text-base font-bold font-display text-warning-600">Acciones Pendientes</h3>
          </div>

          {/* Lista de acciones */}
          <div className="space-y-2">
            {pendingActions.map((action, i) => (
              <Link
                key={i}
                to={action.to}
                className="flex items-center gap-3 py-2.5 px-1 hover:bg-warning-100/50 rounded-xl transition-colors"
              >
                <span className={`w-6 h-6 rounded-full ${action.color} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>
                  {action.value}
                </span>
                <span className="text-sm text-gray-700 flex-1">{action.label}</span>
                <HiOutlineChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
