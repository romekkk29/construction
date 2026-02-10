import { Project, NIO, Supply, User, Role, CostAccount,Driver } from './backend/types.js';

const API_BASE_URL = '/api';

export const apiClient = {
  projects: {
    list: async (): Promise<Project[]> => {
      const res = await fetch(`${API_BASE_URL}/projects`);
      return res.json();
    },
    create: async (p: Project): Promise<Project> => {
      const res = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      if (!res.ok) {
        throw await res.json();
      }
      return res.json();
    },
    update: async (p: Project): Promise<Project> => {
      const res = await fetch(`${API_BASE_URL}/projects/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      return res.json();
    },

    delete: async (id: string): Promise<{ message: string }> => {
      const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'DELETE',
      });
      return res.json();
    },
  },
  roles:{
     list: async (): Promise<Role[]> => {
      const res = await fetch(`${API_BASE_URL}/roles`);
      return res.json();
    },   
  },
  users: {
    list: async (): Promise<User[]> => {
      const res = await fetch(`${API_BASE_URL}/users`);
      return res.json();
    },
    create: async (p: User): Promise<User> => {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      if (!res.ok) {
        throw await res.json();
      }
      return res.json();
    },
    update: async (p: User): Promise<User> => {
      const res = await fetch(`${API_BASE_URL}/users/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      return res.json();
    },

    delete: async (id: number): Promise<{ message: string }> => {
      const res = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
      });
      return res.json();
    },
  },
  costAccounts: {
    list: async (projectId:number): Promise<CostAccount[]> => {
      const res = await fetch(`${API_BASE_URL}/costaccounts?projectId=${projectId}`);
      return res.json();
    },
    create: async (p: CostAccount[]): Promise<CostAccount[]> => {
      const res = await fetch(`${API_BASE_URL}/costaccounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      if (!res.ok) {
        throw await res.json();
      }
      return res.json();
    },
    update: async (p: CostAccount): Promise<CostAccount> => {
      const res = await fetch(`${API_BASE_URL}/costaccounts/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      return res.json();
    },

    delete: async (id: string): Promise<{ message: string }> => {
      const res = await fetch(`${API_BASE_URL}/costaccounts/${id}`, {
        method: 'DELETE',
      });
      return res.json();
    },
  },

  nios: {
    list: async (): Promise<NIO[]> => {
      const res = await fetch(`${API_BASE_URL}/nios`);
      return res.json();
    },
    upsert: async (n: NIO): Promise<NIO> => {
      const res = await fetch(`${API_BASE_URL}/nios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(n),
      });
      return res.json();
    },
  },
  session:{
      list: async (): Promise<User> => {
      const res = await fetch(`${API_BASE_URL}/me`);
      return res.json();
    },
  },
  supplies: {
    list: async (): Promise<Supply[]> => {
      const res = await fetch(`${API_BASE_URL}/supplies`);
      return res.json();
    },
    create: async (s: Supply[]): Promise<Supply[]> => {
      const res = await fetch(`${API_BASE_URL}/supplies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s),
      });
      if (!res.ok) {
        throw await res.json();
      }
      return res.json();
    },
    delete: async (id: number): Promise<{ message: string }> => {
      const res = await fetch(`${API_BASE_URL}/supplies/${id}`, {
        method: 'DELETE',
      });
      return res.json();
    },
    update: async (p: Supply): Promise<Supply> => {
      const res = await fetch(`${API_BASE_URL}/supplies/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      return res.json();
    },
  },
  drivers: {
    list: async (): Promise<Driver[]> => {
      const res = await fetch(`${API_BASE_URL}/drivers`);
      return res.json();
    },
    create: async (s: Driver): Promise<Driver> => {
      const res = await fetch(`${API_BASE_URL}/drivers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s),
      });
      if (!res.ok) {
        throw await res.json();
      }
      return res.json();
    },
    delete: async (id: number): Promise<{ message: string }> => {
      const res = await fetch(`${API_BASE_URL}/drivers/${id}`, {
        method: 'DELETE',
      });
      return res.json();
    },
    update: async (p: Driver): Promise<Driver> => {
      const res = await fetch(`${API_BASE_URL}/drivers/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      return res.json();
    },},
};
