// Exported to be used in App.tsx for file upload handling
export interface FileData {
  data: string;
  mimeType: string;
}

export const extractBudgetData = async (file?: FileData | string) => {
  const res = await fetch('/api/gemini/extract-budget', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? 'Error al procesar el presupuesto');
  }
  return res.json();
};

export const extractSupplyData = async (file?: FileData) => {
  const res = await fetch('/api/gemini/extract-supplies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? 'Error al procesar los insumos');
  }
  return res.json();
};
