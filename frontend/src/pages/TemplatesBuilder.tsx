import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { IonPage, IonContent, IonButton, IonText, IonCheckbox, IonPopover, IonList, IonItem, IonLabel, IonIcon, IonSearchbar, IonHeader, IonToolbar, IonTitle, IonFooter, IonButtons, IonModal, IonInput } from '@ionic/react';
import { chevronBackOutline, starOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { DndProvider } from 'react-dnd';
import DraggableItem from '../components/Templates/DraggableItem';
import CanvasDrop from '../components/Templates/CanvasDrop';
import { createFieldFromType, FieldType, Field, ICON_MAP } from '../components/Templates/builderHelpers';
import { HTML5Backend } from 'react-dnd-html5-backend';
import '../styles/login.css';
import '../styles/builder.css';
// Swiper integration was considered; using simple paginator for now.
import * as templatesApi from '../api/templates';
import PartSelectModal from '../components/Modals/PartSelectModal';
import SupplySelectModal from '../components/Modals/SupplySelectModal';
import AssetSelectModal from '../components/Modals/AssetSelectModal';
import assetsApi from '../api/assets';
import * as templateTypesApi from '../api/templateTypes';

const PALETTE: { type: FieldType; labelKey: string }[] = [
  { type: 'text', labelKey: 'templates.builder.palette.text' },
  { type: 'textarea', labelKey: 'templates.builder.palette.textarea' },
  { type: 'number', labelKey: 'templates.builder.palette.number' },
  { type: 'columns', labelKey: 'templates.builder.palette.columns' },
  { type: 'select', labelKey: 'templates.builder.palette.select' },
  { type: 'checkbox', labelKey: 'templates.builder.palette.checkbox' },
  { type: 'radio', labelKey: 'templates.builder.palette.radio' },
  { type: 'image', labelKey: 'templates.builder.palette.image' },
  { type: 'dynamic_list', labelKey: 'templates.builder.palette.dynamic_list' },
  { type: 'signature', labelKey: 'templates.builder.palette.signature' },
  { type: 'geo', labelKey: 'templates.builder.palette.geo' },
  { type: 'date', labelKey: 'templates.builder.palette.date' },
  { type: 'file', labelKey: 'templates.builder.palette.file' },
  { type: 'parts', labelKey: 'templates.builder.palette.parts' },
  { type: 'supplies', labelKey: 'templates.builder.palette.supplies' },
  { type: 'division', labelKey: 'templates.builder.palette.division' },
];

const TemplatesBuilder: React.FC = () => {
  const { t } = useTranslation();
  const [components, setComponents] = useState<Field[]>([]);
  const [pageTitles, setPageTitles] = useState<Record<number, string>>({});
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [assetsList, setAssetsList] = useState<any[]>([]);
  const [assignedAssets, setAssignedAssets] = useState<string[]>([]);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetQuery, setAssetQuery] = useState('');
  const [modalSelectedAssets, setModalSelectedAssets] = useState<string[]>([]);
  const [partModalOpen, setPartModalOpen] = useState(false);
  const [supplyModalOpen, setSupplyModalOpen] = useState(false);
  const [templateTypes, setTemplateTypes] = useState<any[]>([]);
  const [templateTypeId, setTemplateTypeId] = useState<string | null>(null);
  const [typesPopoverEvent, setTypesPopoverEvent] = useState<MouseEvent | undefined>(undefined);
  const [typesPopoverOpen, setTypesPopoverOpen] = useState(false);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  // favorites popover state (moved to parent so children can call setFavEvent via callbacks)
  const [favEvent, setFavEvent] = useState<MouseEvent | undefined>(undefined);
  const [favOpen, setFavOpen] = useState(false);
  const [favLabel, setFavLabel] = useState<string | null>(null);
  
  const [favType, setFavType] = useState<FieldType | null>(null);
  const [favorites, setFavorites] = useState<Array<{ type: FieldType; label: string }>>(() => {
    try {
      const raw = localStorage.getItem('templates_builder_favorites');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  const persistFavorites = (list: Array<{ type: FieldType; label: string }>) => {
    try {
      localStorage.setItem('templates_builder_favorites', JSON.stringify(list));
    } catch (e) {
      console.warn('Could not persist favorites', e);
    }
  };
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [deviceView, setDeviceView] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const history = useHistory();
  const params = useParams<{ id?: string }>();
  const isEditMode = !!params?.id;

  const saveTemplate = useCallback(async () => {
        if (!name.trim()) {
      setMessage(t('templates.builder.messages.nameRequired'));
      return;
    }
    setSaving(true);
    setMessage(null);
    const structure = { display: 'form', components, pageTitles };
    try {
      const payload: any = { name: name.trim(), description, structure, assignedAssets };
      if (templateTypeId) payload.templateTypeId = templateTypeId;
      if (isEditMode && params.id) {
        // try to update existing template
        if (typeof templatesApi.updateTemplate === 'function') {
          await templatesApi.updateTemplate(params.id, payload);
        } else {
          // fallback: call create (will create a new one) but inform user
          await templatesApi.createTemplate(payload);
        }
        setMessage(t('templates.builder.messages.updated'));
      } else {
        await templatesApi.createTemplate(payload);
        setMessage(t('templates.builder.messages.saved'));
      }
      // navigate back to templates list after successful save
      history.push('/templates');
    } catch (err: unknown) {
      console.error(err);
      type ErrWithResponse = { response?: { data?: { message?: string } } };
      const msg = (err as ErrWithResponse)?.response?.data?.message ?? t('templates.builder.messages.saveError');
      setMessage(msg);
    } finally {
      setSaving(false);
    }
  }, [name, description, components, history, isEditMode, params?.id, assignedAssets]);

  // Load template when in edit mode
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!isEditMode || !params.id) return;
      setLoading(true);
      try {
        const res: any = await templatesApi.getTemplate(params.id);
        // Expecting shape { _id, name, description, structure }
        if (!mounted) return;
        if (res) {
          setName(res.name || '');
          setDescription(res.description || '');
          if (res.structure && Array.isArray(res.structure.components)) {
            setComponents(res.structure.components);
            setPageTitles(res.structure.pageTitles || {});
          } else if (res.structure && res.structure.components) {
            setComponents(res.structure.components || []);
            setPageTitles(res.structure.pageTitles || {});
          }
          // assignedAssets may be populated objects or ids
          if (Array.isArray(res.assignedAssets)) {
            setAssignedAssets(res.assignedAssets.map((a: any) => (typeof a === 'string' ? a : (a && a._id) ? String(a._id) : '')));
          }
          if (res.templateTypeId) {
            setTemplateTypeId(String(res.templateTypeId));
          }
        }
        } catch (e) {
        console.error('Error loading template', e);
        setMessage(t('templates.builder.messages.loadError'));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    // load assets list for selector
    (async () => {
      try {
        const ares: any = await assetsApi.listAssets({ limit: 1000 });
        if (mounted) setAssetsList(ares.items || []);
      } catch (e) {
        console.warn('failed loading assets', e);
      }
    })();
    // load template types
    (async () => {
      try {
        const tres: any = await templateTypesApi.listTemplateTypes();
        if (mounted) setTemplateTypes(tres.items || []);
      } catch (e) {
        console.warn('failed loading template types', e);
      }
    })();
    return () => { mounted = false; };
  }, [isEditMode, params?.id]);

  const deleteField = (key: string) => {
    setComponents((prev) => prev.filter((p) => p.key !== key));
    if (selectedKey === key) setSelectedKey(null);
  };

  const moveItem = (from: number, to: number) => {
    setComponents((prev) => {
      const copy = [...prev];
      if (from < 0 || to < 0 || from >= copy.length || to >= copy.length) return prev;
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
  };

  const addFieldToColumn = (parentKey: string, colIndex: number, field: Field) => {
    setComponents((prev) => prev.map((f) => {
      if (f.key !== parentKey) return f;
      const children = (f.children && Array.isArray(f.children)) ? f.children.map((arr) => [...arr]) : [[], []];
      children[colIndex] = [...(children[colIndex] || []), field];
      return { ...f, children };
    }));
  };

  const deleteNestedField = (parentKey: string, colIndex: number, childKey: string) => {
    setComponents((prev) => prev.map((f) => {
      if (f.key !== parentKey) return f;
      const children = (f.children && Array.isArray(f.children)) ? f.children.map((arr) => [...arr]) : [[], []];
      children[colIndex] = (children[colIndex] || []).filter(ch => ch.key !== childKey);
      return { ...f, children };
    }));
  };

  const onSelect = (key: string) => {
    setSelectedKey(key);
  };

  // find a field by key searching top-level and nested children (columns)
  const findFieldByKey = (list: Field[], key?: string | null): Field | null => {
    if (!key) return null;
    for (const f of list) {
      if (f.key === key) return f;
      if (f.children && Array.isArray(f.children)) {
        for (const col of f.children) {
          const found = col.find((ch) => ch.key === key);
          if (found) return found;
        }
      }
    }
    return null;
  };

  // update a field by key, searching recursively through children arrays
  const updateFieldDeep = (arr: Field[], key: string, prop: string, value: unknown): Field[] => {
    return arr.map((f) => {
      if (f.key === key) return { ...f, [prop]: value };
      if (f.children && Array.isArray(f.children)) {
        const newChildren = f.children.map((col) => updateFieldDeep(col, key, prop, value));
        return { ...f, children: newChildren };
      }
      return f;
    });
  };

  const updateFieldProperty = (key: string, prop: string, value: unknown) => {
    setComponents((prev) => updateFieldDeep(prev, key, prop, value));
  };

  const selectedField = useMemo(() => findFieldByKey(components, selectedKey), [components, selectedKey]);

  const handleDeviceChange = (d: 'mobile' | 'tablet' | 'desktop') => {
    setDeviceView(d);
  };

  const togglePreviewMode = (v?: boolean) => {
    setIsPreviewMode((prev) => {
      const next = typeof v === 'boolean' ? v : !prev;
      if (next) setSelectedKey(null);
      return next;
    });
  };

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <IonPage>
          <IonHeader className='ion-no-border'>
            <IonToolbar style={{paddingRight: 10}}>
              <IonButton color={'dark'} slot='start' fill='clear' onClick={() => history.push('/templates')}>
                <IonIcon icon={chevronBackOutline} slot="icon-only" />
              </IonButton>
              <IonTitle style={{marginLeft: 10}}>
                {isEditMode ? t('templates.builder.editTitle') : t('templates.builder.createTitle')}
              </IonTitle>
              <IonButtons slot="end">
                <IonButton 
                  className={`btn-icon ${deviceView === 'mobile' ? 'active' : ''}`} 
                  onClick={() => handleDeviceChange('mobile')}>
                    <i className="fas fa-mobile-alt" />
                </IonButton>
                <IonButton 
                  className={`btn-icon ${deviceView === 'tablet' ? 'active' : ''}`} 
                  onClick={() => handleDeviceChange('tablet')}>
                    <i className="fas fa-tablet-alt" />
                </IonButton>
                <IonButton 
                  className={`btn-icon ${deviceView === 'desktop' ? 'active' : ''}`} 
                  onClick={() => handleDeviceChange('desktop')}>
                    <i className="fas fa-desktop" />
                </IonButton>
              </IonButtons>
              <IonCheckbox style={{width: 100}} labelPlacement={'end'} slot='end' checked={isPreviewMode} onIonChange={(ev) => togglePreviewMode(ev.detail.checked)}>
                {isPreviewMode ? t('templates.builder.previewMode.on') : t('templates.builder.previewMode.off')}
              </IonCheckbox>
              <IonButton slot='end' style={{marginLeft: 10}} onClick={saveTemplate} disabled={saving || loading || !name.trim()}><i className="fas fa-save" /> {t('templates.builder.save')}</IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div className="builder-wrapper">
              <div className="builder-container">
                  <div className="toolbox" style={{ opacity: isPreviewMode ? 0.5 : 1, pointerEvents: isPreviewMode ? 'none' : 'all' }}>
                  <div style={{ fontWeight: 800, marginBottom: 12 }}>{t('templates.builder.components')}</div>
                  {/* Palette sorted by label for easier discovery */}
                    {/* Favorites list (persisted) */}
                      {favorites.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>{t('templates.builder.favorites.title', { max: 5 })}</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                          {favorites.map((f, idx) => (
                            <DraggableItem key={`fav_${idx}_${f.label}`} type={f.type} label={f.label} onQuickAdd={(ftype) => {
                              const newField = createFieldFromType(ftype, t);
                              setComponents((prev) => [...prev, newField]);
                              // keep builder in Edit mode after quick-add
                              setIsPreviewMode(false);
                            }} onOpenFavorite={(ev, t, label) => {
                              // open popover to confirm (user must press Accept)
                              setFavEvent(ev);
                              setFavOpen(true);
                              setFavLabel(label);
                              setFavType(t);
                            }} />
                          ))}
                          <button className="btn btn-link" onClick={() => { setFavorites([]); persistFavorites([]); setMessage(t('templates.builder.favorites.cleared')); }}>{t('templates.builder.favorites.clearButton')}</button>
                        </div>
                        <div
                          style={{
                            marginTop: 10,
                            width: '100%',
                            borderBottom: '1px solid #ccc'
                          }}
                        />
                      </div>
                    )}

                    {[...PALETTE].sort((a, b) => t(a.labelKey).localeCompare(t(b.labelKey), 'es')).map((p) => (
                      <DraggableItem
                        key={`${p.type}_${p.labelKey}`}
                        type={p.type}
                        label={t(p.labelKey)}
                        isFavorite={favorites.some((f) => f.type === p.type)}
                        onQuickAdd={(ftype) => {
                          // quick add: create field and keep builder in Edit mode
                          const newField = createFieldFromType(ftype, t);
                          setComponents((prev) => [...prev, newField]);
                          // ensure we remain in Edit mode after quick-add
                          setIsPreviewMode(false);
                        }}
                        onOpenFavorite={(ev, ftype, label) => {
                          // open popover to confirm adding to favorites
                          setFavEvent(ev);
                          setFavOpen(true);
                          setFavLabel(label);
                          setFavType(ftype);
                        }}
                      />
                    ))}
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 12, display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: 6 }}>{t('templates.builder.labels.name')} <span style={{ color: '#C62828' }}>*</span></label>
                      <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: 6 }}>{t('templates.builder.labels.description')}</label>
                      <input className="form-control" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: 6 }}>{t('templates.builder.labels.assignedAssets')}</label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <IonButton onClick={() => { setModalSelectedAssets([...assignedAssets]); setAssetQuery(''); setAssetModalOpen(true); }}>
                          {t('templates.builder.actions.selectAssets', { count: assignedAssets.length })}
                        </IonButton>
                        <div style={{ color: '#607D8B' }}>{assignedAssets.length > 0 ? t('templates.builder.messages.assetsSelected', { count: assignedAssets.length }) : t('templates.builder.none')}</div>
                      </div>
                    </div>
                  </div>
                  <AssetSelectModal
                    isOpen={assetModalOpen}
                    onClose={() => setAssetModalOpen(false)}
                    assets={assetsList}
                    initialSelected={modalSelectedAssets}
                    onConfirm={(ids) => { setAssignedAssets([...ids]); }}
                  />
                  

                  <CanvasDrop components={components} setComponents={setComponents} onSelect={onSelect} selectedKey={selectedKey ?? undefined} isPreview={isPreviewMode} deleteField={deleteField} deviceView={deviceView} moveItem={moveItem} pageTitles={pageTitles} setPageTitles={setPageTitles} addFieldToColumn={addFieldToColumn} deleteNestedField={deleteNestedField} updateFieldProperty={updateFieldProperty} />

                  {message && <div style={{ paddingTop: 8 }}><IonText color="primary">{message}</IonText></div>}

                  {/* Favorites popover (triggered by right-click on toolbox items) */}
                  <IonPopover event={favEvent} isOpen={favOpen} onDidDismiss={() => setFavOpen(false)}>
                    <IonItem lines="none" button onClick={() => {
                        if (favType && favLabel) {
                          // enforce maximum of 5 favorites
                            if (favorites.length >= 5) {
                            setMessage(t('templates.builder.favorites.maxReached', { max: 5 }));
                          } else {
                            setFavorites((prev) => {
                              const exists = prev.some((x) => x.type === favType && x.label === favLabel);
                              if (exists) return prev;
                              const next = [...prev, { type: favType, label: favLabel }];
                              persistFavorites(next);
                              return next;
                            });
                            setMessage(t('templates.builder.favorites.added'));
                          }
                        }
                        setFavOpen(false);
                      }}>
                      <IonLabel>
                        <h2><IonIcon icon={starOutline} /> {t('templates.builder.favorites.addToFavorites')}</h2>
                      </IonLabel>
                    </IonItem>
                  </IonPopover>
                </div>
                      
                  <div className="properties-panel" style={{ opacity: isPreviewMode ? 0.5 : 1, pointerEvents: isPreviewMode ? 'none' : 'all' }}>
                    <div style={{ marginBottom: 8 }}>
                      <IonButton size="small" onClick={(ev) => { setTypesPopoverEvent(ev.nativeEvent); setTypesPopoverOpen(true); }}>{t('templates.builder.templateTypes.title')}</IonButton>
                      <span style={{ display: 'inline-block', marginLeft: 8, color: '#607D8B' }}>{templateTypeId ? (templateTypes.find(tt => String(tt._id) === String(templateTypeId))?.name || '') : t('templates.builder.templateTypes.none')}</span>
                    </div>
                  <div className="prop-header">{t('templates.builder.properties.title')}</div>
                  <div className="prop-body">
                    {!selectedField ? (
                      <div className="prop-empty">
                        <i className="fas fa-mouse-pointer" style={{ fontSize: 36, color: '#90A4AE' }} />
                        <div style={{ marginTop: 12 }}>{t('templates.builder.selectFieldPrompt')}</div>
                      </div>
                    ) : (
                      <div>
                        {selectedField.isDesign ? (
                          <div className="prop-group">
                            <label>{t('templates.builder.properties.designComponent')}</label>
                            <div style={{ fontSize: 13, color: '#607D8B' }}>{t('templates.builder.properties.designNote')}</div>
                          </div>
                        ) : (
                          <div className="prop-group">
                            <label>{t('templates.builder.properties.label')}</label>
                            <input className="form-control" value={selectedField.label ?? ''} onChange={(e) => updateFieldProperty(selectedField.key, 'label', e.target.value)} />
                          </div>
                        )}
                        <div className="prop-group">
                          <label>{t('templates.builder.properties.required')}</label>
                          <input type="checkbox" checked={!!selectedField.required} onChange={(e) => updateFieldProperty(selectedField.key, 'required', e.target.checked)} />
                        </div>
                        {selectedField.type === 'parts' && (
                          <div className="prop-group">
                            <label>{t('templates.builder.properties.partsIncluded')}</label>
                            <div>
                              <button className="btn btn-secondary" onClick={() => setPartModalOpen(true)}>
                                {(Array.isArray(selectedField.parts) && selectedField.parts.length > 0) ? selectedField.parts[0].name : t('templates.builder.actions.selectParts')}
                              </button>
                              {(Array.isArray(selectedField.parts) && selectedField.parts.length > 0) ? (
                                <div style={{ marginTop: 8 }}>
                                  <label style={{ fontSize: 12, color: '#607D8B' }}>{t('templates.builder.properties.totalQty')}</label>
                                  <input
                                    type="number"
                                    min={1}
                                    className="form-control"
                                    style={{ width: 120, marginTop: 4 }}
                                    value={selectedField.parts[0].qty ?? selectedField.parts[0].quantity ?? 1}
                                    onChange={(e) => {
                                      const v = Math.max(1, Number(e.target.value) || 1);
                                      const next = [...(selectedField.parts || [])];
                                      next[0] = { ...next[0], qty: v };
                                      updateFieldProperty(selectedField.key, 'parts', next);
                                    }}
                                  />
                                </div>
                              ) : null}
                            </div>
                          </div>
                        )}
                        {selectedField.type === 'supplies' && (
                          <div className="prop-group">
                            <label>{t('templates.builder.properties.suppliesIncluded')}</label>
                            <div>
                              <button className="btn btn-secondary" onClick={() => setSupplyModalOpen(true)}>
                                {(Array.isArray(selectedField.supplies) && selectedField.supplies.length > 0) ? selectedField.supplies[0].name : t('templates.builder.actions.selectSupplies')}
                              </button>
                              {(Array.isArray(selectedField.supplies) && selectedField.supplies.length > 0) ? (
                                <div style={{ marginTop: 8 }}>
                                  <label style={{ fontSize: 12, color: '#607D8B' }}>{t('templates.builder.properties.qty')}</label>
                                  <input
                                    type="number"
                                    min={1}
                                    className="form-control"
                                    style={{ width: 120, marginTop: 4 }}
                                    value={selectedField.supplies[0].qty ?? selectedField.supplies[0].quantity ?? 1}
                                    onChange={(e) => {
                                      const v = Math.max(1, Number(e.target.value) || 1);
                                      const next = [...(selectedField.supplies || [])];
                                      next[0] = { ...next[0], qty: v };
                                      updateFieldProperty(selectedField.key, 'supplies', next);
                                    }}
                                  />
                                </div>
                              ) : null}
                            </div>
                          </div>
                        )}
                        {selectedField.type === 'select' && (
                          <div className="prop-group">
                            <label>{t('templates.builder.properties.options')}</label>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                              <input id="newOpt" className="form-control" placeholder={t('templates.builder.placeholders.addOption')} />
                              <button className="btn btn-secondary" onClick={() => {
                                const el = document.getElementById('newOpt') as HTMLInputElement | null;
                                const val = el?.value?.trim();
                                if (val) {
                                  const opts = Array.isArray(selectedField.options) ? [...selectedField.options, val] : [val];
                                  updateFieldProperty(selectedField.key, 'options', opts);
                                  if (el) el.value = '';
                                }
                              }}>{t('templates.builder.actions.add')}</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {Array.isArray(selectedField.options) && selectedField.options.map((o: string, idx: number) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>{o}</div>
                                  <button className="btn btn-secondary" onClick={() => {
                                    const opts = (selectedField.options ?? []).filter((_: string, i: number) => i !== idx);
                                    updateFieldProperty(selectedField.key, 'options', opts);
                                  }}>{t('templates.builder.actions.remove')}</button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Page title editor for the page that contains the selected field */}
                        {selectedField && (() => {
                          const findTopLevelIndex = (key: string) => {
                            for (let i = 0; i < components.length; i++) {
                              const p = components[i];
                              if (p.key === key) return i;
                              if (p.children && Array.isArray(p.children)) {
                                for (const col of p.children) {
                                  if (col.find((ch) => ch.key === key)) return i;
                                }
                              }
                            }
                            return -1;
                          };
                          const idx = findTopLevelIndex(selectedField.key);
                          if (idx >= 0) {
                            const pageIndex = components.slice(0, idx).filter((p) => p.type === 'division').length;

                            // find the division field that ends this page (the pageIndex-th division)
                            let divKey: string | null = null;
                            let divCount = 0;
                            for (let i = 0; i < components.length; i++) {
                              if (components[i].type === 'division') {
                                if (divCount === pageIndex) {
                                  divKey = components[i].key;
                                  break;
                                }
                                divCount++;
                              }
                            }

                              const currentTitle = (() => {
                              if (divKey) {
                                const divField = components.find((c) => c.key === divKey) as any;
                                if (divField && typeof divField.pageTitle === 'string' && divField.pageTitle.trim()) return divField.pageTitle;
                              }
                              return pageTitles[pageIndex] ?? t('templates.builder.pageDefault', { num: pageIndex + 1 });
                            })();

                            return (
                              <div className="prop-group">
                                <label>{t('templates.builder.properties.pageTitle')}</label>
                                <input className="form-control" value={currentTitle} onChange={(e) => {
                                  const v = e.target.value;
                                  if (divKey) {
                                    updateFieldProperty && updateFieldProperty(divKey, 'pageTitle', v);
                                  } else {
                                    setPageTitles((prev) => ({ ...prev, [pageIndex]: v }));
                                  }
                                }} />
                              </div>
                            );
                          }
                          return null;
                        })()}

                        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                          <button className="btn-icon" title={t('templates.builder.actions.moveUp')} onClick={() => {
                            const idx = components.findIndex((p) => p.key === selectedField.key);
                            if (idx > 0) {
                              moveItem(idx, idx - 1);
                              setSelectedKey(selectedField.key);
                            }
                          }}><i className="fas fa-arrow-up" /></button>

                          <button className="btn-icon" title={t('templates.builder.actions.moveDown')} onClick={() => {
                            const idx = components.findIndex((p) => p.key === selectedField.key);
                            if (idx >= 0 && idx < components.length - 1) {
                              moveItem(idx, idx + 1);
                              setSelectedKey(selectedField.key);
                            }
                          }}><i className="fas fa-arrow-down" /></button>

                          <button className="btn-icon" title={t('templates.builder.actions.remove')} onClick={() => {
                            setComponents((prev) => prev.filter((p) => p.key !== selectedField.key));
                            setSelectedKey(null);
                          }}><i className="fas fa-trash" style={{ color: '#C62828' }} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </IonContent>
        </IonPage>
      </DndProvider>
      <IonPopover event={typesPopoverEvent} isOpen={typesPopoverOpen} onDidDismiss={() => setTypesPopoverOpen(false)}>
        <IonList>
          {templateTypes.length === 0 ? (
            <IonItem lines="none">{t('templates.builder.templateTypes.none')}</IonItem>
          ) : templateTypes.map((tt) => (
            <IonItem key={tt._id} button onClick={() => { setTemplateTypeId(String(tt._id)); setTypesPopoverOpen(false); }}>{tt.name}</IonItem>
          ))}
          <IonItem lines="none">
            <IonButton expand="block" onClick={() => { setTypeModalOpen(true); setTypesPopoverOpen(false); }}>{t('templates.builder.templateTypes.createButton')}</IonButton>
          </IonItem>
        </IonList>
      </IonPopover>

      <IonModal isOpen={typeModalOpen} onDidDismiss={() => setTypeModalOpen(false)}>
        <div style={{ padding: 16 }}>
          <h3>{t('templates.builder.templateTypes.createTitle')}</h3>
          <IonInput value={newTypeName} placeholder={t('templates.builder.templateTypes.placeholderName')} onIonChange={(e) => setNewTypeName((e.target as any).value || '')} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <IonButton onClick={() => setTypeModalOpen(false)}>{t('common.cancel')}</IonButton>
            <IonButton onClick={async () => {
              if (!newTypeName || !newTypeName.trim()) return setMessage(t('templates.builder.templateTypes.nameRequired'));
              try {
                const created: any = await templateTypesApi.createTemplateType({ name: newTypeName.trim() });
                setTemplateTypes((prev) => [ ...(prev || []), created ]);
                setTemplateTypeId(String(created._id));
                setNewTypeName('');
                setTypeModalOpen(false);
                setMessage(t('templates.builder.templateTypes.created'));
              } catch (e) {
                console.error('failed creating template type', e);
                setMessage(t('templates.builder.templateTypes.createError'));
              }
            }}>{t('templates.builder.templateTypes.createButton')}</IonButton>
          </div>
        </div>
      </IonModal>

      <PartSelectModal isOpen={partModalOpen} onClose={() => setPartModalOpen(false)} assignedAssetIds={assignedAssets} onSelect={(it) => {
        if (!selectedField) return;
        const single = { _id: it._id, name: it.name, serial: it.serial, qty: 1 };
        updateFieldProperty(selectedField.key, 'parts', [single]);
        setPartModalOpen(false);
      }} />
      <SupplySelectModal isOpen={supplyModalOpen} onClose={() => setSupplyModalOpen(false)} assignedAssetIds={assignedAssets} onSelect={(it) => {
        if (!selectedField) return;
        const single = { _id: it._id, name: it.name, sku: it.sku, qty: 1 };
        updateFieldProperty(selectedField.key, 'supplies', [single]);
        setSupplyModalOpen(false);
      }} />
    </>
  );
};

export default TemplatesBuilder;
