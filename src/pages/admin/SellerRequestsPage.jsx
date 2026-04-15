import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useSSEListener } from '../../hooks/useSSEListener';
import { formatDateTime } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import {
  HiOutlineCheckCircle,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineClock,
  HiOutlineOfficeBuilding,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineCalendar,
  HiOutlineChevronRight,
  HiOutlineTrash,
} from 'react-icons/hi';

export default function SellerRequestsPage() {
  const [data, setData] = useState([]);
  const [allData, setAllData] = useState({ pending: [], approved: [], rejected: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [showReject, setShowReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminService.getPendingSellers();
      const items = res.data;
      const pending = items.filter(i => i.estado === 'PENDIENTE' || !i.estado);
      const approved = items.filter(i => i.estado === 'APROBADO');
      const rejected = items.filter(i => i.estado === 'RECHAZADO');
      setAllData({ pending, approved, rejected });
      setData(items);
      setSelectedIds(new Set());
    } catch {} finally {
      setLoading(false);
    }
  };

  useSSEListener(['admin.pending.seller'], loadData);

  const getFilteredData = () => {
    if (filter === 'pending') return allData.pending;
    if (filter === 'approved') return allData.approved;
    if (filter === 'rejected') return allData.rejected;
    return data;
  };

  const handleApprove = async (id) => {
    try {
      await adminService.approveSeller(id, { estado: 'APROBADO' });
      toast.success('Vendedor aprobado');
      setSelectedItem(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const handleReject = async () => {
    if (!showReject) return;
    try {
      await adminService.approveSeller(showReject, { estado: 'RECHAZADO', motivo_rechazo: rejectReason });
      toast.success('Vendedor rechazado');
      setShowReject(null);
      setRejectReason('');
      setSelectedItem(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const filteredItems = getFilteredData();

  const rejectedInView = filteredItems.filter(i => i.estado === 'RECHAZADO');
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
      await adminService.bulkDeleteRejectedSellers([...selectedIds]);
      toast.success(`${selectedIds.size} vendedor(es) eliminado(s)`);
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

      {/* Stats compactos */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-surface rounded-xl shadow-sm border border-gray-100/80 p-3 text-center">
          <div className="w-8 h-8 rounded-full bg-warning-100 flex items-center justify-center mx-auto mb-1">
            <HiOutlineClock className="w-4 h-4 text-warning-600" />
          </div>
          <p className="text-lg font-bold font-display text-warning-600">{allData.pending.length}</p>
          <p className="text-[10px] text-gray-500">Pendientes</p>
        </div>
        <div className="bg-surface rounded-xl shadow-sm border border-gray-100/80 p-3 text-center">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-1">
            <HiOutlineCheck className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-lg font-bold font-display text-green-600">{allData.approved.length}</p>
          <p className="text-[10px] text-gray-500">Aprobados</p>
        </div>
        <div className="bg-surface rounded-xl shadow-sm border border-gray-100/80 p-3 text-center">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-1">
            <HiOutlineX className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-lg font-bold font-display text-red-600">{allData.rejected.length}</p>
          <p className="text-[10px] text-gray-500">Rechazados</p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { key: 'pending', label: `Pendientes (${allData.pending.length})` },
          { key: 'all', label: `Todos (${data.length})` },
          { key: 'approved', label: `Aprobados (${allData.approved.length})` },
          { key: 'rejected', label: `Rechazados (${allData.rejected.length})` },
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

      {loading ? (
        <LoadingSpinner />
      ) : filteredItems.length === 0 ? (
        <EmptyState icon={HiOutlineCheckCircle} title="Sin solicitudes" description="No hay solicitudes de registro" />
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const usuario = item.usuario || item.tbl_usuarios;
            const name = usuario?.nombre || item.razon_social || 'Vendedor';
            const storeName = item.nombre_tienda || usuario?.tiendas?.[0]?.nombre || item.nombre_negocio || item.razon_social || '–';
            const email = usuario?.correo || '-';
            const phone = usuario?.telefono || '-';
            const isPending = item.estado === 'PENDIENTE' || item.estado_aprobacion === 'PENDIENTE' || !item.estado;

            return (
              <div key={item.id} className={`bg-surface rounded-2xl shadow-card border border-gray-100/80 p-5 border-l-4 ${isPending ? 'border-l-warning-400' : item.estado === 'APROBADO' ? 'border-l-green-400' : 'border-l-red-400'} animate-slide-up`}>
                {(item.estado === 'RECHAZADO') && (
                  <label className="flex items-center gap-2 mb-3 cursor-pointer" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-xs text-gray-500">Seleccionar para eliminar</span>
                  </label>
                )}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-warning-50 flex items-center justify-center flex-shrink-0">
                    <HiOutlineOfficeBuilding className="w-5 h-5 text-warning-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900">{name}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isPending ? 'bg-warning-100 text-warning-700' : item.estado === 'APROBADO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {isPending ? 'Pendiente' : item.estado === 'APROBADO' ? 'Aprobado' : 'Rechazado'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <HiOutlineOfficeBuilding className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-xs text-primary-600 font-medium">{storeName}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <HiOutlineMail className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-xs text-gray-500">{email}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <HiOutlinePhone className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-xs text-gray-500">{phone}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <HiOutlineCalendar className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-xs text-gray-400">{formatDateTime(item.fecha_hora_registro)}</p>
                    </div>
                  </div>
                </div>

                {isPending && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => { setShowReject(item.id); setRejectReason(''); }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-all flex items-center justify-center gap-1"
                    >
                      <HiOutlineX className="w-4 h-4" /> Rechazar
                    </button>
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="flex-1 btn-primary text-sm flex items-center justify-center gap-1"
                    >
                      <HiOutlineCheck className="w-4 h-4" /> Aprobar
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setSelectedItem(item)}
                  className="w-full mt-3 text-center text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center justify-center gap-1"
                >
                  Ver detalle completo <HiOutlineChevronRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Modal open={!!selectedItem} onClose={() => setSelectedItem(null)} title="Detalle de Solicitud" maxWidth="max-w-md">
        {selectedItem && (() => {
          const usr = selectedItem.usuario || selectedItem.tbl_usuarios;
          const estado = selectedItem.estado || selectedItem.estado_aprobacion;
          const isPend = estado === 'PENDIENTE' || !estado;

          return (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isPend ? 'bg-warning-100 text-warning-700' : estado === 'APROBADO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {isPend ? 'Pendiente' : estado === 'APROBADO' ? 'Aprobado' : 'Rechazado'}
                </span>
                <span className="text-xs text-gray-400">Solicitud: {formatDateTime(selectedItem.fecha_hora_registro)}</span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-primary-700 mb-2 flex items-center gap-2">
                  <HiOutlineOfficeBuilding className="w-4 h-4" />
                  Información del Vendedor
                </h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <HiOutlineOfficeBuilding className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Tienda</p>
                      <p className="text-sm font-medium text-gray-800">{usr?.tiendas?.[0]?.nombre || selectedItem.nombre_tienda || selectedItem.nombre_negocio || '–'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <HiOutlineCheckCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Propietario</p>
                      <p className="text-sm font-medium text-gray-800">{usr?.nombre || '–'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <HiOutlineMail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Email</p>
                      <p className="text-sm text-gray-800">{usr?.correo || '–'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <HiOutlinePhone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Teléfono</p>
                      <p className="text-sm text-gray-800">{usr?.telefono || '–'}</p>
                    </div>
                  </div>
                  {(selectedItem.ruc || selectedItem.dni) && (
                    <div className="flex items-center gap-3">
                      <HiOutlineCalendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{selectedItem.ruc ? 'RUC' : 'DNI'}</p>
                        <p className="text-sm text-gray-800">{selectedItem.ruc || selectedItem.dni}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {isPend && (
                <div className="flex gap-3 pt-2">
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
                    <HiOutlineCheck className="w-4 h-4" /> Aprobar Solicitud
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* Reject Modal */}
      <Modal open={!!showReject} onClose={() => setShowReject(null)} title="Rechazar Solicitud" maxWidth="max-w-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de rechazo</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="input-field text-sm"
              rows={3}
              placeholder="Indique el motivo..."
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowReject(null)} className="btn-secondary flex-1 text-sm">Cancelar</button>
            <button onClick={handleReject} className="btn-danger flex-1 text-sm">Rechazar</button>
          </div>
        </div>
      </Modal>

      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Eliminar vendedores rechazados" maxWidth="max-w-sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Se eliminarán <strong>{selectedIds.size}</strong> vendedor(es) rechazado(s) y todas sus tiendas y productos asociados. Los datos históricos no se verán afectados.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setShowDeleteConfirm(false)} disabled={deleteLoading} className="btn-secondary flex-1 text-sm">Cancelar</button>
            <button onClick={handleBulkDelete} disabled={deleteLoading} className="btn-danger flex-1 text-sm flex items-center justify-center gap-1">
              {deleteLoading ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
