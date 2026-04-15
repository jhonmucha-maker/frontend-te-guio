import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import {
  HiOutlineLockClosed,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import { HiOutlinePaperAirplane } from 'react-icons/hi2';

export default function ForgotPasswordPage() {
  const [correo, setCorreo] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!correo) {
      toast.error('Ingrese su correo');
      return;
    }
    setLoading(true);
    try {
      await authService.forgotPassword(correo);
      setSent(true);
      toast.success('Revise su correo para recuperar su contraseña');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al procesar solicitud');
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

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Icon + Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/15 backdrop-blur-sm rounded-full mb-4 border-2 border-white/20 shadow-lg relative">
            <HiOutlineLockClosed className="w-10 h-10 text-white" />
            {/* Circular arrow decorations */}
            <svg className="absolute inset-0 w-full h-full animate-spin-slow" viewBox="0 0 80 80" fill="none">
              <path d="M 60 15 A 30 30 0 0 1 65 40" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
              <path d="M 60 15 L 65 10 M 60 15 L 55 10" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
              <path d="M 20 65 A 30 30 0 0 1 15 40" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
              <path d="M 20 65 L 15 70 M 20 65 L 25 70" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-display font-bold text-white">
            Recuperar Contraseña
          </h1>
          <p className="text-white/60 mt-2 text-sm leading-relaxed max-w-xs mx-auto">
            Te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-3xl shadow-2xl p-7 animate-slide-up">
          {sent ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-4">
                <HiOutlineCheckCircle className="w-9 h-9 text-green-500" />
              </div>
              <h3 className="text-lg font-display font-bold text-gray-900 mb-2">
                Correo enviado!
              </h3>
              <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                Si el correo está registrado, recibirá un enlace para restablecer su contraseña.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-[#312c85] text-white font-semibold py-3 px-6 rounded-xl hover:bg-[#4a44a8] transition-all shadow-md"
              >
                <HiOutlineArrowLeft className="w-4 h-4" />
                Volver al login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-display font-bold text-gray-900 mb-1">
                Ingresa tu correo
              </h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Ingresa el correo asociado a tu cuenta y te enviaremos las instrucciones.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl py-3.5 px-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#312c85]/20 focus:border-[#312c85]/40 transition-all"
                  placeholder="Correo electronico"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#312c85] hover:bg-[#4a44a8] text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  <HiOutlinePaperAirplane className="w-5 h-5" />
                  {loading ? 'Enviando...' : 'Enviar enlace'}
                </button>

                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-[#312c85] font-medium transition-colors py-2"
                >
                  <HiOutlineArrowLeft className="w-4 h-4" />
                  Volver al inicio de sesion
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
