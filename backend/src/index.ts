import branchTypesRoutes from './routes/branchTypes';
import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { connectDB } from './utils/db';
// Ensure all mongoose models are registered
import './models';
import authRoutes from './routes/auth';
import countersRoutes from './routes/counters';
import usersRoutes from './routes/users';
import rolesRoutes from './routes/roles';
import templatesRoutes from './routes/templates';
import templateTypesRoutes from './routes/templateTypes';
import workOrdersRoutes from './routes/workOrders';
import dashboardRoutes from './routes/dashboard';
import branchesRoutes from './routes/branches';
import organizationsRoutes from './routes/organizations';
import brandsRoutes from './routes/brands';
import deviceModelsRoutes from './routes/deviceModels';
import assetTypesRoutes from './routes/assetTypes';
import assetsRoutes from './routes/assets';
import partsRoutes from './routes/parts';
import suppliesRoutes from './routes/supplies';
import importsRoutes from './routes/imports';
import lotsRoutes from './routes/lots';
import typePurchasesRoutes from './routes/typePurchases';
import inventoryRoutes from './routes/inventory';
import filesRoutes from './routes/files';
import notificationsRoutes from './routes/notifications';
import pushTokensRoutes from './routes/pushTokens';
import pushRoutes from './routes/push';
import costsRoutes from './routes/costs';
import metricsRoutes from './routes/metrics';
import reportingRoutes from './routes/reporting';
import publicRoutes from './routes/public';
import devRoutes from './routes/dev';
import BranchType from './models/BranchType';

const PORT = process.env.PORT || 5102;
const app = express();
const server = http.createServer(app);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5100';
const APP_URL = process.env.APP_URL || 'http://localhost:5101';
const APP_URL_EXTERNAL = process.env.APP_URL_EXTERNAL || 'http://localhost:5101';

console.log('Allowed origins:', { FRONTEND_URL, APP_URL, APP_URL_EXTERNAL });

const allowedOrigins = [FRONTEND_URL, APP_URL, APP_URL_EXTERNAL, 'https://localhost'].filter(Boolean);
const io = new IOServer(server, { cors: { origin: allowedOrigins, credentials: true } });

app.use(cors({ origin: allowedOrigins, credentials: true }));
// increase global body size limits to accept large offline-save payloads (base64 data URLs)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

app.get('/', (req, res, next) => {
  const candidates = [
    path.join(__dirname, '..', 'frontend', 'dist'),
    path.join(__dirname, '..', '..', 'frontend', 'dist'),
    path.join(process.cwd(), 'frontend', 'dist'),
  ];
  const dist = candidates.find((p) => fs.existsSync(path.join(p, 'index.html')));
  if (dist) {
    return res.sendFile(path.join(dist, 'index.html'));
  }
  return res.json({ ok: true, version: '0.1.0' });
});


app.use('/api/auth', authRoutes);
app.use('/api/counters', countersRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/work-orders', workOrdersRoutes);
app.use('/api/template-types', templateTypesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/branches', branchesRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/device-models', deviceModelsRoutes);
app.use('/api/asset-types', assetTypesRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/parts', partsRoutes);
app.use('/api/supplies', suppliesRoutes);
app.use('/api/imports', importsRoutes);
app.use('/api/lots', lotsRoutes);
app.use('/api/type-purchases', typePurchasesRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/push-tokens', pushTokensRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/costs', costsRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/reporting', reportingRoutes);
app.use('/api/branch-types', branchTypesRoutes);

// Dev-only routes (protected at runtime)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/dev', devRoutes);
}

// Public endpoints (token-based access)
app.use('/public', publicRoutes);

// Serve uploaded images publicly from backend/files/images
const imagesPath = path.join(__dirname, '..', 'files', 'images');
app.use('/images', express.static(imagesPath));

// Serve all uploaded files publicly from backend/files
const filesPath = path.join(__dirname, '..', 'files');
app.use('/files', express.static(filesPath));

// Try to locate frontend/dist in likely locations and serve it as static

app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'dist')));

app.get('*', (req, res, next) => {
  // Don't override API, images or socket routes
  if (req.path.startsWith('/api') || req.path.startsWith('/images') || req.path.startsWith('/socket.io')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html'));
});


io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  socket.on('joinOrg', (orgId: string) => {
    socket.join(`org:${orgId}`);
  });
  socket.on('joinUser', (userId: string) => {
    socket.join(`user:${userId}`);
  });
});

// expose io to controllers via app
app.set('io', io);

connectDB()
  .then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    // Tipos de sucursales comunes en negocios de servicios
    const branchTypesSeed = [
      { name: 'Taller', description: 'Sucursal dedicada a reparaciones o mantenimiento.' },
      { name: 'Bodega', description: 'Almacenamiento de insumos, repuestos o productos.' },
      { name: 'Mercado', description: 'Punto de venta de productos frescos o abarrotes.' },
      { name: 'Punto de Venta', description: 'Lugar donde se realiza la venta directa al cliente.' },
      { name: 'Sala de Ventas', description: 'Espacio para exhibición y venta de productos.' },
      { name: 'Administración', description: 'Oficinas administrativas de la empresa.' },
      { name: 'Centro de Distribución', description: 'Lugar de recepción y despacho de productos.' },
      { name: 'Centro de Servicio', description: 'Atención y soporte a clientes.' },
      { name: 'Oficina Comercial', description: 'Gestión comercial y ventas corporativas.' },
      { name: 'Otros', description: 'Otro tipo de sucursal no especificado.' }
    ];
    // Seed para BranchType
    async function seedBranchTypes() {
      for (const bt of branchTypesSeed) {
        const findBt = await BranchType.findOne({ name: bt.name }).lean();
        if (findBt) {
          // Si ya existe, actualizar descripción si es diferente
          if (findBt.description !== bt.description) {
            await BranchType.updateOne({ name: bt.name }, { $set: { description: bt.description } });
          }
        } else {
          await BranchType.create(bt);
        }
      }
      console.log('BranchTypes seeded');
    }
    // Llamar a la función de seed de BranchType en el flujo principal
    // ...existing code...
    // Al final del script o en el flujo principal:
    seedBranchTypes().catch(console.error);
    
  })
  .catch((err) => {
    console.error('Failed to connect DB', err);
    process.exit(1);
  });
