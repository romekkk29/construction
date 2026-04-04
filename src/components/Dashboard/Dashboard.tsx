import React, { useState, useEffect } from 'react';
import { Construction, Warehouse, ClipboardList, TrendingUp } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { apiClient } from './../../api';

// Función auxiliar para los nombres de estados
const getStatusName = (status) => {
  const statusMap = {
    1: 'Obra',
    2: 'Compras',
    3: 'Logística',
    4: 'Tránsito',
    5: 'Completas'
  };
  return statusMap[status] || `Estado ${status}`;
};

export default function DashBoardComponent() {
  // 1. Inicializamos el estado con la estructura que devuelve tu SELECT_DASHBOARD
  const [dashboardData, setDashboardData] = useState({
    projects: [],
    niosByStatus: [],
    stats: {
      activeProjects: 0,
      pendingNios: 0,
      consolidatedStock: 0
    }
  });

  // 2. Extraemos los datos del estado de forma segura
  const { projects, niosByStatus, stats } = dashboardData;

  const fetchData = async () => {
    try {
      // 3. Llamada a la API
      const response = await apiClient.nios.dashboard();
      setDashboardData(response);
    } catch (error) {
      console.error("Error al sincronizar datos de NIOs:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* TARJETAS SUPERIORES */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><Construction /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Obras Activas</p>
            <p className="text-2xl font-bold text-slate-800">{stats.activeProjects}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-amber-50 p-3 rounded-xl text-amber-600"><ClipboardList /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">NIOs Pendientes (Total)</p>
            <p className="text-2xl font-bold text-slate-800">{stats.pendingNios}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-purple-50 p-3 rounded-xl text-purple-600"><Warehouse /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Stock Consolidado</p>
            <p className="text-2xl font-bold text-slate-800">${stats.consolidatedStock.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRÁFICO DE BARRAS */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Consumo vs Presupuesto por Obra
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projects.map(p => ({
                name: p.name,
                Presupuesto: parseFloat(p.total_budgeted),
                Consumido: parseFloat(p.total_spent)
              }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                <Legend iconType="circle" />
                <Bar dataKey="Presupuesto" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Consumido" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* GRÁFICO DE TORTA */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-amber-600" />
            Estado de NIOs (Global)
          </h3>
          <div className="h-80">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                    data={niosByStatus.map(n => ({
                      name: getStatusName(n.status),
                      value: parseInt(n.count)
                    }))}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                 >
                   {niosByStatus.map((_, index) => (
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
}