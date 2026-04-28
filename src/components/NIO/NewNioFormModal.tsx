import React, { useState, useEffect,useMemo } from "react";
import Modal from "../Styles/Modal";
import { Project, Supply, User } from "../../backend/types";
import { apiClient } from './../../api';

import { 
  Send, 
  Calendar, 
  Plus, 
  Trash2, 
  Package, 
  ShoppingCart 
} from 'lucide-react';



type ProjectFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  projectSelect: Project;
  addSupply: (data: any) => void;
  onSubmit: (data: any) => void;
  supplies:Supply[];
  initialData?: Project;
  users: User[];
};

interface PurchaseItem {
  id: string;
  accountId: string;
  accountName: string;
  supply: Supply; // Ahora guarda el objeto completo
  quantity: number;
  detail: string;
}

export default function NioFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  projectSelect,
  addSupply,
  users,
  supplies
}: ProjectFormModalProps) {
  // --- ESTADOS PARA LA LISTA DINÁMICA ---
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [showForm, setShowForm] = useState(true); // Controla si se ven los campos de carga
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpenSelect, setIsOpenSelect] = useState(false);
  const [needDate, setNeedDate] = useState("");
  const [idsDelete, setIdsDelete] = useState([]);

  // Estado para los campos actuales del formulario
  const [currentItem, setCurrentItem] = useState({
      accountId: "",
      supplyId: "", // ID del select
      manualName: "", // Por si crea uno nuevo
      detail: "", // Por si crea uno nuevo
      unit: "",
      quantity: ""
    });
    const filteredSupplies = useMemo(() => {
      return supplies.filter(s => 
        s.detail.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }, [searchTerm, supplies]);
    const handleSelect = (supply) => {
      setCurrentItem({
        ...currentItem,
        supplyId: supply.id.toString(),
        unit: supply.unit,
        manualName: ""
      });
      setSearchTerm(`[${supply.code}] ${supply.detail}`);
      setIsOpenSelect(false);
    };
    const handleCreateNew = () => {
      setCurrentItem({
        ...currentItem,
        supplyId: "new",
        unit: "",
        manualName: ""
      });
      setSearchTerm("CREAR NUEVO INSUMO");
      setIsOpenSelect(false);
    };
    const handleCreateSupply = async(supply: Supply,account) => {        
       try {
         const response = await apiClient.supplies.create([supply]);          
         let newIdSupply={...supply,id:response[0].id,bestPrice:null}  
          const newItem: PurchaseItem = {
            id: Math.random().toString(36).substr(2, 9),
            accountId: currentItem.accountId,
            detail: currentItem.detail || "",
            accountName: account?.name || "Sin nombre",
            supply: newIdSupply,
            quantity: Number(currentItem.quantity)
          };
          setItems([...items, newItem]);
          addSupply(newIdSupply)
       } catch (err: any) {
         alert(err.message || 'Error al crear insumo');
       }
     };
  const handleAddItem = () => {
      const isManual = currentItem.supplyId === "new";
      const selectedSupply = supplies.find(s => s.id?.toString() === currentItem.supplyId);

      if (!currentItem.accountId || (!selectedSupply && !currentItem.manualName) || !currentItem.quantity) {
        alert("Faltan datos críticos para agregar el ítem.");
        return;
      }

    const account = projectSelect?.accounts?.find(a => a.id.toString() === currentItem.accountId);
  // Construcción del objeto Supply según tu interfaz
      const finalSupply: Supply = isManual ? {
        code: Math.random().toString(36).substr(2, 9),
        detail: currentItem.manualName,
        unit: currentItem.unit,
        isEnable: true
      } : { ...selectedSupply! };  
    const newItem: PurchaseItem = {
          id: Math.random().toString(36).substr(2, 9),
          accountId: currentItem.accountId,
          detail: currentItem.detail || "",
          accountName: account?.name || "Sin nombre",
          supply: finalSupply,
          quantity: Number(currentItem.quantity)
        };
    if(isManual){
          handleCreateSupply(finalSupply,account)    
    }else{
      setItems([...items, newItem]);
    }
    setCurrentItem({ accountId: "", supplyId: "", manualName: "", unit: "", quantity: "",detail: "" });
    setSearchTerm("");
    setShowForm(false);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    if (items.length === 1) setShowForm(true);
  };

const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert("Debes agregar al menos un ítem a la lista");
      return;
    }
    if(initialData){
    onSubmit({
      ...(initialData && { id: initialData.id }), // Si editamos, mandamos el ID
      projectId: projectSelect.id,
      needDate: needDate,
      items: items,
      idsDelete:idsDelete
    });
    }else{
    onSubmit({
      ...(initialData && { id: initialData.id }), // Si editamos, mandamos el ID
      projectId: projectSelect.id,
      needDate: needDate,
      items: items
    });
    }

  };
useEffect(() => {
    if (isOpen) {
      console.log(initialData)
      setIdsDelete([])
      if (initialData) {

        // Mapeamos los ítems que vienen de la DB al formato PurchaseItem del estado
        const mappedItems: PurchaseItem[] = initialData.items.map((item: any) => ({
          id: item.id || Math.random().toString(36).substr(2, 9),
          accountId: item.accountId.toString(),
          accountName: projectSelect?.accounts?.find(a => a.id === item.accountId)?.name || "Cuenta",
          supply: item.supply,
          quantity: item.quantity,
          detail: item.detail || ""
        }));
        
        setItems(mappedItems);
        // Formateamos la fecha para el input type="date" (YYYY-MM-DD)
        if (initialData.needDate) {
           setNeedDate(new Date(initialData.needDate).toISOString().split('T')[0]);
        }
        setShowForm(false); // Ocultamos el formulario de carga inicial si ya hay ítems
      } else {
        // Reset si es creación nueva
        setIdsDelete([])
        setItems([]);
        setNeedDate("");
        setShowForm(true);
      }
    }
  }, [isOpen, projectSelect]);
  return (
    <Modal isOpen={isOpen} onClose={onClose}title={initialData ? `Editando NIO #${initialData.id}` : "Iniciar Necesidad Interna de Obra (NIO)"}>
      <form className="space-y-6" onSubmit={handleFinalSubmit}>
        
        {/* Header de Info (Tus campos originales) */}
        <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {initialData ? "Fecha Original" : "Fecha de Creación"}
            </p>
            <p className="font-bold text-slate-700">
                {initialData ? new Date(initialData.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Obra Destino</label>
            <p className="font-medium text-emerald-700">{projectSelect?.name || "No seleccionada"}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha necesidad en obra</p>
            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <input 
                name="needDate" 
                type="date" 
                required 
                value={needDate} // Input controlado
                onChange={(e) => setNeedDate(e.target.value)}
                className="outline-none text-sm font-bold text-slate-800" 
              />
            </div>
          </div>
        </div>

        {/* --- LISTA DE ÍTEMS AGREGADOS --- */}
        {/* TABLA DE ITEMS */}
        {items.length > 0 && (
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold">
                <tr>
                  <th className="p-3">Cod.</th>
                  <th className="p-3">Detalle</th>
                  <th className="p-3">Cant.</th>
                  <th className="p-3">Cuenta</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {items.map((item) => (
                  
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono text-[10px] text-slate-400">{item.supply.code }</td>
                    <td className="p-3 font-semibold text-slate-700">
                      {item.supply.detail}
                      {!item.supply.id && <span className="ml-2 text-[8px] bg-blue-100 text-blue-600 px-1 rounded">NUEVO</span>}
                    </td>
                    <td className="p-3">
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-bold">
                        {item.quantity} {item.supply.unit}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 text-xs">{item.accountName}</td>
                    <td className="p-3 text-right">
                      <button type="button" onClick={() => {
                        
                        removeItem(item.id);
                          if(initialData){
                              setIdsDelete(prevItems => [...prevItems, item.id]);
                          }}
                      } className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                  
                ))

                }
              </tbody>
            </table>
          </div>
        )}
        {/* --- FORMULARIO DE CARGA DE ÍTEM (SELECTIVO) --- */}
      {/* FORMULARIO DE CARGA */}
        {showForm ? (
          <div className="bg-emerald-50/30 p-5 rounded-2xl border-2 border-dashed border-emerald-200 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-emerald-700 uppercase">Cuenta Imputación</label>
              <select 
                value={currentItem.accountId}
                onChange={(e) => setCurrentItem({...currentItem, accountId: e.target.value})}
                className="w-full p-3 border-2 border-emerald-100 rounded-xl bg-white"
              >
                <option value="">Seleccionar Cuenta...</option>
                {projectSelect?.accounts?.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name +" "+ acc.detail}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 relative">
                <label className="text-xs font-bold text-emerald-700 uppercase">Insumo o Servicio</label>
                
                {/* Input de búsqueda que actúa como Select */}
                <input
                  type="text"
                  placeholder="Buscar o seleccionar insumo..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsOpenSelect(true);
                  }}
                  onFocus={() => setIsOpenSelect(true)}
                  className="w-full p-3 border-2 border-emerald-100 rounded-xl bg-white mb-2 focus:border-emerald-400 outline-none"
                />

                {/* Lista desplegable personalizada */}
                {isOpenSelect && (
                  <div className="absolute z-10 w-full bg-white border-2 border-emerald-100 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {/* LA OPCIÓN DE CREAR SIEMPRE PRIMERO */}
                    <div 
                      onClick={handleCreateNew}
                      className="p-3 cursor-pointer hover:bg-blue-50 text-blue-600 font-bold border-b border-gray-100"
                    >
                      + CREAR NUEVO INSUMO...
                    </div>

                    {filteredSupplies.length > 0 ? (
                      filteredSupplies.map(s => (
                        <div 
                          key={s.id} 
                          onClick={() => handleSelect(s)}
                          className="p-3 cursor-pointer hover:bg-emerald-50 text-gray-700 border-b border-gray-50 last:border-none"
                        >
                          [{s.code}] {s.detail}
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-gray-400 italic text-sm">No se encontraron resultados</div>
                    )}
                  </div>
                )}

                {/* Campo para nombre manual si es nuevo */}
                {currentItem.supplyId === "new" && (
                  <input 
                    value={currentItem.manualName}
                    onChange={(e) => setCurrentItem({...currentItem, manualName: e.target.value})}
                    placeholder="Escribe el nombre del nuevo insumo..." 
                    className="w-full p-3 border-2 border-blue-200 rounded-xl bg-white animate-in slide-in-from-top-1" 
                  />
                )}
              </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-700 uppercase">Unidad</label>
                <input 
                  value={currentItem.unit}
                  disabled={currentItem.supplyId !== "new" && currentItem.supplyId !== ""}
                  onChange={(e) => setCurrentItem({...currentItem, unit: e.target.value})}
                  placeholder="kg, m3, unidad..." 
                  className="w-full p-3 border-2 border-emerald-100 rounded-xl bg-white disabled:bg-slate-100 disabled:text-slate-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-700 uppercase">Cantidad</label>
                <input 
                  type="number"
                  value={currentItem.quantity}
                  onChange={(e) => setCurrentItem({...currentItem, quantity: e.target.value})}
                  placeholder="0.00" 
                  className="w-full p-3 border-2 border-emerald-100 rounded-xl bg-white" 
                />
              </div>
            </div>
            <div className="grid">
              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-700 uppercase">Detalle</label>
                <input 
                  type="text"
                  value={currentItem.detail}
                  onChange={(e) => setCurrentItem({...currentItem, detail: e.target.value})}
                  placeholder="" 
                  className="w-full p-3 border-2 border-emerald-100 rounded-xl bg-white" 
                />
              </div>
            </div>
            <button type="button" onClick={handleAddItem} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
              <Plus className="h-5 w-5" /> Confirmar e incluir
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setShowForm(true)} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 flex items-center justify-center gap-2">
            <Package className="h-5 w-5" /> + Agregar otra compra a la lista
          </button>
        )}

        <button 
          type="submit" 
          disabled={items.length === 0}
          className={`w-full py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-3 
            ${items.length === 0 ? "bg-slate-100 text-slate-400" : "bg-slate-900 text-white shadow-xl shadow-slate-200"}`}
        >
          <Send className="h-6 w-6" /> 
          {initialData ? "Actualizar Pedido" : "Guardar Pedido"}
        </button>
      </form>
    </Modal>
  );
}