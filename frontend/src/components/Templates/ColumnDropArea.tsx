import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDrop } from 'react-dnd';
import type { DropTargetMonitor } from 'react-dnd';
import { Field, FieldType, createFieldFromType } from './builderHelpers';

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
    const { t } = useTranslation();

    const [, drop] = useDrop<{ type: FieldType }, { parentKey: string; colIndex: number; fieldKey: string } | undefined, unknown>(() => ({
    accept: 'PALETTE_ITEM',
    drop: (item: any, monitor: DropTargetMonitor) => {
      if (item.type === 'division') return undefined;
        const newField = createFieldFromType(item.type as FieldType, t);
      addFieldToColumn && addFieldToColumn(parentKey, colIndex, newField);
      return { parentKey, colIndex, fieldKey: newField.key };
    }
  }), [parentKey, colIndex]);

  return (
    <div ref={drop as any} className="sim-col" style={{ minHeight: 48 }}>
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
                {!isPreview && <i className={`fas fa-question`} style={{ color: '#0288D1' }} />}
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
        <div style={{ padding: 12, color: '#90A4AE', textAlign: 'center' }}>{t('templates.builder.dropHere')}</div>
      )}
    </div>
  );
};

export default ColumnDropArea;
