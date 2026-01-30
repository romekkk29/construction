import React from "react";
import Modal from "../Styles/Modal";
import { CostAccount  } from "./../../backend/types";

type CostAccountFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (costAccount: CostAccount) => void;
  initialData?: CostAccount;
  mode: "create" | "edit";
};

export default function CostFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode
}: CostAccountFormModalProps) {
  const isEdit = mode === "edit";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const costAccount: CostAccount = {
      id: initialData?.id ?? 13,
      projectId:initialData?.projectId ?? 13,
      name: formData.get("name") as string,
      detail: formData.get("detail") as string,
      budgeted: Number(formData.get("budgeted"))
    };

    onSubmit(costAccount);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Editar Cuenta Costo" : "Nueva Cuenta Costo"}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Nombre + Dirección */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Cuenta
            </label>
            <input
              name="name"
              required
              defaultValue={initialData?.name}
              type="text"
              placeholder="Ej: ARQ 1.3.2"
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


        <div className="grid grid-cols-3 gap-4">


          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Presupuesto
            </label>
            <input
              name="budgeted"
              required
              type="number"
              defaultValue={initialData?.budgeted}
              className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>


        </div>


        {/* Submit */}
        <button
          type="submit"
          className="
            w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-4
            shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors
          "
        >
          {isEdit ? "Guardar Cambios" : "Guardar Cuenta"}
        </button>
      </form>
    </Modal>
  );
}
