import { useState, useEffect, useCallback } from 'react';
import { ticketService } from '../../services/ticketService';
import { useSSEListener } from '../../hooks/useSSEListener';
import { formatDateTime } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import TicketConversationModal from '../../components/ui/TicketConversationModal';
import toast from 'react-hot-toast';
import {
  HiOutlineChatAlt,
  HiOutlineChatAlt2,
  HiOutlinePaperAirplane,
  HiOutlineDeviceMobile,
  HiOutlineArrowLeft,
  HiOutlinePlus,
  HiOutlineCheck,
  HiOutlineClock,
  HiOutlineInbox,
} from 'react-icons/hi';

const MIN_ASUNTO = 5;
const MIN_MENSAJE = 10;

const STATUS_FILTERS = [
  { key: 'TODOS', label: 'Todos' },
  { key: 'PENDIENTE', label: 'Pendientes' },
  { key: 'RESPONDIDO', label: 'Respondidos' },
  { key: 'ATENDIDO', label: 'Resueltos' },
];

export default function SellerComplaintsPage() {
  const [activeTab, setActiveTab] = useState('recibidas');
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleModalUpdate = () => setRefreshKey((k) => k + 1);

  return (
    <div className="animate-fade-in pb-24">
      {activeTab === 'enviar' ? (
        <SendComplaintView onBack={() => setActiveTab('recibidas')} onOpenTicket={setSelectedTicketId} refreshKey={refreshKey} />
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setActiveTab('recibidas')}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'recibidas'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <HiOutlineInbox className="w-4 h-4" />
              Recibidas
            </button>
            <button
              onClick={() => setActiveTab('mis_mensajes')}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'mis_mensajes'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <HiOutlinePaperAirplane className="w-4 h-4 rotate-90" />
              Mis Mensajes
            </button>
          </div>

          {activeTab === 'recibidas' ? (
            <ReceivedTab onSend={() => setActiveTab('enviar')} onOpenTicket={setSelectedTicketId} refreshKey={refreshKey} />
          ) : (
            <SentTab onSend={() => setActiveTab('enviar')} onOpenTicket={setSelectedTicketId} refreshKey={refreshKey} />
          )}
        </>
      )}

      <TicketConversationModal
        ticketId={selectedTicketId}
        open={!!selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        onUpdate={handleModalUpdate}
      />
    </div>
  );
}

/* ── Received Tab ── */
function ReceivedTab({ onSend, onOpenTicket, refreshKey }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('TODOS');

  useEffect(() => {
    loadTickets();
  }, [refreshKey]);

  // Actualizar en tiempo real
  useSSEListener(['ticket.created', 'ticket.message.created', 'ticket.status.updated'], () => loadTickets());

  const loadTickets = async () => {
    setLoading(true);
    try {
      const { data } = await ticketService.getMyTickets();
      const list = data.data || data || [];
      // Filter to show only tickets directed TO the seller's stores
      setTickets(list.filter((t) => t.objetivo === 'STORE'));
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const totalCount = tickets.length;
  const pendingCount = tickets.filter((t) => t.estado === 'PENDIENTE').length;
  const respondedCount = tickets.filter((t) => t.estado === 'RESPONDIDO').length;
  const resolvedCount = tickets.filter((t) => t.estado === 'ATENDIDO').length;

  const filteredTickets = filter === 'TODOS'
    ? tickets
    : tickets.filter((t) => t.estado === filter);

  return (
    <>
      {/* Counters */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-gray-50 rounded-xl py-2 text-center">
          <p className="text-lg font-display font-bold text-gray-700">{totalCount}</p>
          <p className="text-[10px] text-gray-400">Total</p>
        </div>
        <div className="bg-warning-50 rounded-xl py-2 text-center">
          <p className="text-lg font-display font-bold text-warning-500">{pendingCount}</p>
          <p className="text-[10px] text-gray-400">Pendientes</p>
        </div>
        <div className="bg-blue-50 rounded-xl py-2 text-center">
          <p className="text-lg font-display font-bold text-blue-500">{respondedCount}</p>
          <p className="text-[10px] text-gray-400">Respondidos</p>
        </div>
        <div className="bg-green-50 rounded-xl py-2 text-center">
          <p className="text-lg font-display font-bold text-green-500">{resolvedCount}</p>
          <p className="text-[10px] text-gray-400">Resueltos</p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              filter === f.key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {filter === f.key && <HiOutlineCheck className="w-3.5 h-3.5" />}
            {f.label}
          </button>
        ))}
      </div>

      {/* Tickets list */}
      {loading ? (
        <LoadingSpinner />
      ) : filteredTickets.length === 0 ? (
        <EmptyState
          icon={HiOutlineChatAlt2}
          title="No hay mensajes"
          description="Aún no tienes quejas o sugerencias de clientes"
        />
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => onOpenTicket(ticket.id)}
              className="card rounded-2xl shadow-card cursor-pointer hover:shadow-card-hover transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${
                  ticket.tipo === 'COMPLAINT' ? 'bg-red-100 text-red-600' : 'bg-primary-100 text-primary-600'
                }`}>
                  {ticket.tipo === 'COMPLAINT' ? 'Reclamo' : 'Sugerencia'}
                </span>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                  ticket.estado === 'PENDIENTE' ? 'bg-warning-100 text-warning-700' :
                  ticket.estado === 'RESPONDIDO' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {ticket.estado === 'PENDIENTE' ? 'Pendiente' :
                   ticket.estado === 'RESPONDIDO' ? 'Respondido' : 'Resuelto'}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{ticket.asunto}</h3>
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <span>{ticket.tienda?.nombre || 'Tienda'}</span>
                <span>{formatDateTime(ticket.creado_en)}</span>
              </div>
              {ticket.no_leido && (
                <div className="mt-2 w-2 h-2 bg-primary-600 rounded-full" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={onSend}
        className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-elevated flex items-center gap-2 px-5 py-3.5 transition-all duration-300 hover:scale-105 z-40"
      >
        <HiOutlinePlus className="w-5 h-5" />
        <span className="font-semibold text-sm">Enviar Mensaje</span>
      </button>
    </>
  );
}

/* ── Sent Tab ── */
function SentTab({ onSend, onOpenTicket, refreshKey }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, [refreshKey]);

  // Actualizar en tiempo real
  useSSEListener(['ticket.message.created', 'ticket.status.updated'], () => loadTickets());

  const loadTickets = async () => {
    setLoading(true);
    try {
      const { data } = await ticketService.getMyTickets();
      const list = data.data || data || [];
      // Show tickets sent by the seller (objetivo=ADMIN)
      setTickets(list.filter((t) => t.objetivo === 'ADMIN'));
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading ? (
        <LoadingSpinner />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={HiOutlineChatAlt}
          title="Sin mensajes enviados"
          description="Aún no has enviado quejas o sugerencias"
          action={
            <button onClick={onSend} className="btn-primary text-sm rounded-xl px-6">
              Enviar Mensaje
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => onOpenTicket(ticket.id)}
              className="card rounded-2xl shadow-card cursor-pointer hover:shadow-card-hover transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${
                  ticket.tipo === 'COMPLAINT' ? 'bg-red-100 text-red-600' : 'bg-primary-100 text-primary-600'
                }`}>
                  {ticket.tipo === 'COMPLAINT' ? 'Reclamo' : 'Sugerencia'}
                </span>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                  ticket.estado === 'PENDIENTE' ? 'bg-warning-100 text-warning-700' :
                  ticket.estado === 'RESPONDIDO' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {ticket.estado === 'PENDIENTE' ? 'Pendiente' :
                   ticket.estado === 'RESPONDIDO' ? 'En proceso' : 'Cerrado'}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{ticket.asunto}</h3>
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <span className="flex items-center gap-1">
                  <HiOutlineDeviceMobile className="w-3.5 h-3.5" />
                  Aplicativo
                </span>
                <span>{formatDateTime(ticket.creado_en)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={onSend}
        className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-elevated flex items-center gap-2 px-5 py-3.5 transition-all duration-300 hover:scale-105 z-40"
      >
        <HiOutlinePlus className="w-5 h-5" />
        <span className="font-semibold text-sm">Enviar Mensaje</span>
      </button>
    </>
  );
}

/* ── Send Complaint View ── */
function SendComplaintView({ onBack, onOpenTicket, refreshKey }) {
  const [tipo, setTipo] = useState('COMPLAINT');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [sending, setSending] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [refreshKey]);

  // Actualizar historial en tiempo real
  useSSEListener(['ticket.message.created', 'ticket.status.updated'], () => loadHistory());

  const loadHistory = async () => {
    setLoadingTickets(true);
    try {
      const { data } = await ticketService.getMyTickets();
      const list = data.data || data || [];
      setTickets(list.filter((t) => t.objetivo === 'ADMIN'));
    } catch {
    } finally {
      setLoadingTickets(false);
    }
  };

  const asuntoValid = asunto.trim().length >= MIN_ASUNTO;
  const mensajeValid = mensaje.trim().length >= MIN_MENSAJE;
  const formValid = asuntoValid && mensajeValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formValid) return;
    setSending(true);
    try {
      await ticketService.createTicket({
        tipo,
        objetivo: 'ADMIN',
        asunto: asunto.trim(),
        mensaje: mensaje.trim(),
      });
      toast.success('Mensaje enviado correctamente');
      setTipo('COMPLAINT');
      setAsunto('');
      setMensaje('');
      loadHistory();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al enviar');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Sub-header */}
      <div className="gradient-primary -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 px-4 py-3 mb-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <HiOutlineArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-base font-display font-bold text-white">Enviar Queja o Sugerencia</h2>
      </div>

      {/* Info card */}
      <div className="card rounded-2xl shadow-card text-center mb-6">
        <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <HiOutlineChatAlt className="w-7 h-7 text-primary-500" />
        </div>
        <h3 className="text-base font-display font-bold text-gray-900">Quejas y Sugerencias</h3>
        <p className="text-xs text-gray-500 mt-1">
          Tu opinión es importante para nosotros. Cuéntanos cómo podemos mejorar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 mb-8">
        {/* Tipo */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">¿Qué deseas enviar?</p>
          <div className="flex gap-3">
            {['COMPLAINT', 'SUGGESTION'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  tipo === t
                    ? 'bg-primary-600 text-white'
                    : 'bg-surface text-gray-500 border border-gray-200 hover:border-primary-300'
                }`}
              >
                {t === 'COMPLAINT' ? 'Reclamo' : 'Sugerencia'}
              </button>
            ))}
          </div>
        </div>

        {/* Destino (fixed for seller) */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">¿A quién va dirigido?</p>
          <div className="bg-primary-600 text-white py-2.5 rounded-xl text-sm font-semibold text-center flex items-center justify-center gap-2">
            <HiOutlineDeviceMobile className="w-4 h-4" />
            Aplicativo
          </div>
        </div>

        {/* Asunto */}
        <div>
          <input
            type="text"
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            placeholder="Asunto"
            maxLength={100}
            className="input-field rounded-xl text-sm w-full"
          />
          <p className={`text-[11px] mt-1 ${asuntoValid ? 'text-primary-500' : 'text-gray-400'}`}>
            Mínimo {MIN_ASUNTO} caracteres ({asunto.trim().length}/{MIN_ASUNTO})
          </p>
        </div>

        {/* Mensaje */}
        <div>
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Mensaje"
            rows={4}
            maxLength={1000}
            className="input-field rounded-xl text-sm w-full resize-none"
          />
          <p className={`text-[11px] mt-1 ${mensajeValid ? 'text-primary-500' : 'text-gray-400'}`}>
            Mínimo {MIN_MENSAJE} caracteres ({mensaje.trim().length}/{MIN_MENSAJE})
          </p>
        </div>

        <button
          type="submit"
          disabled={!formValid || sending}
          className="btn-primary w-full rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <HiOutlinePaperAirplane className="w-4 h-4 rotate-90" />
          {sending ? 'Enviando...' : 'Enviar mensaje'}
        </button>
      </form>

      {/* History */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineClock className="w-5 h-5 text-primary-600" />
          <h3 className="text-base font-display font-bold text-gray-800">Historial de Mensajes</h3>
        </div>

        {loadingTickets ? (
          <LoadingSpinner />
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={HiOutlineChatAlt2}
            title="Sin mensajes"
            description="No tienes mensajes enviados aún"
          />
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div key={ticket.id} onClick={() => onOpenTicket(ticket.id)} className="card rounded-2xl shadow-card cursor-pointer hover:shadow-card-hover transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    ticket.tipo === 'COMPLAINT' ? 'bg-red-100 text-red-600' : 'bg-primary-100 text-primary-600'
                  }`}>
                    {ticket.tipo === 'COMPLAINT' ? 'Reclamo' : 'Sugerencia'}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    ticket.estado === 'PENDIENTE' ? 'bg-warning-100 text-warning-700' :
                    ticket.estado === 'RESPONDIDO' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {ticket.estado === 'PENDIENTE' ? 'Pendiente' :
                     ticket.estado === 'RESPONDIDO' ? 'En proceso' : 'Cerrado'}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{ticket.asunto}</h3>
                <p className="text-xs text-gray-400">
                  {formatDateTime(ticket.creado_en)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
