import React, { useState, useEffect } from "react";
import { Plus, FileDown, Loader2 } from "lucide-react";
import { useAuth } from "../Login/ProtectedRoute";
import { apiClient } from "../../api";
import { ClientPayment, Project } from "../../backend/types";
import Modal from "../Styles/Modal";

export default function ClientePagosComponent() {
  const { user } = useAuth();
  const isAdmin = user?.role_id === 1;

  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clientUsers, setClientUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [filterProject, setFilterProject] = useState("");
  const [filterClient, setFilterClient] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 100 * 1024 * 1024;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size > MAX_FILE_SIZE) {
      setFileError("El documento supera el límite de 100 MB. Optimícelo o contacte al administrador.");
      e.target.value = "";
    } else {
      setFileError(null);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [paymentsData, projectsData] = await Promise.all([
          apiClient.clientPayments.list(),
          apiClient.projects.list(),
        ]);
        setPayments(paymentsData);
        setProjects(projectsData.filter((p) => p.isEnable !== false));
        if (isAdmin) {
          const usersData = await apiClient.users.list();
          setClientUsers(usersData.filter((u: any) => u.rol.id === 8));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredPayments = payments.filter((p) => {
    if (filterProject && p.projectId !== Number(filterProject)) return false;
    if (isAdmin && filterClient && !(p.clientUserIds || []).includes(Number(filterClient))) return false;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      const created = await apiClient.clientPayments.create(fd);
      setPayments((prev) => [created, ...prev]);
      setIsFormOpen(false);
      setSelectedProjectId("");
      setFileError(null);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      alert(err.message || "Error al registrar el pago");
    } finally {
      setFormLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency === "USD" ? "USD" : "ARS",
      minimumFractionDigits: 2,
    }).format(amount);

  return (
    <div>
      {/* Header */}
      <div className="flex pb-6 justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Pagos Clientes</h2>
        {isAdmin && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-200 transition-all"
          >
            <Plus className="h-5 w-5" /> Nuevo Pago
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="p-2 border rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas las obras</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {isAdmin && (
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="p-2 border rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los clientes</option>
            {clientUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.name} {u.lastName}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Obra</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Moneda</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalle</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Documento</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{p.paymentDate?.toString().split("T")[0]}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{p.projectName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right whitespace-nowrap font-medium">
                      {formatCurrency(p.amount, p.currency)}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.currency === "USD" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                        {p.currency}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{p.detail ?? "—"}</td>
                    <td className="px-4 py-3 text-center">
                      {p.documentName ? (
                        <a
                          href={`/api/client-payments/documents/${p.documentName}`}
                          download={p.documentOriginalName ?? p.documentName}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                          title={p.documentOriginalName ?? p.documentName}
                        >
                          <FileDown className="h-4 w-4" />
                          <span className="max-w-[100px] truncate">{p.documentOriginalName ?? p.documentName}</span>
                        </a>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">
                      No hay pagos registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal — Admin only */}
      {isAdmin && (
        <Modal isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setSelectedProjectId(""); }} title="Registrar Pago" zIndex={50}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Obra */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Obra</label>
              <select
                name="projectId"
                required
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full p-2 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar obra</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Monto + Moneda */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Monto</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Moneda</label>
                <select
                  name="currency"
                  required
                  className="w-full p-2 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ARS">Pesos (ARS)</option>
                  <option value="USD">Dólares (USD)</option>
                </select>
              </div>
            </div>

            {/* Fecha */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Fecha</label>
              <input
                name="paymentDate"
                type="date"
                required
                className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Detalle */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Detalle</label>
              <textarea
                name="detail"
                rows={3}
                placeholder="Descripción opcional del pago..."
                className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Documento */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Documento (opcional)</label>
              <input
                name="document"
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                className={`w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${fileError ? "border-red-400" : ""}`}
              />
              {fileError && (
                <p className="text-xs text-red-500 mt-1">{fileError}</p>
              )}
              <p className="text-xs text-slate-400 mt-0.5">Máximo 100 MB</p>
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {formLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar Pago
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
