import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import type { Swiper as SwiperClass } from 'swiper';
import { Field } from './builderHelpers';
import CanvasItem from './CanvasItem';

const CanvasDrop: React.FC<{ components: Field[]; setComponents: (c: Field[]) => void; onSelect: (key: string) => void; selectedKey?: string; isPreview?: boolean; deleteField: (key: string) => void; deviceView: 'mobile' | 'tablet' | 'desktop'; moveItem: (from: number, to: number) => void; pageTitles: Record<number, string>; setPageTitles: (t: Record<number, string>) => void; addFieldToColumn?: (parentKey: string, colIndex: number, field: Field) => void; deleteNestedField?: (parentKey: string, colIndex: number, childKey: string) => void; updateFieldProperty?: (key: string, prop: string, value: unknown) => void }>
= ({ components, setComponents, onSelect, selectedKey, isPreview, deleteField, deviceView, moveItem, pageTitles, setPageTitles, addFieldToColumn, deleteNestedField, updateFieldProperty }) => {
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
  const swiperRef = React.useRef<any>(null);
  const [popoverEvent, setPopoverEvent] = React.useState<MouseEvent | undefined>(undefined);
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  const ensureTitle = (idx: number) => {
    const page = pages[idx];
    if (page && page.length > 0) {
      const last = page[page.length - 1];
      if (last && last.type === 'division' && typeof last.pageTitle === 'string' && last.pageTitle.trim()) return last.pageTitle;
    }
    return pageTitles[idx] ?? `Página ${idx + 1}`;
  };

  return (
    <div className={`canvas-area`}>
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
                </div>
              </div>
            ) : (
              pages.map((page, pIndex) => {
                let globalIndex = 0;
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

export default CanvasDrop;
