import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useSSEListener } from '../../hooks/useSSEListener';
import { formatDate } from '../../utils/formatters';
import { openExternal } from '../../utils/navigation';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import {
  HiOutlineCheckCircle, HiOutlineCheck, HiOutlineX, HiOutlineClock,
  HiOutlineLocationMarker, HiOutlineTrash,
} from 'react-icons/hi';

import { resolveFileUrl } from '../../utils/constants';

export default function StoreRequestsPage() {
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
      const res = await adminService.getPendingStores();
      setData(res.data);
      setSelectedIds(new Set());
    } catch {} finally { setLoading(false); }
  };

  useSSEListener(['admin.pending.store'], loadData);

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
      await adminService.approveStore(id, { estado: 'APROBADO' });
      toast.success('Tienda aprobada');
      setSelectedItem(null);
      loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleReject = async () => {
    if (!showReject) return;
    try {
      await adminService.approveStore(showReject, { estado: 'RECHAZADO', motivo_rechazo: rejectReason });
      toast.success('Tienda rechazada');
      setShowReject(null);
      setRejectReason('');
      setSelectedItem(null);
      loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const openGoogleMaps = (lat, lng) => {
    openExternal(`https://www.google.com/maps?q=${lat},${lng}`);
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
      await adminService.bulkDeleteRejectedStores([...selectedIds]);
      toast.success(`${selectedIds.size} tienda(s) eliminada(s)`);
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
          <p className="text-[10px] text-gray-500">Aprobadas</p>
        </div>
        <div className="bg-surface rounded-xl shadow-sm border border-gray-100/80 p-3 text-center">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-1"><HiOutlineX className="w-4 h-4 text-red-600" /></div>
          <p className="text-lg font-bold font-display text-red-600">{rejected.length}</p>
          <p className="text-[10px] text-gray-500">Rechazadas</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { key: 'pending', label: `Pendientes (${pending.length})` },
          { key: 'all', label: `Todas (${data.length})` },
          { key: 'approved', label: `Aprobadas (${approved.length})` },
          { key: 'rejected', label: `Rechazadas (${rejected.length})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`chip whitespace-nowrap ${filter === f.key ? 'chip-active' : 'chip-inactive'}`}>{f.label}</button>
        ))}
      </div>

      {rejectedInView.length > 0 && (
        <div className="bg-surface rounded-2xl shadow-card border border-gray-100/80 p-4 mb-4 flex items-center justify-between gap-3 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <input type="checkbox" checked={allRejectedSelected} onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            Marcar todas las rechazadas ({rejectedInView.length})
          </label>
          {selectedIds.size > 0 && (
            <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">
              <HiOutlineTrash className="w-4 h-4" /> Eliminar ({selectedIds.size})
            </button>
          )}
        </div>
      )}

      {loading ? <LoadingSpinner /> : items.length === 0 ? (
        <EmptyState icon={HiOutlineCheckCircle} title="Sin solicitudes" description="No hay solicitudes de tiendas" />
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const isPending = item.estado_aprobacion === 'PENDIENTE';
            return (
              <div key={item.id} className="card animate-slide-up cursor-pointer" onClick={() => setSelectedItem(item)}>
                {item.estado_aprobacion === 'RECHAZADO' && (
                  <label className="flex items-center gap-2 mb-3 cursor-pointer" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-xs text-gray-500">Seleccionar para eliminar</span>
                  </label>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-gray-900">{item.nombre}</h3>
                  <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${isPending ? 'bg-warning-100 text-warning-700' : item.estado_aprobacion === 'APROBADO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isPending ? 'Pendiente' : item.estado_aprobacion === 'APROBADO' ? 'Aprobada' : 'Rechazada'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{item.vendedor?.nombre || '-'}</p>

                {item.fotos?.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 mb-3">
                    {item.fotos.map((f, i) => (
                      <img key={i} src={resolveFileUrl(f.url)} alt="" className="w-28 h-28 object-cover rounded-xl flex-shrink-0" />
                    ))}
                  </div>
                )}

                <div className="space-y-1.5">
                  {[
                    { label: 'Galería', value: item.galeria?.nombre },
                    { label: 'Dir. Galería', value: item.galeria?.direccion },
                    { label: 'N° Tienda', value: item.numero_local || item.direccion },
                    { label: 'Fecha', value: formatDate(item.fecha_hora_registro) },
                  ].map((row, i) => (
                    <div key={i} className="flex">
                      <span className="text-xs font-medium text-gray-500 w-24 flex-shrink-0">{row.label}:</span>
                      <span className="text-xs text-gray-800">{row.value || '-'}</span>
                    </div>
                  ))}
                </div>

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
      <Modal open={!!selectedItem} onClose={() => setSelectedItem(null)} title="Detalle de la Tienda" maxWidth="max-w-md">
        {selectedItem && (
          <div className="space-y-5">
            {/* Fotos de la tienda */}
            {selectedItem.fotos?.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {selectedItem.fotos.map((f, i) => (
                  <img key={i} src={resolveFileUrl(f.url)} alt="" className="w-28 h-28 object-cover rounded-xl flex-shrink-0" />
                ))}
              </div>
            )}

            {/* Información de la Tienda */}
            <div>
              <p className="text-sm font-bold text-gray-800 mb-3">Información de la Tienda</p>
              <div className="space-y-1.5">
                <p className="text-sm"><span className="font-medium text-gray-500">Nombre:</span> {selectedItem.nombre}</p>
                <p className="text-sm"><span className="font-medium text-gray-500">N° Tienda:</span> {selectedItem.numero_local || selectedItem.direccion || '-'}</p>
                <p className="text-sm"><span className="font-medium text-gray-500">Ciudad:</span> {selectedItem.galeria?.ciudad || '-'}</p>
                <p className="text-sm"><span className="font-medium text-gray-500">Zona:</span> {selectedItem.galeria?.zona || '-'}</p>
                <p className="text-sm"><span className="font-medium text-gray-500">Galería:</span> {selectedItem.galeria?.nombre || '-'}</p>
                <p className="text-sm"><span className="font-medium text-gray-500">Dir. Galería:</span> {selectedItem.galeria?.direccion || '-'}</p>
                <p className="text-sm"><span className="font-medium text-gray-500">Descripción:</span> {selectedItem.descripcion || '-'}</p>
              </div>
            </div>

            {/* Información del Propietario */}
            <div>
              <p className="text-sm font-bold text-gray-800 mb-3">Información del Propietario</p>
              <div className="space-y-1.5">
                <p className="text-sm"><span className="font-medium text-gray-500">Nombre:</span> {selectedItem.vendedor?.nombre || '-'}</p>
                <p className="text-sm"><span className="font-medium text-gray-500">Email:</span> {selectedItem.vendedor?.correo || '-'}</p>
                <p className="text-sm"><span className="font-medium text-gray-500">Teléfono:</span> {selectedItem.vendedor?.telefono || '-'}</p>
              </div>
            </div>

            {/* Fotos de la Galería */}
            {selectedItem.galeria?.fotos?.length > 0 && (
              <div>
                <p className="text-sm font-bold text-gray-800 mb-3">Galería</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selectedItem.galeria.fotos.map((f, i) => (
                    <img key={i} src={resolveFileUrl(f.url)} alt="" className="w-28 h-28 object-cover rounded-xl flex-shrink-0" />
                  ))}
                </div>
              </div>
            )}

            {/* Ver en Google Maps */}
            {selectedItem.galeria?.latitud && selectedItem.galeria?.longitud && (
              <button
                onClick={() => openGoogleMaps(selectedItem.galeria.latitud, selectedItem.galeria.longitud)}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#312c85] hover:bg-[#28236e] transition-colors flex items-center justify-center gap-2"
              >
                <HiOutlineLocationMarker className="w-5 h-5" />
                Ver en Google Maps
              </button>
            )}

            {/* Rechazar / Aprobar */}
            {selectedItem.estado_aprobacion === 'PENDIENTE' && (
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowReject(selectedItem.id); setRejectReason(''); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-all flex items-center justify-center gap-1"
                >
                  <HiOutlineX className="w-4 h-4" /> Rechazar
                </button>
                <button
                  onClick={() => handleApprove(selectedItem.id)}
                  className="flex-1 btn-primary text-sm flex items-center justify-center gap-1"
                >
                  <HiOutlineCheck className="w-4 h-4" /> Aprobar
                </button>
              </div>
            )}

            {/* Cerrar */}
            <button onClick={() => setSelectedItem(null)} className="w-full text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors py-1">
              Cerrar
            </button>
          </div>
        )}
      </Modal>

      <Modal open={!!showReject} onClose={() => setShowReject(null)} title="Rechazar Tienda" maxWidth="max-w-sm">
        <div className="space-y-4">
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="input-field text-sm" rows={3} placeholder="Motivo de rechazo..." />
          <div className="flex gap-3">
            <button onClick={() => setShowReject(null)} className="btn-secondary flex-1 text-sm">Cancelar</button>
            <button onClick={handleReject} className="btn-danger flex-1 text-sm">Rechazar</button>
          </div>
        </div>
      </Modal>

      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Eliminar tiendas rechazadas" maxWidth="max-w-sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Se eliminarán <strong>{selectedIds.size}</strong> tienda(s) rechazada(s) y todos sus productos asociados. Los datos históricos no se verán afectados.
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
