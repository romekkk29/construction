import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { useAuth } from "../Login/ProtectedRoute";
import { apiClient } from "../../api";
import { Project } from "../../backend/types";

export default function ClientePresupuestoComponent() {
  const { user } = useAuth();
  const isAdmin = user?.role_id === 1;

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [accountSearchTerm, setAccountSearchTerm] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [allProjects, assignedIds] = await Promise.all([
          apiClient.projects.list(),
          isAdmin || user?.role_id === 2 || user?.role_id === 3 ? Promise.resolve(null) : apiClient.projectUsers.getByUser(user.id),
        ]);
        const enabled = allProjects.filter((p) => p.isEnable !== false);
        if (isAdmin) {
          setProjects(enabled);
        } else if (user?.role_id === 2) {
          setProjects(enabled.filter((p) => p.generalManager === user.id));
        } else if (user?.role_id === 3) {
          setProjects(enabled.filter((p) => p.projectManager === user.id));
        } else if (assignedIds !== null) {
          setProjects(enabled.filter((p) => (assignedIds as number[]).includes(p.id)));
        } else {
          setProjects([]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSelectProject = async (project: Project) => {
    setDetailLoading(true);
    setAccountSearchTerm("");
    try {
      const accounts = await apiClient.costAccounts.list(project.id);
      setSelectedProject({ ...project, accounts });
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (selectedProject) {
    const totalBudget = selectedProject.accounts?.reduce((s, a) => s + (a.budgeted || 0), 0) ?? 0;
    const totalSpent = selectedProject.accounts?.reduce((s, a) => s + Math.max(0, a.spent ?? 0), 0) ?? 0;
    const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const progressColor = percentage > 100 ? "bg-red-500" : "bg-blue-600";
    const overBudgetCount = selectedProject.accounts?.filter(
      (a) => a.budgeted > 0 && (a.spent ?? 0) > a.budgeted
    ).length ?? 0;
    const totalAccounts = selectedProject.accounts?.length ?? 0;
    const searchLower = accountSearchTerm.toLowerCase();

    return (
      <div>
        {detailLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            <div className="flex flex-col mb-8 border-b pb-6 gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900">{selectedProject.name}</h2>
                  <p className="text-slate-500">{selectedProject.address}</p>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-700 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Volver
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-100">
                <p className="text-blue-100 text-sm font-medium mb-1">Reporte General</p>
                <p className={`text-4xl font-extrabold mb-3 ${percentage > 100 ? "text-red-200" : "text-white"}`}>
                  {percentage.toFixed(1)}%
                </p>
                <div className="w-full bg-blue-500 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`${percentage > 100 ? "bg-red-300" : "bg-white"} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>
                <p className="text-blue-200 text-xs mt-2">del presupuesto ejecutado</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <p className="text-slate-500 text-sm font-medium">Cuentas de Costo</p>
                <div className="flex items-end gap-4 mt-2">
                  <div>
                    <p className="text-3xl font-extrabold text-slate-800">{totalAccounts}</p>
                    <p className="text-xs text-slate-400">total</p>
                  </div>
                  {overBudgetCount > 0 && (
                    <div>
                      <p className="text-3xl font-extrabold text-red-500">{overBudgetCount}</p>
                      <p className="text-xs text-red-400">sobre presupuesto</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar cuenta o detalle..."
                  value={accountSearchTerm}
                  onChange={(e) => setAccountSearchTerm(e.target.value)}
                  className="w-full sm:max-w-sm px-3 py-1.5 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all placeholder-slate-400"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[500px]">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">Cuenta</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">Detalle</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">% Incidencia</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Reporte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedProject.accounts
                      ?.filter(
                        (acc) =>
                          acc.name?.toLowerCase().includes(searchLower) ||
                          acc.detail?.toLowerCase().includes(searchLower)
                      )
                      .sort((a, b) =>
                        (a.name ?? "").localeCompare(b.name ?? "", undefined, {
                          numeric: true,
                          sensitivity: "base",
                        })
                      )
                      .map((acc) => {
                        const incidence = totalBudget > 0 ? (acc.budgeted / totalBudget) * 100 : 0;
                        const spent = acc.spent ?? 0;
                        const accPct = acc.budgeted > 0 ? (spent / acc.budgeted) * 100 : 0;
                        return (
                          <tr key={acc.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-800">{acc.name}</td>
                            <td className="px-6 py-4 text-slate-600 text-sm">{acc.detail}</td>
                            <td className="px-6 py-4 text-right">
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                                {incidence.toFixed(2)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 min-w-[160px]">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div
                                    className={`${accPct > 100 ? "bg-red-500" : "bg-blue-500"} h-full rounded-full`}
                                    style={{ width: `${Math.min(100, accPct)}%` }}
                                  />
                                </div>
                                <span
                                  className={`text-sm font-bold w-12 text-right ${
                                    accPct > 100 ? "text-red-600" : "text-slate-700"
                                  }`}
                                >
                                  {accPct.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    {(selectedProject.accounts?.length ?? 0) === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                          No hay cuentas de costo registradas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden bg-slate-50 text-[10px] text-slate-400 text-center py-1 border-t">
                ← Desliza lateralmente para ver más →
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex pb-6 justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Avance del Presupuesto</h2>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center text-slate-400">
          No hay obras asignadas
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => handleSelectProject(project)}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
            >
              <h3 className="text-xl font-bold text-slate-800 mb-1">{project.name}</h3>
              <p className="text-sm text-slate-500 mb-4">{project.address}</p>
              <span className="text-xs font-semibold text-blue-600 group-hover:underline">
                Ver avance →
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
