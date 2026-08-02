import { Project, Supply, User, Role, CostAccount, Driver, ConstructionBookDocument } from './backend/types.js';

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

    createCaja: async (name: string): Promise<{ id: number; name: string }> => {
      const res = await fetch(`${API_BASE_URL}/caja`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
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
  clientPayments: {
    list: async (): Promise<any[]> => {
      const res = await fetch(`${API_BASE_URL}/client-payments`);
      return res.json();
    },
    create: async (formData: FormData): Promise<any> => {
      const res = await fetch(`${API_BASE_URL}/client-payments`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw await res.json();
      return res.json();
    },
  },
  projectAdvances: {
    list: async (): Promise<any[]> => {
      const res = await fetch(`${API_BASE_URL}/project-advances`);
      return res.json();
    },
    create: async (formData: FormData): Promise<any> => {
      const res = await fetch(`${API_BASE_URL}/project-advances`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw await res.json();
      return res.json();
    },
  },
  projectInvoices: {
    list: async (): Promise<any[]> => {
      const res = await fetch(`${API_BASE_URL}/project-invoices`);
      return res.json();
    },
    create: async (formData: FormData): Promise<any> => {
      const res = await fetch(`${API_BASE_URL}/project-invoices`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw await res.json();
      return res.json();
    },
  },
  projectUsers: {
    getByUser: async (userId: number): Promise<number[]> => {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/projects`);
      return res.json();
    },
    update: async (userId: number, projectIds: number[]): Promise<{ message: string }> => {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/projects`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectIds }),
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
    inflaList: async (projectId: number): Promise<any[]> => {
      const res = await fetch(`${API_BASE_URL}/infla/${projectId}`);
      return res.json();
    },
    infla: async (p:any): Promise<{ message: string }> => {
      const res = await fetch(`${API_BASE_URL}/costaccounts/inflation-manual/${p.projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
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
  nios:{
    dashboard: async (): Promise<any[]> => {
      const res = await fetch(`${API_BASE_URL}/dashboard`);
      return res.json();
    },
    list: async (): Promise<any[]> => {
      const res = await fetch(`${API_BASE_URL}/nios`);
      return res.json();
    },
    listSupplier: async (): Promise<any[]> => {
      const res = await fetch(`${API_BASE_URL}/nios_supplier`);
      return res.json();
    },
    listSells: async (): Promise<any[]> => {
      const res = await fetch(`${API_BASE_URL}/nios_sells`);
      return res.json();
    },
    listDrivers: async (): Promise<any[]> => {
      const res = await fetch(`${API_BASE_URL}/nios_driver`);
      return res.json();
    },
    nios_finish_seller: async (p:any): Promise<any> => {
      const res = await fetch(`${API_BASE_URL}/nios_finish_seller/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      return res.json();
    },
    listNioCompleted: async (): Promise<any[]> => {
      const res = await fetch(`${API_BASE_URL}/nios_completed`);
      return res.json();
    },
    nios_finish_logic: async (p:any): Promise<any> => {
      const res = await fetch(`${API_BASE_URL}/nios_finish_logic/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      return res.json();
    },
    deleteSupplier: async (id: number): Promise<{ message: string }> => {
      const res = await fetch(`${API_BASE_URL}/nios_supplier/${id}`, {
        method: 'DELETE',
      });
      return res.json();
    },
    delete: async (id: string): Promise<{ message: string }> => {
      const res = await fetch(`${API_BASE_URL}/nio/${id}`, {
        method: 'DELETE',
      });
      return res.json();
    },
    updateN: async (p:any): Promise<{ message: string }> => {
      const res = await fetch(`${API_BASE_URL}/nios/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      return res.json();
    },
    nios_finish_nio: async (p:any): Promise<any> => {
      const res = await fetch(`${API_BASE_URL}/nios_finish_nio/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      return res.json();
    },
    nios_defect: async (p:any): Promise<any> => {
      const res = await fetch(`${API_BASE_URL}/nios_defect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      return res.json();
    },
    nios_defect_put: async (p:any): Promise<any> => {
      const res = await fetch(`${API_BASE_URL}/nios_defect/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      return res.json();
    },
    list_nios_defect: async (p:any): Promise<any> => {
        const params = new URLSearchParams({
          limit: String(p.limit ?? 10),
          offset: String(p.offset ?? 0),
        });      
      const res = await fetch(`${API_BASE_URL}/nios_defect?${params.toString()}`, {
        method: 'GET',
      });
      return res.json();
    },
    nios_defect_imput: async (payload: any): Promise<any> => {
      const res = await fetch(`${API_BASE_URL}/nios_defect_imput`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw await res.json();
      }
      return res.json();
    },    
    putSentSell: async (p:any): Promise<any> => {
      const res = await fetch(`${API_BASE_URL}/nios_sent_seller/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      return res.json();
    },
    putSentSellTrue: async (p:any): Promise<any> => {
      const res = await fetch(`${API_BASE_URL}/nios_sent_seller_true/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      return res.json();
    },
    nios_finish_presupuest: async (p:any): Promise<any> => {
      const res = await fetch(`${API_BASE_URL}/nios_finish_presupuest/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      return res.json();
    },
    create: async (payload: any): Promise<any> => {
      const res = await fetch(`${API_BASE_URL}/nios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw await res.json();
      }
      return res.json();
    },
    createSell: async (payload: any): Promise<any> => {
      const res = await fetch(`${API_BASE_URL}/nios_sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw await res.json();
      }
      return res.json();
    },
    createDriver: async (payload: any): Promise<any> => {
      const res = await fetch(`${API_BASE_URL}/nios_driver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw await res.json();
      }
      return res.json();
    },
    createReception: async (p:any): Promise<any> => {
      const res = await fetch(`${API_BASE_URL}/nios_reception/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      return res.json();
    },
    list_nios_defect_cost: async (p:any): Promise<any> => {
      const res = await fetch(`${API_BASE_URL}/nios_defect_cost/${p.id}`);
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
  intangiblePayments: {
    list: async (): Promise<any[]> => {
      const res = await fetch(`${API_BASE_URL}/intangible-payments`);
      return res.json();
    },
    create: async (formData: FormData): Promise<{ id: number }> => {
      const res = await fetch(`${API_BASE_URL}/intangible-payments`, {
        method: 'POST',
 body: formData,
      });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    aprobar: async (id: number): Promise<{ message: string }> => {
      const res = await fetch(`${API_BASE_URL}/intangible-payments/${id}/aprobar`, {
        method: 'PUT',
      });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    noAprobar: async (id: number): Promise<{ message: string }> => {
      const res = await fetch(`${API_BASE_URL}/intangible-payments/${id}/no-aprobar`, {
        method: 'PUT',
      });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    delete: async (id: number): Promise<{ message: string }> => {
      const res = await fetch(`${API_BASE_URL}/intangible-payments/${id}`, {
        method: 'DELETE',
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
  constructionBook: {
    list: async (projectId: number): Promise<ConstructionBookDocument[]> => {
      const res = await fetch(`${API_BASE_URL}/construction-book?projectId=${projectId}`);
      if (!res.ok) throw await res.json();
      return res.json();
    },
    create: async (formData: FormData): Promise<ConstructionBookDocument> => {
      const res = await fetch(`${API_BASE_URL}/construction-book`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    generateNote: async (payload: { orderId: number; documentIds: number[]; prompt?: string }): Promise<{ text: string }> => {
      const res = await fetch(`${API_BASE_URL}/construction-book/generate-note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw await res.json();
      return res.json();
    },
  },
};
