import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

const NoticeContext = createContext();

export const NoticeProvider = ({ children }) => {
  const [notice, setNotice] = useState({ show: false, message: '', type: 'success' });
  
  // Estado para el modal de confirmación
  const [confirm, setConfirm] = useState({ 
    show: false, 
    title: '', 
    message: '', 
    resolve: null // Aquí guardaremos la promesa
  });

  const showNotice = useCallback((message, type = 'success') => {
    setNotice({ show: true, message, type });
  }, []);

  // Función mágica: devuelve una promesa que se resuelve al hacer clic
  const askConfirmation = useCallback((title, message) => {
    return new Promise((resolve) => {
      setConfirm({
        show: true,
        title,
        message,
        resolve // Guardamos la función para avisar cuando acepten
      });
    });
  }, []);

  const handleConfirmAction = (choice) => {
    if (confirm.resolve) confirm.resolve(choice); // Enviamos true o false
    setConfirm({ ...confirm, show: false, resolve: null });
  };

  return (
    <NoticeContext.Provider value={{ showNotice, askConfirmation }}>
      {children}
      
      {/* Toast Global */}
      {notice.show && (
        <Toast 
          message={notice.message} 
          type={notice.type} 
          onClose={() => setNotice(prev => ({ ...prev, show: false }))} 
        />
      )}

      {/* Modal de Confirmación Global */}
      <ConfirmModal 
        isOpen={confirm.show}
        title={confirm.title}
        message={confirm.message}
        onConfirm={() => handleConfirmAction(true)}
        onClose={() => handleConfirmAction(false)}
      />
    </NoticeContext.Provider>
  );
};

export const useNotice = () => useContext(NoticeContext);