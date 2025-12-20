"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const db_1 = require("./utils/db");
const auth_1 = __importDefault(require("./routes/auth"));
const counters_1 = __importDefault(require("./routes/counters"));
const users_1 = __importDefault(require("./routes/users"));
const roles_1 = __importDefault(require("./routes/roles"));
const templates_1 = __importDefault(require("./routes/templates"));
const workOrders_1 = __importDefault(require("./routes/workOrders"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const branches_1 = __importDefault(require("./routes/branches"));
const organizations_1 = __importDefault(require("./routes/organizations"));
const brands_1 = __importDefault(require("./routes/brands"));
const deviceModels_1 = __importDefault(require("./routes/deviceModels"));
const assetTypes_1 = __importDefault(require("./routes/assetTypes"));
const assets_1 = __importDefault(require("./routes/assets"));
const files_1 = __importDefault(require("./routes/files"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const pushTokens_1 = __importDefault(require("./routes/pushTokens"));
const push_1 = __importDefault(require("./routes/push"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5100';
const APP_URL = process.env.APP_URL || 'http://localhost:5101';
const APP_URL_EXTERNAL = process.env.APP_URL_EXTERNAL || 'http://localhost:5101';
console.log('Allowed origins:', { FRONTEND_URL, APP_URL, APP_URL_EXTERNAL });
const allowedOrigins = [FRONTEND_URL, APP_URL, APP_URL_EXTERNAL, 'https://localhost'].filter(Boolean);
const io = new socket_io_1.Server(server, { cors: { origin: allowedOrigins, credentials: true } });
app.use((0, cors_1.default)({ origin: allowedOrigins, credentials: true }));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.get('/', (req, res) => res.json({ ok: true, version: '0.1.0' }));
app.use('/api/auth', auth_1.default);
app.use('/api/counters', counters_1.default);
app.use('/api/users', users_1.default);
app.use('/api/roles', roles_1.default);
app.use('/api/templates', templates_1.default);
app.use('/api/work-orders', workOrders_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/brands', brands_1.default);
app.use('/api/branches', branches_1.default);
app.use('/api/organizations', organizations_1.default);
app.use('/api/device-models', deviceModels_1.default);
app.use('/api/asset-types', assetTypes_1.default);
app.use('/api/assets', assets_1.default);
app.use('/api/files', files_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/push-tokens', pushTokens_1.default);
app.use('/api/push', push_1.default);
// Serve uploaded images publicly from backend/files/images
const imagesPath = path_1.default.join(__dirname, '..', 'files', 'images');
app.use('/images', express_1.default.static(imagesPath));
io.on('connection', (socket) => {
    console.log('socket connected', socket.id);
    socket.on('joinOrg', (orgId) => {
        socket.join(`org:${orgId}`);
    });
    socket.on('joinUser', (userId) => {
        socket.join(`user:${userId}`);
    });
});
// expose io to controllers via app
app.set('io', io);
const PORT = process.env.PORT || 5102;
(0, db_1.connectDB)()
    .then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
    .catch((err) => {
    console.error('Failed to connect DB', err);
    process.exit(1);
});
