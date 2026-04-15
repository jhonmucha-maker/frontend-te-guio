import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { marketplaceService } from '../../services/marketplaceService';
import { buyerService } from '../../services/buyerService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { resolveFileUrl } from '../../utils/constants';
import { openExternal } from '../../utils/navigation';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StarRating from '../../components/ui/StarRating';
import toast from 'react-hot-toast';
import {
  HiOutlineHeart,
  HiHeart,
  HiOutlineLocationMarker,
  HiOutlineSearch,
  HiOutlineGlobe,
  HiOutlineChevronRight,
  HiOutlineChevronLeft,
  HiOutlineOfficeBuilding,
  HiOutlinePhotograph,
} from 'react-icons/hi';
import { FaFacebookF, FaInstagram, FaTiktok } from 'react-icons/fa';

export default function StoreDetailPage() {
  const { id } = useParams();
  const [store, setStore] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [ratingTotal, setRatingTotal] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [galleryImgIdx, setGalleryImgIdx] = useState(0);

  useEffect(() => {
    loadStore();
  }, [id]);

  useEffect(() => {
    if (id) loadRatings();
  }, [id]);

  const loadStore = async () => {
    setLoading(true);
    try {
      const { data } = await marketplaceService.getStoreDetail(id);
      setStore(data.data || data);
      try {
        const favRes = await buyerService.getFavoriteStores();
        const favArr = Array.isArray(favRes.data) ? favRes.data : (favRes.data?.data || []);
        setIsFav(favArr.some((f) => f.id_tienda === parseInt(id)));
      } catch {}
    } catch {
      toast.error('Tienda no encontrada');
    } finally {
      setLoading(false);
    }
  };

  const loadRatings = async () => {
    try {
      const { data } = await marketplaceService.getStoreRatings(id, {
        page: 1,
        limit: 5,
      });
      setRatings(Array.isArray(data.data) ? data.data : []);
      setRatingTotal(data.pagination?.pages || 1);
    } catch {}
  };

  const toggleFav = async () => {
    try {
      if (isFav) {
        await buyerService.removeFavoriteStore(id);
        setIsFav(false);
        toast.success('Eliminado de favoritos');
      } else {
        await buyerService.toggleFavoriteStore(id);
        setIsFav(true);
        toast.success('Agregado a favoritos');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  // Derive galeria data (API returns raw Prisma relations)
  const galeria = store?.tbl_galerias || store?.galeria;
  const zona = galeria?.tbl_zonas || galeria?.zona;
  const ciudad = galeria?.tbl_ciudades || zona?.ciudad || galeria?.zona?.ciudad;
  const redes = store?.redes_sociales_json || store?.redes_sociales || {};
  const ratingPromedio = store?.agregado_calificacion?.promedio || store?.rating_promedio || 0;
  const ratingTotal2 = store?.agregado_calificacion?.total || store?.total_calificaciones || 0;
  const storePhoto = resolveFileUrl(store?.fotos?.[0]?.url) || null;
  const galeriaFotos = galeria?.fotos || [];

  // Filter products by search term, limit to 10 visible
  const allFilteredProducts = useMemo(() => {
    const products = store?.productos || [];
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.nombre?.toLowerCase().includes(q) ||
        p.descripcion?.toLowerCase().includes(q)
    );
  }, [store?.productos, productSearch]);

  const visibleProducts = allFilteredProducts.slice(0, 10);
  const hasMoreProducts = allFilteredProducts.length > 10;

  // Build Google Maps URL for directions
  const handleDirections = () => {
    const lat = store?.latitud || galeria?.latitud;
    const lng = store?.longitud || galeria?.longitud;
    const address = galeria?.direccion || '';
    let url;
    if (lat && lng) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    } else if (address) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    } else {
      toast.error('No hay ubicacion disponible');
      return;
    }
    openExternal(url);
  };

  if (loading) return <LoadingSpinner />;
  if (!store) return null;

  return (
    <div className="animate-fade-in">
      {/* Store banner / image area */}
      <div className="w-full h-48 sm:h-56 bg-gray-100 rounded-2xl overflow-hidden mb-4 shadow-card">
        {storePhoto ? (
          <img
            src={storePhoto}
            alt={store.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary-50">
            <HiOutlineOfficeBuilding className="w-16 h-16 text-primary-200" />
          </div>
        )}
      </div>

      {/* Store name + rating */}
      <div className="px-1 mb-4">
        <h1 className="text-2xl font-bold text-gray-900 font-display mb-2">
          {store.nombre}
        </h1>
        <div className="inline-flex items-center gap-2 bg-accent-50 border border-accent-100 rounded-full px-3.5 py-1.5">
          <StarRating value={parseFloat(ratingPromedio) || 0} readonly size="sm" />
          <span className="text-sm font-semibold text-accent-700">
            {parseFloat(ratingPromedio).toFixed(1)}
          </span>
          <span className="text-xs text-accent-600">
            ({ratingTotal2} {ratingTotal2 === 1 ? 'opinion' : 'opiniones'})
          </span>
        </div>
      </div>

      {/* Gallery info card */}
      {galeria && (
        <div className="bg-surface rounded-2xl shadow-card border border-gray-100/80 p-4 mb-4 border-l-4 border-l-primary-500">
          <p className="text-xs font-bold uppercase tracking-wider text-primary-600 mb-1">
            Galeria Comercial
          </p>
          <p className="text-base font-bold text-gray-900 font-display mb-2">
            {galeria.nombre}
          </p>
          {galeria.direccion && (
            <div className="flex items-start gap-2 mb-1.5">
              <HiOutlineLocationMarker className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-600">
                {galeria.direccion}
              </span>
            </div>
          )}
          {store.numero_local && (
            <div className="flex items-start gap-2">
              <HiOutlineOfficeBuilding className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-600">
                Stand/Local: {store.numero_local}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Gallery photos carousel */}
      {galeriaFotos.length > 0 && (
        <div className="mb-4">
          <div className="relative rounded-2xl overflow-hidden shadow-card bg-gray-100">
            <img
              src={resolveFileUrl(galeriaFotos[galleryImgIdx]?.url)}
              alt={`${galeria?.nombre || 'Galeria'} - Foto ${galleryImgIdx + 1}`}
              className="w-full h-48 sm:h-56 object-cover transition-all duration-300"
            />
            {/* Navigation arrows */}
            {galeriaFotos.length > 1 && (
              <>
                <button
                  onClick={() => setGalleryImgIdx((prev) => (prev === 0 ? galeriaFotos.length - 1 : prev - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                >
                  <HiOutlineChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setGalleryImgIdx((prev) => (prev === galeriaFotos.length - 1 ? 0 : prev + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                >
                  <HiOutlineChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            {/* Counter pill */}
            <span className="absolute top-2 right-2 bg-black/50 text-white text-xs font-medium px-2.5 py-1 rounded-full">
              {galleryImgIdx + 1}/{galeriaFotos.length}
            </span>
            {/* Label */}
            <span className="absolute bottom-2 left-2 bg-black/50 text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
              <HiOutlinePhotograph className="w-3.5 h-3.5" />
              Fotos de la galeria
            </span>
          </div>
        </div>
      )}

      {/* Location info */}
      {(zona || ciudad) && (
        <div className="bg-surface rounded-2xl shadow-card border border-gray-100/80 p-4 mb-4">
          <div className="flex flex-col gap-2">
            {zona && (
              <div className="flex items-center gap-2.5">
                <HiOutlineLocationMarker className="w-4 h-4 text-primary-500 flex-shrink-0" />
                <span className="text-sm text-gray-600">
                  <span className="text-gray-400">Zona:</span>{' '}
                  <span className="font-medium text-gray-800">{zona.nombre}</span>
                </span>
              </div>
            )}
            {ciudad && (
              <div className="flex items-center gap-2.5">
                <HiOutlineOfficeBuilding className="w-4 h-4 text-primary-500 flex-shrink-0" />
                <span className="text-sm text-gray-600">
                  <span className="text-gray-400">Ciudad:</span>{' '}
                  <span className="font-medium text-gray-800">{ciudad.nombre}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* "Como llegar" button */}
      <button
        onClick={handleDirections}
        className="w-full flex items-center justify-center gap-2 bg-seller-500 hover:bg-seller-600 text-white font-semibold py-3 px-5 rounded-xl transition-all duration-200 shadow-md mb-3"
      >
        <HiOutlineLocationMarker className="w-5 h-5" />
        Como llegar
      </button>

      {/* Add to Favorites button */}
      <button
        onClick={toggleFav}
        className={`w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold transition-all duration-200 mb-4 ${
          isFav
            ? 'bg-red-50 text-red-500 border-2 border-red-200 hover:bg-red-100'
            : 'bg-surface text-primary-600 border-2 border-primary-200 hover:bg-primary-50'
        }`}
      >
        {isFav ? (
          <>
            <HiHeart className="w-5 h-5" />
            Eliminar de Favoritos
          </>
        ) : (
          <>
            <HiOutlineHeart className="w-5 h-5" />
            Agregar a Favoritos
          </>
        )}
      </button>

      {/* Social media section */}
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-700 font-display mb-3 px-1">
          Redes Sociales
        </h2>
        <div className="flex flex-wrap gap-3">
          {/* Web */}
          <a
            href={redes.pagina_web || '#'}
            onClick={(e) => {
              e.preventDefault();
              if (!redes.pagina_web) return toast.error('No disponible');
              openExternal(redes.pagina_web);
            }}
            className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
              redes.pagina_web
                ? 'bg-gray-600 hover:bg-gray-700 text-white shadow-sm'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <HiOutlineGlobe className="w-5 h-5" />
          </a>

          {/* Facebook */}
          <a
            href={redes.facebook || '#'}
            onClick={(e) => {
              e.preventDefault();
              if (!redes.facebook) return toast.error('No disponible');
              openExternal(redes.facebook);
            }}
            className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
              redes.facebook
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                : 'bg-blue-100 text-blue-300 cursor-not-allowed'
            }`}
          >
            <FaFacebookF className="w-5 h-5" />
          </a>

          {/* Instagram */}
          <a
            href={redes.instagram || '#'}
            onClick={(e) => {
              e.preventDefault();
              if (!redes.instagram) return toast.error('No disponible');
              openExternal(redes.instagram);
            }}
            className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
              redes.instagram
                ? 'text-white shadow-sm'
                : 'bg-pink-100 text-pink-300 cursor-not-allowed'
            }`}
            style={
              redes.instagram
                ? {
                    background:
                      'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                  }
                : undefined
            }
          >
            <FaInstagram className="w-5 h-5" />
          </a>

          {/* TikTok */}
          <a
            href={redes.tiktok || '#'}
            onClick={(e) => {
              e.preventDefault();
              if (!redes.tiktok) return toast.error('No disponible');
              openExternal(redes.tiktok);
            }}
            className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
              redes.tiktok
                ? 'bg-gray-900 hover:bg-black text-white shadow-sm'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <FaTiktok className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Products section */}
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-700 font-display mb-3 px-1">
          Productos de esta tienda
        </h2>

        {/* Product search */}
        <div className="relative mb-3">
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="input-field pl-10 text-sm"
            placeholder="Buscar productos..."
          />
        </div>

        {/* Product list */}
        <div className="bg-surface rounded-2xl shadow-card border border-gray-100/80 overflow-hidden">
          {visibleProducts.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {visibleProducts.map((p) => (
                <Link
                  key={p.id}
                  to={`/comprador/productos/${p.id}`}
                  className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {p.nombre}
                    </p>
                    <p className="text-sm font-bold text-coral-500 mt-0.5">
                      {p.precio_visible !== false ? formatCurrency(p.precio) : 'Consultar precio'}
                    </p>
                  </div>
                  <HiOutlineChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 flex-shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-400">
                {productSearch
                  ? 'No se encontraron productos'
                  : 'Esta tienda no tiene productos aun'}
              </p>
            </div>
          )}
        </div>

        {/* Ver más productos */}
        {hasMoreProducts && (
          <Link
            to={`/comprador/tiendas/${id}/productos`}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-all duration-200"
          >
            Ver mas productos ({allFilteredProducts.length})
            <HiOutlineChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Ratings section */}
      <div className="bg-accent-50 rounded-2xl border border-accent-100 p-5 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 font-display">
          Calificaciones
        </h2>
        {ratings.length === 0 ? (
          <p className="text-sm text-gray-400">Sin calificaciones aun</p>
        ) : (
          <div className="space-y-3">
            {ratings.slice(0, 3).map((r) => (
              <div
                key={r.id}
                className="bg-surface rounded-xl p-4 border border-gray-100/60"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-800">
                    {r.autor || 'Usuario'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDateTime(r.fecha)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <StarRating value={r.estrellas} readonly size="sm" />
                  <span className="text-xs font-medium text-accent-600">{r.estrellas?.toFixed(1) || '0.0'}</span>
                </div>
                {r.comentario && (
                  <p className="text-sm text-gray-600">{r.comentario}</p>
                )}
              </div>
            ))}
            {(ratings.length > 3 || ratingTotal > 1) && (
              <Link
                to={`/comprador/tiendas/${id}/calificaciones`}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-accent-600 bg-white hover:bg-accent-50 border border-accent-200 transition-all duration-200"
              >
                Ver todas las calificaciones
                <HiOutlineChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
