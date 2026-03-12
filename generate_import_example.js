#!/usr/bin/env node
/*
  generate_import_example.js

  Usage:
    node generate_import_example.js [assets] [parts] [supplies] [output]

  Examples:
    node generate_import_example.js 10 100 100 ejemplo.xlsx

  Notes:
  - This script requires the `xlsx` package. Install with:
      npm install xlsx
    or
      npm install --prefix frontend xlsx

  - The script will create an Excel workbook with three sheets: `assets`, `parts`, `supplies`.
*/

const fs = require('fs');
const path = require('path');
try {
  var XLSX = require('xlsx');
} catch (e) {
  console.error('Missing dependency `xlsx`. Run `npm install xlsx` and try again.');
  process.exit(1);
}

function usage() {
  console.log('Usage: node generate_import_example.js [assets] [parts] [supplies] [output]');
  console.log('Example: node generate_import_example.js 10 100 100 ejemplo.xlsx');
}

const argv = process.argv.slice(2);
if (argv.length === 1 && (argv[0] === '-h' || argv[0] === '--help')) {
  usage();
  process.exit(0);
}

const assetsCount = parseInt(argv[0], 10) || 10;
const partsCount = parseInt(argv[1], 10) || 100;
const suppliesCount = parseInt(argv[2], 10) || 100;
const outFile = argv[3] || 'ejemplo_importacion.xlsx';

const branchNames = ['Sucursal Norte', 'Sucursal Sur', 'Sucursal Centro'];
const assetTypes = ['Automóvil', 'Pickup', 'Camión', 'Moto', 'Maquinaria', 'Montacargas', 'Tractor', 'Bus', 'Remolque', 'Otro'];
function makeAssets(n) {
  const rows = [];
  for (let i = 1; i <= n; i++) {
    const branch = branchNames[(i-1)%branchNames.length];
    const type = assetTypes[(i-1)%assetTypes.length];
    rows.push({
      name: `Activo ${i}`,
      code: `ACT-${String(i).padStart(3,'0')}`,
      brand: `Marca ${((i-1)%5)+1}`,
      model: `Model-${((i-1)%10)+1}`,
      branch: branch,
      type: type,
    });
  }
  return rows;
}

function makeParts(n) {
  // Simular assets para asociar
  const assets = Array.from({length: 10}, (_, i) => `Activo ${i+1}`);
  const rows = [];
  for (let i = 1; i <= n; i++) {
    // Asociar 1-2 assets y 1 sucursal aleatoria
    const assetCount = Math.floor(Math.random()*2)+1;
    const assetSample = [];
    while (assetSample.length < assetCount) {
      const pick = assets[Math.floor(Math.random()*assets.length)];
      if (!assetSample.includes(pick)) assetSample.push(pick);
    }
    const branch = branchNames[Math.floor(Math.random()*branchNames.length)];
    rows.push({
      name: `Repuesto ${i}`,
      sku: `REP-${String(i).padStart(4,'0')}`,
      quantity: Math.floor(Math.random()*50)+1,
      unit: 'pcs',
      minStock: Math.floor(Math.random()*5)+1,
      assets: assetSample.join(', '),
      branch: branch,
    });
  }
  return rows;
}

function makeSupplies(n) {
  const rows = [];
  for (let i = 1; i <= n; i++) {
    const branch = branchNames[Math.floor(Math.random()*branchNames.length)];
    rows.push({
      name: `Insumo ${i}`,
      sku: `INS-${String(i).padStart(4,'0')}`,
      serial: `S-${i}-icdm`,
      unit: 'units',
      quantity: Math.floor(Math.random()*200)+1,
      minStock: Math.floor(Math.random()*50)+1,
      branch: branch,
    });
  }
  return rows;
}

function gen() {
  const wb = XLSX.utils.book_new();
  const assets = makeAssets(assetsCount);
  const parts = makeParts(partsCount);
  const supplies = makeSupplies(suppliesCount);

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(assets), 'assets');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(parts), 'parts');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(supplies), 'supplies');

  const outPath = path.resolve(process.cwd(), outFile);
  XLSX.writeFile(wb, outPath);
  console.log(`Generated ${outPath} with ${assets.length} assets, ${parts.length} parts, ${supplies.length} supplies`);
}

gen();
