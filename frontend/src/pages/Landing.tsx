import React from 'react';
import { useHistory } from 'react-router-dom';
import '../styles/landing.css';
import { IonContent, IonPage } from '@ionic/react';

const Landing: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
        <IonContent>
            <div className="landing-root">
                <header className="landing-hero">
                    <div className="hero-content">
                    <h1 className="hero-title">Gestiona mantenimientos con pautas y órdenes de trabajo</h1>
                    <p className="hero-sub">Crea pautas personalizadas, asigna y sigue órdenes en tiempo real, y ofrece a tu equipo móvil las herramientas para ejecutar trabajos con fotos y geolocalización.</p>
                    <div className="hero-ctas">
                        <button className="btn btn-primary" onClick={() => history.push('/auth/register')}>Comenzar (Registro)</button>
                        <button className="btn btn-secondary" onClick={() => history.push('/auth/login')}>Ya tengo cuenta</button>
                    </div>
                    </div>
                    <div className="hero-visual">
                    <div className="mock-phone">
                        <div className="mock-screen">
                        <div className="mock-header">Órdenes asignadas</div>
                        <ul className="mock-list">
                            <li><strong>#24</strong> Revisión ascensores — <span>Asignado</span></li>
                            <li><strong>#25</strong> Cambio filtros HVAC — <span>Iniciado</span></li>
                            <li><strong>#26</strong> Revisión luminarias — <span>En revisión</span></li>
                        </ul>
                        </div>
                    </div>
                    </div>
                </header>

                <section className="features">
                    <h2>Por qué elegirnos</h2>
                    <div className="features-grid">
                    <article className="feature-card">
                        <h3>Constructor de Pautas</h3>
                        <p>Crea formularios arrastrando componentes y guarda plantillas reutilizables para cualquier tipo de trabajo.</p>
                    </article>
                    <article className="feature-card">
                        <h3>Flujo de Órdenes Inteligente</h3>
                        <p>Estados controlados (Creado → Asignado → Iniciado → En revisión → Terminado) con validación en backend.</p>
                    </article>
                    <article className="feature-card">
                        <h3>Mobile-first</h3>
                        <p>App móvil para ejecutores: cámara, ubicación y envío de adjuntos desde el mismo flujo de trabajo.</p>
                    </article>
                    <article className="feature-card">
                        <h3>Notificaciones en tiempo real</h3>
                        <p>Socket.io para eventos instantáneos por usuario y por organización.</p>
                    </article>
                    <article className="feature-card">
                        <h3>Gestión de Roles y Permisos</h3>
                        <p>Roles por organización con permisos detallados para controlar accesos y jerarquías.</p>
                    </article>
                    <article className="feature-card">
                        <h3>Almacenamiento seguro</h3>
                        <p>Adjuntos organizados por organización y tipo; límite 5 MB por archivo en esta versión.</p>
                    </article>
                    </div>
                </section>

                <section className="summary-cta">
                    <div className="summary-inner">
                    <h2>Listo para mejorar la gestión de mantenimiento?</h2>
                    <p>Empieza gratis creando tu organización y el primer administrador. Numera órdenes por organización y gestiona el trabajo con trazabilidad completa.</p>
                    <div className="hero-ctas">
                        <button className="btn btn-primary" onClick={() => history.push('/auth/register')}>Crear organización</button>
                        <button className="btn btn-secondary" onClick={() => history.push('/auth/login')}>Ver demo / Login</button>
                    </div>
                    </div>
                </section>

                <footer className="landing-footer">
                    <div>© {new Date().getFullYear()} Sistema de Gestión — MVP</div>
                    <div className="footer-links">
                    <a href="#">Privacidad</a>
                    <a href="#">Términos</a>
                    <a href="#">Contacto</a>
                    </div>
                </footer>
                </div>
        </IonContent>
    </IonPage>
  );
};

export default Landing;
