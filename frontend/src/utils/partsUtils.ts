// Utility to analyze work orders and detect presence of insumos (consumables) and repuestos (spare parts)
export function analyzeWorkOrdersParts(orders: any[]) {
  const res: Record<string, { hasInsumos: boolean; hasRepuestos: boolean; parts: any[] }> = {};
  if (!Array.isArray(orders)) return res;

  const pushParts = (target: any[], src: any) => {
    if (!Array.isArray(src)) return;
    src.forEach((p) => { if (p) target.push(p); });
  };

  const classifyPart = (p: any): 'repuesto' | 'insumo' | 'unknown' => {
    const v = (x: any) => (x === undefined || x === null) ? '' : String(x).toLowerCase();
    if (!p) return 'unknown';
    if (p.repuesto === true || p.isRepuesto === true) return 'repuesto';
    if (p.insumo === true || p.isInsumo === true) return 'insumo';
    const combined = `${v(p.type)} ${v(p.category)} ${v(p.partType)} ${v(p.label)} ${v(p.name)}`.trim();
    if (!combined) return 'unknown';
    if (combined.indexOf('repuesto') !== -1 || combined === 'r') return 'repuesto';
    if (combined.indexOf('insumo') !== -1 || combined.indexOf('consum') !== -1 || combined === 'i') return 'insumo';
    return 'unknown';
  };

  orders.forEach((w: any) => {
    const id = String((w && (w._id || w.id)) || '');
    const parts: any[] = [];

    // top-level arrays
    pushParts(parts, w && w.selectedParts);
    pushParts(parts, w && w.parts);

    // nested under data
    if (w && typeof w.data === 'object') {
      pushParts(parts, w.data.selectedParts);
      pushParts(parts, w.data.parts);
    }

    // structure.components (many templates store parts here)
    if (w && w.structure && Array.isArray(w.structure.components)) {
      w.structure.components.forEach((comp: any) => {
        if (!comp) return;
        if (Array.isArray(comp.parts)) pushParts(parts, comp.parts);
        else if (Array.isArray(comp.selectedParts)) pushParts(parts, comp.selectedParts);
        else if (Array.isArray(comp.value)) pushParts(parts, comp.value);
        // fallback: some components keep an object with `.value.parts`
        else if (comp.value && Array.isArray(comp.value.parts)) pushParts(parts, comp.value.parts);
      });
    }

    // dedupe parts by common id fields if possible
    const deduped: any[] = [];
    const seen = new Set<string>();
    parts.forEach((p) => {
      const pid = String(p && (p.partId || p.part || p._id || p.id || p.name || JSON.stringify(p))).trim();
      if (!seen.has(pid)) { seen.add(pid); deduped.push(p); }
    });

    let hasInsumos = false;
    let hasRepuestos = false;
    deduped.forEach((p) => {
      const c = classifyPart(p);
      if (c === 'insumo') hasInsumos = true;
      if (c === 'repuesto') hasRepuestos = true;
    });

    res[id] = { hasInsumos, hasRepuestos, parts: deduped };
  });

  return res;
}

export default { analyzeWorkOrdersParts };
