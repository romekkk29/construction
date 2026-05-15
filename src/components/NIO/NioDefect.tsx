"use client";
import React, { useState, useEffect } from "react";
import Modal from "../Styles/Modal";
import { Eye } from "lucide-react";
import { apiClient } from './../../api';
import { useAuth } from './../Login/ProtectedRoute';

export default function NioDefectComponent() {
  const [projects, setProjects] = useState<any[]>([]);
  const [niosDefect, setNiosDefect] = useState<any[]>([]);
  const [niosDefectSelec, setNiosDefectSelec] = useState<any[]>([]);

  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [accountDetail, setAccountDetail] = useState('');
  const [unassignModal, setUnassignModal] = useState<{
    open: boolean;
    type: string;
    quantity: number;
    key: string;
  }>({
    open: false,
    type: "",
    quantity: 0,
    key:""
  });

const [creditNoteNumber, setCreditNoteNumber] = useState("");
  const { user } = useAuth();

useEffect(() => {
  const fetchAccount = async () => {
    if (!selectedRow?.project_id || !selectedRow?.account_id) return;

    try {
      const response = await apiClient.costAccounts.list(selectedRow.project_id);

      if (response?.length > 0) {
        const account = response.find(
          (el) => el.id == selectedRow.account_id
        );

        setAccountDetail(account?.detail || '');
      }
    } catch (err: any) {
      alert(err.message || 'Error al traer cuentas');
    }
  };

  fetchAccount();
}, [selectedRow?.project_id, selectedRow?.account_id]);
  const handleUnassign = (
    type: string,
    quantity: number,
    key: string
  ) => {
    setCreditNoteNumber("");
    console.log(type)
    setUnassignModal({
      open: true,
      type,
      quantity,
      key
    });
  };
  const handleChange = async(
      type: string,
      quantity: number,
      key: string
    ) => {
    console.log(selectedRow)
  
    try {
      const payload = {
        id: selectedRow.defect_id,
        status: key=="quantity_bad"?12:key=="quantity_distinct"?13:14
      };

      console.log(payload);

      await apiClient.nios.nios_defect_put(payload);
      fetchData2()
      alert("Cambio realizado");
      setSelectedRow(null)
       setUnassignModal({
      open: false,
      type: "",
      quantity: 0,
      key:""
    });
    } catch (err: any) {
      alert(err.message || "Error al desimputar");
    }
  };
 const confirmUnassign = async () => {
  if (!creditNoteNumber.trim()) {
    alert("El número de nota de crédito es obligatorio");
    return;
  }
  console.log(selectedRow)
  try {
    const payload = {
      nios_defect_id: selectedRow.defect_id,
      account_id: selectedRow.account_id,
      quantity: unassignModal.quantity,
      key: unassignModal.key,
      credit_order: creditNoteNumber,
      price:
        Number(unassignModal.quantity) *
        Number(selectedRow.price_individual),
    };

    console.log(payload);

    await apiClient.nios.nios_defect_imput(payload);

    alert("Desimputación realizada");

    setUnassignModal({
      open: false,
      type: "",
      quantity: 0,
      key:""
    });
    setSelectedRow(null)
    setCreditNoteNumber("");
  } catch (err: any) {
    alert(err.message || "Error al desimputar");
  }
}; 
 const handleSee = async (row) => {
 const response =await apiClient.nios.list_nios_defect_cost({id:row.defect_id});
 setNiosDefectSelec(response)
}; 
const fetchData2 = async () => {
      const [projData, niosDefect] = await Promise.all([
        apiClient.projects.list(),
        apiClient.nios.list_nios_defect({ limit: 10, offset: 0 }),
      ]);

      setProjects(projData);
      setNiosDefect(niosDefect);
    };
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
                    onClick={() => {setSelectedRow(row);handleSee(row)}}
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
        onClose={() => {setSelectedRow(null)}}
        title="Detalle completo"
        zIndex={200}
      >
        {selectedRow && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <p><b>Usuario:</b> {selectedRow.name} {selectedRow.last_name}</p>
              <p><b>Email:</b> {selectedRow.email}</p>
              <p><b>Proyecto:</b> {projects?.find((n: any) => n.id == selectedRow.project_id)?.name || 'N/A'}</p>
              <p><b>NIO ID:</b> {selectedRow.id}</p>

            </div>
             <p><b>CUENTA DE COSTO:</b> {accountDetail}</p>

            <hr />

            {/* Sección de Cantidades con Acciones */}
            <div className="space-y-2">
              <p className="font-bold mb-1 underline">Gestión de Cantidades:</p>
              
              {[
                { label: "Cant. mal estado", value: selectedRow.quantity_bad, key: "quantity_bad",num:12 },
                { label: "Cant. distintos", value: selectedRow.quantity_distinct, key: "quantity_distinct",num:13 },
                { label: "Cant. recibido", value: selectedRow.quantity_recived, key: "quantity_recived",num:15},
                { label: "Cant. faltante", value: selectedRow.quantity_less, key: "quantity_less",num:14 }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-100">
                  <p><b>{item.label}:</b> {item.value}</p>
                {(item.value > 0 && item.key!="quantity_recived" && user.role_id !== 7 && user.role_id !== 4 && user.role_id !== 6 && user.role_id !== 2 && user.role_id !== 3 && niosDefectSelec.filter(el=>el.key === item.key).length < 1 && selectedRow.defect_status!=item.num)?
                  <>
                  <button
                   onClick={() =>
                          handleUnassign(accountDetail, item.value,item.key)
                        }
                    className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1 rounded text-xs font-medium transition-colors border border-red-200"
                   >
                    Desimputar a cuenta de costo
                  </button>
                  <button
                   onClick={() =>
                          handleChange(accountDetail, item.value,item.key)
                        }
                    className="bg-green-50 text-green-600 hover:bg-red-600 hover:text-white px-3 py-1 rounded text-xs font-medium transition-colors border border-red-200"
                   >
                    Cambiar producto
                  </button>
                  </>
                  :niosDefectSelec.filter(el=>el.key === item.key).length > 0?
                  <p>Cuenta desimputada. Numero de nota de credito: {niosDefectSelec.find(el=>el.key === item.key)?.credit_order}</p>
                  :selectedRow.defect_status==item.num?<p>Se ordeno cambio de producto</p>
                  :null}
                </div>
              ))}
            </div>

            <hr />

            <div>
              <p><b>Detalle:</b></p>
              <p className="bg-slate-100 p-3 rounded mt-1">{selectedRow.defect_detail || "Sin detalles"}</p>
            </div>

            <hr />

            <div className="grid grid-cols-2 gap-2">
              <p><b>Insumo:</b> {selectedRow.supply_name}</p>
              <p><b>Código:</b> {selectedRow.code}</p>
              <p><b>Unidad:</b> {selectedRow.unit}</p>
              <p><b>Cantidad Pedida:</b> {selectedRow.quantity}</p>
              <p><b>Proveedor:</b> {selectedRow.supplier}</p>
              <p><b>OC:</b> {selectedRow.oc_number}</p>
            </div>

            {user.role_id !== 2 && user.role_id !== 3 && (
              <div className="bg-blue-50 p-2 rounded">
                <p><b>Precio unitario:</b> ${selectedRow.price_individual}</p>
                <p><b>Total:</b> ${selectedRow.price_total}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
<Modal
  isOpen={unassignModal.open}
  onClose={() =>
    setUnassignModal({
      open: false,
      type: "",
      quantity: 0,
      key:""
    })
  }
  title="Desimputar cuenta de costo"
  zIndex={300}
>
  <div className="space-y-4">

    <div className="bg-slate-50 border rounded p-3 text-sm">
      <p>
        <b>Cuenta:</b> {unassignModal.type}
      </p>

      <p>
        <b>Cantidad:</b> {unassignModal.quantity}
      </p>

      <p>
        <b>Precio unitario:</b> $
        {selectedRow?.price_individual}
      </p>

      <p className="text-base mt-2">
        <b>Total:</b> $
        {(
          Number(unassignModal.quantity) *
          Number(selectedRow?.price_individual || 0)
        ).toFixed(2)}
      </p>
    </div>

    <div>
      <label className="block text-sm font-medium mb-1">
        Número de Orden / Nota de Crédito *
      </label>

      <input
        type="text"
        value={creditNoteNumber}
        onChange={(e) =>
          setCreditNoteNumber(e.target.value)
        }
        className="w-full border rounded-lg p-2"
        placeholder="Ingrese número"
      />
    </div>

    <div className="flex justify-end gap-2">
      <button
        onClick={() =>
          setUnassignModal({
            open: false,
            type: "",
            quantity: 0,
            key:""
          })
        }
        className="px-4 py-2 rounded border"
      >
        Cancelar
      </button>

      <button
        onClick={()=>confirmUnassign()}
        className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
      >
        Confirmar desimputación
      </button>
    </div>
  </div>
</Modal>
    </div>
  );
}