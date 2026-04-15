import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  HiOutlinePhotograph,
  HiOutlineLocationMarker,
  HiOutlineTrash,
  HiOutlineX,
} from 'react-icons/hi';

import { resolveFileUrl } from '../../utils/constants';
import { fileToBlob } from '../../utils/fileUtils';

// Fix default marker icon for Leaflet + bundler
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER = { lat: -12.0464, lng: -77.0428 }; // Lima, Peru

function DraggableMarker({ position, onPositionChange }) {
  const markerRef = useRef(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          onPositionChange(lat, lng);
        }
      },
    }),
    [onPositionChange]
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
}

function MapClickHandler({ onPositionChange }) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function GalleryForm({ editItem, onClose, onSaved }) {
  const fileInputRef = useRef(null);
  const [cities, setCities] = useState([]);
  const [zones, setZones] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingZones, setLoadingZones] = useState(false);
  const [newPhotos, setNewPhotos] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);

  const [form, setForm] = useState({
    nombre: '',
    id_ciudad: '',
    id_zona: '',
    direccion: '',
    descripcion: '',
    latitud: '',
    longitud: '',
  });

  const mapPosition = useMemo(() => {
    const lat = parseFloat(form.latitud);
    const lng = parseFloat(form.longitud);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      return { lat, lng };
    }
    return DEFAULT_CENTER;
  }, [form.latitud, form.longitud]);

  // Load cities
  useEffect(() => {
    adminService.getCities().then((r) => {
      setCities(r.data || []);
      setLoadingCities(false);
    }).catch(() => setLoadingCities(false));
  }, []);

  // Populate form on edit
  useEffect(() => {
    if (editItem) {
      setForm({
        nombre: editItem.nombre || '',
        id_ciudad: editItem.id_ciudad?.toString() || editItem.tbl_zonas?.id_ciudad?.toString() || '',
        id_zona: editItem.id_zona?.toString() || '',
        direccion: editItem.direccion || '',
        descripcion: editItem.descripcion || '',
        latitud: editItem.latitud?.toString() || '',
        longitud: editItem.longitud?.toString() || '',
      });
      setExistingPhotos(editItem.fotos || []);
    }
  }, [editItem]);

  // Load zones when city changes
  useEffect(() => {
    if (!form.id_ciudad) {
      setZones([]);
      return;
    }
    setLoadingZones(true);
    adminService.getZones().then((r) => {
      const allZones = r.data || [];
      const filtered = allZones.filter((z) => z.id_ciudad === parseInt(form.id_ciudad));
      setZones(filtered);
      setLoadingZones(false);
    }).catch(() => setLoadingZones(false));
  }, [form.id_ciudad]);

  const updateField = (field, value) => {
    setForm((f) => {
      const updated = { ...f, [field]: value };
      if (field === 'id_ciudad') {
        updated.id_zona = '';
      }
      return updated;
    });
  };

  const handlePositionChange = useCallback((lat, lng) => {
    setForm((f) => ({
      ...f,
      latitud: lat.toFixed(7),
      longitud: lng.toFixed(7),
    }));
  }, []);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handlePositionChange(pos.coords.latitude, pos.coords.longitude);
        toast.success('Ubicación obtenida');
      },
      () => toast.error('No se pudo obtener la ubicación'),
      { enableHighAccuracy: true }
    );
  };

  const handleDeleteExistingPhoto = async (photoId) => {
    if (!editItem) return;
    try {
      await adminService.deleteGalleryPhoto(editItem.id, photoId);
      setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
      toast.success('Foto eliminada');
    } catch {
      toast.error('Error al eliminar foto');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return toast.error('El nombre es obligatorio');
    if (!form.id_ciudad) return toast.error('Selecciona una ciudad');
    if (!form.id_zona) return toast.error('Selecciona una zona comercial');

    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        id_ciudad: parseInt(form.id_ciudad),
        id_zona: parseInt(form.id_zona),
        direccion: form.direccion.trim(),
        descripcion: form.descripcion.trim(),
      };
      if (form.latitud) payload.latitud = parseFloat(form.latitud);
      if (form.longitud) payload.longitud = parseFloat(form.longitud);

      let galleryId;
      if (editItem) {
        await adminService.updateGallery(editItem.id, payload);
        galleryId = editItem.id;
        toast.success('Galería actualizada');
      } else {
        const res = await adminService.createGallery(payload);
        galleryId = res.data?.data?.id || res.data?.id;
        toast.success('Galería creada');
      }

      // Upload new photos if any
      if (newPhotos.length > 0 && galleryId) {
        const fd = new FormData();
        newPhotos.forEach((p) => fd.append('fotos', p.blob, p.name));
        await adminService.addGalleryPhotos(galleryId, fd);
        toast.success('Fotos subidas');
      }

      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loadingCities) return <LoadingSpinner />;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Nombre */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Nombre de la galería <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.nombre}
          onChange={(e) => updateField('nombre', e.target.value)}
          className="input-field text-sm w-full"
          placeholder="Nombre de la galería"
          required
        />
      </div>

      {/* Ciudad */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Ciudad <span className="text-red-500">*</span>
        </label>
        <select
          value={form.id_ciudad}
          onChange={(e) => updateField('id_ciudad', e.target.value)}
          className="input-field text-sm w-full"
          required
        >
          <option value="">-- Selecciona una ciudad --</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {/* Zona Comercial */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Zona Comercial <span className="text-red-500">*</span>
        </label>
        <select
          value={form.id_zona}
          onChange={(e) => updateField('id_zona', e.target.value)}
          className="input-field text-sm w-full"
          disabled={!form.id_ciudad || loadingZones}
          required
        >
          <option value="">
            {!form.id_ciudad ? 'Primero selecciona una ciudad' : loadingZones ? 'Cargando zonas...' : '-- Selecciona una zona --'}
          </option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>{z.nombre}</option>
          ))}
        </select>
      </div>

      {/* Direccion */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Direccion</label>
        <input
          type="text"
          value={form.direccion}
          onChange={(e) => updateField('direccion', e.target.value)}
          className="input-field text-sm w-full"
          placeholder="Dirección de la galería"
        />
      </div>

      {/* Descripcion */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descripcion</label>
        <textarea
          value={form.descripcion}
          onChange={(e) => updateField('descripcion', e.target.value)}
          className="input-field text-sm w-full"
          rows={3}
          placeholder="Descripción de la galería"
        />
      </div>

      {/* Coordenadas GPS */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Coordenadas GPS <span className="text-xs text-gray-400 font-normal">(opcional)</span>
        </label>
        <div className="grid grid-cols-2 gap-3 mb-2">
          <input
            type="text"
            value={form.latitud}
            onChange={(e) => updateField('latitud', e.target.value)}
            className="input-field text-sm w-full"
            placeholder="Latitud"
          />
          <input
            type="text"
            value={form.longitud}
            onChange={(e) => updateField('longitud', e.target.value)}
            className="input-field text-sm w-full"
            placeholder="Longitud"
          />
        </div>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-primary-300 rounded-xl text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors"
        >
          <HiOutlineLocationMarker className="w-4 h-4" />
          Obtener ubicación actual
        </button>
      </div>

      {/* Mapa Leaflet */}
      <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 250 }}>
        <MapContainer
          center={[mapPosition.lat, mapPosition.lng]}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
          key={`${mapPosition.lat}-${mapPosition.lng}`}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <DraggableMarker
            position={[mapPosition.lat, mapPosition.lng]}
            onPositionChange={handlePositionChange}
          />
          <MapClickHandler onPositionChange={handlePositionChange} />
        </MapContainer>
      </div>
      <p className="text-xs text-gray-400 text-center -mt-3">
        Toca o arrastra el marcador para ajustar la ubicación
      </p>

      {/* Fotos existentes (solo en edición) */}
      {existingPhotos.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fotos actuales</label>
          <div className="flex gap-2 flex-wrap">
            {existingPhotos.map((foto) => {
              const url = resolveFileUrl(foto.url);
              return (
                <div key={foto.id} className="relative group">
                  <img src={url} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
                  <button
                    type="button"
                    onClick={() => handleDeleteExistingPhoto(foto.id)}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <HiOutlineTrash className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Nuevas fotos */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Fotos de la galería <span className="text-xs text-gray-400 font-normal">(opcional)</span>
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-primary-300 bg-primary-50/20 rounded-xl p-5 text-center cursor-pointer hover:border-primary-400 transition-colors"
        >
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <HiOutlinePhotograph className="w-5 h-5 text-primary-500" />
          </div>
          <p className="text-sm font-medium text-primary-600">
            {newPhotos.length > 0
              ? `${newPhotos.length} foto${newPhotos.length > 1 ? 's' : ''} seleccionada${newPhotos.length > 1 ? 's' : ''}`
              : 'Agregar fotos'}
          </p>
          <p className="text-xs text-gray-400 mt-1">Máximo 5 fotos</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={async (e) => {
            const files = Array.from(e.target.files).slice(0, 5);
            if (!files.length) return;
            e.target.value = '';
            const converted = await Promise.all(files.map(fileToBlob));
            setNewPhotos(converted);
          }}
          className="hidden"
        />
        {/* Preview new photos */}
        {newPhotos.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-2">
            {newPhotos.map((photo, i) => (
              <div key={i} className="relative group">
                <img
                  src={photo.preview}
                  alt=""
                  className="w-20 h-20 object-cover rounded-xl border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => setNewPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <HiOutlineX className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="btn-primary flex-1 text-sm"
        >
          {saving ? 'Guardando...' : editItem ? 'Guardar cambios' : 'Agregar Galería'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
