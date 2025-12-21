export async function getSupplies() {
  const res = await fetch('/api/supplies');
  if (!res.ok) throw new Error('Error fetching supplies');
  return res.json();
}

export async function createSupply(formData: FormData) {
  const res = await fetch('/api/supplies', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Error creating supply');
  }
  return res.json();
}

export default { getSupplies, createSupply };
