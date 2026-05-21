import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sellerService } from '../../services/sellerService';
import { marketplaceService } from '../../services/marketplaceService';
import { useSSEListener } from '../../hooks/useSSEListener';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import {
  HiOutlineOfficeBuilding,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineStar,
  HiStar,
  HiOutlineLocationMarker,
  HiOutlineClock,
  HiOutlineRefresh,
  HiOutlineExclamation,
  HiOutlineCheckCircle,
  HiOutlineShoppingBag,
  HiOutlineSearch,
  HiOutlineX,
} from 'react-icons/hi';

import { resolveFileUrl } from '../../utils/constants';

function getStoreImageUrl(store) {
  const foto = store.fotos?.[0];
  if (!foto) return null;
  const url = foto.url_foto || foto.url;
  return resolveFileUrl(url) || null;
}

export default function MyStoresPage() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [ratingsModal, setRatingsModal] = useState({ open: false, store: null, ratings: [], loading: false });
  const [approvalModal, setApprovalModal] = useState({ open: false, status: null, nombre_tienda: '', motivo: null });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODAS');

  const loadStores = async (signal) => {
    setLoading(true);
    try {
      // Solo propagar el signal si es un AbortSignal real — evita que un event handler
      // (que pasa SyntheticEvent como primer arg) lo corrompa y axios falle.
      const opts = (typeof AbortSignal !== 'undefined' && signal instanceof AbortSignal)
        ? { signal }
        : undefined;
      const { data } = await sellerService.getMyStores(opts);
      setStores(data?.data || []);
    } catch (err) {
      if (err.name !== 'CanceledError') {
        toast.error('Error al cargar tiendas. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadStores(controller.signal);
    return () => controller.abort();
  }, []);

  // Actualizar ratings en tiempo real cuando un comprador califica
  useSSEListener(['rating.store.new'], async (data) => {
    if (ratingsModal.open && ratingsModal.store && data?.id_tienda === ratingsModal.store.id) {
      try {
        const { data: res } = await marketplaceService.getStoreRatings(ratingsModal.store.id);
        setRatingsModal((prev) => ({ ...prev, ratings: res?.data || [] }));
      } catch {}
    }
  });

  // Actualizar en tiempo real cuando admin aprueba/rechaza tienda
  useSSEListener(['approval.store.approved', 'approval.store.rejected', 'approval.store.updated'], (data) => {
    loadStores();
    if (data?.status === 'APROBADO' || data?.status === 'RECHAZADO') {
      setApprovalModal({
        open: true,
        status: data.status,
        nombre_tienda: data.nombre_tienda || '',
        motivo: data.motivo || null,
      });
    }
  });

  const handleDelete = async (store) => {
    if (!window.confirm(`¿Eliminar la tienda "${store.nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(store.id);
    try {
      await sellerService.deleteStore(store.id);
      toast.success('Tienda eliminada');
      loadStores();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    } finally {
      setDeleting(null);
    }
  };

  const handleViewRatings = async (store) => {
    setRatingsModal({ open: true, store, ratings: [], loading: true });
    try {
      const { data } = await marketplaceService.getStoreRatings(store.id);
      setRatingsModal((prev) => ({ ...prev, ratings: data?.data || [], loading: false }));
    } catch {
      setRatingsModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Apply search + status filter
  const searchLower = search.toLowerCase().trim();
  const filtered = stores.filter((s) => {
    if (statusFilter !== 'TODAS' && s.estado_aprobacion !== statusFilter) return false;
    if (searchLower && !s.nombre.toLowerCase().includes(searchLower)) return false;
    return true;
  });

  const activeStores = filtered.filter((s) => s.estado_aprobacion === 'APROBADO');
  const pendingStores = filtered.filter((s) => s.estado_aprobacion === 'PENDIENTE');
  const rejectedStores = filtered.filter((s) => s.estado_aprobacion === 'RECHAZADO');

  // Counts from unfiltered data for the counter bar
  const totalActive = stores.filter((s) => s.estado_aprobacion === 'APROBADO').length;
  const totalPending = stores.filter((s) => s.estado_aprobacion === 'PENDIENTE').length;
  const totalRejected = stores.filter((s) => s.estado_aprobacion === 'RECHAZADO').length;

  const STATUS_FILTERS = [
    { key: 'TODAS', label: 'Todas' },
    { key: 'APROBADO', label: 'Activas' },
    { key: 'PENDIENTE', label: 'Pendientes' },
    { key: 'RECHAZADO', label: 'Rechazadas' },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in pb-24">
      {/* Counter bar */}
      <div className="card rounded-xl shadow-card mb-3 py-0">
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          <div className="text-center py-1.5">
            <p className="text-base font-display font-bold leading-tight text-primary-600">{totalActive}</p>
            <p className="text-[10px] text-gray-500">Activas</p>
          </div>
          <div className="text-center py-1.5">
            <p className="text-base font-display font-bold leading-tight text-warning-500">{totalPending}</p>
            <p className="text-[10px] text-gray-500">Pendientes</p>
          </div>
          <div className="text-center py-1.5">
            <p className="text-base font-display font-bold leading-tight text-red-500">{totalRejected}</p>
            <p className="text-[10px] text-gray-500">Rechazadas</p>
          </div>
        </div>
      </div>

      {/* Search + filters */}
      <div className="space-y-2 mb-3">
        <div className="relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tienda por nombre..."
            className="w-full pl-9 pr-9 py-2 text-sm bg-surface border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 transition-shadow"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <HiOutlineX className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-colors ${
                statusFilter === f.key
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {stores.length === 0 ? (
        <EmptyState
          icon={HiOutlineOfficeBuilding}
          title="Sin tiendas"
          description="Crea tu primera tienda para empezar a vender"
          action={
            <button
              onClick={() => navigate('/vendedor/tiendas/nueva')}
              className="btn-primary text-sm rounded-xl px-6"
            >
              <HiOutlinePlus className="w-4 h-4 mr-1.5 inline" />
              Nueva Tienda
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-10">
          <HiOutlineSearch className="w-12 h-12 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No se encontraron tiendas</p>
          <button onClick={() => { setSearch(''); setStatusFilter('TODAS'); }} className="text-xs text-primary-600 hover:text-primary-700 font-medium mt-1">
            Limpiar filtros
          </button>
        </div>
      ) : (
        <>
          {/* Active stores section */}
          {activeStores.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
                MIS TIENDAS ACTIVAS
              </h2>
              <div className="space-y-3">
                {activeStores.map((store) => (
                  <ActiveStoreCard
                    key={store.id}
                    store={store}
                    onEdit={() => navigate(`/vendedor/tiendas/${store.id}`)}
                    onDelete={() => handleDelete(store)}
                    onRatings={() => handleViewRatings(store)}
                    deleting={deleting === store.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pending stores section */}
          {pendingStores.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
                SOLICITUDES
              </h2>
              <div className="space-y-3">
                {pendingStores.map((store) => (
                  <PendingStoreCard
                    key={store.id}
                    store={store}
                    onDelete={() => handleDelete(store)}
                    onRefresh={loadStores}
                    deleting={deleting === store.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Rejected stores section */}
          {rejectedStores.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
                RECHAZADAS
              </h2>
              <div className="space-y-3">
                {rejectedStores.map((store) => (
                  <RejectedStoreCard
                    key={store.id}
                    store={store}
                    onEdit={() => navigate(`/vendedor/tiendas/${store.id}`)}
                    onDelete={() => handleDelete(store)}
                    deleting={deleting === store.id}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* FAB button */}
      <button
        onClick={() => navigate('/vendedor/tiendas/nueva')}
        className="fixed bottom-20 right-6 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-elevated flex items-center gap-2 px-5 py-3.5 transition-all duration-300 hover:scale-105 z-40"
      >
        <HiOutlinePlus className="w-5 h-5" />
        <span className="font-semibold text-sm">Nueva Tienda</span>
      </button>

      {/* Ratings Modal */}
      <RatingsModal
        open={ratingsModal.open}
        store={ratingsModal.store}
        ratings={ratingsModal.ratings}
        loading={ratingsModal.loading}
        onClose={() => setRatingsModal({ open: false, store: null, ratings: [], loading: false })}
      />

      {/* Approval Result Modal (SSE real-time) */}
      <ApprovalResultModal
        open={approvalModal.open}
        status={approvalModal.status}
        nombreTienda={approvalModal.nombre_tienda}
        motivo={approvalModal.motivo}
        onClose={() => setApprovalModal({ open: false, status: null, nombre_tienda: '', motivo: null })}
      />
    </div>
  );
}

/* ── Active Store Card ── */
function ActiveStoreCard({ store, onEdit, onDelete, onRatings, deleting }) {
  const imageUrl = getStoreImageUrl(store);
  const galeria = store.tbl_galerias;
  const galeriaName = galeria?.nombre || '';
  const direccion = galeria?.direccion || '';
  const ciudad = galeria?.tbl_ciudades?.nombre || '';

  const fullLocation = [galeriaName, store.numero_local ? `Stand ${store.numero_local}` : '', direccion, ciudad]
    .filter(Boolean)
    .join(', ');

  const sub = store.suscripcion_activa;
  const subLabel = sub
    ? `${sub.tipo_plan === 'PREMIUM' ? 'Premium' : 'Estándar'} ${sub.estado === 'ACTIVE' ? 'activa' : 'expirada'}`
    : null;
  const subActive = sub?.estado === 'ACTIVE';

  return (
    <div className="card rounded-2xl shadow-card overflow-hidden p-0">
      {/* Store image */}
      {imageUrl ? (
        <div className="w-full h-32 bg-gray-100">
          <img src={imageUrl} alt={store.nombre} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <HiOutlineOfficeBuilding className="w-12 h-12 text-gray-300" />
        </div>
      )}

      <div className="px-3 py-2.5">
        {/* Name + badge */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-display font-bold text-gray-900 truncate">{store.nombre}</h3>
          {store.activo ? (
            <span className="inline-flex items-center gap-1 bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2">
              <HiOutlineCheckCircle className="w-3 h-3" />
              Activa
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2">
              <HiOutlineExclamation className="w-3 h-3" />
              Deshabilitada
            </span>
          )}
        </div>

        {/* Subscription status */}
        <div className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full mb-1.5 ${
          subActive
            ? 'bg-green-50 text-green-600'
            : sub
              ? 'bg-warning-50 text-warning-600'
              : 'bg-gray-100 text-gray-500'
        }`}>
          <HiOutlineClock className="w-3 h-3" />
          {subLabel || 'Sin suscripción'}
        </div>

        {/* Disabled by admin notice */}
        {!store.activo && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 mb-1.5">
            <p className="text-[11px] text-red-700">
              Tu tienda ha sido deshabilitada por el administrador y no es visible para los compradores.
            </p>
          </div>
        )}

        {/* Product count */}
        <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
          <HiOutlineShoppingBag className="w-3.5 h-3.5 text-primary-400 shrink-0" />
          <span><span className="font-semibold text-gray-800">{store._count?.productos ?? 0}</span> producto{(store._count?.productos ?? 0) !== 1 ? 's' : ''}</span>
        </div>

        {/* Location info */}
        <div className="space-y-0.5 mt-1">
          {galeriaName && (
            <div className="flex items-start gap-1.5 text-xs text-gray-600">
              <HiOutlineOfficeBuilding className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
              <span>{galeriaName}{store.numero_local ? ` - Stand ${store.numero_local}` : ''}</span>
            </div>
          )}
          {fullLocation && (
            <div className="flex items-start gap-1.5 text-xs text-gray-500">
              <HiOutlineLocationMarker className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
              <span className="line-clamp-2">{fullLocation}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-gray-100">
          <button
            onClick={onRatings}
            className="w-8 h-8 rounded-lg bg-warning-50 hover:bg-warning-100 flex items-center justify-center transition-colors"
            title="Calificaciones"
          >
            <HiOutlineStar className="w-4 h-4 text-warning-500" />
          </button>
          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-lg bg-primary-50 hover:bg-primary-100 flex items-center justify-center transition-colors"
            title="Editar"
          >
            <HiOutlinePencil className="w-4 h-4 text-primary-600" />
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-50"
            title="Eliminar"
          >
            <HiOutlineTrash className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Pending Store Card ── */
function PendingStoreCard({ store, onDelete, onRefresh, deleting }) {
  const imageUrl = getStoreImageUrl(store);
  const galeria = store.tbl_galerias;
  const galeriaName = galeria?.nombre || '';
  const direccion = galeria?.direccion || '';

  const fechaEnvio = store.fecha_creacion
    ? new Date(store.fecha_creacion).toLocaleDateString('es-PE', { day: 'numeric', month: 'numeric', year: 'numeric' })
    : '';

  return (
    <div className="card rounded-2xl shadow-card overflow-hidden p-0">
      {/* Store image */}
      {imageUrl ? (
        <div className="w-full h-32 bg-gray-100">
          <img src={imageUrl} alt={store.nombre} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-full h-32 bg-gradient-to-br from-warning-50 to-warning-100 flex items-center justify-center">
          <HiOutlineOfficeBuilding className="w-12 h-12 text-warning-300" />
        </div>
      )}

      <div className="px-3 py-2.5">
      <h3 className="text-base font-display font-bold text-gray-900 mb-1">{store.nombre}</h3>

      {galeriaName && (
        <p className="text-xs text-gray-600 mb-0.5">
          <span className="font-semibold text-gray-700">Galería:</span> {galeriaName}
        </p>
      )}
      {direccion && (
        <p className="text-xs text-gray-600 mb-2">
          <span className="font-semibold text-gray-700">Dirección:</span> {direccion}
        </p>
      )}

      {/* Pending info box */}
      <div className="bg-warning-50 border border-warning-200 rounded-xl p-3 mb-2">
        <p className="text-xs text-warning-700">
          Tu solicitud está siendo revisada. Te notificaremos pronto.
        </p>
        <button
          onClick={() => onRefresh()}
          className="flex items-center gap-1 mt-1.5 text-xs font-semibold text-warning-600 hover:text-warning-700 transition-colors"
        >
          <HiOutlineRefresh className="w-3.5 h-3.5" />
          Verificar Estado
        </button>
      </div>

      {fechaEnvio && (
        <div className="flex items-center gap-1 text-[11px] text-gray-400 mb-2">
          <HiOutlineClock className="w-3 h-3" />
          Enviado: {fechaEnvio}
        </div>
      )}

      <div className="flex justify-end pt-1.5 border-t border-gray-100">
        <button
          onClick={onDelete}
          disabled={deleting}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
        >
          <HiOutlineTrash className="w-3.5 h-3.5" />
          Eliminar
        </button>
      </div>
      </div>
    </div>
  );
}

/* ── Rejected Store Card ── */
function RejectedStoreCard({ store, onEdit, onDelete, deleting }) {
  const imageUrl = getStoreImageUrl(store);
  const galeria = store.tbl_galerias;
  const galeriaName = galeria?.nombre || '';

  return (
    <div className="card rounded-2xl shadow-card border-l-4 border-red-400 overflow-hidden p-0">
      {/* Store image */}
      {imageUrl ? (
        <div className="w-full h-32 bg-gray-100">
          <img src={imageUrl} alt={store.nombre} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-full h-32 bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
          <HiOutlineOfficeBuilding className="w-12 h-12 text-red-200" />
        </div>
      )}

      <div className="px-3 py-2.5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-display font-bold text-gray-900 truncate">{store.nombre}</h3>
        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full shrink-0 ml-2">Rechazada</span>
      </div>

      {galeriaName && (
        <p className="text-xs text-gray-600 mb-1.5">
          <span className="font-semibold text-gray-700">Galería:</span> {galeriaName}
        </p>
      )}

      {store.motivo_rechazo && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 mb-2">
          <p className="text-[11px] font-semibold text-red-600 mb-0.5">Motivo de rechazo:</p>
          <p className="text-xs text-red-700">{store.motivo_rechazo}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-gray-100">
        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          <HiOutlinePencil className="w-3.5 h-3.5" />
          Editar y reenviar
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
        >
          <HiOutlineTrash className="w-3.5 h-3.5" />
          Eliminar
        </button>
      </div>
      </div>
    </div>
  );
}

/* ── Ratings Modal ── */
function RatingsModal({ open, store, ratings, loading, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="" maxWidth="max-w-md">
      {/* Custom purple header */}
      <div className="-m-4">
        <div className="gradient-primary rounded-t-2xl px-6 py-5 text-center pr-12">
          <h3 className="text-lg font-display font-bold text-white">
            Calificaciones{store ? ` - ${store.nombre}` : ''}
          </h3>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : ratings.length === 0 ? (
            <div className="text-center py-10">
              <HiOutlineStar className="w-16 h-16 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Sin calificaciones aún</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {ratings.map((r, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      s <= r.estrellas
                        ? <HiStar key={s} className="w-4 h-4 text-yellow-400" />
                        : <HiOutlineStar key={s} className="w-4 h-4 text-gray-300" />
                    ))}
                  </div>
                  {r.comentario && <p className="text-sm text-gray-600">{r.comentario}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {r.autor || 'Anónimo'} · {r.fecha ? new Date(r.fecha).toLocaleDateString('es-PE') : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="px-8 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ── Approval Result Modal (SSE real-time) ── */
function ApprovalResultModal({ open, status, nombreTienda, motivo, onClose }) {
  const isApproved = status === 'APROBADO';

  return (
    <Modal open={open} onClose={onClose} title="" maxWidth="max-w-sm">
      <div className="-m-4">
        <div className={`rounded-t-2xl px-6 py-6 text-center pr-12 ${isApproved ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
          {isApproved ? (
            <HiOutlineCheckCircle className="w-14 h-14 text-white mx-auto mb-2" />
          ) : (
            <HiOutlineExclamation className="w-14 h-14 text-white mx-auto mb-2" />
          )}
          <h3 className="text-lg font-display font-bold text-white">
            {isApproved ? 'Tienda Aprobada' : 'Tienda Rechazada'}
          </h3>
        </div>
        <div className="p-6 text-center">
          {isApproved ? (
            <>
              <p className="text-sm text-gray-700 mb-1">
                Tu tienda <span className="font-bold text-gray-900">{nombreTienda}</span> ha sido aprobada.
              </p>
              <p className="text-xs text-gray-500">
                Ya se encuentra visible para los compradores. Agrega productos para empezar a vender.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-700 mb-2">
                Tu tienda <span className="font-bold text-gray-900">{nombreTienda}</span> no fue aprobada.
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Revisa nuestras recomendaciones y vuelve a enviarla.
              </p>
              {motivo && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-left">
                  <p className="text-[11px] font-semibold text-red-600 mb-0.5">Motivo:</p>
                  <p className="text-xs text-red-700">{motivo}</p>
                </div>
              )}
            </>
          )}
          <button
            onClick={onClose}
            className={`mt-5 px-8 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isApproved
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Entendido
          </button>
        </div>
      </div>
    </Modal>
  );
}
