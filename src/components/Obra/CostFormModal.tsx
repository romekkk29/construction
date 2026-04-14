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
  }, [initialData, isOpen]);

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  let value = e.target.value;

  // 1. Eliminar todo lo que no sea número o coma
  value = value.replace(/[^0-9,]/g, "");

  // 2. Evitar más de una coma
  const parts = value.split(",");
  if (parts.length > 2) return;

  // 3. Formatear la parte entera con puntos de miles
  let integerPart = parts[0];
  let decimalPart = parts[1];

  if (integerPart) {
    // Convertimos a número para usar toLocaleString y luego a string de nuevo
    const number = parseInt(integerPart, 10);
    integerPart = number.toLocaleString("de-DE");
  }

  // 4. Reconstruir el string visual
  // Si hay una coma, la mantenemos (aunque decimalPart esté vacío para que pueda seguir escribiendo)
  const formattedValue = parts.length > 1 ? `${integerPart},${decimalPart ?? ""}` : integerPart;

  setDisplayBudget(formattedValue);
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  
  // Limpieza final para la base de datos: quitar puntos y cambiar coma por punto
  const finalValue = parseFloat(displayBudget.replace(/\./g, "").replace(",", "."));
  
  const costAccount: CostAccount = {
    ...initialData,
    id: initialData?.id ?? 0,
    name: (e.currentTarget.elements.namedItem("name") as HTMLInputElement).value,
    detail: (e.currentTarget.elements.namedItem("detail") as HTMLInputElement).value,
    budgeted: isNaN(finalValue) ? 0 : finalValue
  };

  onSubmit(costAccount);
};

  const handleBlur = () => {
    // Al salir del input, aplicamos el formato bonito 1.000.000,00
    setDisplayBudget(formatVisual(displayBudget));
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

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1 col-span-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Presupuesto</label>
            <input
              type="text" // Cambiado a text para soportar puntos/comas visuales
              value={displayBudget}
              onChange={handleChange}
              onBlur={handleBlur}
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