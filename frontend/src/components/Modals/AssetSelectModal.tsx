import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar, IonList, IonItem, IonLabel, IonCheckbox, IonFooter, IonButton } from '@ionic/react';
import { useStylingContext } from '../../context/StylingContext';
import './Modal.css';
import assetsApi from '../../api/assets';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  assets?: any[];
  initialSelected?: string[];
  onConfirm: (ids: string[]) => void;
};

const AssetSelectModal: React.FC<Props> = ({ isOpen, onClose, assets, initialSelected = [], onConfirm }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([...initialSelected]);
  const { buttonCancel } = useStylingContext();
  const [remoteItems, setRemoteItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);

  const usingRemote = typeof assets === 'undefined';

  const baseItems = (usingRemote ? remoteItems : (assets || []));
  const filtered = baseItems.filter(a => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (a.name && a.name.toLowerCase().includes(q)) || (a.serial && String(a.serial).toLowerCase().includes(q));
  });
  // compute pagination for local lists and enforce maximum of `limit` items per page
  const totalFiltered = filtered.length;
  const computedPages = Math.max(1, Math.ceil(totalFiltered / limit));

  useEffect(() => {
    // when using remote, backend will set total/pages; for local lists compute them here
    if (!usingRemote) {
      setTotal(totalFiltered);
      setPages(computedPages);
    }
    // reset page to 1 when query or asset source changes
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usingRemote, totalFiltered, computedPages]);

  const startIndex = (page - 1) * limit;
  const displayed = filtered.slice(startIndex, startIndex + limit);

  useEffect(() => {
    if (!usingRemote) return;
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res: any = await assetsApi.listAssets({ page, limit, name: query });
        if (!mounted) return;
        setRemoteItems(res.items || []);
        setTotal(res.total || 0);
        setPages(res.pages || 1);
      } catch (e) {
        console.warn('Failed loading assets for modal', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [usingRemote, page, limit, query]);

  return (
    <IonModal className='modal-info' isOpen={isOpen} onWillPresent={() => (document.activeElement as HTMLElement | null)?.blur()} onDidDismiss={onClose}>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonTitle>{t('assetSelect.title')}</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar value={query} onIonChange={(e) => setQuery(e.detail.value ?? '')} placeholder={t('assetSelect.searchPlaceholder')} />
        </IonToolbar>
      </IonHeader>
      <IonContent className='ion-padding'>
        <IonList>
          {displayed.map(a => (
            <IonItem key={a._id} button onClick={() => {
              const id = String(a._id);
              if (selected.includes(id)) setSelected(prev => prev.filter(x => x !== id));
              else setSelected(prev => [...prev, id]);
            }}>
              <IonLabel>
                <div style={{ fontWeight: 600 }}>{a.name}</div>
                <div style={{ fontSize: 12, color: '#607D8B' }}>{a.serial || ''}</div>
              </IonLabel>
              <IonCheckbox slot="end" checked={selected.includes(String(a._id))} onIonChange={() => { /* handled by item click */ }} />
            </IonItem>
          ))}
        </IonList>
      </IonContent>
      <IonFooter>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IonButton disabled={page <= 1 || loading} onClick={() => setPage(p => Math.max(1, p - 1))}>{t('lists.prev')}</IonButton>
              <div style={{ fontSize: 14 }}>{t('assets.pagination', { page, pages, total })}</div>
              <IonButton disabled={page >= pages || loading} onClick={() => setPage(p => Math.min(pages, p + 1))}>{t('lists.next')}</IonButton>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <IonButton style={buttonCancel} onClick={onClose}>{t('assetSelect.cancel')}</IonButton>
              <IonButton onClick={() => { onConfirm(selected); onClose(); }}>{t('assetSelect.confirm', { count: selected.length })}</IonButton>
            </div>
          </div>
      </IonFooter>
    </IonModal>
  );
};

export default AssetSelectModal;
