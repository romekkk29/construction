
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
export interface NIOS {
  id?: number;
  projectId: ProjectId;
  creationDate?: string;
  needDate: string;
  status: number;
  isEnable?:boolean;
  userId?: number;
  toProcurementAt?: string;
  toLogisticsAt?: string;
  toTransitAt?: string;
  completedAt?: string;
}
export interface NIOSupplier {
  id?: number;
  niosId?:number;
  userId?: number;
  sentDate?: string;
  supplyId: number;
  status: number;
  quantity: number;
  detail?: string;
  accountId: number; 
  nios_sell_id?:number; 
  creation_date?: string;
  statusSell?:number;
  oc_number?: string;
  supplier?: string;
  price_individual?:number;
  nios_drivers_id?:number; 
  driver_date?: string;
  status_transit?:number;
  quantity_less?:number;
  driver_id?:number;
  reception_date?: string;
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
