import React from "react";
import Modal from "../Styles/Modal";
import { Driver, Project, Supply, User } from "./../../backend/types";

type DriverFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: Driver) => void;
  initialData?: Driver;
  mode: "create" | "edit";
};

export default function DriverFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: DriverFormModalProps) {
  const isEdit = mode === "edit";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const driver: Driver = {
      id: initialData?.id ?? 12,
      name: formData.get("name") as string,
      vehicle: formData.get("vehicle") as string,
      phone: Number(formData.get("phone")),
    };

    onSubmit(driver);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Editar chofer" : "Nuevo chofer"}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Nombre + Dirección */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Nombre
            </label>
            <input
              name="name"
              required
              defaultValue={initialData?.name}
              type="text"
              placeholder="Ej: Juan Alvarez"
              className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Vehiculo
            </label>
            <input
              name="vehicle"
              required
              defaultValue={initialData?.vehicle}
              placeholder="Ej: Camioneta"
              type="text"
              className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Fechas y cliente */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Telefono
            </label>
            <input
              name="phone"
              required
              placeholder="2612175525"
              defaultValue={initialData?.phone}
              type="number"
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
          {isEdit ? "Guardar Cambios" : "Guardar Chofer"}
        </button>
      </form>
    </Modal>
  );
}
