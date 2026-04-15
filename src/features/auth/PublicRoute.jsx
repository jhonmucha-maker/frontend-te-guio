import { Navigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { ROLE_ROUTES } from '../../utils/constants';

export function PublicRoute({ children }) {
  const { usuario, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isAuthenticated && usuario) {
    const redirectTo = ROLE_ROUTES[usuario.rol] || '/';
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
