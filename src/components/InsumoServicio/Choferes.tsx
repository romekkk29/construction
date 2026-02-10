import React, {useState,useEffect,useRef} from "react";

import { Role, User,Supply, Driver } from "@/src/backend/types";
import { apiClient } from './../../api';
import { Plus, Edit, Trash2,Loader2,BrainCircuit,Search,Edit3,Clock,Users } from "lucide-react";
import ConfirmDeleteModal from "@/src/components/Styles/DeleteModal";
import * as XLSX from 'xlsx';
import { extractBudgetData, extractSupplyData, FileData } from '@/src/services/geminiService';
import DriverFormModal from "./ChoferFormModal";


export default function DriverComponent({setIsChofer}) {
    const [driver, setDrivers] = useState<Driver[]>([]);
    const [isOpenDriverFormModel, setIsOpenDriverFormModel] = useState(false);
    const [isOpenDriverDeleteModel, setIsOpenDriverDeleteModel] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingDriver, setEditingDriver] = useState<Driver | null>(null);




    const handleCreateDriver = async(driver: Driver) => {        
       try {
         setLoading(true)
         const response = await apiClient.drivers.create(driver);
         let newIdDriver={...driver,id:response.id}
         setDrivers((prevState)=>[...prevState,newIdDriver]);  
         setIsOpenDriverFormModel(false)    
         setLoading(false)

       } catch (err: any) {
         alert(err.message || 'Error al crear chofer');
          setLoading(false)

       }
     };
    const handleDeleteDriver = async (id:number) => {
        setLoading(true)
        const deleteResponse = await apiClient.drivers.delete(id);
        if(deleteResponse.message){
            setDrivers(prev =>
            prev.filter(p => (p.id !== id))
        );
        }else{
        alert("Error "+ deleteResponse)
        }
        setLoading(false)
        setIsOpenDriverDeleteModel(false)
        setEditingDriver(null)
    };

    const handleUpdateDriver = async (driver: Driver) => {
        const updated = await apiClient.drivers.update(driver);

        setDrivers(prev =>
        prev.map(p => (p.id === updated.id ? driver : p))
        );

        setEditingDriver(null);
        setIsOpenDriverFormModel(false);
    };
    useEffect(() => {
    const fetchData = async () => {
      try {
        const [driver] = await Promise.all([
          apiClient.drivers.list(),
        ]);
        setDrivers(driver);
      } catch (error) {
        console.error("DB Connection Error:", error);
      }
    };
    fetchData();
  }, []);
  return (
        <>

                        <DriverFormModal
                            isOpen={isOpenDriverFormModel}
                            onClose={() => {
                                setIsOpenDriverFormModel(false);
                                setEditingDriver(null);
                            }}
                            mode={editingDriver ? "edit" : "create"}
                            initialData={editingDriver ?? undefined}
                            onSubmit={editingDriver? handleUpdateDriver : handleCreateDriver}
                            />
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                {/* Título de la izquierda */}
                                <h2 className="text-2xl font-bold text-slate-800">Choferes</h2>

                                {/* Botón Central (Verde) */}

                                <div className="w-full md:w-auto flex justify-center flex-1">
                                    <button 
                                        onClick={() => {setIsChofer(false)}} 
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
                                    >
                                        <Users className="h-5 w-5" />
                                        {/* Texto dinámico según el tamaño de pantalla */}
                                        <span className="hidden md:inline">Cambiar a Insumos y Servicios</span>
                                        <span className="inline md:hidden">Insumos</span>
                                    </button>
                                </div>                            

                                {/* Botones de la derecha */}

                                <div className="flex gap-2 w-full md:w-auto justify-end">
                                    <button 
                                        onClick={() => setIsOpenDriverFormModel(true)} 
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 flex-1 md:flex-none justify-center"
                                    >
                                        <Plus className="h-5 w-5" /> 
                                        <span className="text-sm md:text-base">Nuevo Chofer</span>
                                    </button>
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-8 overflow-hidden">
                            <div className="overflow-x-auto">

                                <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Nombre</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Vehiculo</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Telefono</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {driver?.map(driver =>  {
                                    return(
                                    <tr key={driver.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-mono text-sm text-slate-600">{driver.name}</td>
                                        <td className="px-6 py-4 font-medium text-slate-800">{driver.vehicle}</td>
                                        <td className="px-6 py-4 text-slate-500">{driver.phone}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center items-center gap-2">
                                                <>
                                                    <button onClick={() => { setEditingDriver(driver); setIsOpenDriverFormModel(true) }} title="Editar" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                        <Edit3 className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => { setEditingDriver(driver); setIsOpenDriverDeleteModel(true) }} title="Eliminar" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </>
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
                            </div>
                            </div>                    


                        <ConfirmDeleteModal
                            isOpen={isOpenDriverDeleteModel}
                            onClose={() => {
                                setEditingDriver(null)
                                setIsOpenDriverDeleteModel(false);
                            }}
                            onConfirm={() => {
                                handleDeleteDriver(editingDriver?.id??1)
                            }}
                            itemName={" el chofer "+editingDriver?.name}
                            loading={loading}
                            ></ConfirmDeleteModal>
        </>
  );
}
