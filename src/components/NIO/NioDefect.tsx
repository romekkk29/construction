"use client";
import React, { useState, useEffect } from "react";
import Modal from "../Styles/Modal";
import { Eye } from "lucide-react";
import { apiClient } from './../../api';
import { useAuth } from './../Login/ProtectedRoute';

export default function NioDefectComponent() {
  const [projects, setProjects] = useState<any[]>([]);
  const [niosDefect, setNiosDefect] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      const [projData, niosDefect] = await Promise.all([
        apiClient.projects.list(),
        apiClient.nios.list_nios_defect({ limit: 10, offset: 0 }),
      ]);

      setProjects(projData);
      setNiosDefect(niosDefect);
    };

    fetchData();
  }, []);

  // 🔍 filtro por proyecto
  const filtered = selectedProject === "all"
    ? niosDefect
    : niosDefect.filter((n: any) => String(n.project_id) === selectedProject);

  return (
    <div className="p-6 space-y-6">

      {/* 🔍 FILTRO */}
      <div>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="p-2 border rounded-lg"
        >
          <option value="all">Todos los proyectos</option>
          {projects?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* 📊 TABLA */}
      <div className="overflow-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3 text-left">Usuario</th>
              <th className="p-3">Fecha</th>
              <th className="p-3">Mal estado</th>
              <th className="p-3">Distintos</th>
              <th className="p-3">Recibido</th>
              <th className="p-3">Faltante</th>
              <th className="p-3">Detalle</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filtered?.map((row: any) => (
              <tr key={row.defect_id} className="border-t hover:bg-slate-50">
                
                <td className="p-3">
                  {row.name} {row.last_name}
                </td>

                <td className="p-3">
                  {new Date(row.created_date).toLocaleDateString()}
                </td>

                <td className="p-3 text-center">{row.quantity_bad}</td>
                <td className="p-3 text-center">{row.quantity_distinct}</td>
                <td className="p-3 text-center">{row.quantity_recived}</td>
                <td className="p-3 text-center">{row.quantity_less}</td>

                {/* ✂️ recorte de texto */}
                <td className="p-3 max-w-[200px] truncate">
                  {row.defect_detail}
                </td>

                <td className="p-3 text-center">
                  <button
                    onClick={() => setSelectedRow(row)}
                    className="p-2 hover:bg-slate-200 rounded-lg"
                  >
                    <Eye size={18} />
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🪟 MODAL DETALLE */}
      <Modal
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        title="Detalle completo"
        zIndex={200}
      >
        {selectedRow && (
          <div className="space-y-3 text-sm">

            <p><b>Usuario:</b> {selectedRow.name} {selectedRow.last_name}</p>
            <p><b>Email:</b> {selectedRow.email}</p>

            <p><b>Proyecto ID:</b> {selectedRow.project_id}</p>
            <p><b>NIO ID:</b> {selectedRow.id}</p>

            <hr />

            <p><b>Cant. mal estado:</b> {selectedRow.quantity_bad}</p>
            <p><b>Cant. distintos:</b> {selectedRow.quantity_distinct}</p>
            <p><b>Cant. recibido:</b> {selectedRow.quantity_recived}</p>
            <p><b>Cant. faltante:</b> {selectedRow.quantity_less}</p>

            <hr />

            <p><b>Detalle:</b></p>
            <p className="bg-slate-100 p-3 rounded">{selectedRow.defect_detail}</p>

            <hr />

            <p><b>Insumo:</b> {selectedRow.supply_name}</p>
            <p><b>Código:</b> {selectedRow.code}</p>
            <p><b>Unidad:</b> {selectedRow.unit}</p>

            <hr />
            <p><b>Cantidad Pedida:</b> {selectedRow.quantity}</p>
            <p><b>Proveedor:</b> {selectedRow.supplier}</p>
            <p><b>OC:</b> {selectedRow.oc_number}</p>
            {user.role_id!==2&&user.role_id!==3?
            <>
            <p><b>Precio unitario:</b> {selectedRow.price_individual}</p>
            <p><b>Total:</b> {selectedRow.price_total}</p>          
            </>:null}


          </div>
        )}
      </Modal>

    </div>
  );
}