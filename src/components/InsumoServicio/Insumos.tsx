import React, {useState,useEffect,useRef} from "react";

import { Role, User,Supply } from "@/src/backend/types";
import { apiClient } from './../../api';
import { Plus,Save,Edit, Trash2,Loader2,BrainCircuit,Search,Edit3,Clock,Users } from "lucide-react";
import ConfirmDeleteModal from "@/src/components/Styles/DeleteModal";
import * as XLSX from 'xlsx';
import { extractBudgetData, extractSupplyData, FileData } from '@/src/services/geminiService';
import InsumoFormModal from "./InsumoFormModal";
import DriverComponent from "./Choferes"
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

export default function SupliesComponent() {
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [isOpenInsumoFormModel, setIsOpenInsumoFormModel] = useState(false);
    const [isOpenInsumoDeleteModel, setIsOpenInsumoDeleteModel] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState(""); 
    const [editingSupply, setEditingSupply] = useState<Supply | null>(null);
    const [isChofer, setIsChofer] = useState(false);
   const { user } = useAuth();

    const [isAIProcessing, setIsAIProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentUploadType, setCurrentUploadType] = useState<{type: 'budget' | 'supplies', id?: string} | null>(null);
        const formatCurrency = (value) => {
      // 1. Convertimos a número por si acaso es un string
      const number = parseFloat(value);

      // 2. Validamos que sea un número válido
      if (isNaN(number)) return "-";

      // 3. Aplicamos el formato
      return number.toLocaleString('es-AR', { // 'es-AR' o 'de-DE' usan punto para miles
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };
    const filteredSupplies = supplies.filter((supply) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        supply.code?.toLowerCase().includes(searchLower) ||
        supply.detail?.toLowerCase().includes(searchLower)
      );});
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUploadType) return;

    setIsAIProcessing(true);
    try {
      const fileData = await fileToBase64(file);
      
        const data = await extractSupplyData(fileData);
        setSupplies(prev => [...prev, ...data.map((d: any, i: number) => ({
          id:i,
          isCreatedYet:false,
          ...d
        }))]);
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
    const handleCreateSupply = async(supply: Supply) => {        
       try {
         setLoading(true)
         const response = await apiClient.supplies.create([supply]);
         let newIdSupply={...supply,id:response[0].id,bestPrice:null}
         setSupplies((prevState)=>[...prevState,newIdSupply]);  
         setIsOpenInsumoFormModel(false)    
         setLoading(false)

       } catch (err: any) {
         alert(err.message || 'Error al crear usuario');
          setLoading(false)

       }
     };
    const handleDeleteSupply = async (id:number) => {
        setLoading(true)
        const deleteResponse = await apiClient.supplies.delete(id);
        if(deleteResponse.message){
            setSupplies(prev =>
            prev.filter(p => (p.id !== id))
        );
        }else{
        alert("Error "+ deleteResponse)
        }
        setLoading(false)
        setIsOpenInsumoDeleteModel(false)
        setEditingSupply(null)
    };

    const handleUpdateSupply = async (supply: Supply) => {
        const updated = await apiClient.supplies.update(supply);

        setSupplies(prev =>
        prev.map(p => (p.id === updated.id ? supply : p))
        );

        setEditingSupply(null);
        setIsOpenInsumoFormModel(false);
    };
    const handleInsertMany = async () => {
      try {
        const dataArray = Array.isArray(supplies) ? supplies : [];
        const payload= dataArray.filter(el=>el.isCreatedYet===false)
        if(payload.length<1){
          return alert("No hay data")
        }
        setLoading(true)
        const response = await apiClient.supplies.create(payload);
        console.log(response)
        console.log(payload)
          const newSuplies = supplies.map(obj => ({
          ...obj,
          isCreatedYet: true
          }));
      setSupplies(newSuplies);
          setLoading(false)
      } catch (err: any) {
          setLoading(false)
        console.log(err.message || 'Error al crear usuario');
      }
    };
    useEffect(() => {
    const fetchData = async () => {
      try {
        const [supplies] = await Promise.all([
          apiClient.supplies.list(),
        ]);
        setSupplies(supplies);
      } catch (error) {
        console.error("DB Connection Error:", error);
      }
    };
    fetchData();
  }, []);
  return (
    <>
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".pdf,.xlsx,.xls,image/*"
                        onChange={handleFileChange}
                    />
                    <InsumoFormModal
                        isOpen={isOpenInsumoFormModel}
                        onClose={() => {
                            setIsOpenInsumoFormModel(false);
                            setEditingSupply(null);
                        }}
                        mode={editingSupply ? "edit" : "create"}
                        initialData={editingSupply ?? undefined}
                        onSubmit={editingSupply ? handleUpdateSupply : handleCreateSupply}
                        />
                    <div className="space-y-6">
                        {!isChofer?
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            {/* Título de la izquierda */}
                            <h2 className="text-2xl font-bold text-slate-800">Insumos y servicios</h2>

                            {/* Botón Central (Verde) */}
                              <div className="w-full md:w-auto flex justify-center flex-1">
                                <button 
                                    onClick={() => {setIsChofer(true)}} 
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
                                >
                                    <Users className="h-5 w-5" />
                                    {/* Texto dinámico según el tamaño de pantalla */}
                                    <span className="hidden md:inline">Cambiar a choferes</span>
                                    <span className="inline md:hidden">Choferes</span>
                                </button>
                            </div>
                            

                            {/* Botones de la derecha */}
                       <div className="flex gap-2 w-full md:w-auto justify-end">
                              
                                <button 
                                    onClick={() => triggerAIUpload('supplies')}
                                    disabled={isAIProcessing}
                                    className="bg-purple-50 text-purple-700 px-4 py-2 rounded-xl flex items-center gap-2 border border-purple-200 flex-1 md:flex-none justify-center"
                                >
                                    {isAIProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <BrainCircuit className="h-5 w-5" />}
                                    <span className="text-sm md:text-base">Importar IA</span>
                                </button>
                                
                                <button 
                                    onClick={() => setIsOpenInsumoFormModel(true)} 
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 flex-1 md:flex-none justify-center"
                                >
                                    <Plus className="h-5 w-5" /> 
                                    <span className="text-sm md:text-base">Nuevo Insumo</span>
                                </button>
                            </div>                          
                        </div>
                        :null}
                        {!isChofer?
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-4 bg-slate-50 border-b flex gap-4">
                            <div className="relative flex-1">
                              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                              <input 
                                type="text" 
                                placeholder="Buscar por código o detalle..." 
                                className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
                                // 3. Vincular estados
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                            </div>
                            </div>
                   <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-8 overflow-hidden">
                        <div className="overflow-x-auto">

                            <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Código</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Detalle</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Unidad</th>
                               {user.role_id==1||user.role_id==4||user.role_id==5||user.role_id==6?   
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Mejor Precio</th>:null}
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Mejor Proveedor</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredSupplies.map(supply =>  {
                                     const isCreated = supply.isCreatedYet !== false;
                                  return(
                                <tr key={supply.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-mono text-sm text-slate-600">{supply.code}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800">{supply.detail}</td>
                                    <td className="px-6 py-4 text-slate-500">{supply.unit}</td>
                                    <td className="px-6 py-4 text-emerald-600 font-bold">${formatCurrency(supply.bestPrice)}</td>
                                    <td className="px-6 py-4 text-slate-800">{supply.bestSupplier || '-'}</td>
                                   <td className="px-6 py-4">
                                    <div className="flex justify-center items-center gap-2">
                                        {isCreated ? (
                                            <>
                                                <button onClick={() => { setEditingSupply(supply); setIsOpenInsumoFormModel(true) }} title="Editar" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Edit3 className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => { setEditingSupply(supply); setIsOpenInsumoDeleteModel(true) }} title="Eliminar" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <div title="Sincronizando..." className="p-1.5 text-amber-500 animate-pulse">
                                                <Clock className="h-5 w-5" />
                                            </div>
                                        )}
                                    </div>
                                </td>
                                </tr>
                                )})}
                            </tbody>
                            </table>
                          </div>

                          {/* Indicador visual opcional para móvil */}
                          <div className="md:hidden bg-slate-50 text-[10px] text-slate-400 text-center py-1 border-t">
                              ← Desliza lateralmente para ver más →
                          </div>
                      </div>
                        </div>:
                        <DriverComponent setIsChofer={setIsChofer}></DriverComponent>
                          }
                        </div> 
                                                        <div className="flex gap-3 justify-end pb-12">
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
                                        Guardar Cambios 
                                    </button>
                                        }
                                </div>
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

                       <ConfirmDeleteModal
                          isOpen={isOpenInsumoDeleteModel}
                          onClose={() => {
                              setEditingSupply(null)
                              setIsOpenInsumoDeleteModel(false);
                          }}
                          onConfirm={() => {
                              handleDeleteSupply(editingSupply?.id??1)
                          }}
                          itemName={" el insumo o servicio "+editingSupply?.detail}
                          loading={loading}
                          ></ConfirmDeleteModal>
 </>
  );
}
