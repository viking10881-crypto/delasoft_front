import Lottie from "lottie-react";
import animationData from "../assets/loading.json"; 

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[999] bg-[#F8FAFC] flex flex-col items-center justify-center">
      {/* Contenedor de la Animación: 
          Reducimos el tamaño para que no sea invasivo y sea más elegante 
      */}
      <div className="w-48 h-48 opacity-80">
        <Lottie 
          animationData={animationData} 
          loop={true} 
        />
      </div>

      {/* Indicador de carga minimalista:
          Cambiamos el azul vibrante por un Slate (pizarra) sutil.
          Quitamos el "Procesando Avalancha" y los tips.
      */}
      <div className="mt-4 flex flex-col items-center gap-2">
        <span className="text-slate-400 text-[10px] tracking-[0.4em] uppercase font-medium">
          Cargando
        </span>
        
        {/* Barra de progreso sutil (Opcional, pero da mucha clase) */}
        <div className="w-12 h-[2px] bg-slate-100 overflow-hidden relative">
          <div className="absolute inset-0 bg-slate-300 animate-loading-bar"></div>
        </div>
      </div>
    </div>
  );
}