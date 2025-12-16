// MockApp removed: its UI was distributed across canonical pages.
// File kept intentionally minimal to avoid accidental imports.
export default function MockApp() {
  return null;
}

  function openOrder(order: any) {
    setSelectedOrder(order);
    setView('execution');
  }

  function backToOrders() {
    setSelectedOrder(null);
    setView('tabs');
  }

  return (
    <IonApp>
      {view === 'login' && (
        <IonPage className="view-login">
          <IonContent className="ion-padding" style={{ background: 'transparent' }}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="text-center" style={{ marginBottom: '2.5rem' }}>
                <div style={{ width: 90, height: 90, background: 'white', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 8px 20px rgba(0,0,0,0.05)', color: '#0288D1' }}>
                  <div style={{ fontSize: 36 }}>📄</div>
                </div>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#37474F', margin: 0 }}>SGM</h1>
                <p style={{ color: '#78909C', fontWeight: 500, marginTop: 8 }}>Sistema de Gestión de Mantenciones</p>
              </div>

              <div className="login-card">
                <IonList>
                  <div className="input-group">
                    <input type="text" placeholder="Usuario" className="input-field" />
                  </div>
                  <div className="input-group" style={{ marginBottom: '2rem' }}>
                    <input type="password" placeholder="Contraseña" className="input-field" />
                  </div>
                </IonList>
                <IonButton expand="block" className="btn-primary" onClick={handleLogin}>Ingresar</IonButton>
                <div style={{ marginTop: 12 }}>
                  <IonButton expand="block" onClick={() => { handleLogin(); }}>Entrar con mock</IonButton>
                </div>
              </div>
            </div>
          </IonContent>
        </IonPage>
      )}

      {view === 'tabs' && (
        <IonPage>
          <IonHeader>
            <IonToolbar>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Mis Órdenes</h1>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #81D4FA, #0288D1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{MOCK_USER.avatar}</div>
              </div>
            </IonToolbar>
            <IonToolbar>
              <IonSearchbar placeholder="Buscar orden..." />
            </IonToolbar>
          </IonHeader>

          <IonContent>
            {activeTab === 'orders' && (
              <div style={{ padding: '1rem' }}>
                {MOCK_ORDERS.map((order) => (
                  <OrderCard key={order.id} order={order} onClick={openOrder} />
                ))}
              </div>
            )}

            {activeTab === 'profile' && (
              <div style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2rem', marginBottom: '2rem' }}>
                  <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, #81D4FA, #0288D1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', boxShadow: '0 10px 25px rgba(2, 136, 209, 0.25)', marginBottom: '1rem' }}>{MOCK_USER.avatar}</div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#37474F', margin: 0 }}>{MOCK_USER.name}</h2>
                  <p style={{ color: '#78909C', fontWeight: 500, margin: '4px 0 12px' }}>{MOCK_USER.role}</p>
                </div>

                <IonGrid>
                  <IonRow>
                    <IonCol size="6">
                      <IonCard style={{ textAlign: 'center', margin: 0 }}>
                        <IonCardContent>
                          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0288D1' }}>{MOCK_USER.stats.done}</div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B0BEC5', textTransform: 'uppercase' }}>Finalizadas</div>
                        </IonCardContent>
                      </IonCard>
                    </IonCol>
                    <IonCol size="6">
                      <IonCard style={{ textAlign: 'center', margin: 0 }}>
                        <IonCardContent>
                          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FFA726' }}>{MOCK_USER.stats.pending}</div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B0BEC5', textTransform: 'uppercase' }}>Pendientes</div>
                        </IonCardContent>
                      </IonCard>
                    </IonCol>
                  </IonRow>
                </IonGrid>

                <IonList style={{ marginTop: 16 }}>
                  <div style={{ padding: 12 }}>
                    <IonButton expand="block" onClick={handleLogout}>Cerrar Sesión</IonButton>
                  </div>
                </IonList>
              </div>
            )}
          </IonContent>

          <div className="tab-bar">
            <button className={`tab-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Órdenes</button>
            <button className={`tab-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Perfil</button>
          </div>
        </IonPage>
      )}

      {view === 'execution' && selectedOrder && (
        <IonPage style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 30 }}>
          <IonHeader>
            <IonToolbar style={{ background: 'var(--primary)', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <IonButton onClick={backToOrders} style={{ marginRight: 8 }}>Volver</IonButton>
                <IonTitle>Ejecutar Orden</IonTitle>
              </div>
            </IonToolbar>
          </IonHeader>

          <IonContent style={{ '--background': '#F0F8FF' }}>
            <div style={{ padding: '1rem' }}>
              <IonCard style={{ margin: '0 0 1.5rem', background: 'white' }}>
                <IonCardContent>
                  <h2 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: '#37474F', fontWeight: 700 }}>{selectedOrder.client}</h2>
                  <div style={{ display: 'flex', gap: 8, fontSize: '0.9rem', color: '#78909C', fontWeight: 500 }}>
                    <div>#{selectedOrder.id}</div>
                    <div>|</div>
                    <div>{selectedOrder.type}</div>
                  </div>
                </IonCardContent>
              </IonCard>

              <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#90A4AE', textTransform: 'uppercase', marginBottom: '1rem', marginLeft: '4px' }}>Formulario de Trabajo</h3>

              <FormRenderer schema={MOCK_PAUTA_SCHEMA} />
            </div>

            <IonFab vertical="bottom" horizontal="end">
              <IonFabButton onClick={() => { alert('Orden Finalizada y Sincronizada'); backToOrders(); }}>
                ✅
              </IonFabButton>
            </IonFab>
          </IonContent>
        </IonPage>
      )}
    </IonApp>
  );
}
