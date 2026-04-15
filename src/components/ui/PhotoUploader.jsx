import { useRef } from 'react';
import { HiOutlineX, HiOutlinePhotograph, HiOutlinePlus } from 'react-icons/hi';
import { resolveFileUrl } from '../../utils/constants';
import { fileToBlob } from '../../utils/fileUtils';

export default function PhotoUploader({
  photos = [],
  onUpload,
  onDelete,
  maxPhotos = 5,
  uploading = false,
  label = 'Fotos',
}) {
  const inputRef = useRef(null);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const remaining = maxPhotos - photos.length;
    const selected = files.slice(0, remaining);

    if (selected.length > 0 && onUpload) {
      const converted = await Promise.all(selected.map(fileToBlob));
      const fd = new FormData();
      converted.forEach((f) => fd.append('fotos', f.blob, f.name));
      onUpload(fd);
    }

    // Reset input
    e.target.value = '';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {label} ({photos.length} / {maxPhotos})
        </label>
        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 disabled:opacity-50"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Agregar
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        className="hidden"
      />

      {photos.length === 0 ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-primary-300 rounded-2xl bg-primary-50/30 p-8 text-center cursor-pointer hover:bg-primary-50 hover:border-primary-400 transition-colors"
        >
          <HiOutlinePhotograph className="w-10 h-10 text-primary-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Click para agregar fotos</p>
          <p className="text-xs text-gray-400 mt-1">Maximo {maxPhotos} fotos</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img
                src={resolveFileUrl(photo.url_foto || photo.url)}
                alt=""
                className="w-full h-full object-cover"
              />
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(photo.id)}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <HiOutlineX className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}

          {photos.length < maxPhotos && (
            <div
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-2xl border-2 border-dashed border-primary-300 bg-primary-50/30 flex items-center justify-center cursor-pointer hover:bg-primary-50 hover:border-primary-400 transition-colors"
            >
              <HiOutlinePlus className="w-6 h-6 text-primary-400" />
            </div>
          )}
        </div>
      )}

      {uploading && (
        <p className="text-xs text-primary-600 mt-2">Subiendo fotos...</p>
      )}
    </div>
  );
}
