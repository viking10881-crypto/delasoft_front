// src/components/variants/AttributeSelector.jsx
import { useState } from "react";
import { Plus, ChevronDown, ChevronUp, Check, X } from "lucide-react";

export default function AttributeSelector({
  attributes = [],
  selected = [],
  onChange,
  onNewValue,
  allowMultiPerType = false,
}) {
  const [open,   setOpen]   = useState(() => Object.fromEntries(attributes.map(a => [a.id, true])));
  const [adding, setAdding] = useState(null);
  const [newVal, setNewVal] = useState({ value: "", hex_color: "" });
  const [saving, setSaving] = useState(false);

  const toggle = (id) => setOpen(p => ({ ...p, [id]: !p[id] }));

  const selectedForType = (at) =>
    (at.values ?? []).filter(v => selected.includes(v.id)).map(v => v.id);

  const toggleValue = (at, avId) => {
    const typeIds    = (at.values ?? []).map(v => v.id);
    const currentSel = selected.filter(id => typeIds.includes(id));
    const isSelected = currentSel.includes(avId);

    let next;
    if (allowMultiPerType) {
      next = isSelected
        ? selected.filter(id => id !== avId)
        : [...selected, avId];
    } else {
      const others = selected.filter(id => !typeIds.includes(id));
      next = isSelected ? others : [...others, avId];
    }
    onChange(next);
  };

  const handleAddValue = async (typeId) => {
    if (!newVal.value.trim()) return;
    setSaving(true);
    try {
      const created = await onNewValue(typeId, {
        value:     newVal.value.trim(),
        hex_color: newVal.hex_color || null,
      });
      const at = attributes.find(a => a.id === typeId);
      if (at) toggleValue(at, created.id);
      setAdding(null);
      setNewVal({ value: "", hex_color: "" });
    } finally {
      setSaving(false);
    }
  };

  const summaryParts = attributes
    .map(at => {
      const selVals = (at.values ?? []).filter(v => selected.includes(v.id));
      if (!selVals.length) return null;
      return `${at.name}: ${selVals.map(v => v.display_value ?? v.value).join(", ")}`;
    })
    .filter(Boolean);

  if (attributes.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-[#8E8E93] italic py-2">
        No hay tipos de atributos configurados aún.
      </p>
    );
  }

  return (
    <div className="space-y-2">

      {/* ── Grupos por tipo ── */}
      {attributes.map((at) => {
        const isOpen       = open[at.id] ?? true;
        const typeSelected = selectedForType(at);
        const isAddingHere = adding === at.id;
        const hasColor     = at.slug?.includes("color") || at.name?.toLowerCase().includes("color");

        return (
          <div key={at.id} className="border border-gray-200 dark:border-[#2C2C2E] rounded-2xl overflow-hidden">

            {/* Header del tipo */}
            <button
              type="button"
              onClick={() => toggle(at.id)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#2C2C2E] hover:bg-gray-100 dark:hover:bg-[#3A3A3C] transition-colors"
            >
              <div className="flex items-center gap-2">
                {at.icon && <span>{at.icon}</span>}
                <span className="text-sm font-bold text-gray-800 dark:text-white">{at.name}</span>
                {typeSelected.length > 0 && (
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-full">
                    {typeSelected.length} sel.
                  </span>
                )}
              </div>
              {isOpen
                ? <ChevronUp   size={14} className="text-gray-400 dark:text-[#8E8E93]" />
                : <ChevronDown size={14} className="text-gray-400 dark:text-[#8E8E93]" />}
            </button>

            {/* Valores */}
            {isOpen && (
              <div className="p-3 bg-white dark:bg-[#1C1C1E]">
                <div className="flex flex-wrap gap-2 mb-2">
                  {(at.values ?? []).map((av) => {
                    const isSel = selected.includes(av.id);
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => toggleValue(at, av.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                          isSel
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300"
                            : "border-gray-200 dark:border-[#3A3A3C] bg-gray-50 dark:bg-[#2C2C2E] text-gray-600 dark:text-[#A1A1A6] hover:border-gray-300 dark:hover:border-[#48484A]"
                        }`}
                      >
                        {av.hex_color && (
                          <span
                            className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: av.hex_color }}
                          />
                        )}
                        {av.display_value ?? av.value}
                        {isSel && <Check size={11} className="text-blue-500 dark:text-blue-400 shrink-0" />}
                      </button>
                    );
                  })}

                  {/* Botón agregar nuevo valor */}
                  {!isAddingHere && (
                    <button
                      type="button"
                      onClick={() => setAdding(at.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-[#3A3A3C] text-xs font-semibold text-gray-400 dark:text-[#8E8E93] hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500/60 dark:hover:text-blue-400 transition-all"
                    >
                      <Plus size={11} /> Nuevo
                    </button>
                  )}
                </div>

                {/* Formulario inline para nuevo valor */}
                {isAddingHere && (
                  <div className="flex items-center gap-2 mt-2 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20">
                    {hasColor && (
                      <input
                        type="color"
                        value={newVal.hex_color || "#000000"}
                        onChange={e => setNewVal(p => ({ ...p, hex_color: e.target.value }))}
                        className="w-8 h-8 rounded-lg border-0 cursor-pointer shrink-0"
                        title="Color del valor"
                      />
                    )}
                    <input
                      autoFocus
                      type="text"
                      placeholder={`Nuevo ${at.name.toLowerCase()}…`}
                      value={newVal.value}
                      onChange={e => setNewVal(p => ({ ...p, value: e.target.value }))}
                      onKeyDown={e => {
                        if (e.key === "Enter")  { e.preventDefault(); handleAddValue(at.id); }
                        if (e.key === "Escape") { setAdding(null); setNewVal({ value: "", hex_color: "" }); }
                      }}
                      className="flex-1 bg-white dark:bg-[#2C2C2E] border border-blue-300 dark:border-blue-500/40 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/20"
                    />
                    <button
                      type="button"
                      disabled={saving || !newVal.value.trim()}
                      onClick={() => handleAddValue(at.id)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {saving ? "…" : "Crear"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAdding(null); setNewVal({ value: "", hex_color: "" }); }}
                      className="p-1.5 text-gray-400 dark:text-[#8E8E93] hover:text-gray-600 dark:hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ── Resumen de la combinación activa ── */}
      {summaryParts.length > 0 && (
        <div className="flex items-start gap-2 px-4 py-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl">
          <Check size={14} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-green-800 dark:text-green-300 mb-0.5">Combinación de esta variante</p>
            <p className="text-xs text-green-700 dark:text-green-400 font-medium">{summaryParts.join(" · ")}</p>
          </div>
        </div>
      )}

      {selected.length === 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
          ⚠️ Sin atributos la variante no se distinguirá de otras.
        </p>
      )}
    </div>
  );
}
