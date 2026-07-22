// src/hooks/useRealtimeData.js
import { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * Escucha eventos `data:update` del socket y llama a `onUpdate`
 * cada vez que alguno de los `resources` indicados cambia.
 *
 * FIX: antes el handler recibía el objeto `event` completo y lo
 * pasaba a `onUpdate`, pero en Discounts.jsx se esperaba que
 * `onUpdate` fuera simplemente `loadData` (sin argumentos).
 * Ahora el hook llama a `onUpdate()` sin parámetros, lo que
 * permite usarlo tanto con callbacks simples como con `loadData`.
 */
export default function useRealtimeData(resources = [], onUpdate) {
  const { socket } = useSocket();
  const onUpdateRef = useRef(onUpdate);

  // Mantener la ref actualizada sin re-suscribir el socket
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const resourceList = Array.isArray(resources) ? resources : [resources];
  const resourceKey  = resourceList.join(',');

  useEffect(() => {
    if (!socket) return;

    const handler = (event) => {
      if (!event?.resource) return;
      if (resourceList.includes(event.resource)) {
        onUpdateRef.current?.(event);
      }
    };

    socket.on('data:update', handler);
    return () => socket.off('data:update', handler);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, resourceKey]);
}