// Utility to analyze work orders focusing ONLY on `structure.components`.
// It looks for components with `type === 'parts'` (repuestos) and common
// component types that indicate consumables/insumos (e.g. 'insumo','consumable','consumables','supplies').
export function analyzeWorkOrdersParts(orders: any[]) {
  const res: Record<string, { hasInsumos: boolean; hasRepuestos: boolean; parts: any[] }> = {};
  if (!Array.isArray(orders)) return res;

  const isInsumoType = (type: string) => {
    if (!type) return false;
    const t = String(type).toLowerCase();
    return t === 'insumo' || t === 'insumos' || t === 'consumable' || t === 'consumables' || t === 'supply' || t === 'supplies' || t.indexOf('consum') !== -1;
  };

  orders.forEach((w: any, index: number) => {
    const id = String((w && (w._id || w.id)) || '');
    const collected: any[] = [];

    let hasSuppliesComp = false;
    if (w && w.templateId && w.templateId.structure && Array.isArray(w.templateId.structure.components)) {
      w.templateId.structure.components.forEach((comp: any) => {
        if (!comp || !comp.type) return;
        const ctype = String(comp.type).toLowerCase();
        // repuestos: component.type === 'parts'
        if (ctype === 'parts') {
          if (Array.isArray(comp.parts)) collected.push(...comp.parts);
          else if (Array.isArray(comp.value)) collected.push(...comp.value);
          else if (comp.value && Array.isArray(comp.value.parts)) collected.push(...comp.value.parts);
          // sometimes component may directly include an object with `parts` key
          else if (comp.parts && Array.isArray(comp.parts)) collected.push(...comp.parts);
        }
        // insumos / supplies: accept multiple property names and component types
        else if (isInsumoType(ctype)) {
          hasSuppliesComp = true;
          if (Array.isArray(comp.supplies)) collected.push(...comp.supplies);
          else if (Array.isArray(comp.parts)) collected.push(...comp.parts);
          else if (Array.isArray(comp.value)) collected.push(...comp.value);
          else if (comp.value && Array.isArray(comp.value.supplies)) collected.push(...comp.value.supplies);
          else if (comp.value && Array.isArray(comp.value.parts)) collected.push(...comp.value.parts);
          // sometimes component may include supplies under a different key
          else if (comp.supplies && Array.isArray(comp.supplies)) collected.push(...comp.supplies);
        }
      });
    }

    // dedupe by id/name
    const deduped: any[] = [];
    const seen = new Set<string>();
    collected.forEach((p) => {
      const pid = String(p && (p._id || p.id || p.partId || p.part || p.name || JSON.stringify(p))).trim();
      if (!seen.has(pid)) { seen.add(pid); deduped.push(p); }
    });

    let hasInsumos = false;
    let hasRepuestos = false;
    deduped.forEach((p) => {
      // Heuristic: if item has serial or name that suggests 'Repuesto' or explicit fields
      const name = p && (p.name || p.label || '');
      const lname = String(name || '').toLowerCase();
      if (lname.indexOf('repuesto') !== -1 || !!p.serial || (p.type && String(p.type).toLowerCase() === 'repuesto')) hasRepuestos = true;
      if (lname.indexOf('insumo') !== -1 || lname.indexOf('consum') !== -1) hasInsumos = true;
    });

    // If any component with type 'parts' existed, prefer to mark repuestos even if heuristics didn't catch names
    if (w.templateId && w.templateId.structure && Array.isArray(w.templateId.structure.components)) {
      const hasPartsComp = w.templateId.structure.components.some((c: any) => c && String(c.type).toLowerCase() === 'parts');
      if (hasPartsComp && deduped.length > 0) hasRepuestos = true;
    }

    // If any supplies/similar component existed, prefer to mark insumos
    if (hasSuppliesComp && deduped.length > 0) hasInsumos = true;

    res[id] = { hasInsumos, hasRepuestos, parts: deduped };
  });

  return res;
}

export default { analyzeWorkOrdersParts };
