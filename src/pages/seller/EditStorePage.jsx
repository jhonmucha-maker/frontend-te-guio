import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sellerService } from '../../services/sellerService';
import { catalogService } from '../../services/catalogService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlinePhotograph,
  HiOutlineCamera,
  HiOutlineExclamation,
  HiOutlineTrash,
  HiOutlineX,
} from 'react-icons/hi';
import ImageCropModal from '../../components/ui/ImageCropModal';
import { resolveFileUrl } from '../../utils/constants';

export default function EditStorePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cities, setCities] = useState([]);
  const [zones, setZones] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    id_galeria: '',
    numero_local: '',
    selectedCity: '',
    selectedZone: '',
    pagina_web: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    observacion: '',
  });
  const [croppedPhotos, setCroppedPhotos] = useState([]); // { file, preview }
  const [cropSource, setCropSource] = useState(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [photosToDelete, setPhotosToDelete] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    loadStore();
    catalogService.getCities().then((r) => setCities(r.data?.data || [])).catch(() => {});
  }, [id]);

  const loadStore = async () => {
    setLoading(true);
    try {
      const { data } = await sellerService.getMyStores();
      const stores = data?.data || [];
      const s = stores.find((st) => st.id === parseInt(id));
      if (!s) {
        toast.error('Tienda no encontrada');
        navigate('/vendedor/tiendas');
        return;
      }
      setStore(s);
      setExistingPhotos(s.fotos || []);

      const redes = s.redes_sociales_json || {};
      const galeria = s.tbl_galerias;
      setForm({
        nombre: s.nombre || '',
        descripcion: s.descripcion || '',
        id_galeria: s.id_galeria?.toString() || '',
        numero_local: s.numero_local || '',
        selectedCity: galeria?.tbl_ciudades?.id?.toString() || galeria?.tbl_zonas?.id_ciudad?.toString() || '',
        selectedZone: galeria?.id_zona?.toString() || galeria?.tbl_zonas?.id?.toString() || '',
        pagina_web: redes.pagina_web || '',
        facebook: redes.facebook || '',
        instagram: redes.instagram || '',
        tiktok: redes.tiktok || '',
        observacion: s.observacion || '',
      });
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    if (form.selectedCity) {
      catalogService.getZones(form.selectedCity).then((r) => {
        if (!cancelled) setZones(r.data?.data || []);
      }).catch(() => {
        if (!cancelled) { setZones([]); toast.error('Error al cargar zonas'); }
      });
    } else {
      setZones([]);
      setGalleries([]);
    }
    return () => { cancelled = true; };
  }, [form.selectedCity]);

  useEffect(() => {
    let cancelled = false;
    if (form.selectedZone) {
      catalogService.getGalleries(form.selectedZone).then((r) => {
        if (!cancelled) setGalleries(r.data?.data || []);
      }).catch(() => {
        if (!cancelled) { setGalleries([]); toast.error('Error al cargar galerías'); }
      });
    } else {
      setGalleries([]);
    }
    return () => { cancelled = true; };
  }, [form.selectedZone]);

  const handleDeletePhoto = (photoId) => {
    if (!window.confirm('¿Eliminar esta foto?')) return;
    setPhotosToDelete((prev) => [...prev, photoId]);
    setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const totalPhotos = existingPhotos.length + croppedPhotos.length;
    if (totalPhotos >= 5) {
      toast.error('Maximo 5 fotos');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setCropSource(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = (blob) => {
    const preview = URL.createObjectURL(blob);
    setCroppedPhotos((prev) => [...prev, { blob, name: `tienda-foto-${Date.now()}.jpg`, preview }]);
    setCropSource(null);
  };

  const handleRemoveNewPhoto = (index) => {
    setCroppedPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('nombre', form.nombre.trim());
      fd.append('descripcion', form.descripcion.trim());
      if (form.id_galeria) fd.append('id_galeria', form.id_galeria);
      fd.append('numero_local', form.numero_local.trim());

      if (form.observacion.trim()) {
        fd.append('observacion', form.observacion.trim());
      }

      const redes = {};
      if (form.pagina_web.trim()) redes.pagina_web = form.pagina_web.trim();
      if (form.facebook.trim()) redes.facebook = form.facebook.trim();
      if (form.instagram.trim()) redes.instagram = form.instagram.trim();
      if (form.tiktok.trim()) redes.tiktok = form.tiktok.trim();
      fd.append('redes_sociales_json', JSON.stringify(redes));

      croppedPhotos.forEach((p) => fd.append('fotos', p.blob, p.name));

      // Eliminar fotos marcadas para borrar
      for (const photoId of photosToDelete) {
        try {
          await sellerService.deleteStorePhoto(id, photoId);
        } catch {}
      }

      const isRejected = store.estado_aprobacion === 'RECHAZADO';
      if (isRejected) {
        await sellerService.resubmitStore(id, fd);
        toast.success('Tienda reenviada para revisión');
      } else {
        await sellerService.updateStore(id, fd);
        toast.success('Tienda actualizada');
      }
      navigate('/vendedor/tiendas');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => setForm((f) => {
    const updated = { ...f, [field]: value };
    if (field === 'selectedCity') {
      updated.selectedZone = '';
      updated.id_galeria = '';
    }
    if (field === 'selectedZone') {
      updated.id_galeria = '';
    }
    return updated;
  });

  if (loading) return <LoadingSpinner />;
  if (!store) return null;

  const isRejected = store.estado_aprobacion === 'RECHAZADO';
  const isApproved = store.estado_aprobacion === 'APROBADO';

  return (
    <div className="animate-fade-in pb-8">
      {/* Sub-header */}
      <div className="gradient-primary -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 px-4 py-3 mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/vendedor/tiendas')}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <HiOutlineArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-base font-display font-bold text-white">Editar Tienda</h2>
      </div>

      {/* Warning for approved stores */}
      {isApproved && (
        <div className="bg-warning-50 border border-warning-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <HiOutlineExclamation className="w-5 h-5 text-warning-500 mt-0.5 shrink-0" />
          <p className="text-sm text-warning-700">
            Al editar una tienda aprobada, esta pasará a estado Pendiente y quedará oculta junto con sus productos hasta ser aprobada nuevamente.
          </p>
        </div>
      )}

      {/* Rejected reason */}
      {isRejected && store.motivo_rechazo && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
          <p className="text-xs font-bold text-red-600 mb-1">Motivo de rechazo:</p>
          <p className="text-sm text-red-700">{store.motivo_rechazo}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Datos de la Tienda */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Datos de la Tienda</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nombre de tienda *</label>
              <input
                type="text"
                placeholder="Ej: Mi Tienda"
                value={form.nombre}
                onChange={(e) => updateField('nombre', e.target.value)}
                className="input-field rounded-xl text-sm w-full"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
              <textarea
                placeholder="Describe tu tienda..."
                value={form.descripcion}
                onChange={(e) => updateField('descripcion', e.target.value)}
                className="input-field rounded-xl text-sm w-full"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Número de tienda/Stand</label>
              <input
                type="text"
                placeholder="Ej: Stand 12"
                value={form.numero_local}
                onChange={(e) => updateField('numero_local', e.target.value)}
                className="input-field rounded-xl text-sm w-full"
              />
            </div>
          </div>
        </div>

        {/* Existing photos */}
        {existingPhotos.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Fotos actuales</p>
            <div className="flex gap-2 flex-wrap">
              {existingPhotos.map((foto) => {
                const url = foto.url_foto || foto.url;
                const fullUrl = resolveFileUrl(url);
                return (
                  <div key={foto.id} className="relative group">
                    <img
                      src={fullUrl}
                      alt=""
                      className="w-20 h-20 object-contain rounded-xl border border-gray-200 bg-gray-50 cursor-pointer"
                      onClick={() => setPreviewImage(fullUrl)}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(foto.id)}
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

        {/* New photos */}
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 mb-2">Agregar nuevas fotos</p>

          {/* Previews de fotos recortadas nuevas */}
          {croppedPhotos.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {croppedPhotos.map((photo, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={photo.preview}
                    alt={`Nueva foto ${idx + 1}`}
                    className="w-20 h-20 object-contain rounded-xl border border-gray-200 bg-gray-50 cursor-pointer"
                    onClick={() => setPreviewImage(photo.preview)}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveNewPhoto(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <HiOutlineX className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Botón para agregar fotos */}
          {(existingPhotos.length + croppedPhotos.length) < 5 && (
            <button
              type="button"
              onClick={() => setShowPhotoOptions(true)}
              className="w-full border-2 border-dashed border-primary-300 bg-primary-50/20 rounded-2xl py-5 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
            >
              <HiOutlineCamera className="w-7 h-7 text-primary-500 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-primary-600">Agregar foto</p>
            </button>
          )}

          <p className="text-xs text-gray-400 mt-2 text-center">
            {existingPhotos.length + croppedPhotos.length}/5 fotos
          </p>

          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelected}
            className="hidden"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelected}
            className="hidden"
          />
        </div>

        {/* Action sheet para elegir fuente de foto */}
        {showPhotoOptions && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-4" style={{ paddingBottom: 'calc(1rem + var(--android-nav-h, 0px))' }}>
            <div className="fixed inset-0 bg-black/40" onClick={() => setShowPhotoOptions(false)} />
            <div className="relative bg-surface rounded-2xl shadow-elevated w-full max-w-sm z-10 p-5 animate-slide-up">
              <h3 className="text-base font-display font-bold text-gray-900 text-center mb-4">Agregar foto</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => { setShowPhotoOptions(false); cameraInputRef.current?.click(); }}
                  className="bg-gray-50 rounded-xl p-4 text-center hover:bg-gray-100 transition-colors"
                >
                  <HiOutlineCamera className="w-8 h-8 text-primary-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-700">Tomar foto</p>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowPhotoOptions(false); galleryInputRef.current?.click(); }}
                  className="bg-gray-50 rounded-xl p-4 text-center hover:bg-gray-100 transition-colors"
                >
                  <HiOutlinePhotograph className="w-8 h-8 text-primary-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-700">Galería</p>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowPhotoOptions(false)}
                className="w-full py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Redes Sociales */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Redes Sociales (Opcional)</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Página Web"
              value={form.pagina_web}
              onChange={(e) => updateField('pagina_web', e.target.value)}
              className="input-field rounded-xl text-sm w-full"
            />
            <input
              type="text"
              placeholder="Facebook"
              value={form.facebook}
              onChange={(e) => updateField('facebook', e.target.value)}
              className="input-field rounded-xl text-sm w-full"
            />
            <input
              type="text"
              placeholder="Instagram"
              value={form.instagram}
              onChange={(e) => updateField('instagram', e.target.value)}
              className="input-field rounded-xl text-sm w-full"
            />
            <input
              type="text"
              placeholder="TikTok"
              value={form.tiktok}
              onChange={(e) => updateField('tiktok', e.target.value)}
              className="input-field rounded-xl text-sm w-full"
            />
          </div>
        </div>

        {/* Ubicación */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Ubicación</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Ciudad *</label>
              <select
                value={form.selectedCity}
                onChange={(e) => updateField('selectedCity', e.target.value)}
                className="input-field rounded-xl text-sm w-full"
              >
                <option value="">-- Selecciona una ciudad --</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Zona Comercial *</label>
              <select
                value={form.selectedZone}
                onChange={(e) => updateField('selectedZone', e.target.value)}
                className="input-field rounded-xl text-sm w-full"
                disabled={!form.selectedCity}
              >
                <option value="">-- Selecciona una zona --</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Galería / Centro Comercial *</label>
              <select
                value={form.id_galeria}
                onChange={(e) => updateField('id_galeria', e.target.value)}
                className="input-field rounded-xl text-sm w-full"
                disabled={!form.selectedZone}
              >
                <option value="">{!form.selectedZone ? 'Primero selecciona una zona comercial' : '-- Selecciona --'}</option>
                {galleries.map((g) => (
                  <option key={g.id} value={g.id}>{g.nombre}</option>
                ))}
              </select>
              {/* Fotos de referencia de la galería seleccionada */}
              {(() => {
                const sel = galleries.find((g) => g.id.toString() === form.id_galeria);
                if (!sel?.fotos?.length) return null;
                return (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1.5">Fotos de referencia de la galería:</p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {sel.fotos.map((f) => (
                        <img
                          key={f.id}
                          src={resolveFileUrl(f.url)}
                          alt="Galería"
                          className="w-24 h-20 sm:w-28 sm:h-24 object-cover rounded-xl shrink-0 border border-gray-200"
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Observación */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Observación (Opcional)</h3>
          <textarea
            placeholder="Notas adicionales, comentarios o información extra para el administrador..."
            value={form.observacion}
            onChange={(e) => updateField('observacion', e.target.value)}
            className="input-field rounded-xl text-sm w-full"
            rows={3}
          />
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full rounded-xl text-sm"
          >
            {saving ? 'Guardando...' : isRejected ? '▶ Reenviar Solicitud' : 'Guardar cambios'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/vendedor/tiendas')}
            className="w-full py-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>

      {/* Modal de recorte */}
      {cropSource && (
        <ImageCropModal
          imageSrc={cropSource}
          aspectRatio={16 / 9}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSource(null)}
        />
      )}

      {/* Lightbox pantalla completa */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black z-[70] flex flex-col"
          onClick={() => setPreviewImage(null)}
        >
          <div className="flex items-center justify-end px-4 py-3 flex-shrink-0">
            <button
              onClick={() => setPreviewImage(null)}
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
              src={previewImage}
              alt="Vista previa"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
