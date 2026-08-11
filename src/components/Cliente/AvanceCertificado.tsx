import React, { useState, useEffect } from "react";
import {
  Plus,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart2,
  List,
  Settings,
  TrendingUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "../Login/ProtectedRoute";
import { apiClient } from "../../api";
import { Project } from "../../backend/types";
import Modal from "../Styles/Modal";

// ---- Local types (frontend only, no DB) ----

type CertStatus = "pending" | "approved" | "rejected";

interface Certificate {
  id: number;
  projectId: number;
  month: number;
  year: number;
  percentage: number;
  status: CertStatus;
  createdBy: number;
  createdByName?: string;
  approvedBy?: number;
  approvedByName?: string;
  approvedAt?: string;
  createdAt: string;
  isEnable?: boolean;
}

interface ProjectedConfig {
  projectId: number;
  durationMonths: number;
  startMonth: number;
  startYear: number;
  percentages: number[];
}

// ---- Helpers ----

function absMonth(year: number, month: number): number {
  return year * 12 + month;
}

function fromAbsMonth(abs: number): { year: number; month: number } {
  const month = ((abs - 1) % 12) + 1;
  const year = (abs - month) / 12;
  return { year, month };
}

function monthName(month: number): string {
  const names = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return names[month - 1] ?? month.toString();
}

// ---- Component ----

export default function AvanceCertificadoComponent() {
  const { user } = useAuth();
  const isAdmin = user?.role_id === 1;
  const isGerente = user?.role_id === 2;
  const isJefe = user?.role_id === 3;
  const isCliente = user?.role_id === 8;
  const canManageProjected = isAdmin || isGerente;
  const canAddCertificate = isAdmin || isGerente || isJefe;
  const canApprove = isAdmin || isGerente;

  // Projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // View
  const [activeTab, setActiveTab] = useState<"grafico" | "historial">("grafico");

  const [loadingData, setLoadingData] = useState(false);

  // Local data synced with backend
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [projectedConfigs, setProjectedConfigs] = useState<Record<number, ProjectedConfig>>({});

  // Certificate modal
  const [isAddCertOpen, setIsAddCertOpen] = useState(false);
  const [certMonth, setCertMonth] = useState("1");
  const [certYear, setCertYear] = useState(String(new Date().getFullYear()));
  const [certPct, setCertPct] = useState("");
  const [certError, setCertError] = useState<string | null>(null);

  // Projected modal
  const [isProjOpen, setIsProjOpen] = useState(false);
  const [projDuration, setProjDuration] = useState("");
  const [projStartMonth, setProjStartMonth] = useState("1");
  const [projStartYear, setProjStartYear] = useState(String(new Date().getFullYear()));
  const [projPercentages, setProjPercentages] = useState<string[]>([]);

  // Load projected config + certificates when a project is selected
  useEffect(() => {
    if (!selectedProject) return;
    const load = async () => {
      setLoadingData(true);
      setCertificates([]);
      try {
        const [cfg, certs] = await Promise.all([
          apiClient.projectedConfig.get(selectedProject.id),
          apiClient.certificates.list(selectedProject.id),
        ]);
        if (cfg) {
          setProjectedConfigs((prev: Record<number, ProjectedConfig>) => ({
            ...prev,
            [selectedProject.id]: {
              projectId: selectedProject.id,
              durationMonths: cfg.durationMonths,
              startMonth: cfg.startMonth,
              startYear: cfg.startYear,
              percentages: cfg.percentages,
            },
          }));
        }
        setCertificates(certs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, [selectedProject]);

  // Load projects filtered by role
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const allProjects = await apiClient.projects.list();
        const enabled = allProjects.filter((p: Project) => p.isEnable !== false);
        if (isAdmin) {
          setProjects(enabled);
        } else if (isGerente) {
          setProjects(enabled.filter((p: Project) => p.generalManager === user.id));
        } else if (isJefe) {
          setProjects(enabled.filter((p: Project) => p.projectManager === user.id));
        } else if (isCliente) {
          const projectIds: number[] = await apiClient.projectUsers.getByUser(user.id);
          setProjects(enabled.filter((p: Project) => projectIds.includes(p.id)));
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

  // Duration change handler: resize percentages array
  const handleProjDurationChange = (val: string) => {
    setProjDuration(val);
    const n = parseInt(val) || 0;
    if (n > 0 && n <= 60) {
      setProjPercentages((prev) => {
        const arr = [...prev];
        while (arr.length < n) arr.push("");
        return arr.slice(0, n);
      });
    } else {
      setProjPercentages([]);
    }
  };

  // Open projected modal and prefill if config exists
  const openProjModal = () => {
    if (!selectedProject) return;
    const existing = projectedConfigs[selectedProject.id];
    if (existing) {
      setProjDuration(String(existing.durationMonths));
      setProjStartMonth(String(existing.startMonth));
      setProjStartYear(String(existing.startYear));
      setProjPercentages(existing.percentages.map(String));
    } else {
      setProjDuration("");
      setProjStartMonth("1");
      setProjStartYear(String(new Date().getFullYear()));
      setProjPercentages([]);
    }
    setIsProjOpen(true);
  };

  const handleSaveProjected = async () => {
    if (!selectedProject) return;
    const n = parseInt(projDuration);
    if (!n || n < 1) return;
    const pcts = projPercentages.map((v: string) => parseFloat(v) || 0);
    try {
      const saved = await apiClient.projectedConfig.upsert(selectedProject.id, {
        durationMonths: n,
        startMonth: parseInt(projStartMonth),
        startYear: parseInt(projStartYear),
        percentages: pcts,
      });
      setProjectedConfigs((prev: Record<number, ProjectedConfig>) => ({
        ...prev,
        [selectedProject.id]: {
          projectId: selectedProject.id,
          durationMonths: saved.durationMonths,
          startMonth: saved.startMonth,
          startYear: saved.startYear,
          percentages: saved.percentages,
        },
      }));
    } catch (e) {
      console.error(e);
    }
    setIsProjOpen(false);
  };

  const handleAddCertificate = async () => {
    if (!selectedProject) return;
    const pct = parseFloat(certPct);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setCertError("El porcentaje debe ser un valor entre 0 y 100.");
      return;
    }
    try {
      const newCert = await apiClient.certificates.create({
        projectId: selectedProject.id,
        month: parseInt(certMonth),
        year: parseInt(certYear),
        percentage: pct,
      });
      setCertificates((prev: Certificate[]) => [newCert, ...prev]);
    } catch (e) {
      setCertError("Error al guardar el certificado.");
      return;
    }
    setIsAddCertOpen(false);
    setCertMonth("1");
    setCertYear(String(new Date().getFullYear()));
    setCertPct("");
    setCertError(null);
    setActiveTab("historial");
  };

  const handleApprove = async (certId: number) => {
    const cert = certificates.find((c: Certificate) => c.id === certId);
    if (!cert) return;
    const alreadyApproved = certificates.find(
      (c: Certificate) =>
        c.projectId === cert.projectId &&
        c.month === cert.month &&
        c.year === cert.year &&
        c.status === "approved"
    );
    if (alreadyApproved) {
      alert(
        `Ya existe un certificado aprobado para ${monthName(cert.month)} ${cert.year}. No puede haber más de un certificado aprobado por mes.`
      );
      return;
    }
    try {
      const updated = await apiClient.certificates.update(certId, { status: "approved" });
      setCertificates((prev: Certificate[]) =>
        prev.map((c: Certificate) => (c.id === certId ? updated : c))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (certId: number) => {
    try {
      const updated = await apiClient.certificates.update(certId, { status: "rejected" });
      setCertificates((prev: Certificate[]) =>
        prev.map((c: Certificate) => (c.id === certId ? updated : c))
      );
    } catch (e) {
      console.error(e);
    }
  };

  // Build recharts data — calendar-based so Real certs always appear regardless of config alignment
  const buildChartData = (): { name: string; Proyectado?: number; Real?: number }[] => {
    if (!selectedProject) return [];
    const config = projectedConfigs[selectedProject.id];
    const approvedCerts = certificates.filter(
      (c) => c.projectId === selectedProject.id && c.status === "approved"
    );

    if (!config && approvedCerts.length === 0) return [];

    // Build the unified set of calendar months (absolute month = year*12+month)
    const absSet = new Set<number>();

    if (config) {
      const start = absMonth(config.startYear, config.startMonth);
      for (let i = 0; i < config.durationMonths; i++) absSet.add(start + i);
    }

    approvedCerts.forEach((c) => absSet.add(absMonth(c.year, c.month)));

    const sortedAbs = Array.from(absSet).sort((a, b) => a - b);

    return sortedAbs.map((abs) => {
      const { year, month } = fromAbsMonth(abs);
      const point: { name: string; Proyectado?: number; Real?: number } = {
        name: `${monthName(month)} ${year}`,
      };

      if (config) {
        const idx = abs - absMonth(config.startYear, config.startMonth);
        if (idx >= 0 && idx < config.durationMonths) {
          point.Proyectado = config.percentages[idx] ?? 0;
        }
      }

      const cert = approvedCerts.find((c) => c.year === year && c.month === month);
      if (cert) point.Real = cert.percentage;

      return point;
    });
  };

  const chartData = buildChartData();
  const projConfig = selectedProject ? projectedConfigs[selectedProject.id] : null;
  const projectCerts = selectedProject
    ? certificates.filter((c) => c.projectId === selectedProject.id)
    : [];
  const pendingCount = projectCerts.filter((c) => c.status === "pending").length;
  const approvedCount = projectCerts.filter((c) => c.status === "approved").length;

  // ---- Render: Project selection list ----
  if (!selectedProject) {
    return (
      <div>
        <div className="flex pb-6 justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Avance de Obra con Certificados</h2>
            <p className="text-slate-500 text-sm mt-1">
              Avance de Obra Real vs Avance de Obra Proyectado
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="h-8 w-8 animate-spin border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center text-slate-400">
            No hay obras asignadas a tu usuario.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const certs = certificates.filter((c) => c.projectId === project.id);
              const approved = certs.filter((c) => c.status === "approved").length;
              const pending = certs.filter((c) => c.status === "pending").length;
              const hasConfig = !!projectedConfigs[project.id];
              return (
                <div
                  key={project.id}
                  onClick={() => { setSelectedProject(project); setActiveTab("grafico"); }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                >
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{project.name}</h3>
                  <p className="text-sm text-slate-500 mb-4">{project.address}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {hasConfig && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">
                        Proyectado configurado
                      </span>
                    )}
                    {approved > 0 && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
                        {approved} aprobado{approved !== 1 ? "s" : ""}
                      </span>
                    )}
                    {pending > 0 && (
                      <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs font-semibold rounded-full">
                        {pending} pendiente{pending !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-blue-600 group-hover:underline">
                    Ver avance certificado →
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ---- Render: Project detail ----
  if (loadingData) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col mb-6 gap-4 border-b pb-5">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Avance de Obra con Certificados</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Avance de Obra Real vs Avance de Obra Proyectado
            </p>
            <p className="text-blue-700 font-bold mt-1">{selectedProject.name}</p>
          </div>
          <button
            onClick={() => setSelectedProject(null)}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          {canAddCertificate && (
            <button
              onClick={() => { setIsAddCertOpen(true); setCertError(null); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-200 transition-all text-sm font-semibold"
            >
              <Plus className="h-4 w-4" /> Agregar Certificado
            </button>
          )}
          {canManageProjected && (
            <button
              onClick={openProjModal}
              className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all text-sm font-semibold"
            >
              <Settings className="h-4 w-4" />
              {projConfig ? "Editar Datos Proyectados" : "Datos Proyectados"}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("grafico")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === "grafico"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <BarChart2 className="h-4 w-4" /> Gráfico
        </button>
        <button
          onClick={() => setActiveTab("historial")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === "historial"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <List className="h-4 w-4" /> Historial
          {pendingCount > 0 && (
            <span className="bg-orange-100 text-orange-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Gráfico tab */}
      {activeTab === "grafico" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <TrendingUp className="h-14 w-14 text-slate-200" />
              <p className="text-sm font-medium text-slate-500">No hay datos para mostrar aún.</p>
              <div className="flex flex-col items-center gap-1 text-xs text-slate-400">
                {canManageProjected && (
                  <p>
                    Configure los{" "}
                    <button
                      onClick={openProjModal}
                      className="text-blue-500 underline font-medium"
                    >
                      datos proyectados
                    </button>{" "}
                    para ver la curva proyectada.
                  </p>
                )}
                {canAddCertificate && (
                  <p>Agregue y apruebe certificados para ver la curva real.</p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-3 mb-6">
                {projConfig && (
                  <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
                    Plazo: {projConfig.durationMonths} meses · Inicio:{" "}
                    {monthName(projConfig.startMonth)} {projConfig.startYear}
                  </div>
                )}
                {approvedCount > 0 && (
                  <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
                    Certificados aprobados: {approvedCount}
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <div style={{ minWidth: Math.max(400, chartData.length * 60) }}>
                  <ResponsiveContainer width="100%" height={380}>
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          fontSize: "13px",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                        }}
                        formatter={(value: any) => [`${value}%`]}
                      />
                      <Legend wrapperStyle={{ fontSize: "13px", paddingTop: "16px" }} />
                      {projConfig && (
                        <Line
                          type="monotone"
                          dataKey="Proyectado"
                          stroke="#3b82f6"
                          strokeWidth={2.5}
                          strokeDasharray="6 3"
                          dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                          activeDot={{ r: 6 }}
                          connectNulls
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="Real"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 5, fill: "#10b981", strokeWidth: 0 }}
                        activeDot={{ r: 7 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="md:hidden text-[10px] text-slate-400 text-center mt-2 border-t pt-2">
                ← Desliza para ver el gráfico completo →
              </div>
            </>
          )}
        </div>
      )}

      {/* Historial tab */}
      {activeTab === "historial" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {projectCerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <List className="h-12 w-12 text-slate-200" />
              <p className="text-sm">No hay certificados registrados para esta obra.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {[...projectCerts]
                .sort(
                  (a, b) =>
                    b.year * 12 + b.month - (a.year * 12 + a.month)
                )
                .map((cert) => (
                  <div
                    key={cert.id}
                    className="px-5 py-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex-shrink-0">
                        {cert.status === "approved" && (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        )}
                        {cert.status === "rejected" && (
                          <XCircle className="h-5 w-5 text-red-400" />
                        )}
                        {cert.status === "pending" && (
                          <Clock className="h-5 w-5 text-orange-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-sm">
                          {monthName(cert.month)} {cert.year}
                        </p>
                        <p className="text-slate-500 text-xs mt-0.5">
                          Avance certificado:{" "}
                          <span className="font-bold text-slate-700">{cert.percentage}%</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {cert.status === "pending" && (
                        <span className="px-2.5 py-1 bg-orange-50 text-orange-600 text-xs font-bold rounded-full">
                          Pendiente de aprobación
                        </span>
                      )}
                      {cert.status === "approved" && (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">
                          Aprobado
                        </span>
                      )}
                      {cert.status === "rejected" && (
                        <span className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full">
                          No Aprobado
                        </span>
                      )}

                      {canApprove && cert.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(cert.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Aprobar
                          </button>
                          <button
                            onClick={() => handleReject(cert.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5" /> No Aprobar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ---- Add Certificate Modal ---- */}
      <Modal
        isOpen={isAddCertOpen}
        onClose={() => { setIsAddCertOpen(false); setCertError(null); }}
        title={`Nuevo Certificado Mensual para ${selectedProject.name}`}
        zIndex={50}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Mes de Certificado</label>
              <select
                value={certMonth}
                onChange={(e) => setCertMonth(e.target.value)}
                className="w-full p-2 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {monthName(i + 1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Año</label>
              <input
                type="number"
                value={certYear}
                onChange={(e) => setCertYear(e.target.value)}
                min={2020}
                max={2050}
                className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Avance Certificado (%)
            </label>
            <input
              type="number"
              value={certPct}
              onChange={(e) => setCertPct(e.target.value)}
              min={0}
              max={100}
              step={0.1}
              placeholder="0 a 100"
              className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-400">
              Ingrese el porcentaje de avance acumulado al cierre del mes (0% – 100%).
            </p>
          </div>

          {certError && (
            <p className="text-xs text-red-500 font-medium bg-red-50 px-3 py-2 rounded-lg">
              {certError}
            </p>
          )}

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
            El certificado quedará en estado <strong>Pendiente de aprobación</strong>. Un gerente de obra o administrador deberá aprobarlo para que impacte en el gráfico.
          </div>

          <button
            onClick={handleAddCertificate}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
          >
            Agregar Certificado
          </button>
        </div>
      </Modal>

      {/* ---- Projected Data Modal ---- */}
      {canManageProjected && (
        <Modal
          isOpen={isProjOpen}
          onClose={() => setIsProjOpen(false)}
          title="Datos Proyectados"
          zIndex={50}
        >
          <div className="space-y-5">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-sm text-slate-700 font-semibold">{selectedProject.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure el plazo de obra y el avance proyectado mes a mes para construir la curva de referencia.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Plazo (meses)</label>
                <input
                  type="number"
                  value={projDuration}
                  onChange={(e) => handleProjDurationChange(e.target.value)}
                  min={1}
                  max={60}
                  placeholder="Ej: 12"
                  className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Mes Inicio</label>
                <select
                  value={projStartMonth}
                  onChange={(e) => setProjStartMonth(e.target.value)}
                  className="w-full p-2 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {monthName(i + 1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Año Inicio</label>
                <input
                  type="number"
                  value={projStartYear}
                  onChange={(e) => setProjStartYear(e.target.value)}
                  min={2020}
                  max={2050}
                  className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {projPercentages.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Avance Proyectado por Mes (%)
                </label>
                <p className="text-[11px] text-slate-400">
                  Ingrese el % de avance acumulado esperado al cierre de cada mes.
                </p>
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {projPercentages.map((val, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-14 flex-shrink-0 font-medium">
                        Mes {i + 1}
                      </span>
                      <input
                        type="number"
                        value={val}
                        onChange={(e) => {
                          const arr = [...projPercentages];
                          arr[i] = e.target.value;
                          setProjPercentages(arr);
                        }}
                        min={0}
                        max={100}
                        step={0.1}
                        placeholder="0–100"
                        className="flex-1 p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                      />
                      <span className="text-xs text-slate-400 w-4">%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {projDuration && parseInt(projDuration) > 0 && projPercentages.length === 0 && (
              <p className="text-xs text-slate-400 text-center">
                Complete el plazo para configurar los avances mensuales.
              </p>
            )}

            <button
              onClick={handleSaveProjected}
              disabled={!projDuration || parseInt(projDuration) < 1}
              className="w-full bg-slate-700 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-40"
            >
              Guardar Datos Proyectados
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
