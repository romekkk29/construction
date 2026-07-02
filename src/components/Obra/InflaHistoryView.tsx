import React, { useEffect, useState } from "react";
import { ArrowLeft, Plus, TrendingUp, Loader2, CalendarDays, User, Percent } from "lucide-react";
import { apiClient } from "../../api";
import InflationModal from "./InflaModal";

interface InflaRecord {
  id: number;
  creation_date: string;
  percentage: string;
  project_id: number;
  name: string;
  last_name: string;
}

interface Props {
  projectId: number;
  projectName: string;
  userId: number;
  onBack: () => void;
  onInflaSubmit: (percentage: number) => Promise<void>;
}

export default function InflaHistoryView({ projectId, projectName, userId, onBack, onInflaSubmit }: Props) {
  const [records, setRecords] = useState<InflaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await apiClient.costAccounts.inflaList(projectId);
      setRecords(data);
    } catch (err) {
      console.error("Error cargando historial de inflación:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [projectId]);

  const handleSubmit = async (percentage: number) => {
    setSubmitting(true);
    try {
      await onInflaSubmit(percentage);
      setIsModalOpen(false);
      await fetchRecords();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              Historial de Inflación
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">{projectName}</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-200 transition-all text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> Agregar Aumento
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mb-3 opacity-40" />
            <p className="text-sm">Cargando historial...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <TrendingUp className="h-10 w-10 mb-3 opacity-25" />
            <p className="text-sm font-medium">Sin aumentos registrados</p>
            <p className="text-xs mt-1">Usá el botón "Agregar Aumento" para registrar el primero</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  <CalendarDays className="inline h-3.5 w-3.5 mr-1 mb-0.5" />Fecha
                </th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  <Percent className="inline h-3.5 w-3.5 mr-1 mb-0.5" />Porcentaje
                </th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  <User className="inline h-3.5 w-3.5 mr-1 mb-0.5" />Aplicado por
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {records.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4 text-slate-600 tabular-nums whitespace-nowrap">
                    {new Date(rec.creation_date).toLocaleString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold">
                      +{rec.percentage}%
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-700 font-medium">
                    {rec.name && rec.last_name ? `${rec.name} ${rec.last_name}` : rec.name ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary card */}
      {records.length > 0 && (
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
            Total de aumentos registrados
          </p>
          <span className="text-2xl font-extrabold text-blue-800">{records.length}</span>
        </div>
      )}

      <InflationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        projectName={projectName}
      />
    </div>
  );
}
