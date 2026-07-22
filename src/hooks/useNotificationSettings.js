// src/hooks/useNotificationSettings.js
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useNotificationSettings() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/notifications/settings');
      setData(res.data?.data ?? null);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}

export function useUpdateNotificationSettings(onSuccess) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const mutate = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.put('/notifications/settings', payload);
      onSuccess?.(res.data);
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Error al guardar configuración';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  return { mutate, loading, error };
}

export function useTestWhatsApp() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);

  const send = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await api.post('/notifications/test-whatsapp');
      setSuccess(true);
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Error al enviar prueba';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { send, loading, error, success };
}