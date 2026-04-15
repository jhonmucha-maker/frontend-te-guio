import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';
import { marketplaceService } from '../../services/marketplaceService';
import { catalogService } from '../../services/catalogService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import StarRating from '../../components/ui/StarRating';
import StatusBadge from '../../components/ui/StatusBadge';
import {
  HiOutlineSearch,
  HiOutlineOfficeBuilding,
  HiOutlineLocationMarker,
  HiOutlineCube,
} from 'react-icons/hi';

export default function StoreSearchPage() {
  const { usuario } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const restoredRef = useRef(
    searchParams.has('q') || searchParams.has('id_ciudad') || searchParams.has('id_zona')
  );
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [zones, setZones] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [filters, setFilters] = useState(() => ({
    q: searchParams.get('q') || '',
    id_ciudad: searchParams.get('id_ciudad') || '',
    id_zona: searchParams.get('id_zona') || '',
    page: Number(searchParams.get('page')) || 1,
  }));

  useEffect(() => {
    catalogService.getCities().then((r) => {
      setCities(r.data?.data || []);
      if (!restoredRef.current && usuario?.id_ciudad) {
        setFilters((prev) => ({ ...prev, id_ciudad: String(usuario.id_ciudad) }));
      }
    }).catch(() => {});
  }, [usuario?.id_ciudad]);

  useEffect(() => {
    if (filters.id_ciudad) {
      catalogService.getZones(filters.id_ciudad).then((r) => setZones(r.data?.data || [])).catch(() => {});
    } else {
      setZones([]);
    }
  }, [filters.id_ciudad]);

  useEffect(() => {
    fetchStores();
  }, [filters.page]);

  const fetchStores = async () => {
    setLoading(true);
    // Persist filters in URL for back-navigation
    const sp = new URLSearchParams();
    if (filters.q) sp.set('q', filters.q);
    if (filters.id_ciudad) sp.set('id_ciudad', filters.id_ciudad);
    if (filters.id_zona) sp.set('id_zona', filters.id_zona);
    if (filters.page > 1) sp.set('page', String(filters.page));
    setSearchParams(sp, { replace: true });
    try {
      const params = { page: filters.page, limit: 12 };
      if (filters.q) params.q = filters.q;
      if (filters.id_ciudad) params.id_ciudad = filters.id_ciudad;
      if (filters.id_zona) params.id_zona = filters.id_zona;

      const { data } = await marketplaceService.searchStores(params);
      setStores(data.stores || data);
      setPagination({
        page: data.page || filters.page,
        totalPages: data.totalPages || 1,
      });
    } catch {
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    fetchStores();
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header mb-6">
        <h1>Tiendas</h1>
        <p>Encuentra tu tienda ideal</p>
      </div>

      {/* Filter Card */}
      <form onSubmit={handleSearch} className="bg-surface rounded-2xl shadow-card border border-gray-100/80 p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <div className="relative">
              <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                className="input-field pl-10 text-sm"
                placeholder="Buscar tienda..."
              />
            </div>
          </div>
          <select
            value={filters.id_ciudad}
            onChange={(e) => setFilters({ ...filters, id_ciudad: e.target.value, id_zona: '' })}
            className="input-field text-sm"
          >
            <option value="">Todas las ciudades</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <select
            value={filters.id_zona}
            onChange={(e) => setFilters({ ...filters, id_zona: e.target.value })}
            className="input-field text-sm"
            disabled={!filters.id_ciudad}
          >
            <option value="">Todas las zonas</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.nombre}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary text-sm mt-4">
          Buscar
        </button>
      </form>

      {loading ? (
        <LoadingSpinner />
      ) : stores.length === 0 ? (
        <EmptyState
          icon={HiOutlineOfficeBuilding}
          title="No se encontraron tiendas"
          description="Intente con otros filtros"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map((s) => (
              <Link
                key={s.id}
                to={`/comprador/tiendas/${s.id}`}
                className="bg-surface rounded-2xl shadow-card border border-gray-100/80 p-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
                      <HiOutlineOfficeBuilding className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 font-display">{s.nombre}</h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <HiOutlineLocationMarker className="w-3 h-3" />
                        {s.galeria?.nombre}
                      </p>
                    </div>
                  </div>
                  {s.suscripcion_activa?.plan?.tipo === 'PREMIUM' && (
                    <StatusBadge status="PREMIUM" />
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-1.5">
                    <StarRating value={s.rating_promedio || 0} readonly size="sm" />
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">({s.total_calificaciones || 0})</span>
                  </div>
                  <span className="text-xs text-gray-400 flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-full">
                    <HiOutlineCube className="w-3 h-3" />
                    {s.total_productos || 0} productos
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => setFilters({ ...filters, page: p })}
          />
        </>
      )}
    </div>
  );
}
