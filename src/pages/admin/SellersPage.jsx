import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Capacitor } from '@capacitor/core';
import { formatDateTime } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import {
  HiOutlineUsers,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineOfficeBuilding,
  HiOutlineDownload,
  HiOutlineStar,
  HiOutlinePhone,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineX,
} from 'react-icons/hi';

export default function SellersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Filtros avanzados
  const [showFilters, setShowFilters] = useState(false);
  const [cities, setCities] = useState([]);
  const [zones, setZones] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [filterCity, setFilterCity] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterGallery, setFilterGallery] = useState('');

  useEffect(() => {
    loadUsers();
    loadFilterOptions();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getSellers();
      setUsers(res.data.vendedores || []);
    } catch {
      toast.error('Error al cargar vendedores');
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const [citiesRes, zonesRes, galleriesRes] = await Promise.all([
        adminService.getCities(),
        adminService.getZones(),
        adminService.getGalleries(),
      ]);
      setCities(citiesRes.data || []);
      setZones(zonesRes.data || []);
      setGalleries(galleriesRes.data || []);
    } catch {
      // silently fail
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await adminService.toggleUserActive(id);
      toast.success('Estado actualizado');
      loadUsers();
      if (selectedSeller?.id === id) setSelectedSeller(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminService.cascadeDeleteSeller(deleteTarget);
      toast.success('Vendedor eliminado');
      setDeleteTarget(null);
      setSelectedSeller(null);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await adminService.exportSellersExcel();
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      if (Capacitor.isNativePlatform()) {
        // On native Android, use Filesystem to save the file
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result.split(',')[1];
          const fileName = `vendedores_${Date.now()}.xlsx`;
          await Filesystem.writeFile({
            path: fileName,
            data: base64,
            directory: Directory.Documents,
          });
          toast.success(`Archivo guardado en Documentos: ${fileName}`);
        };
        reader.readAsDataURL(blob);
      } else {
        // On web, use standard download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'vendedores.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success('Excel descargado');
      }
    } catch {
      toast.error('Error al exportar');
    } finally {
      setExporting(false);
    }
  };

  const activeFiltersCount = [filterCity, filterZone, filterGallery].filter(Boolean).length;

  const clearFilters = () => {
    setFilterCity('');
    setFilterZone('');
    setFilterGallery('');
  };

  const filtered = users.filter((u) => {
    const searchLower = search.toLowerCase();
    const matchSearch = !search ||
      (u.nombre || '').toLowerCase().includes(searchLower) ||
      (u.correo || '').toLowerCase().includes(searchLower) ||
      (u.tiendas || []).some(t => (t.nombre || '').toLowerCase().includes(searchLower));
    const tiendas = u.tiendas || [];
    const matchFilter = filter === 'all' ||
      (filter === 'premium' ? tiendas.some(t => t.tipo_plan === 'PREMIUM') : filter === 'standard' ? tiendas.some(t => t.tipo_plan === 'ESTANDAR') : true);

    const matchCity = !filterCity || tiendas.some(t => t.ciudad === filterCity);
    const matchZone = !filterZone || tiendas.some(t => t.zona === filterZone);
    const matchGallery = !filterGallery || tiendas.some(t => t.galeria === filterGallery);

    return matchSearch && matchFilter && matchCity && matchZone && matchGallery;
  });

  // Count stores by subscription type, not sellers
  const allStores = users.flatMap(u => u.tiendas || []);
  const premiumCount = allStores.filter(t => t.tipo_plan === 'PREMIUM').length;
  const standardCount = allStores.filter(t => t.tipo_plan === 'ESTANDAR').length;

  return (
    <div className="animate-fade-in pt-2">

      {/* Actions */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors shadow-sm ${showFilters || activeFiltersCount > 0 ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-gray-200 bg-surface text-gray-600 hover:bg-gray-50'}`}
        >
          <HiOutlineFilter className="w-4 h-4" />
          Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          {showFilters ? <HiOutlineChevronUp className="w-3.5 h-3.5" /> : <HiOutlineChevronDown className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
        >
          <HiOutlineDownload className="w-4 h-4" />
          {exporting ? 'Exportando...' : 'Exportar'}
        </button>
      </div>

      {/* Panel de filtros desplegable */}
      {showFilters && (
        <div className="bg-surface rounded-2xl shadow-sm border border-gray-100/80 p-3 mb-4 animate-fade-in">
          <div className="space-y-2">
            <div className="relative">
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className={`w-full text-xs border rounded-lg px-3 py-2 outline-none transition-all appearance-none pr-7 ${
                  filterCity ? 'border-primary-300 bg-primary-50/60 text-primary-700 font-medium' : 'border-gray-200 bg-gray-50/50 text-gray-500'
                } focus:border-primary-400 focus:ring-1 focus:ring-primary-100`}
              >
                <option value="">Ciudad: Todas</option>
                {cities.filter(c => c.activo !== false).map(c => (
                  <option key={c.id} value={c.nombre}>{c.nombre}</option>
                ))}
              </select>
              <HiOutlineChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={filterZone}
                onChange={(e) => setFilterZone(e.target.value)}
                className={`w-full text-xs border rounded-lg px-3 py-2 outline-none transition-all appearance-none pr-7 ${
                  filterZone ? 'border-primary-300 bg-primary-50/60 text-primary-700 font-medium' : 'border-gray-200 bg-gray-50/50 text-gray-500'
                } focus:border-primary-400 focus:ring-1 focus:ring-primary-100`}
              >
                <option value="">Zona: Todas</option>
                {zones.filter(z => z.activo !== false).map(z => (
                  <option key={z.id} value={z.nombre}>{z.nombre}</option>
                ))}
              </select>
              <HiOutlineChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={filterGallery}
                onChange={(e) => setFilterGallery(e.target.value)}
                className={`w-full text-xs border rounded-lg px-3 py-2 outline-none transition-all appearance-none pr-7 ${
                  filterGallery ? 'border-primary-300 bg-primary-50/60 text-primary-700 font-medium' : 'border-gray-200 bg-gray-50/50 text-gray-500'
                } focus:border-primary-400 focus:ring-1 focus:ring-primary-100`}
              >
                <option value="">Galería: Todas</option>
                {galleries.filter(g => g.activo !== false).map(g => (
                  <option key={g.id} value={g.nombre}>{g.nombre}</option>
                ))}
              </select>
              <HiOutlineChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="mt-2 w-full text-[11px] text-red-500 font-semibold flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <HiOutlineX className="w-3 h-3" /> Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Search */}
      <div className="bg-surface rounded-2xl shadow-sm border border-gray-100/80 p-3 mb-4">
        <div className="relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por tienda, email o galería"
            className="input-field pl-10 text-sm"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { key: 'all', label: `Todos (${users.length})` },
          { key: 'premium', label: `Premium (${premiumCount})` },
          { key: 'standard', label: `Estándar (${standardCount})` },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`chip whitespace-nowrap ${filter === f.key ? 'chip-active' : 'chip-inactive'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState icon={HiOutlineUsers} title="Sin vendedores" />
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => (
            <div
              key={u.id}
              className="bg-surface rounded-2xl shadow-sm border border-gray-100/80 p-4 cursor-pointer hover:shadow-md transition-all"
              onClick={() => setSelectedSeller(u)}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-primary-400 to-primary-600">
                  <span className="text-white font-bold text-sm">
                    {(u.nombre || '?').charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 truncate">{u.nombre}</h3>
                  <p className="text-xs text-gray-500 truncate">{u.correo}</p>
                </div>

                {/* Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleActive(u.id);
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${u.activo ? 'bg-seller-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-surface rounded-full shadow transition-transform ${u.activo ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Detalles */}
              <div className="mt-2 pl-[52px] flex items-center gap-3 text-[11px] text-gray-400">
                <HiOutlinePhone className="w-3 h-3 flex-shrink-0" />
                <span>{u.telefono || '–'}</span>
              </div>

              {/* Tiendas */}
              {u.tiendas && u.tiendas.length > 0 ? (
                <div className="mt-2 pl-[52px]">
                  <p className="text-[11px] font-semibold text-gray-500 mb-1">
                    <HiOutlineOfficeBuilding className="w-3 h-3 inline mr-1" />
                    Tiendas ({u.tiendas.length})
                  </p>
                  <div className="space-y-1">
                    {u.tiendas.map((t, i) => (
                      <div key={i} className={`rounded-lg px-2.5 py-1.5 ${t.tipo_plan === 'PREMIUM' ? 'bg-amber-50/60' : t.tipo_plan === 'ESTANDAR' ? 'bg-blue-50/40' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[11px] font-medium text-gray-700">{t.nombre}</p>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${t.tipo_plan === 'PREMIUM' ? 'bg-amber-100 text-amber-700' : t.tipo_plan === 'ESTANDAR' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                            {t.tipo_plan === 'PREMIUM' ? 'Premium' : t.tipo_plan === 'ESTANDAR' ? 'Estandar' : 'Sin suscripcion'}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400">{t.galeria || '–'} · {t.ciudad || '–'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 mt-2 pl-[52px] italic">Sin tiendas registradas</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={!!selectedSeller}
        onClose={() => setSelectedSeller(null)}
        title="Detalle del Vendedor"
        maxWidth="max-w-md"
      >
        {selectedSeller && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3">Información del Vendedor</h3>
              <div className="space-y-2">
                <p className="text-sm"><span className="font-medium text-gray-500">Nombre:</span> {selectedSeller.nombre}</p>
                <p className="text-sm"><span className="font-medium text-gray-500">Email:</span> {selectedSeller.correo}</p>
                <p className="text-sm"><span className="font-medium text-gray-500">Teléfono:</span> {selectedSeller.telefono || '-'}</p>
              </div>
            </div>

            {selectedSeller.tiendas && selectedSeller.tiendas.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3">Tiendas Registradas ({selectedSeller.tiendas.length})</h3>
                {selectedSeller.tiendas.map((t, i) => (
                  <div key={i} className={`bg-gray-50 rounded-xl p-3 border-l-4 mb-2 ${t.tipo_plan === 'PREMIUM' ? 'border-l-amber-400' : t.tipo_plan === 'ESTANDAR' ? 'border-l-blue-400' : 'border-l-gray-300'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-gray-800">{t.nombre}</p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${t.tipo_plan === 'PREMIUM' ? 'bg-amber-100 text-amber-700' : t.tipo_plan === 'ESTANDAR' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                        {t.tipo_plan === 'PREMIUM' ? 'Premium' : t.tipo_plan === 'ESTANDAR' ? 'Estandar' : 'Sin suscripcion'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Galería: {t.galeria || '-'}</p>
                    <p className="text-xs text-gray-500">Ciudad: {t.ciudad || '-'}</p>
                    <p className="text-xs text-gray-500">Zona: {t.zona || '-'}</p>
                  </div>
                ))}
              </div>
            )}

            {selectedSeller.datos_facturacion && (
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3">Datos de Facturación</h3>
                <div className="space-y-1">
                  <p className="text-sm"><span className="font-medium text-gray-500">Tipo:</span> {selectedSeller.datos_facturacion.tipo_documento || '-'}</p>
                  {selectedSeller.datos_facturacion.ruc && (
                    <p className="text-sm"><span className="font-medium text-gray-500">RUC:</span> {selectedSeller.datos_facturacion.ruc}</p>
                  )}
                  {selectedSeller.datos_facturacion.dni && (
                    <p className="text-sm"><span className="font-medium text-gray-500">DNI:</span> {selectedSeller.datos_facturacion.dni}</p>
                  )}
                  {selectedSeller.datos_facturacion.razon_social && (
                    <p className="text-sm"><span className="font-medium text-gray-500">Razón Social:</span> {selectedSeller.datos_facturacion.razon_social}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
              <span className="text-sm font-medium text-gray-700">Vendedor Activo</span>
              <button
                onClick={() => handleToggleActive(selectedSeller.id)}
                className={`relative w-12 h-6 rounded-full transition-colors ${selectedSeller.activo ? 'bg-seller-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-surface rounded-full shadow transition-transform ${selectedSeller.activo ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setDeleteTarget(selectedSeller.id);
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-all"
              >
                Eliminar
              </button>
              <button
                onClick={() => setSelectedSeller(null)}
                className="flex-1 btn-primary text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar vendedor"
        message="Se eliminarán el vendedor, sus tiendas y productos asociados. Esta acción no se puede deshacer."
        confirmText="Eliminar"
      />
    </div>
  );
}
