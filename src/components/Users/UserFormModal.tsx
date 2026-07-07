import React, { useState, useEffect } from "react";
import Modal from "../Styles/Modal";
import { Role, User, Project } from "./../../backend/types";

const CLIENT_ROLE_ID = 8;

type UserFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: User) => void;
  initialData?: User;
  mode: "create" | "edit";
  roles: Role[];
  projects: Project[];
};

export default function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  roles,
  projects
}: UserFormModalProps) {
  const isEdit = mode === "edit";
  const [selectedRoleId, setSelectedRoleId] = useState<number>(initialData?.rol?.id ?? 0);
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>(initialData?.projectIds ?? []);

  useEffect(() => {
    setSelectedRoleId(initialData?.rol?.id ?? 0);
    setSelectedProjectIds(initialData?.projectIds ?? []);
  }, [initialData]);

  const toggleProject = (projectId: number) => {
    setSelectedProjectIds(prev =>
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const roleId = Number(formData.get("rolId"));
    const role = roles.find(r => r.id === roleId);

    if (!role) {
      alert("Rol inválido");
      return;
    }

    const user: User = {
      id: initialData?.id ?? 1,
      name: formData.get("name") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      rol: {
        id: role.id,
        name: role.name
      },
      ...(roleId === CLIENT_ROLE_ID && { projectIds: selectedProjectIds })
    };

    onSubmit(user);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Editar Usuario" : "Nuevo Usuario"}
      zIndex={50}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Nombre + Apellido */}
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
              placeholder="Ej: Pepe"
              className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Apellido
            </label>
            <input
              name="lastName"
              required
              defaultValue={initialData?.lastName}
              type="text"
              placeholder="Ej: Suarez"
              className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Email + Rol */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Email
            </label>
            <input
              name="email"
              required
              defaultValue={initialData?.email}
              type="text"
              className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Rol
            </label>
            <select
              name="rolId"
              required
              value={selectedRoleId || ""}
              onChange={e => setSelectedRoleId(Number(e.target.value))}
              className="
                w-full p-2 border rounded-xl outline-none bg-white
                focus:ring-2 focus:ring-blue-500
              "
            >
              <option value="" disabled>
                Seleccione un rol
              </option>

              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Obras asociadas — solo visible para rol Cliente (id 8) */}
        {selectedRoleId === CLIENT_ROLE_ID && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Obras Asociadas
            </label>
            <div className="border rounded-xl p-3 max-h-48 overflow-y-auto space-y-1 bg-slate-50">
              {projects.length === 0 ? (
                <p className="text-sm text-slate-400">No hay obras disponibles</p>
              ) : (
                projects.map(project => (
                  <label
                    key={project.id}
                    className="flex items-center gap-3 cursor-pointer hover:bg-white rounded-lg px-2 py-1.5 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedProjectIds.includes(project.id)}
                      onChange={() => toggleProject(project.id)}
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                    <span className="text-sm text-slate-700">{project.name}</span>
                  </label>
                ))
              )}
            </div>
            {selectedProjectIds.length > 0 && (
              <p className="text-xs text-blue-600 font-medium">
                {selectedProjectIds.length} obra{selectedProjectIds.length !== 1 ? "s" : ""} seleccionada{selectedProjectIds.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="
            w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-4
            shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors
          "
        >
          {isEdit ? "Guardar Cambios" : "Guardar Usuario"}
        </button>
      </form>
    </Modal>
  );
}
