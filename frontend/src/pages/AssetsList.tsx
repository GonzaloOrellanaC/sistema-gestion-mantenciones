import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonHeader, IonToolbar, IonContent, IonButton, IonToast, IonTitle } from '@ionic/react';
import assetsApi from '../api/assets';
import type { } from '../api/types';

const AssetsList: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const history = useHistory();

  const load = async () => {
    setLoading(true);
    try {
      const res = await assetsApi.listAssets({});
      setItems(res.items || []);
    } catch (err: any) {
      console.error(err);
      setToast({ show: true, message: 'Error cargando activos' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar style={{padding: '0px 10px'}}>
            <IonTitle>Activos</IonTitle>
            <div style={{ color: 'var(--text-secondary)' }}>Lista de equipos y activos</div>
            <IonButton slot='end' onClick={() => history.push('/assets/new')}>Crear Activo</IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">

        <div className="table-container">
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Serial</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Tipo</th>
                <th>Sucursal</th>
                <th>Ubicación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map(a => (
                <tr key={a._id} style={{ cursor: 'pointer' }} onClick={() => history.push(`/assets/${a._id}/edit`)}>
                  <td>{a.name}</td>
                  <td>{a.serial || '-'}</td>
                  <td>{a.brandId ? (a.brandId.name || a.brandId) : '-'}</td>
                  <td>{a.modelId ? (a.modelId.name || a.modelId) : '-'}</td>
                  <td>{a.typeId ? (a.typeId.name || a.typeId) : '-'}</td>
                  <td>{a.branchId ? (a.branchId.name || a.branchId) : '-'}</td>
                  <td>{a.location || '-'}</td>
                  <td><IonButton size="small" fill="clear" onClick={(e:any) => { e.stopPropagation(); history.push(`/assets/${a._id}/edit`); }}>Editar</IonButton></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <IonToast isOpen={toast.show} message={toast.message} duration={2000} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default AssetsList;
