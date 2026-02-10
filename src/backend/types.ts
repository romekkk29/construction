
export type ProjectId = string;
export type SupplyId = string;
export type NIOId = string;


export interface User {
  id: number;
  name: string;
  lastName: string;
  rol: Role;
  permissionsIds?: number[];
  isEnable?:boolean;
  email: string;
  password?: string;
  google_id?: string;
}
export interface Role {
  id: number;
  name: string;
}
export interface Permission {
  id: number;
  name: string;
}

export interface Project {
  id: number;
  name: string;
  address: string;
  startDate: string;
  durationDays: number;
  projectManager: number;
  generalManager: number;
  client: string;
  inspector: string;
  accounts?: CostAccount[];
  stockBalance: number;
  isEnable?:boolean;
}

export interface CostAccount {
  id: number;
  projectId: number;
  name?: string;
  detail: string;
  budgeted: number;
  spent?: number;
  accountNumber?: string;
  incidence?: number;
  isCreatedYet?:boolean;
  isEnable?:boolean;
}

export interface Supply {
  id?: number;
  code: string;
  detail: string;
  bestPrice?: number;
  bestSupplier?: string;
  unit: string;
  isEnable?:boolean;
  isCreatedYet?:boolean;
}
export interface Driver {
  id?: number;
  name: string;
  vehicle?: string;
  phone?: number;
  isEnable?:boolean;
}
export enum NIOStatus {
  SITE = 'SITE',
  PROCUREMENT = 'PROCUREMENT',
  LOGISTICS = 'LOGISTICS',
  TRANSIT = 'TRANSIT',
  COMPLETED = 'COMPLETED'
}

export interface NIO {
  id: NIOId;
  projectId: ProjectId;
  creationDate: string;
  needDate: string;
  accountId: string;
  supplyId: string;
  supplyManual?: string;
  unit: string;
  quantity: number;
  status: NIOStatus;
  
  // Procurement details
  procurementDate?: string;
  supplier?: string;
  ocNumber?: string;
  purchasePrice?: number;

  // Logistics details
  driver?: string;
  logisticsDate?: string;
  deliveredQuantity?: number;
  
  // Timestamps for traceability
  toProcurementAt?: string;
  toLogisticsAt?: string;
  toTransitAt?: string;
  completedAt?: string;
}

export interface ProjectStock {
  id: string;
  projectId: ProjectId;
  supplyId: SupplyId;
  quantity: number;
  unit: string;
  lastUpdated: string;
}

export type ViewType = 'dashboard' | 'projects' | 'supplies' | 'stock' | 'nio' | 'traceability';
