import { useEffect } from 'react'; // <--- ¡Importante!
import { AlertCircle, CheckCircle2 } from "lucide-react"; // <--- Importa los iconos que uses

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bg = type === 'error' ? 'bg-red-500' : 'bg-emerald-500';

  return (
    <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[250] ${bg} text-white px-6 py-3 rounded-2xl shadow-2xl font-bold flex items-center gap-3 animate-in slide-in-from-top duration-300`}>
      {/* Usamos CheckCircle2 para éxito, se ve más "limpio" que el de bolsa */}
      {type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
      {message}
    </div>
  );
};

// ¡QUE NO SE TE OLVIDE ESTA LÍNEA! 
export default Toast;