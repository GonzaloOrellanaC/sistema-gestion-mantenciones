export function sortByName<T extends Record<string, any>>(arr: T[] | undefined | null): T[] {
  if (!Array.isArray(arr)) return [];
  return [...arr].sort((a, b) => {
    const ka = (a && (a.name || a.title || a.label || '')) || '';
    const kb = (b && (b.name || b.title || b.label || '')) || '';
    const sa = String(ka).toLowerCase();
    const sb = String(kb).toLowerCase();
    if (!sa && !sb) return 0;
    if (!sa) return 1;
    if (!sb) return -1;
    return sa.localeCompare(sb);
  });
}

export default sortByName;
