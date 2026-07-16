import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useSSEListener } from '../../hooks/useSSEListener';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ExportButton from '../../components/ui/ExportButton';
import toast from 'react-hot-toast';
import {
  HiOutlineCube, HiOutlineCheck, HiOutlineBan, HiOutlineSearch, HiOutlineX,
} from 'react-icons/hi';

import { resolveFileUrl } from '../../utils/constants';

export default function ProductManagementPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await adminService.getPendingProducts();
      setProducts(res.data.filter(p => p.estado_aprobacion === 'APROBADO'));
    } catch {
      toast.error('Error al cargar productos');
    } finally { setLoading(false); }
  };

  useSSEListener(['admin.pending.product'], loadProducts);

  const activeProducts = products.filter(p => p.estado === 'ACTIVE');
  const inactiveProducts = products.filter(p => p.estado !== 'ACTIVE');

  const filtered = products.filter(p => {
    const searchLower = search.toLowerCase();
    const matchSearch = !search ||
      (p.nombre || '').toLowerCase().includes(searchLower) ||
      (p.tienda?.nombre || '').toLowerCase().includes(searchLower) ||
      (p.tienda?.vendedor_nombre || '').toLowerCase().includes(searchLower);
    const matchFilter = filter === 'all' ||
      (filter === 'active' ? p.estado === 'ACTIVE' : p.estado !== 'ACTIVE');
    return matchSearch && matchFilter;
  });

  const handleToggle = async (id) => {
    try {
      await adminService.approveProduct(id, { toggle_active: true });
      toast.success('Estado actualizado');
      loadProducts();
      if (selectedProduct?.id === id) setSelectedProduct(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  return (
    <div className="animate-fade-in pt-2">

      {/* Exportar */}
      <div className="mb-4">
        <ExportButton exportFn={adminService.exportProducts} baseName="productos" />
      </div>

      {/* Stats compactos */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-surface rounded-xl shadow-sm border border-gray-100/80 p-3 text-center">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-1"><HiOutlineCube className="w-4 h-4 text-primary-600" /></div>
          <p className="text-lg font-bold font-display text-primary-600">{products.length}</p>
          <p className="text-[10px] text-gray-500">Total</p>
        </div>
        <div className="bg-surface rounded-xl shadow-sm border border-gray-100/80 p-3 text-center">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-1"><HiOutlineCheck className="w-4 h-4 text-green-600" /></div>
          <p className="text-lg font-bold font-display text-green-600">{activeProducts.length}</p>
          <p className="text-[10px] text-gray-500">Activos</p>
        </div>
        <div className="bg-surface rounded-xl shadow-sm border border-gray-100/80 p-3 text-center">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-1"><HiOutlineBan className="w-4 h-4 text-red-600" /></div>
          <p className="text-lg font-bold font-display text-red-600">{inactiveProducts.length}</p>
          <p className="text-[10px] text-gray-500">Inactivos</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-surface rounded-2xl shadow-card border border-gray-100/80 p-4 mb-4">
        <div className="relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto, tienda o vendedor..." className="input-field pl-10 text-sm" />
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'all', label: `Todos (${products.length})` },
          { key: 'active', label: `Activos (${activeProducts.length})` },
          { key: 'inactive', label: `Inactivos (${inactiveProducts.length})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`chip whitespace-nowrap ${filter === f.key ? 'chip-active' : 'chip-inactive'}`}>{f.label}</button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={HiOutlineCube} title="Sin productos" />
      ) : (
        <div className="space-y-3">
          {filtered.map(product => {
            const isActive = product.estado === 'ACTIVE';
            const photoUrl = product.fotos?.[0]?.url ? resolveFileUrl(product.fotos[0].url) : null;
            return (
              <div key={product.id} className="card cursor-pointer" onClick={() => setSelectedProduct(product)}>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-gray-900">{product.nombre}</h3>
                  <div className="ml-auto" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggle(product.id)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${isActive ? 'bg-seller-500' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-surface rounded-full shadow transition-transform ${isActive ? 'left-6' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500">{product.tienda?.nombre || '-'}</p>
                {photoUrl && <img src={photoUrl} alt="" className="w-full h-28 object-cover rounded-xl mt-2" />}
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500"><span className="font-medium">Vendedor:</span> {product.tienda?.vendedor_nombre || '-'}</p>
                  <p className="text-xs text-gray-500"><span className="font-medium">Categoria:</span> {product.categoria || '-'}</p>
                  <p className="text-xs text-gray-500"><span className="font-medium">Precio:</span> S/ {Number(product.precio).toFixed(2)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Modal open={!!selectedProduct} onClose={() => setSelectedProduct(null)} title="Detalle del Producto" maxWidth="max-w-md">
        {selectedProduct && (() => {
          const isActive = selectedProduct.estado === 'ACTIVE';
          const tienda = selectedProduct.tienda;

          return (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              {selectedProduct.fotos?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Galeria ({selectedProduct.fotos.length} imagenes)</p>
                  <div className="flex gap-2 overflow-x-auto">
                    {selectedProduct.fotos.map((f, i) => (
                      <img
                        key={i}
                        src={resolveFileUrl(f.url)}
                        alt=""
                        onClick={() => setLightboxImg(resolveFileUrl(f.url))}
                        className="w-24 h-24 object-cover rounded-xl flex-shrink-0 cursor-pointer active:opacity-70 transition-opacity"
                      />
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Informacion del Producto</p>
                <p className="text-sm"><span className="font-medium text-gray-500">Nombre:</span> {selectedProduct.nombre}</p>
                <p className="text-sm"><span className="font-medium text-gray-500">Descripcion:</span> {selectedProduct.descripcion || '-'}</p>
                <p className="text-sm"><span className="font-medium text-gray-500">Categoria:</span> {selectedProduct.categoria || '-'}</p>
                <p className="text-sm"><span className="font-medium text-gray-500">Precio:</span> S/ {Number(selectedProduct.precio).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Propietario</p>
                <p className="text-sm"><span className="font-medium text-gray-500">Vendedor:</span> {tienda?.vendedor_nombre || '-'}</p>
                <p className="text-sm"><span className="font-medium text-gray-500">Email:</span> {tienda?.vendedor_correo || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Ubicacion de la Tienda</p>
                <p className="text-sm"><span className="font-medium text-gray-500">Ciudad:</span> {tienda?.ciudad || '-'}</p>
                <p className="text-sm"><span className="font-medium text-gray-500">Zona:</span> {tienda?.zona || '-'}</p>
                <p className="text-sm"><span className="font-medium text-gray-500">Galeria:</span> {tienda?.galeria || '-'}</p>
                <p className="text-sm"><span className="font-medium text-gray-500">Stand / Local:</span> {tienda?.numero_local || '-'}</p>
                <p className="text-sm"><span className="font-medium text-gray-500">Tienda:</span> {tienda?.nombre || '-'}</p>
              </div>
              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                <span className="text-sm font-medium text-gray-700">Producto Activo</span>
                <button
                  onClick={() => handleToggle(selectedProduct.id)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${isActive ? 'bg-seller-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-surface rounded-full shadow transition-transform ${isActive ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="btn-secondary w-full text-sm">Cerrar</button>
            </div>
          );
        })()}
      </Modal>

      {/* Fullscreen Image Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[60] bg-black flex flex-col"
          onClick={() => setLightboxImg(null)}
        >
          <div className="flex items-center justify-end px-4 py-3 flex-shrink-0">
            <button
              onClick={() => setLightboxImg(null)}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <HiOutlineX className="w-6 h-6" />
            </button>
          </div>
          <div
            className="flex-1 flex items-center justify-center px-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImg}
              alt="Producto"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
