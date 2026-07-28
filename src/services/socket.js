// src/services/socket.js
import { io } from 'socket.io-client';

const rawUrl = import.meta.env.VITE_API_URL || 'https://delasoft-back.onrender.com/api';
export const SOCKET_URL = rawUrl.startsWith('/')
  ? window.location.origin
  : rawUrl.replace(/\/api\/?$/, '');

let socket = null;

export const getSocket = () => socket;

export const initSocket = () => {
  if (socket?.connected) return socket;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: (cb) => cb({ token: localStorage.getItem('accessToken') }),
    transports:           ['websocket'],
    reconnectionDelay:    1500,
    reconnectionAttempts: 8,
    withCredentials:      false,
  });

  if (import.meta.env.DEV) {
    socket.on('connect',       () => console.log('[Socket] conectado:', socket.id));
    socket.on('disconnect',    (r) => console.log('[Socket] desconectado:', r));
    socket.on('connect_error', (e) => console.error('[Socket] error:', e.message));
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};
