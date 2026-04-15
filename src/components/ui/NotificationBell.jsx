import { useState, useCallback } from 'react';
import { useAuth } from '../../features/auth/useAuth';
import { useSSE } from '../../hooks/useSSE';
import { sseEventBus } from '../../services/sseEventBus';
import { HiOutlineBell } from 'react-icons/hi';
import toast from 'react-hot-toast';

const EVENT_LABELS = {
  'favorites.updated': 'Favoritos actualizados',
  'shopping_list.updated': 'Lista de compras actualizada',
  'ticket.created': 'Nuevo ticket recibido',
  'ticket.message.created': 'Nuevo mensaje en ticket',
  'ticket.status.updated': 'Estado de ticket actualizado',
  'approval.seller.approved': 'Vendedor aprobado',
  'approval.seller.rejected': 'Vendedor rechazado',
  'approval.store.approved': 'Tienda aprobada',
  'approval.store.rejected': 'Tienda rechazada',
  'approval.store.updated': 'Estado de tienda actualizado',
  'approval.product.approved': 'Producto aprobado',
  'approval.product.rejected': 'Producto rechazado',
  'approval.product.updated': 'Estado de producto actualizado',
  'subscription.request.updated': 'Solicitud de suscripcion actualizada',
  'subscription.active.updated': 'Suscripcion activa actualizada',
  'product.price.changed': 'Precio de producto actualizado',
  'admin.pending.seller': 'Solicitud de nuevo vendedor',
  'admin.pending.store': 'Solicitud de nueva tienda',
  'admin.pending.product': 'Solicitud de nuevo producto',
  'admin.pending.subscription': 'Solicitud de suscripcion',
};

export default function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleEvent = useCallback((data) => {
    if (data.event === 'connected') return;

    // Emitir al bus para que las paginas reaccionen
    if (data.type) {
      sseEventBus.emit(data.type, data.data || {});
    }

    // Eventos que no deben aparecer en la campana (acciones propias del usuario)
    const hiddenEvents = ['shopping_list.updated', 'favorites.updated', 'admin.dashboard.updated'];
    if (hiddenEvents.includes(data.type)) return;

    const label = EVENT_LABELS[data.type] || data.type;
    const notification = {
      id: `${data.event_id || Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: data.type,
      label,
      data: data.data,
      ts: data.ts_utc,
      read: false,
    };

    setNotifications((prev) => [notification, ...prev].slice(0, 50));
    setUnreadCount((prev) => prev + 1);

    // Auto-eliminar la notificación de la campana después de 2 segundos
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }, 2000);

    toast(label, { icon: '🔔', duration: 2000 });
  }, []);

  const { connected } = useSSE(isAuthenticated ? handleEvent : null);

  const markAllRead = () => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative">
      <button
        onClick={() => {
          setShowDropdown(!showDropdown);
          if (!showDropdown) markAllRead();
        }}
        className="relative p-1 sm:p-1.5 rounded-lg hover:bg-white/10 transition-colors"
      >
        <HiOutlineBell className="w-5 h-5 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-coral-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-72 bg-surface rounded-2xl shadow-elevated border border-gray-100 z-50 max-h-80 overflow-y-auto">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Notificaciones</span>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-400'}`} title={connected ? 'Conectado' : 'Desconectado'} />
            </div>
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">
                Sin notificaciones
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-3 py-2.5 border-b border-gray-50 text-sm ${
                    n.read ? 'text-gray-500' : 'text-gray-700 bg-blue-50/50'
                  }`}
                >
                  <p className="font-medium text-xs">{n.label}</p>
                  {n.ts && (
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(n.ts).toLocaleTimeString('es-PE', { timeZone: 'America/Lima' })}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
