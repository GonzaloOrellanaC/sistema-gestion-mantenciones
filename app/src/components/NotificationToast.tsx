import React, { useEffect, useState } from 'react';
import { IonToast } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { Haptics, NotificationType } from '@capacitor/haptics';

const NotificationToast: React.FC = () => {
  const { latestNotification, clearLatestNotification } = useAuth() as any;
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (latestNotification) {
      const msg = latestNotification.message || 'Nueva notificación';
      setMessage(msg);
      setShow(true);

      // Haptic feedback (best-effort)
      try {
        Haptics.notification({ type: NotificationType.Success });
      } catch (e) {
        // ignore if not supported
      }
    }
  }, [latestNotification]);

  return (
    <IonToast
      isOpen={show}
      message={message}
      duration={5000}
      onDidDismiss={() => {
        setShow(false);
        clearLatestNotification && clearLatestNotification();
      }}
    />
  );
};

export default NotificationToast;
