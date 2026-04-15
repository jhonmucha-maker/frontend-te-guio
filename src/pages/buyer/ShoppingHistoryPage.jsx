import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { buyerService } from '../../services/buyerService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { resolveFileUrl } from '../../utils/constants';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import StarRating from '../../components/ui/StarRating';
import Pagination from '../../components/ui/Pagination';
import toast from 'react-hot-toast';
import {
  HiOutlineClipboardList,
  HiOutlineSearch,
  HiOutlineStar,
  HiStar,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineShoppingBag,
  HiOutlineX,
} from 'react-icons/hi';
import { HiOutlineBuildingStorefront } from 'react-icons/hi2';

/* ------------------------------------------------------------------ */
/*  Filter chip IDs                                                    */
/* ------------------------------------------------------------------ */
const FILTER_RATE_PRODUCT = 'rate_product';
const FILTER_RATE_STORE = 'rate_store';
const FILTER_ALREADY_RATED = 'already_rated';

/* ------------------------------------------------------------------ */
/*  Helper: count pending ratings for a list                           */
/* ------------------------------------------------------------------ */
function countPendingRatings(list) {
  let count = 0;
  for (const item of list.items || []) {
    if (item.id_producto && !item.calificado_producto) count++;
    if (item.id_tienda && !item.calificado_tienda) count++;
  }
  return count;
}

/* ------------------------------------------------------------------ */
/*  Helper: compute total for a list                                   */
/* ------------------------------------------------------------------ */
function computeTotal(list) {
  return (
    list.items
      ?.filter((i) => i.snapshot_precio && i.tbl_productos?.precio_visible !== false)
      .reduce((sum, i) => sum + parseFloat(i.snapshot_precio) * (i.cantidad || 1), 0) || 0
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function ShoppingHistoryPage() {
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingTarget, setRatingTarget] = useState(null); // { type: 'product'|'store', item }
  const [ratingForm, setRatingForm] = useState({ estrellas: 0, comentario: '' });
  const [submittingRating, setSubmittingRating] = useState(false);

  // Lightbox state
  const [lightboxImg, setLightboxImg] = useState(null);

  /* ---------------------------------------------------------------- */
  /*  Load history                                                     */
  /* ---------------------------------------------------------------- */
  const loadHistory = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p };
      if (appliedQuery) params.q = appliedQuery;

      const { data } = await buyerService.getShoppingHistory(params);
      setLists(data.data || data);
      setPagination(data.pagination || null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [appliedQuery]);

  useEffect(() => {
    loadHistory(page);
  }, [page, loadHistory]);

  /* ---------------------------------------------------------------- */
  /*  Client-side filtering by chip                                    */
  /* ---------------------------------------------------------------- */
  const filteredLists = useMemo(() => {
    if (!activeFilter) return lists;

    return lists
      .map((list) => {
        const filtered = (list.items || []).filter((item) => {
          if (activeFilter === FILTER_RATE_PRODUCT)
            return item.id_producto && !item.calificado_producto;
          if (activeFilter === FILTER_RATE_STORE)
            return item.id_tienda && !item.calificado_tienda;
          if (activeFilter === FILTER_ALREADY_RATED)
            return item.calificado_producto || item.calificado_tienda;
          return true;
        });
        return { ...list, items: filtered };
      })
      .filter((list) => list.items.length > 0);
  }, [lists, activeFilter]);

  /* ---------------------------------------------------------------- */
  /*  Handlers                                                         */
  /* ---------------------------------------------------------------- */
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedQuery(searchQuery);
  };

  const toggleFilter = (filterId) => {
    setActiveFilter((prev) => (prev === filterId ? null : filterId));
  };

  const toggleExpand = (listId) => {
    setExpandedId((prev) => (prev === listId ? null : listId));
  };

  const openRatingModal = (type, item) => {
    setRatingTarget({ type, item });
    setRatingForm({ estrellas: 0, comentario: '' });
    setShowRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (ratingForm.estrellas === 0) {
      toast.error('Seleccione una estrellas');
      return;
    }
    setSubmittingRating(true);
    try {
      if (ratingTarget.type === 'product') {
        await buyerService.rateProduct({
          id_producto: ratingTarget.item.id_producto,
          estrellas: ratingForm.estrellas,
          comentario: ratingForm.comentario,
        });
      } else {
        await buyerService.rateStore({
          id_tienda: ratingTarget.item.id_tienda,
          estrellas: ratingForm.estrellas,
          comentario: ratingForm.comentario,
        });
      }
      toast.success('Calificacion enviada');
      setShowRatingModal(false);
      loadHistory(page);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al calificar');
    } finally {
      setSubmittingRating(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Filter chip definitions                                          */
  /* ---------------------------------------------------------------- */
  const filterChips = [
    {
      id: FILTER_RATE_PRODUCT,
      label: 'Calificar producto',
      icon: HiOutlineStar,
      activeIcon: HiStar,
      color: 'amber',
      activeBg: 'bg-amber-50 border-amber-300 text-amber-700',
      inactiveBg: 'bg-surface border-gray-200 text-gray-600 hover:border-gray-300',
      iconActive: 'text-amber-500',
      iconInactive: 'text-amber-400',
    },
    {
      id: FILTER_RATE_STORE,
      label: 'Calificar tienda',
      icon: HiOutlineBuildingStorefront,
      activeIcon: HiOutlineBuildingStorefront,
      color: 'seller',
      activeBg: 'bg-seller-50 border-seller-300 text-seller-700',
      inactiveBg: 'bg-surface border-gray-200 text-gray-600 hover:border-gray-300',
      iconActive: 'text-seller-500',
      iconInactive: 'text-seller-400',
    },
    {
      id: FILTER_ALREADY_RATED,
      label: 'Ya calificado',
      icon: HiStar,
      activeIcon: HiStar,
      color: 'primary',
      activeBg: 'bg-primary-50 border-primary-300 text-primary-700',
      inactiveBg: 'bg-surface border-gray-200 text-gray-600 hover:border-gray-300',
      iconActive: 'text-primary-500',
      iconInactive: 'text-primary-400',
    },
  ];

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div className="animate-fade-in pb-6">
      {/* Filter Chips Row */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {filterChips.map((chip) => {
          const isActive = activeFilter === chip.id;
          const IconComp = isActive ? chip.activeIcon : chip.icon;
          return (
            <button
              key={chip.id}
              onClick={() => toggleFilter(chip.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                isActive ? chip.activeBg : chip.inactiveBg
              }`}
            >
              <IconComp className={`w-4 h-4 ${isActive ? chip.iconActive : chip.iconInactive}`} />
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar producto, tienda o galeria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-surface rounded-2xl shadow-card border border-gray-100/80 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
          />
        </div>
      </form>

      {/* Content */}
      {loading ? (
        <LoadingSpinner />
      ) : filteredLists.length === 0 ? (
        <EmptyState
          icon={HiOutlineClipboardList}
          title={activeFilter ? 'Sin resultados para este filtro' : 'Sin historial'}
          description={
            activeFilter
              ? 'Prueba cambiando el filtro o realizando una busqueda diferente'
              : 'Las compras completadas apareceran aqui'
          }
        />
      ) : (
        <>
          <div className="space-y-4">
            {filteredLists.map((list) => {
              const isExpanded = expandedId === list.id;
              const pending = countPendingRatings(list);
              const total = computeTotal(list);
              const itemCount = list.items?.length || 0;

              return (
                <div key={list.id} className="animate-slide-up">
                  {/* Purple Date Header Card */}
                  <button
                    onClick={() => toggleExpand(list.id)}
                    className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-card hover:shadow-card-hover transition-all duration-200"
                  >
                    {/* Left: icon + date + count */}
                    <div className="bg-white/15 rounded-xl p-2 flex-shrink-0">
                      <HiOutlineShoppingBag className="w-5 h-5" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-bold font-display">
                        {formatDate(list.completada_en || list.fecha_hora_registro)}
                      </p>
                      <p className="text-xs text-white/70">
                        {itemCount} producto{itemCount !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Center-right: total */}
                    <span className="text-sm font-bold text-seller-200 font-display flex-shrink-0">
                      {formatCurrency(total)}
                    </span>

                    {/* Right: pending badge + chevron */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {pending > 0 && (
                        <span className="bg-amber-400 text-amber-900 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {pending}
                        </span>
                      )}
                      {isExpanded ? (
                        <HiOutlineChevronUp className="w-5 h-5 text-white/60" />
                      ) : (
                        <HiOutlineChevronDown className="w-5 h-5 text-white/60" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Items */}
                  {isExpanded && (
                    <div className="mt-2 bg-surface rounded-2xl shadow-card border border-gray-100/80 overflow-hidden animate-slide-up">
                      <div className="divide-y divide-gray-50">
                        {list.items?.map((item) => {
                          const productName =
                            item.tbl_productos?.nombre || item.texto_manual || 'Producto';
                          const photo = resolveFileUrl(item.tbl_productos?.fotos?.[0]?.url);
                          const storeName = item.nombre_tienda || 'Tienda';
                          const galleryName = item.nombre_galeria || '';
                          const subtitle = [storeName, galleryName]
                            .filter(Boolean)
                            .join(' \u00B7 ');
                          const price =
                            parseFloat(item.snapshot_precio || 0) * (item.cantidad || 1);
                          const canRateProduct =
                            item.id_producto && !item.calificado_producto;
                          const canRateStore =
                            item.id_tienda && !item.calificado_tienda;
                          const isFullyRated =
                            item.calificado_producto && item.calificado_tienda;

                          return (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 px-4 py-3.5"
                            >
                              {/* Product Image */}
                              <div
                                className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
                                onClick={() => photo && setLightboxImg(photo)}
                              >
                                {photo ? (
                                  <img
                                    src={photo}
                                    alt={productName}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <HiOutlineShoppingBag className="w-5 h-5 text-gray-300" />
                                  </div>
                                )}
                              </div>

                              {/* Product Info (clickable → detail) */}
                              <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => {
                                  if (!item.id_producto) return;
                                  const prod = item.tbl_productos;
                                  if (!prod || prod.eliminado_en || prod.estado !== 'ACTIVE') {
                                    toast('Este producto ya no se encuentra habilitado', { icon: 'ℹ️' });
                                    return;
                                  }
                                  navigate(`/comprador/productos/${item.id_producto}`);
                                }}
                              >
                                <p className="text-sm font-semibold text-gray-900 font-display truncate">
                                  {productName}
                                  {item.cantidad > 1 && (
                                    <span className="text-gray-400 font-normal">
                                      {' '}
                                      x{item.cantidad}
                                    </span>
                                  )}
                                </p>
                                {subtitle && (
                                  <p className="text-xs text-gray-400 truncate mt-0.5">
                                    {subtitle}
                                  </p>
                                )}
                                {item.snapshot_precio && item.tbl_productos?.precio_visible !== false && (
                                  <p className="text-xs font-bold text-seller-500 mt-1">
                                    {formatCurrency(price)}
                                  </p>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {isFullyRated ? (
                                  <span className="p-2 rounded-full bg-primary-50 border border-primary-200/60 text-primary-500" title="Ya calificado">
                                    <HiStar className="w-4 h-4" />
                                  </span>
                                ) : (
                                  <>
                                    {canRateProduct && (
                                      <button
                                        onClick={() =>
                                          openRatingModal('product', item)
                                        }
                                        className="p-2 rounded-full border border-amber-200 text-amber-500 hover:bg-amber-50 hover:border-amber-300 transition-colors"
                                        title="Calificar producto"
                                      >
                                        <HiOutlineStar className="w-4 h-4" />
                                      </button>
                                    )}
                                    {canRateStore && (
                                      <button
                                        onClick={() =>
                                          openRatingModal('store', item)
                                        }
                                        className="p-2 rounded-full border border-primary-200 text-primary-500 hover:bg-primary-50 hover:border-primary-300 transition-colors"
                                        title="Calificar tienda"
                                      >
                                        <HiOutlineBuildingStorefront className="w-4 h-4" />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* List Total Footer */}
                      <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {list.items?.length || 0} item{(list.items?.length || 0) !== 1 ? 's' : ''}
                        </span>
                        <span className="text-sm font-bold text-primary-600 font-display">
                          Total: {formatCurrency(total)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination && (
            <Pagination
              page={page}
              totalPages={pagination.pages || 1}
              onPageChange={(p) => setPage(p)}
            />
          )}
        </>
      )}

      {/* Rating Modal */}
      <Modal
        open={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        title={
          ratingTarget?.type === 'product'
            ? 'Calificar producto'
            : 'Calificar tienda'
        }
      >
        <div className="space-y-5">
          {/* Target info */}
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
            {ratingTarget?.type === 'product' ? (
              <>
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <HiOutlineStar className="w-5 h-5 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 font-display truncate">
                    {ratingTarget?.item?.tbl_productos?.nombre ||
                      ratingTarget?.item?.texto_manual ||
                      'Producto'}
                  </p>
                  <p className="text-xs text-gray-400">Producto</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <HiOutlineBuildingStorefront className="w-5 h-5 text-primary-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 font-display truncate">
                    {ratingTarget?.item?.nombre_tienda || 'Tienda'}
                  </p>
                  <p className="text-xs text-gray-400">Tienda</p>
                </div>
              </>
            )}
          </div>

          {/* Star Rating */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-gray-500">Seleccione su estrellas</p>
            <StarRating
              value={ratingForm.estrellas}
              onChange={(v) => setRatingForm({ ...ratingForm, estrellas: v })}
              size="lg"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Comentario (opcional)
            </label>
            <textarea
              value={ratingForm.comentario}
              onChange={(e) =>
                setRatingForm({ ...ratingForm, comentario: e.target.value })
              }
              className="input-field text-sm"
              rows={3}
              placeholder="Comparte tu experiencia..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowRatingModal(false)}
              className="btn-secondary flex-1 text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmitRating}
              disabled={submittingRating || ratingForm.estrellas === 0}
              className="btn-primary flex-1 text-sm disabled:opacity-50"
            >
              {submittingRating ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Fullscreen Image Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black flex flex-col"
          onClick={() => setLightboxImg(null)}
        >
          <div className="flex items-center justify-end px-4 py-3 flex-shrink-0">
            <button
              onClick={() => setLightboxImg(null)}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <HiOutlineX className="w-6 h-6" />
            </button>
          </div>
          <div
            className="flex-1 flex items-center justify-center px-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImg}
              alt="Producto"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
