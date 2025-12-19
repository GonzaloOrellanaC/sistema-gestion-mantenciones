import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { connectDB } from './utils/db';
import authRoutes from './routes/auth';
import countersRoutes from './routes/counters';
import usersRoutes from './routes/users';
import rolesRoutes from './routes/roles';
import templatesRoutes from './routes/templates';
import workOrdersRoutes from './routes/workOrders';
import dashboardRoutes from './routes/dashboard';
import branchesRoutes from './routes/branches';
import organizationsRoutes from './routes/organizations';
import brandsRoutes from './routes/brands';
import deviceModelsRoutes from './routes/deviceModels';
import assetTypesRoutes from './routes/assetTypes';
import assetsRoutes from './routes/assets';
import dashboardRoutes from './routes/dashboard';
import filesRoutes from './routes/files';
import notificationsRoutes from './routes/notifications';
import pushTokensRoutes from './routes/pushTokens';
import pushRoutes from './routes/push';

const app = express();
const server = http.createServer(app);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5100';
const APP_URL = process.env.APP_URL || 'http://localhost:5101';
const APP_URL_EXTERNAL = process.env.APP_URL_EXTERNAL || 'http://localhost:5101';

console.log('Allowed origins:', { FRONTEND_URL, APP_URL, APP_URL_EXTERNAL });

const allowedOrigins = [FRONTEND_URL, APP_URL, APP_URL_EXTERNAL, 'https://localhost'].filter(Boolean);
const io = new IOServer(server, { cors: { origin: allowedOrigins, credentials: true } });

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => res.json({ ok: true, version: '0.1.0' }));


app.use('/api/auth', authRoutes);
app.use('/api/counters', countersRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/work-orders', workOrdersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/branches', branchesRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/device-models', deviceModelsRoutes);
app.use('/api/asset-types', assetTypesRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/push-tokens', pushTokensRoutes);
app.use('/api/push', pushRoutes);

// Serve uploaded images publicly from backend/files/images
const imagesPath = path.join(__dirname, '..', 'files', 'images');
app.use('/images', express.static(imagesPath));

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

const PORT = process.env.PORT || 5102;

connectDB()
  .then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect DB', err);
    process.exit(1);
  });
