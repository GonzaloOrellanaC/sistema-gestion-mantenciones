import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonItem, IonLabel, IonSelect, IonSelectOption, IonSpinner, IonGrid, IonRow, IonCol } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dashboardApi from '../api/dashboard';
// ApexCharts for dynamic charts
// @ts-ignore
import Chart from 'react-apexcharts';

const Dashboard: React.FC = () => {
  const [createdCount, setCreatedCount] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [activeUsersCount, setActiveUsersCount] = useState<number | null>(null);
  const [partsLowStock, setPartsLowStock] = useState<number | null>(null);
  const [suppliesLowStock, setSuppliesLowStock] = useState<number | null>(null);
  const [weeklyCounts, setWeeklyCounts] = useState<number[]>([]);
  const [branchesData, setBranchesData] = useState<any[] | null>(null);
  const [monthsRange, setMonthsRange] = useState<number>(6);
  const [monthlyStatus, setMonthlyStatus] = useState<any[] | null>(null);
  const [woByTemplateType, setWoByTemplateType] = useState<any[] | null>(null);
  const [loadingDashboardData, setLoadingDashboardData] = useState(false);

  useEffect(() => { loadCounts(); }, [monthsRange]);

  const loadCounts = async () => {
    setLoadingDashboardData(true);
    try {
      const d: any = await dashboardApi.getCounts({ months: monthsRange });
      setCreatedCount(d.createdTotal ?? null);
      setPendingCount(d.pendingTotal ?? null);
      setActiveUsersCount(d.activeUsers ?? null);
      setPartsLowStock(d.partsLowStock ?? null);
      setSuppliesLowStock(d.suppliesLowStock ?? null);
      setMonthlyStatus(Array.isArray(d.monthlyStatus) ? d.monthlyStatus : null);
      setWoByTemplateType(Array.isArray(d.woByTemplateType) ? d.woByTemplateType : null);
      if (Array.isArray(d.branches) && d.branches.length > 0) {
        setBranchesData(d.branches || []);
      } else {
        setBranchesData(null);
        setWeeklyCounts(Array.isArray(d.weeklyCounts) ? d.weeklyCounts : []);
      }
    } catch (e) {
      console.error('dashboard load err', e);
    } finally {
      setLoadingDashboardData(false);
    }
  };

  const history = useHistory();
  const { t } = useTranslation();

  // helpers for charts
  const monthsLabels = monthlyStatus ? monthlyStatus.map(m => m.month) : [];
  const monthlyMax = monthlyStatus ? Math.max(1, ...monthlyStatus.flatMap((m:any) => [m.completed||0, m.in_progress||0, m.delayed||0])) : 1;

  // derive series/options for ApexCharts
  const rootStyles = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null;
  const colorCompleted = (rootStyles?.getPropertyValue('--success-text') || '#16a34a').trim();
  const colorInProgress = (rootStyles?.getPropertyValue('--primary-accent') || '#3b82f6').trim();
  const colorDelayed = (rootStyles?.getPropertyValue('--danger') || '#ef4444').trim();

  const stateLabels = {
    completed: t('dashboard.state.completed', { defaultValue: 'Completadas' }),
    in_progress: t('dashboard.state.in_progress', { defaultValue: 'En ejecución' }),
    delayed: t('dashboard.state.delayed', { defaultValue: 'Retrasadas' })
  };

  const barSeries = monthlyStatus ? [
    { name: stateLabels.completed, data: monthlyStatus.map((m:any) => m.completed || 0) },
    { name: stateLabels.in_progress, data: monthlyStatus.map((m:any) => m.in_progress || 0) },
    { name: stateLabels.delayed, data: monthlyStatus.map((m:any) => m.delayed || 0) }
  ] : [];

  const barOptions: any = {
    chart: { type: 'bar', toolbar: { show: false }, animations: { enabled: true } },
    plotOptions: { bar: { horizontal: false, columnWidth: '40%' } },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 0 },
    xaxis: { categories: monthsLabels },
    yaxis: { title: { text: undefined } },
    tooltip: { shared: false, intersect: true },
    colors: [colorCompleted, colorInProgress, colorDelayed]
  };

  const donutSeries = woByTemplateType ? woByTemplateType.map((it:any) => it.count || 0) : [];
  const donutOptions: any = {
    chart: { type: 'donut', toolbar: { show: false } },
    labels: woByTemplateType ? woByTemplateType.map((it:any) => it.label) : [],
    legend: { position: 'right' },
    colors: (() => {
      if (!woByTemplateType) return [];
      const platformVars = ['--primary-accent', '--success-text', '--warning', '--danger', '--primary-dark', '--tertiary', '--info'];
      const fallback = ['#60a5fa','#34d399','#f97316','#ef4444','#a78bfa','#67e8f9'];
      return woByTemplateType.map((_, idx:any) => {
        const varName = platformVars[idx % platformVars.length];
        const cssVal = (rootStyles?.getPropertyValue(varName) || '').trim();
        return cssVal || fallback[idx % fallback.length];
      });
    })()
  };

  // Weekly labels (last 7 days) for charts
  const weekdaysNames = t('workOrdersCreate.calendar.weekdays', { returnObjects: true }) as string[];
  const today = new Date();
  const weeklyLabels = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - i));
    const idx = (d.getDay() + 6) % 7;
    return weekdaysNames && Array.isArray(weekdaysNames) && weekdaysNames[idx]
      ? weekdaysNames[idx]
      : d.toLocaleDateString(undefined, { weekday: 'short' });
  });

  const weeklySeries = [{ name: t('dashboard.weeklyActivity'), data: (weeklyCounts && weeklyCounts.length === 7) ? weeklyCounts : [0,0,0,0,0,0,0] }];
  const weeklyOptions: any = {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { horizontal: false, columnWidth: '60%' } },
    dataLabels: { enabled: false },
    xaxis: { categories: weeklyLabels },
    yaxis: { labels: { formatter: (val: number) => String(val) } },
    colors: [colorInProgress]
  };


  return (
    <IonPage>
      <IonContent className="main-wrapper ion-padding">
        <div className="page-header">
          <div className="page-title">
            <h1>{t('nav.dashboard')}</h1>
            <p>{t('dashboard.subtitle')}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 24 }}>
          <div className="table-container">
            <div style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>{t('dashboard.createdOrders.label')}</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{createdCount === null ? '—' : createdCount}</div>
            <div style={{ fontSize: 12, color: '#FB8C00' }} id="created-delta"><i className="fas fa-arrow-up"></i> {t('dashboard.createdOrders.delta')}</div>
          </div>
          <div className="table-container">
            <div style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>{t('dashboard.pendingOrders.label')}</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{pendingCount === null ? '—' : pendingCount}</div>
            <div style={{ fontSize: 12, color: pendingCount && pendingCount > 0 ? '#D32F2F' : 'var(--text-secondary)' }}>{pendingCount && pendingCount > 0 ? t('dashboard.pendingOrders.attention') : t('dashboard.pendingOrders.noCritical')}</div>
          </div>
          <div className="table-container">
            <div style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>{t('dashboard.activeUsers.label')}</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{activeUsersCount === null ? '—' : activeUsersCount}</div>
            <div style={{ fontSize: 12, color: 'var(--success-text)' }}>{t('dashboard.activeUsers.subtitle')}</div>
          </div>
          <div className="table-container" onClick={() => history.push('/logistics/parts?lowStock=1')} style={{ cursor: 'pointer' }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>{t('dashboard.partsToPurchase.label')}</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{partsLowStock === null ? '—' : partsLowStock}</div>
            <div style={{ fontSize: 12, color: partsLowStock && partsLowStock > 0 ? '#D32F2F' : 'var(--text-secondary)' }}>{partsLowStock && partsLowStock > 0 ? t('dashboard.partsToPurchase.needPurchase') : t('dashboard.partsToPurchase.noUrgency')}</div>
          </div>
          <div className="table-container" onClick={() => history.push('/logistics/supplies?lowStock=1')} style={{ cursor: 'pointer' }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>{t('dashboard.suppliesToPurchase.label')}</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{suppliesLowStock === null ? '—' : suppliesLowStock}</div>
            <div style={{ fontSize: 12, color: suppliesLowStock && suppliesLowStock > 0 ? '#D32F2F' : 'var(--text-secondary)' }}>{suppliesLowStock && suppliesLowStock > 0 ? t('dashboard.suppliesToPurchase.needPurchase') : t('dashboard.suppliesToPurchase.noUrgency')}</div>
          </div>
        </div>

        <IonGrid>
          <IonRow style={{ alignItems: 'stretch' }}>
            <IonCol sizeMd={'12'} sizeLg={'8'} sizeXl={'8'} >
              <div className="table-container" style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>{t('dashboard.monthlyStatus.title', { months: monthsRange })}</h3>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <IonItem style={{ width: 180 }}>
                      <IonLabel>{t('dashboard.monthlyStatus.rangeLabel')}</IonLabel>
                      <IonSelect value={monthsRange} onIonChange={(e) => setMonthsRange(Number(e.detail.value))}>
                        <IonSelectOption value={6}>6 {t('dashboard.monthlyStatus.months')}</IonSelectOption>
                        <IonSelectOption value={12}>12 {t('dashboard.monthlyStatus.months')}</IonSelectOption>
                      </IonSelect>
                    </IonItem>
                  </div>
                </div>

                {loadingDashboardData && <div style={{ display: 'flex', justifyContent: 'center' }}><IonSpinner name="crescent" /></div>}
                {!loadingDashboardData && monthlyStatus && (
                  <div style={{ padding: 8 }}>
                    <Chart options={barOptions} series={barSeries} type="bar" height={240} />
                  </div>
                )}
              </div>
            </IonCol>

            <IonCol sizeMd={'12'} sizeLg={'4'} sizeXl={'4'} >
              <div className="table-container" style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <h3 style={{ marginBottom: 12 }}>{t('dashboard.byTemplateType.title')}</h3>
                {loadingDashboardData && <div style={{ display: 'flex', justifyContent: 'center' }}><IonSpinner name="crescent" /></div>}
                {!loadingDashboardData && woByTemplateType && (
                  <div style={{ maxWidth: 900, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Chart options={donutOptions} series={donutSeries} type={"donut"} height={240} />
                  </div>
                )}
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>

        <div className="table-container">
          <h3 style={{ marginBottom: 12 }}>{t('dashboard.weeklyActivity')}</h3>
          {branchesData ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {branchesData.map((b: any) => (
                <div key={b._id} style={{ padding: 12, borderRadius: 6, border: '1px solid #eee' }}>
                  <div style={{ fontWeight: 700 }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('dashboard.branchStats', { created: b.createdTotal, pending: b.pendingTotal })}</div>
                  <div style={{ marginTop: 8 }}>
                    <Chart
                      options={{
                        chart: { toolbar: { show: false } },
                        xaxis: { categories: weeklyLabels },
                        plotOptions: { bar: { columnWidth: '60%' } },
                        dataLabels: { enabled: false },
                        colors: [colorInProgress],
                        tooltip: { enabled: true }
                      }}
                      series={[{ name: b.name, data: (b.weeklyCounts && b.weeklyCounts.length === 7) ? b.weeklyCounts : [0,0,0,0,0,0,0] }]}
                      type="bar"
                      height={120}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ paddingTop: 6, paddingBottom: 6 }}>
              <Chart options={weeklyOptions} series={weeklySeries} type="bar" height={200} />
            </div>
          )}
          {!branchesData && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              {(() => {
                const weekdays = t('workOrdersCreate.calendar.weekdays', { returnObjects: true }) as string[];
                return Array.from({ length: 7 }).map((_, i) => {
                  const today = new Date();
                  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - i));
                  const idx = (d.getDay() + 6) % 7; // convert JS Sunday=0 to array starting Mon=0
                  const label = weekdays && Array.isArray(weekdays) && weekdays[idx] ? weekdays[idx] : d.toLocaleDateString(undefined, { weekday: 'short' });
                  return <div key={i} style={{ flex: 1, textAlign: 'center' }}>{label}</div>;
                });
              })()}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
