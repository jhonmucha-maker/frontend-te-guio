import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { adminService } from '../../services/adminService';
import { useSSEListener } from '../../hooks/useSSEListener';
import { formatDateTime, formatDate, formatCurrency } from '../../utils/formatters';

import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import {
  HiOutlineCreditCard, HiOutlineCheck, HiOutlineX, HiOutlineClock,
  HiOutlineSearch, HiOutlineCalendar, HiOutlineTrash,
  HiOutlineDownload, HiOutlineExternalLink, HiOutlineDocument,
} from 'react-icons/hi';

import { resolveFileUrl } from '../../utils/constants';
import { detectFileKind, buildDownloadUrl } from '../../utils/fileUtils';
import { openExternal } from '../../utils/navigation';

export default function AdminSubscriptionsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDateModal, setShowDateModal] = useState(null);
  const [newEndDate, setNewEndDate] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [expiringDaysThreshold, setExpiringDaysThreshold] = useState(15);
  const [previewDoc, setPreviewDoc] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminService.getPendingSubscriptions();
      setData(res.data || []);
      setSelectedIds(new Set());
    } catch {
      toast.error('Error al cargar suscripciones');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    loadData();
    // Cargar threshold de "por vencer" desde config del sistema
    adminService.getSystemConfig().then((res) => {
      const arr = Array.isArray(res.data) ? res.data : [];
      const cfg = arr.find((c) => c.clave === 'dias_filtro_por_vencer_suscripcion');
      if (cfg?.valor) setExpiringDaysThreshold(parseInt(cfg.valor) || 15);
    }).catch(() => {});
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadData();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useSSEListener(['admin.pending.subscription', 'subscription.request.updated'], loadData);

  const pending = data.filter(i => i.estado === 'PENDIENTE');
  const approved = data.filter(i => i.estado === 'APROBADO');
  const rejected = data.filter(i => i.estado === 'RECHAZADO');

  const getDaysRemaining = (item) => {
    const finEn = item.tbl_tiendas?.suscripcion_activa?.fin_en;
    if (!finEn || item.estado !== 'APROBADO') return null;
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const expDate = new Date(finEn);
    if (isNaN(expDate.getTime())) return null;
    return Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
  };

  const isExpiringSoon = (item) => {
    const days = getDaysRemaining(item);
    return days !== null && days > 0 && days <= expiringDaysThreshold;
  };

  const isExpired = (item) => {
    const days = getDaysRemaining(item);
    return days !== null && days <= 0;
  };

  const expiringSoon = data.filter(isExpiringSoon);
  const expired = data.filter(isExpired);

  const filtered = data.filter(i => {
    const searchLower = search.toLowerCase();
    const matchSearch = !search ||
      (i.tbl_tiendas?.nombre || '').toLowerCase().includes(searchLower) ||
      (i.tbl_usuarios?.nombre || '').toLowerCase().includes(searchLower) ||
      (i.tbl_tiendas?.tbl_galerias?.nombre || '').toLowerCase().includes(searchLower);
    let matchFilter = true;
    if (filter === 'pending') matchFilter = i.estado === 'PENDIENTE';
    else if (filter === 'approved') matchFilter = i.estado === 'APROBADO';
    else if (filter === 'rejected') matchFilter = i.estado === 'RECHAZADO';
    else if (filter === 'expiring') matchFilter = isExpiringSoon(i);
    else if (filter === 'expired') matchFilter = isExpired(i);
    return matchSearch && matchFilter;
  });

  const rejectedInView = filtered.filter(i => i.estado === 'RECHAZADO');
  const allRejectedSelected = rejectedInView.length > 0 && rejectedInView.every(i => selectedIds.has(i.id));

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allRejectedSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rejectedInView.map(i => i.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setDeleteLoading(true);
    try {
      await adminService.bulkDeleteRejectedSubscriptions([...selectedIds]);
      toast.success(`${selectedIds.size} solicitud(es) eliminada(s)`);
      setShowDeleteConfirm(false);
      setSelectedIds(new Set());
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await adminService.approveSubscription(id, { estado: 'APROBADO' });
      toast.success('Suscripción aprobada');
      setSelectedItem(null);
      loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleReject = async (id) => {
    try {
      await adminService.approveSubscription(id, { estado: 'RECHAZADO' });
      toast.success('Suscripción rechazada');
      setSelectedItem(null);
      loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleUpdateDate = async () => {
    if (!showDateModal || !newEndDate) return;
    try {
      await adminService.updateSubscriptionEndDate(showDateModal, { fecha_fin: newEndDate });
      toast.success('Fecha actualizada');
      setShowDateModal(null);
      setNewEndDate('');
      loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al actualizar fecha'); }
  };

  const getStatusBadge = (estado) => {
    if (estado === 'PENDIENTE') return { bg: 'bg-warning-100 text-warning-700', label: 'Pendiente' };
    if (estado === 'APROBADO') return { bg: 'bg-green-100 text-green-700', label: 'Aprobado' };
    return { bg: 'bg-red-100 text-red-700', label: 'Rechazado' };
  };

  const getComprobante = (item) => {
    return item.archivos?.find(a => a.es_comprobante) || item.archivos?.[0] || null;
  };

  const getArchivosAdicionales = (item) => {
    return (item.archivos || []).filter(a => !a.es_comprobante);
  };

  // Abre la vista previa: en APK usa el visor nativo del sistema (Custom Tabs / app PDF
  // del dispositivo), porque el WebView de Android no renderiza PDFs en iframes.
  // En navegador web abre el modal con iframe (Chrome trae visor PDF integrado).
  const openPreview = (archivo) => {
    if (!archivo) return;
    const url = resolveFileUrl(archivo.url_archivo);
    const kind = detectFileKind(archivo);
    if (kind === 'pdf' && Capacitor.isNativePlatform()) {
      openExternal(url);
      return;
    }
    setPreviewDoc({ url, type: kind === 'image' ? 'image' : 'pdf', filename: archivo.url_archivo?.split('/').pop() });
  };

  const downloadFile = (archivo) => {
    if (!archivo) return;
    const url = buildDownloadUrl(resolveFileUrl(archivo.url_archivo));
    openExternal(url);
  };

  return (
    <div className="animate-fade-in pt-2">

      {/* Stats compactos */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="bg-surface rounded-lg shadow-sm border border-gray-100/80 px-2 py-1.5 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-warning-100 flex items-center justify-center flex-shrink-0"><HiOutlineClock className="w-3.5 h-3.5 text-warning-600" /></div>
          <div>
            <p className="text-sm font-bold font-display text-warning-600 leading-tight">{pending.length}</p>
            <p className="text-[9px] text-gray-500">Pendientes</p>
          </div>
        </div>
        <div className="bg-surface rounded-lg shadow-sm border border-gray-100/80 px-2 py-1.5 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0"><HiOutlineCheck className="w-3.5 h-3.5 text-green-600" /></div>
          <div>
            <p className="text-sm font-bold font-display text-green-600 leading-tight">{approved.length}</p>
            <p className="text-[9px] text-gray-500">Aprobados</p>
          </div>
        </div>
        <div className="bg-surface rounded-lg shadow-sm border border-gray-100/80 px-2 py-1.5 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0"><HiOutlineX className="w-3.5 h-3.5 text-red-600" /></div>
          <div>
            <p className="text-sm font-bold font-display text-red-600 leading-tight">{rejected.length}</p>
            <p className="text-[9px] text-gray-500">Rechazados</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-surface rounded-lg shadow-sm border border-gray-100/80 px-2 py-1.5 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0"><HiOutlineClock className="w-3.5 h-3.5 text-orange-600" /></div>
          <div>
            <p className="text-sm font-bold font-display text-orange-600 leading-tight">{expiringSoon.length}</p>
            <p className="text-[9px] text-gray-500">Por Vencer</p>
          </div>
        </div>
        <div className="bg-surface rounded-lg shadow-sm border border-gray-100/80 px-2 py-1.5 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0"><HiOutlineX className="w-3.5 h-3.5 text-red-600" /></div>
          <div>
            <p className="text-sm font-bold font-display text-red-600 leading-tight">{expired.length}</p>
            <p className="text-[9px] text-gray-500">Vencidos</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-surface rounded-xl shadow-card border border-gray-100/80 p-3 mb-3">
        <div className="relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar tienda, vendedor o galería..." className="input-field pl-10 text-sm" />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {[
          { key: 'all', label: `Todos (${data.length})` },
          { key: 'pending', label: `Pendientes (${pending.length})` },
          { key: 'approved', label: `Aprobados (${approved.length})` },
          { key: 'rejected', label: `Rechazados (${rejected.length})` },
          { key: 'expiring', label: `Por Vencer (${expiringSoon.length})` },
          { key: 'expired', label: `Vencidos (${expired.length})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`chip whitespace-nowrap ${filter === f.key ? 'chip-active' : 'chip-inactive'}`}>{f.label}</button>
        ))}
      </div>

      {rejectedInView.length > 0 && (
        <div className="bg-surface rounded-2xl shadow-card border border-gray-100/80 p-4 mb-4 flex items-center justify-between gap-3 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <input type="checkbox" checked={allRejectedSelected} onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            Marcar todas las rechazadas ({rejectedInView.length})
          </label>
          {selectedIds.size > 0 && (
            <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">
              <HiOutlineTrash className="w-4 h-4" /> Eliminar ({selectedIds.size})
            </button>
          )}
        </div>
      )}

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={HiOutlineCreditCard} title="Sin suscripciones" description="No hay suscripciones para mostrar" />
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const badge = getStatusBadge(item.estado);
            const isPending = item.estado === 'PENDIENTE';
            const isApproved = item.estado === 'APROBADO';
            const galeria = item.tbl_tiendas?.tbl_galerias;
            const galeriaCity = [galeria?.nombre, galeria?.tbl_ciudades?.nombre].filter(Boolean).join(' - ');
            const subActiva = item.tbl_tiendas?.suscripcion_activa;
            return (
              <div key={item.id} className="card animate-slide-up cursor-pointer !p-3" onClick={() => setSelectedItem(item)}>
                {item.estado === 'RECHAZADO' && (
                  <label className="flex items-center gap-2 mb-3 cursor-pointer" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-xs text-gray-500">Seleccionar para eliminar</span>
                  </label>
                )}
                {/* Nombre tienda + badges */}
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400">Tienda:</p>
                    <h3 className="text-sm font-bold text-gray-900 truncate">{item.tbl_tiendas?.nombre || 'Sin tienda'}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.bg}`}>{badge.label}</span>
                    {(item.tipo_plan_solicitado || item.plan?.tipo) && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${(item.tipo_plan_solicitado || item.plan?.tipo) === 'PREMIUM' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {(item.tipo_plan_solicitado || item.plan?.tipo) === 'PREMIUM' ? 'Premium' : 'Estándar'}
                      </span>
                    )}
                  </div>
                </div>
                {/* Galería - Ciudad */}
                <p className="text-[10px] text-gray-400 mt-1">Galería:</p>
                <p className="text-xs text-gray-500">{galeriaCity || '-'}</p>
                {/* Vendedor */}
                <p className="text-xs text-gray-500 mt-1">Vendedor: {item.tbl_usuarios?.nombre || '-'}</p>

                {/* Monto - banner verde */}
                <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                  <p className="text-xs"><span className="font-medium text-gray-600">Monto:</span> <span className="font-bold text-green-600">{formatCurrency(item.plan?.precio)}</span></p>
                </div>

                {/* Campos fecha */}
                <div className="mt-2 space-y-0.5">
                  <div className="flex">
                    <span className="text-[11px] font-medium text-gray-500 w-28 flex-shrink-0">Fecha solicitud:</span>
                    <span className="text-[11px] text-gray-800">{formatDate(item.solicitado_en)}</span>
                  </div>
                  {isApproved && item.decidido_en && (
                    <div className="flex">
                      <span className="text-[11px] font-medium text-gray-500 w-28 flex-shrink-0">Fecha aprobación:</span>
                      <span className="text-[11px] text-gray-800">{formatDate(item.decidido_en)}</span>
                    </div>
                  )}
                  {isApproved && subActiva?.fin_en && (() => {
                    const days = getDaysRemaining(item);
                    const itemExpired = days !== null && days <= 0;
                    const itemExpiring = days !== null && days > 0 && days <= expiringDaysThreshold;
                    return (
                      <div className="flex">
                        <span className="text-[11px] font-medium text-gray-500 w-28 flex-shrink-0">Expira:</span>
                        <span className={`text-[11px] font-bold ${itemExpired ? 'text-red-600' : itemExpiring ? 'text-orange-600' : 'text-gray-800'}`}>
                          {formatDate(subActiva.fin_en)}
                          {days !== null && (
                            <span className="ml-1">({itemExpired ? 'Vencido' : `${days} días`})</span>
                          )}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Alerta de vencimiento */}
                {isApproved && (() => {
                  const days = getDaysRemaining(item);
                  const itemExpired = days !== null && days <= 0;
                  const itemExpiring = days !== null && days > 0 && days <= expiringDaysThreshold;
                  if (!itemExpired && !itemExpiring) return null;
                  return (
                    <div className={`mt-2 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 ${itemExpired ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-orange-50 text-orange-600 border border-orange-200'}`}>
                      <HiOutlineClock className="w-3.5 h-3.5 flex-shrink-0" />
                      {itemExpired ? 'Suscripción vencida' : `Vence en ${days} días`}
                    </div>
                  );
                })()}

                {isPending && (
                  <div className="flex gap-2 mt-2.5" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleReject(item.id)} className="flex-1 py-2 rounded-xl text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-all flex items-center justify-center gap-1">
                      <HiOutlineX className="w-3.5 h-3.5" /> Rechazar
                    </button>
                    <button onClick={() => handleApprove(item.id)} className="flex-1 btn-primary text-xs py-2 flex items-center justify-center gap-1">
                      <HiOutlineCheck className="w-3.5 h-3.5" /> Aprobar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Modal open={!!selectedItem} onClose={() => setSelectedItem(null)} title="Detalle de Suscripción" maxWidth="max-w-md">
        {selectedItem && (() => {
          const isPending = selectedItem.estado === 'PENDIENTE';
          const comprobante = getComprobante(selectedItem);
          const comprobanteKind = detectFileKind(comprobante);
          const comprobanteUrl = comprobante ? resolveFileUrl(comprobante.url_archivo) : null;
          const galeria = selectedItem.tbl_tiendas?.tbl_galerias;
          return (
            <div className="space-y-4">
              {/* Tipo de Suscripción */}
              {(selectedItem.tipo_plan_solicitado || selectedItem.plan?.tipo) && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${(selectedItem.tipo_plan_solicitado || selectedItem.plan?.tipo) === 'PREMIUM' ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}>
                  <span className="text-sm font-medium text-gray-500">Tipo de Suscripción:</span>
                  <span className={`text-sm font-bold ${(selectedItem.tipo_plan_solicitado || selectedItem.plan?.tipo) === 'PREMIUM' ? 'text-amber-700' : 'text-blue-700'}`}>
                    {(selectedItem.tipo_plan_solicitado || selectedItem.plan?.tipo) === 'PREMIUM' ? 'Premium' : 'Estándar'}
                  </span>
                </div>
              )}

              {/* Información de la Tienda */}
              <div>
                <p className="text-sm font-bold text-gray-800 mb-3">Información de la Tienda</p>
                <p className="text-sm"><span className="font-medium text-gray-500">Tienda:</span> {selectedItem.tbl_tiendas?.nombre || '-'}</p>
                <p className="text-sm"><span className="font-medium text-gray-500">Galería:</span> {galeria?.nombre || '-'}</p>
                <p className="text-sm"><span className="font-medium text-gray-500">Ciudad:</span> {galeria?.tbl_ciudades?.nombre || '-'}</p>
                <p className="text-sm"><span className="font-medium text-gray-500">Vendedor:</span> {selectedItem.tbl_usuarios?.nombre || '-'}</p>
                <p className="text-sm"><span className="font-medium text-gray-500">Monto:</span> {formatCurrency(selectedItem.plan?.precio)}</p>
                <p className="text-sm"><span className="font-medium text-gray-500">Fecha de solicitud:</span> {formatDateTime(selectedItem.solicitado_en)}</p>
              </div>

              {/* Comprobante de Pago */}
              {comprobante && (
                <div>
                  <p className="text-sm font-bold text-gray-800 mb-3">Comprobante de Pago</p>
                  {comprobanteKind === 'image' ? (
                    <div className="space-y-2">
                      <img
                        src={comprobanteUrl}
                        alt="Comprobante"
                        className="w-full rounded-xl border border-gray-200 cursor-pointer"
                        onClick={() => openPreview(comprobante)}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <button
                        onClick={() => downloadFile(comprobante)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-gray-700 border border-gray-200 bg-surface hover:bg-gray-50 transition-colors"
                      >
                        <HiOutlineDownload className="w-4 h-4" /> Descargar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={() => openPreview(comprobante)}
                        className="flex flex-col items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl border border-gray-200 w-full cursor-pointer"
                      >
                        <HiOutlineDocument className="w-10 h-10 text-red-500 mb-1" />
                        <span className="text-sm text-primary-600 font-medium">
                          {comprobanteKind === 'pdf' ? 'Ver PDF del comprobante' : 'Abrir archivo'}
                        </span>
                      </button>
                      <button
                        onClick={() => downloadFile(comprobante)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-gray-700 border border-gray-200 bg-surface hover:bg-gray-50 transition-colors"
                      >
                        <HiOutlineDownload className="w-4 h-4" /> Descargar
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Documentos Adicionales */}
              {getArchivosAdicionales(selectedItem).length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-800 mb-3">Documentos Adicionales ({getArchivosAdicionales(selectedItem).length})</p>
                  <div className="grid grid-cols-2 gap-2">
                    {getArchivosAdicionales(selectedItem).map((archivo) => {
                      const archivoKind = detectFileKind(archivo);
                      const archivoUrl = resolveFileUrl(archivo.url_archivo);
                      return (
                        <div key={archivo.id} className="border border-gray-200 rounded-xl overflow-hidden flex flex-col">
                          {archivoKind === 'image' ? (
                            <img
                              src={archivoUrl}
                              alt="Documento adicional"
                              className="w-full h-32 object-cover cursor-pointer"
                              onClick={() => openPreview(archivo)}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <button onClick={() => openPreview(archivo)} className="flex flex-col items-center p-4 hover:bg-gray-50 transition-colors w-full">
                              <HiOutlineDocument className="w-8 h-8 text-red-500 mb-1" />
                              <span className="text-xs text-primary-600 font-medium">
                                {archivoKind === 'pdf' ? 'Ver PDF' : 'Abrir'}
                              </span>
                            </button>
                          )}
                          <button
                            onClick={() => downloadFile(archivo)}
                            className="flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold text-gray-600 border-t border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <HiOutlineDownload className="w-3.5 h-3.5" /> Descargar
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Suscripción activa - Editar fecha */}
              {selectedItem.estado === 'APROBADO' && selectedItem.tbl_tiendas?.suscripcion_activa && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-sm font-bold text-gray-800 mb-2">Suscripción Activa</p>
                  <div className="space-y-1">
                    <p className="text-sm"><span className="font-medium text-gray-500">Estado:</span> <span className={`font-semibold ${selectedItem.tbl_tiendas.suscripcion_activa.estado === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}`}>{selectedItem.tbl_tiendas.suscripcion_activa.estado === 'ACTIVE' ? 'Activa' : 'Expirada'}</span></p>
                    <p className="text-sm"><span className="font-medium text-gray-500">Expira:</span> <span className="font-semibold text-orange-600">{formatDateTime(selectedItem.tbl_tiendas.suscripcion_activa.fin_en)}</span></p>
                  </div>
                  <button
                    onClick={() => {
                      const sub = selectedItem.tbl_tiendas.suscripcion_activa;
                      setNewEndDate(new Date(sub.fin_en).toLocaleDateString('en-CA', { timeZone: 'America/Lima' }));
                      setShowDateModal(sub.id);
                      setSelectedItem(null);
                    }}
                    className="mt-3 w-full py-2 rounded-xl text-sm font-semibold text-blue-600 border border-blue-300 bg-surface hover:bg-blue-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    <HiOutlineCalendar className="w-4 h-4" /> Editar Fecha de Vencimiento
                  </button>
                </div>
              )}

              {/* Rechazar / Aprobar */}
              {isPending && (
                <div className="flex gap-2 pt-2">
                  <button onClick={() => handleReject(selectedItem.id)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-all flex items-center justify-center gap-1">
                    <HiOutlineX className="w-4 h-4" /> Rechazar
                  </button>
                  <button onClick={() => handleApprove(selectedItem.id)} className="flex-1 btn-primary text-sm flex items-center justify-center gap-1">
                    <HiOutlineCheck className="w-4 h-4" /> Aprobar
                  </button>
                </div>
              )}

              {/* Cerrar */}
              <button onClick={() => setSelectedItem(null)} className="btn-secondary w-full text-sm">Cerrar</button>
            </div>
          );
        })()}
      </Modal>

      {/* Edit Date Modal */}
      <Modal open={!!showDateModal} onClose={() => setShowDateModal(null)} title="Editar Fecha de Vencimiento" maxWidth="max-w-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva fecha de vencimiento</label>
            <input
              type="date"
              value={newEndDate}
              onChange={(e) => setNewEndDate(e.target.value)}
              className="input-field text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowDateModal(null)} className="btn-secondary flex-1 text-sm">Cancelar</button>
            <button onClick={handleUpdateDate} className="btn-primary flex-1 text-sm">Guardar</button>
          </div>
        </div>
      </Modal>

      {/* Modal de previsualización de documentos */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3"
          onClick={() => setPreviewDoc(null)}
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-surface rounded-2xl shadow-elevated w-full max-w-lg flex flex-col z-10"
            style={{ maxHeight: '92vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-base font-semibold text-gray-900 font-display">
                {previewDoc.type === 'pdf' ? 'Vista previa del PDF' : 'Vista previa de la imagen'}
              </h3>
              <button onClick={() => setPreviewDoc(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <HiOutlineX className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 min-h-0 p-2" style={{ height: previewDoc.type === 'pdf' ? '70vh' : 'auto' }}>
              {previewDoc.type === 'pdf' ? (
                <iframe
                  src={previewDoc.url}
                  className="w-full h-full border-0 rounded-lg"
                  title="Vista previa del documento"
                />
              ) : (
                <div className="flex items-center justify-center">
                  <img
                    src={previewDoc.url}
                    alt="Vista previa"
                    className="max-w-full max-h-[75vh] object-contain rounded-lg"
                  />
                </div>
              )}
            </div>
            {/* Acciones: abrir externo / descargar — útiles si el iframe no renderiza */}
            <div className="flex items-center justify-end gap-2 p-3 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => openExternal(previewDoc.url)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 border border-gray-200 bg-surface hover:bg-gray-50 transition-colors"
              >
                <HiOutlineExternalLink className="w-4 h-4" /> Abrir externo
              </button>
              <button
                onClick={() => openExternal(buildDownloadUrl(previewDoc.url))}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                <HiOutlineDownload className="w-4 h-4" /> Descargar
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Eliminar solicitudes rechazadas" maxWidth="max-w-sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Se eliminarán <strong>{selectedIds.size}</strong> solicitud(es) de suscripción rechazada(s). Los datos de transacciones y finanzas no se verán afectados.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setShowDeleteConfirm(false)} disabled={deleteLoading} className="btn-secondary flex-1 text-sm">Cancelar</button>
            <button onClick={handleBulkDelete} disabled={deleteLoading} className="btn-danger flex-1 text-sm">{deleteLoading ? 'Eliminando...' : 'Eliminar'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
