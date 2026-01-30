import React from "react";
import Modal from "../Styles/Modal";
import { Project, Supply, User } from "./../../backend/types";

type InsumoFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: Supply) => void;
  initialData?: Supply;
  mode: "create" | "edit";
};

export default function InsumoFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: InsumoFormModalProps) {
  const isEdit = mode === "edit";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const supply: Supply = {
      id: initialData?.id ?? 13,
      code: formData.get("code") as string,
      detail: formData.get("detail") as string,
      unit: formData.get("unit") as string,
      bestPrice: Number(formData.get("bestPrice")),
      bestSupplier: formData.get("bestSupplier") as string
    };

    onSubmit(supply);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Editar Obra" : "Nueva Obra"}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Nombre + Dirección */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Codigo insumo
            </label>
            <input
              name="code"
              required
              defaultValue={initialData?.code}
              type="text"
              placeholder="Ej: 001"
              className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Detalle
            </label>
            <input
              name="detail"
              required
              defaultValue={initialData?.detail}
              type="text"
              className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Fechas y cliente */}
        <div className="grid grid-cols-3 gap-4">




          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Unidad
            </label>
            <input
              name="unit"
              required
              defaultValue={initialData?.unit}
              type="text"
              className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Mejor Precio
            </label>
            <input
              name="bestPrice"
              required
              type="number"
              defaultValue={initialData?.bestPrice}
              className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        {/* Inspector */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">
            Mejor Proveedor
          </label>
          <input
            name="bestSupplier"
            required
            defaultValue={initialData?.bestSupplier}
            type="text"
            placeholder="Nombre del Inspector"
            className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="
            w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-4
            shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors
          "
        >
          {isEdit ? "Guardar Cambios" : "Guardar Obra"}
        </button>
      </form>
    </Modal>
  );
}
