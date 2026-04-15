import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { catalogService } from '../../services/catalogService';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlinePhone,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineCheckCircle,
  HiOutlineInformationCircle,
  HiOutlineOfficeBuilding,
  HiOutlineIdentification,
  HiOutlineLocationMarker,
  HiOutlineShoppingCart,
} from 'react-icons/hi';
import TermsPrivacyModal from '../../components/ui/TermsPrivacyModal';

const COMPRADOR_FEATURES = [
  'Busca productos en tu zona',
  'Guarda tus tiendas favoritas',
  'Crea listas de compras',
  'Califica productos y tiendas',
];

const VENDEDOR_FEATURES = [
  'Crea tu tienda en minutos',
  'Publica productos ilimitados',
  'Recibe valoraciones',
  'Estadisticas de tu negocio',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s()-]{7,20}$/;

const getFieldError = (name, value, form) => {
  switch (name) {
    case 'nombres':
      if (!value.trim()) return 'El nombre es obligatorio';
      if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
      return '';
    case 'correo':
      if (!value.trim()) return 'El correo es obligatorio';
      if (!EMAIL_REGEX.test(value)) return 'Formato de correo no valido';
      return '';
    case 'telefono':
      if (value && !PHONE_REGEX.test(value)) return 'Formato de telefono no valido';
      return '';
    case 'id_ciudad':
      if (!value) return 'Selecciona una ciudad';
      return '';
    case 'contrasena':
      if (!value) return 'La contraseña es obligatoria';
      if (value.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
      return '';
    case 'confirmar':
      if (!value) return 'Confirma tu contraseña';
      if (value !== form.contrasena) return 'Las contraseñas no coinciden';
      return '';
    default:
      return '';
  }
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('select'); // 'select' | 'form'
  const [type, setType] = useState('COMPRADOR');
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [termsModal, setTermsModal] = useState(null);
  const [touched, setTouched] = useState({});

  const [form, setForm] = useState({
    nombres: '',
    correo: '',
    telefono: '',
    contrasena: '',
    confirmar: '',
    id_ciudad: '',
    acceptTerms: false,
  });

  useEffect(() => {
    catalogService.getCities().then((res) => setCities(res.data?.data || [])).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    const newForm = { ...form, [name]: inputType === 'checkbox' ? checked : value };
    setForm(newForm);
    if (touched[name]) {
      setTouched((prev) => ({ ...prev, [name]: true }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const errors = {
    nombres: getFieldError('nombres', form.nombres, form),
    correo: getFieldError('correo', form.correo, form),
    telefono: getFieldError('telefono', form.telefono, form),
    id_ciudad: getFieldError('id_ciudad', form.id_ciudad, form),
    contrasena: getFieldError('contrasena', form.contrasena, form),
    confirmar: getFieldError('confirmar', form.confirmar, form),
  };

  const isFormValid =
    !errors.nombres &&
    !errors.correo &&
    !errors.telefono &&
    !errors.id_ciudad &&
    !errors.contrasena &&
    !errors.confirmar &&
    form.acceptTerms;

  const selectType = (t) => {
    setType(t);
    setStep('form');
  };

  const goBack = () => {
    if (step === 'form') {
      setStep('select');
      setTouched({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Mark all fields as touched to show any remaining errors
    setTouched({ nombres: true, correo: true, telefono: true, id_ciudad: true, contrasena: true, confirmar: true });
    if (!isFormValid) return;

    setLoading(true);
    try {
      const payload = {
        nombre: form.nombres.trim(),
        correo: form.correo,
        telefono: form.telefono,
        contrasena: form.contrasena,
        id_ciudad: form.id_ciudad ? parseInt(form.id_ciudad) : undefined,
      };

      if (type === 'COMPRADOR') {
        await authService.registerBuyer(payload);
      } else {
        await authService.registerSeller(payload);
      }

      toast.success('Registro exitoso. Verifique su correo electronico.');
      navigate('/verify-email', { state: { correo: form.correo } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error en el registro');
    } finally {
      setLoading(false);
    }
  };

  const isComprador = type === 'COMPRADOR';
  const accentColor = isComprador ? '#312c85' : '#398269';
  const accentBg = isComprador
    ? 'from-[#4a44a8] via-[#312c85] to-[#1f1b5c]'
    : 'from-[#4a9e7e] via-[#398269] to-[#2a6150]';

  // ============ STEP: TYPE SELECTION ============
  if (step === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#4a44a8] via-[#312c85] to-[#1f1b5c] pb-safe-bottom relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/3 -translate-y-1/4" />
        <div className="absolute top-1/4 right-0 w-56 h-56 bg-white/5 rounded-full translate-x-1/4" />

        {/* Header */}
        <div className="relative z-10 px-5 pt-10 pb-8 text-center">
          <Link
            to="/login"
            className="absolute left-5 top-10 w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
          >
            <HiOutlineArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-display font-bold text-white">Crear Cuenta</h1>
          <p className="text-white/60 mt-1 text-sm">
            Selecciona el tipo de cuenta que deseas
          </p>
        </div>

        {/* Cards */}
        <div className="relative z-10 px-5 pb-10 space-y-5 max-w-lg mx-auto animate-slide-up">
          {/* Comprador Card */}
          <div className="bg-surface rounded-3xl shadow-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-[#312c85]/10 flex items-center justify-center flex-shrink-0">
                <HiOutlineShoppingCart className="w-7 h-7 text-[#312c85]" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-gray-900">Comprador</h2>
                <p className="text-sm text-gray-400">Cuenta personal</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              Encuentra los mejores productos y tiendas cerca de ti. Compara precios y ahorra tiempo.
            </p>

            <div className="space-y-2.5 mb-6">
              {COMPRADOR_FEATURES.map((feat) => (
                <div key={feat} className="flex items-center gap-3">
                  <HiOutlineCheckCircle className="w-5 h-5 text-[#312c85] flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700">{feat}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => selectType('COMPRADOR')}
              className="w-full bg-[#312c85] hover:bg-[#4a44a8] text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Registrarme como Comprador
              <HiOutlineArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Vendedor Card */}
          <div className="bg-surface rounded-3xl shadow-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-[#398269]/10 flex items-center justify-center flex-shrink-0">
                <HiOutlineOfficeBuilding className="w-7 h-7 text-[#398269]" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-gray-900">Vendedor</h2>
                <p className="text-sm text-gray-400">Cuenta comercial</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              Publica tu tienda y productos. Llega a miles de compradores en tu zona.
            </p>

            <div className="space-y-2.5 mb-6">
              {VENDEDOR_FEATURES.map((feat) => (
                <div key={feat} className="flex items-center gap-3">
                  <HiOutlineCheckCircle className="w-5 h-5 text-[#398269] flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700">{feat}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => selectType('VENDEDOR')}
              className="w-full bg-[#398269] hover:bg-[#4a9e7e] text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Registrarme como Vendedor
              <HiOutlineArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-white/80 pt-2">
            Ya tienes cuenta?{' '}
            <Link to="/login" className="text-white font-bold hover:text-white/90 transition-colors">
              Inicia sesion
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // ============ STEP: REGISTRATION FORM ============
  const iconColor = isComprador ? 'text-[#312c85]/50' : 'text-[#398269]/50';

  return (
    <div className="min-h-screen bg-gray-50 pb-safe-bottom relative overflow-hidden">
      {/* Colored Header */}
      <div className={`bg-gradient-to-br ${accentBg} px-5 pt-10 pb-16 text-center relative overflow-hidden`}>
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-56 h-56 bg-white/5 rounded-full -translate-x-1/3 -translate-y-1/4" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full translate-x-1/4 -translate-y-1/4" />

        <button
          onClick={goBack}
          className="absolute left-5 top-10 w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors z-20"
        >
          <HiOutlineArrowLeft className="w-5 h-5" />
        </button>

        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 border border-white/30 shadow-lg">
            {isComprador ? (
              <HiOutlineShoppingCart className="w-8 h-8 text-white" />
            ) : (
              <HiOutlineOfficeBuilding className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-2xl font-display font-bold text-white">Crear Cuenta</h1>
          <p className="text-white/70 text-sm mt-1">
            {isComprador ? 'Comprador' : 'Vendedor'}
          </p>
        </div>
      </div>

      {/* Form Card (overlaps header) */}
      <div className="relative z-10 -mt-8 px-5 pb-10 max-w-lg mx-auto animate-slide-up">
        <div className="bg-surface rounded-3xl shadow-xl p-6">
          <h2 className="text-xl font-display font-bold text-gray-900 mb-1">
            {isComprador ? 'Informacion Personal' : 'Registro de Vendedor'}
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            {isComprador
              ? 'Completa tus datos para crear tu cuenta'
              : 'Completa tus datos personales para crear tu cuenta'}
          </p>

          {/* Seller info notice */}
          {!isComprador && (
            <div className="bg-[#398269]/10 border border-[#398269]/20 rounded-xl p-4 mb-6 flex gap-3">
              <HiOutlineInformationCircle className="w-5 h-5 text-[#398269] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#398269] leading-relaxed">
                Despues de verificar tu cuenta, podras registrar tu tienda desde el panel de vendedor.
                Tu solicitud sera revisada por un administrador antes de ser aprobada.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre completo */}
            <div>
              <div className="relative">
                <HiOutlineUser className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${iconColor}`} />
                <input
                  type="text"
                  name="nombres"
                  value={form.nombres}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full bg-gray-100 border rounded-xl py-3.5 pl-12 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${touched.nombres && errors.nombres ? 'border-red-400 focus:ring-red-300/50 focus:border-red-400' : 'border-gray-200 focus:ring-gray-300/50 focus:border-gray-300'}`}
                  placeholder={isComprador ? 'Nombre completo' : 'Tu nombre completo'}
                />
              </div>
              {touched.nombres && errors.nombres && (
                <p className="text-xs text-red-500 mt-1 pl-1">{errors.nombres}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <div className="relative">
                <HiOutlineMail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${iconColor}`} />
                <input
                  type="email"
                  name="correo"
                  value={form.correo}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full bg-gray-100 border rounded-xl py-3.5 pl-12 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${touched.correo && errors.correo ? 'border-red-400 focus:ring-red-300/50 focus:border-red-400' : 'border-gray-200 focus:ring-gray-300/50 focus:border-gray-300'}`}
                  placeholder={isComprador ? 'Email' : 'Email de contacto'}
                  autoComplete="email"
                />
              </div>
              {touched.correo && errors.correo && (
                <p className="text-xs text-red-500 mt-1 pl-1">{errors.correo}</p>
              )}
            </div>

            {/* Telefono */}
            <div>
              <div className="relative">
                <HiOutlinePhone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${iconColor}`} />
                <input
                  type="text"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full bg-gray-100 border rounded-xl py-3.5 pl-12 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${touched.telefono && errors.telefono ? 'border-red-400 focus:ring-red-300/50 focus:border-red-400' : 'border-gray-200 focus:ring-gray-300/50 focus:border-gray-300'}`}
                  placeholder={isComprador ? 'Telefono' : 'Telefono de contacto'}
                />
              </div>
              {touched.telefono && errors.telefono && (
                <p className="text-xs text-red-500 mt-1 pl-1">{errors.telefono}</p>
              )}
            </div>

            {/* Ciudad */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 pl-1">
                Ciudad *
              </label>
              <select
                name="id_ciudad"
                value={form.id_ciudad}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full bg-gray-100 border rounded-xl py-3.5 px-4 text-sm text-gray-800 focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${touched.id_ciudad && errors.id_ciudad ? 'border-red-400 focus:ring-red-300/50 focus:border-red-400' : 'border-gray-200 focus:ring-gray-300/50 focus:border-gray-300'}`}
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em' }}
              >
                <option value="">Selecciona tu ciudad</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              {touched.id_ciudad && errors.id_ciudad && (
                <p className="text-xs text-red-500 mt-1 pl-1">{errors.id_ciudad}</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <div className="relative">
                <HiOutlineLockClosed className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${iconColor}`} />
                <input
                  type={showPass ? 'text' : 'password'}
                  name="contrasena"
                  value={form.contrasena}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full bg-gray-100 border rounded-xl py-3.5 pl-12 pr-12 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${touched.contrasena && errors.contrasena ? 'border-red-400 focus:ring-red-300/50 focus:border-red-400' : 'border-gray-200 focus:ring-gray-300/50 focus:border-gray-300'}`}
                  placeholder="Contraseña"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                </button>
              </div>
              {touched.contrasena && errors.contrasena && (
                <p className="text-xs text-red-500 mt-1 pl-1">{errors.contrasena}</p>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <div className="relative">
                <HiOutlineLockClosed className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${iconColor}`} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmar"
                  value={form.confirmar}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full bg-gray-100 border rounded-xl py-3.5 pl-12 pr-12 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${touched.confirmar && errors.confirmar ? 'border-red-400 focus:ring-red-300/50 focus:border-red-400' : 'border-gray-200 focus:ring-gray-300/50 focus:border-gray-300'}`}
                  placeholder="Confirmar contraseña"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirm ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                </button>
              </div>
              {touched.confirmar && errors.confirmar && (
                <p className="text-xs text-red-500 mt-1 pl-1">{errors.confirmar}</p>
              )}
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={form.acceptTerms}
                onChange={handleChange}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-[#312c85] focus:ring-[#312c85]/30 cursor-pointer"
              />
              <span className="text-sm text-gray-600 leading-relaxed">
                Acepto los{' '}
                <button type="button" onClick={() => setTermsModal('terms')} className="font-bold underline underline-offset-2 hover:opacity-80 transition-opacity" style={{ color: accentColor }}>Terminos de Servicio</button>
                {' '}y la{' '}
                <button type="button" onClick={() => setTermsModal('privacy')} className="font-bold underline underline-offset-2 hover:opacity-80 transition-opacity" style={{ color: accentColor }}>Politica de Privacidad</button>
                {!isComprador && ' para vendedores'}
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              style={{ backgroundColor: accentColor }}
              onMouseEnter={(e) => { if (!e.target.disabled) e.target.style.opacity = '0.9'; }}
              onMouseLeave={(e) => { e.target.style.opacity = '1'; }}
            >
              {loading
                ? 'Registrando...'
                : isComprador
                  ? 'Crear Cuenta'
                  : 'Crear Cuenta de Vendedor'}
              {!loading && <HiOutlineArrowRight className="w-5 h-5" />}
            </button>
          </form>
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Ya tienes cuenta?{' '}
          <Link to="/login" className="font-bold text-gray-800 hover:text-[#312c85] transition-colors">
            Inicia sesion
          </Link>
        </p>
      </div>

      <TermsPrivacyModal
        open={!!termsModal}
        onClose={() => setTermsModal(null)}
        type={termsModal || 'terms'}
      />
    </div>
  );
}
