import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sellerService } from '../../services/sellerService';
import { useAuth } from '../../features/auth/useAuth';
import { useSSEListener } from '../../hooks/useSSEListener';
import { useTheme } from '../../hooks/useTheme';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  HiOutlineExclamation,
  HiOutlineChevronRight,
  HiOutlineSave,
  HiOutlineLogout,
  HiOutlineSun,
} from 'react-icons/hi';

export default function SellerProfilePage() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    dni: '',
    correo: '',
    telefono: '',
    tipo_comprobante: 'BOLETA',
    ruc: '',
    razon_social: '',
  });
  const { isDark, toggleTheme } = useTheme();

  const loadProfile = async () => {
    try {
      const { data } = await sellerService.getProfile();
      const perfil = data.data || data;
      setProfile(perfil);
      setForm({
        nombre: perfil.tbl_usuarios?.nombre || perfil.tbl_usuarios?.nombres || '',
        dni: perfil.dni || '',
        correo: perfil.tbl_usuarios?.correo || usuario?.correo || '',
        telefono: perfil.tbl_usuarios?.telefono || '',
        tipo_comprobante: perfil.tipo_comprobante || 'BOLETA',
        ruc: perfil.ruc || '',
        razon_social: perfil.razon_social || '',
      });
    } catch {
      toast.error('Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useSSEListener(['approval.seller.approved', 'approval.seller.rejected'], loadProfile);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await sellerService.updateProfile({
        nombre: form.nombre,
        dni: form.dni,
        telefono: form.telefono,
        tipo_comprobante: form.tipo_comprobante,
        ruc: form.tipo_comprobante === 'FACTURA' ? form.ruc : '',
        razon_social: form.tipo_comprobante === 'FACTURA' ? form.razon_social : '',
      });
      toast.success('Perfil actualizado');
      loadProfile();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const updateField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  if (loading) return <LoadingSpinner />;
  if (!profile) return <p className="text-center text-gray-500 mt-10">No se encontró perfil de vendedor</p>;

  // Check subscription status across all stores
  const activeSub = profile.tbl_usuarios?.tiendas?.find(
    (s) => s.suscripcion_activa?.estado === 'ACTIVE'
  )?.suscripcion_activa;
  const hasAnySub = !!activeSub;

  return (
    <div className="animate-fade-in pb-8">
      {/* Subscription banner */}
      <div
        onClick={() => navigate('/vendedor/suscripciones')}
        className={`rounded-2xl p-4 mb-6 flex items-center gap-3 cursor-pointer transition-all hover:opacity-90 ${
          hasAnySub ? 'bg-seller-50 border border-seller-200' : 'bg-red-50 border border-red-200'
        }`}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          hasAnySub ? 'bg-seller-100' : 'bg-red-100'
        }`}>
          <HiOutlineExclamation className={`w-5 h-5 ${hasAnySub ? 'text-seller-600' : 'text-red-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500">Mi Suscripción</p>
          <p className={`text-base font-display font-bold ${hasAnySub ? 'text-seller-600' : 'text-red-500'}`}>
            {hasAnySub ? 'Activa' : 'Inactiva'}
          </p>
        </div>
        {hasAnySub && (
          <div className="text-right mr-1">
            <p className="text-xs font-medium text-gray-500">
              {activeSub.tipo_plan === 'PREMIUM' ? 'Premium' : 'Estándar'}
            </p>
          </div>
        )}
        <HiOutlineChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
      </div>

      <form onSubmit={handleSubmit}>
        {/* Datos Personales */}
        <div className="card rounded-2xl shadow-card mb-6">
          <h2 className="text-lg font-display font-bold text-gray-800 mb-1">Datos Personales</h2>
          <p className="text-xs text-gray-400 mb-5">Información del propietario para facturación y contacto</p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nombre completo *</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => updateField('nombre', e.target.value)}
                className="input-field rounded-xl text-sm w-full"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">DNI *</label>
              <input
                type="text"
                value={form.dni}
                onChange={(e) => updateField('dni', e.target.value)}
                className="input-field rounded-xl text-sm w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Correo electrónico</label>
              <input
                type="email"
                value={form.correo}
                className="input-field rounded-xl text-sm w-full bg-gray-50 text-gray-500"
                readOnly
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono *</label>
              <input
                type="text"
                value={form.telefono}
                onChange={(e) => updateField('telefono', e.target.value)}
                className="input-field rounded-xl text-sm w-full"
              />
            </div>

            {/* Tipo de comprobante */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Tipo de comprobante *</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateField('tipo_comprobante', 'BOLETA')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                    form.tipo_comprobante === 'BOLETA'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    form.tipo_comprobante === 'BOLETA' ? 'border-primary-600' : 'border-gray-300'
                  }`}>
                    {form.tipo_comprobante === 'BOLETA' && (
                      <div className="w-2.5 h-2.5 bg-primary-600 rounded-full" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">Boleta</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateField('tipo_comprobante', 'FACTURA')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                    form.tipo_comprobante === 'FACTURA'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    form.tipo_comprobante === 'FACTURA' ? 'border-primary-600' : 'border-gray-300'
                  }`}>
                    {form.tipo_comprobante === 'FACTURA' && (
                      <div className="w-2.5 h-2.5 bg-primary-600 rounded-full" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">Factura</span>
                </button>
              </div>
            </div>

            {/* Factura fields */}
            {form.tipo_comprobante === 'FACTURA' && (
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">N° de RUC *</label>
                  <input
                    type="text"
                    value={form.ruc}
                    onChange={(e) => updateField('ruc', e.target.value)}
                    placeholder="N° de RUC *"
                    className="input-field rounded-xl text-sm w-full bg-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Razón Social *</label>
                  <input
                    type="text"
                    value={form.razon_social}
                    onChange={(e) => updateField('razon_social', e.target.value)}
                    placeholder="Razón Social *"
                    className="input-field rounded-xl text-sm w-full bg-surface"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Apariencia */}
        <div className="card rounded-2xl shadow-card mb-6">
          <h2 className="text-lg font-display font-bold text-gray-800 mb-4">Apariencia</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HiOutlineSun className="w-6 h-6 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-800">Modo Oscuro</p>
                <p className="text-xs text-gray-400">{isDark ? 'Activado' : 'Desactivado'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isDark ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  isDark ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full rounded-xl text-sm flex items-center justify-center gap-2"
          >
            <HiOutlineSave className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-3 border-2 border-primary-200 rounded-xl text-sm font-semibold text-primary-600 hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
          >
            <HiOutlineLogout className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </form>
    </div>
  );
}
