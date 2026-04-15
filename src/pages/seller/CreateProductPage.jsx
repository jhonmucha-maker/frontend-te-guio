import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sellerService } from '../../services/sellerService';
import { catalogService } from '../../services/catalogService';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlinePhotograph,
  HiOutlineCamera,
  HiOutlineInformationCircle,
  HiOutlineX,
} from 'react-icons/hi';

import { resolveFileUrl } from '../../utils/constants';
import { fileToBlob } from '../../utils/fileUtils';

export default function CreateProductPage() {
  const navigate = useNavigate();
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [creating, setCreating] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    id_tienda: '',
    id_categoria: '',
    precio: '',
    precio_visible: true,
  });
  const [processedPhotos, setProcessedPhotos] = useState([]); // { blob, name, preview }
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    Promise.all([
      sellerService.getMyStores(),
      catalogService.getCategories(),
    ]).then(([sRes, cRes]) => {
      const allStores = sRes.data?.data || [];
      setStores(allStores.filter((s) => s.estado_aprobacion === 'APROBADO'));
      setCategories(cRes.data?.data || []);
    }).catch(() => {});
  }, []);

  const handlePhotoChange = async (e) => {
    const files = Array.from(e.target.files).slice(0, 5 - processedPhotos.length);
    if (!files.length) return;
    e.target.value = '';
    const converted = await Promise.all(files.map(fileToBlob));
    setProcessedPhotos((prev) => [...prev, ...converted].slice(0, 5));
  };

  const removePhoto = (index) => {
    setProcessedPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      toast.error('El nombre del producto es obligatorio');
      return;
    }
    if (!form.id_tienda) {
      toast.error('Debes seleccionar una tienda');
      return;
    }
    if (!form.precio || parseFloat(form.precio) <= 0) {
      toast.error('El precio debe ser mayor a 0');
      return;
    }

    setCreating(true);
    try {
      const fd = new FormData();
      fd.append('nombre', form.nombre.trim());
      fd.append('descripcion', form.descripcion.trim());
      fd.append('id_tienda', form.id_tienda);
      fd.append('precio', form.precio);
      fd.append('precio_visible', form.precio_visible);
      if (form.id_categoria) fd.append('id_categoria', form.id_categoria);
      processedPhotos.forEach((p) => fd.append('fotos', p.blob, p.name));

      await sellerService.createProduct(fd);
      toast.success('Producto enviado para revisión');
      navigate('/vendedor/productos');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear producto');
    } finally {
      setCreating(false);
    }
  };

  const updateField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="animate-fade-in pb-8">
      {/* Sub-header */}
      <div className="gradient-primary -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 px-4 py-3 mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/vendedor/productos')}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <HiOutlineArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-base font-display font-bold text-white">Nuevo Producto</h2>
      </div>

      {/* Info banner */}
      <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <HiOutlineInformationCircle className="w-5 h-5 text-primary-600 mt-0.5 shrink-0" />
        <p className="text-sm text-primary-600">
          Tu producto será enviado para revisión. Una vez aprobado, estará visible para los compradores.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card rounded-2xl shadow-card mb-6">
          <h3 className="text-base font-display font-bold text-gray-900 mb-4">Nuevo Producto</h3>

          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nombre del Producto</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => updateField('nombre', e.target.value)}
                className="input-field rounded-xl text-sm w-full"
                required
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => updateField('descripcion', e.target.value)}
                className="input-field rounded-xl text-sm w-full"
                rows={4}
              />
            </div>

            {/* Tienda */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tienda *</label>
              <select
                value={form.id_tienda}
                onChange={(e) => updateField('id_tienda', e.target.value)}
                className="input-field rounded-xl text-sm w-full"
                required
              >
                <option value="">Selecciona una tienda</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}{s.tbl_galerias?.nombre ? ` (${s.tbl_galerias.nombre})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Categoría *</label>
              <select
                value={form.id_categoria}
                onChange={(e) => updateField('id_categoria', e.target.value)}
                className="input-field rounded-xl text-sm w-full"
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            {/* Precio */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Precio (S/)</label>
              <input
                type="number"
                value={form.precio}
                onChange={(e) => updateField('precio', e.target.value)}
                className="input-field rounded-xl text-sm w-full"
                step="0.01"
                min="0"
                required
              />
            </div>

            {/* Toggle mostrar precio */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-gray-700">Mostrar precio al público</span>
              <button
                type="button"
                onClick={() => updateField('precio_visible', !form.precio_visible)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  form.precio_visible ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-surface rounded-full shadow transition-transform ${
                    form.precio_visible ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Images */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">
                Imágenes del producto ({processedPhotos.length}/5)
              </p>

              {processedPhotos.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-3">
                  {processedPhotos.map((photo, i) => (
                    <div key={i} className="relative">
                      <img
                        src={photo.preview}
                        alt=""
                        className="w-20 h-20 object-contain rounded-xl border border-gray-200 cursor-pointer bg-gray-50"
                        onClick={() => setPreviewImage(photo.preview)}
                      />
                      {i === 0 && (
                        <span className="absolute bottom-0 left-0 right-0 bg-primary-600 text-white text-[10px] font-bold text-center py-0.5 rounded-b-xl">
                          Principal
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                      >
                        <HiOutlineX className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {processedPhotos.length < 5 && (
                <button
                  type="button"
                  onClick={() => setShowPhotoOptions(true)}
                  className="border-2 border-dashed border-primary-300 bg-primary-50/20 rounded-2xl p-4 text-center w-full hover:border-primary-400 transition-colors"
                >
                  <HiOutlineCamera className="w-6 h-6 text-primary-500 mx-auto mb-1" />
                  <p className="text-xs font-medium text-primary-600">Agregar imágenes</p>
                </button>
              )}

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            type="submit"
            disabled={creating}
            className="btn-primary w-full rounded-xl text-sm flex items-center justify-center gap-2"
          >
            {creating ? 'Enviando...' : '▶ Enviar Solicitud'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/vendedor/productos')}
            className="w-full py-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        </div>

        {/* Action sheet para elegir fuente de foto */}
        {showPhotoOptions && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-4">
            <div className="fixed inset-0 bg-black/40" onClick={() => setShowPhotoOptions(false)} />
            <div className="relative bg-surface rounded-2xl shadow-elevated w-full max-w-sm z-10 p-5 animate-slide-up">
              <h3 className="text-base font-display font-bold text-gray-900 text-center mb-4">Agregar imagen</h3>
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
      </form>

      {/* Image Preview Overlay */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold hover:bg-black/70 transition-colors"
          >
            ✕
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
