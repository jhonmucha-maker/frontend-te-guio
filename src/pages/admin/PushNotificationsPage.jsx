import { useState, useEffect, useMemo, useRef } from 'react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import {
  HiOutlineBell,
  HiOutlinePencil,
  HiOutlineRefresh,
} from 'react-icons/hi';

const EVENT_LABELS = {
  'favorites.updated': 'Favoritos actualizados',
  'shopping_list.updated': 'Lista de compras actualizada',
  'ticket.message.created': 'Nuevo mensaje en ticket',
  'ticket.status.updated': 'Estado de ticket actualizado',
  'ticket.created': 'Ticket creado',
  'approval.store.approved': 'Tienda aprobada',
  'approval.store.rejected': 'Tienda rechazada',
  'approval.store.updated': 'Tienda habilitada/deshabilitada',
  'approval.product.approved': 'Producto aprobado',
  'approval.product.rejected': 'Producto rechazado',
  'approval.product.updated': 'Producto habilitado/deshabilitado',
  'subscription.request.updated': 'Solicitud de suscripcion',
  'subscription.active.updated': 'Suscripcion activa actualizada',
  'subscription.expiring': 'Suscripcion por vencer',
  'product.price.changed': 'Cambio de precio de producto',
  'admin.pending.store': 'Solicitud de nueva tienda',
  'admin.pending.product': 'Solicitud de nuevo producto',
  'admin.pending.subscription': 'Solicitud de suscripcion',
  'rating.product.new': 'Nueva calificacion de producto',
  'rating.store.new': 'Nueva calificacion de tienda',
};

const TARGET_INFO = {
  'favorites.updated':             { label: 'Comprador afectado',       color: 'bg-green-50 text-green-700 border-green-200/60' },
  'shopping_list.updated':         { label: 'Comprador afectado',       color: 'bg-green-50 text-green-700 border-green-200/60' },
  'ticket.message.created':        { label: 'Participantes del ticket', color: 'bg-amber-50 text-amber-700 border-amber-200/60' },
  'ticket.status.updated':         { label: 'Participantes del ticket', color: 'bg-amber-50 text-amber-700 border-amber-200/60' },
  'ticket.created':                { label: 'Usuarios asignados',       color: 'bg-amber-50 text-amber-700 border-amber-200/60' },
  'approval.store.approved':       { label: 'Vendedor de la tienda',    color: 'bg-blue-50 text-blue-700 border-blue-200/60' },
  'approval.store.rejected':       { label: 'Vendedor de la tienda',    color: 'bg-blue-50 text-blue-700 border-blue-200/60' },
  'approval.store.updated':        { label: 'Vendedor de la tienda',    color: 'bg-blue-50 text-blue-700 border-blue-200/60' },
  'approval.product.approved':     { label: 'Vendedor del producto',    color: 'bg-blue-50 text-blue-700 border-blue-200/60' },
  'approval.product.rejected':     { label: 'Vendedor del producto',    color: 'bg-blue-50 text-blue-700 border-blue-200/60' },
  'approval.product.updated':      { label: 'Vendedor del producto',    color: 'bg-blue-50 text-blue-700 border-blue-200/60' },
  'subscription.request.updated':  { label: 'Vendedor + Admins',        color: 'bg-indigo-50 text-indigo-700 border-indigo-200/60' },
  'subscription.active.updated':   { label: 'Vendedor afectado',        color: 'bg-blue-50 text-blue-700 border-blue-200/60' },
  'subscription.expiring':         { label: 'Vendedor afectado',        color: 'bg-blue-50 text-blue-700 border-blue-200/60' },
  'product.price.changed':         { label: 'Compradores interesados',  color: 'bg-green-50 text-green-700 border-green-200/60' },
  'admin.pending.store':           { label: 'Todos los administradores', color: 'bg-purple-50 text-purple-700 border-purple-200/60' },
  'admin.pending.product':         { label: 'Todos los administradores', color: 'bg-purple-50 text-purple-700 border-purple-200/60' },
  'admin.pending.subscription':    { label: 'Todos los administradores', color: 'bg-purple-50 text-purple-700 border-purple-200/60' },
  'rating.product.new':            { label: 'Vendedor del producto',    color: 'bg-blue-50 text-blue-700 border-blue-200/60' },
  'rating.store.new':              { label: 'Vendedor de la tienda',    color: 'bg-blue-50 text-blue-700 border-blue-200/60' },
};

const getTargetInfo = (evento) => TARGET_INFO[evento] || { label: 'Usuario especifico', color: 'bg-gray-50 text-gray-600 border-gray-200/60' };

const VAR_DESCRIPTIONS = {
  nombre_vendedor: 'Nombre del vendedor',
  nombre_tienda: 'Nombre de la tienda',
  nombre_producto: 'Nombre del producto',
  nombre_plan: 'Nombre del plan de suscripcion',
  precio_plan: 'Precio del plan (ej: S/ 15.00)',
  duracion_plan: 'Duracion del plan (ej: 30 dias)',
  estado: 'Estado de la accion (APROBADO, RECHAZADO)',
  motivo: 'Motivo de rechazo (si aplica)',
  ticket_id: 'ID del ticket',
  status: 'Estado actual',
  product_id: 'ID del producto',
  id_producto: 'ID del producto',
  id_tienda: 'ID de la tienda',
  entity_type: 'Tipo de entidad (seller, store, product)',
};

export default function PushNotificationsPage() {
  const [items, setItems] = useState([]);
  const [variableMap, setVariableMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ titulo: '', mensaje: '', activo: true });
  const [lastFocusedField, setLastFocusedField] = useState('mensaje');
  const titleRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getPushNotifications();
      if (data && data.items) {
        setItems(Array.isArray(data.items) ? data.items : []);
        setVariableMap(data.variables || {});
      } else {
        setItems(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error('Error al cargar configuracion');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter(i => i.activo).length;
    return { total, active, inactive: total - active };
  }, [items]);

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setForm({ titulo: item.titulo || '', mensaje: item.mensaje || '', activo: item.activo });
    setShowEdit(true);
  };

  const insertVariable = (variable) => {
    const tag = `{{${variable}}}`;
    const field = lastFocusedField;
    const inputEl = field === 'titulo' ? titleRef.current : bodyRef.current;
    if (inputEl) {
      const start = inputEl.selectionStart;
      const end = inputEl.selectionEnd;
      const cur = form[field];
      const newVal = cur.substring(0, start) + tag + cur.substring(end);
      setForm((prev) => ({ ...prev, [field]: newVal }));
      setTimeout(() => {
        inputEl.selectionStart = inputEl.selectionEnd = start + tag.length;
        inputEl.focus();
      }, 0);
    } else {
      setForm((prev) => ({ ...prev, mensaje: prev.mensaje + tag }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.mensaje.trim()) {
      toast.error('Titulo y mensaje son obligatorios');
      return;
    }
    setSaving(true);
    try {
      await adminService.updatePushNotification(editingItem.id, {
        titulo: form.titulo,
        mensaje: form.mensaje,
        activo: form.activo,
      });
      toast.success('Notificacion actualizada');
      setShowEdit(false);
      loadItems();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item) => {
    try {
      await adminService.updatePushNotification(item.id, { activo: !item.activo });
      toast.success(`Notificacion ${!item.activo ? 'activada' : 'desactivada'}`);
      loadItems();
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const handleReset = async () => {
    try {
      await adminService.resetPushNotifications();
      toast.success('Configuracion restaurada');
      setShowReset(false);
      loadItems();
    } catch {
      toast.error('Error al restaurar');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header wave-bottom mb-8">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="font-display">Notificaciones Push</h1>
            <p className="text-sm text-white/60">Configura los mensajes, destinatarios y eventos</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowReset(true)}
              className="bg-white/20 hover:bg-white/30 text-white font-semibold text-sm py-2.5 px-5 rounded-xl transition-all duration-200 flex items-center gap-2 backdrop-blur-sm"
            >
              <HiOutlineRefresh className="w-4 h-4" />
              <span className="hidden sm:inline">Restaurar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center">
            <HiOutlineBell className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p className="text-xl font-bold font-display text-primary-600">{stats.total}</p>
            <p className="text-xs text-gray-500">Total eventos</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center">
            <HiOutlineBell className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-xl font-bold font-display text-green-600">{stats.active}</p>
            <p className="text-xs text-gray-500">Activas</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
            <HiOutlineBell className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <p className="text-xl font-bold font-display text-gray-500">{stats.inactive}</p>
            <p className="text-xs text-gray-500">Inactivas</p>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={HiOutlineBell}
          title="Sin configuracion"
          description="No hay notificaciones push configuradas"
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Evento</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Titulo</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Mensaje</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Destinatario</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Activa</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const info = getTargetInfo(item.evento);
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${!item.activo ? 'opacity-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800 text-xs sm:text-sm">
                          {EVENT_LABELS[item.evento] || item.evento}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{item.evento}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{item.titulo}</td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell max-w-xs truncate">
                        {item.mensaje}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold border ${info.color}`}>
                          {info.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggle(item)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            item.activo ? 'bg-primary-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-surface shadow transition-transform ${
                              item.activo ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Editar Notificacion Push" maxWidth="max-w-md">
        {editingItem && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Evento</p>
              <p className="font-semibold text-sm text-gray-800">{EVENT_LABELS[editingItem.evento] || editingItem.evento}</p>
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">{editingItem.evento}</p>
            </div>

            {/* Variables disponibles */}
            {(variableMap[editingItem.evento] || []).length > 0 && (
              <div className="rounded-xl border border-purple-200 overflow-hidden">
                <div className="bg-purple-50 px-3 py-2 border-b border-purple-200">
                  <p className="text-xs font-bold text-purple-700">Variables dinamicas</p>
                  <p className="text-[10px] text-purple-500 mt-0.5">Toca una variable para insertarla en el campo activo</p>
                </div>
                <div className="p-3 bg-surface">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {variableMap[editingItem.evento].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => insertVariable(v)}
                        className="px-2.5 py-1 rounded-md border border-purple-300 bg-purple-50 text-xs font-mono text-purple-700 hover:bg-purple-100 hover:border-purple-400 transition-colors"
                      >
                        {`{{${v}}}`}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 pt-2 space-y-1">
                    {variableMap[editingItem.evento].map((v) => (
                      <div key={v} className="flex items-start gap-2 text-[11px]">
                        <code className="text-purple-600 font-bold whitespace-nowrap">{`{{${v}}}`}</code>
                        <span className="text-gray-500">{VAR_DESCRIPTIONS[v] || v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Titulo <span className="text-coral-500">*</span>
              </label>
              <input
                ref={titleRef}
                type="text"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                onFocus={() => setLastFocusedField('titulo')}
                className="input-field text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Mensaje <span className="text-coral-500">*</span>
              </label>
              <textarea
                ref={bodyRef}
                value={form.mensaje}
                onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                onFocus={() => setLastFocusedField('mensaje')}
                className="input-field text-sm"
                rows={3}
                required
              />
            </div>

            {/* Destinatario info (solo lectura) */}
            {(() => {
              const info = getTargetInfo(editingItem.evento);
              return (
                <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-xl">
                  <p className="text-[10px] font-semibold text-blue-700 mb-0.5">Destinatario</p>
                  <p className="text-sm font-medium text-blue-800">{info.label}</p>
                </div>
              );
            })()}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, activo: !form.activo })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.activo ? 'bg-primary-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-surface shadow transition-transform ${
                    form.activo ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-700">
                {form.activo ? 'Notificacion activa' : 'Notificacion inactiva'}
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="btn-secondary text-sm"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary text-sm"
                disabled={saving || !form.titulo.trim() || !form.mensaje.trim()}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Reset Confirm */}
      <ConfirmDialog
        open={showReset}
        onClose={() => setShowReset(false)}
        onConfirm={handleReset}
        title="Restaurar configuracion?"
        message="Todos los titulos, mensajes y destinatarios volveran a sus valores predeterminados. Las notificaciones desactivadas se reactivaran."
        confirmText="Si, Restaurar"
        variant="danger"
      />
    </div>
  );
}
