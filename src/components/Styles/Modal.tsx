import React from "react";
import { 
  X
} from 'lucide-react';



const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children?: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b p-6">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="h-6 w-6" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default Modal