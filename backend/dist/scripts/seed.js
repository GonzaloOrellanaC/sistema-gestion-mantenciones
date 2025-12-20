"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const db_1 = require("../utils/db");
const Role_1 = __importDefault(require("../models/Role"));
const User_1 = __importDefault(require("../models/User"));
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
async function seed() {
    await (0, db_1.connectDB)();
    const orgId = new mongoose_1.default.Types.ObjectId();
    // Owner role: explicit permissions (all true)
    const ownerPerms = {
        editarUsuarios: true,
        verPautas: true,
        crearPautas: true,
        editarPautas: true,
        asignarOT: true,
        supervisar: true,
        aprobarRechazar: true,
        crearRoles: true,
        editarRoles: true,
        agregarGerencias: true,
        editarGerencias: true,
        crearSucursales: true,
        editarSucursales: true,
        crearInsumos: true,
        editarInsumos: true,
        crearElementos: true,
        editarElementos: true
    };
    let owner = await Role_1.default.findOne({ orgId, name: 'Owner' }).lean();
    if (!owner) {
        owner = await Role_1.default.create({ orgId, name: 'Owner', permissions: ownerPerms, hierarchyLevel: 100 });
        console.log('Created Owner role');
    }
    const existing = await User_1.default.findOne({ email: 'gonzalo.orellana@kauel.com' }).lean();
    if (!existing) {
        const pwd = '123456';
        const hash = await bcrypt_1.default.hash(pwd, 10);
        const newUser = await User_1.default.create({
            orgId,
            firstName: 'Gonzalo',
            lastName: 'Orellana',
            email: 'gonzalo.orellana@kauel.com',
            passwordHash: hash,
            roleId: owner._id,
            isAdmin: true,
            isSuperAdmin: true
        });
        console.log('Created superadmin user Gonzalo:', newUser.email);
    }
    else {
        console.log('Superadmin already exists');
    }
    process.exit(0);
}
seed().catch((e) => {
    console.error(e);
    process.exit(1);
});
