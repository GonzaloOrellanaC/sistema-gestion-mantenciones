// DEPRECATED: use ./parts.ts instead
export * from './parts';

// Backwards-compatible default export
import { listParts } from './parts';
export async function listComponents(params?: Record<string, unknown>) {
  return listParts(params as any);
}

export default { listComponents };
