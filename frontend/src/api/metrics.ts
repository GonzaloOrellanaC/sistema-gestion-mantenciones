import axios from 'axios';

const BASE = (import.meta as any).env?.VITE_API_URL || '/api';

export async function getPareto(type: string, params: Record<string, any> = {}) {
  const resp = await axios.get(`${BASE}/metrics/pareto/${type}`, { params });
  return resp.data;
}

export async function getPrecomputed(orgId?: string) {
  const resp = await axios.get(`${BASE}/metrics/precomputed`, { params: { orgId } });
  return resp.data;
}

export default { getPareto, getPrecomputed };
