import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectDB } from '../utils/db';
import Organization from '../models/Organization';
import Branch from '../models/Branch';
import Role from '../models/Role';
import User from '../models/User';
import Brand from '../models/Brand';
import DeviceModel from '../models/DeviceModel';
import AssetType from '../models/AssetType';
import Asset from '../models/Asset';
import Part from '../models/Part';
import Supply from '../models/Supply';
import PartInventory from '../models/PartInventory';
import SupplyInventory from '../models/SupplyInventory';
import Lot from '../models/Lot';
import TypePurchase from '../models/TypePurchase';
import Template from '../models/Template';
import TemplateType from '../models/TemplateType';
import WorkOrder from '../models/WorkOrder';
import countersService from '../services/countersService';
import MaintenanceEvent from '../models/MaintenanceEvent';
import Purchase from '../models/Purchase';
import MetricsPareto from '../models/MetricsPareto';

async function main() {
  await connectDB();

  // helper to get a random date between now and now + daysAhead
  function randomFutureDate(daysAhead = 60) {
    const now = Date.now();
    const max = now + daysAhead * 24 * 60 * 60 * 1000;
    const t = Math.floor(Math.random() * (max - now)) + now;
    return new Date(t);
  }

  // helper to get a random date in the past (up to daysBack days)
  function randomPastDate(daysBack = 180) {
    const now = Date.now();
    const min = now - daysBack * 24 * 60 * 60 * 1000;
    const t = Math.floor(Math.random() * (now - min)) + min;
    return new Date(t);
  }

  const orgName = 'Cliente Demo - Mantención Camiones';
  console.log('Ensuring organization exists:', orgName);
  let org = await Organization.findOne({ name: orgName });
  if (!org) {
    org = await Organization.create({ name: orgName });
    console.log('Organization created:', org._id.toString());
  } else {
    console.log('Organization already exists:', org._id.toString());
  }

  // Create two branches
  const branchAName = 'Sucursal Norte';
  const branchBName = 'Sucursal Sur';
  let branchA = await Branch.findOne({ orgId: org._id, name: branchAName });
  if (!branchA) branchA = await Branch.create({ orgId: org._id, name: branchAName, address: 'Av. Principal 123', branchType: 'taller' });
  let branchB = await Branch.findOne({ orgId: org._id, name: branchBName });
  if (!branchB) branchB = await Branch.create({ orgId: org._id, name: branchBName, address: 'Calle Secundaria 45', branchType: 'taller' });
  // accumulator for created users and credentials
  let createdUsers: any[] = [];
  // Create a role with permiso para ejecutar OT
  const roleName = 'Técnico OT';
  let role = await Role.findOne({ orgId: org._id, name: roleName });
  if (!role) role = await Role.create({ orgId: org._id, name: roleName, permissions: { ejecutarOT: true, verPautas: true } });

  // Ensure admin role and admin user exist for this org
  const adminRoleName = 'Administrador';
  let adminRole = await Role.findOne({ orgId: org._id, name: adminRoleName });
  if (!adminRole) {
    adminRole = await Role.create({
      orgId: org._id,
      name: adminRoleName,
      permissions: {
        // General / Users
        verTablero: true,
        verUsuarios: true,
        crearUsuarios: true,
        editarUsuarios: true,

        // Templates / Pautas
        verPautas: true,
        crearPautas: true,
        editarPautas: true,

        // Work orders
        verOT: true,
        crearOT: true,
        editarOT: true,
        asignarOT: true,
        ejecutarOT: true,
        supervisar: true,
        aprobarRechazar: true,

        // Roles
        verRoles: true,
        crearRoles: true,
        editarRoles: true,

        // Organization / Cliente
        verOrganizacion: true,
        editarOrganizacion: true,
        verOrganization: true,
        editarOrganization: true,

        // Assets
        verActivos: true,
        crearActivos: true,
        editarActivos: true,

        // Branches
        verSucursales: true,
        crearSucursales: true,
        editarSucursales: true,

        // Supplies (insumos)
        verInsumos: true,
        crearInsumos: true,
        editarInsumos: true,

        // Parts / Repuestos
        verRepuestos: true,
        crearRepuestos: true,
        editarRepuestos: true,

        // Lots
        verLotes: true,
        crearLotes: true,
        editarLotes: true
      }
    });
  }

  // Ensure Supervisor role exists with requested permissions
  const supervisorRoleName = 'Supervisor';
  let supervisorRole = await Role.findOne({ orgId: org._id, name: supervisorRoleName });
  if (!supervisorRole) {
    supervisorRole = await Role.create({
      orgId: org._id,
      name: supervisorRoleName,
      permissions: {
        verPautas: true,
        verOT: true,
        crearOT: true,
        editarOT: true,
        asignarOT: true,
        ejecutarOT: true,
        supervisar: true,
        aprobarRechazar: true
      }
    });
  }

  
  const adminEmail = 'admin@cliente-demo.com';
  const adminPassword = 'Admin123!';
  let adminUser = await User.findOne({ orgId: org._id, email: adminEmail });
  if (!adminUser) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    adminUser = await User.create({ orgId: org._id, firstName: 'Admin', lastName: 'Cliente', email: adminEmail, passwordHash, roleId: adminRole._id, isAdmin: true });
    console.log('Admin user created:', adminUser.email);
    createdUsers.push({ doc: adminUser, password: adminPassword, existing: false });
  } else {
    console.log('Admin user already exists:', adminUser.email);
    createdUsers.push({ doc: adminUser, password: null, existing: true });
  }

  // Ensure Logistics role exists so we can reference it when creating users
  const logisticsRoleName = 'Logística';
  let logisticsRole = await Role.findOne({ orgId: org._id, name: logisticsRoleName });
  if (!logisticsRole) {
    logisticsRole = await Role.create({
      orgId: org._id,
      name: logisticsRoleName,
      permissions: {
        verActivos: true,
        crearActivos: true,
        editarActivos: true,
        verInsumos: true,
        crearInsumos: true,
        editarInsumos: true,
        verRepuestos: true,
        crearRepuestos: true,
        editarRepuestos: true,
        verLotes: true,
        crearLotes: true,
        editarLotes: true,
        verSucursales: true
      }
    });
    console.log('Logistics role created:', logisticsRole._id.toString());
  } else {
    console.log('Logistics role already exists:', logisticsRole._id.toString());
  }

  // Create users (now including Manuel Cerda assigned to the Logistics role)
  const usersPlain = [
    { firstName: 'Juan', lastName: 'Perez', email: 'juan.perez@cliente-demo.com', password: 'Password123!' , branch: branchA },
    { firstName: 'María', lastName: 'González', email: 'maria.gonzalez@cliente-demo.com', password: 'Password123!' , branch: branchA },
    { firstName: 'Carlos', lastName: 'Ramirez', email: 'carlos.ramirez@cliente-demo.com', password: 'Password123!' , branch: branchB },
    { firstName: 'Laura', lastName: 'Vega', email: 'supervisor@cliente-demo.com', password: 'Password123!', branch: branchA, roleId: supervisorRole._id },
    { firstName: 'Manuel', lastName: 'Cerda', email: 'manuel.cerda@cliente-demo.com', password: 'Password123!', branch: branchA, roleId: logisticsRole._id }
  ];

  for (const u of usersPlain) {
    const existing = await User.findOne({ orgId: org._id, email: u.email });
    if (existing) {
      createdUsers.push({ doc: existing, password: null, existing: true });
      continue;
    }
    const passwordHash = await bcrypt.hash(u.password, 10);
    const roleIdToAssign = u.roleId ? u.roleId : role._id;
    const user = await User.create({ orgId: org._id, firstName: u.firstName, lastName: u.lastName, email: u.email, passwordHash, roleId: roleIdToAssign, branchId: u.branch._id });
    createdUsers.push({ doc: user, password: u.password, existing: false });
  }

  // Create some brands, types and models for camiones
  const brands = ['Volvo', 'Scania', 'Mercedes-Benz', 'DAF'].map((n) => ({ name: n }));
  const brandDocs: any[] = [];
  for (const b of brands) {
    let bd = await Brand.findOne({ orgId: org._id, name: b.name });
    if (!bd) bd = await Brand.create({ orgId: org._id, name: b.name });
    brandDocs.push(bd);
  }

  let typeTruck = await AssetType.findOne({ orgId: org._id, name: 'Camión' });
  if (!typeTruck) typeTruck = await AssetType.create({ orgId: org._id, name: 'Camión' });

  const modelDocs: any[] = [];
  for (const b of brandDocs) {
    for (let i = 1; i <= 2; i++) {
      const modelName = `${b.name} Modelo ${i}`;
      let md = await DeviceModel.findOne({ orgId: org._id, name: modelName });
      if (!md) md = await DeviceModel.create({ orgId: org._id, name: modelName, brandId: b._id, typeId: typeTruck._id });
      modelDocs.push(md);
    }
  }

  // Create assets (camiones) - create 50 trucks distributed across branches
  const assetDocs: any[] = [];
  const totalAssets = 50;
  for (let i = 1; i <= totalAssets; i++) {
    const brand = brandDocs[i % brandDocs.length];
    const model = modelDocs[i % modelDocs.length];
    const branch = i % 2 === 0 ? branchA : branchB;
    const serial = `SN-${i.toString().padStart(4, '0')}`;
    const name = `Camión ${i} - ${brand.name}`;
    let a = await Asset.findOne({ orgId: org._id, serial });
    if (!a) {
      // ensure createdAt is in the past up to 3 months (90 days)
      const createdAt = randomPastDate(90);
      a = await Asset.create({ orgId: org._id, name, serial, brandId: brand._id, modelId: model._id, typeId: typeTruck._id, branchId: branch._id, createdAt });
    }
    assetDocs.push(a);
  }

  // (Removed Repuesto collection usage) Parts will be created directly below.

  // Ensure TypePurchase documents exist for 'repuestos' and 'insumos'.
  let tpRepuestos = await TypePurchase.findOne({ type: 'repuestos' });
  if (!tpRepuestos) tpRepuestos = await TypePurchase.create({ type: 'repuestos', label: 'Repuestos' });
  let tpInsumos = await TypePurchase.findOne({ type: 'insumos' });
  if (!tpInsumos) tpInsumos = await TypePurchase.create({ type: 'insumos', label: 'Insumos' });

  // Create 1000 repuestos as Part documents (no Repuesto collection should be created)
  console.log('Creating repuestos (1000) as Part documents...');
  const partsBulk: any[] = [];
  const partInvSpecs: any[] = [];
  // Create lots that can be referenced by multiple parts
  const desiredLots = 200;
  const existingLots = await Lot.countDocuments({ orgId: org._id });
  if (existingLots < desiredLots) {
    const lotsToCreate = desiredLots - existingLots;
    const lotsBulk: any[] = [];
    for (let li = 1; li <= lotsToCreate; li++) {
      const branch = li % 2 === 0 ? branchA : branchB;
      const code = `LOT-${li}-${Math.random().toString(36).slice(2,6)}`;
      const purchaseDate = randomPastDate(365);
      const price = Math.floor(Math.random() * (1000000 - 10000 + 1)) + 10000;
      lotsBulk.push({ orgId: org._id, branchId: branch._id, code, purchaseDate, price, supplier: `Proveedor ${Math.floor(Math.random()*10)+1}`, type: tpRepuestos._id });
    }
    await Lot.insertMany(lotsBulk);
    console.log(`Inserted ${lotsToCreate} lots`);
  }
  // Use only 'repuestos' lots when assigning to parts
  const lotDocs = await Lot.find({ orgId: org._id, type: tpRepuestos._id }).limit(1000).lean();
  for (let i = 1; i <= 1000; i++) {
    const branch = i % 2 === 0 ? branchA : branchB;
    const dateEntry = randomFutureDate(60);
    const dateInUse = new Date(dateEntry.getTime() + Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000);
    // associate part to an asset (rotate through created assets)
    const assetForPart = assetDocs.length ? assetDocs[i % assetDocs.length] : undefined;
    // price in CLP between 10_000 and 1_000_000
    const partPrice = Math.floor(Math.random() * (1000000 - 10000 + 1)) + 10000; // CLP 10.000 - 1.000.000
    // pick a lot from created lots
    const chosenLot = lotDocs.length ? lotDocs[i % lotDocs.length] : undefined;
    const partQty = Math.floor(Math.random() * 20) + 1;
    partsBulk.push({ orgId: org._id, branchIds: [branch._id], assetIds: assetForPart ? [assetForPart._id] : [], name: `Repuesto ${i}`, serial: `R-${i}-${Math.random().toString(36).slice(2,8)}`, minStock: Math.floor(Math.random() * 5) + 1, createdAt: dateEntry });
    partInvSpecs.push({ lotId: chosenLot?._id, initialQuantity: partQty, unitPrice: partPrice, branchId: branch._id, assetIds: assetForPart ? [assetForPart._id] : [] });
  }
  // Insert only missing parts to reach 1000 for this org
  const existingParts = await Part.countDocuments({ orgId: org._id });
  const targetParts = 1000;
  if (existingParts < targetParts) {
    const toCreate = targetParts - existingParts;
    console.log(`Inserting ${toCreate} parts (to reach ${targetParts})`);
    const insertedParts = await Part.insertMany(partsBulk.slice(0, toCreate));
    console.log(`Inserted ${toCreate} parts into Part collection`);
    // create PartInventory entries for each inserted part when lot info exists in specs
    try {
      const invBulk: any[] = [];
      for (let idx = 0; idx < insertedParts.length; idx++) {
        const p = insertedParts[idx];
        const spec = partInvSpecs[idx];
        if (spec && spec.lotId) {
          // sometimes make remainingQuantity lower than minStock to create low-stock examples
          const min = Number(p.minStock || 0);
          let remaining = spec.initialQuantity || 0;
          if (min > 0 && Math.random() < 0.08) {
            // set remaining to a value strictly less than minStock (but not negative)
            remaining = Math.max(0, min - (Math.floor(Math.random() * 2) + 1));
          }
          invBulk.push({ orgId: org._id, lotId: spec.lotId, itemId: p._id, branchId: spec.branchId, assetIds: spec.assetIds || [], initialQuantity: spec.initialQuantity || 0, remainingQuantity: remaining, unitPrice: spec.unitPrice });
        }
      }
      if (invBulk.length) {
        const createdInv = await PartInventory.insertMany(invBulk);
        // populate Lot.items from created inventories
        const byLot: Record<string, any[]> = {};
        createdInv.forEach((ci: any) => {
          const lid = String(ci.lotId);
          if (!byLot[lid]) byLot[lid] = [];
          byLot[lid].push({ itemId: ci.itemId, quantity: ci.initialQuantity || 0, unitPrice: ci.unitPrice || 0 });
        });
        for (const lid of Object.keys(byLot)) {
          try {
            await Lot.findByIdAndUpdate(lid, { $set: { items: byLot[lid] } });
            console.log(`Updated Lot ${lid} with ${byLot[lid].length} items (parts via inventory)`);
          } catch (e) {
            console.warn('Failed updating lot items for lotId', lid, e);
          }
        }
      }
    } catch (e) {
      console.error('Error creating PartInventory entries', e);
    }
  } else {
    console.log(`Parts already >= ${targetParts}, skipping creation.`);
  }

  // After parts creation, populate Lot.items for lots that reference parts
  try {
    console.log('Updating lots with items from Part documents...');
    const partsWithLot = await Part.find({ orgId: org._id, lotId: { $exists: true, $ne: null } }).lean();
    const byLot: Record<string, any[]> = {};
    partsWithLot.forEach((p: any) => {
      const lid = String(p.lotId);
      if (!byLot[lid]) byLot[lid] = [];
      byLot[lid].push({ itemId: p._id, quantity: p.quantity || 1, unitPrice: p.price || 0 });
    });
    const lotIds = Object.keys(byLot);
    for (const lid of lotIds) {
      try {
        await Lot.findByIdAndUpdate(lid, { $set: { items: byLot[lid] } });
        console.log(`Updated Lot ${lid} with ${byLot[lid].length} items (parts)`);
      } catch (e) {
        console.warn('Failed updating lot items for lotId', lid, e);
      }
    }
  } catch (err) {
    console.error('Error populating lot items from parts', err);
  }

  // Create 4 pautas (templates) with 4 páginas cada una
  // Create 500 insumos (supplies) for this org
  console.log('Creating insumos (500)...');
  const suppliesBulk: any[] = [];
  const supplyInvSpecs: any[] = [];
  for (let i = 1; i <= 500; i++) {
    const unit = 'unidad';
    const quantity = Math.floor(Math.random() * 190) + 11;
    const minStock = Math.floor(Math.random() * 46) + 5;
    const entryDate = randomFutureDate(60);
    // price in CLP between 10_000 and 1_000_000
    const supPrice = Math.floor(Math.random() * (1000000 - 10000 + 1)) + 10000; // CLP 10.000 - 1.000.000
    const supLot = `S-${i}-${Math.random().toString(36).slice(2,6)}`;
    const supLotDate = randomPastDate(365);
    const branchForSupply = i % 2 === 0 ? branchA : branchB;
    // include lot/code/date/price metadata so later lot creation can pick them up
    suppliesBulk.push({ orgId: org._id, branchIds: [branchForSupply._id], name: `Insumo ${i}`, serial: `S-${i}-${Math.random().toString(36).slice(2,6)}`, minStock, createdAt: entryDate, lot: supLot, lotDate: supLotDate, price: supPrice });
    supplyInvSpecs.push({ lotCode: supLot, lotDate: supLotDate, initialQuantity: quantity, unitPrice: supPrice, branchId: branchForSupply._id });
  }
  const existingSupplies = await Supply.countDocuments({ orgId: org._id });
  const targetSupplies = 500;
  if (existingSupplies < targetSupplies) {
    const toCreateSup = targetSupplies - existingSupplies;
    console.log(`Inserting ${toCreateSup} insumos (to reach ${targetSupplies})`);
    const insertedSupplies = await Supply.insertMany(suppliesBulk.slice(0, toCreateSup));
    console.log(`Inserted ${toCreateSup} insumos into Supply collection`);
    // Create Lot documents for these supplies so they are tracked as 'insumos' lots
    try {
      const suppliesToCreate = suppliesBulk.slice(0, toCreateSup);
      const lotCodes = new Set<string>();
      const lotsForSupplies: any[] = [];
      for (let idx = 0; idx < suppliesToCreate.length; idx++) {
        const s = suppliesToCreate[idx];
        const code = s.lot;
        if (!code || lotCodes.has(code)) continue;
        lotCodes.add(code);
        const branch = idx % 2 === 0 ? branchA : branchB;
        lotsForSupplies.push({ orgId: org._id, branchId: branch._id, code, purchaseDate: s.lotDate || randomPastDate(365), price: s.price || 0, supplier: `Proveedor ${Math.floor(Math.random()*10)+1}`, type: tpInsumos._id });
      }
      if (lotsForSupplies.length) {
        // Insert ignoring duplicates (some codes might already exist)
        for (const lf of lotsForSupplies) {
          const exists = await Lot.findOne({ orgId: org._id, code: lf.code });
          if (!exists) await Lot.create(lf);
        }
      }
    } catch (err) {
      console.error('Error creating lots for supplies', err);
    }
    // After supplies and their lots are created, assign Lot._id to supplies (lotId) and populate Lot.items
    try {
      console.log('Linking supplies to Lot documents and updating Lot.items...');
      // find all lot docs created for this org that have codes matching supplies
      const existingLotDocs = await Lot.find({ orgId: org._id }).select('code _id').lean();
      const lotByCode: Record<string, any> = {};
      existingLotDocs.forEach((ld: any) => { if (ld && ld.code) lotByCode[String(ld.code)] = ld; });

      // create SupplyInventory entries for inserted supplies matching lot codes
      const byLotId: Record<string, any[]> = {};
      try {
        // refresh lotByCode to include any newly created lots
        const allLotDocs = await Lot.find({ orgId: org._id }).select('code _id branchId').lean();
        const lotByCode2: Record<string, any> = {};
        allLotDocs.forEach((ld: any) => { if (ld && ld.code) lotByCode2[String(ld.code)] = ld; });
        const invBulk: any[] = [];
        for (let idx = 0; idx < insertedSupplies.length; idx++) {
          const s = insertedSupplies[idx];
          const spec = supplyInvSpecs[idx];
          const code = spec ? spec.lotCode : undefined;
          const matched = code ? lotByCode2[code] : undefined;
          if (matched && matched._id) {
            const min = Number(s.minStock || 0);
            // decide remaining for primary lot with some randomness (some zeros, some < min, others >= min)
            let remainingPrimary: number;
            const r = Math.random();
            if (r < 0.06) {
              remainingPrimary = 0;
            } else if (r < 0.22 && min > 0) {
              remainingPrimary = Math.max(0, min - (Math.floor(Math.random() * 2) + 1));
            } else {
              remainingPrimary = typeof spec.initialQuantity === 'number' ? spec.initialQuantity : (Math.floor(Math.random() * 50) + 5);
            }
            invBulk.push({ orgId: org._id, lotId: matched._id, itemId: s._id, branchId: spec.branchId || matched.branchId || null, assetIds: [], initialQuantity: spec.initialQuantity || 0, remainingQuantity: remainingPrimary, unitPrice: spec.unitPrice || 0 });

            // with some probability, create a second inventory record for this supply linked to another lot
            if (Math.random() < 0.25) {
              const otherLots = allLotDocs.filter((ld: any) => String(ld._id) !== String(matched._id));
              if (otherLots.length) {
                const other = otherLots[Math.floor(Math.random() * otherLots.length)];
                const otherInitial = Math.floor(Math.random() * 60) + 1;
                const r2 = Math.random();
                let remaining2: number;
                if (r2 < 0.1) remaining2 = 0;
                else if (r2 < 0.45 && min > 0) remaining2 = Math.max(0, min - (Math.floor(Math.random() * 3) + 1));
                else remaining2 = Math.max(0, min + Math.floor(Math.random() * 20) + 1);
                invBulk.push({ orgId: org._id, lotId: other._id, itemId: s._id, branchId: spec.branchId || other.branchId || null, assetIds: [], initialQuantity: otherInitial, remainingQuantity: remaining2, unitPrice: spec.unitPrice || 0 });
              }
            }
          }
        }
        if (invBulk.length) {
          const createdInv = await SupplyInventory.insertMany(invBulk);
          createdInv.forEach((ci: any) => {
            const lid = String(ci.lotId);
            if (!byLotId[lid]) byLotId[lid] = [];
            byLotId[lid].push({ itemId: ci.itemId, quantity: ci.initialQuantity || 0, unitPrice: ci.unitPrice || 0 });
          });
        }
      } catch (e) {
        console.warn('Failed creating SupplyInventory or linking to lots', e);
      }

      const lotIds = Object.keys(byLotId);
      for (const lid of lotIds) {
        try {
          await Lot.findByIdAndUpdate(lid, { $set: { items: byLotId[lid] } });
          console.log(`Updated Lot(_id=${lid}) with ${byLotId[lid].length} items (supplies via inventory)`);
        } catch (e) {
          console.warn('Failed updating lot items for lot id', lid, e);
        }
      }
    } catch (err) {
      console.error('Error populating lot items from supplies', err);
    }
  } else {
    console.log(`Supplies already >= ${targetSupplies}, skipping creation.`);
  }

  // Ensure TemplateTypes: Mantenimiento, Inspección, Reparación
  const templateTypesNeeded = ['Mantenimiento', 'Inspección', 'Reparación'];
  const templateTypeDocs: any[] = [];
  for (const ttName of templateTypesNeeded) {
    let tt = await TemplateType.findOne({ orgId: org._id, name: ttName });
    if (!tt) tt = await TemplateType.create({ orgId: org._id, name: ttName });
    templateTypeDocs.push(tt);
  }

  // Build maps of assets by brand and by model so we can assign templates to specific assets
  const assetsAll = assetDocs.map((a: any) => a).filter(Boolean);
  const assetsByBrand: Record<string, mongoose.Types.ObjectId[]> = {};
  const assetsByModel: Record<string, mongoose.Types.ObjectId[]> = {};
  assetsAll.forEach((a: any) => {
    const bid = String(a.brandId);
    const mid = String(a.modelId);
    if (!assetsByBrand[bid]) assetsByBrand[bid] = [];
    assetsByBrand[bid].push(a._id);
    if (!assetsByModel[mid]) assetsByModel[mid] = [];
    assetsByModel[mid].push(a._id);
  });

  console.log('Creating templates (pautas) and assigning them to assets by brand/model...');
  const templateDocs: any[] = [];

  // Helper to build a basic structure
  function buildStructure(seedIdx: number) {
    // Build structure compatible with the frontend TemplatesBuilder
    // Use `division` fields to separate pages so the builder shows pages correctly.
    const components: any[] = [
      // Página 1
      { key: `p${seedIdx}_descripcion_inicial`, type: 'textarea', label: 'Descripción Inicial', name: 'descripcion_inicial', rows: 6 },
      { key: `p${seedIdx}_imagen_inicial`, type: 'image', label: 'Imagen Inicial', name: 'imagen_inicial' },
      // Division -> start Página 2
      { key: `p${seedIdx}_div_2`, type: 'division', title: 'Página 2' },
      // Página 2
      { key: `p${seedIdx}_descripcion_final`, type: 'textarea', label: 'Descripción Final', name: 'descripcion_final', rows: 6 },
      { key: `p${seedIdx}_imagen_final`, type: 'image', label: 'Imagen Final', name: 'imagen_final' },
      // Division -> start Página 3
      { key: `p${seedIdx}_div_3`, type: 'division', title: 'Página 3' },
      // Página 3
      { key: `p${seedIdx}_firma`, type: 'signature', label: 'Firma', name: 'firma' },
      // Division -> start Página 4
      { key: `p${seedIdx}_div_4`, type: 'division', title: 'Página 4' },
      // Página 4
      { key: `p${seedIdx}_archivo`, type: 'file', label: 'Archivo', name: 'archivo' }
    ];

    return { display: 'form', components, pageTitles: { 0: 'Página 1', 1: 'Página 2', 2: 'Página 3', 3: 'Página 4' } };
  }

  // 1) Inspección: create one template per brand (only assets of that brand)
  const inspeccionType = templateTypeDocs.find((t: any) => t.name === 'Inspección');
  for (const b of brandDocs) {
    const assigned = assetsByBrand[String(b._id)] || [];
    if (!assigned.length) continue;
    const name = `Inspección - ${b.name}`;
    const execMin = 0;
    const execMax = 3;
    const expectedDuration = 1;
    let tpl = await Template.findOne({ orgId: org._id, name });
    if (!tpl) {
      tpl = await Template.create({ orgId: org._id, name, description: `Inspección para ${b.name}`, structure: buildStructure(1), createdBy: createdUsers[0].doc._id, createdAt: randomFutureDate(60), execWindowMinDays: execMin, execWindowMaxDays: execMax, expectedDurationDays: expectedDuration, templateTypeId: inspeccionType._id, assignedAssets: assigned });
    } else {
      const update: any = { templateTypeId: inspeccionType._id, assignedAssets: assigned };
      tpl = await Template.findByIdAndUpdate(tpl._id, update, { new: true });
    }
    templateDocs.push(tpl);
  }

  // 2) Mantenimiento: create one template per model (so there are different maintenance templates per model)
  const mantenimientoType = templateTypeDocs.find((t: any) => t.name === 'Mantenimiento');
  for (const m of modelDocs) {
    const assigned = assetsByModel[String(m._id)] || [];
    if (!assigned.length) continue;
    const name = `Mantenimiento - ${m.name}`;
    const execMin = Math.floor(Math.random() * 2);
    const execMax = execMin + Math.floor(Math.random() * 5) + 1;
    const expectedDuration = Math.floor(Math.random() * 3) + 1;
    let tpl = await Template.findOne({ orgId: org._id, name });
    if (!tpl) {
      tpl = await Template.create({ orgId: org._id, name, description: `Mantenimiento para ${m.name}`, structure: buildStructure(2), createdBy: createdUsers[0].doc._id, createdAt: randomFutureDate(60), execWindowMinDays: execMin, execWindowMaxDays: execMax, expectedDurationDays: expectedDuration, templateTypeId: mantenimientoType._id, assignedAssets: assigned });
    } else {
      const update: any = { templateTypeId: mantenimientoType._id, assignedAssets: assigned };
      tpl = await Template.findByIdAndUpdate(tpl._id, update, { new: true });
    }
    templateDocs.push(tpl);
  }

  // 3) Reparación: create one template per brand (or reuse brands)
  const reparacionType = templateTypeDocs.find((t: any) => t.name === 'Reparación');
  for (const b of brandDocs) {
    const assigned = assetsByBrand[String(b._id)] || [];
    if (!assigned.length) continue;
    const name = `Reparación - ${b.name}`;
    const execMin = 0;
    const execMax = 5;
    const expectedDuration = 2;
    let tpl = await Template.findOne({ orgId: org._id, name });
    if (!tpl) {
      tpl = await Template.create({ orgId: org._id, name, description: `Reparación para ${b.name}`, structure: buildStructure(3), createdBy: createdUsers[0].doc._id, createdAt: randomFutureDate(60), execWindowMinDays: execMin, execWindowMaxDays: execMax, expectedDurationDays: expectedDuration, templateTypeId: reparacionType._id, assignedAssets: assigned });
    } else {
      const update: any = { templateTypeId: reparacionType._id, assignedAssets: assigned };
      tpl = await Template.findByIdAndUpdate(tpl._id, update, { new: true });
    }
    templateDocs.push(tpl);
  }

  // Create 20 órdenes de trabajo, choosing only templates that have assigned assets
  console.log('Creating 20 work orders (assets chosen from template.assignedAssets)...');
  const woDocs: any[] = [];

  const templatesWithAssets = templateDocs.filter((t: any) => Array.isArray(t.assignedAssets) && t.assignedAssets.length > 0);
  const nonAdminUsers = createdUsers.map((u) => u.doc).filter((d) => String(d._id) !== String(adminUser._id));
  if (!nonAdminUsers.length) console.warn('No non-admin users found; work orders will still be created but assignment rule could not be enforced');

  for (let i = 1; i <= 20; i++) {
    const orgSeq = await countersService.getNextSequence(org._id.toString());
    const branch = i % 2 === 0 ? branchA : branchB;
    if (!templatesWithAssets.length) break;
    const template = templatesWithAssets[i % templatesWithAssets.length];
    // pick an asset from the template's assignedAssets
    const assignedArr = (template.assignedAssets || []).map((x: any) => (typeof x === 'string' ? x : (x as any)._id || x));
    if (!assignedArr.length) continue;
    const assetId = assignedArr[Math.floor(Math.random() * assignedArr.length)];
    const asset = assetDocs.find((a: any) => String(a._id) === String(assetId)) || (await Asset.findById(assetId).lean());
    if (!asset) continue;
    const assignee = nonAdminUsers.length ? nonAdminUsers[i % nonAdminUsers.length] : createdUsers[i % createdUsers.length].doc;
    const data = {};
    const createdDate = randomFutureDate(60);
    const assignedDate = new Date(createdDate.getTime() + Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000);
    const tplMin = (template as any).execWindowMinDays ?? 0;
    const tplMax = (template as any).execWindowMaxDays ?? Math.max(1, tplMin + 1);
    const offsetDays = tplMin + Math.floor(Math.random() * (tplMax - tplMin + 1));
    const scheduledStart = new Date(assignedDate.getTime() + offsetDays * 24 * 60 * 60 * 1000);
    const durationDays = (template as any).expectedDurationDays ?? 1;
    const estimatedEnd = new Date(scheduledStart.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const history: any[] = [];
    history.push({ userId: undefined, from: null, to: 'Creado', note: 'Creada por sistema', at: createdDate });
    history.push({ userId: adminUser?._id, from: 'Creado', to: 'Asignado', note: `Asignada por ${adminUser?.firstName || 'Administrador'}`, at: assignedDate });

    const urgencies = ['Baja', 'Media', 'Alta'];
    const urgency = urgencies[Math.floor(Math.random() * urgencies.length)];
    const wo = await WorkOrder.create({ orgId: org._id, orgSeq, branchId: branch._id, assetId: asset._id, templateId: template._id, data, state: 'Asignado', urgency, assigneeId: assignee._id, dates: { created: createdDate, assignedAt: assignedDate, scheduledStart, estimatedEnd }, history });
    woDocs.push(wo);
  }

  // Write credentials file
  const credentials = {
    organization: { id: org._id.toString(), name: org.name },
    branches: [ { id: branchA._id.toString(), name: branchA.name }, { id: branchB._id.toString(), name: branchB.name } ],
    users: createdUsers.map((u) => ({ id: u.doc._id.toString(), email: u.doc.email, password: u.password }))
  };

  const outPath = path.join(process.cwd(), 'seed_credentials.json');
  fs.writeFileSync(outPath, JSON.stringify(credentials, null, 2), 'utf-8');
  console.log('Seed credentials written to', outPath);

  // --- Create synthetic maintenance events and purchases for demo metrics ---
  try {
    console.log('Creating synthetic maintenance events...');
    const maintBulk: any[] = [];
    const partsList = await Part.find({ orgId: org._id }).limit(500).lean();
    const suppliesList = await Supply.find({ orgId: org._id }).limit(300).lean();
    const totalMaintEvents = 200; // manageable number for demo
    for (let i = 0; i < totalMaintEvents; i++) {
      const asset = assetDocs[i % assetDocs.length];
      const date = randomPastDate(180);
      const duration = Math.floor(Math.random() * 240) + 30; // 30-270 minutes
      // maintenance cost in CLP between 10_000 and 1_000_000
      const cost = Math.floor(Math.random() * (1000000 - 10000 + 1)) + 10000;
      // pick some parts
      const partsUsed: any[] = [];
      const nParts = Math.floor(Math.random() * 3); // 0-2
      for (let p = 0; p < nParts; p++) {
        const part = partsList[(i + p) % partsList.length];
        partsUsed.push({ partId: part._id, qty: Math.floor(Math.random() * 2) + 1 });
      }
      const suppliesUsed: any[] = [];
      const nSup = Math.floor(Math.random() * 2); // 0-1
      for (let s = 0; s < nSup; s++) {
        const sup = suppliesList[(i + s) % suppliesList.length];
        suppliesUsed.push({ supplyId: sup._id, qty: Math.floor(Math.random() * 5) + 1 });
      }
      maintBulk.push({ orgId: org._id, assetId: asset._id, date, type: 'corrective', durationMinutes: duration, cost, partsUsed, suppliesUsed, createdBy: createdUsers[0].doc._id });
    }
    await MaintenanceEvent.insertMany(maintBulk);
    console.log(`Inserted ${maintBulk.length} maintenance events`);

    console.log('Creating synthetic purchases...');
    const purchasesBulk: any[] = [];
    const totalPurch = 300;
    // Create purchases referencing lots when available; otherwise fallback to item-level purchases
    for (let i = 0; i < totalPurch; i++) {
      const isPart = Math.random() > 0.4;
      if (isPart && partsList.length) {
        const part: any = partsList[i % partsList.length];
        // try to find inventory entry linking this part to a lot
        const pInv = await PartInventory.findOne({ itemId: part._id }).lean();
        if (pInv && pInv.lotId) {
          const lotDoc = await Lot.findById(pInv.lotId).lean();
          if (lotDoc) {
            purchasesBulk.push({ orgId: org._id, branchId: lotDoc.branchId || (i%2===0?branchA._id:branchB._id), lotId: lotDoc._id, acquisitionType: lotDoc.type || 'repuestos', items: [{ itemId: part._id, quantity: Math.floor(Math.random()*5)+1, unitPrice: pInv.unitPrice || 0 }], date: randomPastDate(180), cost: Math.floor(Math.random() * (1000000 - 10000 + 1)) + 10000, supplier: `Proveedor ${Math.floor(Math.random()*10)+1}` });
            continue;
          }
        }
        // fallback to legacy item-level purchase
        purchasesBulk.push({ orgId: org._id, branchId: (i%2===0?branchA._id:branchB._id), itemId: part._id, itemType: 'part', acquisitionType: 'repuestos', qty: Math.floor(Math.random()*10)+1, date: randomPastDate(180), cost: Math.floor(Math.random() * (1000000 - 10000 + 1)) + 10000, supplier: `Proveedor ${Math.floor(Math.random()*10)+1}` });
      } else if (suppliesList.length) {
        const sup: any = suppliesList[i % suppliesList.length];
        // try to find supply inventory linking to lot
        const sInv = await SupplyInventory.findOne({ itemId: sup._id }).lean();
        if (sInv && sInv.lotId) {
          const lotDoc = await Lot.findById(sInv.lotId).lean();
          if (lotDoc) {
            purchasesBulk.push({ orgId: org._id, branchId: lotDoc.branchId || (i%2===0?branchA._id:branchB._id), lotId: lotDoc._id, acquisitionType: lotDoc.type || 'insumos', items: [{ itemId: sup._id, quantity: Math.floor(Math.random()*20)+1, unitPrice: sInv.unitPrice || 0 }], date: randomPastDate(180), cost: Math.floor(Math.random() * (1000000 - 10000 + 1)) + 10000, supplier: `Proveedor ${Math.floor(Math.random()*10)+1}` });
            continue;
          }
        }
        purchasesBulk.push({ orgId: org._id, branchId: (i%2===0?branchA._id:branchB._id), itemId: sup._id, itemType: 'supply', acquisitionType: 'insumos', qty: Math.floor(Math.random()*50)+1, date: randomPastDate(180), cost: Math.floor(Math.random() * (1000000 - 10000 + 1)) + 10000, supplier: `Proveedor ${Math.floor(Math.random()*10)+1}` });
      }
    }
    await Purchase.insertMany(purchasesBulk);
    console.log(`Inserted ${purchasesBulk.length} purchases`);

    // Compute simple Pareto: maintenance frequency by asset (last 180 days)
    console.log('Computing Pareto metrics (maintenance-frequency, parts-purchases, supplies-purchases)...');
    const endDate = new Date();
    const startDate = new Date(Date.now() - 180*24*60*60*1000);

    // maintenance frequency per asset
    const maintAgg = await MaintenanceEvent.aggregate([
      { $match: { orgId: org._id, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$assetId', value: { $sum: 1 } } },
      { $sort: { value: -1 } },
      { $limit: 50 }
    ]);
    const assetIds = maintAgg.map((m: any) => m._id).filter(Boolean);
    const assetsMap = await Asset.find({ _id: { $in: assetIds } }).lean();
    const assetsById: any = {};
    assetsMap.forEach((a: any) => { assetsById[a._id.toString()] = a; });
    let cum = 0; const totalMaint = maintAgg.reduce((s: number, x: any) => s + x.value, 0) || 0;
    const maintItems = maintAgg.map((m: any) => {
      cum += m.value;
      return { id: m._id, label: (assetsById[m._id?.toString()]?.name || 'Activo desconocido'), value: m.value, cumulativePct: totalMaint ? Math.round((cum/totalMaint)*10000)/100 : undefined };
    });
    await MetricsPareto.create({ orgId: org._id, type: 'maintenance-frequency', startDate, endDate, generatedAt: new Date(), items: maintItems, totals: { total: totalMaint } });

    // parts purchases (top parts)
    const partsAgg = await Purchase.aggregate([
      // purchases that include items array (e.g., lot purchases)
      { $match: { orgId: org._id, items: { $exists: true, $ne: [] }, date: { $gte: startDate, $lte: endDate } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.itemId', value: { $sum: '$items.quantity' } } },
      { $sort: { value: -1 } },
      { $limit: 50 },
      { $unionWith: {
        coll: 'purchases',
        pipeline: [
          { $match: { orgId: org._id, $or: [ { itemType: 'part' }, { acquisitionType: 'repuestos' } ], items: { $in: [[], null] }, date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: '$itemId', value: { $sum: '$qty' } } },
          { $sort: { value: -1 } },
          { $limit: 50 }
        ]
      } },
      { $group: { _id: '$_id', value: { $sum: '$value' } } },
      { $sort: { value: -1 } },
      { $limit: 50 }
    ]);
    const partIds = partsAgg.map((p: any) => p._id).filter(Boolean);
    const partsMap = await Part.find({ _id: { $in: partIds } }).lean();
    const partsById: any = {};
    partsMap.forEach((p: any) => { partsById[p._id.toString()] = p; });
    cum = 0; const totalParts = partsAgg.reduce((s: number, x: any) => s + x.value, 0) || 0;
    const partsItems = partsAgg.map((p: any) => { cum += p.value; return { id: p._id, label: (partsById[p._id?.toString()]?.name || 'Repuesto desconocido'), value: p.value, cumulativePct: totalParts ? Math.round((cum/totalParts)*10000)/100 : undefined }; });
    await MetricsPareto.create({ orgId: org._id, type: 'parts-purchases', startDate, endDate, generatedAt: new Date(), items: partsItems, totals: { total: totalParts } });

    // supplies purchases
    const supAgg = await Purchase.aggregate([
      { $match: { orgId: org._id, items: { $exists: true, $ne: [] }, date: { $gte: startDate, $lte: endDate } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.itemId', value: { $sum: '$items.quantity' } } },
      { $sort: { value: -1 } },
      { $limit: 50 },
      { $unionWith: {
        coll: 'purchases',
        pipeline: [
          { $match: { orgId: org._id, $or: [ { itemType: 'supply' }, { acquisitionType: 'insumos' } ], items: { $in: [[], null] }, date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: '$itemId', value: { $sum: '$qty' } } },
          { $sort: { value: -1 } },
          { $limit: 50 }
        ]
      } },
      { $group: { _id: '$_id', value: { $sum: '$value' } } },
      { $sort: { value: -1 } },
      { $limit: 50 }
    ]);
    const supIds = supAgg.map((p: any) => p._id).filter(Boolean);
    const supMap = await Supply.find({ _id: { $in: supIds } }).lean();
    const supById: any = {};
    supMap.forEach((p: any) => { supById[p._id.toString()] = p; });
    cum = 0; const totalSup = supAgg.reduce((s: number, x: any) => s + x.value, 0) || 0;
    const supItems = supAgg.map((p: any) => { cum += p.value; return { id: p._id, label: (supById[p._id?.toString()]?.name || 'Insumo desconocido'), value: p.value, cumulativePct: totalSup ? Math.round((cum/totalSup)*10000)/100 : undefined }; });
    await MetricsPareto.create({ orgId: org._id, type: 'supplies-purchases', startDate, endDate, generatedAt: new Date(), items: supItems, totals: { total: totalSup } });

    console.log('Metrics Pareto created for organization');
  } catch (err) {
    console.error('Error creating synthetic maintenance/purchase/metrics data', err);
  }

  // count insumos (supplies) present for this org (seed may not create suppliesBulk variable)
  const insumosCount = await Supply.countDocuments({ orgId: org._id });
  console.log('Done seeding. Inserted:', { org: org._id.toString(), branches: 2, users: createdUsers.length, assets: assetDocs.length, parts: (typeof partsBulk !== 'undefined' ? partsBulk.length : undefined), insumos: insumosCount, templates: templateDocs.length, workOrders: woDocs.length });

  // Close mongoose connection
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seeding failed', err);
  process.exit(1);
});
