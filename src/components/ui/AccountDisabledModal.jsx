import { HiOutlineBan } from 'react-icons/hi';

export default function AccountDisabledModal({ open, onAccept, message }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-surface rounded-2xl shadow-elevated w-full max-w-sm z-10 animate-slide-up">
        <div className="p-6 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <HiOutlineBan className="w-7 h-7 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 font-display mb-2">
            Cuenta inhabilitada
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            {message}
          </p>
          <button
            onClick={onAccept}
            className="btn-primary w-full text-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
