import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogService } from '../../services/catalogService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import {
  HiOutlineSearch,
  HiOutlineLocationMarker,
  HiOutlineOfficeBuilding,
  HiOutlineChevronDown,
  HiOutlineCheckCircle,
} from 'react-icons/hi';

export default function LocationChangePage() {
  const navigate = useNavigate();

  const [cities, setCities] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState('');
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingZones, setLoadingZones] = useState(false);
  const [search, setSearch] = useState('');

  // Load the previously selected zone from localStorage (if any)
  const [currentZone, setCurrentZone] = useState(() => {
    try {
      const saved = localStorage.getItem('selectedZone');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Fetch cities on mount
  useEffect(() => {
    const loadCities = async () => {
      try {
        const { data } = await catalogService.getCities();
        setCities(data?.data || []);
      } catch {
        toast.error('Error al cargar ciudades');
      } finally {
        setLoadingCities(false);
      }
    };
    loadCities();
  }, []);

  // Fetch zones when a city is selected
  useEffect(() => {
    if (!selectedCityId) {
      setZones([]);
      return;
    }

    const loadZones = async () => {
      setLoadingZones(true);
      try {
        const { data } = await catalogService.getZones(selectedCityId);
        setZones(data?.data || []);
      } catch {
        toast.error('Error al cargar zonas');
        setZones([]);
      } finally {
        setLoadingZones(false);
      }
    };
    loadZones();
  }, [selectedCityId]);

  // Filter zones by search term
  const filteredZones = useMemo(() => {
    if (!search.trim()) return zones;
    const term = search.toLowerCase();
    return zones.filter((z) => z.nombre.toLowerCase().includes(term));
  }, [zones, search]);

  const handleSelectZone = (zone) => {
    const zoneData = { id: zone.id, nombre: zone.nombre };
    localStorage.setItem('selectedZone', JSON.stringify(zoneData));
    setCurrentZone(zoneData);
    toast.success(`Zona actualizada: ${zone.nombre}`);
    navigate(-1);
  };

  if (loadingCities) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      {/* Header Card */}
      <div className="bg-surface rounded-2xl shadow-card border border-gray-100/80 px-6 pt-6 pb-5 mb-6 text-center">
        <h1 className="text-xl font-bold text-gray-900 font-display">Selecciona una zona</h1>
        <p className="text-sm text-gray-400 mt-1">Elige la zona comercial donde deseas buscar</p>
      </div>

      <div className="max-w-lg mx-auto">
      {/* Current Zone Indicator */}
      {currentZone && (
        <div className="bg-surface rounded-2xl shadow-card border border-gray-100/80 p-4 mb-6 flex items-center gap-3 animate-slide-up">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
            <HiOutlineCheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Zona actual</p>
            <p className="text-sm font-semibold text-gray-900 font-display truncate">{currentZone.nombre}</p>
          </div>
        </div>
      )}

      {/* City Selector */}
      <p className="section-title mb-3 px-1">CIUDAD</p>
      <div className="bg-surface rounded-2xl shadow-card border border-gray-100/80 mb-6 overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
            <HiOutlineOfficeBuilding className="w-5 h-5 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Seleccionar ciudad</p>
            <select
              value={selectedCityId}
              onChange={(e) => {
                setSelectedCityId(e.target.value);
                setSearch('');
              }}
              className="w-full text-sm text-gray-800 font-medium bg-transparent border-none p-0 focus:ring-0 mt-0.5 focus:outline-none cursor-pointer"
            >
              <option value="">-- Elige una ciudad --</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <HiOutlineChevronDown className="w-4 h-4 text-gray-300 flex-shrink-0" />
        </div>
      </div>

      {/* Zones Section */}
      {selectedCityId && (
        <>
          <p className="section-title mb-3 px-1">ZONAS DISPONIBLES</p>

          {/* Search Input */}
          <div className="relative mb-4">
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 text-sm"
              placeholder="Buscar zona..."
            />
          </div>

          {/* Zone List */}
          {loadingZones ? (
            <LoadingSpinner size="sm" />
          ) : filteredZones.length === 0 ? (
            <EmptyState
              icon={HiOutlineLocationMarker}
              title="No se encontraron zonas"
              description={search ? 'Intenta con otro termino de busqueda' : 'No hay zonas disponibles para esta ciudad'}
            />
          ) : (
            <div className="space-y-3 animate-slide-up">
              {filteredZones.map((zone) => {
                const isActive = currentZone?.id === zone.id;
                return (
                  <button
                    key={zone.id}
                    onClick={() => handleSelectZone(zone)}
                    className={`w-full bg-surface rounded-2xl shadow-card border p-4 flex items-center gap-4 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group text-left ${
                      isActive
                        ? 'border-primary-300 ring-2 ring-primary-100'
                        : 'border-gray-100/80'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-primary-50 text-primary-400 group-hover:bg-primary-100 group-hover:text-primary-600'
                    }`}>
                      <HiOutlineLocationMarker className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 font-display">{zone.nombre}</p>
                      {isActive && (
                        <p className="text-xs text-primary-500 mt-0.5 font-medium">Zona seleccionada</p>
                      )}
                    </div>
                    {isActive && (
                      <HiOutlineCheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
