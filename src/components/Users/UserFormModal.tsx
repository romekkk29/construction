import React from "react";
import Modal from "../Styles/Modal";
import { Role, User } from "./../../backend/types";

type UserFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: User) => void;
  initialData?: User;
  mode: "create" | "edit";
  roles: Role[];
};

export default function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  roles
}: UserFormModalProps) {
  const isEdit = mode === "edit";

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
      id: initialData?.id ?? `P-${Date.now()}`,
      name: formData.get("name") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      rol: {
        id: role.id,
        name: role.name
      }
    };

    onSubmit(user);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Editar Usuario" : "Nuevo Usuario"}
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
              defaultValue={initialData?.rol?.id ?? ""}
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
