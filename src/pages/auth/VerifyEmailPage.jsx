import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import { HiOutlineMail } from 'react-icons/hi';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [correo, setCorreo] = useState(location.state?.correo || '');
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!correo || !codigo) {
      toast.error('Complete todos los campos');
      return;
    }
    setLoading(true);
    try {
      await authService.verifyEmail(correo, codigo);
      toast.success('Email verificado exitosamente');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Codigo invalido');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!correo) {
      toast.error('Ingrese su correo');
      return;
    }
    setResending(true);
    try {
      await authService.resendCode(correo);
      toast.success('Codigo reenviado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al reenviar');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-primary-radial px-4 pb-safe-bottom relative overflow-hidden">
      {/* Decorative floating circles */}
      <div className="absolute top-10 right-14 w-48 h-48 bg-white/5 rounded-full blur-sm" />
      <div className="absolute bottom-16 left-10 w-40 h-40 bg-white/5 rounded-full" />
      <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-white/10 rounded-full animate-float" />
      <div className="absolute bottom-1/3 right-20 w-14 h-14 bg-white/10 rounded-full animate-float" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 gradient-primary rounded-2xl mb-4 shadow-lg ring-4 ring-white/20">
            <HiOutlineMail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white">
            Verificar correo
          </h1>
          <p className="text-white/60 mt-1 font-sans">
            Ingrese el codigo que le enviamos
          </p>
        </div>

        <div className="bg-surface rounded-3xl shadow-elevated p-7 animate-slide-up">
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Correo electronico
              </label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="input-field pl-11 rounded-xl"
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Codigo de verificacion
              </label>
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="input-field text-center text-2xl tracking-[0.3em] font-bold rounded-xl border-2 focus:border-primary-500"
                placeholder="000000"
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full rounded-xl text-base"
            >
              {loading ? 'Verificando...' : 'Verificar'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-100 text-center">
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors disabled:opacity-50"
            >
              {resending ? 'Reenviando...' : 'Reenviar codigo'}
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-white/70 mt-6">
          <Link
            to="/login"
            className="text-white font-semibold hover:text-white/90 underline underline-offset-2 transition-colors"
          >
            Volver al inicio de sesion
          </Link>
        </p>
      </div>
    </div>
  );
}
