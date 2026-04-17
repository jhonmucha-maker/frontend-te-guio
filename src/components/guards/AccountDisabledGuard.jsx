import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';
import { useSSEListener } from '../../hooks/useSSEListener';
import { SSE_EVENTS } from '../../utils/constants';
import AccountDisabledModal from '../ui/AccountDisabledModal';

export default function AccountDisabledGuard() {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleAccountDisabled = useCallback((data) => {
    setMessage(data?.message || 'Tu cuenta ha sido inhabilitada por un administrador');
    setShow(true);
  }, []);

  useSSEListener(SSE_EVENTS.ACCOUNT_DISABLED, handleAccountDisabled);

  const handleAccept = async () => {
    setShow(false);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <AccountDisabledModal
      open={show}
      onAccept={handleAccept}
      message={message}
    />
  );
}
