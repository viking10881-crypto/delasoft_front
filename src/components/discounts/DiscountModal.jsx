// src/pages/tools/discounts/components/DiscountModal.jsx
import { X, Package, Layers, ChevronDown, CheckCircle2 } from 'lucide-react';
import { inputCls } from '../../../utils/DiscountUtils';

export default function DiscountModal({
  editingId,
  form,
  setForm,
  products,
  categories,
  selectedIds,
  toggleProduct,
  error,
  saving,
  onSubmit,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden max-h-[95vh]
        bg-white dark:bg-[#161b27] border border-gray-100 dark:border-white/[0.07]">

        {/* Drag handle (mobile) */}
        <div className="sm:hidden w-10 h-1 bg-gray-200 dark:bg-white/10 rounded-full mx-auto mt-3 flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5
          border-b border-gray-100 dark:border-white/[0.07]
          bg-gray-50 dark:bg-white/[0.03] flex-shrink-0">
          <div>
            <h3 className="font-black text-gray-900 dark:text-white text-base sm:text-lg">
              {editingId ? 'Editar oferta' : 'Nueva oferta'}
            </h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              Configura los parámetros del descuento
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors
              bg-gray-100 dark:bg-white/[0.06]
              text-gray-400 dark:text-slate-500
              hover:bg-gray-200 dark:hover:bg-white/[0.10]
              hover:text-gray-700 dark:hover:text-white"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-5">

          {/* Nombre */}
          <div>
            <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">
              Nombre de la campaña
            </label>
            <input
              placeholder="Ej: Black Friday"
              className={inputCls}
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Tipo + Valor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">
                Tipo
              </label>
              <select
                className={inputCls}
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
              >
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto fijo ($)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">
                Valor
              </label>
              <input
                type="number" min="0.01" step="0.01" placeholder="0"
                className={`${inputCls} font-bold`}
                value={form.value}
                onChange={e => setForm({ ...form, value: e.target.value })}
              />
            </div>
          </div>

          {/* Alcance del descuento */}
          <div>
            <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">
              Aplicar en
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 dark:bg-white/[0.05] rounded-xl">
              {[
                { val: 'all', label: 'Ambos',    emoji: '🌐' },
                { val: 'web', label: 'Web',      emoji: '💻' },
                { val: 'pos', label: 'Físico',   emoji: '🏪' },
              ].map(({ val, label, emoji }) => (
                <button
                  key={val} type="button"
                  onClick={() => setForm({ ...form, scope: val })}
                  className={`flex flex-col items-center py-2.5 rounded-lg transition-all text-xs font-bold gap-0.5 ${
                    form.scope === val
                      ? 'bg-white dark:bg-white/[0.10] shadow text-gray-900 dark:text-white'
                      : 'text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
                  }`}
                >
                  <span className="text-base">{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {/* Target type */}
          <div>
            <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">
              Aplicar a
            </label>

            {/* Segmented control */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-white/[0.05] rounded-xl mb-3">
              {[
                { val: 'product',  Icon: Package, label: 'Productos' },
                { val: 'category', Icon: Layers,  label: 'Categoría' },
              ].map(({ val, Icon, label }) => (
                <button
                  key={val} type="button"
                  onClick={() => {
                    setForm({ ...form, target_type: val, category_id: '' });
                    // selectedIds are managed by parent via toggleProduct
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all text-xs font-bold ${
                    form.target_type === val
                      ? 'bg-white dark:bg-white/[0.10] shadow text-gray-900 dark:text-white'
                      : 'text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon size={14} />{label}
                </button>
              ))}
            </div>

            {/* Product list */}
            {form.target_type === 'product' && (
              products.length === 0 ? (
                <p className="text-center py-6 text-gray-400 dark:text-slate-500 text-sm bg-gray-100 dark:bg-white/[0.04] rounded-xl">
                  No hay productos disponibles
                </p>
              ) : (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
                  {products.map(p => (
                    <div
                      key={p.id}
                      onClick={() => toggleProduct(p.id)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer border-2 transition-all select-none text-sm ${
                        selectedIds.includes(p.id)
                          ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-white/[0.06] text-gray-900 dark:text-white'
                          : 'border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] text-gray-600 dark:text-slate-400 hover:border-gray-400 dark:hover:border-white/20'
                      }`}
                    >
                      <span className="font-semibold truncate flex-1 mr-2">{p.name}</span>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${
                        selectedIds.includes(p.id)
                          ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white'
                          : 'border-gray-300 dark:border-white/[0.15]'
                      }`}>
                        {selectedIds.includes(p.id) && (
                          <CheckCircle2 size={12} className="text-white dark:text-slate-900" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Category selector */}
            {form.target_type === 'category' && (
              categories.length === 0 ? (
                <p className="text-center py-6 text-gray-400 dark:text-slate-500 text-sm bg-gray-100 dark:bg-white/[0.04] rounded-xl">
                  No hay categorías disponibles
                </p>
              ) : (
                <div className="relative">
                  <select
                    className={`${inputCls} appearance-none pr-10 font-medium`}
                    value={form.category_id}
                    onChange={e => setForm({ ...form, category_id: e.target.value })}
                  >
                    <option value="">-- Selecciona una categoría --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {'— '.repeat((cat.level || 1) - 1)}{cat.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />

                  {form.category_id && (
                    <div className="mt-2 px-3 py-2 bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] rounded-xl">
                      <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                        <span className="text-gray-400 dark:text-slate-500">Aplicará a: </span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {categories.find(c => c.id.toString() === form.category_id)?.full_path ||
                           categories.find(c => c.id.toString() === form.category_id)?.name}
                        </span>
                        <span className="text-gray-400 dark:text-slate-500"> y todos sus productos</span>
                      </p>
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            {[{ key: 'starts_at', label: 'Inicio' }, { key: 'ends_at', label: 'Fin' }].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">
                  {label}
                </label>
                <input
                  type="date"
                  className={inputCls}
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>

          {/* Error banner */}
          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400 font-medium flex items-start gap-2">
              <span className="flex-shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-5 sm:px-7 py-4 border-t border-gray-100 dark:border-white/[0.07] flex-shrink-0">
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95
              bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100
              text-white dark:text-slate-900"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : editingId ? 'Actualizar oferta' : 'Crear descuento'}
          </button>
        </div>
      </div>
    </div>
  );
}