// src/hooks/useProcurement.js
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function usePendingProcurement() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/procurement/pending');
      setData(res.data?.data ?? []);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Error al cargar compras pendientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}

export function useSalesAwaitingFulfillment() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/procurement/sales-awaiting');
      setData(res.data?.data ?? []);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Error al cargar ventas en espera');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}

export function useGroupPurchaseOrder(onSuccess) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const mutate = useCallback(async ({ procurementOrderIds, supplierId, notes }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/procurement/group-purchase-order', {
        procurementOrderIds, supplierId, notes,
      });
      onSuccess?.(res.data);
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Error al crear orden de compra';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  return { mutate, loading, error };
}

export function useCancelProcurement(onSuccess) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const mutate = useCallback(async (id, reason) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/procurement/${id}/cancel`, { reason });
      onSuccess?.(res.data);
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Error al cancelar';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  return { mutate, loading, error };
}

export function usePurchaseOrders() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/procurement/purchase-orders');
      setData(res.data?.data ?? []);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Error al cargar órdenes de compra');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}

export function useReceivePurchaseOrder(onSuccess) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const mutate = useCallback(async (purchaseOrderId, { receivedQuantities, actualUnitCosts } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/inventory/purchase-order/${purchaseOrderId}/receive`, {
        received_quantities: receivedQuantities,
        actual_unit_costs:   actualUnitCosts,
      });
      onSuccess?.(res.data);
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Error al recibir orden de compra';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  return { mutate, loading, error };
}

export function useMarkSaleDelivered(onSuccess) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const mutate = useCallback(async (saleId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/sales/${saleId}/mark-delivered`);
      onSuccess?.(res.data);
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Error al marcar como entregada';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  return { mutate, loading, error };
}