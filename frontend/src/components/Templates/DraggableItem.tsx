import React from 'react';
import { useDrag } from 'react-dnd';
import { FieldType, ICON_MAP } from './builderHelpers';
import { IonIcon } from '@ionic/react';
import { starOutline } from 'ionicons/icons';

const DraggableItem: React.FC<{ type: FieldType; label: string; isFavorite?: boolean; onQuickAdd?: (t: FieldType) => void; onOpenFavorite?: (ev: MouseEvent, t: FieldType, label: string) => void }> = ({ type, label, isFavorite, onQuickAdd, onOpenFavorite }) => {
  const [, drag] = useDrag(() => ({ type: 'PALETTE_ITEM', item: { type } }), [type]) as [unknown, (el: Element | null) => void, (el: Element | null) => void];
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

export default DraggableItem;
