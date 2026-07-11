import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { formatDateTime } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ExportButton from '../../components/ui/ExportButton';
import toast from 'react-hot-toast';
import {
  HiOutlineUsers,
  HiOutlineCheck,
  HiOutlineBan,
  HiOutlineSearch,
  HiOutlineTrash,
} from 'react-icons/hi';

export default function BuyersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getBuyers();
      setUsers(res.data.compradores || []);
    } catch {
      toast.error('Error al cargar compradores');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await adminService.toggleUserActive(id);
      toast.success('Estado actualizado');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminService.deleteUser(deleteTarget);
      toast.success('Usuario eliminado');
      setDeleteTarget(null);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch = !search ||
      (u.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.correo || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'active' ? u.activo : !u.activo);
    return matchSearch && matchFilter;
  });

  const activeCount = users.filter(u => u.activo).length;
  const inactiveCount = users.filter(u => !u.activo).length;

  return (
    <div className="animate-fade-in pt-2">

      {/* Exportar */}
      <div className="mb-4">
        <ExportButton exportFn={adminService.exportBuyers} baseName="compradores" />
      </div>

      {/* Search */}
      <div className="bg-surface rounded-2xl shadow-card border border-gray-100/80 p-3 mb-4">
        <div className="relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email"
            className="input-field pl-10 text-sm"
          />
        </div>
      </div>

      {/* Stats compactos */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-surface rounded-xl shadow-sm border border-gray-100/80 p-3 text-center">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-1">
            <HiOutlineUsers className="w-4 h-4 text-primary-600" />
          </div>
          <p className="text-lg font-bold font-display text-primary-600">{users.length}</p>
          <p className="text-[10px] text-gray-500">Total</p>
        </div>
        <div className="bg-surface rounded-xl shadow-sm border border-gray-100/80 p-3 text-center">
          <div className="w-8 h-8 rounded-full bg-seller-100 flex items-center justify-center mx-auto mb-1">
            <HiOutlineCheck className="w-4 h-4 text-seller-500" />
          </div>
          <p className="text-lg font-bold font-display text-seller-500">{activeCount}</p>
          <p className="text-[10px] text-gray-500">Activos</p>
        </div>
        <div className="bg-surface rounded-xl shadow-sm border border-gray-100/80 p-3 text-center">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-1">
            <HiOutlineBan className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-lg font-bold font-display text-red-500">{inactiveCount}</p>
          <p className="text-[10px] text-gray-500">Inactivos</p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { key: 'all', label: `Todos (${users.length})` },
          { key: 'active', label: `Activos (${activeCount})` },
          { key: 'inactive', label: `Inactivos (${inactiveCount})` },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`chip whitespace-nowrap ${filter === f.key ? 'chip-active' : 'chip-inactive'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState icon={HiOutlineUsers} title="Sin compradores" description="No se encontraron compradores" />
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => (
            <div key={u.id} className="bg-surface rounded-2xl shadow-sm border border-gray-100/80 p-4">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {(u.nombre || '?').charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{u.nombre}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${u.activo ? 'bg-seller-50 text-seller-600' : 'bg-red-50 text-red-600'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{u.correo}</p>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => handleToggleActive(u.id)}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${u.activo ? 'bg-seller-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-surface rounded-full shadow transition-transform ${u.activo ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Detalles */}
              <div className="mt-2 pl-[52px] flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-400">
                <span>Tel: {u.telefono || '–'}</span>
                <span>Ciudad: {u.tbl_ciudades?.nombre || '–'}</span>
                <span>Registro: {formatDateTime(u.fecha_hora_registro)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar comprador"
        message="Esta seguro de eliminar este comprador? Esta accion no se puede deshacer."
        confirmText="Eliminar"
      />
    </div>
  );
}
