import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../features/auth/useAuth';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { usuario } = useAuth();

  // Inicializar push notifications para el usuario autenticado
  usePushNotifications(usuario);

  return (
    <div className="min-h-screen bg-surface-alt">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="lg:ml-64 p-4 sm:p-6 pt-4 animate-fade-in" style={{ paddingBottom: 'calc(1.5rem + var(--android-nav-h, 0px))' }}>
        <Outlet />
      </main>
    </div>
  );
}
