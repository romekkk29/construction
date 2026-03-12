
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
  Users
} from 'lucide-react';

import UsersComponent from "./components/Users/Users"
import { ViewType, Project, Supply, ProjectStock, NIOStatus, CostAccount } from './backend/types';
import ObraComponent from './components/Obra/Obra';
import SupliesComponent from './components/InsumoServicio/Insumos';
import NioComponent from './components/NIO/Nio'
import Header from './components/Styles/Header';
import SidebarItem from './components/Styles/SideBarItem';
import { useAuth } from './components/Login/ProtectedRoute';




// --- Main App ---

export default function App() {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
   const { user } = useAuth();
  const renderDashboard = () => (
        <p>Proximamente</p>
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
  const renderCurrentView = () => {
    switch (activeView) {
      case 'dashboard': return renderDashboard();
      case 'projects': return renderProjects();
      case 'supplies': return renderSupplies();
      case 'users': return renderUsers();
      case 'nio': return renderNio();
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onOpenSidebar={() => setSidebarOpen(true)} />
      <div className="flex h-[calc(100vh-4rem)]">
        <aside className="hidden md:flex w-72 flex-col border-r bg-white p-4 gap-2">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
          {user.role_id==1?        
          <SidebarItem icon={Users} label="Usuarios" active={activeView === 'users'} onClick={() => setActiveView('users')} />
          :null} 
          {user.role_id==1||user.role_id==4?   
          <SidebarItem icon={Construction} label="Obras y Presupuestos" active={activeView === 'projects'} onClick={() => setActiveView('projects')} />
          :null}
          <SidebarItem icon={Package} label="Logística y compras" active={activeView === 'supplies'} onClick={() => setActiveView('supplies')} />
          <SidebarItem icon={Warehouse} label="Stock por Obra" active={activeView === 'stock'} onClick={() => setActiveView('stock')} />
          <SidebarItem icon={ClipboardList} label="Pizarra NIO" active={activeView === 'nio'} onClick={() => setActiveView('nio')} />
          <SidebarItem icon={TrendingUp} label="Trazabilidad" active={activeView === 'traceability'} onClick={() => setActiveView('traceability')} />
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="w-72 h-full bg-white p-4 flex flex-col gap-2" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-xl">LogiCostApp</span>
                <button onClick={() => setSidebarOpen(false)}><X /></button>
              </div>
              <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeView === 'dashboard'} onClick={() => { setActiveView('dashboard'); setSidebarOpen(false); }} />
              <SidebarItem icon={Users} label="Usuarios" active={activeView === 'users'} onClick={() => { setActiveView('users'); setSidebarOpen(false); }} />
              <SidebarItem icon={Construction} label="Obras" active={activeView === 'projects'} onClick={() => { setActiveView('projects'); setSidebarOpen(false); }} />
              <SidebarItem icon={Package} label="Insumos" active={activeView === 'supplies'} onClick={() => { setActiveView('supplies'); setSidebarOpen(false); }} />
              <SidebarItem icon={Warehouse} label="Stock" active={activeView === 'stock'} onClick={() => { setActiveView('stock'); setSidebarOpen(false); }} />
              <SidebarItem icon={ClipboardList} label="NIO Board" active={activeView === 'nio'} onClick={() => { setActiveView('nio'); setSidebarOpen(false); }} />
              <SidebarItem icon={TrendingUp} label="Trazabilidad" active={activeView === 'traceability'} onClick={() => { setActiveView('traceability'); setSidebarOpen(false); }} />
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
        <button onClick={() => setActiveView('dashboard')} className={`p-2 rounded-full ${activeView === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}><LayoutDashboard className="h-6 w-6" /></button>
        <button onClick={() => setActiveView('projects')} className={`p-2 rounded-full ${activeView === 'projects' ? 'text-blue-600' : 'text-slate-400'}`}><Construction className="h-6 w-6" /></button>
        <button onClick={() => setActiveView('nio')} className={`p-2 rounded-full ${activeView === 'nio' ? 'text-blue-600' : 'text-slate-400'}`}><ClipboardList className="h-6 w-6" /></button>
        <button onClick={() => setActiveView('traceability')} className={`p-2 rounded-full ${activeView === 'traceability' ? 'text-blue-600' : 'text-slate-400'}`}><TrendingUp className="h-6 w-6" /></button>
      </nav>
    </div>
  );
}
