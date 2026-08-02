
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Construction, 
  ClipboardList, 
  TrendingUp, 
  Menu, 
  X,
  Plus,
  BrainCircuit,
  Bell,
  Warehouse,
  Loader2,
  ArrowLeft,
  Database,
  User,
  Zap,
  HardDrive,
  Package,
  ArrowRight,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  Pencil,
  Trash2,
  Users,
  CreditCard,
  Wallet,
  Building2,
  Receipt,
  PieChart
} from 'lucide-react';

import UsersComponent from "./components/Users/Users"
import { ViewType, Project, Supply, ProjectStock, NIOStatus, CostAccount } from './backend/types';
import ObraComponent from './components/Obra/Obra';
import SupliesComponent from './components/InsumoServicio/Insumos';
import NioComponent from './components/NIO/Nio'
import NioDefectComponent from './components/NIO/NioDefect';
import Header from './components/Styles/Header';
import SidebarItem from './components/Styles/SideBarItem';
import { useAuth } from './components/Login/ProtectedRoute';


import TrazaComponent from './components/Traza/Traza';
import DashBoardComponent from './components/Dashboard/Dashboard';
import PagosIntangiblesComponent from './components/PagosIntangibles/PagosIntangibles';
import ClientePagosComponent from './components/Cliente/ClientePagos';
import ClienteAvancesComponent from './components/Cliente/ClienteAvances';
import ClienteFacturasComponent from './components/Cliente/ClienteFacturas';


// --- Main App ---

export default function App() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>(user?.role_id === 8 ? 'clientePagos' : 'nio');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const renderDashboard = () => (
        <DashBoardComponent></DashBoardComponent>
  )
  const renderTraza = () => (
        <TrazaComponent></TrazaComponent>
  ) 
  const renderProjects = () => (
      <ObraComponent></ObraComponent>
  );
  const renderUsers = () => (
    <UsersComponent></UsersComponent>
  )
  const renderSupplies = () => (
    <SupliesComponent></SupliesComponent>
  )
  const renderNio = () => (
    <NioComponent></NioComponent>
  )
  const renderDefect = () => (
    <NioDefectComponent></NioDefectComponent>
  )
  const renderPagosIntangibles = () => (
    <PagosIntangiblesComponent />
  )
  const renderClientePagos = () => <ClientePagosComponent />;
  const renderClienteAvances = () => <ClienteAvancesComponent />;
  const renderClienteFacturas = () => <ClienteFacturasComponent />;

  const isCliente = user?.role_id === 8;
  const isAdmin = user?.role_id === 1;

  const renderCurrentView = () => {
    switch (activeView) {
      case 'dashboard': return renderDashboard();
      case 'nioDefect': return renderDefect();
      case 'projects': return renderProjects();
      case 'supplies': return renderSupplies();
      case 'users': return renderUsers();
      case 'nio': return renderNio();
      case 'traza': return renderTraza();
      case 'pagosIntangibles': return renderPagosIntangibles();
      case 'clientePagos': return renderClientePagos();
      case 'clienteAvances': return renderClienteAvances();
      case 'clienteFacturas': return renderClienteFacturas();
      default: return isCliente ? renderClientePagos() : renderNio();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onOpenSidebar={() => setSidebarOpen(true)} />
      <div className="flex h-[calc(100vh-4rem)]">
        <aside className="hidden md:flex w-72 flex-col border-r bg-white p-4 gap-2">
          {isCliente ? (
            <>
              <SidebarItem icon={Wallet} label="Pagos Clientes" active={activeView === 'clientePagos'} onClick={() => setActiveView('clientePagos')} />
              <SidebarItem icon={Building2} label="Avances de Obra" active={activeView === 'clienteAvances'} onClick={() => setActiveView('clienteAvances')} />
              <SidebarItem icon={Receipt} label="Facturas o Remitos" active={activeView === 'clienteFacturas'} onClick={() => setActiveView('clienteFacturas')} />
             <SidebarItem icon={PieChart} label="Avance del Presupuesto" active={activeView === 'clientePresupuesto'} onClick={() => setActiveView('clientePresupuesto')} />

            </>
          ) : (
            <>
              <SidebarItem icon={ClipboardList} label="Pizarra NIO" active={activeView === 'nio'} onClick={() => setActiveView('nio')} />
              <SidebarItem icon={AlertCircle} label="NIO Defectuosa" active={activeView === 'nioDefect'} onClick={() => { setActiveView('nioDefect') }} />
              <SidebarItem icon={Construction} label="Obras y Presupuestos" active={activeView === 'projects'} onClick={() => setActiveView('projects')} />
              {user.role_id !== 2 && user.role_id !== 3 &&
                <SidebarItem icon={CreditCard} label="Pagos de Intangibles" active={activeView === 'pagosIntangibles'} onClick={() => setActiveView('pagosIntangibles')} />
              }
              <SidebarItem icon={Package} label="Logística y compras" active={activeView === 'supplies'} onClick={() => setActiveView('supplies')} />
              <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
              <SidebarItem icon={TrendingUp} label="Trazabilidad" active={activeView === 'traza'} onClick={() => setActiveView('traza')} />
              {user.role_id==1?        
              <SidebarItem icon={Users} label="Usuarios" active={activeView === 'users'} onClick={() => setActiveView('users')} />
              :null}
              {isAdmin && (
                <>
                  <div className="mt-2 pt-2 border-t border-slate-100" />
                  <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Portal Cliente</span>
                  <SidebarItem icon={Wallet} label="Pagos Clientes" active={activeView === 'clientePagos'} onClick={() => setActiveView('clientePagos')} />
                  <SidebarItem icon={Building2} label="Avances de Obra" active={activeView === 'clienteAvances'} onClick={() => setActiveView('clienteAvances')} />
                  <SidebarItem icon={Receipt} label="Facturas o Remitos" active={activeView === 'clienteFacturas'} onClick={() => setActiveView('clienteFacturas')} />
                  <SidebarItem icon={PieChart} label="Avance del Presupuesto" active={activeView === 'clientePresupuesto'} onClick={() => { setActiveView('clientePresupuesto'); setSidebarOpen(false); }} />

                </>
              )}
            </>
          )}
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="w-72 h-full bg-white p-4 flex flex-col gap-2" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-xl">LogiCostApp</span>
                <button onClick={() => setSidebarOpen(false)}><X /></button>
              </div>
              {isCliente ? (
                <>
                  <SidebarItem icon={Wallet} label="Pagos Clientes" active={activeView === 'clientePagos'} onClick={() => { setActiveView('clientePagos'); setSidebarOpen(false); }} />
                  <SidebarItem icon={Building2} label="Avances de Obra" active={activeView === 'clienteAvances'} onClick={() => { setActiveView('clienteAvances'); setSidebarOpen(false); }} />
                  <SidebarItem icon={Receipt} label="Facturas o Remitos" active={activeView === 'clienteFacturas'} onClick={() => { setActiveView('clienteFacturas'); setSidebarOpen(false); }} />
                  <SidebarItem icon={PieChart} label="Avance del Presupuesto" active={activeView === 'clientePresupuesto'} onClick={() => setActiveView('clientePresupuesto')} />

                </>
              ) : (
                <>
                  <SidebarItem icon={ClipboardList} label="NIO Board" active={activeView === 'nio'} onClick={() => { setActiveView('nio'); setSidebarOpen(false); }} />
                  <SidebarItem icon={AlertCircle} label="NIO Defectuosa" active={activeView === 'nioDefect'} onClick={() => { setActiveView('nioDefect'); setSidebarOpen(false); }} />
                  <SidebarItem icon={Construction} label="Obras" active={activeView === 'projects'} onClick={() => { setActiveView('projects'); setSidebarOpen(false); }} />
                  {user.role_id !== 2 && user.role_id !== 3 &&
                    <SidebarItem icon={CreditCard} label="Pagos de Intangibles" active={activeView === 'pagosIntangibles'} onClick={() => { setActiveView('pagosIntangibles'); setSidebarOpen(false); }} />
                  }
                  <SidebarItem icon={Package} label="Insumos" active={activeView === 'supplies'} onClick={() => { setActiveView('supplies'); setSidebarOpen(false); }} />
                  <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeView === 'dashboard'} onClick={() => { setActiveView('dashboard'); setSidebarOpen(false); }} />
                  <SidebarItem icon={TrendingUp} label="Trazabilidad" active={activeView === 'traza'} onClick={() => { setActiveView('traza'); setSidebarOpen(false); }} />
                  {user.role_id==1?    
                  <SidebarItem icon={Users} label="Usuarios" active={activeView === 'users'} onClick={() => { setActiveView('users'); setSidebarOpen(false); }} />  
                  :null}
                  {isAdmin && (
                    <>
                      <div className="mt-2 pt-2 border-t border-slate-100" />
                      <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Portal Cliente</span>
                      <SidebarItem icon={Wallet} label="Pagos Clientes" active={activeView === 'clientePagos'} onClick={() => { setActiveView('clientePagos'); setSidebarOpen(false); }} />
                      <SidebarItem icon={Building2} label="Avances de Obra" active={activeView === 'clienteAvances'} onClick={() => { setActiveView('clienteAvances'); setSidebarOpen(false); }} />
                      <SidebarItem icon={Receipt} label="Facturas" active={activeView === 'clienteFacturas'} onClick={() => { setActiveView('clienteFacturas'); setSidebarOpen(false); }} />
                     <SidebarItem icon={PieChart} label="Avance del Presupuesto" active={activeView === 'clientePresupuesto'} onClick={() => { setActiveView('clientePresupuesto'); setSidebarOpen(false); }} />
                    
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            {renderCurrentView()}
          </div>
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-3 flex justify-between items-center z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {isCliente ? (
          <>
            <button onClick={() => setActiveView('clientePagos')} className={`p-2 rounded-full ${activeView === 'clientePagos' ? 'text-blue-600' : 'text-slate-400'}`}><Wallet className="h-6 w-6" /></button>
            <button onClick={() => setActiveView('clienteAvances')} className={`p-2 rounded-full ${activeView === 'clienteAvances' ? 'text-blue-600' : 'text-slate-400'}`}><Building2 className="h-6 w-6" /></button>
            <button onClick={() => setActiveView('clienteFacturas')} className={`p-2 rounded-full ${activeView === 'clienteFacturas' ? 'text-blue-600' : 'text-slate-400'}`}><Receipt className="h-6 w-6" /></button>
          </>
        ) : (
          <>
            <button onClick={() => setActiveView('nio')} className={`p-2 rounded-full ${activeView === 'nio' ? 'text-blue-600' : 'text-slate-400'}`}><ClipboardList className="h-6 w-6" /></button>        
            <button onClick={() => setActiveView('projects')} className={`p-2 rounded-full ${activeView === 'projects' ? 'text-blue-600' : 'text-slate-400'}`}><Construction className="h-6 w-6" /></button>
            <button onClick={() => setActiveView('dashboard')} className={`p-2 rounded-full ${activeView === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}><LayoutDashboard className="h-6 w-6" /></button>
            <button onClick={() => setActiveView('traza')} className={`p-2 rounded-full ${activeView === 'traza' ? 'text-blue-600' : 'text-slate-400'}`}><TrendingUp className="h-6 w-6" /></button>
          </>
        )}
      </nav>
    </div>
  );
}
Shift