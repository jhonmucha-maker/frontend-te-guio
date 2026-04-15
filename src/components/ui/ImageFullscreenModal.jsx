import { useState, useEffect, useCallback } from 'react';
import { HiOutlineX, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';

/**
 * Modal fullscreen para visualizar imágenes de producto.
 *
 * @param {Object}   props
 * @param {string[]} props.images       - Array de URLs de imagen
 * @param {number}   [props.startIndex] - Índice inicial (default 0)
 * @param {Function} props.onClose      - Callback para cerrar
 */
export default function ImageFullscreenModal({ images = [], startIndex = 0, onClose }) {
  const [current, setCurrent] = useState(startIndex);
  const [touchStartX, setTouchStartX] = useState(null);

  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && current > 0) setCurrent((c) => c - 1);
      if (e.key === 'ArrowRight' && current < images.length - 1) setCurrent((c) => c + 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [current, images.length, onClose]);

  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleTouchStart = useCallback((e) => {
    setTouchStartX(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff < 0 && current < images.length - 1) setCurrent((c) => c + 1);
      if (diff > 0 && current > 0) setCurrent((c) => c - 1);
    }
    setTouchStartX(null);
  }, [touchStartX, current, images.length]);

  if (!images.length) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex flex-col select-none"
      style={{ paddingTop: 'var(--sat)', paddingBottom: 'var(--sab)' }}
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        {images.length > 1 ? (
          <span className="text-white/70 text-sm font-medium">
            {current + 1} / {images.length}
          </span>
        ) : (
          <span />
        )}
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <HiOutlineX className="w-6 h-6" />
        </button>
      </div>

      {/* Image area */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={images[current]}
          alt=""
          className="max-w-full max-h-full object-contain"
          draggable={false}
        />
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 pointer-events-none">
          <button
            onClick={(e) => { e.stopPropagation(); setCurrent((c) => Math.max(0, c - 1)); }}
            disabled={current === 0}
            className={`pointer-events-auto w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white transition-colors ${current === 0 ? 'opacity-30' : 'hover:bg-white/20'}`}
          >
            <HiOutlineChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrent((c) => Math.min(images.length - 1, c + 1)); }}
            disabled={current === images.length - 1}
            className={`pointer-events-auto w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white transition-colors ${current === images.length - 1 ? 'opacity-30' : 'hover:bg-white/20'}`}
          >
            <HiOutlineChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-2 px-4 py-3 flex-shrink-0">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                i === current ? 'border-white scale-110' : 'border-transparent opacity-50'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
