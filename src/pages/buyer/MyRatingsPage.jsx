import { useState, useEffect } from 'react';
import { buyerService } from '../../services/buyerService';
import { formatDateTime } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import StarRating from '../../components/ui/StarRating';
import { HiOutlineStar } from 'react-icons/hi';

export default function MyRatingsPage() {
  const [data, setData] = useState({ productos: [], tiendas: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('productos');

  useEffect(() => {
    buyerService.getMyRatings()
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const items = tab === 'productos' ? data.productos : data.tiendas;

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header mb-6">
        <h1>Mis Calificaciones</h1>
        <p>Revisa todas tus valoraciones</p>
      </div>

      {/* Chips/Tabs */}
      <div className="flex gap-2 mb-6">
        {['productos', 'tiendas'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`chip ${
              tab === t ? 'chip-active' : 'chip-inactive'
            }`}
          >
            {t === 'productos' ? `Productos (${data.productos.length})` : `Tiendas (${data.tiendas.length})`}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={HiOutlineStar}
          title="Sin calificaciones"
          description="Sus calificaciones apareceran aqui"
        />
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <div key={r.id} className="bg-surface rounded-2xl shadow-card border border-gray-100/80 p-5 hover:shadow-card-hover transition-all duration-200 animate-slide-up">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 font-display">
                  {tab === 'productos' ? r.producto?.nombre : r.tienda?.nombre}
                </h3>
                <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                  {formatDateTime(r.fecha_hora_registro)}
                </span>
              </div>
              <div className="bg-amber-50 rounded-xl px-3 py-2 inline-flex items-center gap-2 mb-2">
                <StarRating value={r.puntuacion} readonly size="sm" />
                <span className="text-xs font-semibold text-amber-600">{r.puntuacion}/5</span>
              </div>
              {r.comentario && (
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{r.comentario}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
