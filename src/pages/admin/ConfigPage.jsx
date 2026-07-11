import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ExportButton from '../../components/ui/ExportButton';
import toast from 'react-hot-toast';
import { HiOutlineCog, HiOutlineSearch, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineDocumentText, HiOutlineShieldCheck, HiOutlineSave, HiOutlineMail, HiOutlineOfficeBuilding, HiOutlineUser, HiOutlineLocationMarker, HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineCreditCard, HiOutlineQuestionMarkCircle, HiOutlineTag, HiOutlineEye, HiOutlineEyeOff, HiOutlineLockClosed, HiOutlinePencilAlt } from 'react-icons/hi';
import { formatDateTime } from '../../utils/formatters';

const GalleryForm = lazy(() => import('../../components/admin/GalleryForm'));
const PlanFormDialog = lazy(() => import('../../components/admin/PlanFormDialog'));

const sections = [
  { key: 'cities', label: 'Ciudades', fields: [{ name: 'nombre', label: 'Nombre', required: true }] },
  { key: 'zones', label: 'Zonas', fields: [
    { name: 'nombre', label: 'Nombre', required: true },
    { name: 'id_ciudad', label: 'Ciudad', type: 'number', required: true, select: 'cities' },
  ]},
  { key: 'categories', label: 'Categorias', searchable: true, fields: [
    { name: 'nombre', label: 'Nombre', required: true },
    { name: 'descripcion', label: 'Descripcion' },
  ]},
  { key: 'galleries', label: 'Galerias', searchable: true, fields: [
    { name: 'nombre', label: 'Nombre', required: true },
    { name: 'direccion', label: 'Direccion' },
    { name: 'id_zona', label: 'Zona', type: 'number', required: true, select: 'zones' },
  ]},
  { key: 'faqs-compradores', label: 'FAQs Compradores', fields: [
    { name: 'pregunta', label: 'Pregunta', required: true },
    { name: 'respuesta', label: 'Respuesta', required: true, textarea: true },
  ], filter: (items) => items.filter(i => i.audiencia === 'BUYER' || i.audiencia === 'ALL'), defaultValues: { audiencia: 'BUYER' } },
  { key: 'faqs-vendedores', label: 'FAQs Vendedores', fields: [
    { name: 'pregunta', label: 'Pregunta', required: true },
    { name: 'respuesta', label: 'Respuesta', required: true, textarea: true },
  ], filter: (items) => items.filter(i => i.audiencia === 'SELLER' || i.audiencia === 'ALL'), defaultValues: { audiencia: 'SELLER' } },
  { key: 'payment-methods', label: 'Metodos de Pago', customForm: true, fields: [] },
  { key: 'terms-privacy', label: 'Terminos y Condiciones', customInline: true, fields: [] },
  { key: 'email-templates', label: 'Plantillas Email', fields: [] },
  { key: 'plans', label: 'Planes de Suscripcion', noCreate: true, noDelete: true, fields: [
    { name: 'tipo', label: 'Tipo', readOnly: true, displayFormat: (v) => v === 'ESTANDAR' ? 'Plan Estándar' : v === 'PREMIUM' ? 'Plan Premium' : v },
    { name: 'nombre', label: 'Nombre visible', required: true },
    { name: 'precio', label: 'Precio (S/)', type: 'number', required: true, decimal: true },
    { name: 'duracion_dias', label: 'Duracion (dias)', type: 'number', required: true },
  ]},
  { key: 'system-config', label: 'Config. Sistema', noCreate: true, noDelete: true, fields: [
    { name: 'clave', label: 'Parametro', readOnly: true, displayFormat: (v) => {
      const labels = {
        dias_alerta_vencimiento_suscripcion: 'Dias alerta vencimiento suscripcion (email)',
        dias_filtro_por_vencer_suscripcion: 'Dias filtro "por vencer" suscripciones',
        android_min_version_code: '[App Android] versionCode minimo (bloquea si la app instalada es menor)',
        android_latest_version_code: '[App Android] versionCode mas reciente disponible',
        android_latest_version_name: '[App Android] versionName mas reciente (ej: 1.1, 1.2, 2.0)',
        android_force_update_enabled: '[App Android] Activar actualizacion forzada (true / false)',
        android_play_store_url: '[App Android] URL en Play Store',
        android_update_title: '[App Android] Titulo del modal de actualizacion',
        android_update_message: '[App Android] Mensaje del modal de actualizacion',
      };
      return labels[v] || v;
    }},
    { name: 'valor', label: 'Valor', required: true },
    { name: 'descripcion', label: 'Descripcion', readOnly: true },
  ]},
];

// Secciones de configuracion que ofrecen exportacion Excel / PDF.
const exportMap = {
  galleries: { fn: (format) => adminService.exportGalleries(format), baseName: 'galerias' },
  zones: { fn: (format) => adminService.exportZones(format), baseName: 'zonas' },
  categories: { fn: (format) => adminService.exportCategories(format), baseName: 'categorias' },
};

const serviceMap = {
  cities: { get: adminService.getCities, create: adminService.createCity, update: adminService.updateCity, del: adminService.deleteCity },
  zones: { get: adminService.getZones, create: adminService.createZone, update: adminService.updateZone, del: adminService.deleteZone },
  categories: { get: adminService.getCategories, create: adminService.createCategory, update: adminService.updateCategory, del: adminService.deleteCategory },
  galleries: { get: adminService.getGalleries, create: adminService.createGallery, update: adminService.updateGallery, del: adminService.deleteGallery },
  'faqs-compradores': { get: adminService.getFaqs, create: adminService.createFaq, update: adminService.updateFaq, del: adminService.deleteFaq },
  'faqs-vendedores': { get: adminService.getFaqs, create: adminService.createFaq, update: adminService.updateFaq, del: adminService.deleteFaq },
  'payment-methods': { get: adminService.getPaymentMethods, create: adminService.createPaymentMethod, update: adminService.updatePaymentMethod, del: adminService.deletePaymentMethod },
  'terms-privacy': { get: async () => ({ data: [] }) },
  'email-templates': { get: async () => ({ data: [] }) },
  'plans': { get: adminService.getPlans, update: adminService.updatePlan },
  'system-config': { get: adminService.getSystemConfig, update: adminService.updateSystemConfig },
};

const sectionIcons = {
  cities: HiOutlineLocationMarker,
  zones: HiOutlineLocationMarker,
  categories: HiOutlineTag,
  galleries: HiOutlineOfficeBuilding,
  'faqs-compradores': HiOutlineQuestionMarkCircle,
  'faqs-vendedores': HiOutlineQuestionMarkCircle,
  'payment-methods': HiOutlineCreditCard,
  'terms-privacy': HiOutlineDocumentText,
  'email-templates': HiOutlineMail,
  plans: HiOutlineCreditCard,
  'system-config': HiOutlineCog,
};

const sectionDisplayLabels = {
  cities: 'Gestion de Ciudades',
  zones: 'Gestion de Zonas',
  categories: 'Gestion de Categorias',
  galleries: 'Gestion de Galerias',
  'faqs-compradores': 'FAQs Compradores',
  'faqs-vendedores': 'FAQs Vendedores',
  'payment-methods': 'Metodos de Pago',
  'terms-privacy': 'Terminos y Condiciones',
  'email-templates': 'Plantillas de Email',
  plans: 'Planes de Suscripcion',
  'system-config': 'Config. Sistema',
};

export default function ConfigPage() {
  const [activeSection, setActiveSection] = useState('cities');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [selectOptions, setSelectOptions] = useState({});
  const [search, setSearch] = useState('');

  const section = sections.find((s) => s.key === activeSection);
  const svc = serviceMap[activeSection];

  // Para secciones con buscador (galerias, categorias): filtra por nombre y
  // ordena alfabeticamente. El resto de secciones se muestran sin alterar.
  const displayItems = section?.searchable
    ? [...items]
        .filter((i) => {
          const q = search.trim().toLowerCase();
          return !q || (i.nombre || '').toLowerCase().includes(q);
        })
        .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' }))
    : items;

  useEffect(() => {
    if (activeSection) loadItems();
  }, [activeSection]);

  useEffect(() => {
    if (!activeSection || !section) return;
    const selectFields = section.fields.filter((f) => f.select);
    if (selectFields.length === 0) return;
    const loaders = {
      cities: () => adminService.getCities().then((r) => r.data),
      zones: () => adminService.getZones().then((r) => r.data),
    };
    selectFields.forEach(async (f) => {
      if (loaders[f.select]) {
        const data = await loaders[f.select]();
        setSelectOptions((prev) => ({ ...prev, [f.select]: data }));
      }
    });
  }, [activeSection]);

  const loadItems = async () => {
    if (!svc) return;
    setLoading(true);
    setItems([]);
    try {
      const { data } = await svc.get();
      setItems(section.filter ? section.filter(data) : data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    const initial = {};
    section.fields.forEach((f) => (initial[f.name] = ''));
    setForm(initial);
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (item) => {
    const initial = {};
    section.fields.forEach((f) => (initial[f.name] = item[f.name]?.toString() || ''));
    setForm(initial);
    setEditItem(item);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, ...(section.defaultValues || {}) };
      section.fields.forEach((f) => {
        if (f.readOnly) { delete payload[f.name]; return; }
        if (f.type === 'number' && payload[f.name]) {
          payload[f.name] = f.decimal ? parseFloat(payload[f.name]) : parseInt(payload[f.name]);
        }
      });

      if (editItem) {
        await svc.update(editItem.id, payload);
        toast.success('Actualizado');
      } else {
        await svc.create(payload);
        toast.success('Creado');
      }
      setShowForm(false);
      loadItems();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await svc.del(deleteTarget);
      toast.success('Eliminado');
      setDeleteTarget(null);
      loadItems();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    }
  };

  return (
    <div className="animate-fade-in space-y-3">
      {sections.map((s) => {
        const isExpanded = activeSection === s.key;
        const SectionIcon = sectionIcons[s.key] || HiOutlineCog;
        const displayLabel = sectionDisplayLabels[s.key] || s.label;
        return (
          <div key={s.key} className="card !p-0 overflow-hidden">
            <button
              onClick={() => { setActiveSection(isExpanded ? null : s.key); setSearch(''); }}
              className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-all duration-200 ${
                isExpanded
                  ? 'gradient-primary text-white rounded-t-2xl'
                  : 'bg-surface text-gray-800 hover:bg-gray-50'
              }`}
            >
              <SectionIcon className={`w-5 h-5 flex-shrink-0 ${isExpanded ? 'text-white/80' : 'text-primary-600'}`} />
              <span className="flex-1 text-sm font-bold font-display">{displayLabel}</span>
              {isExpanded ? (
                <HiOutlineChevronUp className="w-5 h-5 flex-shrink-0" />
              ) : (
                <HiOutlineChevronDown className="w-5 h-5 flex-shrink-0" />
              )}
            </button>

            {isExpanded && (
              <div className="p-4">
                {s.key === 'email-templates' ? (
                  <EmailTemplatesEditor />
                ) : s.customInline ? (
                  <TermsPrivacyEditor />
                ) : (
                  <>
                    {exportMap[s.key] && (
                      <div className="mb-4">
                        <ExportButton
                          exportFn={exportMap[s.key].fn}
                          baseName={exportMap[s.key].baseName}
                        />
                      </div>
                    )}
                    {!section.noCreate && (
                      <button
                        onClick={openCreate}
                        className="btn-primary w-full text-sm py-2.5 mb-4 flex items-center justify-center gap-1.5"
                      >
                        <HiOutlinePlus className="w-4 h-4" />
                        Agregar
                      </button>
                    )}

                    {s.searchable && (
                      <div className="relative mb-3">
                        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Buscar por nombre..."
                          className="input-field pl-9 text-sm"
                        />
                      </div>
                    )}

                    {loading ? (
                      <LoadingSpinner />
                    ) : displayItems.length === 0 ? (
                      <EmptyState icon={HiOutlineCog} title="Sin registros" />
                    ) : (
                      <div className="space-y-1.5">
                        {displayItems.map((item) => (
                          <div key={item.id} className="card !p-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded shrink-0">#{item.id}</span>
                                  <h3 className="text-xs font-bold text-gray-900 truncate">
                                    {activeSection === 'payment-methods'
                                      ? (item.tipo === 'BANCO' ? `Banco - ${item.nombre_banco || ''}` : item.tipo)
                                      : activeSection === 'plans'
                                        ? (item.nombre || (item.tipo === 'ESTANDAR' ? 'Plan Estándar' : item.tipo === 'PREMIUM' ? 'Plan Premium' : item.tipo))
                                        : section.fields[0]?.displayFormat
                                          ? section.fields[0].displayFormat(item[section.fields[0].name])
                                          : (item[section.fields[0]?.name] || '-')}
                                  </h3>
                                </div>
                                {activeSection === 'payment-methods' ? (
                                  <p className="text-[11px] text-gray-500 mt-0.5 ml-9 truncate">
                                    {item.titular || '-'}
                                    {item.tipo === 'BANCO'
                                      ? ` | Cta: ${item.numero_cuenta || '-'} | CCI: ${item.cci || '-'}`
                                      : ` | Cel: ${item.numero_celular || '-'}`}
                                  </p>
                                ) : activeSection === 'galleries' ? (
                                  <p className="text-[11px] text-gray-500 mt-0.5 ml-9 truncate">
                                    {item.tbl_ciudades?.nombre || '-'} | {item.tbl_zonas?.nombre || '-'}
                                    {item.direccion ? ` | ${item.direccion}` : ''}
                                    {item.fotos?.length > 0 ? ` | ${item.fotos.length} foto(s)` : ''}
                                  </p>
                                ) : activeSection === 'zones' ? (
                                  <p className="text-[11px] text-gray-500 mt-0.5 ml-9 truncate">
                                    Ciudad: {item.tbl_ciudades?.nombre || '-'}
                                  </p>
                                ) : activeSection === 'plans' ? (
                                  <p className="text-[11px] text-gray-500 mt-0.5 ml-9 truncate">
                                    S/{parseFloat(item.precio).toFixed(2)} | {item.duracion_dias} dias
                                  </p>
                                ) : activeSection === 'system-config' ? (
                                  <p className="text-[11px] text-gray-500 mt-0.5 ml-9 truncate">
                                    Valor: {item.valor} {item.descripcion ? `| ${item.descripcion}` : ''}
                                  </p>
                                ) : section.fields.length > 1 && (
                                  <p className="text-[11px] text-gray-500 mt-0.5 ml-9 truncate">
                                    {section.fields.slice(1).map((f) => {
                                      if (f.textarea) return (item[f.name]?.substring(0, 50) || '-') + (item[f.name]?.length > 50 ? '...' : '');
                                      if (f.select) {
                                        const opt = (selectOptions[f.select] || []).find((o) => o.id === item[f.name]);
                                        return opt ? opt.nombre : item[f.name] || '-';
                                      }
                                      return item[f.name] || '-';
                                    }).join(' | ')}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-0.5 ml-2 shrink-0">
                                <button
                                  onClick={() => openEdit(item)}
                                  className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-500 transition-colors"
                                >
                                  <HiOutlinePencil className="w-3.5 h-3.5" />
                                </button>
                                {!section.noDelete && (
                                  <button
                                    onClick={() => setDeleteTarget(item.id)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                  >
                                    <HiOutlineTrash className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Form Modal */}
      {activeSection === 'plans' ? (
        <Suspense fallback={null}>
          <PlanFormDialog
            open={showForm}
            onClose={() => setShowForm(false)}
            editItem={editItem}
            onSaved={() => { setShowForm(false); loadItems(); }}
          />
        </Suspense>
      ) : activeSection === 'galleries' ? (
        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          title={editItem ? 'Editar Galeria' : 'Nueva Galeria'}
          maxWidth="max-w-lg"
        >
          <Suspense fallback={<LoadingSpinner />}>
            <GalleryForm
              editItem={editItem}
              onClose={() => setShowForm(false)}
              onSaved={() => { setShowForm(false); loadItems(); }}
            />
          </Suspense>
        </Modal>
      ) : activeSection === 'payment-methods' ? (
        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          title={editItem ? 'Editar Metodo de Pago' : 'Nuevo Metodo de Pago'}
          maxWidth="max-w-md"
        >
          <PaymentMethodForm
            editItem={editItem}
            svc={svc}
            onClose={() => setShowForm(false)}
            onSaved={() => { setShowForm(false); loadItems(); }}
          />
        </Modal>
      ) : section ? (
        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          title={editItem ? `Editar ${section.label}` : `Crear ${section.label}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {section.fields.filter((f) => !f.readOnly).map((f) => (
              <div key={f.name}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {f.label} {f.required && <span className="text-coral-500">*</span>}
                </label>
                {f.textarea ? (
                  <textarea
                    value={form[f.name] || ''}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className="input-field text-sm"
                    rows={3}
                    required={f.required}
                  />
                ) : f.select ? (
                  <select
                    value={form[f.name] || ''}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className="input-field text-sm"
                    required={f.required}
                  >
                    <option value="">-- Selecciona --</option>
                    {(selectOptions[f.select] || []).map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type || 'text'}
                    step={f.decimal ? '0.01' : undefined}
                    min={f.type === 'number' ? '0' : undefined}
                    value={form[f.name] || ''}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className="input-field text-sm"
                    required={f.required}
                  />
                )}
              </div>
            ))}
            <button type="submit" disabled={saving} className="btn-primary w-full text-sm">
              {saving ? 'Guardando...' : editItem ? 'Actualizar' : 'Crear'}
            </button>
          </form>
        </Modal>
      ) : null}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar registro"
        message="Esta seguro de eliminar este registro?"
        confirmText="Eliminar"
      />
    </div>
  );
}

/* ── Terms & Privacy Editor ── */
function TermsPrivacyEditor() {
  const [activeTab, setActiveTab] = useState('terms');
  const [termsData, setTermsData] = useState(null);
  const [privacyData, setPrivacyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ titulo: '', numero_version: '', contenido: '' });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const data = activeTab === 'terms' ? termsData : privacyData;
    if (data) {
      setForm({
        titulo: data.titulo || '',
        numero_version: data.numero_version?.toString() || '1',
        contenido: data.contenido || '',
      });
    } else {
      setForm({ titulo: '', numero_version: '1', contenido: '' });
    }
  }, [activeTab, termsData, privacyData]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [termsRes, privacyRes] = await Promise.all([
        adminService.getTerms(),
        adminService.getPrivacy(),
      ]);
      const terms = (termsRes.data || []).sort((a, b) => b.id - a.id)[0] || null;
      const privacy = (privacyRes.data || []).sort((a, b) => b.id - a.id)[0] || null;
      setTermsData(terms);
      setPrivacyData(privacy);
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.titulo.trim() || !form.contenido.trim()) {
      toast.error('Titulo y contenido son requeridos');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        titulo: form.titulo.trim(),
        numero_version: parseInt(form.numero_version) || 1,
        contenido: form.contenido.trim(),
        es_vigente: true,
        publicado_en: new Date().toISOString(),
      };
      const data = activeTab === 'terms' ? termsData : privacyData;
      const updateFn = activeTab === 'terms' ? adminService.updateTerms : adminService.updatePrivacy;
      const createFn = activeTab === 'terms' ? adminService.createTerms : adminService.createPrivacy;

      if (data) {
        await updateFn(data.id, payload);
      } else {
        await createFn(payload);
      }
      toast.success('Guardado correctamente');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const currentData = activeTab === 'terms' ? termsData : privacyData;
  const lastUpdate = currentData?.publicado_en || currentData?.fecha_hora_registro;

  return (
    <div>
      <h2 className="text-base font-bold font-display text-gray-900 mb-1">Terminos y Condiciones</h2>
      <p className="text-xs text-gray-500 mb-4">Configure los terminos que los usuarios deben aceptar al registrarse</p>

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('terms')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'terms'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-surface border border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <HiOutlineDocumentText className="w-4 h-4" />
          Terminos de Servicio
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'privacy'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-surface border border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <HiOutlineShieldCheck className="w-4 h-4" />
          Politica de Privacidad
        </button>
      </div>

      {/* Last update */}
      {lastUpdate && (
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5 mb-4">
          <span className="text-xs text-gray-500">Ultima actualizacion:</span>
          <span className="text-xs font-semibold text-primary-600">{formatDateTime(lastUpdate)}</span>
        </div>
      )}

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Titulo</label>
          <input
            type="text"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            className="input-field text-sm"
            placeholder={activeTab === 'terms' ? 'Terminos de Servicio' : 'Politica de Privacidad'}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Version</label>
          <input
            type="text"
            value={form.numero_version}
            onChange={(e) => setForm({ ...form, numero_version: e.target.value })}
            className="input-field text-sm"
            placeholder="1.0"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contenido</label>
          <textarea
            value={form.contenido}
            onChange={(e) => setForm({ ...form, contenido: e.target.value })}
            className="input-field text-sm"
            rows={10}
            placeholder="Escriba el contenido..."
          />
        </div>
      </div>

      <p className="text-[11px] text-gray-400 italic mt-3">
        Al guardar se actualizara la version vigente
      </p>

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary w-full text-sm mt-4 flex items-center justify-center gap-2"
      >
        <HiOutlineSave className="w-4 h-4" />
        {saving ? 'Guardando...' : activeTab === 'terms' ? 'Guardar Terminos' : 'Guardar Privacidad'}
      </button>
    </div>
  );
}

/* ── Email Templates Editor ── */
const TAB_ICONS = {
  store: HiOutlineOfficeBuilding,
  person: HiOutlineUser,
};

function EmailTemplatesEditor() {
  const [templates, setTemplates] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [asunto, setAsunto] = useState('');
  const [sections, setSections] = useState([]);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const previewTimeoutRef = useRef(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getEmailTemplates();
      setTemplates(data);
      if (data.length > 0 && !activeTab) {
        setActiveTab(data[0]?.variables_json?.categoria);
      }
    } catch {
      toast.error('Error al cargar plantillas');
    } finally {
      setLoading(false);
    }
  };

  const tabs = templates.reduce((acc, t) => {
    const meta = t.variables_json;
    const cat = meta?.categoria;
    if (cat && !acc.find(tab => tab.key === cat)) {
      acc.push({
        key: cat,
        label: meta?.label_tab || cat,
        icono: meta?.icono_tab || 'mail',
      });
    }
    return acc;
  }, []);

  const currentTemplate = templates.find(t => t.variables_json?.categoria === activeTab);

  useEffect(() => {
    if (currentTemplate) {
      setAsunto(currentTemplate.asunto_plantilla || '');
      const savedSections = currentTemplate.variables_json?.sections;
      if (savedSections && Array.isArray(savedSections) && savedSections.length > 0) {
        setSections(JSON.parse(JSON.stringify(savedSections)));
      } else {
        setSections([]);
      }
      setPreviewHtml('');
      setShowPreview(false);
    }
  }, [activeTab, templates]);

  const fetchPreview = useCallback(async (tmplName, secs) => {
    try {
      const { data } = await adminService.previewEmailTemplate({
        templateName: tmplName,
        sections: secs,
      });
      setPreviewHtml(data?.html || '');
    } catch {
      // Silent fail for preview
    }
  }, []);

  const triggerPreview = useCallback((secs) => {
    if (!currentTemplate) return;
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    previewTimeoutRef.current = setTimeout(() => {
      fetchPreview(currentTemplate.nombre, secs);
    }, 600);
  }, [currentTemplate, fetchPreview]);

  const updateSection = (index, newContent) => {
    setSections(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], content: newContent };
      if (showPreview) triggerPreview(updated);
      return updated;
    });
  };

  const handleSave = async () => {
    if (!currentTemplate) return;
    if (!asunto.trim()) {
      toast.error('El asunto es requerido');
      return;
    }
    if (sections.length === 0) {
      toast.error('No hay secciones para guardar');
      return;
    }
    setSaving(true);
    try {
      await adminService.updateEmailTemplate(currentTemplate.id, {
        asunto_plantilla: asunto.trim(),
        sections,
      });
      toast.success('Plantilla guardada');
      await loadTemplates();
    } catch {
      toast.error('Error al guardar plantilla');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setShowResetConfirm(false);
    try {
      await adminService.resetEmailTemplates();
      toast.success('Plantillas restauradas');
      setActiveTab(null);
      await loadTemplates();
    } catch {
      toast.error('Error al restaurar plantillas');
    }
  };

  const handleTogglePreview = () => {
    if (!showPreview && currentTemplate) {
      fetchPreview(currentTemplate.nombre, sections);
    }
    setShowPreview(v => !v);
  };

  if (loading) return <LoadingSpinner />;

  const variables = currentTemplate?.variables_json?.variables || [];
  const descripcion = currentTemplate?.variables_json?.descripcion || '';
  const titulo = currentTemplate?.variables_json?.titulo_display || '';

  const VAR_TOOLTIPS = {
    nombre: 'Nombre del usuario',
    codigo: 'Código de verificación completo',
    d1: 'Dígito 1 del código', d2: 'Dígito 2 del código', d3: 'Dígito 3 del código',
    d4: 'Dígito 4 del código', d5: 'Dígito 5 del código', d6: 'Dígito 6 del código',
    minutos: 'Minutos antes de que expire',
    link: 'Enlace para restablecer contraseña',
    horas: 'Horas antes de que expire',
    tienda: 'Nombre de la tienda',
    fecha_vencimiento: 'Fecha en que vence la suscripción',
    storeName: 'Nombre de la tienda',
    sellerName: 'Nombre del vendedor',
  };

  const FIXED_LABELS = {
    greeting: 'Saludo automático',
    digitRow: 'Código de verificación (6 dígitos)',
    warningBox: 'Alerta de tienda y fecha',
    successBox: 'Confirmación',
  };

  return (
    <div>
      <h2 className="text-base font-bold font-display text-gray-900 mb-1">Plantillas de Email</h2>
      <p className="text-xs text-gray-500 mb-4">Edita el contenido de los correos que se envían automáticamente</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map(tab => {
          const TabIcon = TAB_ICONS[tab.icono] || HiOutlineMail;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-surface border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {currentTemplate && (
        <>
          {/* Info card */}
          <div className="bg-coral-50 border-l-4 border-coral-400 p-4 rounded-r-xl mb-4">
            <h3 className="text-sm font-bold text-coral-700">{titulo}</h3>
            <p className="text-xs text-coral-600 mt-1">{descripcion}</p>
          </div>

          {/* Variables reference */}
          {variables.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="text-xs font-semibold text-gray-700 mb-1.5">Variables disponibles:</p>
              <div className="flex flex-wrap gap-1.5">
                {variables.filter(v => !['logo_url', 'logo_display'].includes(v)).map(v => (
                  <span
                    key={v}
                    className="relative group px-2 py-1 rounded-full border border-gray-300 bg-white text-xs font-mono text-gray-600 cursor-help"
                  >
                    {`{{${v}}}`}
                    {VAR_TOOLTIPS[v] && (
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-gray-800 text-white text-[11px] font-sans whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                        {VAR_TOOLTIPS[v]}
                        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                      </span>
                    )}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 italic mt-1.5">
                Escribe estas variables en los campos editables. Se reemplazarán automáticamente al enviar el correo.
              </p>
            </div>
          )}

          {/* Subject */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Asunto del correo</label>
            <input
              type="text"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              className="input-field text-sm"
            />
          </div>

          {/* Sections editor */}
          <div className="space-y-3 mb-4">
            <p className="text-sm font-semibold text-gray-700">Secciones del correo</p>
            {sections.map((section, idx) => (
              <div key={section.key} className={`rounded-xl border ${section.editable ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50'} overflow-hidden`}>
                <div className={`flex items-center gap-2 px-3 py-2 ${section.editable ? 'bg-primary-50 border-b border-gray-200' : 'bg-gray-100 border-b border-gray-200'}`}>
                  {section.editable ? (
                    <HiOutlinePencilAlt className="w-3.5 h-3.5 text-primary-600" />
                  ) : (
                    <HiOutlineLockClosed className="w-3.5 h-3.5 text-gray-400" />
                  )}
                  <span className={`text-xs font-semibold ${section.editable ? 'text-primary-700' : 'text-gray-500'}`}>
                    {section.label}
                  </span>
                  {!section.editable && (
                    <span className="ml-auto text-xs text-gray-400 italic">Sección fija</span>
                  )}
                </div>
                <div className="px-3 py-2">
                  {section.editable ? (
                    section.type === 'ctaButton' ? (
                      <input
                        type="text"
                        value={section.content}
                        onChange={(e) => updateSection(idx, e.target.value)}
                        placeholder="Texto del botón..."
                        className="input-field text-sm"
                      />
                    ) : (
                      <textarea
                        value={section.content}
                        onChange={(e) => updateSection(idx, e.target.value)}
                        rows={section.type === 'infoBox' ? 2 : 3}
                        className="input-field text-sm resize-none"
                      />
                    )
                  ) : (
                    <p className="text-xs text-gray-500 italic py-1">
                      {FIXED_LABELS[section.type] || section.content || 'Contenido generado automáticamente'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Preview toggle */}
          <button
            onClick={handleTogglePreview}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 mb-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {showPreview ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
            {showPreview ? 'Ocultar vista previa' : 'Ver vista previa'}
          </button>

          {/* Preview iframe */}
          {showPreview && (
            <div className="mb-4 rounded-xl border border-gray-300 overflow-hidden">
              <div className="bg-gray-100 px-3 py-2 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-600">Vista previa (datos de ejemplo)</p>
              </div>
              {previewHtml ? (
                <iframe
                  srcDoc={previewHtml}
                  title="Vista previa del email"
                  className="w-full border-0"
                  style={{ height: '500px' }}
                />
              ) : (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              )}
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full text-sm mt-2 flex items-center justify-center gap-2"
          >
            <HiOutlineSave className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Plantilla'}
          </button>

          {/* Reset */}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full text-center text-sm text-primary-600 font-semibold mt-3 hover:text-primary-800 transition-colors"
          >
            Restaurar Predeterminados
          </button>

          <ConfirmDialog
            open={showResetConfirm}
            onClose={() => setShowResetConfirm(false)}
            onConfirm={handleReset}
            title="Restaurar plantillas"
            message="Se restaurarán las plantillas a sus valores predeterminados. Los cambios que hayas hecho se perderán."
            confirmText="Restaurar"
          />
        </>
      )}
    </div>
  );
}

/* ── Payment Method Form ── */
function PaymentMethodForm({ editItem, svc, onClose, onSaved }) {
  const [tipo, setTipo] = useState(editItem?.tipo || '');
  const [titular, setTitular] = useState(editItem?.titular || '');
  const [nombreBanco, setNombreBanco] = useState(editItem?.nombre_banco || '');
  const [numeroCuenta, setNumeroCuenta] = useState(editItem?.numero_cuenta || '');
  const [cci, setCci] = useState(editItem?.cci || '');
  const [numeroCelular, setNumeroCelular] = useState(editItem?.numero_celular || '');
  const [saving, setSaving] = useState(false);

  const isBilletera = tipo === 'YAPE' || tipo === 'PLIN';
  const isBanco = tipo === 'BANCO';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { tipo, titular };
      if (isBanco) {
        payload.nombre_banco = nombreBanco;
        payload.numero_cuenta = numeroCuenta;
        payload.cci = cci;
        payload.numero_celular = null;
      } else {
        payload.numero_celular = numeroCelular;
        payload.nombre_banco = null;
        payload.numero_cuenta = null;
        payload.cci = null;
      }

      if (editItem) {
        await svc.update(editItem.id, payload);
        toast.success('Actualizado');
      } else {
        await svc.create(payload);
        toast.success('Creado');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Tipo de metodo <span className="text-coral-500">*</span>
        </label>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="input-field text-sm"
          required
        >
          <option value="">-- Selecciona --</option>
          <option value="YAPE">Yape</option>
          <option value="PLIN">Plin</option>
          <option value="BANCO">Cuenta Bancaria</option>
        </select>
      </div>

      {(isBilletera || isBanco) && (
        <>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Titular <span className="text-coral-500">*</span>
            </label>
            <input
              type="text"
              value={titular}
              onChange={(e) => setTitular(e.target.value)}
              className="input-field text-sm"
              placeholder="Nombre del titular"
              required
            />
          </div>

          {isBilletera && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Numero de celular <span className="text-coral-500">*</span>
              </label>
              <input
                type="tel"
                value={numeroCelular}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                  setNumeroCelular(val);
                }}
                className="input-field text-sm"
                placeholder="9 digitos"
                maxLength={9}
                pattern="\d{9}"
                title="Ingresa exactamente 9 digitos"
                required
              />
            </div>
          )}

          {isBanco && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nombre del banco <span className="text-coral-500">*</span>
                </label>
                <input
                  type="text"
                  value={nombreBanco}
                  onChange={(e) => setNombreBanco(e.target.value)}
                  className="input-field text-sm"
                  placeholder="Ej: BCP, Interbank, BBVA"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Numero de cuenta <span className="text-coral-500">*</span>
                </label>
                <input
                  type="text"
                  value={numeroCuenta}
                  onChange={(e) => setNumeroCuenta(e.target.value)}
                  className="input-field text-sm"
                  placeholder="Numero de cuenta principal"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Cuenta Interbancaria (CCI) <span className="text-coral-500">*</span>
                </label>
                <input
                  type="text"
                  value={cci}
                  onChange={(e) => setCci(e.target.value)}
                  className="input-field text-sm"
                  placeholder="Numero de cuenta interbancaria"
                  required
                />
              </div>
            </>
          )}
        </>
      )}

      <button type="submit" disabled={saving || !tipo} className="btn-primary w-full text-sm">
        {saving ? 'Guardando...' : editItem ? 'Actualizar' : 'Crear'}
      </button>
    </form>
  );
}
