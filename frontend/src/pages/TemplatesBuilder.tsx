import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { IonPage, IonContent, IonButton, IonText, IonCheckbox, IonPopover, IonList, IonItem, IonLabel, IonIcon } from '@ionic/react';
import { starOutline } from 'ionicons/icons';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import type { DropTargetMonitor } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import '../styles/login.css';
import '../styles/builder.css';
// Swiper integration was considered; using simple paginator for now.
import * as templatesApi from '../api/templates';
// Swiper imports (React + modules). Using module imports to match modern Swiper API.
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import type { Swiper as SwiperClass } from 'swiper';
import { Select as WidgetSelect } from '../components/Widgets/Select.widget';

type FieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'image' | 'file' | 'number' | 'radio' | 'signature' | 'geo' | 'date' | 'division' | 'columns' | 'dynamic_list';

const PALETTE: { type: FieldType; label: string }[] = [
  { type: 'text', label: 'Texto Corto' },
  { type: 'textarea', label: 'Texto Largo' },
  { type: 'number', label: 'Número' },
  { type: 'columns', label: 'Columnas (2)' },
  { type: 'select', label: 'Lista Desplegable' },
  { type: 'checkbox', label: 'Casilla Check' },
  { type: 'radio', label: 'Opción Única' },
  { type: 'image', label: 'Foto / Imagen' },
  { type: 'dynamic_list', label: 'Listado Editable' },
  { type: 'signature', label: 'Firma Digital' },
  { type: 'geo', label: 'Geolocalización' },
  { type: 'date', label: 'Fecha / Hora' },
  { type: 'file', label: 'Archivo' },
  { type: 'division', label: 'División (salto de página)' },
];

type PaletteDrag = { type: FieldType };

type Field = {
  key: string;
  type: FieldType;
  label?: string;
  required?: boolean;
  input?: boolean;
  placeholder?: string;
  options?: string[];
  children?: Field[][]; // for container types like columns: two arrays for each column
  [k: string]: any;
};

const ICON_MAP: Record<FieldType, string> = {
  text: 'fa-font',
  textarea: 'fa-align-left',
  number: 'fa-hashtag',
  select: 'fa-list-ul',
  checkbox: 'fa-check-square',
  radio: 'fa-dot-circle',
  image: 'fa-image',
  dynamic_list: 'fa-list',
  signature: 'fa-pen-fancy',
  geo: 'fa-map-marker-alt',
  date: 'fa-calendar-alt',
  file: 'fa-file-alt',
  columns: 'fa-columns',
  division: 'fa-arrows-alt-h',
};

// Component: drop area for a single column inside a columns container
const ColumnDropArea: React.FC<{
  parentKey: string;
  colIndex: number;
  childrenFields: Field[];
  addFieldToColumn?: (parentKey: string, colIndex: number, field: Field) => void;
  deleteNestedField?: (parentKey: string, colIndex: number, childKey: string) => void;
  isPreview: boolean;
  onSelect?: (key: string) => void;
  selectedKey?: string;
}> = ({ parentKey, colIndex, childrenFields, addFieldToColumn, deleteNestedField, isPreview, onSelect, selectedKey }) => {
  const [, drop] = useDrop<PaletteDrag, { parentKey: string; colIndex: number; fieldKey: string } | undefined, unknown>(() => ({
    accept: 'PALETTE_ITEM',
    drop: (item: PaletteDrag, monitor: DropTargetMonitor) => {
      // Prevent adding page-division items inside columns
      if (item.type === 'division') return undefined;
      const newField = createFieldFromType(item.type);
      addFieldToColumn && addFieldToColumn(parentKey, colIndex, newField);
      // return a non-undefined value so parent drop targets know this was handled
      return { parentKey, colIndex, fieldKey: newField.key };
    },
  }), [parentKey, colIndex]) as [{}, (el: Element | null) => void];

  return (
    <div ref={(node: HTMLDivElement | null) => drop(node)} className="sim-col" style={{ minHeight: 48 }}>
      {childrenFields && childrenFields.length > 0 ? (
        childrenFields.map((f) => (
          <div
            key={f.key}
            className={`canvas-field ${selectedKey === f.key ? 'selected' : ''}`}
            style={{ marginBottom: 8, padding: 8, cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); onSelect && onSelect(f.key); }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {!isPreview && <i className={`fas ${ICON_MAP[f.type] ?? 'fa-question'}`} style={{ color: '#0288D1' }} />}
                <div style={{ fontSize: 14 }}>{f.label ?? ''}</div>
              </div>
              {!isPreview && deleteNestedField && (
                <button className="action-btn" onClick={(e) => { e.stopPropagation(); deleteNestedField(parentKey, colIndex, f.key); }}>
                  <i className="fas fa-trash" />
                </button>
              )}
            </div>
          </div>
        ))
      ) : (
        <div style={{ padding: 12, color: '#90A4AE', textAlign: 'center' }}>Arrastra aquí</div>
      )}
    </div>
  );
};

const DraggableItem: React.FC<{ type: FieldType; label: string; isFavorite?: boolean; onQuickAdd?: (t: FieldType) => void; onOpenFavorite?: (ev: MouseEvent, t: FieldType, label: string) => void }> = ({ type, label, isFavorite, onQuickAdd, onOpenFavorite }) => {
  const [, drag] = useDrag<PaletteDrag, void, unknown>(() => ({ type: 'PALETTE_ITEM', item: { type } }), [type]) as [unknown, (el: Element | null) => void, (el: Element | null) => void];
  const icon = ICON_MAP[type] ?? 'fa-question';
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickAdd && onQuickAdd(type);
  };
  const handleContext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onOpenFavorite && onOpenFavorite(e.nativeEvent as MouseEvent, type, label);
  };
  return (
    <div ref={(node) => drag(node)} className="toolbox-item" data-type={type} onClick={handleClick} onContextMenu={handleContext} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <i className={`fas ${icon}`} />
        <span>{label}</span>
      </div>
      {isFavorite ? (
        <IonIcon icon={starOutline} style={{ color: '#FFD54F', fontSize: 16 }} />
      ) : null}
    </div>
  );
};

const CanvasDrop: React.FC<{ components: Field[]; setComponents: (c: Field[]) => void; onSelect: (key: string) => void; selectedKey?: string; isPreview?: boolean; deleteField: (key: string) => void; deviceView: 'mobile' | 'tablet' | 'desktop'; moveItem: (from: number, to: number) => void; pageTitles: Record<number, string>; setPageTitles: (t: Record<number, string>) => void; addFieldToColumn?: (parentKey: string, colIndex: number, field: Field) => void; deleteNestedField?: (parentKey: string, colIndex: number, childKey: string) => void; updateFieldProperty?: (key: string, prop: string, value: unknown) => void }>
  = ({ components, setComponents, onSelect, selectedKey, isPreview, deleteField, deviceView, moveItem, pageTitles, setPageTitles, addFieldToColumn, deleteNestedField, updateFieldProperty }) => {
  const [{ isOver }, drop] = useDrop<PaletteDrag, void, { isOver: boolean }>(() => ({
    accept: 'PALETTE_ITEM',
    collect: (monitor: DropTargetMonitor) => ({ isOver: monitor.isOver() }),
    drop: (item: PaletteDrag, monitor: DropTargetMonitor) => {
      // if a nested drop target already handled this drop, don't add at top-level
      if (monitor.didDrop()) return undefined;
      const type: FieldType = item.type;
      const newField = createFieldFromType(type);
      setComponents([...components, newField]);
      return undefined;
    },
  }), [components]) as [{ isOver: boolean }, (el: Element | null) => void];

  // split components into pages at 'division' items
  const pages: Field[][] = [];
  let current: Field[] = [];
  components.forEach((c) => {
    current.push(c);
    if (c.type === 'division') {
      pages.push(current);
      current = [];
    }
  });
  if (current.length > 0) pages.push(current);

  const [previewPage, setPreviewPage] = React.useState(0);
  // placeholder for future swiper reference (not used currently)
  const swiperRef = React.useRef<any>(null);
  const [popoverEvent, setPopoverEvent] = React.useState<MouseEvent | undefined>(undefined);
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  

  // ensure pageTitles has defaults
  const ensureTitle = (idx: number) => {
    // prefer title stored on the division field that ends the page; fall back to pageTitles state
    const page = pages[idx];
    if (page && page.length > 0) {
      const last = page[page.length - 1];
      if (last && last.type === 'division' && typeof last.pageTitle === 'string' && last.pageTitle.trim()) return last.pageTitle;
    }
    return pageTitles[idx] ?? `Página ${idx + 1}`;
  };

  return (
    <div ref={(node) => drop(node)} className={`canvas-area ${isOver ? 'drag-over' : ''}`}>
      <div className={`preview-device ${deviceView} ${isPreview ? 'app-like' : ''}`} id="preview-device">
        <div className="device-header">Vista Previa</div>
        <div className="device-body">
          {components.length === 0 ? (
            <div id="empty-msg" style={{ padding: 24, textAlign: 'center', color: '#90A4AE' }}>Arrastra componentes aquí</div>
          ) : (
            (isPreview ? (
              <div style={{ marginBottom: 18, padding: 12, border: '1px solid #F1F6F9', borderRadius: 8 }}>
                  <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700 }}>{ensureTitle(previewPage) ?? ''}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button className="btn-icon" onClick={() => { (swiperRef.current as SwiperClass | null)?.slidePrev(); }}><i className="fas fa-chevron-left" /></button>
                    <button className="btn-icon" onClick={(ev) => { setPopoverEvent(ev.nativeEvent); setPopoverOpen(true); }} style={{ minWidth: 56 }}>
                      <span style={{ fontSize: 12, color: '#90A4AE' }}>{Math.min(Math.max(previewPage, 0), pages.length - 1) + 1} / {pages.length}</span>
                    </button>
                    <button className="btn-icon" onClick={() => { (swiperRef.current as SwiperClass | null)?.slideNext(); }}><i className="fas fa-chevron-right" /></button>
                  </div>
                </div>
                <div>
                  <Swiper
                    modules={[Pagination]}
                    pagination={{ clickable: true }}
                    onSwiper={(s) => { swiperRef.current = s as SwiperClass; }}
                    onSlideChange={(s) => { setPreviewPage(s.activeIndex); }}
                    initialSlide={previewPage}
                    spaceBetween={16}
                  >
                    {pages.map((page, pIndex) => {
                      const baseIndex = pages.slice(0, pIndex).reduce((acc, p) => acc + p.length, 0);
                      return (
                        <SwiperSlide key={`slide_${pIndex}`}>
                          <div style={{ padding: 12 }}>
                            {page.map((c, i) => (
                              <CanvasItem
                                key={c.key}
                                c={c}
                                index={baseIndex + i}
                                pageIndex={pIndex}
                                selectedKey={selectedKey}
                                onSelect={onSelect}
                                isPreview={!!isPreview}
                                deleteField={deleteField}
                                moveItem={moveItem}
                                addFieldToColumn={addFieldToColumn}
                                deleteNestedField={deleteNestedField}
                                deviceView={deviceView}
                                updateFieldProperty={updateFieldProperty}
                              />
                            ))}
                          </div>
                        </SwiperSlide>
                      );
                    })}
                  </Swiper>
                  <IonPopover event={popoverEvent} isOpen={popoverOpen} onDidDismiss={() => setPopoverOpen(false)}>
                    <IonList>
                      {pages.map((p, idx) => (
                        <IonItem button key={`pp_${idx}`} onClick={() => { (swiperRef.current as SwiperClass | null)?.slideTo(idx); setPopoverOpen(false); }}>
                          <IonLabel>
                            <div style={{ fontWeight: 600 }}>Página {idx + 1}</div>
                            {ensureTitle(idx) && ensureTitle(idx).trim() ? <div style={{ fontSize: 12, color: '#90A4AE' }}>{ensureTitle(idx)}</div> : null}
                          </IonLabel>
                        </IonItem>
                      ))}
                    </IonList>
                  </IonPopover>
                  {/* favorites popover removed from here — handled in parent TemplatesBuilder */}
                </div>
              </div>
            ) : (
              pages.map((page, pIndex) => {
                let globalIndex = 0; // will compute per page below by summing previous pages
                for (let i = 0; i < pIndex; i++) globalIndex += pages[i].length;
                return (
                  <div key={`page_${pIndex}`} style={{ marginBottom: 18, padding: 12, border: '1px solid #F1F6F9', borderRadius: 8 }}>
                      <div style={{ marginBottom: 8, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>{ensureTitle(pIndex) ?? ''}</div>
                      <div style={{ fontSize: 12, color: '#90A4AE' }}>{ensureTitle(pIndex) && ensureTitle(pIndex).trim() ? null : `Página ${pIndex + 1}`}</div>
                    </div>
                    <div>
                      {page.map((c, i) => (
                        <CanvasItem
                          key={c.key}
                          c={c}
                          index={globalIndex + i}
                          pageIndex={pIndex}
                          selectedKey={selectedKey}
                          onSelect={onSelect}
                          isPreview={!!isPreview}
                          deleteField={deleteField}
                          moveItem={moveItem}
                          addFieldToColumn={addFieldToColumn}
                          deleteNestedField={deleteNestedField}
                          deviceView={deviceView}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// CanvasItem: draggable + drop target to support reordering
const CanvasItem: React.FC<{
  c: Field;
  index: number;
  pageIndex?: number;
  selectedKey?: string;
  onSelect: (key: string) => void;
  isPreview: boolean;
  deleteField: (key: string) => void;
  moveItem: (from: number, to: number) => void;
  addFieldToColumn?: (parentKey: string, colIndex: number, field: Field) => void;
  deleteNestedField?: (parentKey: string, colIndex: number, childKey: string) => void;
  deviceView: 'mobile' | 'tablet' | 'desktop';
  updateFieldProperty?: (key: string, prop: string, value: unknown) => void;
}> = ({ c, index, pageIndex, selectedKey, onSelect, isPreview, deleteField, moveItem, addFieldToColumn, deleteNestedField, deviceView, updateFieldProperty }) => {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [dynItems, setDynItems] = React.useState<any[]>(Array.isArray(c.items) ? c.items : []);

  React.useEffect(() => {
    setDynItems(Array.isArray(c.items) ? c.items : []);
  }, [c.items]);

  const addDynItem = (type: 'text' | 'image') => {
    const newItem = { id: Date.now(), type, value: type === 'text' ? 'Texto' : null };
    if (isPreview) {
      setDynItems((p) => [...p, newItem]);
      return;
    }
    const newItems = [...(Array.isArray(c.items) ? c.items : dynItems), newItem];
    setDynItems(newItems);
    updateFieldProperty && updateFieldProperty(c.key, 'items', newItems);
  };

  const removeDynItem = (id: number) => {
    const newItems = dynItems.filter((it) => it.id !== id);
    setDynItems(newItems);
    updateFieldProperty && updateFieldProperty(c.key, 'items', newItems);
  };
  type CanvasDragItem = { index: number };

  const [, drag] = useDrag<CanvasDragItem, void, unknown>(() => ({
    type: 'CANVAS_ITEM',
    item: () => ({ index }),
  }), [index]) as [unknown, (el: Element | null) => void, (el: Element | null) => void];

  const [, drop] = useDrop<CanvasDragItem, void, unknown>(() => ({
    accept: 'CANVAS_ITEM',
    hover: (item: CanvasDragItem, monitor: DropTargetMonitor) => {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      moveItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  }), [index, moveItem]) as [unknown, (el: Element | null) => void];

  const setRef = (node: HTMLDivElement | null) => {
    ref.current = node;
    drag(node);
    drop(node);
  };

  return (
    <div
      ref={setRef}
      id={c.key}
      className={`canvas-field ${selectedKey === c.key ? 'selected' : ''}`}
      onClick={() => onSelect(c.key)}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {!(isPreview && c.type === 'columns') ? (
          <>
        {isPreview ? (
          <div style={{ fontWeight: 700 }}>{c.label ?? ''}</div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <i className={`fas ${ICON_MAP[c.type] ?? 'fa-question'}`} style={{ color: '#0288D1', fontSize: 18 }} />
              <div>
                <div style={{ fontWeight: 700 }}>{c.label || c.type}</div>
                <div style={{ fontSize: 12, color: '#90A4AE' }}>{c.type.toUpperCase()}</div>
              </div>
            </div>
            <div className="field-actions">
              <button className="action-btn" onClick={(e) => { e.stopPropagation(); deleteField(c.key); }}>
                <i className="fas fa-trash" />
              </button>
            </div>
          </>
        )}
          </>
        ) : (
          <div style={{ height: 8 }} />
        )}
      </div>

      <div style={{ marginTop: 8 }}>
        {c.type === 'division' ? (
          isPreview ? (
            <div style={{ textAlign: 'center', padding: 12, color: '#607D8B', borderTop: '1px dashed #E0E0E0', fontWeight: 700 }}>{(typeof c.pageTitle === 'string' && c.pageTitle.trim()) ? c.pageTitle : (typeof pageIndex === 'number' ? `Página ${pageIndex + 1}` : '')}</div>
          ) : (
            <div style={{ textAlign: 'center', padding: 12, color: '#607D8B', borderTop: '1px dashed #E0E0E0' }}>{(typeof c.pageTitle === 'string' && c.pageTitle.trim()) ? c.pageTitle : '— Fin de página —'}</div>
          )
        ) : c.type === 'columns' ? (
          deviceView === 'mobile' ? (
            // Flatten columns into a single stacked list in mobile, honoring left->right, top->bottom order
            (() => {
              const left = (c.children && c.children[0]) || [];
              const right = (c.children && c.children[1]) || [];
              const maxLen = Math.max(left.length, right.length);
              const stacked: Field[] = [];
              for (let i = 0; i < maxLen; i++) {
                if (left[i]) stacked.push(left[i]);
                if (right[i]) stacked.push(right[i]);
              }
              return (
                <div>
                        {stacked.length === 0 ? (
                          <div style={{ padding: 12, color: '#90A4AE', textAlign: 'center' }}>Arrastra aquí</div>
                        ) : (
                          stacked.map((f) => {
                            const colIndexForF = left.findIndex((x) => x.key === f.key) !== -1 ? 0 : 1;
                            return (
                              <div key={f.key} className={`canvas-field ${selectedKey === f.key ? 'selected' : ''}`} style={{ marginBottom: 8, padding: 8 }} onClick={() => onSelect(f.key)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    {!isPreview && <i className={`fas ${ICON_MAP[f.type] ?? 'fa-question'}`} style={{ color: '#0288D1' }} />}
                                    <div style={{ fontSize: 14 }}>{f.label ?? ''}</div>
                                  </div>
                                  {!isPreview && <button className="action-btn" onClick={(e) => { e.stopPropagation(); deleteNestedField && deleteNestedField(c.key, colIndexForF, f.key); }}><i className="fas fa-trash" /></button>}
                                </div>
                              </div>
                            );
                          })
                        )}
                </div>
              );
            })()
          ) : (
            <div className="sim-row">
              <ColumnDropArea parentKey={c.key} colIndex={0} childrenFields={(c.children && c.children[0]) || []} addFieldToColumn={addFieldToColumn} deleteNestedField={deleteNestedField} isPreview={isPreview} onSelect={onSelect} selectedKey={selectedKey} />
              <ColumnDropArea parentKey={c.key} colIndex={1} childrenFields={(c.children && c.children[1]) || []} addFieldToColumn={addFieldToColumn} deleteNestedField={deleteNestedField} isPreview={isPreview} onSelect={onSelect} selectedKey={selectedKey} />
            </div>
          )
        ) : (
          <>
            {c.type === 'textarea' && (
              <div className="simulated-textarea">{c.placeholder || ''}</div>
            )}
            {(c.type === 'text' || c.type === 'number') && (
              <div className="simulated-input">{c.placeholder || ''}</div>
            )}
            {c.type === 'checkbox' && (
              // In preview show an actual checkbox as it will appear in the app
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" aria-label={c.label || 'checkbox'} />
                <div style={{ fontSize: 14 }}>{c.label ?? ''}</div>
              </div>
            )}
            {c.type === 'geo' && (
              // Geolocation preview control
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-secondary"><i className="fas fa-map-marker-alt" style={{ marginRight: 8 }} />Obtener ubicación</button>
                <div style={{ fontSize: 12, color: '#90A4AE' }}>Se mostrará un botón para solicitar la ubicación en la app</div>
              </div>
            )}
            {c.type === 'file' && (
              // File upload preview control with supported formats note
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-secondary"><i className="fas fa-paperclip" style={{ marginRight: 8 }} />Adjuntar archivo</button>
                <div style={{ fontSize: 12, color: '#90A4AE' }}>Formatos soportados: pdf, doc, docx, txt</div>
              </div>
            )}
            {c.type === 'date' && (
              // Date/time preview control
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-secondary"><i className="fas fa-calendar-alt" style={{ marginRight: 8 }} />Seleccionar fecha/hora</button>
                <div style={{ fontSize: 12, color: '#90A4AE' }}>En la app abrirá un selector de fecha/hora</div>
              </div>
            )}
            {c.type === 'image' && (
              isPreview ? (
                <div className="preview-image-controls">
                  <button className="icon-btn"><i className="fas fa-image" /></button>
                  <button className="icon-btn"><i className="fas fa-camera" /></button>
                </div>
              ) : (
                <div className="simulated-image-placeholder">Imagen</div>
              )
            )}
            {c.type === 'signature' && (
              isPreview ? (
                <div className="preview-signature-control">
                  <button className="btn btn-secondary"><i className="fas fa-pen-fancy" /> Firmar</button>
                </div>
              ) : (
                <div className="simulated-signature-placeholder">Firma</div>
              )
            )}
            {c.type === 'dynamic_list' && (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dynItems.length === 0 ? (
                    <div style={{ padding: 12, color: '#90A4AE', textAlign: 'center' }}>Sin ítems</div>
                  ) : (
                    dynItems.map((it: any) => (
                      <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, border: '1px solid #F1F6F9', borderRadius: 6 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <i className={`fas ${it.type === 'image' ? 'fa-image' : 'fa-font'}`} />
                          <div style={{ fontSize: 14 }}>{it.type === 'text' ? (it.value || 'Texto') : 'Imagen'}</div>
                        </div>
                        <div>
                          {!isPreview && <button className="action-btn" onClick={(e) => { e.stopPropagation(); removeDynItem(it.id); }}><i className="fas fa-trash" /></button>}
                        </div>
                      </div>
                    ))
                  )}

                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); addDynItem('text'); }}>+ Texto</button>
                    <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); addDynItem('image'); }}>+ Imagen</button>
                  </div>
                </div>
              </div>
            )}
            {c.type === 'select' && (
              <div>
                <WidgetSelect
                  label={c.label}
                  value={c.value}
                  onChange={(v) => updateFieldProperty && updateFieldProperty(c.key, 'value', v)}
                  options={(Array.isArray(c.options) ? c.options.map((o: any) => (typeof o === 'string' ? { label: o, value: o } : o)) : [])}
                  placeholder={c.placeholder}
                  disabled={isPreview}
                  style={{ width: '100%' }}
                  readOnly={isPreview}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

function createFieldFromType(type: FieldType) {
  const base: any = { key: `${type}_${Date.now()}`, type, label: '', required: false };
  switch (type) {
    case 'text':
      base.label = 'Texto corto';
      base.input = true;
      base.placeholder = '';
      break;
    case 'textarea':
      base.label = 'Texto largo';
      base.input = true;
      base.placeholder = '';
      break;
    case 'number':
      base.label = 'Número';
      base.input = true;
      base.placeholder = '';
      break;
    case 'select':
      base.label = 'Selector';
      base.options = ['Opción 1', 'Opción 2'];
      break;
    case 'radio':
      base.label = 'Opción única';
      base.options = ['Opción 1', 'Opción 2'];
      break;
    case 'checkbox':
      base.label = 'Checkbox';
      break;
    case 'signature':
      base.label = 'Firma';
      break;
    case 'geo':
      base.label = 'Geolocalización';
      break;
    case 'date':
      base.label = 'Fecha / Hora';
      break;
    case 'image':
      base.label = 'Imagen';
      break;
    case 'file':
      base.label = 'Archivo';
      break;
    case 'columns':
      base.label = '';
      base.isDesign = true; // layout/design container — no label required
      base.children = [[], []];
      break;
    case 'dynamic_list':
      base.label = 'Listado editable';
      base.items = [];
      base.allowedItemTypes = ['text', 'image'];
      break;
    case 'division':
      base.label = 'Fin de página (División)';
      base.input = false;
      base.pageTitle = '';
      break;
    default:
      base.label = 'Campo';
  }
  return base;
}

const TemplatesBuilder: React.FC = () => {
  const [components, setComponents] = useState<Field[]>([]);
  const [pageTitles, setPageTitles] = useState<Record<number, string>>({});
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
      setMessage('Nombre requerido');
      return;
    }
    setSaving(true);
    setMessage(null);
    const structure = { display: 'form', components, pageTitles };
    try {
      if (isEditMode && params.id) {
        // try to update existing template
        if (typeof templatesApi.updateTemplate === 'function') {
          await templatesApi.updateTemplate(params.id, { name: name.trim(), description, structure });
        } else {
          // fallback: call create (will create a new one) but inform user
          await templatesApi.createTemplate({ name: name.trim(), description, structure });
        }
        setMessage('Pauta actualizada');
      } else {
        await templatesApi.createTemplate({ name: name.trim(), description, structure });
        setMessage('Pauta guardada');
      }
      // navigate back to templates list after successful save
      history.push('/templates');
    } catch (err: unknown) {
      console.error(err);
      type ErrWithResponse = { response?: { data?: { message?: string } } };
      const msg = (err as ErrWithResponse)?.response?.data?.message ?? 'Error al guardar pauta';
      setMessage(msg);
    } finally {
      setSaving(false);
    }
  }, [name, description, components, history, isEditMode, params?.id]);

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
        }
      } catch (e) {
        console.error('Error loading template', e);
        setMessage('Error cargando pauta');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
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
    <DndProvider backend={HTML5Backend}>
      <IonPage>
        <IonContent>
          <div className="builder-wrapper">
            <div className="builder-toolbar">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button className="btn-icon" onClick={() => history.push('/templates')}><i className="fas fa-arrow-left" /></button>
                <div style={{ fontWeight: 700 }}>Editar estructura</div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className="device-controls">
                  <button className={`btn-icon ${deviceView === 'mobile' ? 'active' : ''}`} onClick={() => handleDeviceChange('mobile')}><i className="fas fa-mobile-alt" /></button>
                  <button className={`btn-icon ${deviceView === 'tablet' ? 'active' : ''}`} onClick={() => handleDeviceChange('tablet')}><i className="fas fa-tablet-alt" /></button>
                  <button className={`btn-icon ${deviceView === 'desktop' ? 'active' : ''}`} onClick={() => handleDeviceChange('desktop')}><i className="fas fa-desktop" /></button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 14 }}>Modo:</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <IonCheckbox checked={isPreviewMode} onIonChange={(ev) => togglePreviewMode(ev.detail.checked)} />
                    <span style={{ fontSize: 13 }}>{isPreviewMode ? 'Vista' : 'Edición'}</span>
                  </div>
                </div>

                <IonButton className="btn btn-primary" onClick={saveTemplate} disabled={saving || loading || !name.trim()}><i className="fas fa-save" /> Guardar</IonButton>
              </div>
            </div>

            <div className="builder-container">
              <div className="toolbox" style={{ opacity: isPreviewMode ? 0.5 : 1, pointerEvents: isPreviewMode ? 'none' : 'all' }}>
                <div style={{ fontWeight: 800, marginBottom: 12 }}>Componentes</div>
                {/* Palette sorted by label for easier discovery */}
                  {/* Favorites list (persisted) */}
                  {favorites.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontWeight: 700, marginBottom: 8 }}>Favoritos (máx 5)</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                        {favorites.map((f, idx) => (
                          <DraggableItem key={`fav_${idx}_${f.label}`} type={f.type} label={f.label} onQuickAdd={(t) => {
                            const newField = createFieldFromType(t);
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
                        <button className="btn btn-link" onClick={() => { setFavorites([]); persistFavorites([]); setMessage('Favoritos limpiados'); }}>Limpiar</button>
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

                  {[...PALETTE].sort((a, b) => a.label.localeCompare(b.label, 'es')).map((p) => (
                    <DraggableItem
                      key={`${p.type}_${p.label}`}
                      type={p.type}
                      label={p.label}
                      isFavorite={favorites.some((f) => f.type === p.type)}
                      onQuickAdd={(t) => {
                        // quick add: create field and keep builder in Edit mode
                        const newField = createFieldFromType(t);
                        setComponents((prev) => [...prev, newField]);
                        // ensure we remain in Edit mode after quick-add
                        setIsPreviewMode(false);
                      }}
                      onOpenFavorite={(ev, t, label) => {
                        // open popover to confirm adding to favorites
                        setFavEvent(ev);
                        setFavOpen(true);
                        setFavLabel(label);
                        setFavType(t);
                      }}
                    />
                  ))}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 12, display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 6 }}>Nombre <span style={{ color: '#C62828' }}>*</span></label>
                    <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 6 }}>Descripción</label>
                    <input className="form-control" value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                </div>

                <CanvasDrop components={components} setComponents={setComponents} onSelect={onSelect} selectedKey={selectedKey ?? undefined} isPreview={isPreviewMode} deleteField={deleteField} deviceView={deviceView} moveItem={moveItem} pageTitles={pageTitles} setPageTitles={setPageTitles} addFieldToColumn={addFieldToColumn} deleteNestedField={deleteNestedField} updateFieldProperty={updateFieldProperty} />

                {message && <div style={{ paddingTop: 8 }}><IonText color="primary">{message}</IonText></div>}

                {/* Favorites popover (triggered by right-click on toolbox items) */}
                <IonPopover event={favEvent} isOpen={favOpen} onDidDismiss={() => setFavOpen(false)}>
                  <IonItem lines="none" button onClick={() => {
                      if (favType && favLabel) {
                        // enforce maximum of 5 favorites
                        if (favorites.length >= 5) {
                          setMessage('Máximo 5 favoritos');
                        } else {
                          setFavorites((prev) => {
                            const exists = prev.some((x) => x.type === favType && x.label === favLabel);
                            if (exists) return prev;
                            const next = [...prev, { type: favType, label: favLabel }];
                            persistFavorites(next);
                            return next;
                          });
                          setMessage('Agregado a Favoritos');
                        }
                      }
                      setFavOpen(false);
                    }}>
                    <IonLabel>
                      <h2><IonIcon icon={starOutline} /> Agregar a Favoritos</h2>
                    </IonLabel>
                  </IonItem>
                </IonPopover>
              </div>

              <div className="properties-panel" style={{ opacity: isPreviewMode ? 0.5 : 1, pointerEvents: isPreviewMode ? 'none' : 'all' }}>
                <div className="prop-header">Propiedades del Campo</div>
                <div className="prop-body">
                  {!selectedField ? (
                    <div className="prop-empty">
                      <i className="fas fa-mouse-pointer" style={{ fontSize: 36, color: '#90A4AE' }} />
                      <div style={{ marginTop: 12 }}>Selecciona un campo en el lienzo para editar sus propiedades.</div>
                    </div>
                  ) : (
                    <div>
                      {selectedField.isDesign ? (
                        <div className="prop-group">
                          <label>Componente de diseño</label>
                          <div style={{ fontSize: 13, color: '#607D8B' }}>Este componente es de diseño y no requiere un label editable.</div>
                        </div>
                      ) : (
                        <div className="prop-group">
                          <label>Label</label>
                          <input className="form-control" value={selectedField.label ?? ''} onChange={(e) => updateFieldProperty(selectedField.key, 'label', e.target.value)} />
                        </div>
                      )}
                      <div className="prop-group">
                        <label>Requerido</label>
                        <input type="checkbox" checked={!!selectedField.required} onChange={(e) => updateFieldProperty(selectedField.key, 'required', e.target.checked)} />
                      </div>
                      {selectedField.type === 'select' && (
                        <div className="prop-group">
                          <label>Opciones</label>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <input id="newOpt" className="form-control" placeholder="Agregar opción" />
                            <button className="btn btn-secondary" onClick={() => {
                              const el = document.getElementById('newOpt') as HTMLInputElement | null;
                              const val = el?.value?.trim();
                              if (val) {
                                const opts = Array.isArray(selectedField.options) ? [...selectedField.options, val] : [val];
                                updateFieldProperty(selectedField.key, 'options', opts);
                                if (el) el.value = '';
                              }
                            }}>Agregar</button>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {Array.isArray(selectedField.options) && selectedField.options.map((o: string, idx: number) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>{o}</div>
                                <button className="btn btn-secondary" onClick={() => {
                                  const opts = (selectedField.options ?? []).filter((_: string, i: number) => i !== idx);
                                  updateFieldProperty(selectedField.key, 'options', opts);
                                }}>Eliminar</button>
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
                                    return pageTitles[pageIndex] ?? `Página ${pageIndex + 1}`;
                                  })();

                                  return (
                                    <div className="prop-group">
                                      <label>Título de la página</label>
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
                        <button className="btn-icon" title="Subir" onClick={() => {
                          const idx = components.findIndex((p) => p.key === selectedField.key);
                          if (idx > 0) {
                            moveItem(idx, idx - 1);
                            setSelectedKey(selectedField.key);
                          }
                        }}><i className="fas fa-arrow-up" /></button>

                        <button className="btn-icon" title="Bajar" onClick={() => {
                          const idx = components.findIndex((p) => p.key === selectedField.key);
                          if (idx >= 0 && idx < components.length - 1) {
                            moveItem(idx, idx + 1);
                            setSelectedKey(selectedField.key);
                          }
                        }}><i className="fas fa-arrow-down" /></button>

                        <button className="btn-icon" title="Eliminar" onClick={() => {
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
  );
};

export default TemplatesBuilder;
