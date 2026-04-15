import { useState, useEffect, useRef } from 'react';
import { buyerService } from '../../services/buyerService';
import { catalogService } from '../../services/catalogService';
import { useAuth } from '../../features/auth/useAuth';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useTheme } from '../../hooks/useTheme';
import toast from 'react-hot-toast';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlinePencil,
  HiOutlineSun,
  HiOutlineLockClosed,
  HiOutlineChevronRight,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineX,
} from 'react-icons/hi';

export default function BuyerProfilePage() {
  const { syncUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cities, setCities] = useState([]);
  const { isDark, toggleTheme } = useTheme();
  const [editingCity, setEditingCity] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    id_ciudad: '',
  });
  const [correo, setCorreo] = useState('');

  // Refs for focusing inputs when pencil is clicked
  const nombreRef = useRef(null);
  const telefonoRef = useRef(null);
  const ciudadRef = useRef(null);

  useEffect(() => {
    Promise.all([loadProfile(), loadCities()]);
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await buyerService.getProfile();
      const profile = data.data || data;
      setForm({
        nombre: profile.nombre || '',
        telefono: profile.telefono || '',
        id_ciudad: profile.id_ciudad?.toString() || '',
      });
      setCorreo(profile.correo);
    } catch {
      toast.error('Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async () => {
    try {
      const { data } = await catalogService.getCities();
      setCities(data?.data || []);
    } catch {}
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Auto-save on blur for text fields
  const handleBlurSave = async () => {
    setSaving(true);
    try {
      await buyerService.updateProfile({
        ...form,
        id_ciudad: form.id_ciudad ? parseInt(form.id_ciudad) : null,
      });
      await syncUser();
      toast.success('Perfil actualizado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  // Auto-save on city change
  const handleCityChange = async (e) => {
    const newForm = { ...form, id_ciudad: e.target.value };
    setForm(newForm);
    setEditingCity(false);
    setSaving(true);
    try {
      await buyerService.updateProfile({
        ...newForm,
        id_ciudad: newForm.id_ciudad ? parseInt(newForm.id_ciudad) : null,
      });
      await syncUser();
      toast.success('Perfil actualizado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      return toast.error('Completa todos los campos');
    }
    if (pwForm.newPw.length < 6) {
      return toast.error('La nueva contraseña debe tener al menos 6 caracteres');
    }
    if (pwForm.newPw !== pwForm.confirm) {
      return toast.error('Las contraseñas no coinciden');
    }
    setSavingPassword(true);
    try {
      await buyerService.changePassword(pwForm.current, pwForm.newPw);
      toast.success('Contraseña actualizada');
      setShowPasswordModal(false);
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cambiar contraseña');
    } finally {
      setSavingPassword(false);
    }
  };

  // Get display name for the selected city
  const getCityName = () => {
    if (!form.id_ciudad) return 'No especificado';
    const city = cities.find((c) => c.id.toString() === form.id_ciudad);
    return city ? city.nombre : 'No especificado';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in pb-6">
      {/* Full-bleed Hero Header */}
      <div className="gradient-hero -mx-4 sm:-mx-6 -mt-4 px-6 pt-12 pb-14 mb-8 text-center relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute bottom-4 left-[10%] w-44 h-44 rounded-full bg-white/[0.08]" />
        <div className="absolute bottom-[-20%] left-[25%] w-56 h-56 rounded-full bg-white/[0.06]" />
        <div className="absolute top-[10%] right-[-8%] w-40 h-40 rounded-full bg-white/[0.05]" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white font-display">Configuración</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
      {/* DATOS PERSONALES Section */}
      <p className="section-title mb-3 px-1">DATOS PERSONALES</p>
      <div className="bg-surface rounded-2xl shadow-card border border-gray-100/80 mb-6 overflow-hidden">
        {/* Name Field */}
        <div className="px-5 py-4 flex items-center gap-4 border-b border-gray-50">
          <div className="w-10 h-10 rounded-full bg-coral-50 flex items-center justify-center flex-shrink-0">
            <HiOutlineUser className="w-5 h-5 text-coral-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Nombre</p>
            <input
              ref={nombreRef}
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              onBlur={handleBlurSave}
              placeholder="Tu nombre"
              className="w-full text-sm text-gray-800 font-medium bg-transparent border-none p-0 focus:ring-0 mt-0.5 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => nombreRef.current?.focus()}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <HiOutlinePencil className="w-4 h-4 text-red-500" />
          </button>
        </div>

        {/* Phone Field */}
        <div className="px-5 py-4 flex items-center gap-4 border-b border-gray-50">
          <div className="w-10 h-10 rounded-full bg-seller-50 flex items-center justify-center flex-shrink-0">
            <HiOutlinePhone className="w-5 h-5 text-seller-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Telefono</p>
            <input
              ref={telefonoRef}
              type="text"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              onBlur={handleBlurSave}
              placeholder="Tu telefono"
              className="w-full text-sm text-gray-800 font-medium bg-transparent border-none p-0 focus:ring-0 mt-0.5 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => telefonoRef.current?.focus()}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <HiOutlinePencil className="w-4 h-4 text-red-500" />
          </button>
        </div>

        {/* Email Field (read-only) */}
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
            <HiOutlineMail className="w-5 h-5 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Correo</p>
            <input
              type="email"
              value={correo}
              disabled
              className="w-full text-sm text-gray-500 bg-transparent border-none p-0 focus:ring-0 mt-0.5"
            />
          </div>
        </div>
      </div>

      {/* UBICACION Section */}
      <p className="section-title mb-3 px-1">UBICACION</p>
      <div className="bg-surface rounded-2xl shadow-card border border-gray-100/80 mb-6 overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-accent-50 flex items-center justify-center flex-shrink-0">
            <HiOutlineLocationMarker className="w-5 h-5 text-accent-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Ciudad</p>
            {editingCity ? (
              <select
                ref={ciudadRef}
                name="id_ciudad"
                value={form.id_ciudad}
                onChange={handleCityChange}
                onBlur={() => setEditingCity(false)}
                autoFocus
                className="w-full text-sm text-gray-800 font-medium bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 mt-1 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 focus:outline-none cursor-pointer"
              >
                <option value="">No especificado</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-800 font-medium mt-0.5">{getCityName()}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setEditingCity(!editingCity)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <HiOutlinePencil className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      {/* APARIENCIA Section */}
      <p className="section-title mb-3 px-1">APARIENCIA</p>
      <div className="bg-surface rounded-2xl shadow-card border border-gray-100/80 mb-6 overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
            <HiOutlineSun className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 font-medium">Modo Oscuro</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {isDark ? 'Activado' : 'Desactivado'}
            </p>
          </div>
          {/* Toggle Switch */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 flex-shrink-0 ${
              isDark ? 'bg-orange-500' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                isDark ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* SEGURIDAD Section */}
      <p className="section-title mb-3 px-1">SEGURIDAD</p>
      <div className="bg-surface rounded-2xl shadow-card border border-gray-100/80 mb-6 overflow-hidden">
        <button
          type="button"
          onClick={() => {
            setShowPasswordModal(true);
            setPwForm({ current: '', newPw: '', confirm: '' });
            setShowCurrent(false);
            setShowNew(false);
            setShowConfirm(false);
          }}
          className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
            <HiOutlineLockClosed className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm text-gray-800 font-medium">Cambiar Contraseña</p>
            <p className="text-xs text-gray-400 mt-0.5">Actualiza tu contraseña de acceso</p>
          </div>
          <HiOutlineChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
        </button>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">Cambiar Contraseña</h3>
              <button onClick={() => setShowPasswordModal(false)} className="p-1 rounded-full hover:bg-gray-100">
                <HiOutlineX className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              {/* Current password */}
              <div>
                <label className="text-xs text-gray-500 font-medium">Contraseña actual</label>
                <div className="relative mt-1">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={pwForm.current}
                    onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 pr-10 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 focus:outline-none"
                    placeholder="Ingresa tu contraseña actual"
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showCurrent ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {/* New password */}
              <div>
                <label className="text-xs text-gray-500 font-medium">Nueva contraseña</label>
                <div className="relative mt-1">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={pwForm.newPw}
                    onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 pr-10 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 focus:outline-none"
                    placeholder="Minimo 6 caracteres"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showNew ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {/* Confirm password */}
              <div>
                <label className="text-xs text-gray-500 font-medium">Confirmar nueva contraseña</label>
                <div className="relative mt-1">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={pwForm.confirm}
                    onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 pr-10 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 focus:outline-none"
                    placeholder="Repite la nueva contraseña"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showConfirm ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={savingPassword}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {savingPassword ? 'Guardando...' : 'Cambiar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saving indicator */}
      {saving && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-4 py-2 rounded-full shadow-lg z-50 animate-fade-in">
          Guardando...
        </div>
      )}
      </div>
    </div>
  );
}
