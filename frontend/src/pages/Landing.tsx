import React from 'react';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonFooter
} from '@ionic/react';
import {
  arrowForward,
  calendarOutline,
  constructOutline,
  cubeOutline,
  peopleOutline,
  barChartOutline,
  syncOutline,
  checkmarkCircle
} from 'ionicons/icons';
import '../styles/landing.css';
import { useHistory } from 'react-router-dom';

const IllustrationDashboard: React.FC = () => (
  <svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" className="illustration-dashboard" aria-hidden>
    <defs>
      <linearGradient id="g1" x1="0" x2="1">
        <stop offset="0" stopColor="#5b8def" />
        <stop offset="1" stopColor="#7dd3fc" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="100%" height="100%" rx="16" fill="url(#g1)" opacity="0.08" />
    <g transform="translate(30,30)">
      <rect x="0" y="0" width="300" height="200" rx="10" fill="#ffffff" opacity="0.08" />
      <rect x="12" y="14" width="110" height="18" rx="6" fill="#ffffff" opacity="0.12" />
      <rect x="12" y="44" width="260" height="12" rx="6" fill="#ffffff" opacity="0.06" />
      <rect x="12" y="64" width="120" height="10" rx="6" fill="#ffffff" opacity="0.06" />
      <g transform="translate(12,90)">
        <rect x="0" y="0" width="260" height="80" rx="8" fill="#fff" opacity="0.03" />
        <rect x="8" y="8" width="60" height="60" rx="8" fill="#fff" opacity="0.12" />
        <rect x="78" y="8" width="170" height="12" rx="6" fill="#fff" opacity="0.12" />
        <rect x="78" y="28" width="120" height="10" rx="6" fill="#fff" opacity="0.06" />
      </g>
    </g>
    <g transform="translate(360,40)">
      <rect x="0" y="0" width="200" height="80" rx="8" fill="#fff" opacity="0.06" />
      <g transform="translate(12,10)">
        <rect x="0" y="0" width="40" height="40" rx="6" fill="#fff" opacity="0.12" />
        <rect x="54" y="0" width="120" height="18" rx="6" fill="#fff" opacity="0.12" />
      </g>
      <g transform="translate(0,100)">
        <rect x="0" y="0" width="200" height="130" rx="8" fill="#fff" opacity="0.03" />
        <rect x="12" y="12" width="60" height="60" rx="8" fill="#fff" opacity="0.12" />
        <rect x="82" y="12" width="100" height="18" rx="6" fill="#fff" opacity="0.12" />
        <rect x="82" y="36" width="90" height="10" rx="6" fill="#fff" opacity="0.06" />
      </g>
    </g>
  </svg>
);

const FeatureLogo: React.FC<{ fallbackIcon?: any; style?: React.CSSProperties }> = ({ fallbackIcon, style }) => {
  return (
    <div className="icon-wrapper" style={style}>
      {fallbackIcon && <IonIcon icon={fallbackIcon} />}
    </div>
  );
};

const LandingPage: React.FC = () => {
  const history = useHistory();

  const goDemo = () => history.push('/demo');
  const goDocs = () => history.push('/docs');

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="landing-toolbar landing-header">
          <div className="section-container header-inner" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <div className="brand-row">
              <IonTitle className="logo-text">
                <span className="logo-highlight">SGM</span> System
              </IonTitle>
            </div>

            <div className="nav-row">
              <IonButtons className="ion-hide-sm-down">
                <IonButton fill="clear" className="nav-button">Características</IonButton>
                <IonButton fill="clear" className="nav-button">Módulos</IonButton>
              </IonButtons>
              <IonButtons>
                <IonButton fill="outline" color="primary" className="nav-button header-cta">
                  Acceso Clientes
                </IonButton>
              </IonButtons>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="landing-content">
        <section className="hero-section">
          <div className="section-container">
            <IonGrid>
              <IonRow className="ion-align-items-center hero-row">
                <IonCol size="12" sizeMd="7">
                  <div className="hero-content">
                    <div className="badge-pill">Gestión de Mantención v8</div>
                    <h1 className="hero-title">Control Total de sus <span style={{ color: 'var(--ion-color-primary)' }}>Activos</span> y Mantenimiento.</h1>
                    <p className="hero-subtitle">Optimice la gestión de órdenes de trabajo, inventario y planificación. Una solución integral para empresas que buscan eficiencia operativa.</p>
                    <div className="hero-buttons">
                      <IonButton color="primary" size="large" onClick={goDemo}>Solicitar Demo <IonIcon slot="end" icon={arrowForward} /></IonButton>
                      <IonButton color="medium" fill="outline" size="large" onClick={goDocs}>Ver Documentación</IonButton>
                    </div>
                    <div className="hero-features">
                      <IonRow>
                        <IonCol size="6" sizeSm="4" sizeMd="4" className="mini-feature">
                          <div className="mini-icon"><IonIcon icon={constructOutline} /></div>
                          <div className="mini-title">Órdenes</div>
                        </IonCol>
                        <IonCol size="6" sizeSm="4" sizeMd="4" className="mini-feature">
                          <div className="mini-icon"><IonIcon icon={cubeOutline} /></div>
                          <div className="mini-title">Stock</div>
                        </IonCol>
                        <IonCol size="6" sizeSm="4" sizeMd="4" className="mini-feature">
                          <div className="mini-icon"><IonIcon icon={calendarOutline} /></div>
                          <div className="mini-title">Planificación</div>
                        </IonCol>
                      </IonRow>
                    </div>
                  </div>
                </IonCol>

                <IonCol size="12" sizeMd="5">
                  <div className="hero-image-container">
                    <div className="glass-card hero-visual">
                      <img src="/assets/tecnico-mantencion.png" alt="Técnico usando tablet" className="hero-figure" />
                      <div className="dashboard-overlay" aria-hidden>
                        <IllustrationDashboard />
                      </div>
                    </div>
                  </div>
                </IonCol>
              </IonRow>
            </IonGrid>
          </div>
        </section>

        <section className="features-section">
          <div className="section-container">
            <div className="section-header">
              <h2 className="section-title">Todo lo que necesitas en una plataforma</h2>
              <p className="section-description">SGM centraliza todas las operaciones de mantenimiento, desde la solicitud hasta la ejecución y el análisis de costos.</p>
            </div>

            <IonGrid>
              <div className="features-scroll" role="list">
                <IonRow>
                  <IonCol size="12" sizeMd="4" className="ion-margin-bottom feature-item">
                    <IonCard className="feature-card">
                      <IonCardHeader>
                        <FeatureLogo fallbackIcon={constructOutline} style={{ background: 'var(--ion-color-primary-variant)', color: 'var(--ion-color-primary)' }} />
                        <IonCardTitle>Órdenes de Trabajo</IonCardTitle>
                      </IonCardHeader>
                      <IonCardContent>Gestión completa del ciclo de vida de las OTs. Asignación de técnicos, registro de tiempos y control de ejecución en tiempo real.</IonCardContent>
                    </IonCard>
                  </IonCol>

                  <IonCol size="12" sizeMd="4" className="ion-margin-bottom feature-item">
                    <IonCard className="feature-card">
                      <IonCardHeader>
                        <FeatureLogo fallbackIcon={cubeOutline} style={{ background: 'var(--ion-color-secondary)', color: 'var(--ion-color-tertiary)' }} />
                        <IonCardTitle>Gestión de Stock</IonCardTitle>
                      </IonCardHeader>
                      <IonCardContent>Control de insumos y repuestos. Verificación automática de disponibilidad antes de ejecutar trabajos y alertas de stock crítico.</IonCardContent>
                    </IonCard>
                  </IonCol>

                  <IonCol size="12" sizeMd="4" className="ion-margin-bottom feature-item">
                    <IonCard className="feature-card">
                      <IonCardHeader>
                        <FeatureLogo fallbackIcon={calendarOutline} style={{ background: '#E2E8F0', color: 'var(--ion-color-tertiary)' }} />
                        <IonCardTitle>Planificación</IonCardTitle>
                      </IonCardHeader>
                      <IonCardContent>Calendario interactivo para visualizar mantenimientos preventivos y correctivos. Reprogramación drag-and-drop intuitiva.</IonCardContent>
                    </IonCard>
                  </IonCol>

                  <IonCol size="12" sizeMd="4" className="ion-margin-bottom feature-item">
                    <IonCard className="feature-card">
                      <IonCardHeader>
                        <FeatureLogo fallbackIcon={peopleOutline} style={{ background: '#E2E8F0', color: 'var(--ion-color-tertiary)' }} />
                        <IonCardTitle>Roles y Usuarios</IonCardTitle>
                      </IonCardHeader>
                      <IonCardContent>Perfiles personalizables (Administrador, Técnico, Supervisor). Control de acceso granular a bodegas y sucursales.</IonCardContent>
                    </IonCard>
                  </IonCol>

                  <IonCol size="12" sizeMd="4" className="ion-margin-bottom feature-item">
                    <IonCard className="feature-card">
                      <IonCardHeader>
                        <FeatureLogo fallbackIcon={syncOutline} style={{ background: 'var(--ion-color-secondary)', color: 'var(--ion-color-tertiary)' }} />
                        <IonCardTitle>Activos Fijos</IonCardTitle>
                      </IonCardHeader>
                      <IonCardContent>Hoja de vida digital para máquinas, vehículos y electrónicos. Historial de fallas, costos acumulados y garantías.</IonCardContent>
                    </IonCard>
                  </IonCol>

                  <IonCol size="12" sizeMd="4" className="ion-margin-bottom feature-item">
                    <IonCard className="feature-card">
                      <IonCardHeader>
                        <FeatureLogo fallbackIcon={checkmarkCircle} style={{ background: 'var(--ion-color-primary-variant)', color: 'var(--ion-color-primary)' }} />
                        <IonCardTitle>Auditoría</IonCardTitle>
                      </IonCardHeader>
                      <IonCardContent>Trazabilidad completa de movimientos de inventario y cambios de estado en las órdenes. Seguridad y transparencia total.</IonCardContent>
                    </IonCard>
                  </IonCol>
                </IonRow>
              </div>
            </IonGrid>
          </div>
        </section>

        <section className="stats-section">
          <div className="section-container">
            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="4">
                  <div className="stat-item">
                    <span className="stat-number">+25%</span>
                    <span className="stat-label">Vida útil de Activos</span>
                  </div>
                </IonCol>
                <IonCol size="12" sizeMd="4">
                  <div className="stat-item">
                    <span className="stat-number">-15%</span>
                    <span className="stat-label">Costos de Stock</span>
                  </div>
                </IonCol>
                <IonCol size="12" sizeMd="4">
                  <div className="stat-item">
                    <span className="stat-number">99.9%</span>
                    <span className="stat-label">Uptime de Plataforma</span>
                  </div>
                </IonCol>
              </IonRow>
            </IonGrid>
          </div>
        </section>

        <section className="cta-section">
          <div className="section-container">
            <div className="cta-box">
              <h2>¿Listo para optimizar su mantenimiento?</h2>
              <p>Únase a las empresas que ya gestionan sus activos con SGM.</p>
              <IonButton color="light" size="large" className="ion-text-capitalize" style={{ color: 'var(--ion-color-tertiary)', fontWeight: 'bold' }}>
                Agendar Demostración
              </IonButton>
            </div>
          </div>
        </section>

        <IonFooter className="ion-no-border">
          <div className="landing-footer">
            <div className="section-container">
              <p className="footer-text">© {new Date().getFullYear()} SGM - Sistema de Gestión de Mantención. Todos los derechos reservados.</p>
            </div>
          </div>
        </IonFooter>

      </IonContent>
    </IonPage>
  );
};

export default LandingPage;
