import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';
import { IonModal, IonContent, IonButton, IonIcon, IonFooter, IonToolbar } from '@ionic/react';
import './NotificationContext.scss';
import AppButton from '../components/Widgets/Button.widget';

type NotifyOptions = {
  title?: string;
  message?: string;
  okText?: string;
};

type ConfirmOptions = NotifyOptions & {
  cancelText?: string;
};

type NotificationContextType = {
  notify: (ok: boolean, opts?: NotifyOptions) => Promise<void>;
  confirm: (opts?: ConfirmOptions) => Promise<boolean>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [visibleNotify, setVisibleNotify] = useState(false);
  const [notifyState, setNotifyState] = useState<{ ok: boolean; title?: string; message?: string; okText?: string } | null>(null);
  const notifyResolver = useRef<(() => void) | null>(null);

  const [visibleConfirm, setVisibleConfirm] = useState(false);
  const [confirmState, setConfirmState] = useState<{ title?: string; message?: string; okText?: string; cancelText?: string } | null>(null);

  const notify = (ok: boolean, opts?: NotifyOptions) => {
    return new Promise<void>((resolve) => {
      setNotifyState({ ok, title: opts?.title, message: opts?.message, okText: opts?.okText });
      notifyResolver.current = () => {
        resolve();
      };
      setVisibleNotify(true);
    });
  };

  const confirm = (opts?: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ title: opts?.title, message: opts?.message, okText: opts?.okText, cancelText: opts?.cancelText });
      setVisibleConfirm(true);

      const handleOk = () => {
        setVisibleConfirm(false);
        setConfirmState(null);
        resolve(true);
      };

      const handleCancel = () => {
        setVisibleConfirm(false);
        setConfirmState(null);
        resolve(false);
      };

      // Store handlers on window to be used by buttons (simple approach)
      (window as any).__notifyOk = handleOk;
      (window as any).__notifyCancel = handleCancel;
    });
  };

  return (
    <NotificationContext.Provider value={{ notify, confirm }}>
      {children}

      <IonModal isOpen={visibleNotify} onDidDismiss={() => {
        setVisibleNotify(false);
        if (notifyResolver.current) {
          notifyResolver.current();
          notifyResolver.current = null;
        }
        setNotifyState(null);
      }} className="notification-modal">
        <IonContent className="ion-padding">
          <div className="notification-body">
            <div className="notification-icon">
              {notifyState?.ok ? (
                <img src="/assets/check.svg" alt="ok" />
              ) : (
                <img src="/assets/exclamation.svg" alt="error" />
              )}
            </div>
            <div className="notification-text">
              <h3>{notifyState?.title}</h3>
              <p>{notifyState?.message}</p>
            </div>
          </div>
        </IonContent>
        <IonFooter className='ion-no-border'>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }} slot='end'>
              <AppButton style={{width: 80}} onClick={() => {
                setVisibleNotify(false);
              }}>
                {notifyState?.okText || 'OK'}
              </AppButton>
            </div>
        </IonFooter>
      </IonModal>

      <IonModal backdropDismiss={false} isOpen={visibleConfirm} onDidDismiss={() => setVisibleConfirm(false)} className="notification-modal">
        <IonContent className="ion-padding">
          <div className="notification-body">
            <div className="notification-icon">
              <img src="/assets/exclamation.svg" alt="confirm" />
            </div>
            <div className="notification-text">
              <h3>{confirmState?.title || 'Confirm'}</h3>
              <p>{confirmState?.message}</p>
            </div>
          </div>
        </IonContent>
        <IonFooter className='ion-no-border'>
            <IonToolbar>
                <div style={{ marginRight: 16, display: 'flex', gap: 8 }} slot='end'>
                    <AppButton style={{minWidth: 80}} expand="block" onClick={() => { (window as any).__notifyCancel && (window as any).__notifyCancel(); }}>
                        {confirmState?.cancelText || 'Cancel'}
                    </AppButton>
                    <AppButton style={{minWidth: 80}} expand="block" onClick={() => { (window as any).__notifyOk && (window as any).__notifyOk(); }}>
                        {confirmState?.okText || 'OK'}
                    </AppButton>
                </div>
            </IonToolbar>
        </IonFooter>
      </IonModal>
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
};

export default NotificationContext;
