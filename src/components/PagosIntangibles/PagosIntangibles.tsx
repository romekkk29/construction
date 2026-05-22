import React, { useState, useEffect } from 'react';
import { Plus, X, CheckCircle, XCircle, Clock, CreditCard, Loader2 } from 'lucide-react';
import { apiClient } from '../../api';
import { Project, CostAccount } from '../../backend/types';
import { useAuth } from '../Login/ProtectedRoute';

type EstadoPago = 'pendiente' | 'aprobado' | 'no_aprobado';

interface PagoIntangible {
  id: number;
  descripcion: string;
  estado: EstadoPago;
  precio: number;
  obraImputar: string;
  obraImputarId: number | null;
  cuentaImputacion: string;
  cuentaImputacionId: number | null;
  fecha: string;
}


const ESTADO_CONFIG: Record<EstadoPago, { label: string; color: string; icon: React.ReactNode }> = {
  pendiente: {
    label: 'Pendiente',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  aprobado: {
    label: 'Aprobado',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  no_aprobado: {
    label: 'No Aprobado',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

const EMPTY_FORM = {
  descripcion: '',
  precio: '',
  obraImputarId: '',
  cuentaImputacionId: '',
};

export default function PagosIntangiblesComponent() {
  const { user } = useAuth();
  const canCreate = user?.role_id === 1 || user?.role_id === 4;
  const canApprove = user?.role_id === 1;

  const [pagos, setPagos] = useState<PagoIntangible[]>([]);
  const [loadingPagos, setLoadingPagos] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [costAccounts, setCostAccounts] = useState<CostAccount[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoadingPagos(true);
      setLoadingProjects(true);
      try {
        const [pagosData, projectsData] = await Promise.all([
          apiClient.intangiblePayments.list(),
          apiClient.projects.list(),
        ]);
        setPagos(pagosData);
        setProjects(projectsData);
      } catch (err) {
        console.error('Error cargando datos:', err);
      } finally {
        setLoadingPagos(false);
        setLoadingProjects(false);
      }
    };
    fetchAll();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'obraImputarId') {
      setForm(prev => ({ ...prev, obraImputarId: value, cuentaImputacionId: '' }));
      setCostAccounts([]);
      if (value) {
        setLoadingAccounts(true);
        apiClient.costAccounts.list(Number(value))
          .then(data => setCostAccounts(data))
          .catch(err => console.error('Error cargando cuentas:', err))
          .finally(() => setLoadingAccounts(false));
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    setFormError('');
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setForm(EMPTY_FORM);
    setFormError('');
    setCostAccounts([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.descripcion.trim()) { setFormError('La descripción es obligatoria.'); return; }
    if (!form.precio || isNaN(Number(form.precio)) || Number(form.precio) <= 0) { setFormError('El precio debe ser un número positivo.'); return; }
    if (!form.obraImputarId) { setFormError('Debe seleccionar una obra.'); return; }
    if (!form.cuentaImputacionId) { setFormError('Debe seleccionar una cuenta de imputación.'); return; }

    setSubmitting(true);
    try {
      const created = await apiClient.intangiblePayments.create({
        descripcion: form.descripcion.trim(),
        precio: parseFloat(Number(form.precio).toFixed(2)),
        obraImputarId: Number(form.obraImputarId),
        cuentaImputacionId: Number(form.cuentaImputacionId),
      });

      const selectedProject = projects.find(p => p.id === Number(form.obraImputarId));
      const selectedAccount = costAccounts.find(c => c.id === Number(form.cuentaImputacionId));

      const nuevo: PagoIntangible = {
        id: created.id,
        descripcion: form.descripcion.trim(),
        estado: 'pendiente',
        precio: parseFloat(Number(form.precio).toFixed(2)),
        obraImputar: selectedProject?.name ?? '',
        obraImputarId: Number(form.obraImputarId),
        cuentaImputacion: selectedAccount?.name
          ? `${selectedAccount.name} - ${selectedAccount.detail ?? ''}`
          : (selectedAccount?.detail ?? ''),
        cuentaImputacionId: Number(form.cuentaImputacionId),
        fecha: new Date().toISOString().split('T')[0],
      };

      setPagos(prev => [nuevo, ...prev]);
      handleCloseForm();
    } catch (err: any) {
      setFormError(err?.message ?? 'Error al guardar el pago.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAprobar = async (id: number) => {
    try {
      await apiClient.intangiblePayments.aprobar(id);
      setPagos(prev => prev.map(p => p.id === id ? { ...p, estado: 'aprobado' } : p));
    } catch (err: any) {
      alert(err?.message ?? 'Error al aprobar el pago.');
    }
  };

  const handleNoAprobar = async (id: number) => {
    try {
      await apiClient.intangiblePayments.noAprobar(id);
      setPagos(prev => prev.map(p => p.id === id ? { ...p, estado: 'no_aprobado' } : p));
    } catch (err: any) {
      alert(err?.message ?? 'Error al rechazar el pago.');
    }
  };

  const totalPendiente = pagos.filter(p => p.estado === 'pendiente').reduce((s, p) => s + p.precio, 0);
  const totalAprobado = pagos.filter(p => p.estado === 'aprobado').reduce((s, p) => s + p.precio, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pagos de Intangibles</h2>
          <p className="text-sm text-slate-500 mt-0.5">Gestión de pagos por servicios intangibles imputados a obras</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setIsFormOpen(true)}
            disabled={loadingProjects}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-200 transition-all"
          >
            {loadingProjects ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            Nuevo Pago
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Registros</p>
          <p className="text-2xl font-extrabold text-slate-800">{pagos.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Pendiente Aprobación</p>
          <p className="text-2xl font-extrabold text-amber-700">
            ${totalPendiente.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm">
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Total Aprobado</p>
          <p className="text-2xl font-extrabold text-emerald-700">
            ${totalAprobado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Descripción</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Estado</th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Precio</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Obra a Imputar</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Cuenta de Imputación</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Fecha</th>
                <th className="text-center px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loadingPagos && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin opacity-40" />
                    Cargando pagos...
                  </td>
                </tr>
              )}
              {!loadingPagos && pagos.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No hay pagos registrados
                  </td>
                </tr>
              )}
              {pagos.map(pago => {
                const cfg = ESTADO_CONFIG[pago.estado];
                return (
                  <tr key={pago.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-800 max-w-xs">
                      <span className="line-clamp-2">{pago.descripcion}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-800 tabular-nums">
                      ${pago.precio.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-slate-600 max-w-[180px]">
                      <span className="line-clamp-2">{pago.obraImputar}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{pago.cuentaImputacion}</td>
                    <td className="px-5 py-4 text-slate-500 tabular-nums whitespace-nowrap">{pago.fecha}</td>
                    <td className="px-5 py-4">
                      {pago.estado === 'pendiente' && canApprove && (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleAprobar(pago.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Aprobar
                          </button>
                          <button
                            onClick={() => handleNoAprobar(pago.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg border border-red-200 transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            No Aprobar
                          </button>
                        </div>
                      )}
                      {(pago.estado !== 'pendiente' || !canApprove) && (
                        <span className="block text-center text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Nuevo Pago */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Nuevo Pago de Intangible</h3>
              <button
                onClick={handleCloseForm}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
              {/* Descripción */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Ej: Honorarios estudio contable por asesoramiento..."
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Precio */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Precio <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="precio"
                  value={form.precio}
                  onChange={handleFormChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Obra a imputar */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Obra a Imputar <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="obraImputarId"
                    value={form.obraImputarId}
                    onChange={handleFormChange}
                    disabled={loadingProjects}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:opacity-60"
                  >
                    <option value="">
                      {loadingProjects ? 'Cargando obras...' : 'Seleccionar obra...'}
                    </option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {loadingProjects && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
                  )}
                </div>
              </div>

              {/* Cuenta de imputación */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Cuenta de Imputación <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="cuentaImputacionId"
                    value={form.cuentaImputacionId}
                    onChange={handleFormChange}
                    disabled={!form.obraImputarId || loadingAccounts}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:opacity-60"
                  >
                    <option value="">
                      {!form.obraImputarId
                        ? 'Primero seleccione una obra'
                        : loadingAccounts
                        ? 'Cargando cuentas...'
                        : 'Seleccionar cuenta...'}
                    </option>
                    {costAccounts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name + " - "+ c.detail}
                      </option>
                    ))}
                  </select>
                  {loadingAccounts && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
                  )}
                </div>
              </div>

              {formError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 border border-slate-200 text-slate-600 font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? 'Guardando...' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
