
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Construction, 
  Package, 
  Warehouse, 
  ClipboardList, 
  TrendingUp, 
  Menu, 
  X,
  Plus,
  ArrowRight,
  BrainCircuit,
  Bell,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Send,
  MessageCircle,
  ArrowRightLeft,
  FileUp,
  Loader2,
  Calendar,
  DollarSign,
  User,
  Hash,
  ArrowLeft
} from 'lucide-react';
import { ViewType, Project, Supply, NIO, ProjectStock, NIOStatus, CostAccount } from './types';
import { extractBudgetData, extractSupplyData, FileData } from './services/geminiService';
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

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children?: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b p-6">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="h-6 w-6" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

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
  const [projectStocks, setProjectStocks] = useState<ProjectStock[]>([]);
  
  // UI states
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isNIOModalOpen, setIsNIOModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedNio, setSelectedNio] = useState<NIO | null>(null);
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  // Initialize with dummy data
  useEffect(() => {
    const dummyProjects: Project[] = [
      {
        id: '1',
        name: 'Edificio Las Palmeras',
        address: 'Av. Libertador 1200',
        startDate: '2024-01-15',
        durationDays: 360,
        projectManager: 'Ing. Martín García',
        generalManager: 'Arq. Elena Soria',
        client: 'Grupo Desarrollador X',
        inspector: 'Ing. Carlos Ruiz',
        accounts: [
          { id: 'a1', name: 'Cimientos', detail: 'Hormigón y excavación', budgeted: 500000, spent: 450000 },
          { id: 'a2', name: 'Mampostería', detail: 'Paredes y tabiques', budgeted: 300000, spent: 120000 },
          { id: 'stock', name: 'Stock', detail: 'Cuenta de ingresos por liquidación', budgeted: 0, spent: -5000 },
        ],
        stockBalance: 5000
      }
    ];
    const dummySupplies: Supply[] = [
      { id: 's1', code: '001', detail: 'Bolsa de cemento x 50 kg', unit: 'Bolsa', bestPrice: 1200, bestSupplier: 'Corralón Central' },
      { id: 's2', code: '002', detail: 'Arena Fina', unit: 'm3', bestPrice: 850, bestSupplier: 'Arena S.A.' }
    ];
    const dummyStocks: ProjectStock[] = [
      { id: 'ps1', projectId: '1', supplyId: 's1', quantity: 25, unit: 'Bolsa', lastUpdated: new Date().toISOString() },
      { id: 'ps2', projectId: '1', supplyId: 's2', quantity: 5, unit: 'm3', lastUpdated: new Date().toISOString() }
    ];
    setProjects(dummyProjects);
    setSupplies(dummySupplies);
    setProjectStocks(dummyStocks);
  }, []);

  const handleCreateProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      startDate: formData.get('startDate') as string,
      durationDays: parseInt(formData.get('durationDays') as string) || 0,
      projectManager: formData.get('projectManager') as string,
      generalManager: formData.get('generalManager') as string,
      client: formData.get('client') as string,
      inspector: formData.get('inspector') as string,
      accounts: [
        { id: 'stock', name: 'Stock', detail: 'Cuenta de ingresos por liquidación', budgeted: 0, spent: 0 }
      ],
      stockBalance: 0
    };

    setProjects(prev => [...prev, newProject]);
    setIsProjectModalOpen(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUploadType) return;

    setIsAIProcessing(true);
    try {
      const fileData = await fileToBase64(file);
      
      if (currentUploadType.type === 'budget') {
        const data = await extractBudgetData(fileData);
        if (currentUploadType.id) {
          const newAccounts: CostAccount[] = data.map((d: any, i: number) => ({
            id: `ai-${Date.now()}-${i}`,
            name: d.name,
            detail: d.detail,
            budgeted: d.cost,
            spent: 0
          }));

          setProjects(prev => prev.map(p => {
            if (p.id !== currentUploadType.id) return p;
            const stockAcc = p.accounts.find(a => a.id === 'stock');
            const otherAccs = p.accounts.filter(a => a.id !== 'stock');
            return {
              ...p,
              accounts: [...otherAccs, ...newAccounts, stockAcc].filter(Boolean) as CostAccount[]
            };
          }));
          
          if (selectedProject?.id === currentUploadType.id) {
            setSelectedProject(prev => prev ? {
              ...prev,
              accounts: [...prev.accounts.filter(a => a.id !== 'stock'), ...newAccounts, prev.accounts.find(a => a.id === 'stock')].filter(Boolean) as CostAccount[]
            } : null);
          }
        }
      } else {
        const data = await extractSupplyData(fileData);
        setSupplies(prev => [...prev, ...data.map((d: any, i: number) => ({
          id: `ai-s-${Date.now()}-${i}`,
          ...d
        }))]);
      }
      alert("Procesamiento completado con éxito");
    } catch (err) {
      console.error(err);
      alert("Error procesando el archivo. Asegúrate de que sea un PDF o Excel válido.");
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

  const handleCreateNIO = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const projectId = formData.get('projectId') as string;
    const accountId = formData.get('accountId') as string;
    const supplyId = formData.get('supplyId') as string;
    const quantity = parseFloat(formData.get('quantity') as string);
    const unit = formData.get('unit') as string;
    const needDate = formData.get('needDate') as string;
    const manualSupply = formData.get('manualSupply') as string;

    let finalSupplyId = supplyId;

    if (manualSupply && manualSupply.trim() !== "") {
      const newSupply: Supply = {
        id: Math.random().toString(36).substr(2, 9),
        code: `MAN-${Date.now().toString().slice(-4)}`,
        detail: manualSupply,
        unit: unit || 'u'
      };
      setSupplies(prev => [...prev, newSupply]);
      finalSupplyId = newSupply.id;
    }

    const newNIO: NIO = {
      id: `NIO-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      projectId,
      creationDate: new Date().toISOString(),
      needDate,
      accountId,
      supplyId: finalSupplyId,
      unit,
      quantity,
      status: NIOStatus.SITE,
      toProcurementAt: new Date().toISOString()
    };

    setNios(prev => [...prev, newNIO]);
    setIsNIOModalOpen(false);
  };

  const updateNIOStatus = (nioId: string, status: NIOStatus, extraData: Partial<NIO> = {}) => {
    setNios(prev => prev.map(n => {
      if (n.id !== nioId) return n;
      const updated = { ...n, ...extraData, status };
      
      if (status === NIOStatus.PROCUREMENT) updated.toProcurementAt = new Date().toISOString();
      if (status === NIOStatus.LOGISTICS) updated.toLogisticsAt = new Date().toISOString();
      if (status === NIOStatus.TRANSIT) updated.toTransitAt = new Date().toISOString();
      if (status === NIOStatus.COMPLETED) updated.completedAt = new Date().toISOString();
      
      // Imputación a la obra y actualización de mejor precio cuando pasa de Compras a Logística
      if (status === NIOStatus.LOGISTICS && updated.purchasePrice) {
        setProjects(prevProj => prevProj.map(p => {
          if (p.id !== n.projectId) return p;
          return {
            ...p,
            accounts: p.accounts.map(acc => acc.id === n.accountId ? { ...acc, spent: acc.spent + (updated.purchasePrice! * updated.quantity) } : acc)
          };
        }));
        
        setSupplies(prevSupp => prevSupp.map(s => {
          if (s.id !== n.supplyId) return s;
          if (!s.bestPrice || updated.purchasePrice! < s.bestPrice) {
            return { ...s, bestPrice: updated.purchasePrice, bestSupplier: updated.supplier };
          }
          return s;
        }));
      }

      return updated;
    }));
    
    // Update local selectedNio state if it's open
    if (selectedNio?.id === nioId) {
      setSelectedNio(prev => prev ? { ...prev, ...extraData, status } : null);
    }
  };

  const sendWhatsApp = (nio: NIO) => {
    const project = projects.find(p => p.id === nio.projectId);
    const supply = supplies.find(s => s.id === nio.supplyId);
    const text = `LogiCostApp - Envío Logística\nChofer: ${nio.driver}\nObra: ${project?.name}\nDirección: ${project?.address}\nMaterial: ${supply?.detail}\nCantidad: ${nio.quantity} ${nio.unit}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // --- View Renderers ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><Construction /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Obras Activas</p>
            <p className="text-2xl font-bold text-slate-800">{projects.length}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-amber-50 p-3 rounded-xl text-amber-600"><ClipboardList /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">NIOs Pendientes</p>
            <p className="text-2xl font-bold text-slate-800">{nios.filter(n => n.status !== NIOStatus.COMPLETED).length}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600"><TrendingUp /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Presupuesto Total</p>
            <p className="text-2xl font-bold text-slate-800">
              ${projects.reduce((sum, p) => sum + p.accounts.reduce((aSum, a) => aSum + a.budgeted, 0), 0).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-purple-50 p-3 rounded-xl text-purple-600"><Warehouse /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Stock Consolidado</p>
            <p className="text-2xl font-bold text-slate-800">
              ${projects.reduce((sum, p) => sum + p.stockBalance, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Consumo vs Presupuesto por Obra
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projects.map(p => ({
                name: p.name,
                Presupuesto: p.accounts.reduce((sum, a) => sum + a.budgeted, 0),
                Consumido: p.accounts.reduce((sum, a) => sum + Math.max(0, a.spent), 0)
              }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" />
                <Bar dataKey="Presupuesto" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Consumido" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-amber-600" />
            Estado de NIOs
          </h3>
          <div className="h-80 flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                    data={[
                      { name: 'Obra', value: nios.filter(n => n.status === NIOStatus.SITE).length },
                      { name: 'Compras', value: nios.filter(n => n.status === NIOStatus.PROCUREMENT).length },
                      { name: 'Logística', value: nios.filter(n => n.status === NIOStatus.LOGISTICS).length },
                      { name: 'Tránsito', value: nios.filter(n => n.status === NIOStatus.TRANSIT).length },
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
          </div>
        </div>
      </div>
    </div>
  );

  const renderProjects = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Gestión de Obras</h2>
        <button 
          onClick={() => setIsProjectModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-200 transition-all"
        >
          <Plus className="h-5 w-5" /> Nueva Obra
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <div key={project.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{project.name}</h3>
                <p className="text-sm text-slate-500">{project.address}</p>
              </div>
              <button 
                onClick={() => setSelectedProject(project)}
                className="text-blue-600 hover:underline text-sm font-semibold"
              >
                Ver Detalle
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Consumido</span>
                <span className="font-bold text-slate-800">
                  ${project.accounts.reduce((sum, a) => sum + Math.max(0, a.spent), 0).toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (project.accounts.reduce((sum, a) => sum + Math.max(0, a.spent), 0) / project.accounts.reduce((sum, a) => (a.budgeted || 1), 0)) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Presupuesto</span>
                <span className="text-slate-800">${project.accounts.reduce((sum, a) => sum + a.budgeted, 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto animate-in slide-in-from-right duration-300">
          <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8 border-b pb-6">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900">{selectedProject.name}</h2>
                <p className="text-slate-500">{selectedProject.address} | Inicio: {selectedProject.startDate}</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => triggerAIUpload('budget', selectedProject.id)}
                  disabled={isAIProcessing}
                  className="bg-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-purple-700 transition-colors shadow-lg shadow-purple-100"
                >
                  {isAIProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <BrainCircuit className="h-5 w-5" />}
                  {isAIProcessing ? 'Procesando...' : 'Carga IA (PDF/Excel)'}
                </button>
                <button onClick={() => setSelectedProject(null)} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200"><X /></button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
               <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-100">
                 <p className="text-blue-100 text-sm font-medium">Presupuesto Total</p>
                 <p className="text-3xl font-bold">${selectedProject.accounts.reduce((s, a) => s + a.budgeted, 0).toLocaleString()}</p>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                 <p className="text-slate-500 text-sm">Consumido</p>
                 <p className="text-3xl font-bold text-red-500">${selectedProject.accounts.reduce((s, a) => s + Math.max(0, a.spent), 0).toLocaleString()}</p>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                 <p className="text-slate-500 text-sm">Saldo Restante</p>
                 <p className="text-3xl font-bold text-emerald-500">
                  ${(selectedProject.accounts.reduce((s, a) => s + a.budgeted, 0) - selectedProject.accounts.reduce((s, a) => s + Math.max(0, a.spent), 0)).toLocaleString()}
                 </p>
               </div>
               <div className="bg-slate-800 p-6 rounded-2xl text-white shadow-lg shadow-slate-200">
                 <p className="text-slate-300 text-sm">Ingresos por Stock</p>
                 <p className="text-3xl font-bold">${selectedProject.stockBalance.toLocaleString()}</p>
               </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b">
                   <tr>
                     <th className="px-6 py-4 text-sm font-semibold text-slate-600">Cuenta</th>
                     <th className="px-6 py-4 text-sm font-semibold text-slate-600">Detalle</th>
                     <th className="px-6 py-4 text-sm font-semibold text-slate-600">Presupuesto</th>
                     <th className="px-6 py-4 text-sm font-semibold text-slate-600">Gastado</th>
                     <th className="px-6 py-4 text-sm font-semibold text-slate-600">Saldo</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y">
                   {selectedProject.accounts.map(acc => (
                     <tr key={acc.id} className="hover:bg-slate-50 transition-colors">
                       <td className="px-6 py-4 font-medium text-slate-800">{acc.name}</td>
                       <td className="px-6 py-4 text-slate-600 text-sm">{acc.detail}</td>
                       <td className="px-6 py-4 text-slate-800">${acc.budgeted.toLocaleString()}</td>
                       <td className="px-6 py-4 text-red-600 font-medium">${acc.spent.toLocaleString()}</td>
                       <td className="px-6 py-4 text-emerald-600 font-bold">${(acc.budgeted - acc.spent).toLocaleString()}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSupplies = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Insumos y Servicios</h2>
        <div className="flex gap-2">
           <button 
            onClick={() => triggerAIUpload('supplies')}
            disabled={isAIProcessing}
            className="bg-purple-50 text-purple-700 px-4 py-2 rounded-xl flex items-center gap-2 border border-purple-200"
          >
            {isAIProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <BrainCircuit className="h-5 w-5" />}
            Importar IA
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
            <Plus className="h-5 w-5" /> Nuevo Insumo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Buscar por código o detalle..." className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Código</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Detalle</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Unidad</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Mejor Precio</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Mejor Proveedor</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {supplies.map(supply => (
              <tr key={supply.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-mono text-sm text-slate-600">{supply.code}</td>
                <td className="px-6 py-4 font-medium text-slate-800">{supply.detail}</td>
                <td className="px-6 py-4 text-slate-500">{supply.unit}</td>
                <td className="px-6 py-4 text-emerald-600 font-bold">${supply.bestPrice?.toLocaleString() || '-'}</td>
                <td className="px-6 py-4 text-slate-800">{supply.bestSupplier || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStock = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Stock por Obra</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map(project => {
          const stocks = projectStocks.filter(ps => ps.projectId === project.id);
          return (
            <div key={project.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Warehouse className="h-5 w-5 text-purple-600" /> {project.name}
                </h3>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold">
                  {stocks.length} Items
                </span>
              </div>
              <div className="p-0">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/50 border-b">
                    <tr>
                      <th className="px-4 py-2 font-semibold text-slate-500">Insumo</th>
                      <th className="px-4 py-2 font-semibold text-slate-500">Stock</th>
                      <th className="px-4 py-2 font-semibold text-slate-500 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {stocks.length > 0 ? stocks.map(stock => {
                      const supply = supplies.find(s => s.id === stock.supplyId);
                      return (
                        <tr key={stock.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800">{supply?.detail || 'Desconocido'}</p>
                            <p className="text-[10px] text-slate-400">Cod: {supply?.code}</p>
                          </td>
                          <td className="px-4 py-3 font-bold text-blue-600">{stock.quantity} {stock.unit}</td>
                          <td className="px-4 py-3 text-right">
                            <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                              <ArrowRightLeft className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">No hay stock registrado</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderNIOBoard = () => {
    const columns = [
      { id: NIOStatus.SITE, label: 'OBRA (Solicitud)', icon: Construction, color: 'blue' },
      { id: NIOStatus.PROCUREMENT, label: 'Compras', icon: ClipboardList, color: 'amber' },
      { id: NIOStatus.LOGISTICS, label: 'Logística', icon: Truck, color: 'emerald' },
      { id: NIOStatus.TRANSIT, label: 'EN TRANSITO Y RECEPCION EN OBRA', icon: Send, color: 'indigo' },
      { id: NIOStatus.COMPLETED, label: 'Completas', icon: CheckCircle2, color: 'slate' },
    ];

    return (
      <div className="h-[calc(100vh-12rem)] overflow-hidden flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Pizarra de Seguimiento NIO</h2>
          <button 
            onClick={() => {
              if (projects.length === 0) {
                alert("Debe cargar al menos una obra antes de iniciar una NIO.");
                return;
              }
              setIsNIOModalOpen(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
          >
            <Plus className="h-5 w-5" /> Iniciar NIO
          </button>
        </div>

        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {columns.map(col => (
            <div key={col.id} className="min-w-[320px] bg-slate-100 rounded-2xl flex flex-col border border-slate-200">
              <div className={`p-4 border-b flex items-center gap-2 bg-white rounded-t-2xl border-${col.color}-500 border-t-4`}>
                <col.icon className={`h-5 w-5 text-${col.color}-600`} />
                <span className="font-bold text-slate-800 uppercase tracking-tight text-sm">{col.label}</span>
                <span className="ml-auto bg-slate-200 px-2 py-0.5 rounded-full text-xs font-bold text-slate-600">
                  {nios.filter(n => n.status === col.id).length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {nios.filter(n => n.status === col.id).map(nio => {
                  const project = projects.find(p => p.id === nio.projectId);
                  const supply = supplies.find(s => s.id === nio.supplyId);
                  
                  return (
                    <div 
                      key={nio.id} 
                      onClick={() => setSelectedNio(nio)}
                      className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group animate-in fade-in zoom-in duration-300"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{nio.id}</span>
                        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                          <Clock className="h-3 w-3" /> {new Date(nio.creationDate).toLocaleDateString()}
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-900 leading-tight mb-1">{project?.name}</h4>
                      <p className="text-sm text-slate-600 font-medium mb-3">{supply?.detail}</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <p className="text-slate-400">Cantidad</p>
                          <p className="font-bold">{nio.quantity} {nio.unit}</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg flex items-center justify-center">
                           <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* --- Fullscreen NIO Detail Screen --- */}
        {selectedNio && (
          <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="max-w-4xl mx-auto min-h-screen bg-white shadow-2xl flex flex-col">
              {/* Header area */}
              <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <button 
                  onClick={() => setSelectedNio(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 flex items-center gap-2 font-medium"
                >
                  <ArrowLeft className="h-5 w-5" /> Volver a Pizarra
                </button>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                    selectedNio.status === NIOStatus.SITE ? 'bg-blue-100 text-blue-700' :
                    selectedNio.status === NIOStatus.PROCUREMENT ? 'bg-amber-100 text-amber-700' :
                    selectedNio.status === NIOStatus.LOGISTICS ? 'bg-emerald-100 text-emerald-700' :
                    selectedNio.status === NIOStatus.TRANSIT ? 'bg-indigo-100 text-indigo-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {columns.find(c => c.id === selectedNio.status)?.label}
                  </span>
                  <div className="h-8 w-px bg-slate-200"></div>
                  <span className="text-sm font-mono text-slate-400">{selectedNio.id}</span>
                </div>
              </div>

              <div className="flex-1 p-8 space-y-10">
                {/* General Info */}
                <section>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Información General</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="flex gap-4 items-start">
                        <div className="bg-blue-50 p-3 rounded-2xl text-blue-600"><Construction /></div>
                        <div>
                          <p className="text-xs text-slate-400 font-bold uppercase">Obra</p>
                          <p className="text-lg font-bold text-slate-900">{projects.find(p => p.id === selectedNio.projectId)?.name}</p>
                          <p className="text-sm text-slate-500">{projects.find(p => p.id === selectedNio.projectId)?.address}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 items-start">
                        <div className="bg-purple-50 p-3 rounded-2xl text-purple-600"><Package /></div>
                        <div>
                          <p className="text-xs text-slate-400 font-bold uppercase">Insumo / Servicio</p>
                          <p className="text-lg font-bold text-slate-900">{supplies.find(s => s.id === selectedNio.supplyId)?.detail}</p>
                          <p className="text-sm text-slate-500">Cód: {supplies.find(s => s.id === selectedNio.supplyId)?.code}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Cantidad</p>
                            <p className="text-xl font-black text-slate-800">{selectedNio.quantity} <span className="text-sm font-medium text-slate-500">{selectedNio.unit}</span></p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Fecha Necesidad</p>
                            <p className="text-sm font-bold text-slate-800">{new Date(selectedNio.needDate).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                         <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Cuenta Imputación</p>
                         <p className="text-sm font-bold text-slate-800">
                           {projects.find(p => p.id === selectedNio.projectId)?.accounts.find(a => a.id === selectedNio.accountId)?.name}
                         </p>
                       </div>
                    </div>
                  </div>
                </section>

                <div className="h-px bg-slate-100"></div>

                {/* Status Specific Actions */}
                <section className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
                  <div className="flex items-center gap-3 mb-6">
                    <BrainCircuit className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-bold text-slate-800">Acciones de Gestión: <span className="text-blue-600">{columns.find(c => c.id === selectedNio.status)?.label}</span></h3>
                  </div>

                  {selectedNio.status === NIOStatus.SITE && (
                    <div className="space-y-6">
                      <p className="text-slate-600">La solicitud ha sido creada y está lista para ser enviada al área de compras.</p>
                      <button 
                        onClick={() => updateNIOStatus(selectedNio.id, NIOStatus.PROCUREMENT)}
                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                      >
                        Enviar a Compras <ArrowRight />
                      </button>
                    </div>
                  )}

                  {selectedNio.status === NIOStatus.PROCUREMENT && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Hash className="h-3 w-3" /> Número Orden de Compra (OC)</label>
                          <input 
                            defaultValue={selectedNio.ocNumber}
                            className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 bg-white shadow-sm"
                            onChange={(e) => selectedNio.ocNumber = e.target.value}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><User className="h-3 w-3" /> Proveedor</label>
                          <input 
                            defaultValue={selectedNio.supplier}
                            className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 bg-white shadow-sm"
                            onChange={(e) => selectedNio.supplier = e.target.value}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><DollarSign className="h-3 w-3" /> Precio Unitario de Compra</label>
                          <div className="relative">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                             <input 
                              type="number"
                              step="0.01"
                              defaultValue={selectedNio.purchasePrice}
                              className="w-full p-4 pl-8 border rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 bg-white shadow-sm"
                              onChange={(e) => {
                                selectedNio.purchasePrice = parseFloat(e.target.value);
                                // Validation check for best price suggestion
                                const supply = supplies.find(s => s.id === selectedNio.supplyId);
                                if (supply?.bestPrice && selectedNio.purchasePrice > supply.bestPrice) {
                                  alert(`Atención: El precio ingresado ($${selectedNio.purchasePrice}) es superior al mejor precio registrado ($${supply.bestPrice} de ${supply.bestSupplier}).`);
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col justify-end gap-3">
                         <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800 text-sm">
                            <p className="font-bold mb-1 flex items-center gap-1"><BrainCircuit className="h-4 w-4" /> Sugerencia de Compra</p>
                            {supplies.find(s => s.id === selectedNio.supplyId)?.bestPrice 
                              ? `Mejor precio histórico: $${supplies.find(s => s.id === selectedNio.supplyId)?.bestPrice} con ${supplies.find(s => s.id === selectedNio.supplyId)?.bestSupplier}.` 
                              : "No hay datos previos de compra para este insumo."}
                         </div>
                         <button 
                          onClick={() => {
                            if (!selectedNio.ocNumber || !selectedNio.purchasePrice || !selectedNio.supplier) {
                              alert("Debe completar todos los datos de compra.");
                              return;
                            }
                            updateNIOStatus(selectedNio.id, NIOStatus.LOGISTICS);
                          }}
                          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                        >
                          Pasar a Logística <ArrowRight />
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedNio.status === NIOStatus.LOGISTICS && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Truck className="h-3 w-3" /> Designar Chofer / Vehículo</label>
                          <input 
                            defaultValue={selectedNio.driver}
                            className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm"
                            onChange={(e) => selectedNio.driver = e.target.value}
                          />
                        </div>
                        <div className="flex items-end">
                           <button 
                            disabled={!selectedNio.driver}
                            onClick={() => sendWhatsApp(selectedNio)}
                            className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                          >
                            <MessageCircle className="h-6 w-6" /> Enviar Detalle por WhatsApp
                          </button>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          if (!selectedNio.driver) {
                            alert("Debe designar un chofer.");
                            return;
                          }
                          updateNIOStatus(selectedNio.id, NIOStatus.TRANSIT);
                        }}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                      >
                        Pasar a Tránsito <ArrowRight />
                      </button>
                    </div>
                  )}

                  {selectedNio.status === NIOStatus.TRANSIT && (
                    <div className="space-y-6">
                      <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 text-indigo-900">
                        <p className="font-bold flex items-center gap-2 mb-2"><CheckCircle2 className="h-5 w-5" /> Recepción en Obra</p>
                        <p className="text-sm">El jefe de obra debe validar la recepción de los materiales. Si existe una diferencia en la cantidad, regístrela a continuación.</p>
                      </div>
                      
                      <div className="space-y-1">
                         <label className="text-[10px] font-bold text-slate-500 uppercase">Cantidad Faltante (si existe)</label>
                         <input 
                            type="number"
                            placeholder="0.00"
                            className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                            id="nio-reception-diff"
                         />
                      </div>

                      <button 
                        onClick={() => {
                          const diffInput = document.getElementById('nio-reception-diff') as HTMLInputElement;
                          const diff = diffInput ? parseFloat(diffInput.value) : 0;
                          
                          if (diff > 0) {
                            alert(`Se ha registrado un faltante de ${diff} ${selectedNio.unit}. Se generará una nueva NIO de re-envío.`);
                            setNios(prev => [...prev, {
                              ...selectedNio,
                              id: `NIO-RE-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
                              quantity: diff,
                              status: NIOStatus.LOGISTICS,
                              creationDate: new Date().toISOString(),
                              toLogisticsAt: new Date().toISOString()
                            }]);
                          }
                          updateNIOStatus(selectedNio.id, NIOStatus.COMPLETED);
                          setSelectedNio(null);
                        }}
                        className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
                      >
                        Confirmar Recepción y Finalizar <CheckCircle2 />
                      </button>
                    </div>
                  )}

                  {selectedNio.status === NIOStatus.COMPLETED && (
                    <div className="text-center p-8">
                       <div className="bg-slate-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                         <CheckCircle2 className="h-10 w-10 text-slate-400" />
                       </div>
                       <h4 className="text-xl font-bold text-slate-800">NIO Completada</h4>
                       <p className="text-slate-500 max-w-xs mx-auto mt-2">Este ciclo ha finalizado correctamente el {new Date(selectedNio.completedAt!).toLocaleDateString()}.</p>
                    </div>
                  )}
                </section>

                {/* Timeline */}
                <section>
                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Trazabilidad de Tiempos</h3>
                   <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                      {[
                        { label: 'Creación NIO', date: selectedNio.creationDate, icon: Plus, color: 'slate' },
                        { label: 'Ingreso a Compras', date: selectedNio.toProcurementAt, icon: ClipboardList, color: 'amber' },
                        { label: 'Salida a Logística', date: selectedNio.toLogisticsAt, icon: Truck, color: 'emerald' },
                        { label: 'Salida a Tránsito', date: selectedNio.toTransitAt, icon: Send, color: 'indigo' },
                        { label: 'Completada', date: selectedNio.completedAt, icon: CheckCircle2, color: 'slate' },
                      ].map((step, idx) => (
                        <div key={idx} className="relative flex gap-6 items-center">
                           <div className={`absolute -left-[29px] p-1.5 rounded-full border-2 border-white shadow-sm bg-${step.color}-500 text-white`}>
                              <step.icon className="h-3 w-3" />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-slate-800">{step.label}</p>
                              <p className="text-xs text-slate-400">{step.date ? new Date(step.date).toLocaleString() : 'Pendiente'}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTraceability = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Métricas de Trazabilidad</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500 uppercase mb-4">Tiempos de Proceso Promedio</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Compras (Días)</span>
                <span className="font-bold text-slate-800">1.2</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full w-[40%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Logística (Días)</span>
                <span className="font-bold text-slate-800">0.8</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[25%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Recepción (Días)</span>
                <span className="font-bold text-slate-800">0.3</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full w-[10%]"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500 uppercase mb-4">Viajes por Chofer (Periodo)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Martín', viajes: 12 },
                { name: 'Soria', viajes: 8 },
                { name: 'Gómez', viajes: 15 },
              ]}>
                <XAxis dataKey="name" hide />
                <Tooltip />
                <Bar dataKey="viajes" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500 uppercase mb-4">Cumplimiento de Fecha Necesidad</h3>
          <div className="flex items-center justify-center h-48">
             <div className="text-center">
               <div className="text-5xl font-black text-emerald-500">92%</div>
               <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest font-bold">On Time Delivery</p>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
           <h3 className="font-bold text-slate-800">Histórico de NIOs por Obra</h3>
           <select className="text-sm border rounded-lg px-3 py-1 text-slate-600 outline-none">
             {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
           </select>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">NIO</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Insumo</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Solicitud  Compras</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Compras  Logística</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Transito  Completa</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {nios.filter(n => n.status === NIOStatus.COMPLETED).map(n => (
              <tr key={n.id}>
                <td className="px-6 py-4 font-mono text-slate-500">{n.id}</td>
                <td className="px-6 py-4 font-medium">{supplies.find(s => s.id === n.supplyId)?.detail}</td>
                <td className="px-6 py-4 text-slate-600">4hs</td>
                <td className="px-6 py-4 text-slate-600">22hs</td>
                <td className="px-6 py-4 text-slate-600">2hs</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCurrentView = () => {
    switch (activeView) {
      case 'dashboard': return renderDashboard();
      case 'projects': return renderProjects();
      case 'supplies': return renderSupplies();
      case 'stock': return renderStock();
      case 'nio': return renderNIOBoard();
      case 'traceability': return renderTraceability();
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

      {/* MODAL: Nueva Obra */}
      <Modal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} title="Nueva Obra">
        <form className="space-y-4" onSubmit={handleCreateProject}>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-xs font-bold text-slate-500 uppercase">Nombre de la Obra</label>
               <input name="name" required type="text" className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: Edificio Prisma" />
             </div>
             <div className="space-y-1">
               <label className="text-xs font-bold text-slate-500 uppercase">Domicilio</label>
               <input name="address" required type="text" className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Calle 123..." />
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-xs font-bold text-slate-500 uppercase">Jefe de Obra</label>
               <input name="projectManager" required type="text" className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
             </div>
             <div className="space-y-1">
               <label className="text-xs font-bold text-slate-500 uppercase">Gerente de Obra</label>
               <input name="generalManager" required type="text" className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
             </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
             <div className="space-y-1">
               <label className="text-xs font-bold text-slate-500 uppercase">Fecha Inicio</label>
               <input name="startDate" required type="date" className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
             </div>
             <div className="space-y-1">
               <label className="text-xs font-bold text-slate-500 uppercase">Plazo (Días)</label>
               <input name="durationDays" required type="number" className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
             </div>
             <div className="space-y-1">
               <label className="text-xs font-bold text-slate-500 uppercase">Cliente</label>
               <input name="client" required type="text" className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
             </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Inspector</label>
            <input name="inspector" required type="text" className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nombre del Inspector" />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-4 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors">
            Guardar Obra
          </button>
        </form>
      </Modal>

      {/* MODAL: Iniciar NIO */}
      <Modal isOpen={isNIOModalOpen} onClose={() => setIsNIOModalOpen(false)} title="Iniciar Necesidad Interna de Obra (NIO)">
        <form className="space-y-6" onSubmit={handleCreateNIO}>
          <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha de Creación</p>
               <p className="font-bold text-slate-700">{new Date().toLocaleDateString()}</p>
             </div>
             <div className="flex flex-col items-end gap-1">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha necesidad en obra</p>
               <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                 <Calendar className="h-4 w-4 text-blue-600" />
                 <input name="needDate" type="date" required className="outline-none text-sm font-bold text-slate-800" />
               </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Obra Destino</label>
              <select 
                name="projectId" 
                required 
                value={nioFormProjectId}
                onChange={(e) => setNioFormProjectId(e.target.value)}
                className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Seleccionar Obra...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Cuenta de Imputación</label>
              <select name="accountId" required className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-50" disabled={!nioFormProjectId}>
                <option value="">Seleccionar Cuenta...</option>
                {nioFormProject?.accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Insumo o Servicio</label>
            <div className="flex gap-2">
              <select 
                name="supplyId" 
                className="flex-1 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                onChange={(e) => {
                  const supply = supplies.find(s => s.id === e.target.value);
                  if (supply) {
                    const unitInput = document.getElementById('nio-unit-input') as HTMLInputElement;
                    if (unitInput) unitInput.value = supply.unit;
                  }
                }}
              >
                <option value="">Insumos sugeridos...</option>
                {supplies.map(s => <option key={s.id} value={s.id}>{s.detail} ({s.code})</option>)}
              </select>
              <span className="flex items-center text-slate-300">o</span>
              <input 
                name="manualSupply" 
                placeholder="Carga manual de insumo..." 
                className="flex-[1.5] p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 italic">* Si no existe en la base, la carga manual lo agregará automáticamente.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-xs font-bold text-slate-500 uppercase">Unidad</label>
               <input 
                id="nio-unit-input"
                name="unit" 
                required 
                placeholder="kg, bolsa, lts, Global..." 
                className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
               />
             </div>
             <div className="space-y-1">
               <label className="text-xs font-bold text-slate-500 uppercase">Cantidad</label>
               <input name="quantity" type="number" step="0.01" required placeholder="0.00" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
             </div>
          </div>

          <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
            <Send className="h-6 w-6" /> Enviar a Compras
          </button>
        </form>
      </Modal>

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
