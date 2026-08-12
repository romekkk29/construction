import React, { useState, useEffect } from "react";
import { apiClient } from "./../../api";
import { useAuth } from "../Login/ProtectedRoute";
import { Project } from "@/src/backend/types";
import { History, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

const statusColor: Record<string, string> = {
  'solicitud': 'bg-slate-100 text-slate-700 border-slate-200',
  'compras': 'bg-amber-100 text-amber-700 border-amber-200',
  'logistica': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'en transito': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'completa': 'bg-green-100 text-green-700 border-green-200',
  'defectuosa': 'bg-rose-100 text-rose-700 border-rose-200',
};

const stepLabel: Record<string, string> = {
  'solicitud': 'Creación NIO',
  'compras': 'Ingreso a Compras',
  'logistica': 'Ingreso a Logística',
  'en transito': 'Salida a Tránsito',
  'completa': 'Completada',
  'defectuosa': 'Defectuosa',
};

export default function NioHistoryComponent() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const canSeePrices = user?.role_id !== 2 && user?.role_id !== 3;

  const formatCurrency = (value: any) => {
    const number = parseFloat(value);
    if (isNaN(number)) return "0,00";
    return number.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (value: string | Date | null | undefined) => {
    if (!value) return '—';
    const date = new Date(value);
    return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-AR');
  };

  const getStepDate = (item: any) => {
    switch (item.estado) {
      case 'compras': return item.toProcurementAt;
      case 'logistica': return item.toLogisticsAt;
      case 'en transito': return item.toTransitAt;
      case 'completa': return item.completedAt;
      case 'defectuosa': return item.defectDate;
      case 'solicitud':
      default: return item.creationDate;
    }
  };

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const all = await apiClient.projects.list();
        let filtered = all;
        if (user?.role_id === 2 || user?.role_id === 3) {
          filtered = (all as any[]).filter((p: any) => p.projectManager === user?.id || p.generalManager === user?.id);
        }
        setProjects(filtered);
      } catch (err) {
        console.error(err);
      }
    };
    loadProjects();
  }, [user]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const projectId = selectedProjectId ? parseInt(selectedProjectId, 10) : undefined;
        const res = await apiClient.nios.listHistory({
          projectId,
          search: search.trim() || undefined,
          status: statusFilter || undefined,
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        });
        setData(res.data);
        setTotal(res.total);
      } catch (err: any) {
        alert(err.message || "Error al cargar historial");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedProjectId, search, statusFilter, page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <History className="h-5 w-5 text-blue-600" /> Historial NIOs
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Buscar por insumo o NIO..."
            className="text-xs p-2 rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-blue-400 outline-none w-48"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
          <select
            className="text-xs p-2 rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-blue-400 outline-none"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          >
            <option value="">Todos los estados</option>
            <option value="solicitud">Solicitud</option>
            <option value="compras">Compras</option>
            <option value="logistica">Logística</option>
            <option value="en transito">En tránsito</option>
            <option value="completa">Completa</option>
            <option value="defectuosa">Defectuosa</option>
          </select>
          <select
            className="text-xs p-2 rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-blue-400 outline-none"
            value={selectedProjectId}
            onChange={(e) => { setSelectedProjectId(e.target.value); setPage(0); }}
          >
            <option value="">Todas las obras</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1400px]">
            <div className="hidden md:grid md:grid-cols-[repeat(13,minmax(0,1fr))] gap-2 px-4 py-3 text-[10px] font-extrabold text-slate-500 uppercase bg-slate-50 border-b border-slate-200 whitespace-nowrap">
              <div className="col-span-1">Nio Id</div>
              <div className="col-span-2">Insumo / Servicio</div>
              <div className="col-span-1 text-center">Cant.</div>
              <div className="col-span-2">Cuenta</div>
              <div className="col-span-1">N° OC</div>
              <div className="col-span-1">Proveedor</div>
              <div className="col-span-1 text-right">Unit. / Total</div>
              <div className="col-span-1 text-center">Acción</div>
              <div className="col-span-1 text-center">Asignar Chofer</div>
              <div className="col-span-1 text-center">Faltante</div>
              <div className="col-span-1 text-right">Estado</div>
            </div>

            {loading && <div className="p-8 text-center text-sm text-slate-500">Cargando...</div>}

            {!loading && data.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500">No hay registros</div>
            )}

            {!loading && data.map((item) => {
              const stepDate = getStepDate(item);
              return (
                <div key={`${item.nioId}-${item.supplyId}`} className="grid grid-cols-1 md:grid-cols-[repeat(13,minmax(0,1fr))] gap-2 px-4 py-3 border-b border-slate-100 items-center hover:bg-slate-50 whitespace-nowrap">
                  <div className="md:col-span-1 text-xs font-bold text-slate-700">NIO-{item.nioId}</div>
                  <div className="md:col-span-2 min-w-0">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate" title={item.supply}>{item.supply}</p>
                  </div>
                  <div className="md:col-span-1 text-center text-xs font-medium text-slate-700">
                    {item.quantity} <span className="text-[10px] text-slate-500">{item.unit}</span>
                  </div>
                  <div className="md:col-span-2 min-w-0">
                    <p className="text-[10px] leading-tight font-medium text-emerald-700 bg-emerald-50 p-1.5 rounded border border-emerald-100 truncate" title={`${item.accountName} ${item.accountDetail}`}>
                      {item.accountName} {item.accountDetail}
                    </p>
                  </div>
                  <div className="md:col-span-1 text-xs text-slate-700 truncate">{item.ocNumber}</div>
                  <div className="md:col-span-1 text-xs text-slate-700 truncate" title={item.supplier}>{item.supplier}</div>
                  <div className="md:col-span-1 text-right text-xs font-bold text-slate-900">
                    {canSeePrices ? (
                      <>
                        <div>${formatCurrency(item.priceIndividual)}</div>
                        <div className="text-[10px] font-normal text-slate-500">${formatCurrency(item.priceTotal)}</div>
                      </>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                  <div className="md:col-span-1 text-center min-w-0">
                    <p className="text-[10px] font-bold text-slate-600 leading-tight truncate" title={stepLabel[item.estado] || 'Creación NIO'}>{stepLabel[item.estado] || 'Creación NIO'}</p>
                    <p className="text-[10px] text-slate-500">{formatDate(stepDate)}</p>
                  </div>
                  <div className="md:col-span-1 text-center text-xs text-slate-700 truncate" title={item.driverName || 'N/A'}>{item.driverName || 'N/A'}</div>
                  <div className="md:col-span-1 text-center text-xs font-bold text-slate-700">{item.quantityLess}</div>
                  <div className="md:col-span-1 text-center flex items-center justify-end">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border whitespace-nowrap ${statusColor[item.estado] || 'bg-slate-100 text-slate-700'}`}>
                      {item.estado}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white disabled:opacity-50 hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" /> Anterior
          </button>
          <span className="text-xs text-slate-500">Página {page + 1} de {totalPages} ({total} resultados)</span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white disabled:opacity-50 hover:bg-slate-50"
          >
            Siguiente <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
