import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  HiOutlineUserGroup,
  HiOutlineOfficeBuilding,
  HiOutlineCreditCard,
  HiOutlineCash,
  HiOutlineStar,
  HiOutlineTrash,
} from 'react-icons/hi';

const periods = [
  { value: 'week', label: 'Última semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'all', label: 'Todo el tiempo' },
];

const DAYS_OPTIONS = [7, 15, 30, 60, 90, 180];
const USER_TYPES = [
  { value: 'all', label: 'Todos', icon: HiOutlineUserGroup },
  { value: 'compradores', label: 'Compradores', icon: HiOutlineUserGroup },
  { value: 'vendedores', label: 'Vendedores', icon: HiOutlineOfficeBuilding },
];

function ProgressBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <span className="text-xs sm:text-sm font-medium text-gray-700 w-24 sm:w-28 shrink-0 leading-tight">{label}</span>
      <div className="flex-1 h-3 sm:h-3.5 bg-gray-100 rounded-full overflow-hidden min-w-0">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs sm:text-sm font-bold text-gray-900 w-8 sm:w-10 text-right shrink-0">{value}</span>
    </div>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState('month');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Usuarios inactivos
  const [inactiveDays, setInactiveDays] = useState(30);
  const [inactiveType, setInactiveType] = useState('all');
  const [inactiveData, setInactiveData] = useState({ total: 0, usuarios: [] });
  const [loadingInactive, setLoadingInactive] = useState(false);

  useEffect(() => {
    loadReport();
  }, [period]);

  useEffect(() => {
    loadInactiveUsers();
  }, [inactiveDays, inactiveType]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getReports({ period });
      setReport(data);
    } catch {
      toast.error('Error al cargar reporte');
    } finally {
      setLoading(false);
    }
  };

  const loadInactiveUsers = useCallback(async () => {
    setLoadingInactive(true);
    try {
      const { data } = await adminService.getInactiveUsers({ days: inactiveDays, type: inactiveType });
      setInactiveData(data);
    } catch {
      toast.error('Error al cargar usuarios inactivos');
    } finally {
      setLoadingInactive(false);
    }
  }, [inactiveDays, inactiveType]);

  const handleDeleteUser = async (userId) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      await adminService.deleteUser(userId);
      toast.success('Usuario eliminado');
      loadInactiveUsers();
    } catch {
      toast.error('Error al eliminar usuario');
    }
  };

  if (loading) return <LoadingSpinner />;

  const statCards = report
    ? [
        { label: 'Compradores', value: report.total_compradores, icon: HiOutlineUserGroup, gradient: 'from-blue-400 to-blue-600' },
        { label: 'Vendedores', value: report.total_vendedores, icon: HiOutlineOfficeBuilding, gradient: 'from-purple-500 to-purple-700' },
        { label: 'Premium Activos', value: report.premium_activos, icon: HiOutlineCreditCard, gradient: 'from-orange-400 to-orange-600' },
        { label: 'Ingresos Totales', value: `S/ ${report.ingresos_totales}`, icon: HiOutlineCash, gradient: 'from-green-400 to-green-600' },
      ]
    : [];

  const productsMax = report?.productos?.total || 1;
  const activityMax = Math.max(
    report?.actividad_periodo?.nuevos_usuarios || 0,
    report?.actividad_periodo?.nuevos_productos || 0,
    report?.actividad_periodo?.sesiones_activas || 0,
    1
  );
  const usersMax = Math.max(
    report?.distribucion_usuarios?.compradores || 0,
    report?.distribucion_usuarios?.vendedores || 0,
    1
  );

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <h1 className="text-2xl font-bold font-display text-primary-700 mb-5">Reportes y Análisis</h1>

      {/* Period Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 flex items-center gap-1.5 ${
              period === p.value
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-surface text-gray-600 border-gray-300 hover:border-primary-400'
            }`}
          >
            {period === p.value && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {p.label}
          </button>
        ))}
      </div>

      {/* Resumen General - 4 Colored Cards */}
      <h2 className="text-lg font-bold font-display text-primary-700 mb-3">Resumen General</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl bg-gradient-to-br ${stat.gradient} p-5 text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5`}
          >
            <div className="flex justify-center mb-3">
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold font-display text-center truncate">{stat.value}</p>
            <p className="text-xs sm:text-sm text-white/80 text-center mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Productos */}
      {report?.productos && (
        <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
          <h2 className="text-lg font-bold font-display text-primary-700 mb-4">Productos</h2>
          <div className="space-y-3">
            <ProgressBar label="Aprobados" value={report.productos.aprobados} max={productsMax} color="bg-green-500" />
            <ProgressBar label="Pendientes" value={report.productos.pendientes} max={productsMax} color="bg-orange-400" />
            <ProgressBar label="Total" value={report.productos.total} max={productsMax} color="bg-blue-500" />
          </div>
        </div>
      )}

      {/* Actividad del Periodo */}
      {report?.actividad_periodo && (
        <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
          <h2 className="text-lg font-bold font-display text-primary-700 mb-4">Actividad del Periodo</h2>
          <div className="space-y-3">
            <ProgressBar label="Nuevos usuarios" value={report.actividad_periodo.nuevos_usuarios} max={activityMax} color="bg-blue-500" />
            <ProgressBar label="Nuevos productos" value={report.actividad_periodo.nuevos_productos} max={activityMax} color="bg-red-400" />
            <ProgressBar label="Sesiones activas" value={report.actividad_periodo.sesiones_activas} max={activityMax} color="bg-green-500" />
          </div>
        </div>
      )}

      {/* Top 5 Vendedores (por rating) */}
      {report?.top_vendedores?.length > 0 && (
        <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
          <h2 className="text-lg font-bold font-display text-primary-700 mb-4">Top 5 Vendedores (por rating)</h2>
          <div className="space-y-2">
            {report.top_vendedores.map((v, i) => (
              <div key={v.id} className="flex items-center justify-between gap-3 py-2.5 px-1 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700 truncate min-w-0 flex-1">
                  <span className="font-medium">{i + 1}.</span> {v.nombre}
                </span>
                <span className="flex items-center gap-1 text-sm font-bold text-orange-400 shrink-0">
                  <HiOutlineStar className="w-4 h-4 fill-orange-400 text-orange-400" />
                  {v.rating.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Distribución de Usuarios */}
      {report?.distribucion_usuarios && (
        <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
          <h2 className="text-lg font-bold font-display text-primary-700 mb-4">Distribución de Usuarios</h2>
          <div className="space-y-3">
            <ProgressBar label="Compradores" value={report.distribucion_usuarios.compradores} max={usersMax} color="bg-blue-500" />
            <ProgressBar label="Vendedores" value={report.distribucion_usuarios.vendedores} max={usersMax} color="bg-blue-500" />
          </div>
        </div>
      )}

      {/* Usuarios Inactivos */}
      <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-display text-primary-700">Usuarios Inactivos</h2>
          <span className="text-sm text-gray-500">Total: {inactiveData.total}</span>
        </div>

        {/* Filtro de días */}
        <p className="text-sm text-gray-600 mb-2">Usuarios sin actividad en los últimos:</p>
        <div className="flex items-center gap-2 mb-3">
          <input
            type="number"
            value={inactiveDays}
            onChange={(e) => setInactiveDays(parseInt(e.target.value) || 30)}
            className="w-16 shrink-0 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            min={1}
          />
          <span className="text-sm text-gray-500">días</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {DAYS_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setInactiveDays(d)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                inactiveDays === d
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-surface text-gray-600 border-gray-300 hover:border-gray-500'
              }`}
            >
              {d} días
            </button>
          ))}
        </div>

        {/* Filtro tipo de usuario */}
        <p className="text-sm text-gray-600 mb-2">Tipo de usuario</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {USER_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setInactiveType(t.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                inactiveType === t.value
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-surface text-gray-600 border-gray-300 hover:border-gray-500'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Lista de usuarios inactivos */}
        {loadingInactive ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : inactiveData.usuarios.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No hay usuarios inactivos con estos filtros</p>
        ) : (
          <div className="space-y-2">
            {inactiveData.usuarios.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 min-w-0">
                    <span className="text-sm font-bold text-gray-900 truncate min-w-0">{u.nombre}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                        u.rol === 'Vendedor'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {u.rol}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{u.correo}</p>
                  <p className="text-xs text-orange-500 mt-0.5">
                    {u.ultimo_login
                      ? `Último login: ${new Date(u.ultimo_login).toLocaleDateString('es-PE')}`
                      : 'Nunca inició sesión'}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteUser(u.id)}
                  className="ml-3 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar usuario"
                >
                  <HiOutlineTrash className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
