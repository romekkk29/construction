
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
import ProjectFormModal from "./components/Obra/ObraFormModal";
import ConfirmDeleteModal from "./components/Styles/DeleteModal";
import UsersComponent from "./components/Users/Users"
import * as XLSX from 'xlsx';
import { ViewType, Project, Supply, NIO, ProjectStock, NIOStatus, CostAccount } from './backend/types';
import { extractBudgetData, extractSupplyData, FileData } from './services/geminiService';
import { apiClient } from './api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import ObraComponent from './components/Obra/Obra';
import SupliesComponent from './components/InsumoServicio/Insumos';

// --- Utility Functions ---
const fileToBase64 = (file: File): Promise<FileData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({ data: base64String, mimeType: file.type });
    };
    reader.onerror = error => reject(error);
  });
};

const parseExcelToCSV = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        resolve(csv);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
};

// --- Components ---

const Header = ({ onOpenSidebar }: { onOpenSidebar: () => void }) => (
  <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-white px-4 shadow-sm md:px-6">
    <div className="flex items-center gap-4">
      <button onClick={onOpenSidebar} className="p-2 hover:bg-slate-100 rounded-lg md:hidden">
        <Menu className="h-6 w-6" />
      </button>
      <div className="flex items-center gap-2">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Construction className="h-6 w-6 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-800">LogiCost<span className="text-blue-600">App</span></span>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
        <Bell className="h-5 w-5" />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
      </button>
      <div className="h-8 w-8 rounded-full bg-slate-200 border border-slate-300"></div>
    </div>
  </header>
);

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-500'}`} />
    {label}
  </button>
);


// --- Main App ---

export default function App() {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadType, setCurrentUploadType] = useState<{type: 'budget' | 'supplies', id?: string} | null>(null);
  
  // State for data
  const [projects, setProjects] = useState<Project[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [nios, setNios] = useState<NIO[]>([]);
  
  // UI states

  const [selectedProject,setSelectedProject ] = useState<Project | null>(null);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'loading' | 'error'>('loading');
  const [loading, setLoading] = useState<Boolean>(false);

  // Initialize and load from "Postgres"
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projData, nioData, supplyData] = await Promise.all([
          apiClient.projects.list(),
          apiClient.nios.list(),
          apiClient.supplies.list()
        ]);
        setProjects(projData);
        setNios(nioData);
        setSupplies(supplyData);
        setConnectionStatus('connected');
      } catch (error) {
        console.error("DB Connection Error:", error);
        setConnectionStatus('error');
      }
    };
    fetchData();
  }, []);


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUploadType) return;

    setIsAIProcessing(true);
    try {
      let aiInput: FileData | string;
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      
      if (isExcel) {
        aiInput = await parseExcelToCSV(file);
      } else {
        aiInput = await fileToBase64(file);
      }
      
      if (currentUploadType.type === 'budget' && currentUploadType.id) {
        const data = await extractBudgetData(aiInput);
        const newAccounts: CostAccount[] = data.map((d: any, i: number) => ({
          id: `ai-${Date.now()}-${i}`,
          accountNumber: d.accountNumber || '',
          name: d.name,
          detail: d.detail || '',
          budgeted: d.cost,
          spent: 0,
          incidence: d.incidence
        }));

        const projectToUpdate = projects.find(p => p.id === currentUploadType.id);
        if (projectToUpdate) {
          const updatedProject = {
            ...projectToUpdate,
            accounts: [...projectToUpdate.accounts.filter(a => a.id !== 'stock'), ...newAccounts, projectToUpdate.accounts.find(a => a.id === 'stock')].filter(Boolean) as CostAccount[]
          };
          await apiClient.projects.update(updatedProject);
          setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
          if (selectedProject?.id === updatedProject.id) setSelectedProject(updatedProject);
        }
      } else if (currentUploadType.type === 'supplies') {
        const data = await extractSupplyData(typeof aiInput === 'string' ? undefined : aiInput);
        for (const d of data) {
          const s = { id: `s-${Date.now()}-${Math.random()}`, ...d };
          await apiClient.supplies.create(s);
          setSupplies(prev => [...prev, s]);
        }
      }
    } catch (err: any) {
      console.log(err.message)
      alert(err.message || "Error procesando el archivo.");
    } finally {
      setIsAIProcessing(false);
      setCurrentUploadType(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerAIUpload = (type: 'budget' | 'supplies', id?: string) => {
    setCurrentUploadType({ type, id });
    fileInputRef.current?.click();
  };

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-blue-50 p-4 rounded-2xl text-blue-600"><Construction /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Obras</p>
            <p className="text-2xl font-bold text-slate-800">{projects.length}</p>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-amber-50 p-4 rounded-2xl text-amber-600"><ClipboardList /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">NIOs Activos</p>
            <p className="text-2xl font-bold text-slate-800">{nios.filter(n => n.status !== NIOStatus.COMPLETED).length}</p>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600"><Zap /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Presupuesto</p>
            <p className="text-2xl font-bold text-slate-800">
              ${projects
                .reduce(
                  (sum, p) =>
                    sum +
                    (p.accounts?.reduce((aSum, a) => aSum + a.budgeted, 0) ?? 0),
                  0
                )
                .toLocaleString()}
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-purple-50 p-3 rounded-xl text-purple-600"><Warehouse /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Stock Consolidado</p>
            <p className="text-2xl font-bold text-slate-800">
              ${projects.reduce((sum, p) => sum + p.stockBalance?p.stockBalance:0, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <h3 className="text-lg font-black mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Consumo vs Presupuesto
          </h3>
          <div className="h-80 w-full">
            {projects.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projects.map(p => ({
                  name: p.name,
                  Presupuesto: p.accounts?.reduce((sum, a) => sum + a.budgeted, 0) ?? 0,
                  Consumido: p.accounts?.reduce((sum, a) => sum + a.spent, 0) ?? 0
                }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                  <Legend iconType="circle" />
                  <Bar dataKey="Presupuesto" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Consumido" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">No hay datos suficientes</div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-black mb-6 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-amber-600" />
            Estatus NIO
          </h3>
          <div className="flex-1 flex flex-col justify-center">
             {nios.length > 0 ? (
               <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                        data={[
                          { name: 'Obra', value: nios.filter(n => n.status === NIOStatus.SITE).length },
                          { name: 'Compras', value: nios.filter(n => n.status === NIOStatus.PROCUREMENT).length },
                          { name: 'Logística', value: nios.filter(n => n.status === NIOStatus.LOGISTICS).length },
                          { name: 'Completas', value: nios.filter(n => n.status === NIOStatus.COMPLETED).length },
                        ].filter(d => d.value > 0)}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                   {[0, 1, 2, 3, 4].map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={['#3b82f6', '#f59e0b', '#10b981', '#6366f1', '#94a3b8'][index % 5]} />
                   ))}
                 </Pie>
                 <Tooltip />
                 <Legend />
               </PieChart>
             </ResponsiveContainer>
          </div>) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">No hay datos suficientes</div>
            )}
          </div>
        </div>
      </div>
    </div>
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
  const renderCurrentView = () => {
    switch (activeView) {
      case 'dashboard': return renderDashboard();
      case 'projects': return renderProjects();
      case 'supplies': return renderSupplies();
      case 'users': return renderUsers();
      default: return renderDashboard();
    }
  };

  const [nioFormProjectId, setNioFormProjectId] = useState<string>('');
  const nioFormProject = projects.find(p => p.id === nioFormProjectId);

  return (
    <div className="min-h-screen bg-slate-50">

      <Header onOpenSidebar={() => setSidebarOpen(true)} />
      
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".pdf,.xlsx,.xls,image/*"
        onChange={handleFileChange}
      />

      <div className="flex h-[calc(100vh-4rem)]">
        <aside className="hidden md:flex w-72 flex-col border-r bg-white p-4 gap-2">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
          <SidebarItem icon={Users} label="Usuarios" active={activeView === 'users'} onClick={() => setActiveView('users')} />
          <SidebarItem icon={Construction} label="Obras y Presupuestos" active={activeView === 'projects'} onClick={() => setActiveView('projects')} />
          <SidebarItem icon={Package} label="Insumos y Servicios" active={activeView === 'supplies'} onClick={() => setActiveView('supplies')} />
          <SidebarItem icon={Warehouse} label="Stock por Obra" active={activeView === 'stock'} onClick={() => setActiveView('stock')} />
          <SidebarItem icon={ClipboardList} label="Pizarra NIO" active={activeView === 'nio'} onClick={() => setActiveView('nio')} />
          <SidebarItem icon={TrendingUp} label="Trazabilidad" active={activeView === 'traceability'} onClick={() => setActiveView('traceability')} />
          <div className="mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Ayuda IA</p>
            <p className="text-[10px] text-slate-500 mb-3">Escanea presupuestos y facturas en segundos con nuestro motor inteligente.</p>
            <button 
              onClick={() => triggerAIUpload('supplies')}
              className="w-full bg-slate-900 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
            >
              <BrainCircuit className="h-4 w-4" /> Consultar IA
            </button>
          </div>
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




      {/* Global Overlay for AI Processing */}
      {isAIProcessing && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full text-center border border-white/20">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full animate-pulse"></div>
                <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-5 rounded-2xl relative shadow-xl">
                  <BrainCircuit className="h-10 w-10 text-white animate-bounce" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Analizando Documento</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Nuestra IA está extrayendo cuentas, detalles y costos. <br/>
                  <span className="font-bold text-blue-600">Esto puede tomar unos segundos...</span>
                </p>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full w-2/3 animate-[shimmer_2s_infinite] rounded-full"></div>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Procesando $, decimales y separadores</p>
           </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
