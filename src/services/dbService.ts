const API_BASE_URL = '/api';

export const saveData = async <T>(endpoint: string, data: T): Promise<T | null> => {
  const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return res.ok ? res.json() : null;
};

export const getAllData = async <T>(endpoint: string): Promise<T[]> => {
  const res = await fetch(`${API_BASE_URL}/${endpoint}`);
  return res.ok ? res.json() : [];
};

export const deleteData = async (endpoint: string, id: string) => {
  return fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
    method: 'DELETE',
  });
};

export const initDB = async () => true;
