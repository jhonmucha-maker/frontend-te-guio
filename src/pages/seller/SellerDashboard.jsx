import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';
import { sellerService } from '../../services/sellerService';
import { ticketService } from '../../services/ticketService';
import {
  HiOutlineOfficeBuilding,
  HiOutlineCube,
  HiOutlineCreditCard,
  HiOutlineChatAlt2,
  HiOutlineQuestionMarkCircle,
  HiOutlineUser,
  HiOutlineCamera,
} from 'react-icons/hi';
import { resolveFileUrl } from '../../utils/constants';

export default function SellerDashboard() {
  const { usuario, syncUser } = useAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({
    stores: 0,
    products: 0,
    subscriptions: 0,
    tickets: 0,
  });

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const load = async () => {
      try {
        const [stores, products, subs, tix] = await Promise.allSettled([
          sellerService.getMyStores({ signal }),
          sellerService.getMyProducts(undefined, { signal }),
          sellerService.getMySubscriptions({ signal }),
          ticketService.getMyTickets(undefined, { signal }),
        ]);
        const subsData = subs.status === 'fulfilled' ? (subs.value.data?.data || subs.value.data || []) : [];
        setStats({
          stores: stores.status === 'fulfilled' ? (stores.value.data?.data || stores.value.data || []).length : 0,
          products: products.status === 'fulfilled' ? (products.value.data?.data || products.value.data || []).length : 0,
          subscriptions: subsData.filter(s => s.estado === 'APROBADO').length,
          tickets: tix.status === 'fulfilled' ? (tix.value.data?.data || tix.value.data || []).length : 0,
        });
      } catch {}
    };
    load();
    return () => controller.abort();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('imagen', file);
    setUploading(true);
    try {
      await sellerService.uploadProfileImage(formData);
      await syncUser();
    } catch (err) {
      console.error('Error subiendo imagen:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const avatarUrl = usuario?.imagen_perfil
    ? resolveFileUrl(usuario.imagen_perfil)
    : null;

  const cards = [
    { label: 'Mis Tiendas', icon: HiOutlineOfficeBuilding, to: '/vendedor/tiendas', count: stats.stores, color: 'bg-primary-50 text-primary-600' },
    { label: 'Mis Productos', icon: HiOutlineCube, to: '/vendedor/productos', count: stats.products, color: 'bg-primary-50 text-primary-600' },
    { label: 'Suscripciones', icon: HiOutlineCreditCard, to: '/vendedor/suscripciones', count: stats.subscriptions, color: 'bg-warning-50 text-warning-600' },
    { label: 'Quejas y Sugerencias', icon: HiOutlineChatAlt2, to: '/vendedor/quejas', count: stats.tickets, color: 'bg-primary-50 text-primary-600' },
    { label: 'Preguntas Frecuentes', icon: HiOutlineQuestionMarkCircle, to: '/vendedor/preguntas-frecuentes', count: null, color: 'bg-primary-50 text-primary-600' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero greeting section - flush with navbar */}
      <div className="-mx-4 sm:-mx-6 -mt-4 mb-8">
        <div className="gradient-hero px-5 pt-5 pb-10 relative overflow-hidden">
          {/* Circulos decorativos */}
          <div className="absolute top-[-25%] left-[-20%] w-[65%] h-[170%] rounded-full bg-white/[0.10]" />
          <div className="absolute top-[5%] right-[-25%] w-[60%] h-[150%] rounded-full bg-white/[0.08]" />
          <div className="absolute bottom-[-50%] left-[15%] w-[50%] h-[120%] rounded-full bg-white/[0.06]" />

          {/* Seccion de perfil */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleImageUpload}
          />
          <div className="relative z-10 flex items-center gap-5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="relative w-[82px] h-[82px] rounded-full bg-white/[0.18] flex items-center justify-center flex-shrink-0 cursor-pointer group"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Perfil" className="w-full h-full rounded-full object-cover" />
              ) : (
                <HiOutlineUser className="w-10 h-10 text-white/80" />
              )}
              <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <HiOutlineCamera className="w-6 h-6 text-white" />
              </div>
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
            <div className="min-w-0">
              <h1 className="text-[28px] font-bold text-white font-display leading-tight">
                {usuario?.nombre || 'Vendedor'}
              </h1>
              <p className="text-white/60 text-[15px] mt-1">Panel de vendedor</p>
            </div>
          </div>
        </div>
      </div>


      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="stat-card group hover:shadow-card-hover transition-all duration-300 rounded-2xl"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color} mb-3 group-hover:scale-110 transition-transform duration-300`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{card.label}</p>
              {card.count !== null ? (
                <p className="text-3xl font-display font-bold text-primary-600">{card.count}</p>
              ) : (
                <p className="text-sm font-semibold text-primary-600 mt-1">Ver</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
