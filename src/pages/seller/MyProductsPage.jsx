import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sellerService } from '../../services/sellerService';
import { marketplaceService } from '../../services/marketplaceService';
import { useSSEListener } from '../../hooks/useSSEListener';
import { formatCurrency } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ImageFullscreenModal from '../../components/ui/ImageFullscreenModal';
import toast from 'react-hot-toast';
import {
  HiOutlineCube,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineStar,
  HiStar,
  HiOutlineTrash,
  HiOutlineOfficeBuilding,
} from 'react-icons/hi';

import { resolveFileUrl } from '../../utils/constants';

const FILTERS = [
  { key: 'TODOS', label: 'Todos' },
  { key: 'APROBADO', label: 'Aprobados' },
  { key: 'PENDIENTE', label: 'Pendientes' },
  { key: 'RECHAZADO', label: 'Rechazados' },
];

function getProductImageUrl(product) {
  const foto = product.fotos?.[0];
  if (!foto) return null;
  const url = foto.url_foto || foto.url;
  return resolveFileUrl(url) || null;
}

export default function MyProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('TODOS');
  const [deleting, setDeleting] = useState(null);
  const [ratingsModal, setRatingsModal] = useState({ open: false, product: null, ratings: [], loading: false });
  const [storeFilter, setStoreFilter] = useState('');
  const [stores, setStores] = useState([]);
  const [previewData, setPreviewData] = useState(null); // { images: string[], startIndex: number }

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data } = await sellerService.getMyProducts();
      setProducts(data?.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    sellerService.getMyStores().then(({ data }) => {
      setStores((data?.data || []).filter((s) => s.estado_aprobacion === 'APROBADO'));
    }).catch(() => {});
  }, []);

  useSSEListener(['approval.product.approved', 'approval.product.rejected', 'approval.product.updated'], loadProducts);

  // Actualizar ratings en tiempo real cuando un comprador califica
  useSSEListener(['rating.product.new'], async (data) => {
    if (ratingsModal.open && ratingsModal.product && data?.id_producto === ratingsModal.product.id) {
      try {
        const { data: res } = await marketplaceService.getProductRatings(ratingsModal.product.id);
        setRatingsModal((prev) => ({ ...prev, ratings: res?.data || [] }));
      } catch {}
    }
  });

  const handleDelete = async (product) => {
    if (!window.confirm(`¿Eliminar "${product.nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(product.id);
    try {
      await sellerService.deleteProduct(product.id);
      toast.success('Producto eliminado');
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    } finally {
      setDeleting(null);
    }
  };

  const handleViewRatings = async (product) => {
    setRatingsModal({ open: true, product, ratings: [], loading: true });
    try {
      const { data } = await marketplaceService.getProductRatings(product.id);
      setRatingsModal((prev) => ({ ...prev, ratings: data?.data || [], loading: false }));
    } catch {
      setRatingsModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const approvedCount = products.filter((p) => p.estado_aprobacion === 'APROBADO').length;
  const pendingCount = products.filter((p) => p.estado_aprobacion === 'PENDIENTE').length;
  const rejectedCount = products.filter((p) => p.estado_aprobacion === 'RECHAZADO').length;

  const filteredProducts = products.filter((p) => {
    const matchesSearch = !search || p.nombre.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'TODOS' || p.estado_aprobacion === filter;
    const matchesStore = !storeFilter || (p.tienda?.id || p.tbl_tiendas?.id) === Number(storeFilter);
    return matchesSearch && matchesFilter && matchesStore;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in pb-24">
      {/* Counter bar */}
      <div className="card rounded-xl shadow-card mb-1.5 p-0">
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          <div className="text-center py-1">
            <span className="text-[10px] text-gray-500">Aprobados: </span>
            <span className="text-[11px] font-bold text-primary-600">{approvedCount}</span>
          </div>
          <div className="text-center py-1">
            <span className="text-[10px] text-gray-500">Pendientes: </span>
            <span className="text-[11px] font-bold text-warning-500">{pendingCount}</span>
          </div>
          <div className="text-center py-1">
            <span className="text-[10px] text-gray-500">Rechazados: </span>
            <span className="text-[11px] font-bold text-red-500">{rejectedCount}</span>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-1.5">
        <HiOutlineSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field rounded-lg text-xs w-full pl-8 py-1.5"
        />
      </div>

      {/* Store filter + status chips */}
      <div className="flex items-center gap-2 mb-1.5">
        <select
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
          className="shrink-0 text-xs bg-surface border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-400 focus:border-primary-400 text-gray-600 max-w-[140px]"
        >
          <option value="">Todas las tiendas</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>
        <div className="flex gap-1 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${
                filter === f.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pull to refresh hint */}
      <div className="bg-gray-50 rounded-md py-1 px-2 text-center text-[10px] text-gray-400 mb-1.5 flex items-center justify-center gap-1">
        <span>↓</span> Desliza hacia abajo para actualizar
      </div>

      {/* Products list */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={HiOutlineCube}
          title="Sin productos"
          description={filter !== 'TODOS' ? 'No hay productos en este filtro' : 'Crea tu primer producto para empezar'}
          action={
            filter === 'TODOS' && (
              <button
                onClick={() => navigate('/vendedor/productos/nuevo')}
                className="btn-primary text-sm rounded-xl px-6"
              >
                <HiOutlinePlus className="w-4 h-4 mr-1.5 inline" />
                Nuevo Producto
              </button>
            )
          }
        />
      ) : (
        <div className="space-y-2.5">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onRatings={() => handleViewRatings(product)}
              onDelete={() => handleDelete(product)}
              onEdit={() => navigate(`/vendedor/productos/${product.id}`)}
              onGoToStore={() => {
                const storeId = product.tienda?.id || product.tbl_tiendas?.id;
                if (storeId) navigate(`/vendedor/tiendas/${storeId}`);
              }}
              deleting={deleting === product.id}
              onPreviewImage={(product) => {
                const fotos = product.fotos || [];
                const urls = fotos.map((f) => resolveFileUrl(f.url_foto || f.url)).filter(Boolean);
                if (urls.length) setPreviewData({ images: urls, startIndex: 0 });
              }}
            />
          ))}
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => navigate('/vendedor/productos/nuevo')}
        className="fixed bottom-20 right-6 bg-primary-600 hover:bg-primary-700 text-white rounded-full w-14 h-14 shadow-elevated flex items-center justify-center transition-all duration-300 hover:scale-110 z-40"
      >
        <HiOutlinePlus className="w-7 h-7" />
      </button>

      {/* Ratings Modal */}
      <RatingsModal
        open={ratingsModal.open}
        product={ratingsModal.product}
        ratings={ratingsModal.ratings}
        loading={ratingsModal.loading}
        onClose={() => setRatingsModal({ open: false, product: null, ratings: [], loading: false })}
      />

      {/* Image Fullscreen Modal */}
      {previewData && (
        <ImageFullscreenModal
          images={previewData.images}
          startIndex={previewData.startIndex}
          onClose={() => setPreviewData(null)}
        />
      )}
    </div>
  );
}

/* ── Product Card ── */
function ProductCard({ product, onRatings, onDelete, onEdit, deleting, onGoToStore, onPreviewImage }) {
  const imageUrl = getProductImageUrl(product);
  const statusColors = {
    PENDIENTE: 'bg-warning-500',
    APROBADO: 'bg-green-500',
    RECHAZADO: 'bg-red-500',
  };
  const statusLabels = {
    PENDIENTE: 'Pendiente',
    APROBADO: 'Aprobado',
    RECHAZADO: 'Rechazado',
  };

  const storeName = product.tienda?.nombre || product.tbl_tiendas?.nombre || '';

  return (
    <div className="card rounded-2xl shadow-card overflow-hidden p-0 cursor-pointer" onClick={onEdit}>
      {/* Status bar */}
      <div className={`${statusColors[product.estado_aprobacion] || 'bg-gray-500'} px-3 py-1.5 flex items-center gap-1.5`}>
        <span className="w-3.5 h-3.5 border-2 border-white rounded-full flex items-center justify-center">
          <span className="w-1 h-1 bg-surface rounded-full" />
        </span>
        <span className="text-white text-xs font-semibold">{statusLabels[product.estado_aprobacion]}</span>
      </div>

      <div className="px-3 py-2.5 flex gap-2.5">
        {/* Product image */}
        <div
          className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden cursor-pointer"
          onClick={(e) => {
            if (imageUrl) {
              e.stopPropagation();
              onPreviewImage?.(product);
            }
          }}
        >
          {imageUrl ? (
            <img src={imageUrl} alt={product.nombre} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <HiOutlineCube className="w-6 h-6 text-gray-300" />
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-display font-bold text-gray-900 truncate leading-tight">{product.nombre}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5 truncate">
            <span className="font-semibold text-gray-600">Categoría:</span>{' '}
            {product.categoria?.nombre || product.tbl_categorias?.nombre || 'Sin categoría'}
          </p>
          {storeName && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGoToStore?.();
              }}
              className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-primary-50 border border-primary-200 text-[11px] font-medium text-primary-700 hover:bg-primary-100 transition-colors"
            >
              <HiOutlineOfficeBuilding className="w-3 h-3" />
              {storeName}
            </button>
          )}

          <div className="flex items-center justify-between mt-1.5">
            <span className="text-sm font-bold text-primary-600">{formatCurrency(product.precio)}</span>
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={onRatings}
                className="w-8 h-8 rounded-lg bg-warning-50 hover:bg-warning-100 flex items-center justify-center transition-colors"
                title="Calificaciones"
              >
                <HiOutlineStar className="w-4 h-4 text-warning-500" />
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
      </div>
    </div>
  );
}

/* ── Ratings Modal ── */
function RatingsModal({ open, product, ratings, loading, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="" maxWidth="max-w-md">
      <div className="-m-4 -mt-[4.5rem]">
        <div className="gradient-primary rounded-t-2xl px-6 py-5 text-center">
          <h3 className="text-lg font-display font-bold text-white">
            Calificaciones{product ? ` - ${product.nombre}` : ''}
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
