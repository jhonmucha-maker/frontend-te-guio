import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { formatDateTime } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { HiOutlineCheckCircle, HiOutlineCheck, HiOutlineX, HiOutlineClock, HiOutlineOfficeBuilding } from 'react-icons/hi';

export default function ApprovalsPage() {
  const [tab, setTab] = useState('sellers');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReject, setShowReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const tabs = [
    { key: 'sellers', label: 'Vendedores' },
    { key: 'stores', label: 'Tiendas' },
    { key: 'products', label: 'Productos' },
    { key: 'subscriptions', label: 'Suscripciones' },
  ];

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      let res;
      if (tab === 'sellers') res = await adminService.getPendingSellers();
      else if (tab === 'stores') res = await adminService.getPendingStores();
      else if (tab === 'products') res = await adminService.getPendingProducts();
      else res = await adminService.getPendingSubscriptions();
      setData(res.data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const payload = { estado: 'APROBADO' };
      if (tab === 'sellers') await adminService.approveSeller(id, payload);
      else if (tab === 'stores') await adminService.approveStore(id, payload);
      else if (tab === 'products') await adminService.approveProduct(id, payload);
      else await adminService.approveSubscription(id, payload);
      toast.success('Aprobado correctamente');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const handleReject = async () => {
    if (!showReject) return;
    try {
      const payload = { estado: 'RECHAZADO', motivo_rechazo: rejectReason };
      if (tab === 'sellers') await adminService.approveSeller(showReject, payload);
      else if (tab === 'stores') await adminService.approveStore(showReject, payload);
      else if (tab === 'products') await adminService.approveProduct(showReject, payload);
      else await adminService.approveSubscription(showReject, payload);
      toast.success('Rechazado');
      setShowReject(null);
      setRejectReason('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const renderItem = (item) => {
    let title = '';
    let detail = '';
    if (tab === 'sellers') {
      title = item.razon_social || `${item.usuario?.nombre} ${item.usuario?.apellidos || ''}`;
      detail = `RUC: ${item.ruc || '-'} | ${item.usuario?.correo}`;
    } else if (tab === 'stores') {
      title = item.nombre;
      detail = `Galeria: ${item.galeria?.nombre || '-'} | Vendedor: ${item.vendedor?.usuario?.nombre || '-'}`;
    } else if (tab === 'products') {
      title = item.nombre;
      detail = `Tienda: ${item.tienda?.nombre || '-'} | Precio: S/ ${item.precio}`;
    } else {
      title = `Tienda: ${item.tienda?.nombre || '-'}`;
      detail = `Plan: ${item.plan?.tipo} | N. Op: ${item.numero_operacion || '-'}`;
    }

    return (
      <div key={item.id} className="bg-surface rounded-2xl shadow-card border border-gray-100/80 p-5 transition-all duration-200 hover:shadow-card-hover border-l-4 border-l-warning-400 animate-slide-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
              <HiOutlineOfficeBuilding className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-900 truncate">{title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{detail}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatDateTime(item.fecha_hora_registro)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => {
                setShowReject(item.id);
                setRejectReason('');
              }}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-all duration-200"
              title="Rechazar"
            >
              Rechazar
            </button>
            <button
              onClick={() => handleApprove(item.id)}
              className="btn-primary text-sm"
              title="Aprobar"
            >
              Aprobar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header wave-bottom mb-8">
        <h1 className="font-display relative z-10">Aprobaciones</h1>
        <p className="text-sm text-white/60 relative z-10">Gestiona las solicitudes pendientes</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface rounded-2xl shadow-card border border-gray-100/80 p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-warning-100 flex items-center justify-center">
            <HiOutlineClock className="w-6 h-6 text-warning-600" />
          </div>
          <div>
            <p className="text-xl font-bold font-display text-warning-600">{data.length}</p>
            <p className="text-xs text-gray-500">Pendientes</p>
          </div>
        </div>
        <div className="bg-surface rounded-2xl shadow-card border border-gray-100/80 p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center">
            <HiOutlineCheck className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-xl font-bold font-display text-green-600">--</p>
            <p className="text-xs text-gray-500">Aprobados</p>
          </div>
        </div>
        <div className="bg-surface rounded-2xl shadow-card border border-gray-100/80 p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center">
            <HiOutlineX className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-xl font-bold font-display text-red-600">--</p>
            <p className="text-xs text-gray-500">Rechazados</p>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`chip whitespace-nowrap ${
              tab === t.key
                ? 'chip-active'
                : 'chip-inactive'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : data.length === 0 ? (
        <EmptyState
          icon={HiOutlineCheckCircle}
          title="Sin pendientes"
          description="No hay elementos pendientes de aprobacion"
        />
      ) : (
        <div className="space-y-3">{data.map(renderItem)}</div>
      )}

      {/* Reject Modal */}
      <Modal open={!!showReject} onClose={() => setShowReject(null)} title="Rechazar" maxWidth="max-w-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo de rechazo
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="input-field text-sm"
              rows={3}
              placeholder="Indique el motivo..."
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowReject(null)} className="btn-secondary flex-1 text-sm">
              Cancelar
            </button>
            <button onClick={handleReject} className="btn-danger flex-1 text-sm">
              Rechazar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
