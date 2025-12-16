import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../utils/db';
import Role from '../models/Role';
import User from '../models/User';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

async function seed() {
  await connectDB();

  const orgId = new mongoose.Types.ObjectId();

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

  let owner = await Role.findOne({ orgId, name: 'Owner' }).lean();
  if (!owner) {
    owner = await Role.create({ orgId, name: 'Owner', permissions: ownerPerms, hierarchyLevel: 100 });
    console.log('Created Owner role');
  }

  const existing = await User.findOne({ email: 'gonzalo.orellana@kauel.com' }).lean();
  if (!existing) {
    const pwd = '123456';
    const hash = await bcrypt.hash(pwd, 10);
    const newUser = await User.create({
      orgId,
      firstName: 'Gonzalo',
      lastName: 'Orellana',
      email: 'gonzalo.orellana@kauel.com',
      passwordHash: hash,
      roleId: owner._id,
      isAdmin: true,
      isSuperAdmin: true
    } as any);
    console.log('Created superadmin user Gonzalo:', newUser.email);
  } else {
    console.log('Superadmin already exists');
  }

  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
