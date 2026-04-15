import { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../../services/authService';
import { ROLES } from '../../utils/constants';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const saved = localStorage.getItem('usuario');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  const syncUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUsuario(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await authService.getMe();
      const user = data.usuario;
      setUsuario(user);
      localStorage.setItem('usuario', JSON.stringify(user));
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('usuario');
      setUsuario(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncUser();
  }, [syncUser]);

  const login = async (correo, contrasena) => {
    const { data } = await authService.login(correo, contrasena);
    localStorage.setItem('token', data.token);
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    return data;
  };

  const logout = async () => {
    try {
      const pushToken = localStorage.getItem('pushToken');
      await authService.logout(pushToken);
    } catch {
      // silently ignore
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('usuario');
    localStorage.removeItem('pushToken');
    setUsuario(null);
  };

  const isRole = (role) => usuario?.rol === role;
  const isAdmin = () => isRole(ROLES.ADMINISTRADOR);
  const isSeller = () => isRole(ROLES.VENDEDOR);
  const isBuyer = () => isRole(ROLES.COMPRADOR);

  const hasPermission = (codigo) => {
    if (!usuario?.permisos) return false;
    return usuario.permisos.includes(codigo);
  };

  const value = {
    usuario,
    loading,
    login,
    logout,
    syncUser,
    isRole,
    isAdmin,
    isSeller,
    isBuyer,
    hasPermission,
    isAuthenticated: !!usuario,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
