import { useState, useEffect, useRef, useCallback } from 'react';
import { sellerService } from '../../services/sellerService';
import { catalogService } from '../../services/catalogService';
import { useSSEListener } from '../../hooks/useSSEListener';
import { formatCurrency, formatDate } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { fileToBlob } from '../../utils/fileUtils';
import {
  HiOutlineOfficeBuilding,
  HiOutlineShieldExclamation,
  HiOutlineCheckCircle,
  HiOutlineStar,
  HiOutlineCheck,
  HiOutlineUpload,
  HiOutlinePlus,
  HiOutlinePhotograph,
  HiOutlineDocumentText,
  HiOutlineCamera,
  HiOutlineX,
  HiOutlineExclamation,
  HiOutlineSparkles,
} from 'react-icons/hi';


export default function SubscriptionsPage() {
  const [stores, setStores] = useState([]);
  const [plans, setPlans] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  const loadData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const [subRes, storeRes, planRes, payRes] = await Promise.all([
        sellerService.getMySubscriptions(),
        sellerService.getMyStores(),
        catalogService.getPlans(),
        catalogService.getPaymentMethods(),
      ]);
      setSubscriptions(subRes.data?.data || []);
      const approvedStores = (storeRes.data?.data || []).filter((s) => s.estado_aprobacion === 'APROBADO');
      setStores(approvedStores);
      setPlans(planRes.data?.data || []);
      setPaymentMethods(payRes.data?.data || []);
      if (approvedStores.length > 0) {
        setSelectedStore(prev =>
          prev && approvedStores.some(s => s.id.toString() === prev) ? prev : approvedStores[0].id.toString()
        );
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const [showApprovedModal, setShowApprovedModal] = useState(false);

  useEffect(() => {
    loadData();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadData(false);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const handleSSEUpdate = useCallback((data) => {
    if (data?.status === 'APROBADO') {
      setShowApprovedModal(true);
    }
    loadData(false);
  }, []);

  useSSEListener(['subscription.request.updated', 'subscription.active.updated', 'subscription.expiring'], handleSSEUpdate);

  const currentStore = stores.find((s) => s.id.toString() === selectedStore);
  const subRecord = currentStore?.suscripcion_activa;
  const hasActiveSub = subRecord?.estado === 'ACTIVE' ? subRecord : null;
  const hasPendingSub = subscriptions.find(
    (s) => s.id_tienda === currentStore?.id && s.estado === 'PENDIENTE'
  );

  const handleSubscribe = (plan) => {
    if (!selectedStore) {
      toast.error('Selecciona una tienda primero');
      return;
    }
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in pb-8">
      {/* Store selector header */}
      <div className="card rounded-2xl shadow-card mb-6">
        <div className="flex items-center gap-3 mb-2">
          <HiOutlineOfficeBuilding className="w-6 h-6 text-primary-600" />
          <h2 className="text-lg font-display font-bold text-primary-700">Suscripción por Tienda</h2>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Cada tienda requiere su propia suscripción para que sus productos sean visibles
        </p>
        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="input-field rounded-xl text-sm w-full"
        >
          {stores.length === 0 && <option value="">No tienes tiendas aprobadas</option>}
          {stores.map((s) => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>
      </div>

      {/* Subscription status banner */}
      {currentStore && (
        hasActiveSub ? (
          <div className="bg-seller-500 rounded-2xl p-6 mb-6 text-center shadow-card">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <HiOutlineCheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-1">Suscripción Activa</h3>
            <p className="text-seller-100 text-sm">{currentStore.nombre} aparece en las búsquedas</p>
            {hasActiveSub.fin_en && (
              <p className="text-seller-200 text-xs mt-2">
                Vigencia hasta: {formatDate(hasActiveSub.fin_en)}
              </p>
            )}
          </div>
        ) : hasPendingSub ? (
          <div className="bg-warning-500 rounded-2xl p-6 mb-6 text-center shadow-card">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <HiOutlineExclamation className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-1">Solicitud Pendiente</h3>
            <p className="text-warning-100 text-sm">Tu solicitud está siendo evaluada</p>
            <p className="text-warning-200 text-xs mt-2">
              Enviada el {formatDate(hasPendingSub.solicitado_en)}
            </p>
          </div>
        ) : (
          <div className="bg-red-500 rounded-2xl p-6 mb-6 text-center shadow-card">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <HiOutlineShieldExclamation className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-1">Sin Suscripción</h3>
            <p className="text-red-100 text-sm">{currentStore.nombre} NO aparece en las búsquedas</p>
          </div>
        )
      )}

      {/* Plan selection — only when no active sub and no pending request */}
      {!hasActiveSub && !hasPendingSub && (
        <>
          <h2 className="text-xl font-display font-bold text-gray-900 text-center mb-5">Elige tu plan</h2>

          <div className="space-y-4 mb-6">
            {plans.map((plan) => {
              const isStandard = plan.tipo === 'ESTANDAR';
              const isPremium = !isStandard;
              const features = Array.isArray(plan.caracteristicas)
    ? plan.caracteristicas.map((c) => c.texto)
    : [];

              return (
                <div
                  key={plan.id}
                  onClick={() => handleSubscribe(plan)}
                  className={`card rounded-2xl shadow-card relative overflow-hidden cursor-pointer transition-all hover:shadow-card-hover ${
                    isPremium ? 'border-2 border-warning-400' : 'border-2 border-primary-200'
                  }`}
                >
                  {isPremium && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-warning-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        Recomendado
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-3">
                    {isStandard ? (
                      <HiOutlineOfficeBuilding className="w-6 h-6 text-primary-500" />
                    ) : (
                      <HiOutlineStar className="w-6 h-6 text-warning-500" />
                    )}
                    <h3 className="text-lg font-display font-bold text-gray-900">
                      {plan.nombre || (isStandard ? 'Plan Estándar' : 'Plan Premium')}
                    </h3>
                    {isStandard && (
                      <HiOutlineCheckCircle className="w-6 h-6 text-primary-600 ml-auto" />
                    )}
                  </div>

                  <p className="mb-4">
                    <span className="text-warning-500 text-4xl font-display font-bold">
                      s/{Math.round(parseFloat(plan.precio))}
                    </span>
                    <span className="text-gray-400 text-sm ml-1">/{plan.duracion_dias} dias</span>
                  </p>

                  <div className="space-y-2">
                    {features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <HiOutlineCheck className="w-4 h-4 mt-0.5 shrink-0 text-primary-500" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subscribe button */}
          <button
            onClick={() => {
              if (plans.length > 0) handleSubscribe(plans[plans.length - 1]);
            }}
            className="btn-primary w-full rounded-xl text-sm flex items-center justify-center gap-2 mb-4"
          >
            <HiOutlineStar className="w-4 h-4" />
            Suscribirse Ahora
          </button>

          {/* Warning */}
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
            <HiOutlineExclamation className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs text-red-600 font-medium">
              Sin suscripción, los clientes no podrán encontrar tu tienda
            </p>
          </div>
        </>
      )}

      {/* Existing subscriptions history */}
      {subscriptions.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
            Historial de Suscripciones
          </h3>
          <div className="space-y-3">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="card rounded-2xl shadow-card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{sub.tbl_tiendas?.nombre || '-'}</p>
                    <p className="text-xs text-gray-400">#{sub.id}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    sub.estado === 'APROBADO' ? 'bg-green-100 text-green-700' :
                    sub.estado === 'PENDIENTE' ? 'bg-warning-100 text-warning-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {sub.estado}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Plan: {sub.plan?.nombre || sub.plan?.tipo || sub.tipo_plan_solicitado}</span>
                  <span>{formatCurrency(sub.plan?.precio)}</span>
                  <span>{formatDate(sub.solicitado_en)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved Congratulation Modal */}
      {showApprovedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowApprovedModal(false)} />
          <div className="relative bg-surface rounded-2xl shadow-elevated w-full max-w-sm z-10 animate-slide-up overflow-hidden">
            <div className="bg-gradient-to-br from-seller-500 to-primary-600 px-6 pt-8 pb-6 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <HiOutlineSparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-display font-bold text-white mb-2">¡Felicidades!</h3>
              <p className="text-white/90 text-sm">Tu suscripción ha sido aprobada</p>
            </div>
            <div className="px-6 py-5 text-center">
              <p className="text-gray-600 text-sm mb-1">
                Tu tienda ahora es visible para los compradores.
              </p>
              <p className="text-gray-400 text-xs mb-5">
                Los clientes ya pueden encontrar tus productos en las búsquedas.
              </p>
              <button
                onClick={() => setShowApprovedModal(false)}
                className="w-full py-3 bg-seller-500 text-white rounded-xl text-sm font-bold hover:bg-seller-600 transition-colors"
              >
                ¡Entendido!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        open={showPayment}
        plan={selectedPlan}
        storeId={selectedStore}
        paymentMethods={paymentMethods}
        onClose={() => setShowPayment(false)}
        onSuccess={() => {
          setShowPayment(false);
          loadData();
        }}
      />
    </div>
  );
}

/* ── Payment Modal ── */
function PaymentModal({ open, plan, storeId, paymentMethods, onClose, onSuccess }) {
  const fileInputRef = useRef(null);
  const additionalInputRef = useRef(null);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedMethod(paymentMethods.length > 0 ? paymentMethods[0].id.toString() : '');
      setReceipt(null);
      setAdditionalImages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedMethod) {
      toast.error('Selecciona un método de pago');
      return;
    }
    if (!receipt) {
      toast.error('Sube el comprobante de pago');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('id_tienda', storeId);
      fd.append('id_plan', plan.id.toString());
      fd.append('id_metodo_pago', selectedMethod);
      fd.append('comprobante', receipt.blob, receipt.name);
      additionalImages.forEach((img) => fd.append('imagenes_adicionales', img.blob, img.name));

      await sellerService.requestSubscription(fd);
      toast.success('Solicitud de suscripción enviada');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al enviar solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  if (!plan) return null;

  const currentMethod = paymentMethods.find((m) => m.id.toString() === selectedMethod);

  return (
    <Modal open={open} onClose={onClose} title="" maxWidth="max-w-md">
      <div className="-m-4 -mt-[4.5rem]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center relative">
          <div className="w-14 h-14 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <HiOutlineStar className="w-8 h-8 text-warning-500" />
          </div>
          <h3 className="text-xl font-display font-bold text-gray-900">Confirmar Pago</h3>
          <p className="text-sm text-gray-400 mt-1">
            {plan.nombre || (plan.tipo === 'ESTANDAR' ? 'Plan Estándar' : 'Plan Premium')}
          </p>
        </div>

        {/* Total */}
        <div className="mx-6 bg-primary-50 rounded-xl p-4 text-center mb-6">
          <p className="text-xs text-primary-600 font-medium">Total a pagar</p>
          <p className="text-3xl font-display font-bold text-gray-900">S/{Math.round(parseFloat(plan.precio))}</p>
        </div>

        <div className="px-6 pb-6">
          {/* Step 1: Payment method */}
          <p className="text-sm font-bold text-gray-800 mb-3">1. Selecciona método de pago</p>
          <div className="space-y-2 mb-6">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setSelectedMethod(method.id.toString())}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                  selectedMethod === method.id.toString()
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedMethod === method.id.toString()
                      ? 'border-primary-600'
                      : 'border-gray-300'
                  }`}>
                    {selectedMethod === method.id.toString() && (
                      <div className="w-2.5 h-2.5 bg-primary-600 rounded-full" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      {method.tipo === 'BANCO' ? `${method.tipo} - ${method.nombre_banco}` : method.tipo}
                    </p>
                    {method.tipo === 'BANCO' ? (
                      <>
                        {method.numero_cuenta && (
                          <p className="text-xs text-primary-600 font-medium">Cta: {method.numero_cuenta}</p>
                        )}
                        {method.cci && (
                          <p className="text-xs text-gray-500">CCI: {method.cci}</p>
                        )}
                      </>
                    ) : (
                      method.numero_celular && (
                        <p className="text-sm text-primary-600 font-medium">{method.numero_celular}</p>
                      )
                    )}
                    {method.titular && (
                      <p className="text-xs text-gray-400">{method.titular}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Step 2: Receipt upload */}
          <p className="text-sm font-bold text-gray-800 mb-3">2. Sube el comprobante de pago</p>
          <div
            onClick={() => setShowUploadOptions(true)}
            className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center cursor-pointer hover:border-primary-300 transition-colors mb-6"
          >
            {receipt ? (
              <div className="space-y-1">
                {receipt.blob?.type?.startsWith('image/') ? (
                  <img src={receipt.preview} alt="Comprobante" className="w-full max-h-48 object-contain rounded-xl mx-auto" />
                ) : (
                  <HiOutlineCheckCircle className="w-8 h-8 text-primary-500 mx-auto" />
                )}
                <p className="text-sm text-primary-600 font-medium">{receipt.name}</p>
                <p className="text-xs text-gray-400">Toca para cambiar</p>
              </div>
            ) : (
              <div className="space-y-1">
                <HiOutlineUpload className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-sm font-medium text-primary-600">Subir imagen o PDF</p>
                <p className="text-xs text-gray-400">Toca para seleccionar</p>
              </div>
            )}
          </div>

          {/* Step 3: Additional images */}
          <p className="text-sm font-bold text-gray-800 mb-2">3. Imágenes adicionales (opcional)</p>
          <p className="text-xs text-gray-400 mb-3">
            Puedes agregar hasta 3 imágenes adicionales del voucher o capturas de transferencia
          </p>
          <div className="flex gap-2 flex-wrap mb-6">
            {additionalImages.map((img, i) => (
              <div key={i} className="relative">
                <img src={img.preview} alt="" className="w-16 h-16 object-cover rounded-xl border border-gray-200" />
                <button
                  type="button"
                  onClick={() => setAdditionalImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <HiOutlineX className="w-3 h-3" />
                </button>
              </div>
            ))}
            {additionalImages.length < 3 && (
              <button
                type="button"
                onClick={() => additionalInputRef.current?.click()}
                className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-primary-300 transition-colors"
              >
                <HiOutlinePlus className="w-5 h-5 text-gray-400" />
                <span className="text-[10px] text-gray-400">Agregar</span>
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !receipt || !selectedMethod}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400"
            >
              <HiOutlineCheck className="w-4 h-4" />
              {submitting ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </div>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={async (e) => {
            if (e.target.files[0]) {
              const converted = await fileToBlob(e.target.files[0]);
              e.target.value = '';
              setReceipt(converted);
              setShowUploadOptions(false);
            }
          }}
          className="hidden"
        />
        <input
          ref={additionalInputRef}
          type="file"
          accept="image/*"
          onChange={async (e) => {
            if (e.target.files[0]) {
              const converted = await fileToBlob(e.target.files[0]);
              e.target.value = '';
              setAdditionalImages((prev) => [...prev, converted].slice(0, 3));
            }
          }}
          className="hidden"
        />
      </div>

      {/* Upload options sub-modal */}
      {showUploadOptions && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowUploadOptions(false)} />
          <div className="relative bg-surface rounded-2xl shadow-elevated w-full max-w-sm z-10 p-6 animate-slide-up">
            <div className="text-center mb-5">
              <HiOutlineUpload className="w-10 h-10 text-primary-600 mx-auto mb-2" />
              <h3 className="text-lg font-display font-bold text-gray-900">Subir Comprobante</h3>
              <p className="text-sm text-gray-500 mt-1">Selecciona cómo quieres agregar el comprobante</p>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button
                onClick={() => {
                  fileInputRef.current.accept = 'image/*';
                  fileInputRef.current.capture = 'environment';
                  fileInputRef.current.click();
                }}
                className="bg-gray-50 rounded-xl p-4 text-center hover:bg-gray-100 transition-colors"
              >
                <HiOutlineCamera className="w-8 h-8 text-primary-600 mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-700">Tomar Foto</p>
              </button>
              <button
                onClick={() => {
                  fileInputRef.current.accept = 'image/*';
                  fileInputRef.current.removeAttribute('capture');
                  fileInputRef.current.click();
                }}
                className="bg-gray-50 rounded-xl p-4 text-center hover:bg-gray-100 transition-colors"
              >
                <HiOutlinePhotograph className="w-8 h-8 text-primary-600 mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-700">Galería</p>
              </button>
              <button
                onClick={() => {
                  fileInputRef.current.accept = '.pdf';
                  fileInputRef.current.removeAttribute('capture');
                  fileInputRef.current.click();
                }}
                className="bg-gray-50 rounded-xl p-4 text-center hover:bg-gray-100 transition-colors"
              >
                <HiOutlineDocumentText className="w-8 h-8 text-red-500 mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-700">Archivo PDF</p>
              </button>
            </div>
            <button
              onClick={() => setShowUploadOptions(false)}
              className="w-full py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
