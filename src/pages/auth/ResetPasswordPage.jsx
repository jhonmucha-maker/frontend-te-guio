import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import {
  HiOutlineLockClosed,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineEye,
  HiOutlineEyeOff,
} from 'react-icons/hi';
import { HiOutlineShieldCheck } from 'react-icons/hi2';

const PASSWORD_RULES = [
  { key: 'length', label: 'Al menos 6 caracteres', test: (p) => p.length >= 6 },
  { key: 'upper', label: 'Una letra mayuscula', test: (p) => /[A-Z]/.test(p) },
  { key: 'number', label: 'Un numero', test: (p) => /\d/.test(p) },
];

function PasswordStrength({ password }) {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const total = PASSWORD_RULES.length;
  const percent = total > 0 ? (passed / total) * 100 : 0;

  const strengthColor =
    percent <= 33
      ? 'bg-red-400'
      : percent <= 66
        ? 'bg-amber-400'
        : 'bg-emerald-400';

  const strengthLabel =
    percent <= 33 ? 'Debil' : percent <= 66 ? 'Media' : 'Fuerte';

  if (!password) return null;

  return (
    <div className="space-y-2.5 animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">Seguridad</span>
        <span
          className={`text-xs font-bold ${percent <= 33 ? 'text-red-500' : percent <= 66 ? 'text-amber-500' : 'text-emerald-500'}`}
        >
          {strengthLabel}
        </span>
      </div>
      <div className="flex gap-1.5">
        {PASSWORD_RULES.map((_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden transition-all duration-500"
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${i < passed ? strengthColor : ''}`}
              style={{ width: i < passed ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>
      <ul className="space-y-1">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <li
              key={rule.key}
              className={`flex items-center gap-2 text-xs transition-colors duration-300 ${ok ? 'text-emerald-500' : 'text-gray-400'}`}
            >
              <span
                className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-bold transition-all duration-300 ${ok ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}
              >
                {ok ? '\u2713' : '\u2022'}
              </span>
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({ contrasena: '', confirmar: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(!token);

  const allRulesPass = useMemo(
    () => PASSWORD_RULES.every((r) => r.test(form.contrasena)),
    [form.contrasena],
  );

  const passwordsMatch = useMemo(
    () => form.contrasena && form.confirmar && form.contrasena === form.confirmar,
    [form.contrasena, form.confirmar],
  );

  const canSubmit = allRulesPass && passwordsMatch && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.contrasena || !form.confirmar) {
      toast.error('Complete ambos campos');
      return;
    }
    if (!allRulesPass) {
      toast.error('La contraseña no cumple los requisitos');
      return;
    }
    if (form.contrasena !== form.confirmar) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(token, form.contrasena);
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al restablecer';
      if (msg.toLowerCase().includes('token') || msg.toLowerCase().includes('expirado')) {
        setTokenError(true);
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Token missing state
  if (tokenError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#4a44a8] via-[#312c85] to-[#1f1b5c] px-4 pb-safe-bottom relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-white/5 rounded-full" />

        <div className="w-full max-w-md relative z-10 animate-fade-in">
          <div className="bg-surface rounded-3xl shadow-2xl p-8 text-center animate-slide-up">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
              <HiOutlineExclamationCircle className="w-9 h-9 text-red-500" />
            </div>
            <h2 className="text-xl font-display font-bold text-gray-900 mb-2">
              Enlace invalido
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Este enlace de recuperacion no es valido o ya expiro. Solicita uno nuevo desde la aplicacion.
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-2 bg-[#312c85] text-white font-semibold py-3 px-6 rounded-xl hover:bg-[#4a44a8] transition-all shadow-md"
            >
              Solicitar nuevo enlace
            </Link>
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-[#312c85] font-medium transition-colors mt-4"
            >
              <HiOutlineArrowLeft className="w-4 h-4" />
              Volver al inicio de sesion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#4a44a8] via-[#312c85] to-[#1f1b5c] px-4 pb-safe-bottom relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-white/5 rounded-full" />

        <div className="w-full max-w-md relative z-10 animate-fade-in">
          <div className="bg-surface rounded-3xl shadow-2xl p-8 text-center animate-slide-up">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-full mb-4">
              <HiOutlineCheckCircle className="w-9 h-9 text-emerald-500" />
            </div>
            <h2 className="text-xl font-display font-bold text-gray-900 mb-2">
              Contraseña actualizada
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Tu contraseña se ha restablecido correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-[#312c85] text-white font-semibold py-3 px-6 rounded-xl hover:bg-[#4a44a8] transition-all shadow-md"
            >
              Iniciar sesion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#4a44a8] via-[#312c85] to-[#1f1b5c] px-4 pb-safe-bottom relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/3 -translate-y-1/4" />
      <div className="absolute top-1/4 right-0 w-56 h-56 bg-white/5 rounded-full translate-x-1/4" />
      <div className="absolute bottom-20 left-10 w-32 h-32 bg-white/8 rounded-full" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Icon + Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/15 backdrop-blur-sm rounded-full mb-4 border-2 border-white/20 shadow-lg relative">
            <HiOutlineShieldCheck className="w-10 h-10 text-white" />
            {/* Circular shield decoration */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 80 80"
              fill="none"
              style={{ animation: 'spin 12s linear infinite' }}
            >
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="white"
                strokeWidth="1.5"
                strokeDasharray="6 8"
                opacity="0.3"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-display font-bold text-white">
            Nueva Contraseña
          </h1>
          <p className="text-white/60 mt-2 text-sm leading-relaxed max-w-xs mx-auto">
            Crea una contraseña segura para proteger tu cuenta
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-3xl shadow-2xl p-7 animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nueva contraseña
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#312c85]/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.contrasena}
                  onChange={(e) =>
                    setForm({ ...form, contrasena: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-11 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#312c85]/20 focus:border-[#312c85]/40 transition-all"
                  placeholder="Ingresa tu nueva contraseña"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-[#312c85] transition-colors"
                >
                  {showPassword ? (
                    <HiOutlineEyeOff className="w-5 h-5" />
                  ) : (
                    <HiOutlineEye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Password strength */}
            <PasswordStrength password={form.contrasena} />

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Confirmar contraseña
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#312c85]/40" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmar}
                  onChange={(e) =>
                    setForm({ ...form, confirmar: e.target.value })
                  }
                  className={`w-full bg-gray-50 border rounded-xl py-3 pl-11 pr-11 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#312c85]/20 transition-all ${
                    form.confirmar
                      ? passwordsMatch
                        ? 'border-emerald-300 focus:border-emerald-400'
                        : 'border-red-300 focus:border-red-400'
                      : 'border-gray-200 focus:border-[#312c85]/40'
                  }`}
                  placeholder="Repite tu nueva contraseña"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-[#312c85] transition-colors"
                >
                  {showConfirm ? (
                    <HiOutlineEyeOff className="w-5 h-5" />
                  ) : (
                    <HiOutlineEye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {form.confirmar && !passwordsMatch && (
                <p className="text-xs text-red-500 mt-1.5 animate-fade-in">
                  Las contraseñas no coinciden
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-[#312c85] hover:bg-[#4a44a8] text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg mt-2"
            >
              {loading ? (
                <>
                  <svg
                    className="w-5 h-5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="opacity-25"
                    />
                    <path
                      d="M4 12a8 8 0 018-8"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  Actualizando...
                </>
              ) : (
                <>
                  <HiOutlineShieldCheck className="w-5 h-5" />
                  Restablecer contraseña
                </>
              )}
            </button>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-[#312c85] font-medium transition-colors py-2"
            >
              <HiOutlineArrowLeft className="w-4 h-4" />
              Volver al inicio de sesion
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
