import React from "react";
import Modal from "../Styles/Modal";
import { TrendingUp, AlertTriangle, Percent } from 'lucide-react';

type InflationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (percentage: number) => void;
  projectName?: string;
};

export default function InflationModal({
  isOpen,
  onClose,
  onSubmit,
  projectName
}: InflationModalProps) {

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const percentage = Number(formData.get("percentage"));
    
    if (percentage > 0) {
      onSubmit(percentage);
    } else {
      alert("Por favor, ingresa un porcentaje válido.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Aumento por Inflación"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        
        {/* Alerta de advertencia */}
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3">
          <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-amber-900">Atención</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              Al registrar este aumento para <strong>{projectName || "esta obra"}</strong>, se incrementará el presupuesto de <strong>todas las cuentas</strong> de forma automática. Este evento quedará registrado históricamente con la fecha actual.
            </p>
          </div>
        </div>

        {/* Campo de Porcentaje */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
            <Percent className="h-3 w-3" /> Porcentaje de aumento (%)
          </label>
          <div className="relative">
            <input
              name="percentage"
              required
              type="number"
              step="0.01"
              min="0"
              autoFocus
              placeholder="Ej: 4.5"
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-2xl font-black text-slate-800"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
              %
            </div>
          </div>
        </div>

        {/* Botón de acción */}
        <button
          type="submit"
          className="
            w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2
            shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-[0.98]
          "
        >
          <TrendingUp className="h-5 w-5" /> Aplicar Aumento
        </button>

        <p className="text-[10px] text-center text-slate-400 font-medium">
          Esta acción es irreversible. Se generará un registro de auditoría.
        </p>
      </form>
    </Modal>
  );
}