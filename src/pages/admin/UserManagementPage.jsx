import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { formatDateTime } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import {
  HiOutlineUsers,
  HiOutlineBan,
  HiOutlineCheck,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineUserCircle,
} from 'react-icons/hi';

export default function UserManagementPage() {
  const [tab, setTab] = useState('buyers');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    loadUsers();
  }, [tab]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = tab === 'buyers'
        ? await adminService.getBuyers()
        : await adminService.getSellers();
      setUsers(res.data);
    } catch {} finally {
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

  const activeUsers = users.filter(u => u.activo);
  const inactiveUsers = users.filter(u => !u.activo);

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header wave-bottom mb-8">
        <h1 className="font-display relative z-10">Gestion de Usuarios</h1>
        <p className="text-sm text-white/60 relative z-10">Administra compradores y vendedores</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center">
            <HiOutlineUsers className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p className="text-xl font-bold font-display text-primary-600">{users.length}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-seller-100 flex items-center justify-center">
            <HiOutlineCheck className="w-6 h-6 text-seller-500" />
          </div>
          <div>
            <p className="text-xl font-bold font-display text-seller-500">{activeUsers.length}</p>
            <p className="text-xs text-gray-500">Activos</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center">
            <HiOutlineBan className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-xl font-bold font-display text-red-500">{inactiveUsers.length}</p>
            <p className="text-xs text-gray-500">Inactivos</p>
          </div>
        </div>
      </div>

      {/* Tab Chips */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'buyers', label: 'Compradores' },
          { key: 'sellers', label: 'Vendedores' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`chip ${
              tab === t.key ? 'chip-active' : 'chip-inactive'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : users.length === 0 ? (
        <EmptyState icon={HiOutlineUsers} title="Sin usuarios" />
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <HiOutlineUserCircle className="w-7 h-7 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{u.nombre}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{u.correo}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-gray-400">{u.telefono || '-'}</p>
                      <span className="text-xs text-gray-300">|</span>
                      <p className="text-xs text-gray-400">{formatDateTime(u.fecha_hora_registro)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${u.activo ? 'bg-seller-50 text-seller-600' : 'bg-red-50 text-red-600'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleActive(u.id)}
                      className={`p-2 rounded-xl transition-colors ${u.activo ? 'hover:bg-warning-50 text-warning-600' : 'hover:bg-seller-50 text-seller-600'}`}
                      title={u.activo ? 'Desactivar' : 'Activar'}
                    >
                      {u.activo ? <HiOutlineBan className="w-5 h-5" /> : <HiOutlineCheck className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(u.id)}
                      className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition-colors"
                      title="Eliminar"
                    >
                      <HiOutlineTrash className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar usuario"
        message="Esta seguro de eliminar este usuario? Esta accion no se puede deshacer."
        confirmText="Eliminar"
      />
    </div>
  );
}
