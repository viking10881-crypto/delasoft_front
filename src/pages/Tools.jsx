import { Settings } from "lucide-react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";

export default function Tools() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <div className="px-6 pt-8 pb-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Settings className="text-blue-600" size={40} />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Herramientas
          </h1>
          
          <p className="text-gray-500 mb-6">
            Administra el contenido y la logística del sistema desde el menú lateral
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <p className="text-sm text-blue-900 font-medium mb-2">
              💡 En escritorio
            </p>
            <p className="text-xs text-blue-700">
              Usa el menú lateral izquierdo para acceder rápidamente a todas las herramientas disponibles.
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}