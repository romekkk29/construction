import React from "react";
import Modal from "./Modal";
import { Trash2 } from "lucide-react";

type ConfirmDeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  loading?: boolean;
};

const ConfirmDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  loading = false,
}: ConfirmDeleteModalProps) => {

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar eliminación">
      <div className="space-y-6">
        {/* Mensaje */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-red-50 text-red-600">
            <Trash2 />
          </div>

          <div>
            <p className="text-slate-700 font-semibold">
              ¿Deseas eliminar{" "}
              <span className="font-bold text-slate-900">
                {itemName}
              </span>
              ?
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Esta acción no se puede deshacer.
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition shadow-lg shadow-red-200"
          >
            {loading ? "Eliminando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDeleteModal;
