import React, {useState,useEffect,useRef} from "react";

import ProjectFormModal from "./ObraFormModal";
import CostFormModal from "./CostFormModal"
import { Role, Project,User,CostAccount} from "@/src/backend/types";
import { apiClient } from './../../api';
import { Plus, Pencil,X, Trash2,Loader2,BrainCircuit, Save,Edit3, Clock } from "lucide-react";
import ConfirmDeleteModal from "@/src/components/Styles/DeleteModal";
import { extractBudgetData, extractSupplyData, FileData } from '@/src/services/geminiService';
import * as XLSX from 'xlsx';
import { useAuth } from './../Login/ProtectedRoute';

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

export default function ObraComponent() {
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [isProjectDeleteModalOpen, setIsProjectDeleteModalOpen] = useState(false);
    const [isCostAccountModalOpen, setIsCostAccountModalOpen] = useState(false);
    const [isCostAccountDeleteModalOpen, setIsCostAccountDeleteModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [editingCostAccount, setEditingCostAccount] = useState<Project | null>(null);
   const { user } = useAuth();

    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject,setSelectedProject ] = useState<Project | null>(null);
    const [selectedCostAccount,setSelectedCostAccount ] = useState<CostAccount | null>(null);
    const [isAIProcessing, setIsAIProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentUploadType, setCurrentUploadType] = useState<{type: 'budget' | 'supplies', id?: string} | null>(null);
    
    const [users, setUsers] = useState<User[]>([]);
    const [loading,setLoading]= useState<Boolean>(false);

    const handleSelectedProject= async (project: Project) => {
    
    try {
      const response = await apiClient.costAccounts.list(project.id);
      project.accounts=response
      console.log(response)
      setSelectedProject(project)
    } catch (err: any) {
      alert(err.message || 'Error al traer cuentas');
    }
  };
  const handleInsertMany = async () => {
    try {
      const dataArray = Array.isArray(selectedProject.accounts) ? selectedProject.accounts : [];
      const payload= dataArray.filter(el=>el.isCreatedYet===false)
      if(payload.length<1){
        return alert("No hay data")
      }
      setLoading(true)
      const response = await apiClient.costAccounts.create(payload);
      console.log(response)
        const newAccounts = selectedProject.accounts.map(obj => ({
        ...obj,
        isCreatedYet: true
        }));
     setSelectedProject((prevState => ({...prevState, accounts:newAccounts})));
        setLoading(false)
    } catch (err: any) {
        setLoading(false)
      console.log(err.message || 'Error al crear usuario');
    }
  };
  const handleCreateProject = async (project: Project) => {
    try {
      const response = await apiClient.projects.create(project);
      let newIdProject={...project,id:response.id}
      setProjects(prev => [...prev, newIdProject]);
      setIsProjectModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error al crear usuario');
    }
  };
  const handleCreateCostAccount = async (project: CostAccount) => {

    project.projectId=selectedProject.id
    project.spent=0
    //toda la logica
    try {
      const response = await apiClient.costAccounts.create([project]);
      let newIdProject={...project,id:response[0].id}

        setProjects(prevProjects => 
                        prevProjects.map(project => {
                            // Si no es el proyecto que buscamos, lo devolvemos tal cual
                            if (project.id !== selectedProject.id) {
                                return project;
                            }

                            // Si es el proyecto, creamos una copia y filtramos sus cuentas
                            return {
                                ...project,
                                accounts:  [...project.accounts,newIdProject]
                               
                            };
                        })
                    );      
      setSelectedProject((prevState => ({...prevState, accounts:[...prevState.accounts,newIdProject]})));

      setIsCostAccountModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error al crear usuario');
    }
  };
    const handleUpdateProject = async (project: Project) => {
        const updated = await apiClient.projects.update(project);

        setProjects(prev =>
        prev.map(p => (p.id === updated.id ? project : p))
        );

        setEditingProject(null);
        setIsProjectModalOpen(false);
    };
    const handleUpdateCostAccount = async (costAccount: CostAccount) => {
        //falta todo
        const updated = await apiClient.costAccounts.update(costAccount);
        setProjects(prevProjects => 
                        prevProjects.map(project => {
                            // Si no es el proyecto que buscamos, lo devolvemos tal cual
                            if (project.id !== selectedProject.id) {
                                return project;
                            }

                            // Si es el proyecto, creamos una copia y filtramos sus cuentas
                            return {
                                ...project,
                                accounts: project.accounts?.map(p => (p.id === costAccount.id ? updated : p))
                            };
                        })
                    );
        setSelectedProject((prevState => ({...prevState, accounts:prevState.accounts?.map(p => (p.id === costAccount.id ? updated : p))})));
        setEditingCostAccount(null);
        setIsCostAccountModalOpen(false);
    };
    const handleDeleteProject = async (id: string) => {
        setLoading(true)
        const deleteResponse = await apiClient.projects.delete(id);
        if(deleteResponse.message){
            setProjects(prev =>
            prev.filter(p => (p.id !== id))
        );
        }else{
        alert("Error "+ deleteResponse)
        }
        setLoading(false)
        setIsProjectDeleteModalOpen(false)
        setIsProjectModalOpen(false);
        setSelectedProject(null)
    };
    const handleDeleteCostAccount = async (id: string) => {
        setLoading(true)
        const deleteResponse = await apiClient.costAccounts.delete(id);
        if(deleteResponse.message){
            setProjects(prevProjects => 
                        prevProjects.map(project => {
                            // Si no es el proyecto que buscamos, lo devolvemos tal cual
                            if (project.id !== selectedProject.id) {
                                return project;
                            }

                            // Si es el proyecto, creamos una copia y filtramos sus cuentas
                            return {
                                ...project,
                                accounts: project.accounts?.filter(account => account.id !== id)
                            };
                        })
                    );
            setSelectedProject((prevState => ({...prevState, accounts:prevState.accounts?.filter(account => account.id !== id)})));
        }
        else{
                alert("Error "+ deleteResponse)
        }
        setLoading(false)
        setIsCostAccountDeleteModalOpen(false)
        setSelectedCostAccount(null)
    };
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
      console.log(currentUploadType)
      if (currentUploadType.type === 'budget' && currentUploadType.id) {
        const data = await extractBudgetData(aiInput);
        let newAccounts: CostAccount[] = data.map((d: any, i: number) => ({
          id: `ai-${Date.now()}-${i}`,
          projectId:selectedProject.id,
          accountNumber: d.accountNumber || '',
          name: d.name,
          detail: d.detail || '',
          budgeted: d.cost,
          spent: 0,
          incidence: d.incidence,
          isCreatedYet:false
        }));
        if(selectedProject){
            if(selectedProject.accounts && selectedProject.accounts.length>0){
                selectedProject.accounts.forEach((el:CostAccount)=>newAccounts.push(el))
            }
        }

        setSelectedProject((prevState => ({...prevState, accounts:newAccounts})));
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
  // Initialize and load from "Postgres"
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projData,users] = await Promise.all([
          apiClient.projects.list(),
          apiClient.users.list()
        ]);

        if (projData) {
        // 2. Mapeamos los proyectos para crear un array de promesas
        const projectsWithAccounts = await Promise.all(
          projData.map(async (project) => {
            try {
              // Esperamos la respuesta de las cuentas para este proyecto
              const accounts = await apiClient.costAccounts.list(project.id);
              // Retornamos el proyecto extendido
              return { ...project, accounts };
            } catch (err) {
              console.error(`Error cargando cuentas para proyecto ${project.id}:`, err);
              return { ...project, accounts: [] }; // Fallback en caso de error individual
            }
          })
        );

        setProjects(projectsWithAccounts);
      }
        setUsers(users)
      } catch (error) {
        console.error("DB Connection Error:", error);
      }
    };
    fetchData();
  }, []);
  return (    
    
    <div >
                  <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".pdf,.xlsx,.xls,image/*"
                        onChange={handleFileChange}
                    />

              {/* MODAL: Nueva Obra */}
                <ProjectFormModal
                users={users}
                isOpen={isProjectModalOpen}
                onClose={() => {
                    setIsProjectModalOpen(false);
                    setEditingProject(null);
                }}
                mode={editingProject ? "edit" : "create"}
                initialData={editingProject ?? undefined}
                onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
                />
                <ConfirmDeleteModal
                isOpen={isCostAccountDeleteModalOpen}
                onClose={() => {
                    setSelectedCostAccount(null)
                    setIsCostAccountDeleteModalOpen(false);
                }}
                onConfirm={() => {
                    handleDeleteCostAccount(selectedCostAccount?.id??"")
                }}
                itemName={" la cuenta costo "+selectedCostAccount?.name}
                loading={loading}
                ></ConfirmDeleteModal>    
                <ConfirmDeleteModal
                isOpen={isProjectDeleteModalOpen}
                onClose={() => {
                    setSelectedProject(null)
                    setIsProjectDeleteModalOpen(false);
                }}
                onConfirm={() => {
                    handleDeleteProject(selectedProject?.id??"")
                }}
                itemName={" la obra "+selectedProject?.name}
                loading={loading}
                ></ConfirmDeleteModal>
                <CostFormModal
                        isOpen={isCostAccountModalOpen}
                        onClose={() => {
                            setIsCostAccountModalOpen(false);
                            setEditingCostAccount(null);
                        }}
                        mode={editingCostAccount ? "edit" : "create"}
                        initialData={editingCostAccount ?? undefined}
                        onSubmit={editingCostAccount ? handleUpdateCostAccount : handleCreateCostAccount}                
                ></CostFormModal>
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
                    <div className="flex pb-6 justify-between items-center">
                        <h2 className="text-2xl font-bold text-slate-800">Gestión de Obras</h2>
                       {user.role_id==1||user.role_id==4?   

                        <button 
                        onClick={() => setIsProjectModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-200 transition-all"
                        >

                        <Plus className="h-5 w-5" /> Nueva Obra
                        </button>:null}
                    </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => {
                            // Calculamos los totales una sola vez por proyecto para mayor claridad
                            const totalSpent = project.accounts?.reduce((sum, a) => sum + Math.max(0, a.spent), 0) ?? 0;
                            const totalBudget = project.accounts?.reduce((sum, a) => sum + (a.budgeted || 0), 0) ?? 0;
                            
                            // Calculamos el porcentaje. Si el presupuesto es 0, evitamos división por cero.
                            const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
                            
                            // Color de la barra: azul normal, rojo si se excedió
                            const progressColor = percentage > 100 ? "bg-red-500" : "bg-blue-600";

                            return (
                            <div
                                key={project.id}
                                onClick={() => handleSelectedProject(project)}
                                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{project.name}</h3>
                                    <p className="text-sm text-slate-500">{project.address}</p>
                                </div>
                                
                                {/* Botones de acción (Edit/Delete) - Mantengo tu lógica de roles */}
                                {(user.role_id === 1 || user.role_id === 4) && (
                                    <div className="flex gap-2">
                                    {/* ... Tus botones de Pencil y Trash ... */}
                                    </div>
                                )}
                                </div>

                                <div className="space-y-4">
                                {/* Sección de Consumo y Porcentaje */}
                                <div className="flex justify-between items-end text-sm">
                                    <div className="flex flex-col">
                                    <span className="text-slate-500">Consumido</span>
                                    <span className="font-bold text-slate-800 text-lg">
                                        ${totalSpent.toLocaleString()}
                                    </span>
                                    </div>
                                    <div className="text-right">
                                    <span className={`font-bold ${percentage > 100 ? 'text-red-600' : 'text-blue-600'}`}>
                                        {percentage.toFixed(1)}%
                                    </span>
                                    </div>
                                </div>

                                {/* Barra de Progreso */}
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div
                                    className={`${progressColor} h-full rounded-full transition-all duration-500`}
                                    style={{ width: `${Math.min(100, percentage)}%` }}
                                    ></div>
                                </div>

                                {/* Presupuesto Total */}
                                <div className="flex justify-between text-sm pt-2 border-t border-slate-50">
                                    <span className="text-slate-500">Presupuesto Total</span>
                                    <span className="text-slate-800 font-medium">
                                    ${totalBudget.toLocaleString()}
                                    </span>
                                </div>
                                </div>
                            </div>
                            );
                        })}
                        </div>

                    {selectedProject && !isProjectDeleteModalOpen && (
                        <div className="fixed inset-0 z-40 bg-white overflow-y-auto animate-in slide-in-from-right duration-300">
                            <div className="max-w-7xl mx-auto p-6">
                                <div className="flex flex-col mb-8 border-b pb-6 gap-6">
                                    {/* Título y acciones superiores */}
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-3xl font-extrabold text-slate-900">
                                                {selectedProject.name}
                                            </h2>
                                            <p className="text-slate-500">
                                                {selectedProject.address} | Inicio: {selectedProject.startDate}
                                            </p>
                                        </div>

                                        <div className="flex gap-3">
                                            {user.role_id==1||user.role_id==4?
                                            <button 
                                                onClick={() => triggerAIUpload('budget', selectedProject.id)}
                                                disabled={isAIProcessing}
                                                className="bg-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-purple-700 transition-colors shadow-lg shadow-purple-100"
                                            >
                                                {isAIProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <BrainCircuit className="h-5 w-5" />}
                                                {isAIProcessing ? 'Procesando...' : 'Carga IA (PDF/Excel)'}
                                            </button>
                                            :null}
                                            
                                            <button
                                                onClick={() => setSelectedProject(null)}
                                                className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200"
                                            >
                                                <X />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Información de la obra (Jefes, Plazos, etc.) */}
                                    {/* Información de la obra */}

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-2">

                                    <div>

                                    <p className="text-xs font-bold text-slate-500 uppercase">

                                        Jefe de Obra

                                    </p>

                                    <p className="text-sm font-semibold text-slate-800">

                                            {(() => {

                                            const manager = users.find(u => Number(u.id) === Number(selectedProject.projectManager));

                                            return manager

                                                ? `${manager.name} ${manager.lastName || ""}`.trim()

                                                : "No asignado";

                                            })()}

                                        </p>

                                    </div>



                                    <div>

                                    <p className="text-xs font-bold text-slate-500 uppercase">

                                        Gerente de Obra

                                    </p>

                                    <p className="text-sm font-semibold text-slate-800">

                                            {(() => {

                                            const manager = users.find(u => Number(u.id) === Number(selectedProject.generalManager));

                                            return manager

                                                ? `${manager.name} ${manager.lastName || ""}`.trim()

                                                : "No asignado";

                                            })()}

                                    </p>

                                    </div>



                                    <div>

                                    <p className="text-xs font-bold text-slate-500 uppercase">

                                        Plazo

                                    </p>

                                    <p className="text-sm font-semibold text-slate-800">

                                        {selectedProject.durationDays} días

                                    </p>

                                    </div>



                                    <div>

                                    <p className="text-xs font-bold text-slate-500 uppercase">

                                        Cliente

                                    </p>

                                    <p className="text-sm font-semibold text-slate-800">

                                        {selectedProject.client}

                                    </p>

                                    </div>



                                    <div>

                                    <p className="text-xs font-bold text-slate-500 uppercase">

                                        Inspector

                                    </p>

                                    <p className="text-sm font-semibold text-slate-800">

                                        {selectedProject.inspector}

                                    </p>

                                    </div>

                                </div>

                                </div>





                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                    <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-100">
                                        <p className="text-blue-100 text-sm font-medium">Presupuesto Total</p>
                                        <p className="text-2xl font-bold">${selectedProject.accounts?.reduce((s, a) => s + a.budgeted, 0).toLocaleString() ?? "0"}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <p className="text-slate-500 text-sm">Consumido</p>
                                        <p className="text-2xl font-bold text-red-500">${selectedProject.accounts?.reduce((s, a) => s + Math.max(0, a.spent), 0).toLocaleString() ?? "0"}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <p className="text-slate-500 text-sm">Saldo Restante</p>
                                        <p className="text-2xl font-bold text-emerald-500">
                                            ${((selectedProject.accounts?.reduce((s, a) => s + a.budgeted, 0)??0) - (selectedProject.accounts?.reduce((s, a) => s + Math.max(0, a.spent), 0)??0)).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-slate-800 p-6 rounded-2xl text-white shadow-lg shadow-slate-200">
                                        <p className="text-slate-300 text-sm">Ingresos por Stock</p>
                                        <p className="text-2xl font-bold">${selectedProject.stockBalance?.toLocaleString()??0}</p>
                                    </div>
                                </div>

                                    {/* Tabla de Cuentas */}
                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-8 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left min-w-[800px]">
                                                <thead className="bg-slate-50 border-b">
                                                    <tr>
                                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Cuenta</th>
                                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Detalle</th>
                                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Presupuesto</th>
                                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Gastado</th>
                                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Saldo</th>
                                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">% Incidencia</th>
                                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {(() => {
                                                        const totalBudget = selectedProject.accounts?.reduce((sum, acc) => sum + acc.budgeted, 0) ?? 0;
                                                        return selectedProject.accounts?.map(acc => {
                                                            const incidence = (totalBudget > 0 ? (acc.budgeted / totalBudget) * 100 : 0);
                                                            const isCreated = acc.isCreatedYet !== false;

                                                            return (
                                                                <tr key={acc.id} className="hover:bg-slate-50 transition-colors">
                                                                    <td className="px-6 py-4 font-medium text-slate-800">{acc.name}</td>
                                                                    <td className="px-6 py-4 text-slate-600 text-sm">{acc.detail}</td>
                                                                    <td className="px-6 py-4 text-slate-800">${acc.budgeted.toLocaleString()}</td>
                                                                    <td className="px-6 py-4 text-red-600 font-medium">${acc.spent.toLocaleString()}</td>
                                                                            <td className={`px-6 py-4 font-bold ${
                                                                            (acc.budgeted - acc.spent) < 0 
                                                                                ? 'text-orange-600' 
                                                                                : 'text-emerald-600'
                                                                            }`}>
                                                                            ${(acc.budgeted - acc.spent).toLocaleString()}
                                                                            </td> 
                                                                            <td className="px-6 py-4 text-right">
                                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${acc.incidence !== undefined ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                                                                            {incidence.toFixed(2)}%
                                                                            {acc.incidence !== undefined && <BrainCircuit className="inline-block h-3 w-3 ml-1" title="Analizado por IA" />}
                                                                        </span>
                                                                    </td>
                                                                     {user.role_id==1||user.role_id==4?
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex justify-center items-center gap-2">
                                                                            {isCreated ? (
                                                                                <>
                                                                                    <button onClick={() => { setEditingCostAccount(acc); setIsCostAccountModalOpen(true) }} title="Editar cuenta" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                                                        <Edit3 className="h-4 w-4" />
                                                                                    </button>
                                                                                    <button onClick={() => { setSelectedCostAccount(acc); setIsCostAccountDeleteModalOpen(true) }} title="Eliminar cuenta" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                                                        <Trash2 className="h-4 w-4" />
                                                                                    </button>
                                                                                </>
                                                                            ) : (
                                                                                <div title="Sincronizando..." className="p-1.5 text-amber-500 animate-pulse">
                                                                                    <Clock className="h-5 w-5" />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </td>:null}
                                                                </tr>
                                                            );
                                                        });
                                                    })()}
                                                </tbody>
                                            </table>
                                        </div>
                                        {/* Indicador visual opcional para móvil */}
                                        <div className="md:hidden bg-slate-50 text-[10px] text-slate-400 text-center py-1 border-t">
                                            ← Desliza lateralmente para ver más →
                                        </div>
                                    </div>
                                {user.role_id==1||user.role_id==4?
                                <div className="flex gap-3 justify-end pb-12">
                                    <button 
                                        onClick={() => {setIsCostAccountModalOpen(true)}}
                                        className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 text-sm font-semibold"
                                    >
                                        <Plus className="h-4 w-4" /> Nueva Cuenta
                                    </button>
                                    {loading?                                    <button 
                                        className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl flex items-center gap-2"
                                        
                                    >
                                        <Save className="h-5 w-5" />
                                        Cargando...
                                    </button>:
                                    <button 
                                        className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl flex items-center gap-2"
                                        onClick={() => {handleInsertMany()}}
                                    >
                                        <Save className="h-5 w-5" />
                                        Guardar Cambios del Proyecto
                                    </button>
                                        }
                                </div>:null}
                            </div>
                        </div>
                    )}
                    </div>
  );
}
