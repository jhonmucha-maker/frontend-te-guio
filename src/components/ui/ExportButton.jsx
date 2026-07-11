import { useState, useRef, useEffect } from 'react';
import {
  HiOutlineDownload,
  HiOutlineChevronDown,
  HiOutlineTable,
  HiOutlineDocumentText,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { downloadExport } from '../../utils/exportDownload';

// Boton reutilizable de exportacion con menu Excel / PDF.
//
// Props:
//  - exportFn(format): funcion que hace la peticion al backend y devuelve la
//    respuesta axios (responseType: 'blob'). format es 'xlsx' | 'pdf'.
//  - baseName: nombre del archivo sin extension (ej: 'compradores').
//  - label: texto del boton (default 'Exportar').
//  - className: clases extra para el contenedor.
export default function ExportButton({ exportFn, baseName, label = 'Exportar', className = '' }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const run = async (format) => {
    setOpen(false);
    setBusy(true);
    try {
      const res = await exportFn(format);
      await downloadExport(res.data, baseName, format);
    } catch {
      toast.error('Error al exportar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
      >
        <HiOutlineDownload className="w-4 h-4" />
        {busy ? 'Exportando...' : label}
        {!busy && <HiOutlineChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && !busy && (
        <div className="absolute right-0 mt-1 w-44 bg-surface rounded-xl shadow-elevated border border-gray-100 z-30 overflow-hidden animate-fade-in">
          <button
            type="button"
            onClick={() => run('xlsx')}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 transition-colors"
          >
            <HiOutlineTable className="w-4 h-4 text-seller-500" />
            Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={() => run('pdf')}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 transition-colors border-t border-gray-100"
          >
            <HiOutlineDocumentText className="w-4 h-4 text-red-500" />
            PDF
          </button>
        </div>
      )}
    </div>
  );
}
