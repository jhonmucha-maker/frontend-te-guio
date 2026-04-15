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
  HiOutlineInformationCircle,
  HiOutlineX,
  HiOutlineTrash,
} from 'react-icons/hi';

import { resolveFileUrl } from '../../utils/constants';
import { fileToBlob } from '../../utils/fileUtils';
import ImageFullscreenModal from '../../components/ui/ImageFullscreenModal';

export default function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [product, setProduct] = useState(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(false);
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
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [previewData, setPreviewData] = useState(null); // { images: string[], startIndex: number }

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, sRes, cRes] = await Promise.all([
        sellerService.getMyProducts(),
        sellerService.getMyStores(),
        catalogService.getCategories(),
      ]);
      const products = pRes.data?.data || [];
      const p = products.find((pr) => pr.id === parseInt(id));
      if (!p) {
        toast.error('Producto no encontrado');
        navigate('/vendedor/productos');
        return;
      }
      setProduct(p);
      setExistingPhotos(p.fotos || []);
      setStores((sRes.data?.data || []).filter((s) => s.estado_aprobacion === 'APROBADO'));
      setCategories(cRes.data?.data || []);
      setForm({
        nombre: p.nombre || '',
        descripcion: p.descripcion || '',
        id_tienda: p.id_tienda?.toString() || '',
        id_categoria: p.id_categoria?.toString() || '',
        precio: p.precio?.toString() || '',
        precio_visible: p.precio_visible !== false,
      });
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const maxNew = 5 - existingPhotos.length - processedPhotos.length;
    if (maxNew <= 0) {
      toast.error('Máximo 5 fotos en total');
      return;
    }
    const files = Array.from(e.target.files).slice(0, maxNew);
    if (!files.length) return;
    e.target.value = '';
    const converted = await Promise.all(files.map(fileToBlob));
    setProcessedPhotos((prev) => [...prev, ...converted]);
  };

  const removeNewPhoto = (index) => {
    setProcessedPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDeleteExistingPhoto = async (photoId) => {
    if (!window.confirm('¿Eliminar esta foto?')) return;
    try {
      await sellerService.deleteProductPhoto(id, photoId);
      setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
      toast.success('Foto eliminada');
    } catch {
      toast.error('Error al eliminar foto');
    }
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
      fd.append('precio', form.precio);
      fd.append('precio_visible', form.precio_visible);
      if (form.id_categoria) fd.append('id_categoria', form.id_categoria);
      processedPhotos.forEach((p) => fd.append('fotos', p.blob, p.name));

      await sellerService.updateProduct(product.id, fd);
      toast.success('Producto actualizado');
      navigate('/vendedor/productos');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!window.confirm(`¿Eliminar "${product.nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeletingProduct(true);
    try {
      await sellerService.deleteProduct(product.id);
      toast.success('Producto eliminado');
      navigate('/vendedor/productos');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    } finally {
      setDeletingProduct(false);
    }
  };

  const updateField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  if (loading) return <LoadingSpinner />;
  if (!product) return null;

  const totalPhotos = existingPhotos.length + processedPhotos.length;

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
        <h2 className="text-base font-display font-bold text-white">Editar Producto</h2>
      </div>

      {/* Info banner */}
      <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <HiOutlineInformationCircle className="w-5 h-5 text-primary-600 mt-0.5 shrink-0" />
        <p className="text-sm text-primary-600">
          Tu producto será enviado para revisión. Una vez aprobado, estará visible para los compradores.
        </p>
      </div>

      {/* Rejected reason */}
      {product.estado_aprobacion === 'RECHAZADO' && product.motivo_aprobacion && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
          <p className="text-xs font-bold text-red-600 mb-1">Motivo de rechazo:</p>
          <p className="text-sm text-red-700">{product.motivo_aprobacion}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card rounded-2xl shadow-card mb-6">
          <h3 className="text-base font-display font-bold text-gray-900 mb-4">
            {product.estado_aprobacion === 'RECHAZADO' ? 'Editar y Reenviar' : 'Editar Producto'}
          </h3>

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

            {/* Tienda (readonly) */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tienda *</label>
              <select
                value={form.id_tienda}
                onChange={(e) => updateField('id_tienda', e.target.value)}
                className="input-field rounded-xl text-sm w-full bg-gray-50"
                disabled
              >
                <option value="">Selecciona una tienda</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}{s.tbl_galerias?.nombre ? ` (${s.tbl_galerias.nombre})` : ''}
                  </option>
                ))}
                {/* Also show the current store if not in approved list */}
                {!stores.find((s) => s.id === parseInt(form.id_tienda)) && product.tienda && (
                  <option value={product.id_tienda}>
                    {product.tienda.nombre}
                  </option>
                )}
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

            {/* Existing images */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">
                Imágenes del producto ({totalPhotos}/5)
              </p>

              {existingPhotos.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-3">
                  {existingPhotos.map((foto, i) => {
                    const url = foto.url_foto || foto.url;
                    const fullUrl = resolveFileUrl(url);
                    return (
                      <div key={foto.id} className="relative">
                        <img
                          src={fullUrl}
                          alt=""
                          className="w-20 h-20 object-contain rounded-xl border border-gray-200 cursor-pointer bg-gray-50"
                          onClick={() => {
                            const allUrls = [
                              ...existingPhotos.map((f) => resolveFileUrl(f.url_foto || f.url)),
                              ...processedPhotos.map((p) => p.preview),
                            ].filter(Boolean);
                            setPreviewData({ images: allUrls, startIndex: i });
                          }}
                        />
                        {i === 0 && (
                          <span className="absolute bottom-0 left-0 right-0 bg-primary-600 text-white text-[10px] font-bold text-center py-0.5 rounded-b-xl">
                            Principal
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteExistingPhoto(foto.id)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                        >
                          <HiOutlineX className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* New photo previews */}
              {processedPhotos.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-3">
                  {processedPhotos.map((photo, i) => (
                    <div key={i} className="relative">
                      <img
                        src={photo.preview}
                        alt=""
                        className="w-20 h-20 object-contain rounded-xl border border-primary-200 cursor-pointer bg-gray-50"
                        onClick={() => {
                          const allUrls = [
                            ...existingPhotos.map((f) => resolveFileUrl(f.url_foto || f.url)),
                            ...processedPhotos.map((p) => p.preview),
                          ].filter(Boolean);
                          setPreviewData({ images: allUrls, startIndex: existingPhotos.length + i });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeNewPhoto(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                      >
                        <HiOutlineX className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {totalPhotos < 5 && (
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
            disabled={saving}
            className="btn-primary w-full rounded-xl text-sm flex items-center justify-center gap-2"
          >
            {saving ? 'Guardando...' : '▶ Enviar Solicitud'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/vendedor/productos')}
            className="w-full py-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDeleteProduct}
            disabled={deletingProduct}
            className="w-full py-3 bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <HiOutlineTrash className="w-4 h-4" />
            {deletingProduct ? 'Eliminando...' : 'Eliminar producto'}
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

      {/* Image Fullscreen Modal */}
      {previewData && (
        <ImageFullscreenModal
          images={previewData.images}
          startIndex={previewData.startIndex}
          onClose={() => setPreviewData(null)}
        />
      )}
    </div>
  );
}
