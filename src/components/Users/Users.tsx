import React, {useState,useEffect} from "react";

import UserFormModal from "./UserFormModal";
import { Role, User } from "@/src/backend/types";
import { apiClient } from './../../api';
import { Plus, Edit, Trash2 } from "lucide-react";
import ConfirmDeleteModal from "@/src/components/Styles/DeleteModal";

export default function UsersComponent() {
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isUserDeleteModalOpen, setIsUserDeleteModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [roles,setRoles] = useState<Role[]>([]);
    const [loading,setLoading]= useState<Boolean>(false);
  const handleUpdateUser = async (user: User) => {
    const updated = await apiClient.users.update(user);

    setUsers(prev =>
      prev.map(p => (p.id === updated.id ? user : p))
    );

    setEditingUser(null);
    setIsUserModalOpen(false); 
  };    
  const handleCreateUser = async (user: User) => {
    try {
      const response = await apiClient.users.create(user);
      let newIdUser={...user,id:response.id}
      setUsers(prev => [...prev, newIdUser]);
      setIsUserModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error al crear usuario');
    }
  };

  const handleDeleteUser = async (user: User) => {
    setLoading(true)
    const deleteResponse = await apiClient.users.delete(user.id);
    if(deleteResponse.message){
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    }else{
      alert("Error "+ deleteResponse)
    }
    setLoading(false)
    setIsUserDeleteModalOpen(false)
    setIsUserModalOpen(false)
    setEditingUser(null);
  };
  // Initialize and load from "Postgres"
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [role,users] = await Promise.all([
          apiClient.roles.list(),
          apiClient.users.list()
        ]);
        setRoles(role);
        setUsers(users)
      } catch (error) {
        console.error("DB Connection Error:", error);
      }
    };
    fetchData();
  }, []);
  return (
        <div >
            <div className="flex pb-6 justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h2>
                <button 
                onClick={() => setIsUserModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-200 transition-all"
                >
                <Plus className="h-5 w-5" /> Nuevo Usuario
                </button>
            </div>
            {/* MODAL: Nueva Usuario */}
        <UserFormModal
            isOpen={isUserModalOpen}
            roles={roles}
            onClose={() => {
            setIsUserModalOpen(false);
            setEditingUser(null);
            }}
            mode={editingUser ? "edit" : "create"}
            initialData={editingUser ?? undefined}
            onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
        />
              {editingUser?
                <ConfirmDeleteModal
                isOpen={isUserDeleteModalOpen}
                onClose={() => {
                  setIsUserDeleteModalOpen(false);
                }}
                onConfirm={() => {
                  handleDeleteUser(editingUser)
                }}
                itemName={" el usuario "+editingUser.name}
                loading={loading}
                ></ConfirmDeleteModal>:null     
              }
      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-8 overflow-hidden">
          <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Nombre
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Apellido
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Rol
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.rol.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center flex justify-center gap-4">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setIsUserModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {setEditingUser(user);setIsUserDeleteModalOpen(true)}}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-gray-400 text-sm"
                    >
                      No hay usuarios registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
              {/* Indicador visual opcional para móvil */}
            <div className="md:hidden bg-slate-50 text-[10px] text-slate-400 text-center py-1 border-t">
                ← Desliza lateralmente para ver más →
            </div>
            </div>
        </div>
  );
}
