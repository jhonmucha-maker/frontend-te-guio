import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { openExternal } from '../../utils/navigation';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import {
  HiOutlineOfficeBuilding, HiOutlineCheck, HiOutlineBan, HiOutlineSearch,
  HiOutlineStar, HiOutlineClock, HiOutlineLocationMarker,
} from 'react-icons/hi';

import { resolveFileUrl } from '../../utils/constants';

export default function StoreManagementPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedStore, setSelectedStore] = useState(null);

  useEffect(() => { loadStores(); }, []);

  const loadStores = async () => {
    setLoading(true);
    try {
      const res = await adminService.getPendingStores();
      setStores(res.data);
    } catch {
      toast.error('Error al cargar tiendas');
    } finally { setLoading(false); }
  };

  const approvedStores = stores.filter(s => s.estado_aprobacion === 'APROBADO');
  const activeStores = approvedStores.filter(s => s.activo);
  const inactiveStores = approvedStores.filter(s => !s.activo);
  const premiumStores = approvedStores.filter(s => s.es_premium);
  const porVencer = approvedStores.filter(s => {
    if (!s.es_premium) return false;
    return true;
  }).length;

  const filtered = approvedStores.filter(s => {
    const searchLower = search.toLowerCase();
    const matchSearch = !search ||
      (s.nombre || '').toLowerCase().includes(searchLower) ||
      (s.vendedor?.nombre || '').toLowerCase().includes(searchLower) ||
      (s.galeria?.nombre || '').toLowerCase().includes(searchLower);
    const matchFilter = filter === 'all' ||
      (filter === 'active' ? s.activo : !s.activo);
    return matchSearch && matchFilter;
  });

  const handleToggleStore = async (id) => {
    try {
      await adminService.approveStore(id, { toggle_active: true });
      toast.success('Estado actualizado');
      loadStores();
      if (selectedStore?.id === id) setSelectedStore(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  return (
    <div className="animate-fade-in pt-2">

      {/* Stats */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-1 justify-between">
        {[
          { icon: HiOutlineOfficeBuilding, value: approvedStores.length, label: 'Total', bg: 'bg-primary-100', color: 'text-primary-600' },
          { icon: HiOutlineCheck, value: activeStores.length, label: 'Activas', bg: 'bg-green-100', color: 'text-green-600' },
          { icon: HiOutlineBan, value: inactiveStores.length, label: 'Inactivas', bg: 'bg-red-100', color: 'text-red-600' },
          { icon: HiOutlineStar, value: premiumStores.length, label: 'Premium', bg: 'bg-warning-100', color: 'text-warning-600' },
          { icon: HiOutlineClock, value: 0, label: 'Por Vencer', bg: 'bg-orange-100', color: 'text-orange-600' },
        ].map((s, i) => (
          <div key={i} className="flex-shrink-0 flex flex-col items-center min-w-[60px]">
            <div className={`w-11 h-11 rounded-full ${s.bg} flex items-center justify-center mb-1`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className={`text-base font-bold font-display ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-surface rounded-2xl shadow-card border border-gray-100/80 p-4 mb-6">
        <div className="relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar tienda, vendedor o galería..." className="input-field pl-10 text-sm" />
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { key: 'all', label: `Todas (${approvedStores.length})` },
          { key: 'active', label: `Activas (${activeStores.length})` },
          { key: 'inactive', label: `Inactivas (${inactiveStores.length})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`chip whitespace-nowrap ${filter === f.key ? 'chip-active' : 'chip-inactive'}`}>{f.label}</button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={HiOutlineOfficeBuilding} title="Sin tiendas" />
      ) : (
        <div className="space-y-3">
          {filtered.map(store => {
            const photoUrl = store.fotos?.[0]?.url ? resolveFileUrl(store.fotos[0].url) : null;
            return (
              <div key={store.id} className="card cursor-pointer" onClick={() => setSelectedStore(store)}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-gray-900">{store.nombre}</h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${store.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {store.activo ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{store.vendedor?.nombre || '-'}</p>
                {photoUrl && <img src={photoUrl} alt="" className="w-full h-32 object-cover rounded-xl mb-3" />}
                <div className="space-y-1">
                  <p className="text-xs text-gray-500"><span className="font-medium">Galería:</span> {store.galeria?.nombre || '-'}</p>
                  <p className="text-xs text-gray-500"><span className="font-medium">Productos:</span> {store.productos_count} productos</p>
                  <p className="text-xs text-gray-500"><span className="font-medium">Puesto:</span> {store.numero_local || store.direccion || '-'}</p>
                </div>
                <div className="flex justify-end mt-3" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleToggleStore(store.id)}
                    className={`text-xs font-semibold px-4 py-2 rounded-xl border transition-all flex items-center gap-1 ${
                      store.activo
                        ? 'text-red-600 border-red-200 bg-red-50 hover:bg-red-100'
                        : 'text-green-600 border-green-200 bg-green-50 hover:bg-green-100'
                    }`}
                  >
                    <HiOutlineBan className="w-3.5 h-3.5" />
                    {store.activo ? 'Deshabilitar' : 'Habilitar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={!!selectedStore}
        onClose={() => setSelectedStore(null)}
        title={
          selectedStore ? (
            <span className="flex items-center justify-between w-full">
              Detalle de Tienda
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${selectedStore.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {selectedStore.activo ? 'Activa' : 'Inactiva'}
              </span>
            </span>
          ) : 'Detalle de Tienda'
        }
        maxWidth="max-w-md"
      >
        {selectedStore && (
          <div className="space-y-5">
            {/* Logo / Foto principal */}
            {selectedStore.fotos?.[0]?.url && (
              <img src={resolveFileUrl(selectedStore.fotos[0].url)} alt="" className="w-full h-40 object-cover rounded-xl" />
            )}

            {/* Información de la Tienda */}
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Información de la Tienda</p>
              <p className="text-sm"><span className="font-semibold text-gray-700">Nombre:</span> {selectedStore.nombre}</p>
              <p className="text-sm"><span className="font-semibold text-gray-700">Descripción:</span> {selectedStore.descripcion || '-'}</p>
              <p className="text-sm"><span className="font-semibold text-gray-700">Puesto:</span> {selectedStore.numero_local || selectedStore.direccion || '-'}</p>
              <p className="text-sm"><span className="font-semibold text-gray-700">Productos:</span> {selectedStore.productos_count} productos</p>
            </div>

            {/* Ubicación */}
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Ubicación</p>
              <p className="text-sm"><span className="font-semibold text-gray-700">Ciudad:</span> {selectedStore.galeria?.ciudad || '-'}</p>
              <p className="text-sm"><span className="font-semibold text-gray-700">Zona Comercial:</span> {selectedStore.galeria?.zona || '-'}</p>
              <p className="text-sm"><span className="font-semibold text-gray-700">Galería:</span> {selectedStore.galeria?.nombre || '-'}</p>
              <p className="text-sm"><span className="font-semibold text-gray-700">Dirección Galería:</span> {selectedStore.galeria?.direccion || '-'}</p>
            </div>

            {/* Información del Vendedor */}
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Información del Vendedor</p>
              <p className="text-sm"><span className="font-semibold text-gray-700">Vendedor:</span> {selectedStore.vendedor?.nombre || '-'}</p>
            </div>

            {/* Galería (fotos de la galería) */}
            {selectedStore.galeria?.fotos?.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Galería</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selectedStore.galeria.fotos.map((f, i) => (
                    <img key={i} src={resolveFileUrl(f.url)} alt="" className="w-28 h-28 object-cover rounded-xl flex-shrink-0" />
                  ))}
                </div>
              </div>
            )}

            {/* Ver en Google Maps */}
            {selectedStore.galeria?.latitud && selectedStore.galeria?.longitud && (
              <button
                type="button"
                onClick={() => openExternal(`https://www.google.com/maps?q=${selectedStore.galeria.latitud},${selectedStore.galeria.longitud}`)}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#312c85] hover:bg-[#28236e] transition-colors flex items-center justify-center gap-2"
              >
                <HiOutlineLocationMarker className="w-5 h-5" />
                Ver en Google Maps
              </button>
            )}

            {/* Deshabilitar / Habilitar */}
            <button
              onClick={() => handleToggleStore(selectedStore.id)}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-1 ${
                selectedStore.activo
                  ? 'text-red-600 border-red-200 bg-red-50 hover:bg-red-100'
                  : 'text-green-600 border-green-200 bg-green-50 hover:bg-green-100'
              }`}
            >
              <HiOutlineBan className="w-4 h-4" />
              {selectedStore.activo ? 'Deshabilitar' : 'Habilitar'}
            </button>

            {/* Cerrar */}
            <button onClick={() => setSelectedStore(null)} className="w-full text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors py-1">
              Cerrar
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
