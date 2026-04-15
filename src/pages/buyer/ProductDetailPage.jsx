import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { marketplaceService } from '../../services/marketplaceService';
import { buyerService } from '../../services/buyerService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { resolveFileUrl } from '../../utils/constants';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StarRating from '../../components/ui/StarRating';
import Pagination from '../../components/ui/Pagination';
import toast from 'react-hot-toast';
import { showSuccessSnackbar } from '../../utils/snackbar';
import {
  HiOutlineHeart,
  HiHeart,
  HiOutlineShoppingCart,
  HiOutlineLocationMarker,
  HiOutlineStar,
  HiOutlineX,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlinePhotograph,
} from 'react-icons/hi';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [ratingPage, setRatingPage] = useState(1);
  const [ratingTotal, setRatingTotal] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [selectedImg, setSelectedImg] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [failedImgs, setFailedImgs] = useState(new Set());

  useEffect(() => {
    loadProduct();
  }, [id]);

  useEffect(() => {
    if (id) loadRatings();
  }, [id, ratingPage]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const { data } = await marketplaceService.getProductDetail(id);
      setProduct(data.data || data);
      try {
        const favRes = await buyerService.getFavoriteProducts();
        const favArr = Array.isArray(favRes.data) ? favRes.data : (favRes.data?.data || []);
        setIsFav(favArr.some((f) => f.id_producto === parseInt(id)));
      } catch {}
    } catch {
      toast.error('Producto no encontrado');
    } finally {
      setLoading(false);
    }
  };

  const loadRatings = async () => {
    try {
      const { data } = await marketplaceService.getProductRatings(id, {
        page: ratingPage,
        limit: 5,
      });
      setRatings(Array.isArray(data.data) ? data.data : []);
      setRatingTotal(data.pagination?.pages || 1);
    } catch {}
  };

  const toggleFav = async () => {
    try {
      if (isFav) {
        await buyerService.removeFavoriteProduct(id);
        setIsFav(false);
        toast.success('Eliminado de favoritos');
      } else {
        await buyerService.toggleFavoriteProduct(id);
        setIsFav(true);
        toast.success('Agregado a favoritos');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const addToList = async () => {
    try {
      await buyerService.addShoppingItem({
        tipo: 'PRODUCT',
        product_id: parseInt(id),
        cantidad: 1,
      });
      showSuccessSnackbar('Producto agregado a la lista');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  /* ---- Swipe handlers for image carousel ---- */
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    const images = product?.fotos || [];
    if (Math.abs(diff) > 50) {
      if (diff > 0 && selectedImg < images.length - 1) {
        setSelectedImg((prev) => prev + 1);
      } else if (diff < 0 && selectedImg > 0) {
        setSelectedImg((prev) => prev - 1);
      }
    }
    setTouchStart(null);
  };

  if (loading) return <LoadingSpinner />;
  if (!product) return null;

  const images = product.fotos || [];
  const store = product.tbl_tiendas || product.tienda;

  const avgRating = parseFloat(product.agregado_calificacion?.promedio) || 0;

  return (
    <div className="animate-fade-in pb-6">
      {/* ===== Image section ===== */}
      <div className="relative -mx-4 sm:-mx-6">
        <div
          className="w-full h-72 sm:h-80 bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => images.length > 0 && !failedImgs.has(selectedImg) && setLightboxOpen(true)}
        >
          {images.length > 0 && !failedImgs.has(selectedImg) ? (
            <img
              src={resolveFileUrl(images[selectedImg]?.url)}
              alt={product.nombre}
              className="w-full h-full object-contain transition-all duration-300"
              onError={() => setFailedImgs((prev) => new Set(prev).add(selectedImg))}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-300">
              <HiOutlinePhotograph className="w-12 h-12" />
              <span className="text-sm">Sin imagen</span>
            </div>
          )}
        </div>

        {/* Carousel counter pill */}
        {images.length > 0 && (
          <span className="absolute top-3 right-3 bg-black/50 text-white text-xs font-medium px-2.5 py-1 rounded-full">
            {selectedImg + 1}/{images.length}
          </span>
        )}

        {/* Dot indicators for multiple images */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setSelectedImg(i); }}
                className={`rounded-full transition-all duration-200 ${
                  i === selectedImg
                    ? 'w-6 h-2 bg-surface'
                    : 'w-2 h-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ===== Fullscreen Lightbox ===== */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black flex flex-col"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
            <span className="text-white/70 text-sm font-medium">
              {selectedImg + 1} / {images.length}
            </span>
            <button
              onClick={() => setLightboxOpen(false)}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <HiOutlineX className="w-6 h-6" />
            </button>
          </div>

          {/* Image area */}
          <div
            className="flex-1 flex items-center justify-center px-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={(e) => { handleTouchEnd(e); }}
          >
            {!failedImgs.has(selectedImg) ? (
              <img
                src={resolveFileUrl(images[selectedImg]?.url)}
                alt={product.nombre}
                className="max-w-full max-h-full object-contain"
                onError={() => setFailedImgs((prev) => new Set(prev).add(selectedImg))}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-white/40">
                <HiOutlinePhotograph className="w-16 h-16" />
                <span className="text-sm">Imagen no disponible</span>
              </div>
            )}
          </div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 pointer-events-none">
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedImg((prev) => Math.max(0, prev - 1)); }}
                disabled={selectedImg === 0}
                className={`pointer-events-auto w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white transition-colors ${selectedImg === 0 ? 'opacity-30' : 'hover:bg-white/20'}`}
              >
                <HiOutlineChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedImg((prev) => Math.min(images.length - 1, prev + 1)); }}
                disabled={selectedImg === images.length - 1}
                className={`pointer-events-auto w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white transition-colors ${selectedImg === images.length - 1 ? 'opacity-30' : 'hover:bg-white/20'}`}
              >
                <HiOutlineChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex items-center justify-center gap-2 px-4 py-3 flex-shrink-0">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setSelectedImg(i); }}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                    i === selectedImg ? 'border-white scale-110' : 'border-transparent opacity-50'
                  }`}
                >
                  {!failedImgs.has(i) ? (
                    <img
                      src={resolveFileUrl(img.url)}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={() => setFailedImgs((prev) => new Set(prev).add(i))}
                    />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center">
                      <HiOutlinePhotograph className="w-4 h-4 text-white/40" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== Product info card ===== */}
      <div className="bg-surface rounded-2xl shadow-card border border-gray-100/80 -mt-4 relative z-10 mx-0 p-5 animate-slide-up">
        {/* Name */}
        <div className="mb-2">
          <h2 className="text-xl font-bold text-gray-900 font-display leading-tight">
            {product.nombre}
          </h2>
        </div>

        {/* Price */}
        <p className="text-2xl font-bold text-coral-500 mb-2 font-display">
          {product.precio_visible !== false ? formatCurrency(product.precio) : 'Consultar precio'}
        </p>

        {/* Short description */}
        {product.descripcion && (
          <p className="text-sm text-gray-500 mb-4 leading-relaxed">
            {product.descripcion}
          </p>
        )}

        {/* Info table */}
        <div className="space-y-2.5 text-sm">
          {store && (
            <div className="flex items-start gap-2">
              <span className="text-gray-400 w-20 flex-shrink-0">Tienda:</span>
              <Link
                to={`/comprador/tiendas/${store.id}`}
                className="text-primary-600 font-medium hover:text-primary-700 hover:underline transition-colors"
              >
                {store.nombre}
              </Link>
            </div>
          )}
          {store?.tbl_galerias && (
            <div className="flex items-start gap-2">
              <span className="text-gray-400 w-20 flex-shrink-0">Galeria:</span>
              <span className="text-gray-700 font-medium">{store.tbl_galerias.nombre}</span>
            </div>
          )}
          {store?.stand && (
            <div className="flex items-start gap-2">
              <span className="text-gray-400 w-20 flex-shrink-0">Stand:</span>
              <span className="text-gray-700 font-medium">{store.stand}</span>
            </div>
          )}
          {(product.tbl_categorias || product.categoria) && (
            <div className="flex items-start gap-2">
              <span className="text-gray-400 w-20 flex-shrink-0">Categoria:</span>
              <span className="text-gray-700 font-medium">{(product.tbl_categorias || product.categoria)?.nombre}</span>
            </div>
          )}
        </div>
      </div>

      {/* ===== Ubicacion section ===== */}
      {store?.tbl_galerias && (
        <div className="bg-surface rounded-2xl shadow-card border border-gray-100/80 mt-4 p-5 animate-slide-up">
          <div className="border-b border-gray-100 pb-3 mb-3">
            <h3 className="text-base font-bold text-primary-600 font-display flex items-center gap-2">
              <HiOutlineLocationMarker className="w-5 h-5" />
              Ubicacion
            </h3>
          </div>
          <div className="space-y-2 text-sm">
            {store.tbl_galerias.tbl_zonas && (
              <div className="flex items-start gap-2">
                <span className="text-gray-400 w-16 flex-shrink-0">Zona:</span>
                <span className="text-gray-700 font-medium">{store.tbl_galerias.tbl_zonas.nombre}</span>
              </div>
            )}
            {store.tbl_galerias.tbl_ciudades && (
              <div className="flex items-start gap-2">
                <span className="text-gray-400 w-16 flex-shrink-0">Ciudad:</span>
                <span className="text-gray-700 font-medium">{store.tbl_galerias.tbl_ciudades.nombre}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Rating display ===== */}
      <div className="flex items-center justify-center gap-3 mt-4 animate-slide-up">
        <StarRating value={Math.round(avgRating)} readonly size="lg" />
        <span className="bg-accent-100 text-accent-700 font-bold text-base px-4 py-1.5 rounded-full">
          {avgRating.toFixed(1)}
        </span>
      </div>

      {/* ===== Action buttons ===== */}
      <div className="flex items-center gap-3 mt-5 animate-slide-up">
        <button
          onClick={toggleFav}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm border-2 transition-all duration-200 ${
            isFav
              ? 'border-red-400 bg-red-50 text-red-500'
              : 'border-primary-600 bg-surface text-primary-600 hover:bg-primary-50'
          }`}
        >
          {isFav ? (
            <HiHeart className="w-5 h-5" />
          ) : (
            <HiOutlineHeart className="w-5 h-5" />
          )}
          {isFav ? 'Favorito' : 'Agregar'}
        </button>

        <button
          onClick={addToList}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm bg-primary-600 text-white hover:bg-primary-700 transition-all duration-200 shadow-md"
        >
          <HiOutlineShoppingCart className="w-5 h-5" />
          A la Lista
        </button>
      </div>

      {/* ===== Calificaciones y Comentarios section ===== */}
      <div className="bg-surface rounded-2xl shadow-card border border-gray-100/80 mt-6 p-5 animate-slide-up">
        <h3 className="text-base font-bold text-gray-900 font-display mb-4 flex items-center gap-2">
          <HiOutlineStar className="w-5 h-5 text-amber-400" />
          Calificaciones y Comentarios
        </h3>

        {ratings.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Sin calificaciones aun
          </p>
        ) : (
          <div className="space-y-0">
            {ratings.map((r, index) => (
              <div
                key={r.id}
                className={`py-4 ${
                  index < ratings.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                {/* Username + date */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-gray-800">
                    {r.autor || 'Usuario'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(r.fecha)}
                  </span>
                </div>

                {/* Stars + score */}
                <div className="flex items-center gap-2 mb-1.5">
                  <StarRating value={r.estrellas} readonly size="sm" />
                  <span className="text-xs font-bold text-accent-600 bg-accent-50 px-2 py-0.5 rounded-full">
                    {Number(r.estrellas).toFixed(1)}
                  </span>
                </div>

                {/* Comment */}
                {r.comentario && (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {r.comentario}
                  </p>
                )}
              </div>
            ))}

            <Pagination
              page={ratingPage}
              totalPages={ratingTotal}
              onPageChange={setRatingPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
