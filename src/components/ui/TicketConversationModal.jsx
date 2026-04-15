import { useState, useEffect, useRef, useCallback } from 'react';
import { ticketService } from '../../services/ticketService';
import { useSSEListener } from '../../hooks/useSSEListener';
import { useAuth } from '../../features/auth/useAuth';
import { formatDateTime } from '../../utils/formatters';
import ConfirmDialog from './ConfirmDialog';
import toast from 'react-hot-toast';
import {
  HiOutlineX,
  HiOutlinePaperAirplane,
  HiOutlineChatAlt2,
  HiOutlineUser,
  HiOutlineClock,
} from 'react-icons/hi';

export default function TicketConversationModal({ ticketId, open, onClose, onUpdate }) {
  const { usuario } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open && ticketId) {
      loadTicket();
    }
    if (!open) {
      setTicket(null);
      setMessage('');
      setShowClose(false);
      setCloseReason('');
    }
  }, [open, ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.mensajes]);

  const handleSSEEvent = useCallback((data) => {
    if (!ticketId) return;
    if (!data.ticket_id || data.ticket_id === parseInt(ticketId)) {
      loadTicket();
    }
  }, [ticketId]);
  useSSEListener(['ticket.message.created', 'ticket.status.updated'], handleSSEEvent);

  const loadTicket = async () => {
    setLoading(true);
    try {
      const { data } = await ticketService.getTicketDetail(ticketId);
      setTicket(data.data || data);
      ticketService.markRead(ticketId).catch(() => {});
    } catch {
      toast.error('Ticket no encontrado');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await ticketService.sendMessage(ticketId, { cuerpo: message });
      setMessage('');
      loadTicket();
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al enviar');
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async () => {
    try {
      await ticketService.acceptTicket(ticketId);
      toast.success('Ticket aceptado');
      loadTicket();
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const handleClose = async () => {
    try {
      await ticketService.closeTicket(ticketId, { nota_cierre: closeReason });
      toast.success('Ticket cerrado');
      setShowClose(false);
      loadTicket();
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  if (!open) return null;

  const isClosed = ticket?.estado === 'ATENDIDO';
  const canAccept = usuario?.rol === 'COMPRADOR' && ticket?.estado === 'RESPONDIDO';
  const canClose = (usuario?.rol === 'VENDEDOR' || usuario?.rol === 'ADMINISTRADOR') && ticket && !isClosed;

  // Solo puede responder si: no está cerrado Y el último mensaje NO es del usuario actual
  const mensajes = ticket?.mensajes || [];
  const lastMsg = mensajes[mensajes.length - 1];
  const lastMsgIsOwn = lastMsg && lastMsg.id_autor === usuario?.id;
  const canReply = ticket && !isClosed && !lastMsgIsOwn;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-surface rounded-2xl shadow-elevated animate-slide-up w-full max-w-lg max-h-[90vh] flex flex-col z-10 overflow-hidden">

          {/* Header */}
          <div className="gradient-primary p-4 relative shrink-0">
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
                  <HiOutlineChatAlt2 className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold font-display text-white truncate">
                    {loading ? 'Cargando...' : ticket?.asunto || 'Ticket'}
                  </h3>
                  {ticket && (
                    <p className="text-[10px] text-white/60 mt-0.5">
                      #{ticket.id} | {formatDateTime(ticket.fecha_hora_registro)}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors shrink-0"
              >
                <HiOutlineX className="w-5 h-5 text-white" />
              </button>
            </div>
            {/* Badges */}
            {ticket && (
              <div className="flex items-center gap-2 mt-3 relative z-10 flex-wrap">
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${
                  ticket.tipo === 'COMPLAINT' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {ticket.tipo === 'COMPLAINT' ? 'Reclamo' : 'Sugerencia'}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${
                  isClosed ? 'bg-green-100 text-green-700' :
                  ticket.estado === 'RESPONDIDO' ? 'bg-blue-100 text-blue-700' :
                  'bg-warning-100 text-warning-700'
                }`}>
                  {isClosed ? 'Atendido' : ticket.estado === 'RESPONDIDO' ? 'Respondido' : 'Pendiente'}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {/* Mensajes como hilo */}
                {mensajes.map((msg, idx) => {
                  const isOwn = msg.id_autor === usuario?.id;
                  const authorName = msg.tbl_usuarios?.nombre || 'Usuario';
                  const isFirst = idx === 0;

                  return (
                    <div key={msg.id} className={`p-4 ${isFirst ? 'bg-gray-50/80' : ''}`}>
                      {/* Author row */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          isOwn ? 'bg-primary-100' : 'bg-gray-200'
                        }`}>
                          <HiOutlineUser className={`w-3.5 h-3.5 ${isOwn ? 'text-primary-600' : 'text-gray-500'}`} />
                        </div>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={`text-xs font-bold ${isOwn ? 'text-primary-700' : 'text-gray-700'}`}>
                            {authorName}
                          </span>
                          {isOwn && (
                            <span className="text-[9px] font-semibold uppercase bg-primary-50 text-primary-500 px-1.5 py-0.5 rounded">Tu</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-gray-400 shrink-0">
                          <HiOutlineClock className="w-3 h-3" />
                          <span className="text-[10px]">{formatDateTime(msg.fecha_hora_registro)}</span>
                        </div>
                      </div>
                      {/* Message body */}
                      <div className="pl-9">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{msg.cuerpo}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Footer actions */}
          {ticket && !loading && (
            <div className="border-t border-gray-100 bg-surface shrink-0">
              {/* Reply form - solo si puede responder */}
              {canReply && (
                <form onSubmit={handleSend} className="p-4">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Escribir respuesta</p>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="input-field text-sm w-full resize-none mb-3"
                    rows={3}
                    placeholder="Escriba su respuesta..."
                  />
                  <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="btn-primary text-sm w-full flex items-center justify-center gap-2"
                  >
                    <HiOutlinePaperAirplane className="w-4 h-4 rotate-90" />
                    {sending ? 'Enviando...' : 'Enviar respuesta'}
                  </button>
                </form>
              )}

              {/* Waiting notice - si el último mensaje es propio y no está cerrado */}
              {!isClosed && lastMsgIsOwn && (
                <div className="p-4 text-center">
                  <p className="text-xs text-gray-400">Esperando respuesta de la contraparte...</p>
                </div>
              )}

              {/* Closed notice */}
              {isClosed && (
                <div className="p-4 text-center">
                  <p className="text-xs text-gray-400">Este ticket ha sido cerrado</p>
                </div>
              )}

              {/* Action buttons */}
              {(canAccept || canClose) && (
                <div className="flex gap-2 px-4 pb-4">
                  {canAccept && (
                    <button onClick={handleAccept} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors">
                      Aceptar respuesta
                    </button>
                  )}
                  {canClose && (
                    <button onClick={() => setShowClose(true)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm py-2.5 rounded-xl transition-colors">
                      Cerrar ticket
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Close dialog */}
      <ConfirmDialog
        open={showClose}
        onClose={() => setShowClose(false)}
        onConfirm={handleClose}
        title="Cerrar ticket"
        message="Indique el motivo de cierre (opcional)"
        confirmText="Cerrar ticket"
      >
        <textarea
          value={closeReason}
          onChange={(e) => setCloseReason(e.target.value)}
          className="input-field text-sm mt-2"
          rows={2}
          placeholder="Motivo de cierre..."
        />
      </ConfirmDialog>
    </>
  );
}
