import React, {useState,useEffect,useRef} from "react";

import NioFormModal from "./NewNioFormModal";
import NioDefectiveModal from "./DefecModal";

import { Role, Project,User,CostAccount, Supply, NIOS, NIOSupplier,NIOStatus,Driver} from "@/src/backend/types";
import { apiClient } from './../../api';
import { Trash2,RefreshCw,Plus,Pencil, ClipboardList,X, Truck,Send,BrainCircuit, CheckCircle2, Clock,Construction,ArrowRight,ArrowLeft,Package,Calendar} from "lucide-react";
import { useAuth } from './../Login/ProtectedRoute';
import ConfirmDeleteModal from "@/src/components/Styles/DeleteModal";

export default function NioComponent() {
    const [isProjectModalOpen,setIsProjectModalOpen] = useState(false);
    const [supplies,setSupplies]= useState<Supply[]>([]);
    const [nios,setNios]= useState<NIOS[]>([]);
    const [nioToEdit,setNioToEdit]= useState<NIOS | null | undefined>(null);

    const [selectedNio,setSelectedNio]= useState<NIOS[] | null>(null);
    const [selectedNioOne,setSelectedNioOne]= useState<NIOS | null>(null);

    const [niosSupplier,setNiosSupplier]= useState<NIOSupplier[]>([]);
    const [niosSupplySells,setNiosSupplySells]= useState<NIOSupplier[]>([]);
    const [niosDrivers,setNiosDrivers]= useState<NIOSupplier[]>([]);

    const [drivers, setDrivers] = useState<Driver[]>([]);

    
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(() => {
    const saved = localStorage.getItem("selectedProject");
    // Si existe, lo parseamos; si no, devolvemos null
    return saved ? JSON.parse(saved) : null;
  }); 
  const [refreshCount, setRefreshCount] = useState(0);
    const [isDeleteNio, setIsDeleteNio] = useState<Boolean>(false);
    const [isDefectNio, setIsDefectNio] = useState<Boolean>(false);

    const [seletecItemDefect, setSelecItemDefect] = useState<any>(false);

    const [users, setUsers] = useState<User[]>([]);
    const [loading,setLoading]= useState<Boolean>(false);
    const formatCurrency = (value) => {
      // 1. Convertimos a número por si acaso es un string
      const number = parseFloat(value);

      // 2. Validamos que sea un número válido
      if (isNaN(number)) return "0,00";

      // 3. Aplicamos el formato
      return number.toLocaleString('es-AR', { // 'es-AR' o 'de-DE' usan punto para miles
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };
    const  handleOpenNio=()=>{
        if(user.role_id!==1&&user.role_id!==2&&user.role_id!==3){
            alert("sin permisos")
            return
        }
        setIsProjectModalOpen(true)
      } 
    const handleSentDriver = async (item) => {
      // 1. Buscamos la data necesaria
      let driver = drivers?.find(d => d.id == item.driverId);
      let prod = supplies?.find(d => d.id == item.supplyId);

      // 2. Validación de permisos
      if (user.role_id !== 1 && user.role_id !== 5 && user.role_id !== 6) {
        alert("Sin permisos");
        return;
      }

      // 3. Preparación del mensaje de WhatsApp
      if (driver && driver.phone) {
        const message = `*Nueva Orden de Retiro/Entrega*%0A%0A` +
          `*Obra a entregar:* ${selectedProject.name}%0A` +
          `*Dirección:* ${selectedProject.address}%0A` +

          `*Proveedor:* ${item.supplier}%0A` +
          `*Producto:* ${prod?.detail || 'N/A'}%0A` +
          `*Cantidad:* ${item.quantity} ${prod?.unit || ''}%0A` +
          `*N° Orden:* ${item.oc_number}%0A` +
          `*Nota:* ${item.detail || 'Sin notas'}%0A%0A` +
          `_Por favor, confirmar recepción._`;

        // Limpiamos el número (quitamos espacios o caracteres especiales si los hay)
        const cleanPhone = driver.phone.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;

        // Abrimos WhatsApp en una nueva pestaña
        window.open(whatsappUrl, '_blank');
      } else {
        console.warn("El conductor no tiene un teléfono registrado.");
      }

      // 4. Actualización de estado local (Optimistic Update)
      setNiosSupplier(prev => prev.map(it => {
        if (it.id === item.id) {
          return { ...it, status: 4, driver_date: new Date().toLocaleDateString() };
        }
        return it;
      }));

      // 5. Llamada a la API
      try {
        const payload = {
          niosDriver: item,
          user: user.id
        };
        const everySup=niosSupplier.filter(el=>el.niosId===item.niosId && el.id!==item.id && el.status<4)
        await apiClient.nios.createDriver(payload);
        if(everySup &&everySup.length===0){
          handleTransitAllLogicT()
          setRefreshCount(prev => prev + 1);

          }
          
        // El refresh sucede después de la redirección y el guardado
      } catch (err) {
        alert(err.message || 'Error al procesar la solicitud');
      }
    };
    const handleRefres=()=>{
          setRefreshCount(prev => prev + 1);
    }    
    const handleReceptionSave=async(item)=>{
        if(user.role_id!==1&&user.role_id!==2&&user.role_id!==3){
            alert("sin permisos")
            return
        }
      if(!item.quantity_less){
        alert("Cantidad faltante ?")
        return
      }
      if(parseFloat(item.quantity_less)>item.quantity){
        alert("Indique una cantidad menor o igual a la solicitada")
        return
      }
      const payload={
        niosReception:item,
        user:user.id,
        id:item.nios_drivers_id
      }
      if(item.quantity_less==0){
        setNiosSupplier(prev => prev.map(it => {
        if (it.id === item.id) {
          return { ...it, status: 5, reception_date:new Date().toLocaleDateString()};
        }
        return it;
      }));
      }
      try {
          const response = await apiClient.nios.createReception(payload);
          const everySup=niosSupplier.filter(el=>el.niosId===item.niosId && el.id!==item.id && el.status!==5)
          
           if(everySup &&everySup.length===0 && item.quantity_less==0){
            handleFinihsLogicT()
            setRefreshCount(prev => prev + 1);
           }
          alert("Guardado correctamente")
          
      } catch (err: any) {
          alert(err.message || 'Error');
      } 
    }
   const handleReceptionDefect=async(item)=>{
        setIsDefectNio(true)
        console.log(item)
        setSelecItemDefect(item)
    }
    
    const handleDeleteSupplier = async(item)=>{
      if(!confirm(`¿Eliminar el insumo "${item.detail || item.supplyId}" de esta NIO?`)) return;
      try {
        await apiClient.nios.deleteSupplier(item.id);
        setNiosSupplier(prev => prev.filter(s => s.id !== item.id));
      } catch(err:any) {
        alert(err.message || 'Error al eliminar');
      }
    }

    const handleGoLogic = async(item)=>{
      if(user.role_id!=1&&user.role_id!=5&&user.role_id!=6){
        alert("sin permisos")
        return
      }
      if(!item.oc_number || !item.supplier || !item.price_individual){
        alert("Faltan datos para completar esta compra")
        return
      }
      if(!item.quantity || item.quantity <= 0){
        alert("La cantidad debe ser mayor a 0")
        return
      }
      const payload={
        nios_supplies_id:item.id,
        user_id:user.id,
        status:1,
        oc_number:item.oc_number,
        supplier:item.supplier,
        price_individual:item.price_individual,
        price_total:item.quantity*item.price_individual,
        quantity:item.quantity
      }
      const p={
        account_id:item.accountId,
        niosSupply:payload
      }
      setNiosSupplier(prev => prev.map(it => {
        if (it.id === item.id) {
          return { ...it, status: 3, creation_date:new Date().toLocaleDateString()};
        }
        return it;
      }));
      try {

           const everySup=niosSupplier.filter(el=>el.niosId===item.niosId && el.id!==item.id && el.status<3)
           const response = await apiClient.nios.createSell(p);
           if(everySup &&everySup.length===0){
            handleGoAllLogicT()
            setRefreshCount(prev => prev + 1);
           }
          
      } catch (err: any) {
          alert(err.message || 'Error');
      }      


    }
    const handleGoAllLogic =async()=>{
      if(user.role_id!=1&&user.role_id!=5&&user.role_id!=6){
        alert("sin permisos")
        return
      }
      const niosSup = niosSupplier.filter(el => el.niosId == selectedNio.id);

      // Verificamos si AL MENOS UNO tiene status 
      const hasIncomplete = niosSup.some(element => element.status < 3 || element.status === 8 || element.status === 9);

      if (hasIncomplete) {
          alert("La compra no esta completada");
          return; // Este return SÍ corta la función handleGoAllLogic
        }
        try {
            const response = await apiClient.nios.nios_finish_seller({id:selectedNio.id});
            setSelectedNio(null)
            setRefreshCount(prev => prev + 1);
        } catch (err: any) {
            alert(err.message || 'Error');
        }      
      }

    const handleGoAllPrespuesto =async()=>{
      if(user.role_id!=1&&user.role_id!=5&&user.role_id!=6){
        alert("sin permisos")
        return
      }
      const niosSup = niosSupplier.filter(el => el.niosId == selectedNio.id);
      const payload={
        id:selectedNio.id,
        nioSuppliers:niosSup,
        user:user
      }
      // Verificamos si AL MENOS UNO tiene status 
      const hasIncomplete = niosSup.some(element => element.price_individual == null || element.price_individual == undefined ||  element.price_individual == 0);
      const hasInvalidQty = niosSup.some(element => !element.quantity || element.quantity <= 0);

      if (hasInvalidQty) {
          alert("Todos los insumos deben tener una cantidad mayor a 0");
          return;
      }
      if (hasIncomplete) {
          alert("El presupuesto no esta completado");
          return; // Este return SÍ corta la función handleGoAllLogic
        }
        try {
            const response = await apiClient.nios.nios_finish_presupuest(payload);
            setSelectedNio(null)
            setRefreshCount(prev => prev + 1);
        } catch (err: any) {
            alert(err.message || 'Error');
        }      
      }
      
      const handleGoAllLogicT =async()=>{
        if(user.role_id!=1&&user.role_id!=5&&user.role_id!=6){
          alert("sin permisos")
          return
        }
      const niosSup = niosSupplier.filter(el => el.niosId == selectedNio.id);


        try {
            const response = await apiClient.nios.nios_finish_seller({id:selectedNio.id});
            setSelectedNio(null)
            setRefreshCount(prev => prev + 1);
        } catch (err: any) {
            alert(err.message || 'Error');
        }      
    }
    const handleTransitAllLogic =async()=>{
        if(user.role_id!==1&&user.role_id!==5&&user.role_id!==6){
            alert("sin permisos")
            return
        }
      const niosSup = niosSupplier.filter(el => el.niosId == selectedNio.id);

        // Verificamos si AL MENOS UNO tiene status 
      const hasIncomplete = niosSup.some(element => element.status < 4);

      if (hasIncomplete) {
          alert("La logistica no esta completada");
          return; // Este return SÍ corta la función handleGoAllLogic
        }
        try {
            if(selectedNio.to_logistics_at){
                const response2 = await apiClient.nios.nios_finish_seller({id:selectedNio.id});
            }
            const response = await apiClient.nios.nios_finish_logic({id:selectedNio.id});
            setSelectedNio(null)
            setRefreshCount(prev => prev + 1);
        } catch (err: any) {
            alert(err.message || 'Error');
      }         
    }    
    const handleTransitAllLogicT =async()=>{
        if(user.role_id!==1&&user.role_id!==5&&user.role_id!==6){
            alert("sin permisos")
            return
        }
      const niosSup = niosSupplier.filter(el => el.niosId == selectedNio.id);


        try {
            if(selectedNio.to_logistics_at){
                const response2 = await apiClient.nios.nios_finish_seller({id:selectedNio.id});
            }
            const response = await apiClient.nios.nios_finish_logic({id:selectedNio.id});
            setSelectedNio(null)
            setRefreshCount(prev => prev + 1);
        } catch (err: any) {
            alert(err.message || 'Error');
      }         
    } 
    const handleFinihsLogic =async()=>{
        if(user.role_id!==1&&user.role_id!==2&&user.role_id!==3){
            alert("sin permisos")
            return
        }
      const niosSup = niosSupplier.filter(el => el.niosId == selectedNio.id);

        // Verificamos si AL MENOS UNO tiene status 3
      const hasIncomplete = niosSup.some(element => element.status != 5);

      if (hasIncomplete) {
          alert("La logistica no esta completada");
          return; // Este return SÍ corta la función handleGoAllLogic
        }
        try {
            const response = await apiClient.nios.nios_finish_nio({id:selectedNio.id});
            setSelectedNio(null)
            setRefreshCount(prev => prev + 1);
        } catch (err: any) {
            alert(err.message || 'Error');
      }         
    }    
    const handleFinihsLogicT =async()=>{
        if(user.role_id!==1&&user.role_id!==2&&user.role_id!==3){
            alert("sin permisos")
            return
        }
      const niosSup = niosSupplier.filter(el => el.niosId == selectedNio.id);


        try {
            const response = await apiClient.nios.nios_finish_nio({id:selectedNio.id});
            setSelectedNio(null)
            setRefreshCount(prev => prev + 1);
        } catch (err: any) {
            alert(err.message || 'Error');
      }         
    } 
    const handleItemChange = (itemId, field, value) => {
      setNiosSupplier(prev => prev.map(item => {
        if (item.id === itemId) {
          return { ...item, [field]: value };
        }
        return item;
      }));
  };
    const handleSendSell=async()=>{ 
      if (user.role_id!==1&&user.role_id !== 2){
        alert("sin permisos")
        return
      }
      const payload={
        id:selectedNio.id,
        nioSuppliers:niosSupplier?.filter(el=>el.niosId===selectedNio.id),
        user:user
      }
      setLoading(true)
      try {
          setSelectedNio(null)
          const response = await apiClient.nios.putSentSell(payload);
          setRefreshCount(prev => prev + 1); // <-- Esto activa el useEffect
          setLoading(false)

      } catch (err: any) {
        alert(err.message || 'Error');
          setLoading(false)

      }
    }
    const handleSendSellTrue=async()=>{ 
      if (user.role_id!==1&&user.role_id !== 2){
        alert("sin permisos")
        return
      }
      const payload={
        id:selectedNio.id,
        nioSuppliers:niosSupplier?.filter(el=>el.niosId===selectedNio.id),
        user:user
      }
      setLoading(true)
      try {
          setSelectedNio(null)
          const response = await apiClient.nios.putSentSellTrue(payload);
          setRefreshCount(prev => prev + 1); // <-- Esto activa el useEffect
          setLoading(false)

      } catch (err: any) {
        alert(err.message || 'Error');
          setLoading(false)

      }
    }
    const addSupply=(supply)=>{
     setSupplies(prev => [...prev,supply])
    }
    const renderNIOBoard = () => {
        const columns = [
          { id: 1, label: 'OBRA (Solicitud)', icon: Construction, color: 'blue' },
          { id: 2, label: 'Compras', icon: ClipboardList, color: 'amber' },
          { id: 3, label: 'Logística', icon: Truck, color: 'emerald' },
          { id: 4, label: 'EN TRANSITO Y RECEPCION EN OBRA', icon: Send, color: 'indigo' },
          { id: 5, label: 'Completas los ultimos 90 días', icon: CheckCircle2, color: 'slate' },
        ];

        return (
          <div className="h-[calc(94vh-12rem)] md:h-[calc(100vh-12rem)] overflow-hidden flex flex-col gap-6">
            <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {columns.map(col => (
                <div key={col.id} className="min-w-[320px] bg-slate-100 rounded-2xl flex flex-col border border-slate-200">
                  <div className={`p-4 border-b flex items-center gap-2 bg-white rounded-t-2xl border-${col.color}-500 border-t-4`}>
                    <col.icon className={`h-5 w-5 text-${col.color}-600`} />
                    <span className="font-bold text-slate-800 uppercase tracking-tight text-sm">{col.label}</span>
                    <span className="ml-auto bg-slate-200 px-2 py-0.5 rounded-full text-xs font-bold text-slate-600">
                      {
                         col.id==2?
                         nios?.filter(n => (n.status === col.id || n.status === 8) && n.projectId===selectedProject?.id).length
                        :col.id==1?nios?.filter(n =>  (n.status === col.id || n.status === 9) && n.projectId===selectedProject?.id).length
                        :nios?.filter(n => n.status === col.id && n.projectId===selectedProject?.id).length
                        }
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                   {nios?.filter(n => {
                      // Definimos la condición de status según el col.id
                      const matchesStatus = col.id === 2 
                          ? (n.status === 2 || n.status === 8) :
                          col.id === 1 ?(n.status === 1 || n.status === 9)
                          : n.status === col.id;

                      // Retornamos la combinación de ambas condiciones
                      return matchesStatus && n.projectId === selectedProject?.id;
                  }).map(nio => {
                      const project = projects.find(p => p.id === nio.projectId);
 
                      const supplys = niosSupplier.filter(el=>el.niosId===nio.id&&el.status==nio.status)

                      return (
                        <div 
                          key={nio.id} 
                          onClick={() => setSelectedNio(nio)}
                          className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group animate-in fade-in zoom-in duration-300"
                        >
                          <div className="flex justify-between items-start mb-1">
                            {nio.partial?
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{"PARCIAL NIO-"+ nio.id} {project?.name}</span>
                            :<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{"COMPLETA NIO-"+ nio.id} {project?.name}</span>
                            }
                            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                              <Clock className="h-3 w-3" /> {nio.needDate.slice(0, 10)}
                            </div>
                          </div>
                          {nio.status==1 && (user.role_id==1||user.role_id==2||user.role_id==3)?

                            <div className="flex justify-end gap-2 mb-1">
                              {/* BOTÓN EDITAR */}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  supplys.forEach(element => {
                                    let det=supplies?.filter(el=>(el.id===element.supplyId))[0]
                                    element.supply=det 
                                  });
                                  nio.items=supplys
                                  console.log(supplys)
                                  setNioToEdit(nio)
                                  setIsProjectModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>

                              {/* BOTÓN ELIMINAR */}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedNioOne(nio)
                                  setIsDeleteNio(true)
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>:null
                            }
                          {supplys.length>0?supplys?.map(sup=>{
                              const det=supplies?.filter(el=>(el.id===sup.supplyId))[0]                          
                            return(
                            <div key={sup.id}>
                                <p className="text-sm text-slate-600 font-medium mb-1">{det?.detail}</p>
                                <div className="grid gap-1 text-xs">
                                  <div className={`p-2 rounded-lg ${sup.price_individual < 0 ? 'bg-red-50 border border-red-200' : 'bg-slate-50'}`}>
                                    <p className="text-slate-400">Cantidad</p>
                                    <p className={`font-bold ${sup.price_individual < 0 ? 'text-red-600' : ''}`}>{sup.quantity} {det?.unit}</p>
                                    {sup.price_individual < 0 && (
                                      <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-600 px-1.5 py-0.5 rounded">↩ Devolución de Mercaderia</span>
                                    )}
                                  </div>
                                </div>
                            </div>)})
                            :
                            <p className="font-bold p-2 m-2 text-red-500 text-slate-800 uppercase text-sm">SE DEBE PASAR DE ESTADO</p>}


                       <div className="bg-slate-50 p-2 rounded-lg flex items-center justify-center">
                              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
                    {/* --- Fullscreen NIO Detail Screen --- */}
            {selectedNio && (
              <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto animate-in slide-in-from-right duration-300">
                <div className="max-w-[95%] mx-auto min-h-screen bg-white shadow-2xl flex flex-col">
                  {/* Header area */}
                  <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
                    <button 
                      onClick={() => setSelectedNio(null)}
                      className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 flex items-center gap-2 font-medium"
                    >
                      <ArrowLeft className="h-5 w-5" /> Volver a Pizarra
                    </button>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                        selectedNio.status === 1 ? 'bg-blue-100 text-blue-700' :
                        selectedNio.status === 2 ? 'bg-amber-100 text-amber-700' :
                        selectedNio.status === 3 ? 'bg-emerald-100 text-emerald-700' :
                        selectedNio.status === 4 ? 'bg-indigo-100 text-indigo-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {columns.find(c => c.id === selectedNio.status)?.label}
                      </span>
                      <div className="h-8 w-px bg-slate-200"></div>
                      <span className="text-sm font-mono text-slate-400">{"NIO-"+selectedNio.id}</span>
                    </div>
                  </div>

                  <div className="flex-1 p-8 space-y-10">
                    {/* General Info */}
                      <section className="space-y-6">
                        {/* CABECERA: Obra a la izquierda, Fecha a la derecha */}
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 border-b border-slate-100 pb-6">
                          <div className="flex gap-4 items-start">
                            <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 shrink-0">
                              <Construction size={24} />
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Obra</p>
                              <p className="text-lg font-black text-slate-900">{selectedProject?.name}</p>
                              <p className="text-sm text-slate-500">{selectedProject?.address}</p>
                            </div>
                          </div>

                          <div className="flex gap-4 items-start md:text-right md:flex-row-reverse">
                            <div className="bg-purple-50 p-3 rounded-2xl text-purple-600 shrink-0">
                              <Calendar size={24} />
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Fecha de Necesidad</p>
                              <p className="text-lg font-black text-slate-900">
                                {selectedNio.needDate ? new Date(selectedNio.needDate).toLocaleDateString() : '---'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* CUERPO: Lista de Ítems */}
                        { selectedNio.status===1?
                        <div>
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Detalle de Insumos</h3>
                          
                          <div className="space-y-3">
                            {/* Encabezados para escritorio (opcional, ayuda a la legibilidad) */}
                            <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 text-[10px] font-bold text-slate-400 uppercase">
                              <div className="col-span-6">Insumo / Servicio</div>
                              <div className="col-span-2">Cantidad</div>
                              <div className="col-span-4">Cuenta Imputación</div>
                            </div>

                            {/* Mapeo de la lista de ítems */}
                            { niosSupplier?.filter(el=>el.niosId===selectedNio.id)?.map((item, index) =>
                            {
                                const det=supplies?.filter(el=>el.id===item.supplyId)[0] 
                                const account = selectedProject?.accounts?.find(a => a.id == item.accountId);
                            return (
                              <div 
                                key={item.id || index} 
                                className={`grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-2xl border items-center ${
                                  item.price_individual < 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'
                                }`}
                              >
                                {/* Insumo */}
                                <div className="md:col-span-6">
                                  <p className="text-[10px] md:hidden text-slate-400 font-bold uppercase mb-1">Insumo / Servicio</p>
                                  <p className="text-sm font-bold text-slate-700">{det?.detail + " ("+det?.code+")"}</p>
                                  <p className="text-sm font-bold text-slate-500">{item?.detail}</p>
                                  {item.price_individual < 0 && (
                                    <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-600 px-2 py-0.5 rounded-full">↩ Desimputación a cuenta de costo</span>
                                  )}
                                </div>

                                {/* Cantidad */}
                                <div className="md:col-span-2">
                                  <p className="text-[10px] md:hidden text-slate-400 font-bold uppercase mb-1">Cantidad</p>
                                  <p className={`text-base font-black ${item.price_individual < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                                    {item.quantity} <span className="text-xs font-medium text-slate-500">{det?.unit}</span>
                                  </p>
                                </div>

                                {/* Cuenta */}
                                <div className="md:col-span-4">
                                  <p className="text-[10px] md:hidden text-slate-400 font-bold uppercase mb-1">Cuenta Imputación</p>
                                  <p className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg inline-block md:block">
                                    { account?.name+" "+ account?.detail}
                                  </p>
                                </div>
                              </div>
                            )})}
                          </div>
                        </div>
                        :selectedNio.status===2||selectedNio.status===8||selectedNio.status===9?
                          <div className="w-full">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Detalle de Insumos</h3>
                            
                            <div className="space-y-3">
                              {/* Encabezados - Perfectamente alineados con los spans de abajo */}
                              <div className="hidden md:grid md:grid-cols-12 gap-2 px-4 text-[10px] font-extrabold text-slate-500 uppercase">
                                <div className="col-span-2">Insumo / Servicio</div>
                                <div className="col-span-1 text-center">Cant.</div>
                                <div className="col-span-2">Cuenta</div>
                                <div className="col-span-1">N° OC</div>
                                <div className="col-span-2">Proveedor</div>
                                {
                                      user.role_id==2||user.role_id==3?
                                      null:
                                      <>
                                <div className="col-span-1 text-right">Unit.</div>
                                <div className="col-span-1 text-right">Total</div></>}
                                <div className="col-span-2 text-center">Acción</div>
                              </div>

                              {/* Mapeo de ítems */}
                              {niosSupplier?.filter(el => el.niosId === selectedNio.id)?.map((item, index) => {
                                const det = supplies?.find(el => el.id === item.supplyId);
                                const account = selectedProject?.accounts?.find(a => a.id == item.accountId);
                                const unitPrice = item.price_individual || 0;
                                const totalPrice = (unitPrice * item.quantity).toFixed(2);

                                return (
                                  <div 
                                    key={item.id || index} 
                                    className={`grid grid-cols-1 md:grid-cols-12 gap-2 p-3 rounded-xl border items-center hover:shadow-md transition-shadow ${
                                      item.price_individual < 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'
                                    }`}
                                  >
                                    {/* 1. Insumo */}
                                    <div className="md:col-span-2">
                                      <p className="text-xs font-bold text-slate-800 leading-tight break-words">{det?.detail}</p>
                                      <p className="text-[10px] text-slate-500 italic break-words">{item?.detail}</p>
                                      {item.price_individual < 0 && (
                                        <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">↩ Devolución de Mercaderia</span>
                                      )}
                                    </div>

                                    {/* 2. Cantidad */}
                                    <div className="md:col-span-1 text-center">
                                      {item.status === 2 ||  item.status === 8? (
                                        <input
                                          type="number"
                                          step="any"
                                          className={`w-full text-xs p-2 rounded-lg border focus:bg-white focus:ring-1 focus:ring-blue-400 outline-none transition-all text-center font-bold ${
                                            item.price_individual < 0 ? 'border-red-300 bg-red-50 text-red-600' : 'border-slate-200 bg-slate-50'
                                          }`}
                                          value={item.quantity ?? ''}
                                          onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value))}
                                        />
                                      ) : (
                                        <p className={`text-sm font-black ${item.price_individual < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                                          {item.quantity} <span className="text-[10px] text-slate-500 font-normal">{det?.unit}</span>
                                        </p>
                                      )}
                                    </div>

                                    {/* 3. Cuenta (Ahora sí toma el espacio asignado) */}
                                    <div className="md:col-span-2">
                                      <p className="text-[10px] leading-tight font-medium text-emerald-700 break-words bg-emerald-50 p-1.5 rounded border border-emerald-100">
                                        {account?.name} {account?.detail}
                                      </p>
                                    </div>

                                    {/* 4. N° OC */}
                                    <div className="md:col-span-1">
                                      <input 
                                        disabled={item.status===2?false:true}
                                        type="text"
                                        placeholder="N° OC"
                                        className="w-full text-xs p-2 rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 outline-none transition-all"
                                        value={item.oc_number || ''}
                                        onChange={(e) => handleItemChange(item.id, 'oc_number', e.target.value)}
                                      />
                                    </div>

                                    {/* 5. Proveedor */}
                                    <div className="md:col-span-2">
                                      <input 
                                        disabled={item.status===2?false:true}
                                        type="text"
                                        placeholder="Proveedor"
                                        className="w-full text-xs p-2 rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 outline-none transition-all"
                                        value={item.supplier || ''}
                                        onChange={(e) => handleItemChange(item.id, 'supplier', e.target.value)}
                                      />
                                    </div>
                                    {
                                     user.role_id==3?
                                      null:
                                      <>
                                        <div className="md:col-span-1 relative">
                                          <input 
                                            disabled={item.status !== 2 && item.status !== 8}
                                            type="number" // Mantenemos number para que el teclado móvil sea numérico y la DB reciba el float
                                            placeholder="0"
                                            className={`w-full text-xs p-2 rounded-lg border-slate-200 bg-slate-50 text-right font-semibold outline-none focus:ring-1 focus:ring-blue-400 ${
                                              item.price_individual <= det.bestPrice ? 'border-emerald-500 bg-emerald-50' : ''
                                            }`}
                                            value={item.price_individual || ''}
                                            onChange={(e) => handleItemChange(item.id, 'price_individual', parseFloat(e.target.value))}
                                          />
                                          
                                          {/* Notificación con Estilo */}
                                          {det.bestPrice > 0 && (
                                            <div className="mt-1 flex flex-col items-end opacity-80 hover:opacity-100 transition-opacity">
                                              <span className="text-[12px] font-bold text-amber-800 bg-amber-100/50 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                                                {/* APLICADO AQUÍ */}
                                                Mejor precio: ${formatCurrency(det.bestPrice)}
                                              </span>
                                              <span className="text-[11px] text-slate-400 max-w-[100px]">
                                                Proveedor: {det.bestSupplier}
                                              </span>
                                            </div>
                                          )}
                                        </div>

                                        <div className="md:col-span-1 text-right px-1">
                                          {/* APLICADO AQUÍ */}
                                          <p className="text-xs font-black text-slate-900">${formatCurrency(totalPrice)}</p>
                                        </div>
                                      </>
                                    }
                                    {/* 8. Botón (Suma total de 12 columnas lograda) */}
                                    <div className="md:col-span-2 pl-1">
                                      {
                                        item.status===2?
                                      <div className="flex flex-col gap-1">
                                      <button onClick={()=>handleGoLogic(item)} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-1.5 px-1 transition-all flex flex-col items-center justify-center shadow-sm active:scale-95">
                                        <span className="text-[10px] font-bold tracking-tight">Guardar y pasar</span>
                                        <span className="text-[10px] font-bold tracking-tight">a Logística</span>
                                      </button>
                                      <button onClick={()=>handleDeleteSupplier(item)} className="w-full flex items-center justify-center gap-1 text-[10px] text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg py-1 transition-all">
                                        <Trash2 size={11}/><span>Eliminar insumo</span>
                                      </button>
                                      </div>
                                        : item.status===3?
                                        <p className="text-[12px] leading-tight font-medium text-emerald-700 break-words bg-emerald-50 p-1.5 rounded border border-emerald-100">
                                        En logística desde {item.creation_date?.slice(0, 10)}
                                      </p>: item.status===4?
                                        <p className="text-[12px] leading-tight font-medium text-emerald-700 break-words bg-emerald-50 p-1.5 rounded border border-emerald-100">
                                        En transito desde {item.driver_date?.slice(0, 10)}
                                      </p>: item.status===5?
                                        <p className="text-[12px] leading-tight font-medium text-emerald-700 break-words bg-emerald-50 p-1.5 rounded border border-emerald-100">
                                        Recibido desde {item.reception_date?.slice(0, 10)}
                                      </p>
                                          :null
                                      }
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          :selectedNio.status===3?
                          <div className="w-full">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Detalle de Insumos</h3>
                            
                            <div className="space-y-3">
                              {/* Encabezados - Perfectamente alineados con los spans de abajo */}
                              <div className="hidden md:grid md:grid-cols-12 gap-2 px-4 text-[10px] font-extrabold text-slate-500 uppercase">
                                <div className="col-span-2">Insumo / Servicio</div>
                                <div className="col-span-1 text-center">Cant.</div>
                                <div className="col-span-1">Cuenta</div>
                                <div className="col-span-1">N° OC</div>
                                <div className="col-span-1">Proveedor</div>
                                {
                                      user.role_id==2||user.role_id==3?
                                      null:
                                      <>
                                <div className="col-span-1 text-right">Unit.</div>
                                <div className="col-span-1 text-right">Total</div></>}
                                <div className="col-span-2 text-center">Acción</div>
                                <div className="col-span-2 text-center">Asignar Chofer</div>
                              </div>

                              {/* Mapeo de ítems */}
                              {niosSupplier?.filter(el => el.niosId === selectedNio.id)?.map((item, index) => {
                                const det = supplies?.find(el => el.id === item.supplyId);
                                const account = selectedProject?.accounts?.find(a => a.id == item.accountId);
                                const unitPrice = item.price_individual || 0;
                                const totalPrice = (unitPrice * item.quantity).toFixed(2);

                                return (
                                  <div 
                                    key={item.id || index} 
                                    className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-white p-3 rounded-xl border border-slate-200 items-center hover:shadow-md transition-shadow"
                                  >
                                    {/* 1. Insumo */}
                                    <div className="md:col-span-2">
                                      <p className="text-xs font-bold text-slate-800 leading-tight break-words">{det?.detail}</p>
                                      <p className="text-[10px] text-slate-500 italic break-words">{item?.detail}</p>
                                    </div>

                                    {/* 2. Cantidad */}
                                    <div className="md:col-span-1 text-center">
                                      <p className="text-sm font-black text-slate-800">
                                        {item.quantity} <span className="text-[10px] text-slate-500 font-normal">{det?.unit}</span>
                                      </p>
                                    </div>

                                    {/* 3. Cuenta (Ahora sí toma el espacio asignado) */}
                                    <div className="md:col-span-1">
                                      <p className="text-[10px] leading-tight font-medium text-emerald-700 break-words bg-emerald-50 p-1.5 rounded border border-emerald-100">
                                        {account?.name} {account?.detail}
                                      </p>
                                    </div>

                                    {/* 4. N° OC */}
                                    <div className="md:col-span-1">
                                      <input 
                                        disabled={item.status===2?false:true}
                                        type="text"
                                        placeholder="N° OC"
                                        className="w-full text-xs p-2 rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 outline-none transition-all"
                                        value={item.oc_number || ''}
                                        onChange={(e) => handleItemChange(item.id, 'oc_number', e.target.value)}
                                      />
                                    </div>

                                    {/* 5. Proveedor */}
                                    <div className="md:col-span-1">
                                      <input 
                                        disabled={item.status===2?false:true}
                                        type="text"
                                        placeholder="Proveedor"
                                        className="w-full text-xs p-2 rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 outline-none transition-all"
                                        value={item.supplier || ''}
                                        onChange={(e) => handleItemChange(item.id, 'supplier', e.target.value)}
                                      />
                                    </div>
                                {
                                      user.role_id==2||user.role_id==3?
                                      null:
                                      <>
                                    {/* 6. Precio Unitario */}
                                    <div className="md:col-span-1">
                                      <input 
                                        disabled={item.status===2?false:true}
                                        type="number"
                                        placeholder="0"
                                        className="w-full text-xs p-2 rounded-lg border-slate-200 bg-slate-50 text-right font-semibold outline-none focus:ring-1 focus:ring-blue-400"
                                        value={item.price_individual || ''}
                                        onChange={(e) => handleItemChange(item.id, 'price_individual', parseFloat(e.target.value))}
                                      />
                                                                            {/* Notificación con Estilo */}
                                      {det.bestPrice > 0 && (
                                        <div className="mt-1 flex flex-col items-end opacity-80 hover:opacity-100 transition-opacity">
                                          <span className="text-[12px] font-bold text-amber-800 bg-amber-100/50 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                                            Mejor precio: ${det.bestPrice}
                                          </span>
                                          <span className="text-[11px] text-slate-400 max-w-[100px]">
                                            Proveedor: {det.bestSupplier}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* 7. Precio Total */}
                                    <div className="md:col-span-1 text-right px-1">
                                      <p className="text-xs font-black text-slate-900">${formatCurrency(totalPrice)}</p>
                                    </div>

                                    </>}

                                    {/* 8. Botón  */}
                                    <div className="md:col-span-2 pl-1">
                                      {
                                        item.status===2?
                                      
                                      <button onClick={()=>handleGoLogic(item)} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-1.5 px-1 transition-all flex flex-col items-center justify-center shadow-sm active:scale-95">
                                        <span className="text-[10px] font-bold tracking-tight">Guardar y pasar</span>
                                        <span className="text-[10px] font-bold tracking-tight">a Logística</span>
                                      </button>
                                        : item.status===3?
                                        <p className="text-[12px] leading-tight font-medium text-emerald-700 break-words bg-emerald-50 p-1.5 rounded border border-emerald-100">
                                        En logística desde {item.creation_date?.slice(0, 10)}
                                      </p>: item.status===4?
                                      <>
                                        <p className="text-[12px] leading-tight font-medium text-emerald-700 break-words bg-emerald-50 p-1.5 rounded border border-emerald-100">
                                        En logística desde {item.creation_date?.slice(0, 10)}</p>
                                        <p className="text-[12px] leading-tight font-medium text-emerald-700 break-words bg-emerald-50 p-1.5 rounded border border-emerald-100">
                                           En transito desde {item.driver_date?.slice(0, 10)}
                                        </p>
                                      </>: item.status===5?<>
                                        <p className="text-[12px] leading-tight font-medium text-emerald-700 break-words bg-emerald-50 p-1.5 rounded border border-emerald-100">
                                        En logística desde {item.creation_date?.slice(0, 10)}</p>
                                        <p className="text-[12px] leading-tight font-medium text-emerald-700 break-words bg-emerald-50 p-1.5 rounded border border-emerald-100">
                                           En transito desde {item.driver_date?.slice(0, 10)}
                                        </p>
                                        <p className="text-[12px] leading-tight font-medium text-emerald-700 break-words bg-emerald-50 p-1.5 rounded border border-emerald-100">
                                        Recibido desde {item.reception_date?.slice(0, 10)}
                                      </p></>
                                          :null
                                      }
                                    </div>
                                    {/* 9. Seleccionar el chofer y Pasar a Tránsito */}
                                    <div className="md:col-span-2 flex flex-wrap items-center gap-2 pl-2">
                                      {item.status === 3 ? (
                                        <>
                                          <select
                                            className="w-[130px] text-[11px] p-2 rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-emerald-400 outline-none transition-all"
                                            value={item.driverId || ''}
                                            onChange={(e) => handleItemChange(item.id, 'driverId', e.target.value)}
                                          >
                                            <option value="">Seleccionar Chofer</option>
                                            {drivers
                                              ?.filter(d => d.isEnable) // Solo choferes activos
                                              .map(driver => (
                                                <option key={driver.id} value={driver.id}>
                                                  {driver.name} {driver.vehicle ? `- ${driver.vehicle}` : ''}
                                                </option>
                                              ))
                                            }
                                          </select>

                                          <button 
                                            onClick={() => handleSentDriver(item)}
                                            disabled={!item.driverId}
                                            className={`px-3 py-2 rounded-lg text-white text-[10px] font-bold transition-all flex items-center justify-center shadow-sm active:scale-95 ${
                                              item.driverId 
                                                ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer' 
                                                : 'bg-slate-300 cursor-not-allowed'
                                            }`}
                                          >
                                            Pasar a Tránsito
                                          </button>
                                        </>
                                      ) : item.status > 3 ? (
                                        // Mostrar el nombre del chofer si ya pasó esta etapa
                                        <div className="flex flex-col">
                                          <span className="text-[10px] text-slate-400 uppercase font-black">Chofer Asignado:</span>
                                          <span className="text-xs font-bold text-slate-700">
                                            {drivers?.find(d => d.id == item.driverId)?.name || 'N/A'}
                                          </span>
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          :
                          <div className="w-full">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Detalle de Insumos</h3>
                            
                            <div className="space-y-3">
                              {/* Encabezados - Perfectamente alineados con los spans de abajo */}
                              <div className="hidden md:grid md:grid-cols-12 gap-2 px-4 text-[10px] font-extrabold text-slate-500 uppercase">
                                <div className="col-span-2">Insumo / Servicio</div>
                                <div className="col-span-1 text-center">Cant.</div>
                                <div className="col-span-1">Cuenta</div>
                                <div className="col-span-1">N° OC</div>
                                <div className="col-span-1">Proveedor</div>
                                                                {
                                      user.role_id==2||user.role_id==3?
                                      null:
                                      <>
                                <div className="col-span-1 text-right">Unit. / Total</div></>
                                          }
                                <div className="col-span-2 text-center">Acción</div>
                                <div className="col-span-1 text-center">Asignar Chofer</div>
                                <div className="col-span-2 text-center">Cantidad faltante (Sino coloca 0)</div>
                              </div>

                              {/* Mapeo de ítems */}
                              {niosSupplier?.filter(el => el.niosId === selectedNio.id)?.map((item, index) => {
                                const det = supplies?.find(el => el.id === item.supplyId);
                                const account = selectedProject?.accounts?.find(a => a.id == item.accountId);
                                const unitPrice = item.price_individual || 0;
                                const totalPrice = (unitPrice * item.quantity).toFixed(2);

                                return (
                                  <div 
                                    key={item.id || index} 
                                    className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-white p-3 rounded-xl border border-slate-200 items-center hover:shadow-md transition-shadow"
                                  >
                                    {/* 1. Insumo */}
                                    <div className="md:col-span-2">
                                      <p className="text-xs font-bold text-slate-800 leading-tight break-words">{det?.detail}</p>
                                      <p className="text-[10px] text-slate-500 italic break-words">{item?.detail}</p>
                                    </div>

                                    {/* 2. Cantidad */}
                                    <div className="md:col-span-1 text-center">
                                      <p className="text-sm font-black text-slate-800">
                                        {item.quantity} <span className="text-[10px] text-slate-500 font-normal">{det?.unit}</span>
                                      </p>
                                    </div>

                                    {/* 3. Cuenta (Ahora sí toma el espacio asignado) */}
                                    <div className="md:col-span-1">
                                      <p className="text-[10px] leading-tight font-medium text-emerald-700 break-words bg-emerald-50 p-1.5 rounded border border-emerald-100">
                                        {account?.name} {account?.detail}
                                      </p>
                                    </div>

                                    {/* 4. N° OC */}
                                    <div className="md:col-span-1">
                                      <input 
                                        disabled={item.status===2?false:true}
                                        type="text"
                                        placeholder="N° OC"
                                        className="w-full text-xs p-2 rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 outline-none transition-all"
                                        value={item.oc_number || ''}
                                        onChange={(e) => handleItemChange(item.id, 'oc_number', e.target.value)}
                                      />
                                    </div>

                                    {/* 5. Proveedor */}
                                    <div className="md:col-span-1">
                                      <input 
                                        disabled={item.status===2?false:true}
                                        type="text"
                                        placeholder="Proveedor"
                                        className="w-full text-xs p-2 rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 outline-none transition-all"
                                        value={item.supplier || ''}
                                        onChange={(e) => handleItemChange(item.id, 'supplier', e.target.value)}
                                      />
                                    </div>
                                  {
                                      user.role_id==2||user.role_id==3?
                                      null:
                                      <>
                                    {/* 6. Precio Unitario */}
                                    <div className="md:col-span-1">
                                      <p className="text-xs font-black text-slate-900">${formatCurrency(item.price_individual)}</p>
                                      <p className="text-xs font-black text-slate-900">${formatCurrency(totalPrice)}</p>
                                                                            {/* Notificación con Estilo */}
                                      {det.bestPrice > 0 && (
                                        <div className="mt-1 flex flex-col items-end opacity-80 hover:opacity-100 transition-opacity">
                                          <span className="text-[12px] font-bold text-amber-800 bg-amber-100/50 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                                            Mejor precio: ${det.bestPrice}
                                          </span>
                                          <span className="text-[11px] text-slate-400 max-w-[100px]">
                                             Proveedor: {det.bestSupplier}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                 </>}

                                    {/* 7. Botón  */}
                                    <div className="md:col-span-2 pl-1">
                                      {
                                        item.status===2?
                                      
                                      <button onClick={()=>handleGoLogic(item)} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-1.5 px-1 transition-all flex flex-col items-center justify-center shadow-sm active:scale-95">
                                        <span className="text-[10px] font-bold tracking-tight">Guardar y pasar</span>
                                        <span className="text-[10px] font-bold tracking-tight">a Logística</span>
                                      </button>
                                        : item.status===3?
                                        <p className="text-[12px] leading-tight font-medium text-emerald-700 break-words bg-emerald-50 p-1.5 rounded border border-emerald-100">
                                        En logística desde {item.creation_date?.slice(0, 10)}
                                      </p>: item.status===4?
                                      <>
                                        <p className="text-[12px] leading-tight font-medium text-emerald-700 break-words bg-emerald-50 p-1.5 rounded border border-emerald-100">
                                        En logística desde {item.creation_date?.slice(0, 10)}</p>
                                        <p className="text-[12px] leading-tight font-medium text-emerald-700 break-words bg-emerald-50 p-1.5 rounded border border-emerald-100">
                                           En transito desde {item.driver_date?.slice(0, 10)}
                                        </p>
                                      </>: item.status===5?
                                        <>
                                        <p className="text-[12px] leading-tight font-medium text-emerald-700 break-words bg-emerald-50 p-1.5 rounded border border-emerald-100">
                                        En logística desde {item.creation_date?.slice(0, 10)}</p>
                                        <p className="text-[12px] leading-tight font-medium text-emerald-700 break-words bg-emerald-50 p-1.5 rounded border border-emerald-100">
                                           En transito desde {item.driver_date?.slice(0, 10)}
                                        </p>
                                        <p className="text-[12px] leading-tight font-medium text-emerald-700 break-words bg-emerald-50 p-1.5 rounded border border-emerald-100">
                                        Recibido desde {item.reception_date?.slice(0, 10)}
                                      </p></>
                                          :null
                                      }
                                    </div>
                                    {/* 8. Seleccionar el chofer y Pasar a Tránsito */}
                                    <div className="md:col-span-1 flex items-center gap-2 pl-2">
                                      {item.status === 3 ? (
                                        <>
                                          <select
                                            className="flex-1 text-[11px] p-2 rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-emerald-400 outline-none transition-all"
                                            value={item.driverId || ''}
                                            onChange={(e) => handleItemChange(item.id, 'driverId', e.target.value)}
                                          >
                                            <option value="">Seleccionar Chofer</option>
                                            {drivers
                                              ?.filter(d => d.isEnable) // Solo choferes activos
                                              .map(driver => (
                                                <option key={driver.id} value={driver.id}>
                                                  {driver.name} {driver.vehicle ? `- ${driver.vehicle}` : ''}
                                                </option>
                                              ))
                                            }
                                          </select>

                                          <button 
                                            onClick={() => handleSentDriver(item)}
                                            disabled={!item.driverId}
                                            className={`px-3 py-2 rounded-lg text-white text-[10px] font-bold transition-all flex items-center justify-center shadow-sm active:scale-95 ${
                                              item.driverId 
                                                ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer' 
                                                : 'bg-slate-300 cursor-not-allowed'
                                            }`}
                                          >
                                            Pasar a Tránsito
                                          </button>
                                        </>
                                      ) : item.status > 3 ? (
                                        // Mostrar el nombre del chofer si ya pasó esta etapa
                                        <div className="flex flex-col">
                                          <span className="text-[10px] text-slate-400 uppercase font-black">Chofer Asignado:</span>
                                          <span className="text-xs font-bold text-slate-700">
                                            {drivers?.find(d => d.id == item.driverId)?.name || 'N/A'}
                                          </span>
                                        </div>
                                      ) : null}
                                    </div>
                                    {/* 9. Faltante */}
                                    {item.reception_date?
                                     <div className="md:col-span-1">
                                     <p className="text-[12px] leading-tight font-medium text-emerald-700 break-words bg-emerald-50 p-1.5 rounded border border-emerald-100">
                                        Completo desde  {item.reception_date?.slice(0, 10)}
                                      </p>                 
                                    </div>: item.status > 3 ?<>
                                    <div className="md:col-span-1">
                                      <input 
                                        disabled={item.status===4?false:true}
                                        type="number"
                                        placeholder="Faltante"
                                        className="w-full text-xs p-2 rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 outline-none transition-all"
                                        value={item.quantity_less || ''}
                                        onChange={(e) => handleItemChange(item.id, 'quantity_less', e.target.value)}
                                      />

                                    </div>  
                                    <div className="flex flex-col gap-3 md:col-span-1">
                                    <button 
                                          onClick={() => handleReceptionSave(item)}
                                          className={`px-3 py-2 rounded-lg text-white text-[10px] font-bold transition-all flex items-center justify-center shadow-sm active:scale-95 bg-emerald-700 cursor-pointer`}
                                        >
                                          Guardar
                                        </button>
                                      <button 
                                          onClick={() => handleReceptionDefect(item)}
                                          className={`px-3 py-2 rounded-lg text-white text-[10px] font-bold transition-all flex items-center justify-center shadow-sm active:scale-95 bg-red-700 cursor-pointer`}
                                        >
                                          Marcar como defectuosa
                                        </button> </div>
                                        </>:null
                                  }



                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        }
                      </section>

                    <div className="h-px bg-slate-100"></div>
                                    {/* Status Specific Actions */}
                    <section className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
                      <div className="flex items-center gap-3 mb-6">
                        <BrainCircuit className="h-6 w-6 text-blue-600" />
                        <h3 className="text-lg font-bold text-slate-800">Acciones de Gestión: <span className="text-blue-600">{columns.find(c => c.id === selectedNio.status)?.label}</span></h3>
                      </div>

                    {selectedNio.status === 1 && (
                      <div className="space-y-6">
                        <p className="text-slate-600">La solicitud ha sido creada y está lista para ser enviada al área de compras.</p>
                        <button 
                          onClick={() => handleSendSell()}
                          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                        >
                          Enviar a Compras <ArrowRight />
                        </button>
                      </div>
                    )}
                    {selectedNio.status === 9 && (
                      <div className="space-y-6">
                        <p className="text-slate-600">Validar presupuesto para ejecutar compra.</p>
                        <button 
                          onClick={() => handleSendSellTrue()}
                          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                        >
                          Enviar a Compras <ArrowRight />
                        </button>
                      </div>
                    )}
                    {selectedNio.status === 2 && (
                      <div className="space-y-6">
                        <p className="text-slate-600">
                        </p>
                        <button 
                          onClick={() => handleGoAllLogic()}
                          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                        >
                          Todas las compras finalizadas pasar la Nio a logistica <ArrowRight />
                        </button>
                      </div>
                    )}
                    {selectedNio.status === 8 && (
                      <div className="space-y-6">
                        <p className="text-slate-600">
                        </p>
                        <button 
                          onClick={() => handleGoAllPrespuesto()}
                          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                        >
                          Pasar el presupuesto a gerente de obra, son precios aproximados, el margen es 5% <ArrowRight />
                        </button>
                      </div>
                    )}
                    {selectedNio.status === 3 && (
                      <div className="space-y-6">
                        <p className="text-slate-600">
                        </p>
                        <button 
                          onClick={() => handleTransitAllLogic()}
                          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                        >
                          Todos los materiales estan en transito a la obra <ArrowRight />
                        </button>
                      </div>
                    )}
                    {selectedNio.status === 4 && (
                      <div className="space-y-6">
                      <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 text-indigo-900">
                        <p className="font-bold flex items-center gap-2 mb-2"><CheckCircle2 className="h-5 w-5" /> Recepción en Obra</p>
                        <p className="text-sm">El jefe de obra debe validar la recepción de los materiales. Si existe una diferencia en la cantidad, regístrela a continuación.</p>
                      </div>                      
                      <button  onClick={() => handleFinihsLogic()}
                        className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
                      >
                        Confirmar Recepción de todo y Finalizar <CheckCircle2 />
                      </button>
                      </div>
                    )}
                  </section>
                    {/* Timeline */}
                      <section>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Trazabilidad de Tiempos</h3>
                        <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                            {[
                              { label: 'Creación NIO', date: selectedNio.creationDate, icon: Plus, color: 'slate' },
                              { label: 'Ingreso a Compras', date: selectedNio.toProcurementAt, icon: ClipboardList, color: 'amber' },
                              { label: 'Ingreso a Logística', date: selectedNio.toLogisticsAt, icon: Truck, color: 'emerald' },
                              { label: 'Salida a Tránsito', date: selectedNio.toTransitAt, icon: Send, color: 'indigo' },
                              { label: 'Completada', date: selectedNio.completedAt, icon: CheckCircle2, color: 'slate' },
                            ].map((step, idx) => (
                              <div key={idx} className="relative flex gap-6 items-center">
                                <div className={`absolute -left-[29px] p-1.5 rounded-full border-2 border-white shadow-sm bg-${step.color}-500 text-white`}>
                                    <step.icon className="h-3 w-3" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{step.label}</p>
                                    <p className="text-xs text-slate-400">{step.date ? new Date(step.date).toLocaleString() : 'Pendiente'}</p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </section>

                      </div>
                    </div>
                  </div>
              )}    

          </div>
        );
      };
    const handleProjectChange = (e) => {
        const value = e.target.value;

        if (value === "") {
            setSelectedProject(null);
        } else {
            // Buscamos el objeto completo dentro del array projects
            // Convertimos value a Number para que coincida con project.id
            const projectFound = projects.find(p => p.id === Number(value));
            if(projectFound){
              handleSelectedProject(projectFound)
            }
        }
    };
    const handleSelectedProject = async (project: Project) => {
      try {
        const response = await apiClient.costAccounts.list(project.id);
        
        // Creamos una copia para no mutar el objeto original directamente
        const projectWithAccounts = {
          ...project,
          accounts: response
        };

        // Actualizamos el estado de React
        setSelectedProject(projectWithAccounts);

        // Guardamos en LocalStorage para la próxima vez que recargues
        localStorage.setItem("selectedProject", JSON.stringify(projectWithAccounts));

      } catch (err: any) {
        alert(err.message || 'Error al traer cuentas');
      }
    };
  const handleCreateNio = async (nio) => {
    // 1. Construimos el objeto principal de la NIO
    const nioData: NIOS = {
      projectId: nio.projectId,
      needDate: nio.needDate,
      status: 1,
      userId: user.id // Extraído del contexto de usuario
    };

    // 2. Construimos la lista de suministros (detalles)
    // Usamos .map para transformar cada item al formato NIOSupplier
    const nioSuppliers: NIOSupplier[] = nio.items.map((item) => ({
      userId: user.id, // El usuario que crea el registro
      supplyId: item.supply.id, // Viene de item.supply.id
      status: 1,
      detail: item.detail,
      quantity: Number(item.quantity), // Aseguramos que sea número
      accountId: Number(item.accountId) // Viene de item.accountId
    }));


      let payload={
        nio:nioData,
        nioSuppliers:nioSuppliers
      }
      try {
        const response = await apiClient.nios.create(payload);
        setNiosSupplier(prev => [...prev, ...response.items]);
        setNios(prev => [...prev,response.nio])
        setIsProjectModalOpen(false)
      } catch (err: any) {
        alert(err.message || 'Error al crear nio');
      }
  };
  const handleUpdateNio = async (nio) => {
    let p={
      id:nio.id,
      nioSuppliers:nio.items,
      need_date:nio.needDate,
      idsDelete:nio.idsDelete
    }
    const res = await apiClient.nios.updateN(p);
    setIsProjectModalOpen(false);
    setNioToEdit(null);
    setRefreshCount(prev => prev + 1);

  };
  const handleConfirmDefect = async (data) => {
    const p={
    nios_id:seletecItemDefect.niosId,
    user_id:user.id,
    nios_supplies_id:seletecItemDefect.nios_supplies_id,
    quantity_bad:data.defective,
    quantity_recived:data.good,
    quantity_distinct:data.wrong,
    quantity_less:data.missing,
    detail:data.reason
    }
    const nioD = await apiClient.nios.nios_defect(p);
     setIsDefectNio(false)
    setSelecItemDefect(null)
    setRefreshCount(prev => prev + 1);
  };
  const handleDeleteNio = async (id: string) => {
      setLoading(true)
      const deleteResponse = await apiClient.nios.delete(id);
      if(deleteResponse.message){
          setSelectedNioOne(null)
          setIsDeleteNio(false)
          setLoading(false)
          setRefreshCount(prev => prev + 1);
      }else{
          alert("Error "+ deleteResponse)
      }
      setLoading(false)
    };
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Carga de datos en paralelo
        const [
          projData, 
          supplies, 
          drivers, 
          niosRaw, 
          niosSupplierRaw, 
          supplySells, 
          niosDrivers,
          niosCompleted
        ] = await Promise.all([
          apiClient.projects.list(),
          apiClient.supplies.list(),
          apiClient.drivers.list(),
          apiClient.nios.list(),
          apiClient.nios.listSupplier(),
          apiClient.nios.listSells(),
          apiClient.nios.listDrivers(),
          apiClient.nios.listNioCompleted() // La nueva query que hicimos
        ]);

        // 2. Enriquecer la lista de proveedores (updatedList)
        // Unificamos Insumo + Venta + Datos del Driver
        const updatedList = niosSupplierRaw.map(item => {
          const hasSell = supplySells.find(el => el.nios_supplies_id === item.id);
          
          let driverInfo = {};
          if (hasSell) {
            const hasDriver = niosDrivers.find(d => d.nios_sells_id === hasSell.id);
            if (hasDriver) {
              driverInfo = {
                nios_drivers_id: hasDriver.nios_drivers_id,
                driver_date: hasDriver.driver_date,
                status_transit: hasDriver.status_transit,
                quantity_less: hasDriver.quantity_less,
                driverId: hasDriver.driver_id,
                reception_date: hasDriver.reception_date,
              };
            }
          }

          // Retornamos el item con toda su trazabilidad unificada
          return hasSell ? { ...item, ...hasSell, ...driverInfo } : item;
        });

        // 3. Control de Unicidad para las NIOs (Cabeceras)
        // Usamos un Set para no repetir una misma NIO con el mismo Status
        const uniqueKeys = new Set(niosRaw.map(n => `${n.id}-${n.status}`));
        let finalNios = [...niosRaw];

        // 4. Procesar Parciales desde la lógica de Insumos
        // Si un insumo tiene un status distinto a la NIO madre, creamos una entrada "Partial"
        updatedList.forEach(sup => {
          const originalNio = niosRaw.find(n => n.id === sup.niosId);
          
          if (originalNio) {
            const comboKey = `${sup.niosId}-${sup.status}`;

            if (originalNio.status !== sup.status && !uniqueKeys.has(comboKey)) {
              finalNios.push({
                ...originalNio,
                status: sup.status,
                partial: true 
              });
              uniqueKeys.add(comboKey);
            }
          }
        });

        // 5. Agregar las NIOs Completadas (Resultados de la Query SQL)
        // Estas ya vienen filtradas por fecha (< 30 días) y con el flag partial calculado
        niosCompleted.forEach(nc => {
          const comboKey = `${nc.niosId}-${nc.status}`;
          const Key = finalNios.filter(el=>el.id==nc.niosId)
          if (!uniqueKeys.has(comboKey)) {
            let nio={
                id: nc.niosId,
                projectId: nc.projectId,
                creationDate: nc.creationDate,
                needDate: nc.needDate,
                status: 5,
                toProcurementAt: nc.toProcurementAt,
                toLogisticsAt: nc.toLogisticsAt,
                toTransitAt: nc.toTransitAt,
                completedAt: nc.completedAt,
                partial:updatedList.some(sup => sup.niosId === nc.niosId && sup.status !== 5)            
            }
            finalNios.push(nio); 
            uniqueKeys.add(comboKey);
          }
          updatedList.push(nc)
        });
        let projectsFilerts
        if(user.role_id ==2 || user.role_id ==3){
           projectsFilerts=projData.filter(el=>el.projectManager==user.id || el.generalManager==user.id)
        }else{
          projectsFilerts=projData
        }

        // 6. Actualización de Estados de React
        setProjects(projectsFilerts);
        setSupplies(supplies);
        setDrivers(drivers);
        setNios(finalNios);
        setNiosSupplier(updatedList);
        setNiosSupplySells(supplySells);
        setNiosDrivers(niosDrivers);
        console.log(finalNios)
        console.log(updatedList)
        if(projectsFilerts && projectsFilerts.length>0){
          const saved = localStorage.getItem("selectedProject");
          if(saved){
            handleSelectedProject(JSON.parse(saved))
          }else{
              handleSelectedProject(projectsFilerts[0])
          }
          
        }
      } catch (error) {
        console.error("Error al sincronizar datos de NIOs:", error);
      }
    };

    fetchData();
  }, [refreshCount, apiClient]); 
  // Agregué apiClient a las dependencias por buena práctica si viene de un contexto

  return (    
    
             <div >

                  <ConfirmDeleteModal
                  isOpen={isDeleteNio}
                  onClose={() => {
                      setIsDeleteNio(false)
                      setSelectedNioOne(null)
                  }}
                  onConfirm={() => {
                      handleDeleteNio(selectedNioOne?.id??"")
                  }}
                  itemName={" La NIO "+selectedNioOne?.id}
                  loading={loading}
                  ></ConfirmDeleteModal> 
                  <NioDefectiveModal
                  isOpen={isDefectNio}
                  onClose={() => {
                      setIsDefectNio(false)
                  }}
                  cantidadEsperada={seletecItemDefect?.quantity||0}
                  onSubmit={(data) => {
                      handleConfirmDefect(data)
                  }}
                  itemName={" La NIO "}
                  loading={loading}
                  ></NioDefectiveModal> 
                      <NioFormModal
                      users={users}
                      isOpen={isProjectModalOpen}
                      supplies={supplies}
                      addSupply={addSupply}
                      projectSelect={selectedProject}
                      onClose={() => {
                          setIsProjectModalOpen(false);
                          setNioToEdit(null); // Limpiar al cerrar
                      }}
                          initialData={nioToEdit} // Aquí pasas la NIO si vas a editar
                          onSubmit={nioToEdit ? handleUpdateNio : handleCreateNio}
                      />
  
                    <div className="flex flex-col sm:flex-row pb-6 justify-between items-stretch sm:items-center gap-4">
                      {/* Título y Botón Refresh (Agrupados en móvil para ahorrar espacio) */}
                      <div className="flex justify-between items-center gap-4">
                        <h2 className="text-xl md:text-2xl font-bold text-slate-800 shrink-0">
                          Pizarra NIO
                        </h2>
                        
                        {/* Botón Refrescar (visible solo en móvil aquí, o siempre) */}
                        <button 
                          onClick={() => handleRefres()}
                          className={`sm:hidden p-2 rounded-xl text-white transition-all ${!selectedProject ? 'bg-slate-400' : 'bg-blue-600'}`}
                        >
                          <RefreshCw className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Contenedor de Acciones: Selector + Botones */}
                      <div className="flex flex-col sm:flex-row flex-1 gap-3 items-stretch sm:items-center w-full sm:max-w-2xl">
                        
                        {/* Selector Centralizado */}
                        <div className="relative flex-1">
                          <select 
                            value={selectedProject?.id || ""} 
                            onChange={handleProjectChange}
                            className={`
                              w-full pl-4 pr-10 py-2.5 cursor-pointer appearance-none
                              text-sm font-semibold rounded-xl border-2 transition-all outline-none
                              ${!selectedProject 
                                ? "bg-slate-50 border-slate-200 text-slate-400" 
                                : "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm shadow-emerald-100"
                              }
                              hover:border-emerald-400 focus:ring-2 focus:ring-emerald-200
                            `}
                          >
                            <option value="" disabled>Seleccionar obra...</option>
                            {projects.map((project) => (
                              <option key={project.id} value={project.id}>
                                {project.name}
                              </option>
                            ))}
                          </select>
                          
                          {/* Flecha decorativa */}
                          <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 ${!selectedProject ? 'text-slate-400' : 'text-emerald-600'}`}>
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                            </svg>
                          </div>
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex gap-2 shrink-0">
                          {/* Refrescar (Desktop) */}
                          <button 
                            onClick={() => handleRefres()}
                            className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium transition-all shadow-lg shadow-blue-100
                              ${!selectedProject ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}
                            `}
                          >
                            Refrescar
                          </button>

                          {/* Iniciar NIO */}
                          <button 
                            disabled={!selectedProject}
                            onClick={() => handleOpenNio()}
                            className={`flex-1 sm:flex-none justify-center items-center px-6 py-2.5 rounded-xl text-white font-bold flex gap-2 transition-all shadow-lg
                              ${!selectedProject 
                                ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}
                            `}
                          >
                            <Plus className="h-5 w-5" /> 
                            <span className="whitespace-nowrap">Iniciar NIO</span>
                          </button>
                        </div>
                      </div>
                    </div>
                      {
                        !loading?
                       <div className="mx-auto max-w-7xl">
                        {renderNIOBoard()}
                      </div>:<p>Cargando...</p>
                      }

                    </div>
  );
}
