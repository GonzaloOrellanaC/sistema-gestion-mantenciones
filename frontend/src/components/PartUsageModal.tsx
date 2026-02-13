import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IonModal, IonButton, IonFooter, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon } from '@ionic/react';
import Chart from 'react-apexcharts';
import api from '../api/axios';
import { closeOutline } from 'ionicons/icons';

type Props = {
  partId: string | null;
  isOpen: boolean;
  onDidDismiss: () => void;
};

const PartUsageModal: React.FC<Props> = ({ partId, isOpen, onDidDismiss }) => {
  const [loading, setLoading] = useState(false);
  const [series, setSeries] = useState<any[]>([]);
  const [options, setOptions] = useState<any>({});
  const [meta, setMeta] = useState<any>(null);
  const { t } = useTranslation();
  const [fromDateStr, setFromDateStr] = useState<string>('');
  const [toDateStr, setToDateStr] = useState<string>('');

  // compute default date range (3 months back / +3 months)
  const formatDateInput = (d: Date) => d.toISOString().slice(0,10);
  const formatPrettyDate = (ts: number | null) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const now = new Date();
  const defaultFromDate = new Date(now);
  defaultFromDate.setMonth(defaultFromDate.getMonth() - 3);
  const defaultToDate = new Date(now);
  defaultToDate.setMonth(defaultToDate.getMonth() + 3);
  const defaultFromStr = formatDateInput(defaultFromDate);
  const defaultToStr = formatDateInput(defaultToDate);

  const fetchData = async (useFrom?: string, useTo?: string) => {
    if (!partId) return;
    setLoading(true);
    setSeries([]);
    setOptions({});
    setMeta(null);
    try {
      const fromParam = useFrom || fromDateStr || defaultFromStr;
      const toParam = useTo || toDateStr || defaultToStr;
      const res = await api.get(`/api/parts/${partId}/usage-history`, { params: { from: fromParam, to: toParam } });
      const data = res.data || { items: [], meta: {} };
      const items = Array.isArray(data.items) ? data.items : [];
      const m = data.meta || {};
      setMeta(m);

      const toDateOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

      const acquisitions: Array<{ lotId?: string; purchaseDate: Date | null; originalTotal: number }> = Array.isArray(m.acquisitions) ? m.acquisitions.map((a: any) => ({
        lotId: a.lotId,
        purchaseDate: a.purchaseDate ? toDateOnly(new Date(a.purchaseDate)) : null,
        originalTotal: Number(a.originalTotal || 0)
      })) : [];

      const assignments: Array<{ assignedAt: Date | null; quantity: number }> = items.map((it: any) => ({ assignedAt: it.assignedAt ? toDateOnly(new Date(it.assignedAt)) : null, quantity: Number(it.quantity || 0) }));

      const dateSet = new Set<number>();
      acquisitions.forEach((a) => { if (a.purchaseDate) dateSet.add(a.purchaseDate.getTime()); });
      assignments.forEach((s) => { if (s.assignedAt) dateSet.add(s.assignedAt.getTime()); });
      const dates = Array.from(dateSet).sort((a,b) => a-b);
      if (dates.length === 0 && assignments.length > 0) {
        const d = assignments.map(a => a.assignedAt ? a.assignedAt.getTime() : 0).sort((a,b)=>a-b)[0];
        if (d) dates.push(d);
      }

      const points: Array<{ x: number; y: number | null }> = [];
      dates.forEach((ts) => {
        const acquired = acquisitions.reduce((s: number, a: any) => (a.purchaseDate && a.purchaseDate.getTime() <= ts ? s + a.originalTotal : s), 0);
        const assigned = assignments.reduce((s: number, it: any) => (it.assignedAt && it.assignedAt.getTime() <= ts ? s + it.quantity : s), 0);
        const rem = acquired - assigned;
        points.push({ x: ts, y: rem });
      });

      // determine selected range timestamps (start of day -> end of day)
      const startTs = new Date(fromParam + 'T00:00:00').getTime();
      const endTs = new Date(toParam + 'T00:00:00').getTime() + 24*60*60*1000 - 1;

      if (points.length === 0) {
        // no measured points — render blank stock area between start and end
        const minVal = m && m.part ? Number(m.part.minStock || 0) : 0;
        const seriesArr: any[] = [
          { name: 'Stock', data: [{ x: startTs, y: null }, { x: endTs, y: null }] },
          { name: 'Min threshold', data: [{ x: startTs, y: minVal }, { x: endTs, y: minVal }] }
        ];
        const opts: any = {
          chart: { id: 'part-usage-chart', zoom: { enabled: false } },
          xaxis: { type: 'datetime', min: startTs, max: endTs },
          yaxis: { title: { text: t('partUsage.yAxis') }, labels: { formatter: (val: any) => String(Math.round(Number(val) || 0)) } },
          stroke: { curve: 'straight' },
          markers: { size: 4 },
          tooltip: { x: { format: 'dd MMM yyyy' }, y: { formatter: (val: any) => String(Math.round(Number(val) || 0)) } },
          legend: { position: 'top' }
        };
        setSeries(seriesArr);
        setOptions(opts);
      } else {
        const minVal = m && m.part ? Number(m.part.minStock || 0) : 0;
        // min line across selected range
        const minPoints = [{ x: startTs, y: minVal }, { x: endTs, y: minVal }];

        // compute simple consumption rate (units/day)
        const lastPoint = points[points.length - 1];
        const lastTs = lastPoint.x;
        const lastStock = Number(lastPoint.y || 0);

        // Use recent window (30 days) to estimate daily consumption
        const WINDOW_DAYS = 30;
        const windowMs = WINDOW_DAYS * 24 * 60 * 60 * 1000;
        const windowCut = lastTs - windowMs;
        const assignedInWindow = assignments.reduce((s: number, a: any) => (a.assignedAt && a.assignedAt.getTime() > windowCut ? s + a.quantity : s), 0);
        let consumptionRate = 0;
        if (assignedInWindow > 0) consumptionRate = assignedInWindow / WINDOW_DAYS;
        else {
          // fallback: use overall assignment rate between first and last assignment
          const assignedDates = assignments.filter(a => a.assignedAt).map(a => a.assignedAt!.getTime()).sort((a,b)=>a-b);
          if (assignedDates.length >= 2) {
            const first = assignedDates[0];
            const spanDays = Math.max(1, (lastTs - first) / (24*60*60*1000));
            const totalAssigned = assignments.reduce((s:number,a:any)=>s + (a.quantity||0), 0);
            consumptionRate = totalAssigned / spanDays;
          }
        }

          // build projection to zero (until it reaches zero)
          let projectionPoints: Array<{ x: number; y: number }> = [];
          if (consumptionRate > 0 && lastStock > 0) {
            const daysToZero = lastStock / consumptionRate;
            const steps = Math.max(1, Math.ceil(daysToZero));
            // include start point
            projectionPoints.push({ x: lastTs, y: lastStock });
            for (let i = 1; i <= steps; i++) {
              const delta = i;
              const t = lastTs + delta * 24 * 60 * 60 * 1000;
              const y = Math.max(0, lastStock - consumptionRate * delta);
              projectionPoints.push({ x: t, y });
            }
          }

          // combined timeline to find threshold crossing
          const combined = [...points];
          // append projection excluding duplicate first timestamp
          projectionPoints.forEach(pp => {
            if (!combined.find(c => c.x === pp.x)) combined.push(pp);
          });
          combined.sort((a,b)=>a.x-b.x);

          let crossingX: number | null = null;
          for (let i = 0; i < combined.length; i++) {
            if ((combined[i].y !== null && combined[i].y! <= minVal)) { crossingX = combined[i].x; break; }
          }

          // ensure stock series spans the selected range: add nulls at edges if needed
          const stockPoints = [...points];
          if (stockPoints[0].x > startTs) stockPoints.unshift({ x: startTs, y: null });
          if (stockPoints[stockPoints.length - 1].x < endTs) stockPoints.push({ x: endTs, y: null });

          const seriesArr: any[] = [
            { name: t('partUsage.stock'), data: stockPoints },
            { name: t('partUsage.minThreshold'), data: minPoints }
          ];
        if (projectionPoints.length > 0) {
          seriesArr.push({ name: t('partUsage.projection'), data: projectionPoints, stroke: { dashArray: 6 }, markers: { size: 3 } });
        }

        const opts: any = {
          chart: { id: 'part-usage-chart', zoom: { enabled: false } },
          xaxis: { type: 'datetime', min: startTs, max: endTs },
          yaxis: { title: { text: 'Quantity' }, labels: { formatter: (val: any) => String(Math.round(Number(val) || 0)) } },
          stroke: { curve: 'straight' },
          markers: { size: 4 },
          tooltip: { x: { format: 'dd MMM yyyy' }, y: { formatter: (val: any) => String(Math.round(Number(val) || 0)) } },
          legend: { position: 'top' }
        };

        if (crossingX) {
          opts.annotations = {
            xaxis: [
              { x: crossingX, borderColor: '#f44336', label: { text: `${t('partUsage.crosses')}: ${formatPrettyDate(crossingX)}`, style: { color: '#fff', background: '#f44336' } } }
            ]
          };
        }

        setSeries(seriesArr);
        setOptions(opts);
      }
    } catch (e) {
      console.error('PartUsageModal load error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!partId || !isOpen) return;
    // initialize inputs to defaults if empty
    setFromDateStr((s) => s || defaultFromStr);
    setToDateStr((s) => s || defaultToStr);
    // fetch initial data
    fetchData();
  }, [partId, isOpen]);

  

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
        <IonHeader>
            <IonToolbar>
                <IonTitle style={{marginLeft: 10}}>
                  {meta && meta.part ? (meta.part.name || meta.part.serial || meta.part._id) : t('partUsage.title')}
                </IonTitle>
                <IonButton slot='end' fill="clear" onClick={onDidDismiss}>
                    <IonIcon color='dark' icon={closeOutline} />
                </IonButton>
            </IonToolbar>
        </IonHeader>
      <IonContent className='ion-padding'>
        <div style={{ height: 360 }}>
          {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>{t('partUsage.loading')}</div>
          ) : (series && series.length ? (
            <Chart options={options} series={series} type="line" height={320} />
          ) : (
                    <div style={{ color: '#666', padding: 24 }}>{t('partUsage.noData')}</div>
          ))}
        </div>
        
      </IonContent>
      <IonFooter>
        <IonToolbar style={{padding: 10}}>
            <label style={{ fontSize: 12 }}>{t('partUsage.from')}</label>
            <input type="date" value={fromDateStr} onChange={(e) => { setFromDateStr(e.target.value); }} />
            <label style={{ fontSize: 12 }}>{t('partUsage.to')}</label>
            <input type="date" value={toDateStr} onChange={(e) => { setToDateStr(e.target.value); }} />
            <IonButton slot='end' onClick={() => fetchData(fromDateStr, toDateStr)}>{t('partUsage.apply')}</IonButton>
          </IonToolbar>
      </IonFooter>
    </IonModal>
  );
};

export default PartUsageModal;
