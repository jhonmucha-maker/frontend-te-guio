import { useNavigate, Link } from 'react-router-dom';
import { useState, useRef } from 'react';
import { useAuth } from '../../features/auth/useAuth';
import { buyerService } from '../../services/buyerService';
import {
  HiOutlineSearch,
  HiOutlineHeart,
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineQuestionMarkCircle,
  HiOutlineChevronRight,
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineShieldCheck,
  HiOutlineInformationCircle,
  HiOutlineChatAlt,
  HiOutlineCamera,
} from 'react-icons/hi';
import { HiOutlineChatBubbleLeftRight } from 'react-icons/hi2';
import logoImg from '../../assets/logo-Photoroom.png';
import { resolveFileUrl } from '../../utils/constants';
import { useAppVersion } from '../../hooks/useAppVersion';

export default function BuyerDashboard() {
  const { usuario, logout, syncUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const appVersion = useAppVersion();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('imagen', file);
    setUploading(true);
    try {
      await buyerService.uploadProfileImage(formData);
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

  const sections = [
    {
      title: 'TE GUÍO',
      items: [
        {
          label: 'Buscar Producto',
          subtitle: 'Encuentra lo que necesitas',
          icon: HiOutlineSearch,
          to: '/comprador/productos',
          bgColor: 'bg-blue-50',
          iconColor: 'text-blue-600',
        },
        {
          label: '¿Alguien vende...?',
          subtitle: 'Próximamente',
          icon: HiOutlineChatBubbleLeftRight,
          to: null,
          bgColor: 'bg-gray-100',
          iconColor: 'text-gray-400',
          disabled: true,
          hidden: true,
        },
        {
          label: 'Favoritos',
          subtitle: 'Tus productos favoritos',
          icon: HiOutlineHeart,
          to: '/comprador/favoritos',
          bgColor: 'bg-red-50',
          iconColor: 'text-red-400',
        },
        {
          label: 'Lista de compras',
          subtitle: 'Gestiona tu lista',
          icon: HiOutlineClipboardList,
          to: '/comprador/lista-compras',
          bgColor: 'bg-green-50',
          iconColor: 'text-green-600',
        },
        {
          label: 'Historial de listas',
          subtitle: 'Revisa tus compras anteriores',
          icon: HiOutlineClock,
          to: '/comprador/historial',
          bgColor: 'bg-purple-50',
          iconColor: 'text-purple-600',
        },
      ],
    },
    {
      title: 'AYUDA',
      items: [
        {
          label: 'Preguntas Frecuentes',
          subtitle: 'Resuelve tus dudas',
          icon: HiOutlineQuestionMarkCircle,
          to: '/comprador/preguntas-frecuentes',
          bgColor: 'bg-blue-50',
          iconColor: 'text-blue-600',
        },
        {
          label: 'Quejas y Sugerencias',
          subtitle: 'Envia tu opinion',
          icon: HiOutlineChatAlt,
          to: '/comprador/quejas',
          bgColor: 'bg-green-50',
          iconColor: 'text-green-600',
        },
      ],
    },
    {
      title: 'INFORMACIÓN',
      items: [
        {
          label: 'Acerca del aplicativo',
          subtitle: appVersion ? `Versión ${appVersion}` : 'Acerca del aplicativo',
          icon: HiOutlineInformationCircle,
          to: null,
          bgColor: 'bg-gray-100',
          iconColor: 'text-gray-500',
          disabled: true,
        },
        {
          label: 'Términos y Condiciones',
          subtitle: 'Politicas y terminos de uso',
          icon: HiOutlineShieldCheck,
          to: '/comprador/terminos',
          bgColor: 'bg-purple-50',
          iconColor: 'text-purple-600',
        },
      ],
    },
    {
      title: 'CUENTA',
      items: [
        {
          label: 'Configurar',
          subtitle: 'Edita tu perfil y preferencias',
          icon: HiOutlineCog,
          to: '/comprador/configuracion',
          bgColor: 'bg-blue-50',
          iconColor: 'text-blue-600',
        },
        {
          label: 'Cerrar sesión',
          subtitle: 'Salir de tu cuenta',
          icon: HiOutlineLogout,
          to: null,
          bgColor: 'bg-red-50',
          iconColor: 'text-red-500',
          action: handleLogout,
        },
      ],
    },
  ];

  const renderItem = (item, isLast) => {
    const content = (
      <>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${item.bgColor}`}>
          <item.icon className={`w-6 h-6 ${item.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold font-display ${item.disabled ? 'text-gray-400' : 'text-gray-900'}`}>
            {item.label}
          </p>
          <p className={`text-xs mt-0.5 ${item.disabled ? 'text-gray-300' : 'text-gray-400'}`}>
            {item.subtitle}
          </p>
        </div>
        <HiOutlineChevronRight className={`w-5 h-5 flex-shrink-0 ${item.disabled ? 'text-gray-200' : 'text-gray-300'}`} />
      </>
    );

    const baseClass = `px-4 py-3.5 flex items-center gap-4 ${!isLast ? 'border-b border-gray-100' : ''} ${
      item.disabled ? 'cursor-default' : 'hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer'
    }`;

    if (item.disabled && !item.action) {
      return (
        <div key={item.label} className={baseClass}>
          {content}
        </div>
      );
    }

    if (item.action) {
      return (
        <button key={item.label} onClick={item.action} className={`${baseClass} w-full text-left`}>
          {content}
        </button>
      );
    }

    return (
      <Link key={item.to} to={item.to} className={`${baseClass} block`}>
        {content}
      </Link>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Hero Header with Profile - full width edge to edge */}
      <div className="-mx-4 sm:-mx-6 -mt-4 mb-6">
        <div className="gradient-hero px-5 pt-5 pb-10 relative">
          {/* Circulos decorativos grandes y prominentes como en referencia */}
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
                {usuario?.nombre || 'Usuario'}
              </h1>
              <p className="text-white/60 text-[15px] mt-1 truncate">{usuario?.correo || ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      {sections.map((section, sIdx) => {
        const visibleItems = section.items.filter((item) => !item.hidden);
        return (
          <div key={section.title} className={`${sIdx < sections.length - 1 ? 'mb-6' : ''} animate-slide-up`}>
            <p className="section-title mb-3 px-1">{section.title}</p>
            <div className="bg-surface rounded-2xl shadow-card border border-gray-100/80 overflow-hidden">
              {visibleItems.map((item, iIdx) =>
                renderItem(item, iIdx === visibleItems.length - 1)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
