import xlsx from 'xlsx';

type Lang = 'es' | 'en';

const sheetCandidates = {
  assets: ['Activos', 'Assets'],
  parts: ['Repuestos', 'Parts'],
  supplies: ['Insumos', 'Supplies'],
};

// Mapping of possible headers (es/en) to internal keys
const headerMap: Record<string, string> = {
  sku: 'sku',
  codigo: 'code',
  code: 'code',
  nombre: 'name',
  name: 'name',
  descripcion: 'description',
  descripcioncorta: 'shortDescription',
  description: 'description',
  tipo: 'type',
  type: 'type',
  marca: 'brand',
  brand: 'brand',
  modelo: 'model',
  model: 'model',
  serie: 'serial',
  serial: 'serial',
  branch: 'branch',
  sucursal: 'branch',
  assets: 'assets',
  activos: 'assets',
  repuestos: 'parts',
  parts: 'parts',
  insumos: 'supplies',
  supplies: 'supplies',
  ubicacion: 'location',
  location: 'location',
  cantidad: 'quantity',
  quantity: 'quantity',
  unidad: 'unit',
  unit: 'unit',
  costo: 'cost',
  cost: 'cost',
  fechacompra: 'purchaseDate',
  purchasedate: 'purchaseDate',
  minstock: 'minStock',
  stockminimo: 'minStock',
  minStock: 'minStock',
  'fecha de compra': 'purchaseDate',
};

const outputHeaderLabels: Record<Lang, Record<string, string>> = {
  es: {
    code: 'Código',
    name: 'Nombre',
    description: 'Descripción',
    shortDescription: 'Descripción corta',
    type: 'Tipo',
    brand: 'Marca',
    model: 'Modelo',
    serial: 'Serie',
    location: 'Ubicación',
    branch: 'Sucursal',
    assets: 'Activos',
    minStock: 'Stock mínimo',
    quantity: 'Cantidad',
    unit: 'Unidad',
    cost: 'Costo',
    purchaseDate: 'Fecha de compra',
    sku: 'SKU',
  },
  en: {
    code: 'Code',
    name: 'Name',
    description: 'Description',
    shortDescription: 'Short Description',
    type: 'Type',
    brand: 'Brand',
    model: 'Model',
    serial: 'Serial',
    location: 'Location',
    branch: 'Branch',
    assets: 'Assets',
    minStock: 'Min Stock',
    quantity: 'Quantity',
    unit: 'Unit',
    cost: 'Cost',
    purchaseDate: 'Purchase Date',
    sku: 'SKU',
  },
};

function normalizeHeader(h: string) {
  return h ? h.toString().trim().toLowerCase().replace(/\s+/g, '') : '';
}

function mapRow(raw: Record<string, any>) {
  const out: Record<string, any> = {};
  Object.keys(raw).forEach((rawKey) => {
    const norm = normalizeHeader(rawKey);
    /* console.log('mapping header', rawKey, 'normalized to', norm); */
    const mapped = headerMap[norm];
    if (mapped) out[mapped] = raw[rawKey];
  });
  console.log('mapped row', raw, 'to', out);
  return out;
}

function prepareSection(rows: any[], lang: Lang) {
  const mappedRows = rows.map(mapRow);
  // compute headers present by scanning mapped rows
  const keys = Array.from(new Set(mappedRows.flatMap((r) => Object.keys(r))));
  const headers = keys.map((k) => ({ key: k, label: outputHeaderLabels[lang][k] || k }));
  return { headers, rows: mappedRows };
}

const parseWorkbook = async (buffer: Buffer, lang: Lang = 'es') => {
  const workbook = xlsx.read(buffer, { type: 'buffer' });

  const result: Record<string, any> = {};

  // helper to find sheet by candidate names (normalize case and whitespace)
  const findSheet = (candidates: string[]) => {
    const lowerCandidates = candidates.map((c) => (c || '').toString().trim().toLowerCase());
    const foundName = workbook.SheetNames.find((n) => lowerCandidates.includes((n || '').toString().trim().toLowerCase()));
    return foundName ? workbook.Sheets[foundName] : null;
  };

  // For each expected section, try to read sheet
  const assetsSheet = findSheet(sheetCandidates.assets);
  if (assetsSheet) {
    const rows = xlsx.utils.sheet_to_json(assetsSheet, { defval: null });
    result.assets = prepareSection(rows, lang);
  }

  const partsSheet = findSheet(sheetCandidates.parts);
  if (partsSheet) {
    const rows = xlsx.utils.sheet_to_json(partsSheet, { defval: null });
    result.parts = prepareSection(rows, lang);
  }

  const suppliesSheet = findSheet(sheetCandidates.supplies);
  if (suppliesSheet) {
    const rows = xlsx.utils.sheet_to_json(suppliesSheet, { defval: null });
    result.supplies = prepareSection(rows, lang);
  }

  // If no named sheets found, try parsing first sheet and try to auto-detect by headers
  if (!result.assets && !result.parts && !result.supplies && workbook.SheetNames.length) {
    const first = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(first, { defval: null });
    // attempt to detect if rows contain asset-like columns
    const sample = rows[0] || {};
    const normalizedKeys = Object.keys(sample).map((k) => normalizeHeader(k));
    const hasCode = normalizedKeys.some((k) => ['codigo', 'code'].includes(k));
    const hasQuantity = normalizedKeys.some((k) => ['cantidad', 'quantity'].includes(k));
    if (hasCode && hasQuantity) {
      result.assets = prepareSection(rows, lang);
    } else {
      // fallback: return as generic sheet
      result.sheet = prepareSection(rows, lang);
    }
  }

  return result;
};

export default { parseWorkbook };
