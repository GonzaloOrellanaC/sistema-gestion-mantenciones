import React, { useState } from 'react';
import { IonButton, IonButtons, IonIcon } from '@ionic/react';
import { FieldProps } from './types';
import TextField from './TextField';
import ImageField from './ImageField';
import { closeOutline } from 'ionicons/icons';

interface Props extends FieldProps {
  dynamicLists?: Record<string, any[]>;
  setDynamicLists?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  onFileSelected?: (uid: string, file: File, forDynamicIndex?: number) => void;
}

const DynamicListField: React.FC<Props> = ({ uid, dynamicLists = {}, setDynamicLists, onFileSelected }) => {
  const items = dynamicLists[uid] || [];
  const [addingText, setAddingText] = useState(false);
  const [textVal, setTextVal] = useState('');

  const addText = () => {
    const newUid = `${uid}-item-${Date.now()}`;
    const next = [...items, { type: 'text', value: '', uid: newUid }];
    if (setDynamicLists) setDynamicLists(prev => ({ ...(prev || dynamicLists || {}), [uid]: next }));
    setTextVal('');
    setAddingText(false);
  };

  const openFileSelector = (id: string) => {
    const input = document.getElementById(`file-input-${id}`) as HTMLInputElement | null;
    input?.click();
  };

  const addImagePlaceholder = () => {
    const newUid = `${uid}-item-${Date.now()}`;
    const next = [...items, { type: 'image', value: '', uid: newUid }];
    if (setDynamicLists) setDynamicLists(prev => ({ ...(prev || dynamicLists || {}), [uid]: next }));
  };

  const onImageFileSelected = (itemUid: string, f: File) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      if (setDynamicLists) setDynamicLists(prev => {
        const list = (prev || dynamicLists)[uid] || [];
        return { ...(prev || dynamicLists || {}), [uid]: list.map((it: any) => it.uid === itemUid ? { ...it, value: data, name: f.name } : it) };
      });
    };
    reader.readAsDataURL(f);
  };

  return (
    <div>
      <div style={{ marginTop: 8 }}>
        {items.map((it, i) => {
          const itemUid = it.uid || `${uid}-legacy-${i}`;
          return (
            <div key={itemUid} style={{ marginBottom: 8 }}>
              {it.type === 'text' && it.uid ? (
                <div style={{ position: 'relative', paddingTop: 40, borderTop: '1px solid #ECEFF1', marginTop: 8 }}>
                  <IonButton fill={'clear'} size="small" style={{ position: 'absolute', top: 5, right: 0 }} onClick={() => {
                    if (setDynamicLists) setDynamicLists(prev => {
                      const list = (prev || dynamicLists)[uid] || [];
                      return { ...(prev || dynamicLists || {}), [uid]: list.filter((it2: any) => it2.uid !== itemUid) };
                    });
                  }}>
                    <IonIcon slot='icon-only' icon={closeOutline} />
                  </IonButton>
                  <TextField field={{ placeholder: 'Texto' } as any} uid={itemUid} values={{ [itemUid]: it.value }} setValues={(updater: any) => {
                    const current = it.value || '';
                    let newVal: any;
                    if (typeof updater === 'function') {
                      const res = updater({ [itemUid]: current });
                      newVal = res[itemUid];
                    } else if (typeof updater === 'object') {
                      newVal = updater[itemUid];
                    } else {
                      newVal = updater;
                    }
                    if (setDynamicLists) setDynamicLists(prev => {
                      const list = (prev || dynamicLists)[uid] || [];
                      return { ...(prev || dynamicLists || {}), [uid]: list.map((it2: any) => it2.uid === itemUid ? { ...it2, value: newVal } : it2) };
                    });
                  }} />
                </div>
              ) : it.type === 'text' ? (
                <div style={{ position: 'relative', paddingTop: 8, borderTop: '1px solid #ECEFF1', marginTop: 8 }}>
                  <IonButton fill={'clear'} size="small" style={{ position: 'absolute', top: 5, right: 0 }} onClick={() => {
                    if (setDynamicLists) setDynamicLists(prev => {
                      const list = (prev || dynamicLists)[uid] || [];
                      return { ...(prev || dynamicLists || {}), [uid]: list.filter((it2: any) => it2.uid !== itemUid) };
                    });
                  }}>
                    <IonIcon slot='icon-only' icon={closeOutline} />
                  </IonButton>
                  <div>{it.value}</div>
                </div>
              ) : null}

              {it.type === 'image' && it.uid ? (
                <div>
                  <div style={{ position: 'relative', paddingTop: 8, borderTop: '1px solid #ECEFF1', marginTop: 8 }}>
                    <IonButton fill={'clear'} size="small" style={{ position: 'absolute', top: 5, right: 0 }} onClick={() => {
                      if (setDynamicLists) setDynamicLists(prev => {
                        const list = (prev || dynamicLists)[uid] || [];
                        return { ...(prev || dynamicLists || {}), [uid]: list.filter((it2: any) => it2.uid !== itemUid) };
                      });
                    }}>
                      <IonIcon slot='icon-only' icon={closeOutline} />
                    </IonButton>
                    <div>
                      <ImageField field={{} as any} uid={itemUid} photos={{ [itemUid]: it.value || '' }} openCamera={() => {}} onFileSelected={(u, f) => onImageFileSelected(itemUid, f)} />
                    </div>
                  </div>
                </div>
              ) : it.type === 'image' ? (
                <div style={{ position: 'relative', paddingTop: 8, borderTop: '1px solid #ECEFF1', marginTop: 8 }}>
                  <IonButton fill={'clear'} size="small" style={{ position: 'absolute', top: 5, right: 0 }} onClick={() => {
                    if (setDynamicLists) setDynamicLists(prev => {
                      const list = (prev || dynamicLists)[uid] || [];
                      return { ...(prev || dynamicLists || {}), [uid]: list.filter((it2: any) => it2.uid !== itemUid) };
                    });
                  }}>
                    <IonIcon slot='icon-only' icon={closeOutline} />
                  </IonButton>
                  <div>
                    <img src={it.value} alt="dyn" style={{ maxWidth: '100%' }} />
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <input id={`file-input-${uid}`} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f && onFileSelected) onFileSelected(uid, f); }} />

      <div style={{ marginBottom: 8 }}>
        <IonButtons>
          <IonButton size="small" className='pill-button' onClick={() => addText()}>
            <span className="pill-button-text">+ Texto</span>
          </IonButton>

          <IonButton size="small" className='pill-button' onClick={() => addImagePlaceholder()}>
            <span className="pill-button-text">+ Imagen</span>
          </IonButton>
        </IonButtons>
      </div>
    </div>
  );
};

export default DynamicListField;
