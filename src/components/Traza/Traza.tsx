import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from 'recharts';

import { Project, User, Supply, NIOS, NIOSupplier, Driver } from "@/src/backend/types";
import { apiClient } from './../../api';
import { LayoutDashboard, ChevronLeft, ChevronRight, Search, Calendar } from "lucide-react";
import { useAuth } from './../Login/ProtectedRoute';
const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "--";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "--";
    // Usamos 'es-AR' o 'es-ES' para asegurar el formato día/mes/año
    return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};
export default function TrazaComponent() {
    // Estados de Datos
    const [projects, setProjects] = useState<Project[]>([]);
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [nios, setNios] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
    const [processedSupplies, setProcessedSupplies] = useState<any[]>([]);    
    const [niosSupplier,setNiosSupplier]= useState<NIOSupplier[]>([]);

    // Estados de UI/Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const { user } = useAuth();
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [rawDriverData, setRawDriverData] = useState<any[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Carga de datos en paralelo
        const [
          projData, 
          supplies, 
          drivers, 
          niosRaw, 
          niosSupplierRaw, 
          supplySells, 
          niosDrivers,
          niosCompleted
        ] = await Promise.all([
          apiClient.projects.list(),
          apiClient.supplies.list(),
          apiClient.drivers.list(),
          apiClient.nios.list(),
          apiClient.nios.listSupplier(),
          apiClient.nios.listSells(),
          apiClient.nios.listDrivers(),
          apiClient.nios.listNioCompleted() // La nueva query que hicimos
        ]);

        // 2. Enriquecer la lista de proveedores (updatedList)
        // Unificamos Insumo + Venta + Datos del Driver
        const updatedList = niosSupplierRaw.map(item => {
          const hasSell = supplySells.find(el => el.nios_supplies_id === item.id);
          
          let driverInfo = {};
          if (hasSell) {
            const hasDriver = niosDrivers.find(d => d.nios_sells_id === hasSell.id);
            if (hasDriver) {
              driverInfo = {
                nios_drivers_id: hasDriver.nios_drivers_id,
                driver_date: hasDriver.driver_date,
                status_transit: hasDriver.status_transit,
                quantity_less: hasDriver.quantity_less,
                driverId: hasDriver.driver_id,
                reception_date: hasDriver.reception_date,
              };
            }
          }

          // Retornamos el item con toda su trazabilidad unificada
          return hasSell ? { ...item, ...hasSell, ...driverInfo } : item;
        });

        // 3. Control de Unicidad para las NIOs (Cabeceras)
        // Usamos un Set para no repetir una misma NIO con el mismo Status
        const uniqueKeys = new Set(niosRaw.map(n => `${n.id}-${n.status}`));
        let finalNios = [...niosRaw];

        // 4. Procesar Parciales desde la lógica de Insumos
        // Si un insumo tiene un status distinto a la NIO madre, creamos una entrada "Partial"
        updatedList.forEach(sup => {
          const originalNio = niosRaw.find(n => n.id === sup.niosId);
          
          if (originalNio) {
            const comboKey = `${sup.niosId}-${sup.status}`;

            if (originalNio.status !== sup.status && !uniqueKeys.has(comboKey)) {
              finalNios.push({
                ...originalNio,
                status: sup.status,
                partial: true 
              });
              uniqueKeys.add(comboKey);
            }
          }
        });

        // 5. Agregar las NIOs Completadas (Resultados de la Query SQL)
        // Estas ya vienen filtradas por fecha (< 30 días) y con el flag partial calculado
        niosCompleted.forEach(nc => {
          const comboKey = `${nc.niosId}-${nc.status}`;
          const Key = finalNios.filter(el=>el.id==nc.niosId)
          if (!uniqueKeys.has(comboKey)) {
            let nio={
                id: nc.niosId,
                projectId: nc.projectId,
                creationDate: nc.creationDate,
                needDate: nc.needDate,
                status: 5,
                toProcurementAt: nc.toProcurementAt,
                toLogisticsAt: nc.toLogisticsAt,
                toTransitAt: nc.toTransitAt,
                completedAt: nc.completedAt,
                partial:Key.length>0?true:false            
            }
            finalNios.push(nio); 
            uniqueKeys.add(comboKey);
          }
          updatedList.push(nc)
        });
        console.log(user)
        let projectsFilerts
        if(user.role_id ==2 || user.role_id ==3){
           projectsFilerts=projData.filter(el=>el.projectManager==user.id || el.generalManager==user.id)
        }else{
          projectsFilerts=projData
        }
        console.log(projectsFilerts)

        // 6. Actualización de Estados de React
        setProjects(projectsFilerts);
        setSupplies(supplies);
        setDrivers(drivers);
        setNios(finalNios);
        setNiosSupplier(updatedList);

      } catch (error) {
        console.error("Error al sincronizar datos de NIOs:", error);
      }
    };

    fetchData();
  }, [user.id, apiClient]);

    // --- FILTRADO Y MÉTRICAS ---
    const filteredNios = useMemo(() => {
        if (selectedProjectId === "all") return nios;
        return nios.filter(n => n.projectId === Number(selectedProjectId));
    }, [nios, selectedProjectId]);
// --- CÁLCULO DE DATOS PARA EL GRÁFICO DE CHOFERES ---
const driverChartData = useMemo(() => {
        const stats: Record<number, { name: string, count: number, totalDays: number }> = {};

        // Filtramos los suministros que pertenecen a las NIOs del proyecto seleccionado
        const relevantSupplies = niosSupplier.filter(s => {
            const nio = nios.find(n => n.id === s.niosId);
            if (!nio) return false;
            return selectedProjectId === "all" || nio.projectId === Number(selectedProjectId);
        });

        relevantSupplies.forEach(item => {
            // Solo contamos si tiene chofer asignado y fechas de viaje
            if ((item.driver_id||item.driverId) && item.driver_date && item.reception_date) {
                const d = new Date(item.driver_date);
                const r = new Date(item.reception_date);
                
                // Diferencia en días (Tiempo de viaje)
                const diffDays = (r.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);

                if (!stats[item.driver_id]) {
                    const driverName = drivers.find(dr => dr.id === item.driverId)?.name || `Chofer ${item.driver_id}`;
                    stats[item.driver_id] = { name: driverName, count: 0, totalDays: 0 };
                }
                
                stats[item.driver_id].count += 1; // Un NIOSupplier con driver = 1 viaje
                stats[item.driver_id].totalDays += Math.max(0, diffDays);
            }
        });

        return Object.values(stats).map(s => ({
            name: s.name,
            viajes: s.count,
            promedio: s.count > 0 ? Number((s.totalDays / s.count).toFixed(1)) : 0
        }));
    }, [niosSupplier, drivers, selectedProjectId, nios]);
// --- RENDERIZADO DEL GRÁFICO ---
    const DriverChart = () => (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h5 className="text-sm font-semibold text-slate-500 uppercase mb-4">Rendimiento por Chofer, desde que se lo asigna hasta la entrega</h5>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={driverChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                        <YAxis fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                        <Bar name="Cantidad de Viajes" dataKey="viajes" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar name="Días Promedio" dataKey="promedio" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
    const completedNios = useMemo(() => {
        return filteredNios
            .filter(n => n.status === 5)
            .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());
    }, [filteredNios]);
   // --- CÁLCULO DE MÉTRICAS DINÁMICAS ---
    const stats = useMemo(() => {
        if (completedNios.length === 0) return { avgProc: 0, avgLog: 0, avgTran: 0, avgRec: 0, otd: 0, avgCom: 0, avgSol: 0};

        let totalProc = 0, totalLog = 0, totalTran = 0,totalRec = 0, onTime = 0, onComp = 0, onSol = 0;

        completedNios.forEach(n => {
            const start = new Date(n.creationDate).getTime();
            const proc = new Date(n.toProcurementAt).getTime();
            const log = new Date(n.toLogisticsAt).getTime();
            const transt = new Date(n.toTransitAt).getTime();
            const end = new Date(n.completedAt).getTime();
            const need = new Date(n.needDate).getTime();

            if (proc && start) totalProc += (proc - start);
            if (log && proc) totalLog += (log - proc);
            if (end && log) totalRec += (end - log);
            if (transt && log) totalTran += (transt - log);
            if (end && log) totalRec += (end - log);
            if (end && start) onComp += (end - start);
            if (need && start) onSol += (need - start);
            if (need && end <= need) onTime++;
        });

        const msToDays = (ms: number) => Number((ms / (completedNios.length * 1000 * 60 * 60 * 24)).toFixed(1));

        return {
            avgProc: msToDays(totalProc),
            avgLog: msToDays(totalLog),
            avgRec: msToDays(totalRec),
            avgCom: msToDays(onComp),
            avgTran: msToDays(totalTran),
            avgSol: msToDays(onSol),
            otd: Math.round((onTime / completedNios.length) * 100)
        };
    }, [completedNios]);
    // Cálculo de Paginación
    const totalPages = Math.ceil(completedNios.length / itemsPerPage);
    const paginatedNios = completedNios.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    // Helper para barras (Max 30 dias = 100%)
    const getBarWidth = (days: number) => `${Math.min((days / 30) * 100, 100)}%`;
    // Helper para calcular diferencia de tiempo legible
    const getDiff = (start: string | undefined, end: string | undefined) => {
        if (!start || !end) return "--";

        const startTime = new Date(start).getTime();
        const endTime = new Date(end).getTime();
        
        const diffMs = endTime - startTime;
        const isNegative = diffMs < 0;
        const diffAbs = Math.abs(diffMs);
        const hours = Math.floor(diffAbs / (1000 * 60 * 60));
        const sign = isNegative ? "-" : "+";

        // Si la diferencia es menor a 1 hora (pero mayor a 0 para evitar el signo en valores nulos)
        if (hours < 1) {
            return `${sign}<1h`;
        }

        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;

        return days > 0 
            ? `${sign}${days}d ${remainingHours}h` 
            : `${sign}${hours}h`;
    };
useEffect(() => {
    console.log("--- DEBUG CHOFERES ---");
    console.log("1. Drivers List (Maestro):", drivers);
    console.log("2. Processed Supplies (Data Cruda):", niosSupplier);
    console.log("3. Driver Chart Data (Para el gráfico):", driverChartData);
    
    if (niosSupplier.length > 0) {
        const sample = niosSupplier[0];
        console.log("4. Muestra de Supply:", {
            tieneDriverId: !!sample.driver_id,
            tieneDriverDate: !!sample.driver_date,
            tieneReceptionDate: !!sample.reception_date
        });
    }
}, [drivers, niosSupplier, driverChartData]);
    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen animate-in fade-in duration-500">
            {/* SELECTOR SUPERIOR */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <LayoutDashboard className="text-blue-600" size={24} /> 
                        Trazabilidad Histórica
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">Análisis de tiempos de respuesta por obra</p>
                </div>
                
                <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                    <span className="text-xs font-black text-slate-500 uppercase ml-2">Obra</span>
                    <select 
                        value={selectedProjectId}
                        onChange={(e) => {
                            setSelectedProjectId(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="bg-white border-none text-slate-700 text-sm font-bold rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all min-w-[220px] shadow-sm"
                    >
                        <option value="all">🌐 Ver todas las obras</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* DASHBOARD DE MÉTRICAS RÁPIDAS */}
            {/* GRID DE MÉTRICAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Tiempos de Proceso */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase mb-4">Tiempos de Proceso Promedio</h3>
                    <div className="space-y-4">
                        {[
                            { label: "Solicitud -> Compra", val: stats.avgProc, color: "bg-blue-500" },
                            { label: "Compra > Logística", val: stats.avgLog, color: "bg-emerald-500" },
                            { label: "Logística > Transito", val: stats.avgTran, color: "bg-amber-500" },
                            { label: "Transito > Recepción", val: stats.avgRec, color: "bg-orange-500" },
                            { label: "Solicitud > Recepción", val: stats.avgCom, color: "bg-orange-500" },
                            { label: "Solicitud > Necesidad", val: stats.avgSol, color: "bg-red-500" }
                        ].map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-400">{item.label} (Días)</span>
                                    <span className="font-bold text-slate-800">{item.val}</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`${item.color} h-full transition-all duration-1000`} style={{ width: getBarWidth(item.val) }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Gráfico de Viajes (Placeholder con Data) */}
                {/* Gráfico de Choferes (Reemplazando el placeholder) */}
                <DriverChart />

                {/* OTD Compliance */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase mb-4">Cumplimiento Fecha Necesidad</h3>
                    <div className="flex flex-col items-center justify-center h-40">
                        <div className="text-center">
                            <div className="text-5xl font-black text-emerald-500">{stats.otd}%</div>
                            <p className="text-slate-400 text-[10px] mt-2 uppercase tracking-widest font-bold">A tiempo</p>
                        </div>
                        {/* Nueva sección de cantidad terminada */}
                        <div className="mt-6 pt-4 border-t border-slate-50 w-full text-center">
                            <span className="text-2xl font-bold text-slate-700">{completedNios.length}</span>
                            <p className="text-[9px] text-slate-400 uppercase font-black tracking-tighter">NIOs Finalizadas</p>
                        </div>
                    </div>
                </div>
            </div>  

            {/* TABLA HISTÓRICA */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Search size={18} className="text-slate-400" />
                        Historial de Suministros Entregados
                    </h3>
                    
                    {/* PAGINACIÓN */}
                    <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-lg border border-slate-200">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="p-1.5 rounded-md hover:bg-white disabled:opacity-30 transition-all text-slate-600"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-[11px] font-bold text-slate-500 uppercase min-w-[100px] text-center">
                            Pág. {currentPage} de {totalPages || 1}
                        </span>
                        <button 
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="p-1.5 rounded-md hover:bg-white disabled:opacity-30 transition-all text-slate-600"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">NIO</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha Creación</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Solicitud. → Compra.</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Compra. → Logística.</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Logística. → Transito.</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Transito. → Recepción .</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha de Necesidad</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Entregado</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Diferencia con necesidad</th>

                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedNios.length > 0 ? paginatedNios.map((n) => (
                                <tr key={`${n.id}-${n.status}`} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs">
                                            #{n.id}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                                        {formatDate(n.creationDate)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold text-slate-600">
                                            {getDiff(n.creationDate, n.toProcurementAt)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold text-slate-600">
                                            {getDiff(n.toProcurementAt, n.toLogisticsAt)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold text-slate-600">
                                            {getDiff(n.toLogisticsAt, n.toTransitAt)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold text-slate-600">
                                            {getDiff(n.toTransitAt, n.completedAt)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-800">
                                                {formatDate(n.needDate)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-800">
                                                {formatDate(n.completedAt)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-800">
                                            {getDiff(n.needDate, n.completedAt)}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                                        No hay datos históricos para mostrar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}