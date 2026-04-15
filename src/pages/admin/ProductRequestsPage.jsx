import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useSSEListener } from '../../hooks/useSSEListener';
import { formatDate } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import {
  HiOutlineCheckCircle, HiOutlineCheck, HiOutlineX, HiOutlineClock,
  HiOutlineInformationCircle, HiOutlineOfficeBuilding, HiOutlineTrash,
} from 'react-icons/hi';

import { resolveFileUrl } from '../../utils/constants';

export default function ProductRequestsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [showReject, setShowReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminService.getPendingProducts();
      setData(res.data);
      setSelectedIds(new Set());
    } catch {} finally { setLoading(false); }
  };

  useSSEListener(['admin.pending.product'], loadData);

  const pending = data.filter(i => i.estado_aprobacion === 'PENDIENTE');
  const approved = data.filter(i => i.estado_aprobacion === 'APROBADO');
  const rejected = data.filter(i => i.estado_aprobacion === 'RECHAZADO');

  const getFiltered = () => {
    if (filter === 'pending') return pending;
    if (filter === 'approved') return approved;
    if (filter === 'rejected') return rejected;
    return data;
  };

  const handleApprove = async (id) => {
    try {
      await adminService.approveProduct(id, { estado: 'APROBADO' });
      toast.success('Producto aprobado');
      setSelectedItem(null);
      loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleReject = async () => {
    if (!showReject) return;
    try {
      await adminService.approveProduct(showReject, { estado: 'RECHAZADO', motivo_rechazo: rejectReason });
      toast.success('Producto rechazado');
      setShowReject(null);
      setRejectReason('');
      setSelectedItem(null);
      loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const items = getFiltered();

  const rejectedInView = items.filter(i => i.estado_aprobacion === 'RECHAZADO');
  const allRejectedSelected = rejectedInView.length > 0 && rejectedInView.every(i => selectedIds.has(i.id));

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allRejectedSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rejectedInView.map(i => i.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setDeleteLoading(true);
    try {
      await adminService.bulkDeleteRejectedProducts([...selectedIds]);
      toast.success(`${selectedIds.size} producto(s) eliminado(s)`);
      setShowDeleteConfirm(false);
      setSelectedIds(new Set());
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="animate-fade-in pt-2">

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-surface rounded-xl shadow-sm border border-gray-100/80 p-3 text-center">
          <div className="w-8 h-8 rounded-full bg-warning-100 flex items-center justify-center mx-auto mb-1"><HiOutlineClock className="w-4 h-4 text-warning-600" /></div>
          <p className="text-lg font-bold font-display text-warning-600">{pending.length}</p>
          <p className="text-[10px] text-gray-500">Pendientes</p>
        </div>
        <div className="bg-surface rounded-xl shadow-sm border border-gray-100/80 p-3 text-center">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-1"><HiOutlineCheck className="w-4 h-4 text-green-600" /></div>
          <p className="text-lg font-bold font-display text-green-600">{approved.length}</p>
          <p className="text-[10px] text-gray-500">Aprobados</p>
        </div>
        <div className="bg-surface rounded-xl shadow-sm border border-gray-100/80 p-3 text-center">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-1"><HiOutlineX className="w-4 h-4 text-red-600" /></div>
          <p className="text-lg font-bold font-display text-red-600">{rejected.length}</p>
          <p className="text-[10px] text-gray-500">Rechazados</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { key: 'pending', label: `Pendientes (${pending.length})` },
          { key: 'all', label: `Todos (${data.length})` },
          { key: 'approved', label: `Aprobados (${approved.length})` },
          { key: 'rejected', label: `Rechazados (${rejected.length})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`chip whitespace-nowrap ${filter === f.key ? 'chip-active' : 'chip-inactive'}`}>{f.label}</button>
        ))}
      </div>

      {rejectedInView.length > 0 && (
        <div className="bg-surface rounded-2xl shadow-card border border-gray-100/80 p-4 mb-4 flex items-center justify-between gap-3 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <input type="checkbox" checked={allRejectedSelected} onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            Marcar todos los rechazados ({rejectedInView.length})
          </label>
          {selectedIds.size > 0 && (
            <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">
              <HiOutlineTrash className="w-4 h-4" /> Eliminar ({selectedIds.size})
            </button>
          )}
        </div>
      )}

      {loading ? <LoadingSpinner /> : items.length === 0 ? (
        <EmptyState icon={HiOutlineCheckCircle} title="Sin solicitudes" description="No hay productos pendientes" />
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const isPending = item.estado_aprobacion === 'PENDIENTE';
            const isApproved = item.estado_aprobacion === 'APROBADO';
            const tienda = item.tienda;
            const tiendaActiva = tienda?.estado_aprobacion === 'APROBADO';

            return (
              <div key={item.id} className="card animate-slide-up cursor-pointer" onClick={() => setSelectedItem(item)}>
                {item.estado_aprobacion === 'RECHAZADO' && (
                  <label className="flex items-center gap-2 mb-3 cursor-pointer" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-xs text-gray-500">Seleccionar para eliminar</span>
                  </label>
                )}
                {/* Nombre producto + Badge estado */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900">{item.nombre}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{tienda?.vendedor_nombre || '-'}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${isPending ? 'bg-warning-100 text-warning-700' : isApproved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isPending ? 'Pendiente' : isApproved ? 'Aprobado' : 'Rechazado'}
                  </span>
                </div>

                {/* Sub-card Tienda */}
                {tienda && (
                  <div className="border-l-4 border-primary-300 bg-gray-50 rounded-r-xl p-3 mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-800">{tienda.nombre}</p>
                      {tiendaActiva && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Activa
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HiOutlineInformationCircle className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[11px] text-gray-500 bg-gray-200/60 px-2 py-0.5 rounded-full">
                        {tienda.suscripcion ? `Plan ${tienda.suscripcion}` : 'Sin suscripcion'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HiOutlineOfficeBuilding className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        {tienda.galeria || '-'}{tienda.numero_local ? ` - Stand ${tienda.numero_local}` : ''}
                      </span>
                    </div>
                  </div>
                )}

                {/* Detalles del producto */}
                <div className="mt-3 space-y-1.5">
                  {[
                    { label: 'Categoria', value: item.categoria },
                    { label: 'Precio', value: item.precio != null ? `S/ ${Number(item.precio).toFixed(2)}` : null },
                    { label: 'Galeria', value: tienda?.galeria },
                    { label: 'Ciudad', value: tienda?.ciudad },
                    { label: 'Zona', value: tienda?.zona },
                    { label: 'Stand', value: tienda?.numero_local },
                    { label: 'Fecha', value: formatDate(item.fecha_hora_registro) },
                  ].map((row, i) => (
                    <div key={i} className="flex">
                      <span className="text-xs font-medium text-gray-500 w-20 flex-shrink-0">{row.label}:</span>
                      <span className="text-xs text-gray-800">{row.value || '-'}</span>
                    </div>
                  ))}
                </div>

                {/* Botones Aprobar / Rechazar */}
                {isPending && (
                  <div className="flex gap-2 mt-4" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setShowReject(item.id); setRejectReason(''); }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-all flex items-center justify-center gap-1">
                      <HiOutlineX className="w-4 h-4" /> Rechazar
                    </button>
                    <button onClick={() => handleApprove(item.id)} className="flex-1 btn-primary text-sm flex items-center justify-center gap-1">
                      <HiOutlineCheck className="w-4 h-4" /> Aprobar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={
          selectedItem ? (
            <span className="flex items-center justify-between w-full">
              Detalle del Producto
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${selectedItem.estado_aprobacion === 'PENDIENTE' ? 'bg-warning-100 text-warning-700' : selectedItem.estado_aprobacion === 'APROBADO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {selectedItem.estado_aprobacion === 'PENDIENTE' ? 'Pendiente' : selectedItem.estado_aprobacion === 'APROBADO' ? 'Aprobado' : 'Rechazado'}
              </span>
            </span>
          ) : 'Detalle del Producto'
        }
        maxWidth="max-w-md"
      >
        {selectedItem && (() => {
          const tienda = selectedItem.tienda;
          const isPend = selectedItem.estado_aprobacion === 'PENDIENTE';

          return (
            <div className="space-y-4">
              {/* Fotos */}
              {selectedItem.fotos?.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {selectedItem.fotos.map((f, i) => (
                    <img key={i} src={resolveFileUrl(f.url)} alt="" className="w-24 h-24 object-cover rounded-xl flex-shrink-0" />
                  ))}
                </div>
              )}

              {/* Informacion del Producto */}
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Información del Producto</p>
                <p className="text-sm"><span className="font-semibold text-gray-700">Nombre:</span> {selectedItem.nombre}</p>
                <p className="text-sm"><span className="font-semibold text-gray-700">Descripción:</span> {selectedItem.descripcion || '-'}</p>
                <p className="text-sm"><span className="font-semibold text-gray-700">Categoría:</span> {selectedItem.categoria || '-'}</p>
                <p className="text-sm"><span className="font-semibold text-gray-700">Precio:</span> S/ {Number(selectedItem.precio).toFixed(2)}</p>
              </div>

              {/* Informacion del Vendedor */}
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Información del Vendedor</p>
                <p className="text-sm"><span className="font-semibold text-gray-700">Vendedor:</span> {tienda?.vendedor_nombre || '-'}</p>
                <p className="text-sm"><span className="font-semibold text-gray-700">Tienda:</span> {tienda?.nombre || '-'}</p>
              </div>

              {/* Ubicacion de la Tienda */}
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Ubicación de la Tienda</p>
                <p className="text-sm"><span className="font-semibold text-gray-700">Ciudad:</span> {tienda?.ciudad || '-'}</p>
                <p className="text-sm"><span className="font-semibold text-gray-700">Zona:</span> {tienda?.zona || '-'}</p>
                <p className="text-sm"><span className="font-semibold text-gray-700">Galería:</span> {tienda?.galeria || '-'}</p>
                <p className="text-sm"><span className="font-semibold text-gray-700">Stand:</span> {tienda?.numero_local || '-'}</p>
              </div>

              {/* Botones Aprobar / Rechazar */}
              {isPend && (
                <div className="flex gap-3 pt-2" onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setShowReject(selectedItem.id); setRejectReason(''); }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-all flex items-center justify-center gap-1">
                    <HiOutlineX className="w-4 h-4" /> Rechazar
                  </button>
                  <button onClick={() => handleApprove(selectedItem.id)} className="flex-1 btn-primary text-sm flex items-center justify-center gap-1">
                    <HiOutlineCheck className="w-4 h-4" /> Aprobar
                  </button>
                </div>
              )}

              {/* Boton Cerrar */}
              <button onClick={() => setSelectedItem(null)} className="btn-secondary w-full text-sm">Cerrar</button>
            </div>
          );
        })()}
      </Modal>

      <Modal open={!!showReject} onClose={() => setShowReject(null)} title="Rechazar Producto" maxWidth="max-w-sm">
        <div className="space-y-4">
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="input-field text-sm" rows={3} placeholder="Motivo de rechazo..." />
          <div className="flex gap-3">
            <button onClick={() => setShowReject(null)} className="btn-secondary flex-1 text-sm">Cancelar</button>
            <button onClick={handleReject} className="btn-danger flex-1 text-sm">Rechazar</button>
          </div>
        </div>
      </Modal>

      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Eliminar productos rechazados" maxWidth="max-w-sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Se eliminarán <strong>{selectedIds.size}</strong> producto(s) rechazado(s). Los datos históricos no se verán afectados.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setShowDeleteConfirm(false)} disabled={deleteLoading} className="btn-secondary flex-1 text-sm">Cancelar</button>
            <button onClick={handleBulkDelete} disabled={deleteLoading} className="btn-danger flex-1 text-sm">{deleteLoading ? 'Eliminando...' : 'Eliminar'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
