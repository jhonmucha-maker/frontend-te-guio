import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { ticketService } from '../../services/ticketService';
import { useSSEListener } from '../../hooks/useSSEListener';
import { formatRelativeTime } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import TicketConversationModal from '../../components/ui/TicketConversationModal';
import toast from 'react-hot-toast';
import {
  HiOutlineExclamationCircle, HiOutlineClock, HiOutlineCheck,
  HiOutlineSearch, HiOutlineUsers, HiOutlineOfficeBuilding,
  HiOutlineChatAlt2, HiOutlineReply, HiOutlineMail, HiOutlinePhone,
} from 'react-icons/hi';

export default function ComplaintsManagementPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(null);
  const [replyText, setReplyText] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllTickets();
      setData(res.data);
    } catch {
      toast.error('Error al cargar quejas');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  useSSEListener(['ticket.created', 'ticket.message.created', 'ticket.status.updated'], loadData);

  const openTickets = data.filter(t => t.estado === 'PENDIENTE' || t.estado === 'RESPONDIDO' || t.estado === 'EN_ESPERA_DE_RESPUESTA');
  const closedTickets = data.filter(t => t.estado === 'ATENDIDO');
  const clientTickets = data.filter(t => t.usuario?.rol === 'COMPRADOR');
  const sellerTickets = data.filter(t => t.usuario?.rol === 'VENDEDOR');

  const filtered = data.filter(t => {
    const searchLower = search.toLowerCase();
    const matchSearch = !search ||
      (t.asunto || '').toLowerCase().includes(searchLower) ||
      (t.descripcion || '').toLowerCase().includes(searchLower) ||
      (t.usuario?.nombre || '').toLowerCase().includes(searchLower) ||
      (t.usuario?.correo || '').toLowerCase().includes(searchLower);

    let matchStatus = true;
    if (statusFilter === 'open') matchStatus = t.estado === 'PENDIENTE' || t.estado === 'RESPONDIDO' || t.estado === 'EN_ESPERA_DE_RESPUESTA';
    else if (statusFilter === 'closed') matchStatus = t.estado === 'ATENDIDO';

    let matchType = true;
    if (typeFilter === 'queja') matchType = t.tipo === 'COMPLAINT';
    else if (typeFilter === 'sugerencia') matchType = t.tipo === 'SUGGESTION';
    else if (typeFilter === 'clientes') matchType = t.usuario?.rol === 'COMPRADOR';
    else if (typeFilter === 'vendedores') matchType = t.usuario?.rol === 'VENDEDOR';

    return matchSearch && matchStatus && matchType;
  });

  const handleReply = async () => {
    if (!showReplyModal || !replyText.trim()) return;
    try {
      await ticketService.sendMessage(showReplyModal, { cuerpo: replyText });
      await ticketService.closeTicket(showReplyModal, { nota_cierre: replyText });
      toast.success('Respuesta enviada y caso cerrado');
      setShowReplyModal(null);
      setReplyText('');
      setSelectedTicketId(null);
      loadData();
    } catch {
      toast.error('Error al responder');
    }
  };

  const getStatusBadge = (estado) => {
    if (estado === 'PENDIENTE') return { bg: 'bg-warning-100 text-warning-700', label: 'Pendiente' };
    if (estado === 'RESPONDIDO') return { bg: 'bg-blue-100 text-blue-700', label: 'Respondido' };
    if (estado === 'EN_ESPERA_DE_RESPUESTA') return { bg: 'bg-purple-100 text-purple-700', label: 'En espera' };
    if (estado === 'ATENDIDO') return { bg: 'bg-green-100 text-green-700', label: 'Atendido' };
    return { bg: 'bg-gray-100 text-gray-700', label: estado || 'Pendiente' };
  };

  const getTypeBadge = (tipo) => {
    if (tipo === 'COMPLAINT') return { bg: 'bg-red-100 text-red-700', label: 'Queja' };
    if (tipo === 'SUGGESTION') return { bg: 'bg-blue-100 text-blue-700', label: 'Sugerencia' };
    return { bg: 'bg-gray-100 text-gray-700', label: tipo || 'General' };
  };

  return (
    <div className="animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="stat-card flex flex-col items-center py-2 px-1 text-center">
          <div className="w-8 h-8 rounded-full bg-warning-100 flex items-center justify-center mb-1"><HiOutlineClock className="w-4 h-4 text-warning-600" /></div>
          <p className="text-base font-bold font-display text-warning-600 leading-none">{openTickets.length}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Por atender</p>
        </div>
        <div className="stat-card flex flex-col items-center py-2 px-1 text-center">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-1"><HiOutlineCheck className="w-4 h-4 text-green-600" /></div>
          <p className="text-base font-bold font-display text-green-600 leading-none">{closedTickets.length}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Atendidos</p>
        </div>
        <div className="stat-card flex flex-col items-center py-2 px-1 text-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mb-1"><HiOutlineUsers className="w-4 h-4 text-blue-600" /></div>
          <p className="text-base font-bold font-display text-blue-600 leading-none">{clientTickets.length}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Clientes</p>
        </div>
        <div className="stat-card flex flex-col items-center py-2 px-1 text-center">
          <div className="w-8 h-8 rounded-full bg-seller-100 flex items-center justify-center mb-1"><HiOutlineOfficeBuilding className="w-4 h-4 text-seller-500" /></div>
          <p className="text-base font-bold font-display text-seller-500 leading-none">{sellerTickets.length}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Vendedores</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por asunto, descripción o usuario..." className="input-field pl-9 text-xs py-2" />
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 mb-2 overflow-x-auto pb-0.5">
        {[
          { key: 'all', label: `Todos (${data.length})` },
          { key: 'open', label: `Por atender (${openTickets.length})` },
          { key: 'closed', label: `Atendidos (${closedTickets.length})` },
        ].map(f => (
          <button key={f.key} onClick={() => setStatusFilter(f.key)} className={`chip whitespace-nowrap text-xs ${statusFilter === f.key ? 'chip-active' : 'chip-inactive'}`}>{f.label}</button>
        ))}
      </div>
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-0.5">
        {[
          { key: 'all', label: 'Todos los tipos' },
          { key: 'queja', label: 'Quejas' },
          { key: 'sugerencia', label: 'Sugerencias' },
          { key: 'clientes', label: 'De Clientes' },
          { key: 'vendedores', label: 'De Vendedores' },
        ].map(f => (
          <button key={f.key} onClick={() => setTypeFilter(f.key)} className={`chip whitespace-nowrap text-xs ${typeFilter === f.key ? 'chip-active' : 'chip-inactive'}`}>{f.label}</button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={HiOutlineExclamationCircle} title="Sin quejas" description="No hay quejas o sugerencias" />
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const statusBadge = getStatusBadge(item.estado);
            const typeBadge = getTypeBadge(item.tipo);
            const isOpen = item.estado === 'PENDIENTE' || item.estado === 'RESPONDIDO' || item.estado === 'EN_ESPERA_DE_RESPUESTA';
            return (
              <div key={item.id} className="card animate-slide-up cursor-pointer !p-3 overflow-hidden" onClick={() => setSelectedTicketId(item.id)}>
                <div className="flex items-center gap-1.5 mb-1 min-w-0">
                  <h3 className="text-xs font-bold text-gray-900 flex-1 min-w-0 truncate">{item.asunto || 'Sin asunto'}</h3>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${typeBadge.bg}`}>{typeBadge.label}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${statusBadge.bg}`}>{statusBadge.label}</span>
                </div>
                <p className="text-[11px] text-gray-500 truncate mb-1.5">{item.descripcion || 'Sin descripción'}</p>
                <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-1 min-w-0">
                  <span className="truncate min-w-0">
                    <span className="font-medium text-gray-500">De:</span>{' '}
                    {item.usuario?.nombre || 'Desconocido'}
                    {item.usuario?.rol && (
                      <span className={`ml-1 text-[9px] font-semibold px-1 py-0.5 rounded ${
                        item.usuario.rol === 'COMPRADOR' ? 'bg-blue-50 text-blue-600' : 'bg-seller-50 text-seller-600'
                      }`}>
                        {item.usuario.rol === 'COMPRADOR' ? 'Comprador' : 'Vendedor'}
                      </span>
                    )}
                  </span>
                  <span className="ml-auto shrink-0">{formatRelativeTime(item.creado_en)}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-400 min-w-0">
                  {item.usuario?.correo && (
                    <span className="flex items-center gap-1 min-w-0 overflow-hidden">
                      <HiOutlineMail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{item.usuario.correo}</span>
                    </span>
                  )}
                  {item.usuario?.telefono && (
                    <span className="flex items-center gap-1 shrink-0">
                      <HiOutlinePhone className="w-3 h-3" />
                      <span>{item.usuario.telefono}</span>
                    </span>
                  )}
                  {item.total_mensajes > 1 && (
                    <span className="flex items-center gap-1 ml-auto shrink-0">
                      <HiOutlineChatAlt2 className="w-3 h-3" />
                      {item.total_mensajes}
                    </span>
                  )}
                </div>

                {isOpen && (
                  <div className="flex gap-2 mt-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => { setShowReplyModal(item.id); setReplyText(''); }}
                      className="flex-1 btn-primary text-xs py-1.5 flex items-center justify-center gap-1"
                    >
                      <HiOutlineReply className="w-3.5 h-3.5" /> Responder y Cerrar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Conversation Modal */}
      <TicketConversationModal
        ticketId={selectedTicketId}
        open={!!selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        onUpdate={loadData}
      />

      {/* Reply Modal */}
      <Modal open={!!showReplyModal} onClose={() => setShowReplyModal(null)} title="Cerrar Caso y Responder" maxWidth="max-w-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Respuesta</label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="input-field text-sm"
              rows={4}
              placeholder="Escribe tu respuesta al usuario..."
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowReplyModal(null)} className="btn-secondary flex-1 text-sm">Cancelar</button>
            <button onClick={handleReply} className="btn-primary flex-1 text-sm">Enviar y Cerrar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
