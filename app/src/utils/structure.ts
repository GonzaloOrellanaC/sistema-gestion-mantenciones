export function normalizeStructure(struct: any) {
  if (!struct) return { components: [] };
  // already normalized
  if (Array.isArray(struct.components)) return struct;
  if (Array.isArray(struct.pages)) {
    const components: any[] = [];
    struct.pages.forEach((page: any, pidx: number) => {
      const fields = page.fields || [];
      fields.forEach((f: any, fidx: number) => {
        components.push({
          id: f.name || `f-${pidx}-${fidx}`,
          type: f.type || 'text',
          label: f.label || f.name || '',
          required: !!f.required,
          placeholder: f.placeholder || '',
          options: f.options || []
        });
      });
      // add division after page except last to carry the page title
      if (pidx < struct.pages.length - 1) {
        components.push({ id: `division-${pidx}`, type: 'division', pageTitle: page.title || undefined });
      }
    });
    return { components };
  }
  return { components: [] };
}

export default normalizeStructure;
