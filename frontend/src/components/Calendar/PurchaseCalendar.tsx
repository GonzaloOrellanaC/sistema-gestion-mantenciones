import React from 'react';
import { IonButton } from '@ionic/react';
import '../../pages/calendar.css';

interface Props {
  monthShown: Date;
  setMonthShown: (d: Date) => void;
  purchaseDays: Record<string, boolean>;
  dateFilter: string;
  setDateFilter: (s: string) => void;
  i18nLanguage?: string;
  t?: (k: string, opts?: any) => string;
  minMonth?: Date;
}

const PurchaseCalendar: React.FC<Props> = ({ monthShown, setMonthShown, purchaseDays, dateFilter, setDateFilter, i18nLanguage, t, minMonth }) => {
  const locale = i18nLanguage || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
  const minM = minMonth || new Date(1970, 0, 1);

  return (
    <div style={{ border: '1px solid #e6e6e6', padding: 6, borderRadius: 6, width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        {(() => {
          const canPrev = monthShown > minM;
          return (
            <IonButton fill="clear" size="small" disabled={!canPrev} onClick={() => { if (canPrev) setMonthShown(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)); }}>{'<'}</IonButton>
          );
        })()}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{monthShown.toLocaleString(locale || undefined, { month: 'long', year: 'numeric' })}</div>
          {(() => {
            const today = new Date();
            const isCurrentMonth = monthShown.getFullYear() === today.getFullYear() && monthShown.getMonth() === today.getMonth();
            return (
              <IonButton fill="clear" size="small" disabled={isCurrentMonth} onClick={() => { const d = new Date(); setMonthShown(new Date(d.getFullYear(), d.getMonth(), 1)); }}>{t ? t('lists.today') || 'Today' : 'Today'}</IonButton>
            );
          })()}
        </div>
        <IonButton fill="clear" size="small" onClick={() => setMonthShown(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>{'>'}</IonButton>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, fontSize: 11, color: '#666', marginBottom: 6 }}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(h => (<div key={h} style={{ textAlign: 'center' }}>{h}</div>))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {(() => {
          const year = monthShown.getFullYear();
          const month = monthShown.getMonth();
          const first = new Date(year, month, 1);
          const startDay = first.getDay();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const cells: any[] = [];
          for (let i = 0; i < startDay; i++) cells.push(<div key={`b-${i}`}></div>);
          for (let d = 1; d <= daysInMonth; d++) {
            const dt = new Date(year, month, d);
            const y = dt.getFullYear();
            const m = String(dt.getMonth() + 1).padStart(2, '0');
            const dd = String(dt.getDate()).padStart(2, '0');
            const key = `${y}-${m}-${dd}`;
            const has = !!purchaseDays[key];
            const today = new Date();
            const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
            const isToday = key === todayKey;
            const dayMid = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
            const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
            const isFuture = dayMid > todayMid;
            const cls = `calendar-day ${isFuture ? 'calendar-day-disabled' : ''} ${isToday ? 'calendar-day-today' : ''}`;
            const bgStyle = isToday ? '#ffefcc' : (has ? '#e6f7ff' : 'transparent');
            const colorStyle = isToday ? '#a35b00' : (has ? '#0366a6' : '#333');
            cells.push(
              <div key={key} onClick={() => { if (!isFuture) { setDateFilter(key); } }} className={cls} style={{
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
                cursor: isFuture ? 'not-allowed' : 'pointer',
                background: bgStyle,
                border: dateFilter === key ? '2px solid var(--ion-color-primary)' : '1px solid transparent',
                color: colorStyle
              }}>{d}</div>
            );
          }
          while (cells.length % 7 !== 0) cells.push(<div key={`t-${cells.length}`}></div>);
          return cells;
        })()}
      </div>
    </div>
  );
};

export default PurchaseCalendar;
