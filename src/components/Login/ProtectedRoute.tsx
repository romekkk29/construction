import React, { createContext, useContext, useEffect, useState } from 'react';
import Login from './Login';
import { Loader2 } from 'lucide-react';

// 1. Definimos la forma de los datos
interface AuthContextType {
  user: any;
  setUser: (user: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(process.env.FRONTEND_URL+'/api/me', { 
          credentials: 'include' 
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data);
          }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  // 2. Si hay usuario, proveemos el contexto. Si no, mostramos Login.
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {user ? children : <Login />}
    </AuthContext.Provider>
  );
};

// 3. Hook personalizado para usar el usuario en cualquier componente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};