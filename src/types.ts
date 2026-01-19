
export type ProjectId = string;
export type SupplyId = string;
export type NIOId = string;

export interface CostAccount {
  id: string;
  name: string;
  detail: string;
  budgeted: number;
  spent: number;
}

export interface Project {
  id: ProjectId;
  name: string;
  address: string;
  startDate: string;
  durationDays: number;
  projectManager: string;
  generalManager: string;
  client: string;
  inspector: string;
  accounts: CostAccount[];
  stockBalance: number;
}

export interface Supply {
  id: SupplyId;
  code: string;
  detail: string;
  bestPrice?: number;
  bestSupplier?: string;
  unit: string;
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
