"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const branchTypes_1 = __importDefault(require("./routes/branchTypes"));
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const db_1 = require("./utils/db");
// Ensure all mongoose models are registered
require("./models");
const auth_1 = __importDefault(require("./routes/auth"));
const counters_1 = __importDefault(require("./routes/counters"));
const users_1 = __importDefault(require("./routes/users"));
const roles_1 = __importDefault(require("./routes/roles"));
const templates_1 = __importDefault(require("./routes/templates"));
const templateTypes_1 = __importDefault(require("./routes/templateTypes"));
const workOrders_1 = __importDefault(require("./routes/workOrders"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const branches_1 = __importDefault(require("./routes/branches"));
const organizations_1 = __importDefault(require("./routes/organizations"));
const brands_1 = __importDefault(require("./routes/brands"));
const deviceModels_1 = __importDefault(require("./routes/deviceModels"));
const assetTypes_1 = __importDefault(require("./routes/assetTypes"));
const assets_1 = __importDefault(require("./routes/assets"));
const parts_1 = __importDefault(require("./routes/parts"));
const supplies_1 = __importDefault(require("./routes/supplies"));
const imports_1 = __importDefault(require("./routes/imports"));
const lots_1 = __importDefault(require("./routes/lots"));
const typePurchases_1 = __importDefault(require("./routes/typePurchases"));
const inventory_1 = __importDefault(require("./routes/inventory"));
const files_1 = __importDefault(require("./routes/files"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const pushTokens_1 = __importDefault(require("./routes/pushTokens"));
const push_1 = __importDefault(require("./routes/push"));
const costs_1 = __importDefault(require("./routes/costs"));
const metrics_1 = __importDefault(require("./routes/metrics"));
const reporting_1 = __importDefault(require("./routes/reporting"));
const public_1 = __importDefault(require("./routes/public"));
const dev_1 = __importDefault(require("./routes/dev"));
const BranchType_1 = __importDefault(require("./models/BranchType"));
const PORT = process.env.PORT || 5102;
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5100';
const APP_URL = process.env.APP_URL || 'http://localhost:5101';
const APP_URL_EXTERNAL = process.env.APP_URL_EXTERNAL || 'http://localhost:5101';
console.log('Allowed origins:', { FRONTEND_URL, APP_URL, APP_URL_EXTERNAL });
const allowedOrigins = [FRONTEND_URL, APP_URL, APP_URL_EXTERNAL, 'https://localhost'].filter(Boolean);
const io = new socket_io_1.Server(server, { cors: { origin: allowedOrigins, credentials: true } });
app.use((0, cors_1.default)({ origin: allowedOrigins, credentials: true }));
// increase global body size limits to accept large offline-save payloads (base64 data URLs)
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
app.use((0, cookie_parser_1.default)());
app.get('/', (req, res, next) => {
    const candidates = [
        path_1.default.join(__dirname, '..', 'frontend', 'dist'),
        path_1.default.join(__dirname, '..', '..', 'frontend', 'dist'),
        path_1.default.join(process.cwd(), 'frontend', 'dist'),
    ];
    const dist = candidates.find((p) => fs_1.default.existsSync(path_1.default.join(p, 'index.html')));
    if (dist) {
        return res.sendFile(path_1.default.join(dist, 'index.html'));
    }
    return res.json({ ok: true, version: '0.1.0' });
});
app.use('/api/auth', auth_1.default);
app.use('/api/counters', counters_1.default);
app.use('/api/users', users_1.default);
app.use('/api/roles', roles_1.default);
app.use('/api/templates', templates_1.default);
app.use('/api/work-orders', workOrders_1.default);
app.use('/api/template-types', templateTypes_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/brands', brands_1.default);
app.use('/api/branches', branches_1.default);
app.use('/api/organizations', organizations_1.default);
app.use('/api/device-models', deviceModels_1.default);
app.use('/api/asset-types', assetTypes_1.default);
app.use('/api/assets', assets_1.default);
app.use('/api/parts', parts_1.default);
app.use('/api/supplies', supplies_1.default);
app.use('/api/imports', imports_1.default);
app.use('/api/lots', lots_1.default);
app.use('/api/type-purchases', typePurchases_1.default);
app.use('/api/files', files_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/push-tokens', pushTokens_1.default);
app.use('/api/push', push_1.default);
app.use('/api/inventory', inventory_1.default);
app.use('/api/costs', costs_1.default);
app.use('/api/metrics', metrics_1.default);
app.use('/api/reporting', reporting_1.default);
app.use('/api/branch-types', branchTypes_1.default);
// Dev-only routes (protected at runtime)
if (process.env.NODE_ENV !== 'production') {
    app.use('/api/dev', dev_1.default);
}
// Public endpoints (token-based access)
app.use('/public', public_1.default);
// Serve uploaded images publicly from backend/files/images
const imagesPath = path_1.default.join(__dirname, '..', 'files', 'images');
app.use('/images', express_1.default.static(imagesPath));
// Serve all uploaded files publicly from backend/files
const filesPath = path_1.default.join(__dirname, '..', 'files');
app.use('/files', express_1.default.static(filesPath));
// Try to locate frontend/dist in likely locations and serve it as static
app.use(express_1.default.static(path_1.default.join(__dirname, '..', '..', 'frontend', 'dist')));
app.get('*', (req, res, next) => {
    // Don't override API, images or socket routes
    if (req.path.startsWith('/api') || req.path.startsWith('/images') || req.path.startsWith('/socket.io')) {
        return next();
    }
    res.sendFile(path_1.default.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html'));
});
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
(0, db_1.connectDB)()
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
            const findBt = await BranchType_1.default.findOne({ name: bt.name }).lean();
            if (findBt) {
                // Si ya existe, actualizar descripción si es diferente
                if (findBt.description !== bt.description) {
                    await BranchType_1.default.updateOne({ name: bt.name }, { $set: { description: bt.description } });
                }
            }
            else {
                await BranchType_1.default.create(bt);
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
