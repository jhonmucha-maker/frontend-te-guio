import { useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../services/apiClient';

// Determinar el endpoint de push segun el rol del usuario
const getPushEndpoint = (rol) => {
  switch (rol) {
    case 'VENDEDOR': return '/seller/push';
    case 'ADMINISTRADOR': return '/admin/push';
    default: return '/me/push';
  }
};

// Detectar plataforma dinamicamente
const getDevicePlatform = () => {
  const platform = Capacitor.getPlatform();
  if (platform === 'ios') return 'IOS';
  if (platform === 'android') return 'ANDROID';
  return 'WEB';
};

export function usePushNotifications(usuario) {
  const registeredRef = useRef(false);
  const navigate = useNavigate();
  const usuarioIdRef = useRef(null);

  const registerTokenInBackend = useCallback(async (token, rol) => {
    try {
      const endpoint = getPushEndpoint(rol);
      await apiClient.post(`${endpoint}/register`, {
        token_dispositivo: token,
        plataforma: getDevicePlatform(),
      });
    } catch (error) {
      console.error('[Push] Error registrando token en backend:', error);
    }
  }, []);

  const handleNotificationNavigation = useCallback((data) => {
    if (!data?.event_type) return;

    const type = data.event_type;
    const rol = usuario?.rol;

    if (type.startsWith('ticket.')) {
      if (rol === 'ADMINISTRADOR') navigate('/admin/quejas');
      else if (rol === 'VENDEDOR') navigate('/vendedor/quejas');
      else navigate('/comprador/quejas');
    } else if (type === 'product.price.changed') {
      if (data.product_id) navigate(`/comprador/productos/${data.product_id}`);
    } else if (type.startsWith('approval.')) {
      if (rol === 'VENDEDOR') navigate('/vendedor/dashboard');
    } else if (type.startsWith('subscription.')) {
      if (rol === 'VENDEDOR') navigate('/vendedor/suscripciones');
      else if (rol === 'ADMINISTRADOR') navigate('/admin/suscripciones');
    } else if (type.startsWith('admin.')) {
      if (rol === 'ADMINISTRADOR') navigate('/admin/dashboard');
    }
  }, [usuario, navigate]);

  useEffect(() => {
    // Solo ejecutar en plataforma nativa y si hay usuario autenticado
    if (!Capacitor.isNativePlatform() || !usuario?.id) return;

    // Si cambia el usuario, resetear para re-registrar
    if (usuarioIdRef.current !== usuario.id) {
      registeredRef.current = false;
      usuarioIdRef.current = usuario.id;
    }

    if (registeredRef.current) return;

    let listenersAdded = false;

    const setupPush = async () => {
      try {
        // Verificar permisos
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.log('[Push] Permisos no concedidos');
          return;
        }

        // Listener: token de registro exitoso
        await PushNotifications.addListener('registration', async (token) => {
          console.log('[Push] Token recibido:', token.value);
          localStorage.setItem('pushToken', token.value);
          await registerTokenInBackend(token.value, usuario.rol);
        });

        // Listener: error de registro
        await PushNotifications.addListener('registrationError', (error) => {
          console.error('[Push] Error de registro:', error);
        });

        // Listener: notificacion recibida con app abierta (foreground)
        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('[Push] Notificacion recibida:', notification);
          toast(notification.body || notification.title || 'Nueva notificacion', {
            duration: 2000,
          });
        });

        // Listener: usuario toco la notificacion
        await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('[Push] Accion realizada:', action);
          handleNotificationNavigation(action.notification?.data);
        });

        listenersAdded = true;

        // Crear canal de notificaciones para Android
        if (Capacitor.getPlatform() === 'android') {
          try {
            await PushNotifications.createChannel({
              id: 'teguio-general',
              name: 'Te Guio',
              description: 'Notificaciones generales de Te Guio',
              importance: 4,
              visibility: 1,
              sound: 'default',
              vibration: true,
            });
          } catch (err) {
            console.error('[Push] Error creando canal:', err);
          }
        }

        // Registrar el dispositivo con FCM
        await PushNotifications.register();
        registeredRef.current = true;
      } catch (error) {
        console.error('[Push] Error en setup:', error);
      }
    };

    setupPush();

    return () => {
      if (listenersAdded) {
        PushNotifications.removeAllListeners();
      }
    };
  }, [usuario, registerTokenInBackend, handleNotificationNavigation]);
}
