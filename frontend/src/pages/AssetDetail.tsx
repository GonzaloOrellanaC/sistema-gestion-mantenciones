import React, { useEffect, useState } from 'react';
import { RouteComponentProps, useHistory } from 'react-router-dom';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/react';
import assetsApi from '../api/assets';

type Props = RouteComponentProps<{ id: string }>;

const AssetDetail: React.FC<Props> = ({ match }) => {
  const [asset, setAsset] = useState<any | null>(null);
  const history = useHistory();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await assetsApi.getAsset(match.params.id);
        if (!mounted) return;
        setAsset(res);
      } catch (e) {
        console.error('failed loading asset', e);
      }
    }
    load();
    return () => { mounted = false; };
  }, [match.params.id]);

  if (!asset) return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Activo</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">Cargando...</IonContent>
    </IonPage>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{asset.name}</IonTitle>
          <IonButton slot="end" onClick={() => history.push(`/assets/${asset._id}/edit`)}>Editar</IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h3>{asset.serial || ''}</h3>
        <p><strong>Marca:</strong> {asset.brandId ? (asset.brandId.name || asset.brandId) : '-'}</p>
        <p><strong>Modelo:</strong> {asset.modelId ? (asset.modelId.name || asset.modelId) : '-'}</p>
        <p><strong>Tipo:</strong> {asset.typeId ? (asset.typeId.name || asset.typeId) : '-'}</p>
        <p><strong>Sucursal:</strong> {asset.branchId ? (asset.branchId.name || asset.branchId) : '-'}</p>
        <p><strong>Notas:</strong> {asset.notes || '-'}</p>
      </IonContent>
    </IonPage>
  );
};

export default AssetDetail;
