import { Link } from 'react-router-dom';
import { HiOutlineShieldExclamation } from 'react-icons/hi';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-primary-radial px-4 relative overflow-hidden">
      {/* Decorative floating circles */}
      <div className="absolute top-20 left-16 w-48 h-48 bg-white/5 rounded-full blur-sm" />
      <div className="absolute bottom-24 right-14 w-36 h-36 bg-white/5 rounded-full" />
      <div className="absolute top-1/3 right-1/3 w-20 h-20 bg-white/10 rounded-full animate-float" />

      <div className="text-center relative z-10 animate-fade-in">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-sm rounded-3xl mb-6 ring-4 ring-white/10">
          <HiOutlineShieldExclamation className="w-12 h-12 text-coral-400" />
        </div>
        <h1 className="text-3xl font-display font-bold text-white mb-3">
          Acceso denegado
        </h1>
        <p className="text-white/60 mb-8 max-w-sm mx-auto font-sans">
          No tiene permisos para acceder a esta pagina.
        </p>
        <Link to="/login" className="inline-block bg-surface text-primary-600 font-semibold py-2.5 px-8 rounded-xl shadow-elevated hover:bg-gray-50 transition-all duration-200 hover:shadow-lg active:scale-[0.98]">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
