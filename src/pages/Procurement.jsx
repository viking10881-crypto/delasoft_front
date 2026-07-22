// src/pages/Procurement.jsx
import { useState, useMemo } from 'react';
import {
  ShoppingCart, ChevronDown, ChevronUp, Loader2,
  Package, Calendar, AlertCircle, CheckCircle2, X,
  Truck, DollarSign, ClipboardCheck,
} from 'lucide-react';
import { useNotice } from '../context/NoticeContext';
import {
  usePendingProcurement,
  usePurchaseOrders,
  useSalesAwaitingFulfillment,
  useGroupPurchaseOrder,
  useCancelProcurement,
  useReceivePurchaseOrder,
  useMarkSaleDelivered,
} from '../hooks/useProcurement';

const fmtCOP = (n) =>
  Number(n ?? 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ── GroupConfirmModal ─────────────────────────────────────────────────────────
function GroupConfirmModal({ items, supplier, onConfirm, onClose, loading }) {
  const total = items.reduce((s, i) => s + Number(i.estimated_total ?? 0), 0);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-[#131B2A] w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="sm:hidden w-10 h-1 bg-gray-200 dark:bg-white/20 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />

        <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-gray-100 dark:border-white/[0.06] flex-shrink-0">
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Confirmar orden de compra</p>
            <h3 className="font-black text-gray-900 dark:text-white">Enviar al proveedor</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <div className="bg-blue-50 dark:bg-blue-500/10 rounded-2xl px-4 py-3">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Proveedor</p>
            <p className="text-sm font-black text-blue-900 dark:text-blue-100 mt-0.5">{supplier}</p>
          </div>

          <div className="space-y-1.5">
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-white/[0.04] last:border-0">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">{item.product_name}</p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500">Venta #{item.sale_number} · {item.quantity} ud.</p>
                </div>
                <p className="text-sm font-black text-gray-900 dark:text-white flex-shrink-0">{fmtCOP(item.estimated_total)}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-sm font-bold text-gray-700 dark:text-slate-300">Total estimado</p>
            <p className="text-lg font-black text-gray-900 dark:text-white">{fmtCOP(total)}</p>
          </div>
        </div>

        <div className="px-6 pb-6 pt-3 border-t border-gray-100 dark:border-white/[0.06] flex-shrink-0 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Generar orden
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SupplierCard ──────────────────────────────────────────────────────────────
function SupplierCard({ supplierName, items, selectedIds, onToggle, onToggleAll, onGenerate, cancelMutate }) {
  const [collapsed, setCollapsed] = useState(false);
  const { showNotice, askConfirmation } = useNotice();

  const supplierId   = items[0]?.supplier_id ?? null;
  const leadTime     = items[0]?.lead_time_days ?? '?';
  const oldestDays   = Math.max(...items.map(i => i.days_waiting ?? 0));
  const totalEst     = items.reduce((s, i) => s + Number(i.estimated_total ?? 0), 0);
  const selectedHere = items.filter(i => selectedIds.has(i.id));
  const allSelected  = selectedHere.length === items.length;

  const handleCancel = async (item) => {
    const ok = await askConfirmation(`¿Cancelar la orden de ${item.product_name}?`, 'warning');
    if (!ok) return;
    try {
      await cancelMutate(item.id, 'Cancelada por el administrador');
      showNotice('Orden cancelada', 'success');
    } catch (e) {
      showNotice(e.message, 'error');
    }
  };

  return (
    <div className="bg-white dark:bg-[#131B2A] rounded-3xl border border-gray-100 dark:border-white/[0.06] shadow-sm overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
        onClick={() => setCollapsed(p => !p)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0">
            <ShoppingCart size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="font-black text-gray-900 dark:text-white text-sm truncate">{supplierName}</p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500">
              {items.length} ítem{items.length !== 1 ? 's' : ''} · Lead {leadTime} días · {oldestDays}d esperando
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          <p className="text-sm font-black text-gray-900 dark:text-white hidden sm:block">{fmtCOP(totalEst)}</p>
          {collapsed ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronUp size={16} className="text-gray-400" />}
        </div>
      </div>

      {!collapsed && (
        <div className="border-t border-gray-100 dark:border-white/[0.06]">
          <div className="px-5 py-3 flex items-center justify-between border-b border-gray-50 dark:border-white/[0.04]">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => onToggleAll(items, allSelected)}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span className="text-xs font-semibold text-gray-600 dark:text-slate-400">Seleccionar todos</span>
            </label>
            {selectedHere.length > 0 && (
              <button
                onClick={() => onGenerate(selectedHere, supplierName, supplierId)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 active:scale-[0.97] transition-all"
              >
                <ShoppingCart size={12} />
                Generar OC ({selectedHere.length})
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
            {items.map(item => (
              <div key={item.id} className="px-5 py-3 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.id)}
                  onChange={() => onToggle(item.id)}
                  className="w-4 h-4 rounded accent-blue-600 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">{item.product_name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[10px] text-gray-400 dark:text-slate-500">{item.quantity} ud.</span>
                    <span className="text-[10px] text-gray-300 dark:text-white/20">·</span>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500">{fmtCOP(item.estimated_unit_cost)} c/u</span>
                    <span className="text-[10px] text-gray-300 dark:text-white/20">·</span>
                    <a
                      href={`/history`}
                      className="text-[10px] text-blue-500 hover:underline"
                      onClick={e => e.stopPropagation()}
                    >
                      Venta #{item.sale_number}
                    </a>
                    <span className="text-[10px] text-gray-300 dark:text-white/20">·</span>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 flex items-center gap-0.5">
                      <Calendar size={9} /> {fmtDate(item.created_at)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className="text-sm font-black text-gray-900 dark:text-white">{fmtCOP(item.estimated_total)}</p>
                  <button
                    onClick={() => handleCancel(item)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    title="Cancelar"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── ReceiveModal ──────────────────────────────────────────────────────────────
function ReceiveModal({ po, onConfirm, onClose, loading }) {
  const [costs, setCosts] = useState(() => {
    const c = {};
    (po.items ?? []).forEach(i => { c[i.id] = String(i.unit_cost ?? ''); });
    return c;
  });

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-[#131B2A] w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="sm:hidden w-10 h-1 bg-gray-200 dark:bg-white/20 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />
        <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-gray-100 dark:border-white/[0.06] flex-shrink-0">
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Recibir orden</p>
            <h3 className="font-black text-gray-900 dark:text-white">{po.order_number}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
            <X size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <p className="text-xs text-gray-500 dark:text-slate-400">Confirma o ajusta el costo real de cada producto recibido.</p>
          {(po.items ?? []).map(item => (
            <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-white/[0.04] last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">{item.product_name}</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500">{item.quantity} ud.</p>
              </div>
              <div className="relative w-28 flex-shrink-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                <input
                  type="number"
                  min="0"
                  value={costs[item.id] ?? ''}
                  onChange={e => setCosts(p => ({ ...p, [item.id]: e.target.value }))}
                  className="w-full pl-6 pr-2 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 pb-6 pt-3 border-t border-gray-100 dark:border-white/[0.06] flex-shrink-0 flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 py-3 rounded-2xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button
            onClick={() => {
              const actualUnitCosts = {};
              (po.items ?? []).forEach(i => {
                const v = Number(costs[i.id]);
                if (!isNaN(v) && v >= 0) actualUnitCosts[i.id] = v;
              });
              onConfirm(po.id, { actualUnitCosts });
            }}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Confirmar recepción
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Procurement ───────────────────────────────────────────────────────────────
export default function Procurement() {
  const { showNotice, askConfirmation } = useNotice();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'sent' | 'awaiting'

  const { data: pendingData, loading: pendingLoading, error: pendingError, reload: reloadPending } = usePendingProcurement();
  const { data: poData,      loading: poLoading,      error: poError,      reload: reloadPO }      = usePurchaseOrders();
  const { data: awaitData,   loading: awaitLoading,   error: awaitError,   reload: reloadAwait }   = useSalesAwaitingFulfillment();

  const { mutate: cancelMutate }  = useCancelProcurement(reloadPending);
  const { mutate: receiveMutate, loading: receiving } = useReceivePurchaseOrder(() => { reloadPO(); showNotice('Orden recibida correctamente', 'success'); });
  const { mutate: deliverMutate, loading: delivering } = useMarkSaleDelivered(() => { reloadAwait(); showNotice('Venta marcada como entregada', 'success'); });

  const [selectedIds,  setSelectedIds]  = useState(new Set());
  const [confirmModal, setConfirmModal] = useState(null);
  const [receiveModal, setReceiveModal] = useState(null);

  const { mutate: groupMutate, loading: grouping } = useGroupPurchaseOrder(() => {
    setConfirmModal(null);
    setSelectedIds(new Set());
    reloadPending();
    reloadPO();
    showNotice('Orden de compra creada exitosamente', 'success');
  });

  const bySupplier = useMemo(() => {
    const map = new Map();
    (pendingData ?? []).forEach(item => {
      const key = item.supplier_id ?? 'sin-proveedor';
      const name = item.supplier_name ?? 'Sin proveedor';
      if (!map.has(key)) map.set(key, { name, items: [] });
      map.get(key).items.push(item);
    });
    return [...map.values()];
  }, [pendingData]);

  const toggleId = (id) =>
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const toggleAll = (items, allSelected) =>
    setSelectedIds(prev => { const next = new Set(prev); items.forEach(i => allSelected ? next.delete(i.id) : next.add(i.id)); return next; });

  const handleConfirm = async () => {
    if (!confirmModal) return;
    try {
      await groupMutate({ procurementOrderIds: confirmModal.items.map(i => i.id), supplierId: confirmModal.supplierId });
    } catch (e) { showNotice(e.message, 'error'); }
  };

  const handleDeliver = async (saleId) => {
    const ok = await askConfirmation('¿Confirmas que el pedido fue entregado al cliente? Esto reconocerá el ingreso.', 'warning');
    if (!ok) return;
    try { await deliverMutate(saleId); } catch (e) { showNotice(e.message, 'error'); }
  };

  const TABS = [
    { key: 'pending', label: 'Por enviar',   count: pendingData?.length ?? 0 },
    { key: 'sent',    label: 'Enviadas',      count: poData?.length ?? 0 },
    { key: 'awaiting',label: 'Por entregar', count: awaitData?.length ?? 0 },
  ];

  return (
    <div className="pb-28 lg:pb-8 bg-gray-50 dark:bg-[#0D1117] min-h-screen transition-colors duration-300">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">

        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Compras</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Gestión de órdenes de compra y entrega</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-[#131B2A] rounded-2xl p-1 border border-gray-100 dark:border-white/[0.06]">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all
                ${activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-black
                  ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab: Por enviar ── */}
        {activeTab === 'pending' && (
          <>
            {pendingLoading && <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-blue-500" /></div>}
            {pendingError && !pendingLoading && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl px-4 py-3 text-red-700 dark:text-red-400 text-sm font-medium">
                <AlertCircle size={16} />{pendingError}
              </div>
            )}
            {!pendingLoading && !pendingError && bySupplier.length === 0 && (
              <div className="flex flex-col items-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-500/10 flex items-center justify-center mb-4">
                  <CheckCircle2 size={28} className="text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-black text-gray-900 dark:text-white text-lg">Sin pendientes</h3>
                <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Todas las órdenes fueron enviadas al proveedor</p>
              </div>
            )}
            {!pendingLoading && bySupplier.map(({ name, items }) => (
              <SupplierCard key={name} supplierName={name} items={items} selectedIds={selectedIds}
                onToggle={toggleId} onToggleAll={toggleAll}
                onGenerate={(selItems, supplierName, supplierId) => setConfirmModal({ items: selItems, supplierName, supplierId })}
                cancelMutate={cancelMutate}
              />
            ))}
          </>
        )}

        {/* ── Tab: Enviadas (purchase_orders pendientes de recibir) ── */}
        {activeTab === 'sent' && (
          <>
            {poLoading && <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-blue-500" /></div>}
            {poError && !poLoading && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl px-4 py-3 text-red-700 dark:text-red-400 text-sm font-medium">
                <AlertCircle size={16} />{poError}
              </div>
            )}
            {!poLoading && !poError && poData?.length === 0 && (
              <div className="flex flex-col items-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center mb-4">
                  <Package size={28} className="text-gray-400 dark:text-slate-500" />
                </div>
                <h3 className="font-black text-gray-900 dark:text-white text-lg">Sin órdenes enviadas</h3>
                <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Crea y envía órdenes desde la pestaña "Por enviar"</p>
              </div>
            )}
            {!poLoading && (poData ?? []).map(po => (
              <div key={po.id} className="bg-white dark:bg-[#131B2A] rounded-3xl border border-gray-100 dark:border-white/[0.06] shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                      <Truck size={16} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-gray-900 dark:text-white text-sm">{po.order_number}</p>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500">
                        {po.supplier_name ?? 'Sin proveedor'} · {(po.items ?? []).length} ítem{(po.items ?? []).length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <p className="text-sm font-black text-gray-900 dark:text-white hidden sm:block">{fmtCOP(po.total_cost)}</p>
                    <button
                      onClick={() => setReceiveModal(po)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 active:scale-[0.97] transition-all"
                    >
                      <ClipboardCheck size={12} /> Recibir
                    </button>
                  </div>
                </div>
                <div className="border-t border-gray-50 dark:border-white/[0.04] divide-y divide-gray-50 dark:divide-white/[0.04]">
                  {(po.items ?? []).map(item => (
                    <div key={item.id} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">{item.product_name}</p>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500">{item.quantity} ud. · {fmtCOP(item.unit_cost)} c/u</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── Tab: Por entregar ── */}
        {activeTab === 'awaiting' && (
          <>
            {awaitLoading && <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-blue-500" /></div>}
            {awaitError && !awaitLoading && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl px-4 py-3 text-red-700 dark:text-red-400 text-sm font-medium">
                <AlertCircle size={16} />{awaitError}
              </div>
            )}
            {!awaitLoading && !awaitError && awaitData?.length === 0 && (
              <div className="flex flex-col items-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-500/10 flex items-center justify-center mb-4">
                  <CheckCircle2 size={28} className="text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-black text-gray-900 dark:text-white text-lg">Sin pedidos por entregar</h3>
                <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Todos los pedidos on-demand han sido entregados</p>
              </div>
            )}
            {!awaitLoading && (awaitData ?? []).map(sale => (
              <div key={sale.id} className="bg-white dark:bg-[#131B2A] rounded-3xl border border-gray-100 dark:border-white/[0.06] shadow-sm p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-black text-gray-900 dark:text-white text-sm">Venta #{sale.sale_number}</p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                      {sale.customer_name} · {fmtCOP(sale.total)} · {fmtDate(sale.sale_date)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold
                        ${sale.procurement_status === 'complete'
                          ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                          : 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400'
                        }`}>
                        {sale.pending_pos > 0 ? `${sale.pending_pos} OC pendiente${sale.pending_pos !== 1 ? 's' : ''}` : 'Mercancía lista'}
                      </span>
                      {sale.estimated_delivery_date && (
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 flex items-center gap-0.5">
                          <Calendar size={9} /> {fmtDate(sale.estimated_delivery_date)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeliver(sale.id)}
                    disabled={sale.procurement_status !== 'complete' && sale.procurement_status !== 'not_required' || delivering}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                    title={sale.procurement_status !== 'complete' && sale.procurement_status !== 'not_required' ? 'Aún hay OCs pendientes de recibir' : ''}
                  >
                    {delivering ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                    Marcar entregada
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </main>

      {confirmModal && (
        <GroupConfirmModal
          items={confirmModal.items}
          supplier={confirmModal.supplierName}
          loading={grouping}
          onConfirm={handleConfirm}
          onClose={() => setConfirmModal(null)}
        />
      )}

      {receiveModal && (
        <ReceiveModal
          po={receiveModal}
          loading={receiving}
          onConfirm={(poId, opts) => receiveMutate(poId, opts).then(() => setReceiveModal(null)).catch(e => showNotice(e.message, 'error'))}
          onClose={() => setReceiveModal(null)}
        />
      )}
    </div>
  );
}