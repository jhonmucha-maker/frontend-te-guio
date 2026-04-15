import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import {
  HiOutlineCurrencyDollar,
  HiOutlineCalendar,
  HiOutlineStar,
} from 'react-icons/hi';

export default function FinancePage() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, txRes] = await Promise.all([
          adminService.getFinanceSummary(),
          adminService.getTransactions(),
        ]);
        setSummary(sumRes.data);
        setTransactions(txRes.data);
      } catch {} finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeTransactions = transactions.filter(t => t.estado === 'ACTIVE');
  const expiredTransactions = transactions.filter(t => t.estado !== 'ACTIVE');

  const filtered = (() => {
    if (filter === 'active') return activeTransactions;
    if (filter === 'expired') return expiredTransactions;
    return transactions;
  })();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in pt-2">

      {/* Resumen Financiero */}
      {summary && (
        <div className="bg-surface rounded-2xl shadow-card border border-gray-100/80 p-5 mb-4">
          <h2 className="text-base font-bold font-display text-primary-700 mb-4">Resumen Financiero</h2>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {/* Ingresos Totales */}
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-1.5">
                <HiOutlineCurrencyDollar className="w-5 h-5 text-primary-600" />
              </div>
              <p className="text-base font-bold font-display text-primary-700">{formatCurrency(summary.totalRevenue)}</p>
              <p className="text-[10px] text-gray-500">Ingresos Totales</p>
            </div>
            {/* Este Mes */}
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-1.5">
                <HiOutlineCalendar className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-base font-bold font-display text-green-600">{formatCurrency(summary.monthlyRevenue)}</p>
              <p className="text-[10px] text-gray-500">Este Mes</p>
            </div>
            {/* Suscripciones */}
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center mx-auto mb-1.5">
                <HiOutlineStar className="w-5 h-5 text-warning-600" />
              </div>
              <p className="text-base font-bold font-display text-warning-600">{formatCurrency(summary.activeSubscriptionsRevenue)}</p>
              <p className="text-[10px] text-gray-500">Suscripciones ({summary.activeSubscriptionsCount})</p>
            </div>
          </div>

          {/* Precio Premium */}
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
            <span className="text-xs font-medium text-gray-500">Precio Premium:</span>
            <span className="text-xs font-bold text-gray-800">{formatCurrency(summary.premiumPrice)} / {summary.premiumDays} dias</span>
          </div>
        </div>
      )}

      {/* Filter Chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { key: 'all', label: `Todas (${transactions.length})` },
          { key: 'active', label: `Activas (${activeTransactions.length})` },
          { key: 'expired', label: `Expiradas (${expiredTransactions.length})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`chip whitespace-nowrap ${filter === f.key ? 'chip-active' : 'chip-inactive'}`}>{f.label}</button>
        ))}
      </div>

      {/* Transaction Cards */}
      {filtered.length === 0 ? (
        <EmptyState icon={HiOutlineCurrencyDollar} title="Sin transacciones" />
      ) : (
        <div className="space-y-3">
          {filtered.map((tx) => (
            <div key={tx.id} className="card">
              {/* Vendedor + Monto */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">{tx.vendedor_nombre || '-'}</h3>
                <span className="text-base font-bold font-display text-green-600">{formatCurrency(tx.monto)}</span>
              </div>

              {/* Campos detalle */}
              <div className="space-y-1.5">
                {[
                  { label: 'Galeria', value: tx.galeria_nombre },
                  { label: 'Fecha pago', value: formatDate(tx.pagado_en) },
                  { label: 'Vencimiento', value: formatDate(tx.fin_en) },
                  { label: 'Metodo', value: tx.metodo_pago },
                ].map((row, i) => (
                  <div key={i} className="flex">
                    <span className="text-xs font-medium text-gray-500 w-28 flex-shrink-0">{row.label}:</span>
                    <span className="text-xs text-gray-800">{row.value || '-'}</span>
                  </div>
                ))}
              </div>

              {/* Badge estado */}
              <div className="mt-3">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${tx.estado === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {tx.estado === 'ACTIVE' ? 'Activo' : 'Expirado'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
