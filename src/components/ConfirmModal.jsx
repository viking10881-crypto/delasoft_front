import { CheckCircle2, Trash2 } from "lucide-react";

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmLabel = "Eliminar permanentemente",
  tone = "danger",
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const isDanger = tone === "danger";
  const Icon = isDanger ? Trash2 : CheckCircle2;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
          isDanger ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-600"
        }`}>
          <Icon size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 font-medium mb-8 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm} 
            className={`flex-1 py-4 text-white rounded-2xl font-bold transition-all active:scale-95 ${
              isDanger
                ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200"
                : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ESTA ES LA LÍNEA QUE FALTA:
export default ConfirmModal;
