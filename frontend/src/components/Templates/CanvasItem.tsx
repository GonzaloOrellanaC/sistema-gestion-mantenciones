import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import type { DropTargetMonitor } from 'react-dnd';
import { Field, ICON_MAP } from './builderHelpers';

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
        {c.type === 'textarea' && (
          <div className="simulated-textarea">{c.placeholder || ''}</div>
        )}
        {(c.type === 'text' || c.type === 'number') && (
          <div className="simulated-input">{c.placeholder || ''}</div>
        )}
        {c.type === 'checkbox' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" aria-label={c.label || 'checkbox'} />
            <div style={{ fontSize: 14 }}>{c.label ?? ''}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasItem;
