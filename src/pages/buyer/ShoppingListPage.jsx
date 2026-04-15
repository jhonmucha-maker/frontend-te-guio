import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';
import { buyerService } from '../../services/buyerService';
import { catalogService } from '../../services/catalogService';
import { formatCurrency } from '../../utils/formatters';
import { openExternal } from '../../utils/navigation';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';
import {
  HiOutlineClipboardList,
  HiOutlineLocationMarker,
  HiOutlinePlus,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineBookmark,
  HiStar,
  HiOutlineViewGrid,
  HiOutlineOfficeBuilding,
} from 'react-icons/hi';

// ---------- helpers ----------

const STAR_LABELS = [
  { text: 'Muy malo', color: 'text-red-500' },
  { text: 'Malo', color: 'text-orange-500' },
  { text: 'Regular', color: 'text-amber-500' },
  { text: 'Bueno', color: 'text-emerald-500' },
  { text: 'Muy bueno', color: 'text-green-600' },
];

function groupItemsByZone(items, zoneMap) {
  const zones = {};
  items.forEach((item) => {
    let zoneName = 'SIN ZONA';

    if (item.tipo === 'PRODUCT' && item.producto) {
      const tienda = item.producto.tienda;
      const galeria = tienda?.galeria;
      const zona = galeria?.zona;
      zoneName = zona?.nombre?.toUpperCase() || 'SIN ZONA';

      const galName = galeria?.nombre || 'Sin galeria';
      const storeName = tienda?.nombre || 'Sin tienda';
      const storeId = tienda?.id || 0;

      if (!zones[zoneName]) zones[zoneName] = { name: zoneName, galleries: {}, items: [] };
      if (!zones[zoneName].galleries[galName]) zones[zoneName].galleries[galName] = { name: galName, stores: {} };
      if (!zones[zoneName].galleries[galName].stores[storeId])
        zones[zoneName].galleries[galName].stores[storeId] = { name: storeName, id: storeId, items: [] };

      zones[zoneName].galleries[galName].stores[storeId].items.push(item);
      zones[zoneName].items.push(item);
      return;
    }

    // MANUAL items — resolve zone name from snapshot_id_zona if available
    if (item.snapshot_id_zona && zoneMap[item.snapshot_id_zona]) {
      zoneName = zoneMap[item.snapshot_id_zona].toUpperCase();
    }

    if (!zones[zoneName]) zones[zoneName] = { name: zoneName, galleries: {}, items: [] };
    if (!zones[zoneName].galleries['__manual__'])
      zones[zoneName].galleries['__manual__'] = { name: null, stores: {}, manualItems: [] };
    zones[zoneName].galleries['__manual__'].manualItems = zones[zoneName].galleries['__manual__'].manualItems || [];
    zones[zoneName].galleries['__manual__'].manualItems.push(item);
    zones[zoneName].items.push(item);
  });

  return zones;
}

// ---------- component ----------

export default function ShoppingListPage() {
  const { usuario } = useAuth();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add manual item inline
  const [newItemName, setNewItemName] = useState('');
  const [selectedZone, setSelectedZone] = useState(null); // { id, nombre } or null
  const [showZoneSelector, setShowZoneSelector] = useState(false);
  const [catalogZones, setCatalogZones] = useState([]);

  // Congratulations modal
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [pendingCongrats, setPendingCongrats] = useState(false);

  // Rating flow — single modal with product + store
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingPayload, setRatingPayload] = useState(null);
  const [productRating, setProductRating] = useState({ estrellas: 0, comentario: '' });
  const [storeRating, setStoreRating] = useState({ estrellas: 0, comentario: '' });
  const [submittingRating, setSubmittingRating] = useState(false);

  const inputRef = useRef(null);

  // ---- load catalog zones for manual items ----
  useEffect(() => {
    if (usuario?.id_ciudad) {
      catalogService.getZones(usuario.id_ciudad)
        .then((r) => setCatalogZones(r.data?.data || []))
        .catch(() => setCatalogZones([]));
    }
  }, [usuario?.id_ciudad]);

  // ---- data loading ----
  useEffect(() => {
    loadList();
  }, []);

  const loadList = async () => {
    setLoading(true);
    try {
      const { data } = await buyerService.getShoppingList();
      setList(data.data || data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const items = useMemo(() => list?.items || [], [list]);
  const total = list?.total_estimado || 0;
  const completedCount = items.filter((i) => i.comprado).length;
  const totalCount = items.length;

  // grouped data
  const zoneMap = useMemo(() => {
    const map = {};
    catalogZones.forEach((z) => { map[z.id] = z.nombre; });
    return map;
  }, [catalogZones]);
  const groupedZones = useMemo(() => groupItemsByZone(items, zoneMap), [items, zoneMap]);
  // ---- add manual item ----
  const handleAddManualItem = async () => {
    const name = newItemName.trim();
    if (!name) return;
    try {
      const payload = {
        tipo: 'MANUAL',
        texto_manual: name,
        cantidad: 1,
      };
      if (selectedZone?.id) payload.zone_id = selectedZone.id;
      await buyerService.addShoppingItem(payload);
      toast.success('Item agregado');
      setNewItemName('');
      loadList();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al agregar');
    }
  };

  // ---- quantity update ----
  const handleQuantityChange = async (item, delta) => {
    const newQty = Math.max(1, (item.cantidad || 1) + delta);
    try {
      await buyerService.updateShoppingItem(item.id, { cantidad: newQty });
      // Optimistic update: recalcular total_estimado completo desde items
      setList((prev) => {
        const newItems = prev.items.map((i) => (i.id === item.id ? { ...i, cantidad: newQty } : i));
        const newTotal = newItems
          .filter(i => i.tipo === 'PRODUCT' && i.precio_snapshot && i.producto?.precio_visible !== false)
          .reduce((sum, i) => sum + parseFloat(i.precio_snapshot) * i.cantidad, 0);
        return { ...prev, items: newItems, total_estimado: newTotal };
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar');
    }
  };

  // ---- toggle purchased (mark / unmark) ----
  const handleTogglePurchased = async (item) => {
    if (item.comprado) {
      // UNMARK — revert purchase and delete today's ratings
      try {
        await buyerService.unmarkPurchased(item.id);
        loadList();
      } catch (err) {
        toast.error(err.response?.data?.error || 'Error al desmarcar');
      }
      return;
    }

    // MARK as purchased
    try {
      const { data } = await buyerService.markPurchased(item.id);

      // Check if all items are now purchased (this was the last one)
      const allPurchased = items.every((i) => i.id === item.id || i.comprado);

      // Open rating modal if this is a PRODUCT item with rating_payload
      const rp = data.rating_payload;
      if (item.tipo === 'PRODUCT' && rp && (rp.product_id || rp.store_id)) {
        const payload = {
          product_id: rp.product_id,
          store_id: rp.store_id,
          productName: item.producto?.nombre || 'Producto',
          storeName: item.producto?.tienda?.nombre || '',
          puede_calificar_producto_hoy: rp.puede_calificar_producto_hoy,
          puede_calificar_tienda_hoy: rp.puede_calificar_tienda_hoy,
        };
        setRatingPayload(payload);
        setProductRating({ estrellas: 0, comentario: '' });
        setStoreRating({ estrellas: 0, comentario: '' });
        if (allPurchased) setPendingCongrats(true);
        setShowRatingModal(true);
      } else if (allPurchased) {
        setShowCongratsModal(true);
      }

      loadList();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  // ---- delete item ----
  const handleDelete = async (itemId) => {
    try {
      await buyerService.deleteShoppingItem(itemId);
      toast.success('Item eliminado');
      loadList();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  // ---- finalize list ----
  const handleFinalize = () => {
    // Mark all unchecked items or just show congrats
    setShowCongratsModal(true);
  };

  const handleContinueAfterCongrats = () => {
    setShowCongratsModal(false);
  };

  // ---- rating flow (single modal) ----
  const closeRatingModal = () => {
    setShowRatingModal(false);
    setRatingPayload(null);
    if (pendingCongrats) {
      setPendingCongrats(false);
      setShowCongratsModal(true);
    }
  };

  const handleRatingSave = async () => {
    if (submittingRating) return;
    setSubmittingRating(true);
    try {
      // Save product rating if applicable
      if (ratingPayload.puede_calificar_producto_hoy && productRating.estrellas > 0) {
        await buyerService.rateProduct({
          id_producto: ratingPayload.product_id,
          estrellas: productRating.estrellas,
          comentario: productRating.comentario,
        });
      }
      // Save store rating if applicable
      if (ratingPayload.puede_calificar_tienda_hoy && storeRating.estrellas > 0) {
        await buyerService.rateStore({
          id_tienda: ratingPayload.store_id,
          estrellas: storeRating.estrellas,
          comentario: storeRating.comentario,
        });
      }
      toast.success('Calificacion guardada');
      closeRatingModal();
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al calificar';
      toast.error(msg);
      if (err.response?.status === 429) {
        closeRatingModal();
      }
    } finally {
      setSubmittingRating(false);
    }
  };

  // ---- loading state ----
  if (loading) return <LoadingSpinner />;

  // ---- render ----
  return (
    <div className="animate-fade-in pb-28">
      {/* ====== TOP INPUT BAR ====== */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 -mx-4 mb-4 shadow-sm">
        <div className="flex items-center gap-2">
          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddManualItem();
            }}
            placeholder="Agregar articulo..."
            className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all"
          />

          {/* Zone selector button */}
          <div className="relative">
            <button
              onClick={() => setShowZoneSelector(!showZoneSelector)}
              className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              <HiOutlineLocationMarker className="w-4 h-4 text-primary-500" />
              <span className="text-xs font-medium truncate max-w-[80px]">{selectedZone?.nombre || 'Zona'}</span>
            </button>

            {/* Zone dropdown */}
            {showZoneSelector && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-surface rounded-xl shadow-elevated border border-gray-100 py-1 z-30 max-h-60 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedZone(null);
                    setShowZoneSelector(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 transition-colors ${
                    !selectedZone ? 'text-primary-600 font-semibold bg-primary-50/50' : 'text-gray-600'
                  }`}
                >
                  Sin zona
                </button>
                {catalogZones.map((z) => (
                  <button
                    key={z.id}
                    onClick={() => {
                      setSelectedZone({ id: z.id, nombre: z.nombre });
                      setShowZoneSelector(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 transition-colors ${
                      selectedZone?.id === z.id ? 'text-primary-600 font-semibold bg-primary-50/50' : 'text-gray-600'
                    }`}
                  >
                    {z.nombre}
                  </button>
                ))}
                {catalogZones.length === 0 && (
                  <p className="px-4 py-2 text-xs text-gray-400">No hay zonas disponibles</p>
                )}
              </div>
            )}
          </div>

          {/* Add button */}
          <button
            onClick={handleAddManualItem}
            disabled={!newItemName.trim()}
            className="w-10 h-10 rounded-full bg-gray-700 text-white flex items-center justify-center hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex-shrink-0"
          >
            <HiOutlinePlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ====== EMPTY STATE ====== */}
      {items.length === 0 ? (
        <EmptyState
          icon={HiOutlineClipboardList}
          title="Lista vacia"
          description="Agregue productos desde el marketplace o items manuales"
        />
      ) : (
        /* ====== GROUPED ITEMS ====== */
        <div className="space-y-5">
          {Object.values(groupedZones).map((zone) => (
            <div key={zone.name} className="space-y-3">
              {/* ---- ZONE HEADER ---- */}
              <div className="flex items-center justify-between bg-primary-600 rounded-xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <HiOutlineLocationMarker className="w-5 h-5 text-white" />
                  <span className="text-sm font-bold text-white tracking-wide">{zone.name}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-white/20 text-white text-xs font-bold flex items-center justify-center">
                    {zone.items.length}
                  </span>
                  <button className="text-white/80 hover:text-white transition-colors">
                    <HiOutlineBookmark className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* ---- GALLERIES ---- */}
              {Object.values(zone.galleries).map((gallery, gIdx) => (
                <div key={gallery.name || `manual-${gIdx}`} className="space-y-2">
                  {/* Gallery sub-header */}
                  {gallery.name && (
                    <div className="flex items-center gap-2.5 bg-rose-50 border-l-4 border-rose-400 rounded-r-lg px-4 py-2.5">
                      <HiOutlineViewGrid className="w-4 h-4 text-rose-500" />
                      <span className="text-xs text-gray-600">
                        Galeria: <span className="font-bold text-gray-800">{gallery.name}</span>
                      </span>
                    </div>
                  )}

                  {/* Stores inside gallery */}
                  {gallery.stores &&
                    Object.values(gallery.stores).map((store) => (
                      <div key={store.id} className="space-y-2">
                        {/* Store sub-header */}
                        <div className="flex items-center justify-between bg-green-50 border-l-4 border-green-400 rounded-r-lg px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <HiOutlineOfficeBuilding className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-gray-600">
                              Tienda: <span className="font-bold text-gray-800">{store.name}</span>
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 font-medium">({store.items.length})</span>
                        </div>

                        {/* Product items */}
                        {store.items.map((item) => (
                          <ProductItemCard
                            key={item.id}
                            item={item}
                            onTogglePurchased={handleTogglePurchased}
                            onDelete={handleDelete}
                            onQuantityChange={handleQuantityChange}
                          />
                        ))}
                      </div>
                    ))}

                  {/* Manual items (no gallery/store) */}
                  {gallery.manualItems &&
                    gallery.manualItems.map((item) => (
                      <ManualItemCard
                        key={item.id}
                        item={item}
                        onTogglePurchased={handleTogglePurchased}
                        onDelete={handleDelete}
                      />
                    ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ====== BOTTOM BAR ====== */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-100 shadow-elevated z-30">
          <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
            {/* Completed count */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-seller-100 text-seller-600 flex items-center justify-center">
                <HiOutlineCheck className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-gray-700">
                {completedCount}/{totalCount}
              </span>
            </div>

            {/* Total price */}
            <span className="text-lg font-bold text-seller-600 font-display">{formatCurrency(total)}</span>

            {/* Finalize button */}
            <button
              onClick={handleFinalize}
              className="w-10 h-10 rounded-xl bg-seller-500 text-white flex items-center justify-center hover:bg-seller-600 transition-colors shadow-sm"
              title="Finalizar compras"
            >
              <HiOutlineCheck className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ====== CONGRATULATIONS MODAL ====== */}
      {showCongratsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-surface rounded-2xl shadow-elevated w-full max-w-sm z-10 animate-slide-up">
            <div className="flex flex-col items-center py-10 px-6">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5">
                <HiOutlineCheck className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-green-500 font-display mb-2">Felicidades!</h2>
              <p className="text-sm text-gray-500 mb-8">Ha terminado sus compras</p>
              <button
                onClick={handleContinueAfterCongrats}
                className="px-12 bg-primary-600 text-white font-semibold py-3 rounded-xl hover:bg-primary-700 transition-colors text-sm"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== RATING MODAL (centered) ====== */}
      {showRatingModal && ratingPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={closeRatingModal} />

          <div
            className="relative bg-surface rounded-2xl shadow-elevated w-full max-w-md z-10 animate-slide-up overflow-y-auto"
            style={{ maxHeight: '85vh', WebkitOverflowScrolling: 'touch' }}
          >
            {/* Purple header */}
            <div className="gradient-primary px-5 py-4 rounded-t-2xl sticky top-0 z-10">
              <h3 className="text-base font-bold text-white text-center font-display">Calificar compra</h3>
            </div>

            <div className="p-5 space-y-4">
              {/* === PRODUCT SECTION === */}
              {ratingPayload.product_id && (
                <>
                  <p className="text-sm text-gray-700">
                    Producto: <span className="font-bold text-gray-900">{ratingPayload.productName}</span>
                  </p>

                  {ratingPayload.puede_calificar_producto_hoy ? (
                    <>
                      <div className="flex items-start justify-center gap-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setProductRating((f) => ({ ...f, estrellas: star }))}
                            className="flex flex-col items-center gap-1"
                          >
                            <HiStar
                              className={`w-9 h-9 transition-colors ${
                                star <= productRating.estrellas ? 'text-amber-400' : 'text-gray-200'
                              }`}
                            />
                            <span className={`text-[10px] font-semibold whitespace-nowrap ${STAR_LABELS[star - 1].color}`}>
                              {STAR_LABELS[star - 1].text}
                            </span>
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={productRating.comentario}
                        onChange={(e) => setProductRating((f) => ({ ...f, comentario: e.target.value }))}
                        placeholder="Comentario (opcional)"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all resize-none"
                        rows={2}
                      />
                    </>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 text-center">
                      Ya calificaste este producto hoy
                    </div>
                  )}
                </>
              )}

              {/* === DIVIDER === */}
              {ratingPayload.product_id && ratingPayload.store_id && (
                <div className="border-t border-gray-200" />
              )}

              {/* === STORE SECTION === */}
              {ratingPayload.store_id && (
                <>
                  <p className="text-sm text-gray-700">
                    Tienda: <span className="font-bold text-gray-900">{ratingPayload.storeName}</span>
                  </p>

                  {ratingPayload.puede_calificar_tienda_hoy ? (
                    <>
                      <div className="flex items-start justify-center gap-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setStoreRating((f) => ({ ...f, estrellas: star }))}
                            className="flex flex-col items-center gap-1"
                          >
                            <HiStar
                              className={`w-9 h-9 transition-colors ${
                                star <= storeRating.estrellas ? 'text-amber-400' : 'text-gray-200'
                              }`}
                            />
                            <span className={`text-[10px] font-semibold whitespace-nowrap ${STAR_LABELS[star - 1].color}`}>
                              {STAR_LABELS[star - 1].text}
                            </span>
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={storeRating.comentario}
                        onChange={(e) => setStoreRating((f) => ({ ...f, comentario: e.target.value }))}
                        placeholder="Comentario (opcional)"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all resize-none"
                        rows={2}
                      />
                    </>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 text-center">
                      Ya calificaste esta tienda hoy
                    </div>
                  )}
                </>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2 pb-1">
                <button
                  onClick={closeRatingModal}
                  disabled={submittingRating}
                  className="flex-1 border border-gray-300 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  Omitir
                </button>
                <button
                  onClick={handleRatingSave}
                  disabled={submittingRating || (
                    (ratingPayload.puede_calificar_producto_hoy && productRating.estrellas === 0) &&
                    (ratingPayload.puede_calificar_tienda_hoy && storeRating.estrellas === 0)
                  )}
                  className="flex-1 bg-primary-600 text-white font-semibold py-2.5 rounded-xl hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {submittingRating ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PRODUCT ITEM CARD
// ============================================================

function ProductItemCard({ item, onTogglePurchased, onDelete, onQuantityChange }) {
  const navigate = useNavigate();
  const product = item.producto;
  const tienda = product?.tienda;
  const galeria = tienda?.galeria;
  const stand = product?.stand || '';
  const productName = item.nombre_snapshot || product?.nombre || 'Producto';

  const handleCardClick = () => {
    if (item.id_producto) {
      navigate(`/comprador/productos/${item.id_producto}`);
    }
  };

  const handleGoToLocation = async (e) => {
    e.stopPropagation();
    if (!galeria) return;

    // Build destination URL
    const dest = galeria.latitud && galeria.longitud
      ? `${galeria.latitud},${galeria.longitud}`
      : galeria.direccion
        ? encodeURIComponent(galeria.direccion)
        : null;
    if (!dest) return;

    // On native, check geolocation permission
    if (Capacitor.isNativePlatform()) {
      try {
        const { Geolocation } = await import('@capacitor/geolocation');
        let perm = await Geolocation.checkPermissions();

        if (perm.location === 'denied') {
          toast.error('Debe activar la ubicacion en los ajustes de su dispositivo para usar esta funcion');
          return;
        }

        if (perm.location === 'prompt' || perm.location === 'prompt-with-rationale') {
          perm = await Geolocation.requestPermissions();
          if (perm.location === 'denied') {
            toast.error('Permiso de ubicacion denegado. Active la ubicacion en ajustes para navegar');
            return;
          }
        }

        // Permission granted — get current position for directions
        try {
          const pos = await Geolocation.getCurrentPosition({ timeout: 8000 });
          const origin = `${pos.coords.latitude},${pos.coords.longitude}`;
          const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`;
          await openExternal(url);
          return;
        } catch {
          // Could not get position (GPS off) — open without origin as fallback
          toast('No se pudo obtener su ubicación. Se abrirá sin punto de origen.', { icon: '📍' });
          const url = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
          await openExternal(url);
          return;
        }
      } catch {
        // Fallback if Geolocation plugin fails
      }
    }

    // Web — check geolocation permission and get position
    if (navigator.geolocation) {
      try {
        const permStatus = await navigator.permissions.query({ name: 'geolocation' });

        if (permStatus.state === 'denied') {
          toast.error('Ubicación desactivada. Active la ubicación en la configuración de su navegador para usar esta función.');
          const url = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
          openExternal(url);
          return;
        }

        // 'granted' or 'prompt' — getCurrentPosition will trigger the browser prompt if needed
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
        });
        const origin = `${pos.coords.latitude},${pos.coords.longitude}`;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`;
        openExternal(url);
        return;
      } catch {
        // Permission denied or position unavailable — open without origin
        toast('No se pudo obtener su ubicación. Se abrirá sin punto de origen.', { icon: '📍' });
      }
    }

    // Final fallback — open maps without origin
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
    openExternal(url);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-surface rounded-xl border shadow-sm overflow-hidden transition-all duration-200 ${
        item.id_producto ? 'cursor-pointer' : ''
      } ${
        item.comprado ? 'opacity-60 border-seller-200 bg-seller-50/20' : 'border-gray-100 hover:shadow-md'
      }`}
    >
      <div className="p-3.5">
        <div className="flex items-start gap-3">
          {/* Checkbox (toggleable) */}
          <button
            onClick={(e) => { e.stopPropagation(); onTogglePurchased(item); }}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
              item.comprado
                ? 'bg-seller-500 border-seller-500 text-white hover:bg-seller-400'
                : 'border-gray-300 hover:border-primary-400'
            }`}
          >
            {item.comprado && <HiOutlineCheck className="w-3.5 h-3.5" />}
          </button>

          {/* Center content */}
          <div className="flex-1 min-w-0">
            {/* Product name */}
            <span className="text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors line-clamp-1">
              {productName}
            </span>

            {/* Details */}
            <div className="mt-1.5 space-y-0.5">
              {galeria?.nombre && (
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span>🏢</span>
                  <span className="text-gray-400">Galeria:</span>
                  <span className="text-gray-600">{galeria.nombre}</span>
                </p>
              )}
              {tienda?.nombre && (
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span>🏪</span>
                  <span className="text-gray-400">Tienda:</span>
                  <span className="text-primary-600 font-medium">{tienda.nombre}</span>
                </p>
              )}
              {stand && (
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span>📍</span>
                  <span className="text-gray-400">Stand:</span>
                  <span className="text-gray-600">{stand}</span>
                </p>
              )}
            </div>
          </div>

          {/* Right action buttons */}
          <div className="flex items-start gap-1.5 flex-shrink-0">
            {/* IR button - valida ubicación y abre Google Maps con direcciones */}
            {galeria && !item.comprado && (
              <button
                onClick={handleGoToLocation}
                className="flex items-center gap-1 bg-seller-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-seller-600 transition-colors shadow-sm"
              >
                <HiOutlineLocationMarker className="w-3.5 h-3.5" />
                IR
              </button>
            )}

            {/* Delete button */}
            {!item.comprado && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-colors"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom row: Price + Quantity */}
        {!item.comprado && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
            {/* Price - solo mostrar si el precio es visible */}
            <span className="text-sm font-bold text-seller-600">
              {product?.precio_visible !== false && item.precio_snapshot ? formatCurrency(item.precio_snapshot) : ''}
            </span>

            {/* Quantity controls */}
            <div className="flex items-center gap-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onQuantityChange(item, -1)}
                disabled={item.cantidad <= 1}
                className="w-8 h-8 rounded-l-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-lg font-medium transition-colors"
              >
                -
              </button>
              <div className="w-10 h-8 bg-gray-50 border-y border-gray-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-800">{item.cantidad || 1}</span>
              </div>
              <button
                onClick={() => onQuantityChange(item, 1)}
                className="w-8 h-8 rounded-r-lg bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center text-lg font-medium transition-colors"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Purchased state: show price and quantity as read-only */}
        {item.comprado && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
            <span className="text-sm font-bold text-seller-600">
              {product?.precio_visible !== false && item.precio_snapshot ? formatCurrency(item.precio_snapshot) : ''}
            </span>
            <span className="text-xs text-gray-400">Cant: {item.cantidad || 1}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MANUAL ITEM CARD
// ============================================================

function ManualItemCard({ item, onTogglePurchased, onDelete }) {
  return (
    <div
      className={`bg-surface rounded-xl border shadow-sm overflow-hidden transition-all duration-200 ${
        item.comprado ? 'opacity-60 border-seller-200 bg-seller-50/20' : 'border-gray-100 hover:shadow-md'
      }`}
    >
      <div className="px-3.5 py-3 flex items-center gap-3">
        {/* Checkbox (toggleable) */}
        <button
          onClick={() => onTogglePurchased(item)}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            item.comprado
              ? 'bg-seller-500 border-seller-500 text-white hover:bg-seller-400'
              : 'border-gray-300 hover:border-primary-400'
          }`}
        >
          {item.comprado && <HiOutlineCheck className="w-3.5 h-3.5" />}
        </button>

        {/* Item name */}
        <span
          className={`flex-1 text-sm font-medium ${
            item.comprado ? 'text-gray-400 line-through' : 'text-gray-800'
          }`}
        >
          {item.nombre_referencia || 'Item manual'}
        </span>

        {/* Delete button */}
        {!item.comprado && (
          <button
            onClick={() => onDelete(item.id)}
            className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <HiOutlineX className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
