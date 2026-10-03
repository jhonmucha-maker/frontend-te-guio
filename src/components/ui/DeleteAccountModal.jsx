import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineExclamation, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import Modal from './Modal';
import { authService } from '../../services/authService';
import { useAuth } from '../../features/auth/useAuth';

// Eliminacion de cuenta por el propio comprador/vendedor (requisito App Store 5.1.1(v)).
// El backend ya cierra sesiones y dispositivos push, por eso aqui solo se limpia la sesion local.
export default function DeleteAccountModal({ open, onClose, isSeller = false }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [contrasena, setContrasena] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleClose = () => {
    if (deleting) return;
    setContrasena('');
    setShowPassword(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!contrasena) {
      toast.error('Ingresa tu contraseña para confirmar');
      return;
    }
    setDeleting(true);
    try {
      await authService.deleteAccount(contrasena);
      await logout({ skipServer: true });
      navigate('/login', { replace: true });
      toast.success('Tu cuenta fue eliminada');
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo eliminar la cuenta');
      setDeleting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Eliminar cuenta" maxWidth="max-w-sm">
      <div className="space-y-4">
        <div className="flex gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
          <HiOutlineExclamation className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">
            {isSeller
              ? 'Se eliminarán tu cuenta, tus tiendas y tus productos, y tu plan activo dejará de estar vigente.'
              : 'Se eliminará tu cuenta y ya no podrás iniciar sesión con ella.'}{' '}
            Esta acción no se puede deshacer.
          </p>
        </div>

        <div>
          <label className="text-xs text-gray-500 font-medium">Contraseña</label>
          <div className="relative mt-1">
            <input
              type={showPassword ? 'text' : 'password'}
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 pr-10 focus:ring-2 focus:ring-red-400 focus:border-red-400 focus:outline-none"
              placeholder="Ingresa tu contraseña para confirmar"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={handleClose}
            disabled={deleting}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Eliminando...' : 'Eliminar cuenta'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
