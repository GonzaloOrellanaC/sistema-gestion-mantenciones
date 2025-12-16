import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './utils/db';
import authRoutes from './routes/auth';
import countersRoutes from './routes/counters';
import usersRoutes from './routes/users';
import rolesRoutes from './routes/roles';
import templatesRoutes from './routes/templates';
import workOrdersRoutes from './routes/workOrders';
import filesRoutes from './routes/files';

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
app.use('/api/files', filesRoutes);

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
