import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { marketplaceService } from '../../services/marketplaceService';
import { formatCurrency } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  HiOutlineSearch,
  HiOutlineChevronRight,
  HiOutlineChevronLeft,
} from 'react-icons/hi';

export default function StoreProductsPage() {
  const { id } = useParams();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    loadStore();
  }, [id]);

  const loadStore = async () => {
    setLoading(true);
    try {
      const { data } = await marketplaceService.getStoreDetail(id);
      setStore(data.data || data);
    } catch {
      toast.error('Tienda no encontrada');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const products = store?.productos || [];
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.nombre?.toLowerCase().includes(q) ||
        p.descripcion?.toLowerCase().includes(q)
    );
  }, [store?.productos, productSearch]);

  if (loading) return <LoadingSpinner />;
  if (!store) return null;

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
            Productos
          </h1>
          <p className="text-sm text-gray-500">{store.nombre}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
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
        {filteredProducts.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {filteredProducts.map((p) => (
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
    </div>
  );
}
