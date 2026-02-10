import React, { useState } from 'react';
import { 
  Construction, 
  Menu, 
  Bell, 
  LogOut, 
  User as UserIcon,
  ChevronDown
} from 'lucide-react';
import { useAuth } from './../Login/ProtectedRoute'; // Ajusta la ruta

const Header = ({ onOpenSidebar }: { onOpenSidebar: () => void, user?: any }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user } = useAuth(); 
  const handleLogout = () => {
    // Redirigimos al endpoint de logout del backend
    // Esto destruye la cookie y luego el backend redirige al frontend
    window.location.href =  process.env.FRONTEND_URL+'/auth/logout';
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-white px-4 shadow-sm md:px-6">
      <div className="flex items-center gap-4">
        <button onClick={onOpenSidebar} className="p-2 hover:bg-slate-100 rounded-lg md:hidden">
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Construction className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">
            Apolo Sur<span className="text-blue-600"></span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notificaciones */}
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
        </button>

        {/* Menú de Usuario / Logout */}
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 p-1 pr-2 hover:bg-slate-50 rounded-full border border-transparent hover:border-slate-200 transition-all"
          >
            {/* Si tienes la foto de Google en el objeto user, puedes usar user.photos[0].value */}
            <div className="h-8 w-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-5 w-5" />
              )}
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMenuOpen && (
            <>
              {/* Overlay transparente para cerrar al hacer clic fuera */}
              <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
              
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-2 border-b border-slate-50 mb-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Usuario</p>
                  <p className="text-sm font-semibold text-slate-700 truncate">{user?.name || 'Usuario'}</p>
                </div>
                
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;