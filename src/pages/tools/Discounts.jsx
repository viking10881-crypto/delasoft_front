import { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, Tag, Clock, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import useRealtimeData from '../../hooks/useRealtimeData';
import { EMPTY_FORM, safeDate, getDiscountStatus } from '../../../utils/DiscountUtils';
import { LoadingSpinner, EmptyState } from '../../components/discounts/DiscountUI';
import DiscountCard from '../../components/discounts/DiscountCard';
import DiscountModal from '../../components/discounts/DiscountModal';

// ─────────────────────────────────────────────────────────────────────────────
// Tokens de liquid glass en Tailwind puro
// Se definen como strings para componer con cn() o interpolación directa.
// No requieren CSS externo; todas son clases válidas de Tailwind v3.
// ─────────────────────────────────────────────────────────────────────────────

// Superficie glass estándar (métricas, elementos secundarios)
const GLASS =
  'backdrop-blur-xl backdrop-saturate-150 ' +
  'bg-white/[0.05] ' +
  'border border-white/[0.12] ' +
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.3)]';

// Superficie glass profunda (métricas destacadas)
const GLASS_DEEP =
  'backdrop-blur-2xl backdrop-saturate-200 ' +
  'bg-white/[0.07] ' +
  'border border-white/[0.14] ' +
  'shadow-[inset_0_1.5px_0_rgba(255,255,255,0.18),0_12px_40px_rgba(0,0,0,0.38)]';

// Shimmer + overflow para tarjetas (usa before: de Tailwind v3)
const CARD_SHELL =
  'relative overflow-hidden rounded-2xl transition-transform duration-200 hover:-translate-y-1 ' +
  'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px ' +
  'before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent';

// ─────────────────────────────────────────────────────────────────────────────

export default function Discounts() {
  const [discounts,   setDiscounts]   = useState([]);
  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [showModal,   setShowModal]   = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState(null);
  const [editingId,   setEditingId]   = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [togglingIds, setTogglingIds] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resP, resD, resC] = await Promise.all([
        api.get('/products'),
        api.get('/discounts'),
        api.get('/categories/flat'),
      ]);
      setProducts(  Array.isArray(resP.data?.data ?? resP.data) ? (resP.data?.data ?? resP.data) : []);
      setDiscounts( Array.isArray(resD.data) ? resD.data : []);
      setCategories(Array.isArray(resC.data) ? resC.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useRealtimeData(['discounts', 'products', 'categories'], loadData);

  const stats = useMemo(() => {
    let active = 0, scheduled = 0, expired = 0;
    discounts.forEach(d => {
      const status = getDiscountStatus(d).key;
      if (d.active !== false) {
        if (status === 'active')    active++;
        if (status === 'scheduled') scheduled++;
      }
      if (status === 'expired') expired++;
    });
    return { active, scheduled, expired };
  }, [discounts]);

  const handleToggleActive = async (discount, newValue) => {
    setTogglingIds(p => [...p, discount.id]);
    setDiscounts(p => p.map(d => d.id === discount.id ? { ...d, active: newValue } : d));
    try {
      await api.patch(`/discounts/${discount.id}`, { is_active: newValue });
    } catch (err) {
      setDiscounts(p => p.map(d => d.id === discount.id ? { ...d, active: !newValue } : d));
      alert(err.response?.data?.message || 'Error al actualizar');
    } finally {
      setTogglingIds(p => p.filter(id => id !== discount.id));
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null); setSelectedIds([]); setForm(EMPTY_FORM); setError(null); setShowModal(true);
  };

  const handleEditClick = (d) => {
    setEditingId(d.id); setError(null);
    const targets    = Array.isArray(d.targets) ? d.targets : [];
    const first      = targets[0];
    const targetType = first?.target_type || 'product';
    setSelectedIds(targetType === 'product' ? targets.map(t => parseInt(t.target_id)).filter(Boolean) : []);
    setForm({
      name:        d.name  || '',
      type:        d.type  || 'percentage',
      value:       d.value || '',
      starts_at:   safeDate(d.starts_at),
      ends_at:     safeDate(d.ends_at),
      target_type: targetType,
      category_id: targetType === 'category' ? (first?.target_id || '') : '',
      scope:       d.scope || 'all',
    });
    setShowModal(true);
  };

  const toggleProduct = (id) =>
    setSelectedIds(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError(null);
    if (!form.name.trim())   return setError('El nombre es requerido');
    if (!form.value)         return setError('El valor del descuento es requerido');
    if (!form.starts_at)     return setError('La fecha de inicio es requerida');
    if (!form.ends_at)       return setError('La fecha de fin es requerida');
    if (form.starts_at > form.ends_at) return setError('La fecha de fin debe ser posterior al inicio');
    if (form.target_type === 'product'  && selectedIds.length === 0)
      return setError('Selecciona al menos un producto');
    if (form.target_type === 'category' && !form.category_id)
      return setError('Selecciona una categoría');

    const finalTargets = form.target_type === 'product'
      ? selectedIds.map(id => ({ target_type: 'product',  target_id: id.toString() }))
      : [{ target_type: 'category', target_id: form.category_id.toString() }];

    const payload = {
      name:      form.name.trim(),
      type:      form.type,
      value:     Number(form.value),
      starts_at: form.starts_at,
      ends_at:   form.ends_at,
      scope:     form.scope || 'all',
      targets:   finalTargets,
    };

    setSaving(true);
    try {
      if (editingId) await api.put(`/discounts/${editingId}`, payload);
      else           await api.post('/discounts', payload);
      setShowModal(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este descuento?')) return;
    try {
      await api.delete(`/discounts/${id}`);
      setDiscounts(p => p.filter(d => d.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <div className="relative min-h-screen pb-24 lg:pb-8 transition-colors duration-300
      bg-slate-50 dark:bg-[#0D0F1A]">

      {/* ── Orbs de ambiente — solo visible en dark ── */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-[60vw] h-[60vw] rounded-full
          opacity-0 dark:opacity-100 transition-opacity duration-700
          bg-[radial-gradient(circle,rgba(120,80,255,0.18)_0%,transparent_65%)]
          blur-[80px]" />
        <div className="absolute -bottom-1/4 -right-1/6 w-[55vw] h-[55vw] rounded-full
          opacity-0 dark:opacity-100 transition-opacity duration-700
          bg-[radial-gradient(circle,rgba(0,200,180,0.13)_0%,transparent_65%)]
          blur-[80px]" />
      </div>

      <main className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">

        {/* ── Encabezado ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight
              text-gray-900 dark:text-white">
              Ofertas
            </h1>
            <p className="text-sm mt-1 text-gray-500 dark:text-white/40">
              Gestiona tus campañas de descuentos y promociones
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl
              font-semibold text-sm flex-shrink-0 transition-all active:scale-95
              /* ── light ── */
              bg-slate-900 text-white hover:bg-slate-800 shadow-sm
              /* ── dark: cristal prismático ── */
              dark:bg-gradient-to-br dark:from-violet-100/90 dark:to-cyan-100/90
              dark:text-slate-900 dark:border dark:border-white/60
              dark:shadow-[0_4px_18px_rgba(150,100,255,0.35),inset_0_1px_0_rgba(255,255,255,0.85)]
              dark:hover:shadow-[0_8px_28px_rgba(150,100,255,0.5),inset_0_1px_0_rgba(255,255,255,0.95)]
              dark:hover:-translate-y-0.5"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Crear oferta</span>
          </button>
        </div>

        {loading ? (
          <LoadingSpinner label="Cargando ofertas..." />
        ) : discounts.length === 0 ? (
          <EmptyState onAction={handleOpenCreate} />
        ) : (
          <div className="space-y-8">

            {/* ── MÉTRICAS ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {[
                {
                  label: 'Activas',
                  value: stats.active,
                  icon:  <Tag size={20} />,
                  light: 'bg-emerald-50 text-emerald-600',
                  dark:  'dark:bg-emerald-500/15 dark:text-emerald-300 dark:border dark:border-emerald-500/20',
                },
                {
                  label: 'Programadas',
                  value: stats.scheduled,
                  icon:  <Clock size={20} />,
                  light: 'bg-amber-50 text-amber-600',
                  dark:  'dark:bg-amber-500/15 dark:text-amber-300 dark:border dark:border-amber-500/20',
                },
                {
                  label: 'Vencidas',
                  value: stats.expired,
                  icon:  <AlertCircle size={20} />,
                  light: 'bg-red-50 text-red-500',
                  dark:  'dark:bg-red-500/15 dark:text-red-300 dark:border dark:border-red-500/20',
                },
              ].map(({ label, value, icon, light, dark: dk }) => (
                <div
                  key={label}
                  className={`
                    rounded-2xl p-5 flex items-center gap-4
                    transition-transform duration-200 hover:-translate-y-0.5
                    bg-white border border-gray-100 shadow-sm
                    dark:bg-transparent dark:border-transparent dark:shadow-none
                    dark:${GLASS_DEEP}
                  `}
                >
                  <div className={`p-3 rounded-xl flex-shrink-0 ${light} ${dk}`}>
                    {icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest
                      text-gray-400 dark:text-white/40">
                      {label}
                    </p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">
                      {value}
                    </p>
                  </div>
                </div>
              ))}

            </div>

            {/* ── GRID DE TARJETAS ── */}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest mb-4
                text-gray-400 dark:text-white/40">
                Registro de campañas
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {discounts.map((d) => (
                  /*
                   * Envuelve DiscountCard en un div glass en dark.
                   * En light queda como tarjeta blanca estándar.
                   * Si DiscountCard acepta className, puedes eliminar este wrapper
                   * y pasar las clases directamente como prop.
                   */
                  <div
                    key={d.id}
                    className={`
                      ${CARD_SHELL}
                      bg-white border border-gray-100 shadow-sm
                      dark:bg-transparent dark:border-transparent dark:shadow-none
                      dark:${GLASS}
                    `}
                  >
                    <DiscountCard
                      discount={d}
                      categories={categories}
                      isToggling={togglingIds.includes(d.id)}
                      onToggle={handleToggleActive}
                      onEdit={handleEditClick}
                      onDelete={handleDelete}
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </main>

      {showModal && (
        <DiscountModal
          editingId={editingId}
          form={form}
          setForm={setForm}
          products={products}
          categories={categories}
          selectedIds={selectedIds}
          toggleProduct={toggleProduct}
          error={error}
          saving={saving}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}