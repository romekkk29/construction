import React, { useState, useEffect } from "react";
import Modal from "../Styles/Modal";
import { CostAccount } from "./../../backend/types";

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

  // Estado para manejar la visualización del input (string con formato)
  const [displayBudget, setDisplayBudget] = useState("");
  const [displaySpentExpected, setDisplaySpentExpected] = useState("");

  // Funciones de utilidad
  const formatVisual = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val.replace(/\./g, "").replace(",", ".")) : val;
    if (isNaN(num)) return "";
    return num.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const cleanNumber = (val: string): number => {
    // Quita los puntos de miles y cambia la coma por punto
    const clean = val.replace(/\./g, "").replace(",", ".");
    return parseFloat(clean) || 0;
  };

  // Inicializar el valor si estamos editando
  useEffect(() => {
    if (initialData?.budgeted) {
      setDisplayBudget(formatVisual(initialData.budgeted));
    } else {
      setDisplayBudget("");
    }
    if (initialData?.spentExpected) {
      setDisplaySpentExpected(formatVisual(initialData.spentExpected));
    } else {
      setDisplaySpentExpected("");
    }
  }, [initialData, isOpen]);

const formatInput = (value: string): string => {
  value = value.replace(/[^0-9,]/g, "");
  const parts = value.split(",");
  if (parts.length > 2) return value;
  let integerPart = parts[0];
  const decimalPart = parts[1];
  if (integerPart) {
    integerPart = parseInt(integerPart, 10).toLocaleString("de-DE");
  }
  return parts.length > 1 ? `${integerPart},${decimalPart ?? ""}` : integerPart;
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setDisplayBudget(formatInput(e.target.value));
};

const handleChangeSpentExpected = (e: React.ChangeEvent<HTMLInputElement>) => {
  setDisplaySpentExpected(formatInput(e.target.value));
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  
  // Limpieza final para la base de datos: quitar puntos y cambiar coma por punto
  const finalBudget = parseFloat(displayBudget.replace(/\./g, "").replace(",", "."));
  const finalSpentExpected = parseFloat(displaySpentExpected.replace(/\./g, "").replace(",", "."));
  
  const costAccount: CostAccount = {
    ...initialData,
    id: initialData?.id ?? 0,
    name: (e.currentTarget.elements.namedItem("name") as HTMLInputElement).value,
    detail: (e.currentTarget.elements.namedItem("detail") as HTMLInputElement).value,
    budgeted: isNaN(finalBudget) ? 0 : finalBudget,
    spentExpected: isNaN(finalSpentExpected) ? 0 : finalSpentExpected
  };

  onSubmit(costAccount);
};

  const handleBlur = () => {
    setDisplayBudget(formatVisual(displayBudget));
  };

  const handleBlurSpentExpected = () => {
    setDisplaySpentExpected(formatVisual(displaySpentExpected));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Editar Cuenta Costo" : "Nueva Cuenta Costo"}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Cuenta</label>
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
            <label className="text-xs font-bold text-slate-500 uppercase">Detalle</label>
            <input
              name="detail"
              required
              defaultValue={initialData?.detail}
              type="text"
              className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Presupuesto</label>
            <input
              type="text"
              value={displayBudget}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="0,00"
              className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Gasto Esperado</label>
            <input
              type="text"
              value={displaySpentExpected}
              onChange={handleChangeSpentExpected}
              onBlur={handleBlurSpentExpected}
              placeholder="0,00"
              className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-4 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
        >
          {isEdit ? "Guardar Cambios" : "Guardar Cuenta"}
        </button>
      </form>
    </Modal>
  );
}