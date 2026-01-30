import React, {useState,useEffect,useRef} from "react";

import { Role, User,Supply } from "@/src/backend/types";
import { apiClient } from './../../api';
import { Plus, Edit, Trash2,Loader2,BrainCircuit,Search } from "lucide-react";
import ConfirmDeleteModal from "@/src/components/Styles/DeleteModal";
import * as XLSX from 'xlsx';
import { extractBudgetData, extractSupplyData, FileData } from '@/src/services/geminiService';
import InsumoFormModal from "./InsumoFormModal";

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

    const [editingSupply, setEditingSupply] = useState<Supply | null>(null);

    const [isAIProcessing, setIsAIProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentUploadType, setCurrentUploadType] = useState<{type: 'budget' | 'supplies', id?: string} | null>(null);
      const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUploadType) return;

    setIsAIProcessing(true);
    try {
      const fileData = await fileToBase64(file);
      
        const data = await extractSupplyData(fileData);
        setSupplies(prev => [...prev, ...data.map((d: any, i: number) => ({
          id:1,
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
    const handleCreateSupply = () => {        
    alert("en desarrollo")
  };

    const handleUpdateSupply = () => {        
    alert("en desarrollo")
  };
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
                        <button onClick={()=>setIsOpenInsumoFormModel(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
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
                        </div>                      {/* Global Overlay for AI Processing */}
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
 </>
  );
}
