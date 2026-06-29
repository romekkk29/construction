import React, { useState } from "react";
import Modal from "../Styles/Modal";

type CajaFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
};

export default function CajaFormModal({ isOpen, onClose, onSubmit }: CajaFormModalProps) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setName("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(name.trim());
      setName("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nueva Caja" zIndex={50}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">
            Nombre de la Caja
          </label>
          <input
            required
            autoFocus
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Gastos varios"
            className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-4 shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {submitting ? "Guardando..." : "Guardar Caja"}
        </button>
      </form>
    </Modal>
  );
}
