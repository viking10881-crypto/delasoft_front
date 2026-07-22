// src/utils/fulfillment.js
// All products are hybrid: stock when available, procurement when not.
// These helpers are kept for call-site compatibility but always return the hybrid value.

export const isOnDemand = () => false;
export const isHybrid   = () => true;
export const isStock    = () => false;

export const showStockUI     = () => true;
export const showStockConfig = () => true;
export const alwaysSellable  = () => true;

export const outOfStockLabel = () => "Agotado · disponible por pedido";

export const fulfillmentBadgeLabel = () => null;

export const leadTimeText = (p) =>
  p?.supplier_lead_time_days ? `Entrega en ${p.supplier_lead_time_days} días` : null;
