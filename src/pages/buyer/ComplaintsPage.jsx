import { useState, useEffect, useCallback } from 'react';
import { ticketService } from '../../services/ticketService';
import { buyerService } from '../../services/buyerService';
import { useSSEListener } from '../../hooks/useSSEListener';
import { formatDateTime } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import TicketConversationModal from '../../components/ui/TicketConversationModal';
import toast from 'react-hot-toast';
import {
  HiOutlineChatAlt,
  HiOutlineDeviceMobile,
  HiOutlineShoppingBag,
  HiOutlineClock,
  HiOutlinePaperAirplane,
  HiOutlineChevronDown,
} from 'react-icons/hi';

const MIN_ASUNTO = 5;
const MIN_MENSAJE = 10;

export default function ComplaintsPage() {
  // --- Form state ---
  const [tipo, setTipo] = useState('COMPLAINT');
  const [objetivo, setObjetivo] = useState('ADMIN');
  const [idTienda, setIdTienda] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [sending, setSending] = useState(false);

  // --- Stores dropdown ---
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);

  // --- History ---
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  // --- Modal ---
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  // Load only stores where buyer has completed purchases
  useEffect(() => {
    if (objetivo === 'STORE' && stores.length === 0) {
      setLoadingStores(true);
      buyerService
        .getPurchasedStores()
        .then(({ data }) => {
          const list = data.data || data;
          setStores(Array.isArray(list) ? list : []);
        })
        .catch(() => {
          toast.error('No se pudieron cargar las tiendas');
        })
        .finally(() => setLoadingStores(false));
    }
  }, [objetivo]);

  // Load ticket history
  const loadTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const { data } = await ticketService.getMyTickets();
      setTickets(data.data || data || []);
    } catch {
      // silent
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Actualizar en tiempo real cuando llegan eventos SSE
  useSSEListener(['ticket.message.created', 'ticket.status.updated'], loadTickets);

  // Reset store selection when switching away from STORE
  useEffect(() => {
    if (objetivo !== 'STORE') setIdTienda('');
  }, [objetivo]);

  // --- Validation helpers ---
  const asuntoValid = asunto.trim().length >= MIN_ASUNTO;
  const mensajeValid = mensaje.trim().length >= MIN_MENSAJE;
  const storeValid = objetivo === 'ADMIN' || idTienda !== '';
  const formValid = asuntoValid && mensajeValid && storeValid;

  // --- Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formValid) return;

    setSending(true);
    try {
      const payload = {
        tipo,
        objetivo,
        asunto: asunto.trim(),
        mensaje: mensaje.trim(),
      };
      if (objetivo === 'STORE' && idTienda) {
        payload.id_tienda = parseInt(idTienda);
      }

      await ticketService.createTicket(payload);
      toast.success('Mensaje enviado correctamente');

      // Reset form
      setTipo('COMPLAINT');
      setObjetivo('ADMIN');
      setIdTienda('');
      setAsunto('');
      setMensaje('');

      // Refresh history
      loadTickets();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  // --- Status badge helper ---
  const statusBadge = (estado) => {
    const map = {
      PENDIENTE: 'bg-amber-100 text-amber-700',
      RESPONDIDO: 'bg-blue-100 text-blue-700',
      EN_ESPERA_DE_RESPUESTA: 'bg-purple-100 text-purple-700',
      ATENDIDO: 'bg-gray-100 text-gray-500',
    };
    const labelMap = {
      PENDIENTE: 'Pendiente',
      RESPONDIDO: 'Respondido',
      EN_ESPERA_DE_RESPUESTA: 'En espera',
      ATENDIDO: 'Atendido',
    };
    return (
      <span
        className={`text-[10px] font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${
          map[estado] || 'bg-gray-100 text-gray-500'
        }`}
      >
        {labelMap[estado] || estado}
      </span>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* ======================= HEADER ======================= */}
      <div className="bg-surface rounded-2xl shadow-card border border-gray-100/80 px-6 pt-6 pb-5 text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-seller-50 flex items-center justify-center mx-auto mb-4">
          <HiOutlineChatAlt className="w-8 h-8 text-seller-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 font-display">
          Quejas y Sugerencias
        </h1>
        <p className="text-gray-400 text-sm mt-1 max-w-xs mx-auto leading-relaxed">
          Tu opinión es importante para nosotros. Cuéntanos cómo podemos mejorar.
        </p>
      </div>

      {/* ======================= FORM ======================= */}
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-6 mb-10">
        {/* --- Tipo --- */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
            ¿Qué deseas enviar?
          </label>
          <div className="flex gap-3">
            {['COMPLAINT', 'SUGGESTION'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  tipo === t
                    ? 'bg-[#312c85] text-white shadow-md shadow-[#312c85]/25'
                    : 'bg-surface text-gray-500 border border-gray-200 hover:border-[#312c85]/30 hover:text-[#312c85]'
                }`}
              >
                {t === 'COMPLAINT' ? 'Reclamo' : 'Sugerencia'}
              </button>
            ))}
          </div>
        </div>

        {/* --- Destino --- */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
            ¿A quién va dirigido?
          </label>
          <div className="flex gap-3">
            {[
              { key: 'ADMIN', label: 'Aplicativo', icon: HiOutlineDeviceMobile },
              { key: 'STORE', label: 'Tienda', icon: HiOutlineShoppingBag },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setObjetivo(key)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  objetivo === key
                    ? 'bg-[#312c85] text-white shadow-md shadow-[#312c85]/25'
                    : 'bg-surface text-gray-500 border border-gray-200 hover:border-[#312c85]/30 hover:text-[#312c85]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* --- Store selector (conditional) --- */}
        {objetivo === 'STORE' && (
          <div className="animate-fade-in">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
              Tienda
            </label>
            <div className="relative">
              <select
                value={idTienda}
                onChange={(e) => setIdTienda(e.target.value)}
                disabled={loadingStores}
                className="input-field w-full text-sm pr-10 appearance-none cursor-pointer"
              >
                <option value="">
                  {loadingStores
                    ? 'Cargando tiendas...'
                    : stores.length === 0
                      ? 'No tienes compras registradas'
                      : 'Seleccionar tienda...'}
                </option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
              <HiOutlineChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* --- Asunto --- */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
            Asunto
          </label>
          <input
            type="text"
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            placeholder="Escribe el asunto..."
            maxLength={100}
            className="input-field w-full text-sm"
          />
          <p
            className={`text-[11px] mt-1.5 px-1 ${
              asunto.trim().length >= MIN_ASUNTO ? 'text-green-500' : 'text-gray-400'
            }`}
          >
            Mínimo {MIN_ASUNTO} caracteres ({asunto.trim().length}/{MIN_ASUNTO})
          </p>
        </div>

        {/* --- Mensaje --- */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
            Mensaje
          </label>
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Describe tu queja o sugerencia..."
            rows={4}
            maxLength={1000}
            className="input-field w-full text-sm resize-none"
          />
          <p
            className={`text-[11px] mt-1.5 px-1 ${
              mensaje.trim().length >= MIN_MENSAJE ? 'text-green-500' : 'text-gray-400'
            }`}
          >
            Mínimo {MIN_MENSAJE} caracteres ({mensaje.trim().length}/{MIN_MENSAJE})
          </p>
        </div>

        {/* --- Submit --- */}
        <button
          type="submit"
          disabled={!formValid || sending}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <HiOutlinePaperAirplane className="w-5 h-5 rotate-90" />
          {sending ? 'Enviando...' : 'Enviar mensaje'}
        </button>
      </form>

      {/* ======================= HISTORY ======================= */}
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-4 px-1">
          <HiOutlineClock className="w-5 h-5 text-[#312c85]" />
          <h2 className="text-base font-bold text-gray-800 font-display">
            Historial de Mensajes
          </h2>
        </div>

        {loadingTickets ? (
          <LoadingSpinner />
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={HiOutlineChatAlt}
            title="Sin mensajes"
            description="No tienes mensajes enviados aún"
          />
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicketId(ticket.id)}
                className="bg-surface rounded-2xl shadow-card border border-gray-100/80 p-5 hover:shadow-card-hover transition-all duration-200 animate-slide-up cursor-pointer"
              >
                {/* Top row: tipo badge + status */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${
                      ticket.tipo === 'COMPLAINT'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-emerald-100 text-emerald-600'
                    }`}
                  >
                    {ticket.tipo === 'COMPLAINT' ? 'Reclamo' : 'Sugerencia'}
                  </span>
                  {statusBadge(ticket.estado)}
                </div>

                {/* Subject */}
                <h3 className="text-sm font-semibold text-gray-900 font-display mb-1">
                  {ticket.asunto}
                </h3>

                {/* Message preview */}
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
                  {ticket.descripcion}
                </p>

                {/* Footer: destination + date */}
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span className="flex items-center gap-1">
                    {ticket.objetivo === 'STORE' ? (
                      <>
                        <HiOutlineShoppingBag className="w-3.5 h-3.5" />
                        {ticket.tienda?.nombre || 'Tienda'}
                      </>
                    ) : (
                      <>
                        <HiOutlineDeviceMobile className="w-3.5 h-3.5" />
                        Aplicativo
                      </>
                    )}
                  </span>
                  <span>{formatDateTime(ticket.creado_en)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TicketConversationModal
        ticketId={selectedTicketId}
        open={!!selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        onUpdate={loadTickets}
      />
    </div>
  );
}
