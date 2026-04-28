import React from "react";
import Modal from "../Styles/Modal";
import { AlertCircle, Camera, FileText, Send } from 'lucide-react';

type NioReport = {
  defective: number;
  wrong: number;
  missing: number;
  good: number; 
  reason: string;
};

type NioDefectiveModalProps = {
  isOpen: boolean;
  onClose: () => void;
  cantidadEsperada: number;
  onSubmit: (data: NioReport) => void;
  nioId?: string | number;
};

export default function NioDefectiveModal({
  isOpen,
  onClose,
  cantidadEsperada,
  onSubmit,
  nioId
}: NioDefectiveModalProps) {

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data: NioReport = {
      defective: Number(formData.get("defective") || 0),
      wrong: Number(formData.get("wrong") || 0),
      missing: Number(formData.get("missing") || 0),
      good: Number(formData.get("good") || 0),
      reason: (formData.get("reason") as string) || "",
    };

    if (data.reason.trim().length < 10) {
      alert("La descripción debe tener al menos 10 caracteres.");
      return;
    }

    if (data.defective === 0 && data.wrong === 0 && data.missing === 0 && data.good === 0) {
      alert("Debes indicar al menos un tipo de problema.");
      return;
    }
    const total =
  data.good + data.defective + data.wrong + data.missing;

  if (total !== cantidadEsperada) {
          alert("La cantidad debe coincidir.");
                return;

  }
    onSubmit(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reportar NIO Defectuosa"
      zIndex={140}
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        
        {/* INFO */}
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl space-y-3">
          <div className="flex gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 shrink-0" />
                <p className="text-sm font-bold text-red-900">Justificar NIO Defectuosa</p>
          </div>

          <div className="text-xs text-red-800 ml-9 space-y-2">
            <p>Utiliza este reporte si el material de la <strong>NIO {nioId ? nioId : ""}</strong> presenta los siguientes problemas:</p>
            <ul className="list-disc pl-4">
              <li>El material llegó fallado o con daños de fábrica.</li>
               <li>El material es incorrecto (no coincide con el pedido).</li> <li>Faltantes totales o parciales en la entrega.</li>
            </ul>

            <div className="flex items-center gap-2 mt-2 p-2 bg-white/50 rounded-lg border border-red-200">
              <Camera className="h-4 w-4 text-red-600" />
              <p className="font-bold">Sacar fotos como evidencia</p>
            </div>
          </div>
        </div>

        {/* INPUTS NUMÉRICOS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InputNumber name="good" label="Buen estado" /> 

          <InputNumber name="defective" label="Mal estado" />
          <InputNumber name="wrong" label="Distintos al pedido" />
          <InputNumber name="missing" label="Faltantes" />

        </div>

        {/* TEXTO */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
            <FileText className="h-3 w-3" /> Descripción
          </label>
          <textarea
            name="reason"
            required
            rows={4}
            placeholder="Explica detalladamente la situación..."
            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 focus:bg-white text-sm resize-none"
          />
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 active:scale-[0.98]"
        >
          <Send className="h-5 w-5" /> Registrar Falla
        </button>

        <button 
          type="button"
          onClick={onClose}
          className="w-full text-slate-400 text-xs font-semibold hover:text-slate-600"
        >
          Cancelar
        </button>
      </form>
    </Modal>
  );
}

/* 🔹 Componente reutilizable */
function InputNumber({ name, label }: { name: string; label: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-slate-500 uppercase">
        {label}
      </label>
      <input
        type="number"
        name={name}
        min={0}
        defaultValue={0}
        className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-red-500 text-sm"
      />
    </div>
  );
}