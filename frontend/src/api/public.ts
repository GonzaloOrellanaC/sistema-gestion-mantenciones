import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://gonzalo.ddns.net:5102';

const client = axios.create({ baseURL });

export async function getWorkOrderByToken(token: string) {
  const { data } = await client.get(`/public/work-orders/${token}`);
  return data;
}

export default { getWorkOrderByToken };
