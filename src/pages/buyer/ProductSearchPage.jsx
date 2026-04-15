import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../features/auth/useAuth';
import { marketplaceService } from '../../services/marketplaceService';
import { catalogService } from '../../services/catalogService';
import { buyerService } from '../../services/buyerService';
import { formatCurrency } from '../../utils/formatters';
import { resolveFileUrl } from '../../utils/constants';
import { showSuccessSnackbar } from '../../utils/snackbar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import {
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineHeart,
  HiHeart,
  HiOutlineChevronUp,
  HiOutlineChevronDown,
  HiOutlineStar,
  HiOutlineCube,
} from 'react-icons/hi';
import { TbShoppingCartPlus } from 'react-icons/tb';

export default function ProductSearchPage() {
  const { usuario } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const restoredRef = useRef(searchParams.has('searched'));
  const skipZoneResetRef = useRef(restoredRef.current);

  // --- Data state ---
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [zones, setZones] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  // --- UI state ---
  const [loading, setLoading] = useState(() => restoredRef.current);
  const [hasSearched, setHasSearched] = useState(() => restoredRef.current);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [togglingFav, setTogglingFav] = useState(null);
  const [addingToCart, setAddingToCart] = useState(null);

  // --- Filter state (restore from URL if returning from detail page) ---
  const [filters, setFilters] = useState(() => ({
    q: searchParams.get('q') || '',
    id_categoria: searchParams.get('id_categoria') || '',
    id_ciudad: searchParams.get('id_ciudad') || '',
    id_zona: searchParams.get('id_zona') || '',
  }));

  // Count active filters (only dropdown filters, not search text)
  const activeFilterCount = [
    filters.id_ciudad,
    filters.id_zona,
    filters.id_categoria,
  ].filter(Boolean).length;

  // --- Load catalogs on mount + auto-select user's city ---
  useEffect(() => {
    catalogService.getCategories().then((r) => setCategories(r.data?.data || [])).catch(() => {});
    catalogService.getCities().then((r) => {
      setCities(r.data?.data || []);
      // Auto-select user's registered city (skip if restoring from URL)
      if (!restoredRef.current && usuario?.id_ciudad) {
        setFilters((prev) => ({ ...prev, id_ciudad: String(usuario.id_ciudad) }));
      }
    }).catch(() => {});
    buyerService
      .getFavoriteProducts()
      .then((r) => {
        const favArr = Array.isArray(r.data) ? r.data : (r.data?.data || []);
        const ids = new Set(favArr.map((f) => f.id_producto || f.id));
        setFavoriteIds(ids);
      })
      .catch(() => {});
  }, [usuario?.id_ciudad]);

  // --- Load zones when city changes ---
  useEffect(() => {
    if (filters.id_ciudad) {
      catalogService
        .getZones(filters.id_ciudad)
        .then((r) => setZones(r.data?.data || []))
        .catch(() => setZones([]));
    } else {
      setZones([]);
    }
    // Reset zone when city changes (skip on initial restore from URL)
    if (skipZoneResetRef.current) {
      skipZoneResetRef.current = false;
    } else {
      setFilters((prev) => ({ ...prev, id_zona: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.id_ciudad]);

  // --- Search products ---
  const handleSearch = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      setLoading(true);
      setHasSearched(true);
      // Collapse filters after searching on mobile
      setFiltersOpen(false);
      // Persist filters in URL for back-navigation
      const sp = new URLSearchParams();
      sp.set('searched', '1');
      if (filters.q) sp.set('q', filters.q);
      if (filters.id_categoria) sp.set('id_categoria', filters.id_categoria);
      if (filters.id_ciudad) sp.set('id_ciudad', filters.id_ciudad);
      if (filters.id_zona) sp.set('id_zona', filters.id_zona);
      setSearchParams(sp, { replace: true });
      try {
        const params = { limit: 50 };
        if (filters.q) params.q = filters.q;
        if (filters.id_categoria) params.category_id = filters.id_categoria;
        if (filters.id_ciudad) params.city_id = filters.id_ciudad;
        if (filters.id_zona) params.zone_id = filters.id_zona;

        const { data } = await marketplaceService.searchProducts(params);
        setProducts(Array.isArray(data.data) ? data.data : []);
      } catch {
        setProducts([]);
        toast.error('Error al buscar productos');
      } finally {
        setLoading(false);
      }
    },
    [filters, setSearchParams],
  );

  // Auto-search on mount when returning from product detail
  useEffect(() => {
    if (restoredRef.current) {
      restoredRef.current = false;
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Toggle favorite ---
  const handleToggleFavorite = async (productId) => {
    if (togglingFav) return;
    setTogglingFav(productId);
    try {
      await buyerService.toggleFavoriteProduct(productId);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (next.has(productId)) {
          next.delete(productId);
        } else {
          next.add(productId);
        }
        return next;
      });
    } catch {
      toast.error('No se pudo actualizar favorito');
    } finally {
      setTogglingFav(null);
    }
  };

  // --- Add to shopping list ---
  const handleAddToCart = async (product) => {
    if (addingToCart) return;
    setAddingToCart(product.id);
    try {
      await buyerService.addShoppingItem({
        tipo: 'PRODUCT',
        product_id: product.id,
        cantidad: 1,
      });
      showSuccessSnackbar('Producto agregado a la lista');
    } catch {
      toast.error('No se pudo agregar el producto');
    } finally {
      setAddingToCart(null);
    }
  };

  // --- Filter change helper ---
  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="animate-fade-in pb-6">
      {/* ============ FILTERS CARD ============ */}
      <form onSubmit={handleSearch} className="bg-surface rounded-2xl shadow-card border border-gray-100/80 mb-5 overflow-hidden">
        {/* Collapsible header - toggles dropdown filters */}
        <button
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="w-full flex items-center justify-between px-4 py-3.5"
        >
          <div className="flex items-center gap-2">
            <HiOutlineFilter className="w-5 h-5 text-primary-600" />
            <span className="text-sm font-semibold text-gray-800 font-display">
              Filtros
            </span>
            {activeFilterCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-600 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </div>
          {filtersOpen ? (
            <HiOutlineChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <HiOutlineChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {/* Collapsible body - only dropdown filters */}
        {filtersOpen && (
          <div className="px-4 pb-3 space-y-3">
            {/* Ciudad + Zona row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Ciudad
                </label>
                <select
                  value={filters.id_ciudad}
                  onChange={(e) => updateFilter('id_ciudad', e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="">Todas</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Zona
                </label>
                <select
                  value={filters.id_zona}
                  onChange={(e) => updateFilter('id_zona', e.target.value)}
                  className="input-field text-sm"
                  disabled={!filters.id_ciudad}
                >
                  <option value="">Todas</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Categoria
              </label>
              <select
                value={filters.id_categoria}
                onChange={(e) => updateFilter('id_categoria', e.target.value)}
                className="input-field text-sm"
              >
                <option value="">Todas las categorias</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Search input + button - ALWAYS visible */}
        <div className="px-4 pb-4 space-y-3">
          <div className="relative">
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filters.q}
              onChange={(e) => updateFilter('q', e.target.value)}
              className="input-field pl-10 text-sm"
              placeholder="Buscar productos..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-sm flex items-center justify-center gap-2"
          >
            <HiOutlineSearch className="w-4 h-4" />
            Buscar
          </button>
        </div>
      </form>

      {/* ============ RESULTS SECTION ============ */}
      {loading ? (
        <LoadingSpinner />
      ) : !hasSearched ? (
        /* Initial empty state - no search performed yet */
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="bg-primary-50 rounded-full p-6 mb-5">
            <HiOutlineSearch className="w-16 h-16 text-primary-200" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2 font-display">
            Busca productos
          </h3>
          <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
            Selecciona una ciudad o zona y presiona el boton &lsquo;Buscar&rsquo; para ver los productos disponibles.
          </p>
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={HiOutlineSearch}
          title="No se encontraron productos"
          description="Intenta con otros filtros de busqueda"
        />
      ) : (
        <>
          {/* Results header */}
          <div className="flex items-center gap-2 mb-4 px-1">
            <span className="text-sm font-semibold text-gray-700 font-display">
              Resultados:
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-50 text-primary-600 border border-primary-200">
              {products.length} producto{products.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Product list */}
          <div className="space-y-3">
            {products.map((p) => {
              const isFav = favoriteIds.has(p.id);
              return (
                <div
                  key={p.id}
                  className="bg-surface rounded-2xl shadow-card border border-gray-100/80 p-3 flex items-stretch gap-3 animate-fade-in"
                >
                  {/* Image + Favorite overlay */}
                  <div className="relative flex-shrink-0 w-20 h-20">
                    <Link to={`/comprador/productos/${p.id}`} className="block w-full h-full">
                      {p.foto ? (
                        <img
                          src={resolveFileUrl(p.foto)}
                          alt={p.nombre}
                          className="w-full h-full object-contain rounded-xl bg-gray-50"
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <div
                        className="w-full h-full rounded-xl bg-gray-100 items-center justify-center"
                        style={{ display: p.foto ? 'none' : 'flex' }}
                      >
                        <HiOutlineCube className="w-7 h-7 text-gray-300" />
                      </div>
                    </Link>
                    {/* Favorite button overlaid on image */}
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(p.id)}
                      disabled={togglingFav === p.id}
                      className={`absolute top-1 right-1 w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-200 shadow-sm ${
                        isFav
                          ? 'bg-white/90 text-red-500'
                          : 'bg-white/70 text-gray-400 hover:bg-white/90'
                      }`}
                    >
                      {isFav ? (
                        <HiHeart className="w-4 h-4" />
                      ) : (
                        <HiOutlineHeart className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Product info (middle, tappable to detail) */}
                  <Link
                    to={`/comprador/productos/${p.id}`}
                    className="flex-1 min-w-0 flex flex-col justify-center"
                  >
                    <h3 className="text-sm font-semibold text-gray-900 truncate font-display">
                      {p.nombre}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-base font-bold text-coral-500">
                        {p.precio_visible !== false ? formatCurrency(p.precio) : 'Consultar precio'}
                      </p>
                      {(parseFloat(p.rating?.promedio) > 0) && (
                        <span className="inline-flex items-center gap-0.5 bg-accent-50 text-accent-600 text-[11px] font-bold px-1.5 py-0.5 rounded-md">
                          <HiOutlineStar className="w-3 h-3" />
                          {Number(p.rating.promedio).toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-gray-400">Vendedor:</span>
                      <span className="text-xs font-semibold text-gray-900 truncate">
                        {p.tienda?.nombre || 'Sin tienda'}
                      </span>
                    </div>
                  </Link>

                  {/* Add to cart button */}
                  <div className="flex items-center flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(p)}
                      disabled={addingToCart === p.id}
                      className="w-10 h-10 rounded-full bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center transition-colors duration-200 shadow-md active:scale-95"
                    >
                      <TbShoppingCartPlus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
