import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';
import { ROLE_ROUTES } from '../../utils/constants';
import toast from 'react-hot-toast';
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineLogin,
  HiOutlineShieldCheck,
  HiOutlineUser,
  HiOutlineBriefcase,
} from 'react-icons/hi';
import logoImg from '../../assets/logo-Photoroom.png';
import TermsPrivacyModal from '../../components/ui/TermsPrivacyModal';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ correo: '', contrasena: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [termsModal, setTermsModal] = useState(null); // 'terms' | 'privacy' | null

  const quickAccess = [
    { label: 'Admin', correo: 'admin@marketplace.pe', contrasena: '123456', icon: HiOutlineShieldCheck, color: 'text-coral-600 bg-coral-50 border-coral-200 hover:bg-coral-100' },
    { label: 'Comprador', correo: 'comprador@marketplace.pe', contrasena: '123456', icon: HiOutlineUser, color: 'text-primary-600 bg-primary-50 border-primary-200 hover:bg-primary-100' },
    { label: 'Vendedor', correo: 'vendedor@marketplace.pe', contrasena: '123456', icon: HiOutlineBriefcase, color: 'text-seller-500 bg-seller-50 border-seller-200 hover:bg-seller-100' },
  ];

  const handleQuickAccess = (creds) => {
    setForm({ correo: creds.correo, contrasena: creds.contrasena });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.correo || !form.contrasena) {
      toast.error('Complete todos los campos');
      return;
    }
    setLoading(true);
    try {
      const data = await login(form.correo, form.contrasena);
      toast.success('Bienvenido');
      const route = ROLE_ROUTES[data.usuario.rol] || '/';
      navigate(route, { replace: true });
    } catch (err) {
      console.error('[LOGIN DEBUG]', {
        message: err.message,
        code: err.code,
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.baseURL + err.config?.url,
      });
      const msg = err.response?.data?.error || 'Error al iniciar sesion';
      toast.error(msg);
      if (err.response?.data?.requireVerification) {
        navigate('/verify-email', { state: { correo: form.correo } });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#4a44a8] via-[#312c85] to-[#1f1b5c] px-4 pb-safe-bottom relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/3 -translate-y-1/4" />
      <div className="absolute top-1/4 right-0 w-56 h-56 bg-white/5 rounded-full translate-x-1/4" />
      <div className="absolute bottom-20 left-10 w-32 h-32 bg-white/8 rounded-full" />
      <div className="absolute bottom-1/3 right-1/4 w-20 h-20 bg-white/5 rounded-full" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo + Branding */}
        <div className="text-center mb-6">
          <div className="inline-block mb-3">
            <img
              src={logoImg}
              alt="Te Guio"
              className="w-28 h-28 mx-auto object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Te Guio
          </h1>
          <p className="text-white/70 mt-2 text-base">
            Encuentra tus productos con facilidad y confianza.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-surface rounded-3xl shadow-2xl px-7 pt-8 pb-7 animate-slide-up">
          <h2 className="text-2xl font-display font-bold text-gray-900 text-center mb-1">
            Bienvenido!
          </h2>
          <p className="text-gray-400 text-sm text-center mb-7">
            Inicia sesion para continuar
          </p>

          {/* Quick access (dev only) */}
          {import.meta.env.DEV && (
            <>
              <div className="mb-5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 text-center">Acceso rapido</p>
                <div className="grid grid-cols-3 gap-2">
                  {quickAccess.map((qa) => (
                    <button
                      key={qa.label}
                      type="button"
                      onClick={() => handleQuickAccess(qa)}
                      className={`flex flex-col items-center gap-1 py-2 px-2 rounded-xl border text-[11px] font-semibold transition-all duration-200 hover:scale-[1.02] ${qa.color}`}
                    >
                      <qa.icon className="w-4 h-4" />
                      {qa.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-100 mb-5" />
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#312c85]/50" />
              <input
                type="email"
                name="correo"
                value={form.correo}
                onChange={handleChange}
                className="w-full bg-gray-100 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#312c85]/20 focus:border-[#312c85]/40 transition-all"
                placeholder="Email"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#312c85]/50" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="contrasena"
                value={form.contrasena}
                onChange={handleChange}
                className="w-full bg-gray-100 border border-gray-200 rounded-xl py-3.5 pl-12 pr-12 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#312c85]/20 focus:border-[#312c85]/40 transition-all"
                placeholder="Contraseña"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <HiOutlineEyeOff className="w-5 h-5" />
                ) : (
                  <HiOutlineEye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Forgot password */}
            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-[#312c85] hover:text-[#4a44a8] font-medium transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#312c85]/70 hover:bg-[#312c85]/85 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? 'Ingresando...' : 'Iniciar Sesion'}
              {!loading && <HiOutlineLogin className="w-5 h-5" />}
            </button>
          </form>
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-white/80 mt-6">
          No tienes cuenta?{' '}
          <Link
            to="/register"
            className="text-white font-bold hover:text-white/90 transition-colors"
          >
            Registrate
          </Link>
        </p>

        {/* Terms */}
        <p className="text-center text-xs text-white/50 mt-3 leading-relaxed">
          Al continuar, aceptas nuestros{' '}
          <button type="button" onClick={() => setTermsModal('terms')} className="text-white/70 font-semibold underline underline-offset-2 hover:text-white transition-colors">Terminos de Servicio</button>{' '}
          y{' '}
          <button type="button" onClick={() => setTermsModal('privacy')} className="text-white/70 font-semibold underline underline-offset-2 hover:text-white transition-colors">Politica de Privacidad</button>
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
