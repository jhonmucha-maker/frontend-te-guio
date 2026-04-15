import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { marketplaceService } from '../../services/marketplaceService';
import { formatDateTime } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StarRating from '../../components/ui/StarRating';
import Pagination from '../../components/ui/Pagination';
import toast from 'react-hot-toast';
import { HiOutlineChevronLeft } from 'react-icons/hi';

export default function StoreRatingsPage() {
  const { id } = useParams();
  const [storeName, setStoreName] = useState('');
  const [ratingPromedio, setRatingPromedio] = useState(0);
  const [ratingTotalCount, setRatingTotalCount] = useState(0);
  const [ratings, setRatings] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoreInfo();
  }, [id]);

  useEffect(() => {
    if (id) loadRatings();
  }, [id, page]);

  const loadStoreInfo = async () => {
    try {
      const { data } = await marketplaceService.getStoreDetail(id);
      const store = data.data || data;
      setStoreName(store.nombre || '');
      setRatingPromedio(store.agregado_calificacion?.promedio || store.rating_promedio || 0);
      setRatingTotalCount(store.agregado_calificacion?.total || store.total_calificaciones || 0);
    } catch {
      toast.error('Tienda no encontrada');
    }
  };

  const loadRatings = async () => {
    setLoading(true);
    try {
      const { data } = await marketplaceService.getStoreRatings(id, {
        page,
        limit: 10,
      });
      setRatings(Array.isArray(data.data) ? data.data : []);
      setTotalPages(data.pagination?.pages || 1);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  if (loading && page === 1) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          to={`/comprador/tiendas/${id}`}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <HiOutlineChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-display">
            Calificaciones
          </h1>
          <p className="text-sm text-gray-500">{storeName}</p>
        </div>
      </div>

      {/* Rating summary */}
      <div className="bg-accent-50 rounded-2xl border border-accent-100 p-4 mb-4 flex items-center gap-3">
        <StarRating value={parseFloat(ratingPromedio) || 0} readonly size="sm" />
        <span className="text-sm font-semibold text-accent-700">
          {parseFloat(ratingPromedio).toFixed(1)}
        </span>
        <span className="text-xs text-accent-600">
          ({ratingTotalCount} {ratingTotalCount === 1 ? 'opinion' : 'opiniones'})
        </span>
      </div>

      {/* Ratings list */}
      <div className="bg-accent-50 rounded-2xl border border-accent-100 p-5">
        {ratings.length === 0 ? (
          <p className="text-sm text-gray-400">Sin calificaciones aun</p>
        ) : (
          <div className="space-y-3">
            {ratings.map((r) => (
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
                  <span className="text-xs font-medium text-accent-600">
                    {r.estrellas?.toFixed(1) || '0.0'}
                  </span>
                </div>
                {r.comentario && (
                  <p className="text-sm text-gray-600">{r.comentario}</p>
                )}
              </div>
            ))}
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
