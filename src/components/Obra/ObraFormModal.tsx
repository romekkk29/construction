import React from "react";
import Modal from "../Styles/Modal";
import { Project, User } from "./../../backend/types";

type ProjectFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: Project) => void;
  initialData?: Project;
  mode: "create" | "edit";
  users:User[];
};

export default function ProjectFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  users
}: ProjectFormModalProps) {
  const isEdit = mode === "edit";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const project: Project = {
      id: initialData?.id ?? 13,
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      startDate: formData.get("startDate") as string,
      durationDays: Number(formData.get("durationDays")),
      projectManager: Number(formData.get("projectManager")),
      generalManager: Number(formData.get("generalManager")),
      client: formData.get("client") as string,
      inspector: formData.get("inspector") as string,
      accounts:
        initialData?.accounts ?? [
          {
            id: 1,
            projectId:1,
            accountNumber: "S.01",
            name: "Stock de Obra",
            detail: "Cuenta de ingresos por liquidación",
            budgeted: 0,
            spent: 0,
            incidence: 0
          },
        ],
      stockBalance: initialData?.stockBalance ?? 0,
    };

    onSubmit(project);
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
              Nombre de la Obra
            </label>
            <input
              name="name"
              required
              defaultValue={initialData?.name}
              type="text"
              placeholder="Ej: Edificio Prisma"
              className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Domicilio
            </label>
            <input
              name="address"
              required
              defaultValue={initialData?.address}
              type="text"
              placeholder="Calle 123..."
              className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Responsables (SELECTS) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Jefe de Obra
            </label>
            <select
              name="projectManager"
              required
              defaultValue={initialData?.projectManager}
              className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Seleccionar Jefe...</option>
              {users
                .filter(u => u.rol.id === 3 || !u.rol.id) // Opcional: filtrar por rol 3
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} {user.lastName}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Gerente de Obra
            </label>
            <select
              name="generalManager"
              required
              defaultValue={initialData?.generalManager}
              className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Seleccionar Gerente...</option>
              {users
                .filter(u => u.rol.id === 2 || !u.rol.id) // Opcional: filtrar por rol 2
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} {user.lastName}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Fechas y cliente */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Fecha Inicio
            </label>
            <input
              name="startDate"
              required
              type="date"
              defaultValue={initialData?.startDate}
              className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Plazo (Días)
            </label>
            <input
              name="durationDays"
              required
              type="number"
              defaultValue={initialData?.durationDays}
              className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Cliente
            </label>
            <input
              name="client"
              required
              defaultValue={initialData?.client}
              type="text"
              className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Inspector */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">
            Inspector
          </label>
          <input
            name="inspector"
            required
            defaultValue={initialData?.inspector}
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
