// Exportacion general: un unico punto para descargar varias entidades a la vez.
// El catalogo de entidades lo define el backend (utils/datasets), no esta
// duplicado aqui: si se agrega una entidad alla, aparece sola en esta lista.
//
// Siempre se descarga UN solo archivo:
//   Excel -> una hoja por entidad
//   PDF   -> una seccion por entidad
// En el APK downloadExport lo guarda en Documentos; un solo archivo evita
// encadenar una escritura y un toast por entidad.

import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { downloadExport } from '../../utils/exportDownload';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  HiOutlineDownload,
  HiOutlineTable,
  HiOutlineDocumentText,
  HiOutlineExclamation,
  HiOutlineCheck,
} from 'react-icons/hi';

// Entidades cuyo volumen puede hacer pesada la exportacion.
const HEAVY = new Set(['products', 'sellers']);

const FORMATS = [
  { key: 'xlsx', label: 'Excel', icon: HiOutlineTable, iconClass: 'text-seller-500',
    hint: 'Una hoja por entidad' },
  { key: 'pdf', label: 'PDF', icon: HiOutlineDocumentText, iconClass: 'text-red-500',
    hint: 'Una sección por entidad' },
];

export default function ExportsPage() {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [format, setFormat] = useState('xlsx');
  const [busy, setBusy] = useState(false);

  useEffect(() => { loadCatalog(); }, []);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const res = await adminService.getExportCatalog();
      const entidades = res.data?.entidades || [];
      setCatalog(entidades);
      // Por defecto todo marcado: el caso comun es "quiero todo".
      setSelected(entidades.map((e) => e.key));
    } catch {
      toast.error('Error al cargar el catálogo de exportación');
    } finally {
      setLoading(false);
    }
  };

  const toggle = (key) =>
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  const allSelected = catalog.length > 0 && selected.length === catalog.length;
  const toggleAll = () => setSelected(allSelected ? [] : catalog.map((e) => e.key));

  const handleExport = async () => {
    if (!selected.length) return;
    setBusy(true);
    try {
      const res = await adminService.exportBundle(selected, format);
      // downloadExport avisa por toast (y en nativo guarda en Documentos).
      await downloadExport(res.data, 'marketplace', format);
    } catch {
      toast.error('Error al exportar');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const heavySelected = selected.some((k) => HEAVY.has(k));

  return (
    <div className="animate-fade-in pt-2 pb-4">
      {/* Formato */}
      <div className="bg-surface rounded-2xl shadow-sm border border-gray-100/80 p-3 mb-3">
        <div className="text-[10px] font-bold text-gray-500 tracking-wider mb-2">FORMATO</div>
        <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
          {FORMATS.map(({ key, label, icon: Icon, iconClass }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFormat(key)}
              aria-pressed={format === key}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                format === key ? 'bg-surface text-primary-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              <Icon className={`w-4 h-4 ${iconClass}`} />
              {label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          {FORMATS.find((f) => f.key === format)?.hint}
        </p>
      </div>

      {/* Entidades */}
      <div className="bg-surface rounded-2xl shadow-sm border border-gray-100/80 p-3 mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-gray-500 tracking-wider">QUÉ EXPORTAR</span>
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs font-semibold text-primary-600"
          >
            {allSelected ? 'Quitar selección' : 'Seleccionar todo'}
          </button>
        </div>

        <div className="space-y-1.5">
          {catalog.map(({ key, label }) => {
            const on = selected.includes(key);
            return (
              <label
                key={key}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-[1.5px] transition-colors ${
                  on ? 'border-primary-600 bg-primary-50' : 'border-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(key)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`w-4 h-4 rounded flex-shrink-0 grid place-items-center border-2 transition-colors ${
                    on ? 'bg-primary-600 border-primary-600' : 'border-gray-400'
                  }`}
                >
                  {on && <HiOutlineCheck className="w-3 h-3 text-white" strokeWidth={3} />}
                </span>
                <span className="text-sm font-semibold text-gray-700">{label}</span>
                {HEAVY.has(key) && (
                  <span className="ml-auto text-[9px] font-bold text-warning-700 bg-warning-50 px-1.5 py-0.5 rounded">
                    PESADO
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* Aviso de volumen: el export no pagina, conviene decirlo antes. */}
      {heavySelected && (
        <div className="flex gap-2 bg-warning-50 border border-warning-200 rounded-xl p-2.5 mb-3">
          <HiOutlineExclamation className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-warning-800 leading-relaxed">
            Se exportan todos los registros, sin filtros ni límite. Con muchos datos puede
            tardar{format === 'pdf' ? ': el PDF es el formato más lento.' : '.'}
          </p>
        </div>
      )}

      {/* Accion */}
      <button
        onClick={handleExport}
        disabled={busy || selected.length === 0}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
      >
        <HiOutlineDownload className="w-4 h-4" />
        {busy ? 'Generando...' : `Exportar ${selected.length} de ${catalog.length}`}
      </button>

      <p className="text-[11px] text-gray-400 text-center mt-3">
        Se descarga un solo archivo con todo lo seleccionado.
      </p>
    </div>
  );
}
