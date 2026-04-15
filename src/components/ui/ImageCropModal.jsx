import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { HiOutlineX } from 'react-icons/hi';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
  });
}

export default function ImageCropModal({ imageSrc, onConfirm, onCancel, aspectRatio: initialAspect = 16 / 9 }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(initialAspect);

  const onCropComplete = useCallback((_croppedArea, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels || processing) return;
    setProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onConfirm(croppedBlob);
    } catch {
      onCancel();
    } finally {
      setProcessing(false);
    }
  };

  if (!imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/90 shrink-0">
        <button onClick={onCancel} className="text-white/70 hover:text-white p-1.5 transition-colors">
          <HiOutlineX className="w-6 h-6" />
        </button>
        <p className="text-white font-semibold text-sm">Recortar foto</p>
        <div className="w-9" />
      </div>

      {/* Crop area */}
      <div className="relative flex-1 min-h-0">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      {/* Controls */}
      <div className="bg-black/90 px-5 pt-4 pb-6 shrink-0 space-y-4">
        {/* Aspect ratio toggle */}
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => { setAspectRatio(16 / 9); setCrop({ x: 0, y: 0 }); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${aspectRatio === 16 / 9 ? 'bg-white text-black' : 'bg-white/15 text-white/70 hover:bg-white/25'}`}
          >
            Horizontal
          </button>
          <button
            type="button"
            onClick={() => { setAspectRatio(9 / 16); setCrop({ x: 0, y: 0 }); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${aspectRatio === 9 / 16 ? 'bg-white text-black' : 'bg-white/15 text-white/70 hover:bg-white/25'}`}
          >
            Vertical
          </button>
          <button
            type="button"
            onClick={() => { setAspectRatio(1); setCrop({ x: 0, y: 0 }); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${aspectRatio === 1 ? 'bg-white text-black' : 'bg-white/15 text-white/70 hover:bg-white/25'}`}
          >
            Cuadrado
          </button>
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3">
          <span className="text-white/50 text-xs">-</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 h-1 accent-white appearance-none bg-white/20 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-surface [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
          />
          <span className="text-white/50 text-xs">+</span>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 border border-white/20 rounded-xl text-white/80 font-semibold text-sm hover:bg-white/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={processing}
            className="flex-1 py-3 bg-[#312c85] rounded-xl text-white font-semibold text-sm hover:bg-[#4a44a8] transition-colors disabled:opacity-50"
          >
            {processing ? 'Procesando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
