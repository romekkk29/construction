import React from 'react';
import { Construction, Chrome, AlertCircle } from 'lucide-react';

const Login = () => {
  // Capturamos los parámetros de la URL (ej: ?error=unauthorized)
  const queryParams = new URLSearchParams(window.location.search);
  const error = queryParams.get('error');

  const handleGoogleLogin = () => {
    // Redirige al backend para iniciar el flujo de Google
    window.location.href = process.env.FRONTEND_URL+'/auth/google';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-xl border border-slate-100 p-10 text-center animate-in fade-in zoom-in duration-500">
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-4 rounded-3xl shadow-lg shadow-blue-200">
            <Construction className="h-10 w-10 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl font-black text-slate-800 mb-2">
          Logic Cost <span className="text-blue-600">App</span>
        </h1>
        <p className="text-slate-500 mb-8 font-medium">
          Gestión inteligente de costos y logística.
        </p>

        {/* Mensaje de Error si viene de la redirección del backend */}
        {error === 'unauthorized' && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-left animate-in shake duration-500">
            <div className="bg-red-500 p-2 rounded-lg">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-800">Acceso Denegado</p>
              <p className="text-xs text-red-600">Tu correo no está registrado en el sistema.</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 hover:border-blue-100 hover:bg-blue-50 text-slate-700 font-bold py-4 px-6 rounded-2xl transition-all duration-300 group shadow-sm hover:shadow-md"
          >
            <Chrome className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
            Continuar con Google
          </button>
        </div>

        <p className="mt-8 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          LogiCost System v1.0
        </p>
      </div>

      {/* Estilo para la animación de error (Shake) */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Login;