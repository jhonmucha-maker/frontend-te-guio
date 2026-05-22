import { HiOutlineDownload } from 'react-icons/hi';

// Modal bloqueante del sistema de actualizacion forzada.
//  - z-[200] para quedar SIEMPRE encima de AccountDisabledModal (z-100) y
//    cualquier otro modal de la app.
//  - Sin boton de cierre ni handler en el backdrop: el usuario NO puede
//    descartarlo, solo puede usar el boton "Actualizar ahora" que abre
//    Play Store.
//  - Si presiona el back button de Android, el listener global de App.jsx
//    minimizara la app y al volver el modal seguira ahi (porque
//    VersionGuard re-evalua en useAppResume).
export default function ForceUpdateModal({ open, title, message, onUpdate }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-surface rounded-2xl shadow-elevated w-full max-w-sm z-10 animate-slide-up">
        <div className="p-6 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mb-4">
            <HiOutlineDownload className="w-7 h-7 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 font-display mb-2">
            {title || 'Actualizacion requerida'}
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            {message || 'Por favor actualiza la app desde Play Store para continuar.'}
          </p>
          <button
            onClick={onUpdate}
            className="btn-primary w-full text-sm flex items-center justify-center gap-2"
          >
            <HiOutlineDownload className="w-4 h-4" />
            Actualizar ahora
          </button>
        </div>
      </div>
    </div>
  );
}
