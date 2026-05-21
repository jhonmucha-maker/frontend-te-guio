import { HiOutlineX } from 'react-icons/hi';

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative bg-surface rounded-2xl shadow-elevated animate-slide-up w-full ${maxWidth} max-h-[90vh] flex flex-col z-10`}
      >
        {/* X siempre visible y clickeable: fuera del contenedor scrollable y con z-index alto
            para sobreponerse a cualquier overlay (-mt) que dibujen los hijos. */}
        <button
          onClick={onClose}
          aria-label="Cerrar"
          type="button"
          className="absolute top-2.5 right-2.5 z-30 p-1.5 rounded-full bg-white/95 hover:bg-gray-100 backdrop-blur-sm shadow-sm border border-gray-100"
        >
          <HiOutlineX className="w-5 h-5 text-gray-600" />
        </button>

        {title && (
          <div className="flex items-center p-4 pr-14 border-b border-gray-200 flex-shrink-0">
            <h3 className="text-lg font-semibold text-gray-900 font-display flex-1 truncate">{title}</h3>
          </div>
        )}

        <div className="p-4 overflow-y-auto flex-1 min-h-0">{children}</div>
      </div>
    </div>
  );
}
