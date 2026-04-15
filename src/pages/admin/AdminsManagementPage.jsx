import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../features/auth/useAuth';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import {
  HiOutlineUserGroup,
  HiOutlinePlus,
  HiOutlineShieldCheck,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineSearch,
} from 'react-icons/hi';

const emptyForm = { nombres: '', apellidos: '', correo: '', contrasena: '', telefono: '' };

export default function AdminsManagementPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const isPrimaryAdmin = !usuario?.id_usuario_registro || usuario.id_usuario_registro === usuario.id;

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create / Edit modal
  const [showForm, setShowForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isPrimaryAdmin) {
      navigate('/admin/dashboard', { replace: true });
      return;
    }
    loadAdmins();
  }, [isPrimaryAdmin, navigate]);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getAdmins();
      setAdmins(data);
    } catch {
      toast.error('Error al cargar administradores');
    } finally {
      setLoading(false);
    }
  };

  // --- CREATE ---
  const openCreate = () => {
    setEditingAdmin(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  // --- EDIT ---
  const openEdit = (admin) => {
    setEditingAdmin(admin);
    setForm({
      nombres: admin.nombre || '',
      apellidos: '',
      correo: admin.correo || '',
      contrasena: '',
      telefono: admin.telefono || '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingAdmin(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!editingAdmin;

    if (!isEdit) {
      if (!form.nombres || !form.correo || !form.contrasena) {
        toast.error('Nombre, correo y contrasena son obligatorios');
        return;
      }
      if (form.contrasena.length < 8) {
        toast.error('La contrasena debe tener al menos 8 caracteres');
        return;
      }
    } else {
      const nombre = form.nombres.trim();
      if (!nombre) {
        toast.error('El nombre es obligatorio');
        return;
      }
      if (form.contrasena && form.contrasena.length < 8) {
        toast.error('La contrasena debe tener al menos 8 caracteres');
        return;
      }
    }

    setSaving(true);
    try {
      if (isEdit) {
        const payload = {
          nombre: form.nombres.trim(),
          correo: form.correo.trim(),
          telefono: form.telefono.trim(),
        };
        if (form.contrasena) payload.contrasena = form.contrasena;
        await adminService.updateAdmin(editingAdmin.id, payload);
        toast.success('Administrador actualizado');
      } else {
        await adminService.createAdmin(form);
        toast.success('Administrador creado');
      }
      closeForm();
      loadAdmins();
    } catch (err) {
      toast.error(err.response?.data?.error || `Error al ${isEdit ? 'actualizar' : 'crear'}`);
    } finally {
      setSaving(false);
    }
  };

  // --- DELETE ---
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminService.deleteAdmin(deleteTarget.id);
      toast.success('Administrador eliminado');
      setDeleteTarget(null);
      loadAdmins();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    } finally {
      setDeleting(false);
    }
  };

  const canDelete = (admin) =>
    admin.id !== usuario?.id && admin.id_usuario_registro && admin.id_usuario_registro !== admin.id;

  const canEdit = (admin) => admin.id !== usuario?.id;

  // --- FILTER ---
  const filtered = admins.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (a.nombre || '').toLowerCase().includes(q) || (a.correo || '').toLowerCase().includes(q);
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in pt-2">
      {/* Search + Create */}
      <div className="bg-surface rounded-2xl shadow-card border border-gray-100/80 p-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field text-sm pl-10 w-full"
            />
          </div>
          <button onClick={openCreate} className="btn-primary text-sm flex items-center gap-2 whitespace-nowrap">
            <HiOutlinePlus className="w-4 h-4" />
            Nuevo
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-card flex items-center gap-3 mb-4 max-w-xs">
        <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center">
          <HiOutlineUserGroup className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <p className="text-xl font-bold font-display text-primary-600">{admins.length}</p>
          <p className="text-xs text-gray-500">Total administradores</p>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={HiOutlineUserGroup}
          title={search ? 'Sin resultados' : 'Sin administradores'}
          description={search ? 'Intente con otro termino de busqueda' : 'Cree el primer administrador adicional'}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((admin) => {
            const isSelf = admin.id === usuario?.id;
            const isPrimary = !admin.id_usuario_registro || admin.id_usuario_registro === admin.id;
            return (
              <div key={admin.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${isPrimary ? 'bg-amber-100' : 'bg-primary-100'}`}>
                      <HiOutlineShieldCheck className={`w-6 h-6 ${isPrimary ? 'text-amber-600' : 'text-primary-600'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900 truncate">{admin.nombre}</h3>
                        {isSelf && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200/60 flex-shrink-0">
                            Tu
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{admin.correo}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{admin.telefono || 'Sin telefono'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      isPrimary
                        ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                        : 'bg-primary-50 text-primary-700 border border-primary-200/60'
                    }`}>
                      <HiOutlineShieldCheck className="w-3 h-3" />
                      {isPrimary ? 'Principal' : 'Admin'}
                    </span>
                    {canEdit(admin) && (
                      <button
                        onClick={() => openEdit(admin)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Editar"
                      >
                        <HiOutlinePencil className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                    {canDelete(admin) && (
                      <button
                        onClick={() => setDeleteTarget(admin)}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <HiOutlineTrash className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={showForm}
        onClose={closeForm}
        title={editingAdmin ? 'Editar Administrador' : 'Nuevo Administrador'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {editingAdmin ? 'Nombre completo' : 'Nombres'} <span className="text-coral-500">*</span>
            </label>
            <input
              type="text"
              value={form.nombres}
              onChange={(e) => setForm({ ...form, nombres: e.target.value })}
              className="input-field text-sm"
              required
            />
          </div>
          {!editingAdmin && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Apellidos</label>
              <input
                type="text"
                value={form.apellidos}
                onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
                className="input-field text-sm"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correo <span className="text-coral-500">*</span></label>
            <input
              type="email"
              value={form.correo}
              onChange={(e) => setForm({ ...form, correo: e.target.value })}
              className="input-field text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Contrasena {!editingAdmin && <span className="text-coral-500">*</span>}
            </label>
            <input
              type="password"
              value={form.contrasena}
              onChange={(e) => setForm({ ...form, contrasena: e.target.value })}
              className="input-field text-sm"
              required={!editingAdmin}
              minLength={8}
              placeholder={editingAdmin ? 'Dejar vacio para no cambiar' : ''}
            />
            <p className="text-xs text-gray-400 mt-1">Min 8 caracteres</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Telefono</label>
            <input
              type="text"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              className="input-field text-sm"
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full text-sm">
            {saving ? 'Guardando...' : editingAdmin ? 'Guardar cambios' : 'Crear administrador'}
          </button>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar administrador"
        message={`Esta seguro de eliminar a "${deleteTarget?.nombre}"? El administrador ya no podra acceder al sistema. Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        loading={deleting}
      />
    </div>
  );
}
