import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { buyerService } from '../../services/buyerService';
import { formatCurrency } from '../../utils/formatters';
import { resolveFileUrl } from '../../utils/constants';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { showSuccessSnackbar } from '../../utils/snackbar';
import {
  HiOutlineHeart,
  HiHeart,
  HiOutlineOfficeBuilding,
  HiOutlineLocationMarker,
  HiOutlineShoppingCart,
  HiOutlineStar,
} from 'react-icons/hi';

export default function FavoritesPage() {
  const [tab, setTab] = useState('productos');
  const [favProducts, setFavProducts] = useState([]);
  const [favStores, setFavStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        buyerService.getFavoriteProducts(),
        buyerService.getFavoriteStores(),
      ]);
      const pData = pRes.data;
      const sData = sRes.data;
      setFavProducts(Array.isArray(pData) ? pData : (pData?.data || []));
      setFavStores(Array.isArray(sData) ? sData : (sData?.data || []));
    } catch {} finally {
      setLoading(false);
    }
  };

  const removeFavProduct = async (id) => {
    try {
      await buyerService.removeFavoriteProduct(id);
      setFavProducts(favProducts.filter((f) => f.id_producto !== id));
      toast.success('Producto eliminado de favoritos');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const removeFavStore = async (id) => {
    try {
      await buyerService.removeFavoriteStore(id);
      setFavStores(favStores.filter((f) => f.id_tienda !== id));
      toast.success('Tienda eliminada de favoritos');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const addToShoppingList = async (product) => {
    try {
      await buyerService.addShoppingItem({
        tipo: 'PRODUCT',
        product_id: product.id,
        cantidad: 1,
      });
      showSuccessSnackbar('Producto agregado a la lista');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al agregar');
    }
  };

  if (loading) return <LoadingSpinner />;

  const tabs = [
    { key: 'productos', label: 'Productos' },
    { key: 'tiendas', label: 'Tiendas' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-3 text-sm font-semibold transition-all duration-200 border-b-2 ${
              tab === t.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Products Tab */}
      {tab === 'productos' ? (
        favProducts.length === 0 ? (
          <EmptyState
            icon={HiOutlineHeart}
            title="Sin productos favoritos"
            description="Explore el marketplace y agregue productos que le gusten"
          />
        ) : (
          <div className="space-y-4">
            {favProducts.map((f) => {
              const p = f.producto;
              const tienda = p?.tienda;
              const galeria = tienda?.galeria;
              const zona = tienda?.zona;
              const ciudad = tienda?.ciudad;
              const planType = tienda?.tipo_plan;
              const planLabel = planType === 'PREMIUM' ? 'Premium' : 'Estándar';
              const planIsPremium = planType === 'PREMIUM';

              return (
                <div
                  key={f.id_producto}
                  className="bg-surface rounded-2xl shadow-card border border-gray-100/80 overflow-hidden hover:shadow-card-hover transition-all duration-200"
                >
                  {/* Image Area */}
                  <Link to={`/comprador/productos/${f.id_producto}`}>
                    <div className="relative h-52 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                      {(p?.foto || p?.fotos?.[0]?.url) ? (
                        <img
                          src={resolveFileUrl(p.foto || p.fotos[0].url)}
                          alt={p.nombre}
                          className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-gray-300 text-sm">Sin imagen</span>
                      )}

                      {/* Plan Badge - top left */}
                      <div className="absolute top-3 left-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm ${
                            planIsPremium
                              ? 'bg-amber-50/90 text-amber-700 border border-amber-200/60'
                              : 'bg-gray-100/90 text-gray-600 border border-gray-200/60'
                          }`}
                        >
                          <HiOutlineOfficeBuilding className="w-3.5 h-3.5" />
                          {planLabel}
                        </span>
                      </div>

                      {/* Heart - top right */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeFavProduct(f.id_producto);
                        }}
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-surface transition-colors"
                      >
                        <HiHeart className="w-5 h-5 text-red-500" />
                      </button>

                      {/* Price Badge - bottom left over image */}
                      <div className="absolute bottom-3 left-3">
                        <span className="inline-block text-sm font-bold text-white bg-seller-500 px-3 py-1.5 rounded-full shadow-sm">
                          {p?.precio_visible !== false ? formatCurrency(p?.precio) : 'Consultar precio'}
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Content Area */}
                  <div className="p-4">
                    {/* Product Name + Rating */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <Link
                        to={`/comprador/productos/${f.id_producto}`}
                        className="text-sm font-bold text-gray-900 font-display line-clamp-2 hover:text-primary-600 transition-colors"
                      >
                        {p?.nombre}
                      </Link>
                      <div className="flex items-center gap-1 flex-shrink-0 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                        <HiOutlineStar className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-amber-700">
                          {parseFloat(p?.rating?.promedio || 0).toFixed(1)}
                        </span>
                        <span className="text-xs text-amber-500">
                          ({p?.rating?.total || 0})
                        </span>
                      </div>
                    </div>

                    {/* Info Rows + Action Buttons */}
                    <div className="flex items-end justify-between gap-3">
                      {/* Info Rows */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <HiOutlineOfficeBuilding className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-400">Galería:</span>
                          <span className="font-medium text-gray-600 truncate">
                            {galeria?.nombre || '-'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-400">Tienda:</span>
                          <span className="font-medium text-gray-600 truncate">
                            {tienda?.nombre || '-'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <HiOutlineLocationMarker className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-400">Zona:</span>
                          <span className="font-medium text-gray-600 truncate">
                            {zona?.nombre || '-'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="text-gray-400">Ciudad:</span>
                          <span className="font-medium text-gray-600 truncate">
                            {ciudad?.nombre || '-'}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Link
                          to={`/comprador/tiendas/${tienda?.id}`}
                          className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 flex items-center justify-center transition-colors"
                          title="Ver tienda"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <HiOutlineOfficeBuilding className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => addToShoppingList(p)}
                          className="w-10 h-10 rounded-full bg-primary-600 text-white hover:bg-primary-700 flex items-center justify-center transition-colors shadow-sm"
                          title="Agregar a lista de compras"
                        >
                          <HiOutlineShoppingCart className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : /* Stores Tab */
      favStores.length === 0 ? (
        <EmptyState
          icon={HiOutlineOfficeBuilding}
          title="Sin tiendas favoritas"
          description="Explore tiendas y agregue sus favoritas"
        />
      ) : (
        <div className="space-y-4">
          {favStores.map((f) => {
            const t = f.tienda;
            const galeria = t?.galeria;
            const zona = t?.zona;
            const ciudad = t?.ciudad;

            return (
              <div
                key={f.id_tienda}
                className="bg-surface rounded-2xl shadow-card border border-gray-100/80 overflow-hidden hover:shadow-card-hover transition-all duration-200"
              >
                {/* Store Image Area */}
                <Link to={`/comprador/tiendas/${f.id_tienda}`}>
                  <div className="relative h-44 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                    {(t?.foto || t?.fotos?.[0]?.url) ? (
                      <img
                        src={resolveFileUrl(t.foto || t.fotos[0].url)}
                        alt={t.nombre}
                        className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <HiOutlineOfficeBuilding className="w-12 h-12 text-gray-300" />
                        <span className="text-gray-300 text-sm">Sin imagen</span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Content Area */}
                <div className="p-4">
                  {/* Store Name */}
                  <Link
                    to={`/comprador/tiendas/${f.id_tienda}`}
                    className="text-base font-bold text-gray-900 font-display hover:text-primary-600 transition-colors block mb-3"
                  >
                    {t?.nombre}
                  </Link>

                  {/* Info Rows */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <HiOutlineOfficeBuilding className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-400">Galería:</span>
                      <span className="font-medium text-gray-600 truncate">
                        {galeria?.nombre || '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-400">Tienda:</span>
                      <span className="font-medium text-gray-600 truncate">
                        {t?.nombre || '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <HiOutlineLocationMarker className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-400">Zona:</span>
                      <span className="font-medium text-gray-600 truncate">
                        {zona?.nombre || '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-gray-400">Ciudad:</span>
                      <span className="font-medium text-gray-600 truncate">
                        {ciudad?.nombre || '-'}
                      </span>
                    </div>
                  </div>

                  {/* Rating + Heart */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                      <HiOutlineStar className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-amber-700">
                        {parseFloat(t?.rating?.promedio || 0).toFixed(1)}
                      </span>
                      <span className="text-xs text-amber-500">
                        ({t?.rating?.total || 0})
                      </span>
                    </div>

                    <button
                      onClick={() => removeFavStore(f.id_tienda)}
                      className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                      title="Eliminar de favoritos"
                    >
                      <HiHeart className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
