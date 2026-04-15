import { useState, useEffect } from 'react';
import { HiOutlineX } from 'react-icons/hi';
import { catalogService } from '../../services/catalogService';
import LoadingSpinner from './LoadingSpinner';

export default function TermsPrivacyModal({ open, onClose, type = 'terms' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);

    const fetch = type === 'terms'
      ? catalogService.getCurrentTerms()
      : catalogService.getCurrentPrivacy();

    fetch
      .then((res) => {
        const content = type === 'terms' ? res.data.terminos : res.data.privacidad;
        setData(content);
      })
      .catch(() => setError('No se pudo cargar el contenido'))
      .finally(() => setLoading(false));
  }, [open, type]);

  if (!open) return null;

  const title = type === 'terms' ? 'Terminos de Servicio' : 'Politica de Privacidad';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl shadow-2xl animate-slide-up w-full max-w-lg max-h-[85vh] flex flex-col z-10">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 font-display">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <HiOutlineX className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <p className="text-sm text-gray-500 text-center py-8">{error}</p>
          ) : data ? (
            <div className="prose prose-sm max-w-none">
              {data.titulo && (
                <h4 className="text-base font-bold text-gray-900 mb-3">{data.titulo}</h4>
              )}
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {data.contenido}
              </div>
              {data.numero_version && (
                <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
                  Version {data.numero_version}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No hay contenido disponible</p>
          )}
        </div>
      </div>
    </div>
  );
}
