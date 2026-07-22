// src/hooks/useVariants.js
import { useState, useCallback, useEffect, useRef } from "react";
import api from "../services/api";

/**
 * useVariants — fuente de verdad para variantes de un producto.
 * Expone CRUD + gestión de atributos sin que los componentes
 * toquen directamente la API.
 */
export function useVariants(productId) {
  const [variants,   setVariants]   = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const abortRef = useRef(null);

  // ─── Fetch ────────────────────────────────────────────────────
  const fetchVariants = useCallback(async (signal) => {
    if (!productId) return;
    const { data } = await api.get(`/products/${productId}/variants`, { signal });
    setVariants(data.data ?? []);
  }, [productId]);

  const fetchAttributes = useCallback(async (signal) => {
    const { data } = await api.get("/attributes", { signal });
    setAttributes(data.data ?? []);
  }, []);

  const loadAll = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchVariants(ctrl.signal),
        fetchAttributes(ctrl.signal),
      ]);
    } catch (err) {
      if (err.name !== "CanceledError" && err.name !== "AbortError") {
        setError(err.response?.data?.message ?? "Error al cargar variantes");
      }
    } finally {
      setLoading(false);
    }
  }, [fetchVariants, fetchAttributes]);

  useEffect(() => {
    loadAll();
    return () => abortRef.current?.abort();
  }, [loadAll]);

  // ─── CRUD variantes ───────────────────────────────────────────
  const createVariant = useCallback(async (payload) => {
    const { data } = await api.post(`/products/${productId}/variants`, payload);
    setVariants((prev) => [...prev, data.data]);
    return data.data;
  }, [productId]);

  const updateVariant = useCallback(async (variantId, payload) => {
    // F-01: stock es inmutable desde el CRUD general; solo via /inventory/adjustment
    const { stock: _removed, ...safePayload } = payload;
    if (Object.keys(safePayload).length === 0) return;
    await api.put(`/products/${productId}/variants/${variantId}`, safePayload);
    setVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, ...safePayload } : v))
    );
  }, [productId]);

  const toggleActive = useCallback(async (variantId, isActive) => {
    await api.put(`/products/${productId}/variants/${variantId}`, { is_active: isActive });
    setVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, is_active: isActive } : v))
    );
  }, [productId]);

  const deleteVariant = useCallback(async (variantId) => {
    await api.delete(`/products/${productId}/variants/${variantId}`);
    setVariants((prev) => prev.filter((v) => v.id !== variantId));
  }, [productId]);

  // ─── Atributos ────────────────────────────────────────────────
  const createAttributeValue = useCallback(async (typeId, payload) => {
    const { data } = await api.post(`/attributes/${typeId}/values`, payload);
    // Insertar en el tipo correcto sin refetch completo
    setAttributes((prev) =>
      prev.map((at) =>
        at.id === Number(typeId)
          ? { ...at, values: [...(at.values ?? []), data.data] }
          : at
      )
    );
    return data.data;
  }, []);

  // ─── Métricas rápidas ─────────────────────────────────────────
  const stats = {
    total:    variants.length,
    active:   variants.filter((v) => v.is_active).length,
    // F-12: usar safety_stock/min_stock del producto en lugar de hardcodear 3
    // TODO: pedir al backend que incluya safety_stock/min_stock en el endpoint de variantes si aún no lo hace
    lowStock: variants.filter((v) => v.stock <= (v.safety_stock ?? v.min_stock ?? 3) && v.is_active).length,
    noStock:  variants.filter((v) => v.stock === 0).length,
  };

  return {
    variants,
    attributes,
    loading,
    error,
    stats,
    refresh:              loadAll,
    createVariant,
    updateVariant,
    toggleActive,
    deleteVariant,
    createAttributeValue,
  };
}