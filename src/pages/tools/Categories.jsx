// src/pages/tools/Categories.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, FolderTree, X, Edit3, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import useRealtimeData from "../../hooks/useRealtimeData";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [flatCategories, setFlatCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "", slug: "", parent_id: "", description: "", image_url: "",
  });

  const [expandedIds, setExpandedIds] = useState(new Set());

  const toggleExpand = (id) =>
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [treeRes, flatRes] = await Promise.all([
        api.get("/categories"),
        api.get("/categories/flat"),
      ]);
      setCategories(Array.isArray(treeRes.data) ? treeRes.data : []);
      setFlatCategories(Array.isArray(flatRes.data) ? flatRes.data : []);
    } catch (error) {
      console.error("Error cargando categorías:", error);
      toast.error("Error al cargar categorías");
      setCategories([]); setFlatCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useRealtimeData("categories", fetchData);

  const generateSlug = (name) =>
    name.toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({ name: "", slug: "", parent_id: "", description: "", image_url: "" });
    setShowModal(true);
  };

  const handleOpenEdit = (category) => {
    setEditingId(category.id);
    setForm({
      name: category.name || "",
      slug: category.slug || "",
      parent_id: category.parent_id || "",
      description: category.description || "",
      image_url: category.image_url || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }

    const dataToSend = {
      ...form,
      slug: form.slug.trim() || generateSlug(form.name),
      parent_id: form.parent_id || null,
    };

    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, dataToSend);
        toast.success("Categoría actualizada");
      } else {
        await api.post("/categories", dataToSend);
        toast.success("Categoría creada");
      }
      setShowModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al guardar");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro? Esta acción no se puede deshacer.")) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success("Eliminada correctamente");
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo eliminar");
    }
  };

  const renderTree = (nodes, depth = 0) => {
    if (!nodes?.length) return null;
    return (
      <div className={depth > 0 ? "ml-5 mt-2 border-l-2 border-gray-100 dark:border-[#2C2C2E] pl-4" : "space-y-3"}>
        {nodes.map((node) => {
          const hasChildren = node.children?.length > 0;
          const isOpen = expandedIds.has(node.id);
          return (
            <div key={node.id}>
              <div className="group bg-white dark:bg-[#1C1C1E] border border-gray-200/60 dark:border-[#2C2C2E]
                rounded-[20px] px-4 py-3.5 flex items-center justify-between
                hover:shadow-lg hover:shadow-gray-200/40 dark:hover:shadow-none dark:hover:bg-[#242426]
                transition-all duration-300 ease-out">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    depth === 0
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                      : "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400"
                  }`}>
                    <FolderTree size={18} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate tracking-tight">
                      {node.name}
                    </p>
                    {node.slug && (
                      <p className="text-[11px] text-gray-400 dark:text-[#8E8E93] font-medium truncate mt-0.5">
                        /{node.slug}
                        {hasChildren && (
                          <span className="ml-2 text-orange-400">
                            · {node.children.length} subcategoría{node.children.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(node)}
                      className="p-2 text-gray-400 dark:text-[#8E8E93] hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-xl transition-colors"
                    >
                      <Edit3 size={16} strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => handleDelete(node.id)}
                      className="p-2 text-gray-400 dark:text-[#8E8E93] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      <Trash2 size={16} strokeWidth={2} />
                    </button>
                  </div>
                  {hasChildren && (
                    <button
                      onClick={() => toggleExpand(node.id)}
                      className="p-2 text-gray-400 dark:text-[#8E8E93] hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-xl transition-colors ml-1"
                    >
                      <ChevronRight
                        size={16}
                        strokeWidth={2.5}
                        className="transition-transform duration-300 ease-in-out"
                        style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                      />
                    </button>
                  )}
                </div>
              </div>

              {hasChildren && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                    transition: "grid-template-rows 0.3s ease-in-out",
                  }}
                >
                  <div style={{ overflow: "hidden" }}>
                    {renderTree(node.children, depth + 1)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Estilo de inputs tipo Apple: bordes suaves, focus con anillo difuminado
  const inputCls = `
    w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all duration-200
    bg-gray-50 dark:bg-[#2C2C2E]
    border border-gray-200/80 dark:border-[#3A3A3C]
    text-gray-900 dark:text-white font-medium
    placeholder:text-gray-400 dark:placeholder:text-[#8E8E93]
    focus:bg-white dark:focus:bg-[#3A3A3C]
    focus:border-orange-500 dark:focus:border-orange-500/60
    focus:ring-4 focus:ring-orange-500/10
  `;

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-black pb-28 lg:pb-8 transition-colors duration-300 font-sans">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Categorías
            </h1>
            <p className="text-sm font-medium text-gray-500 dark:text-[#8E8E93] mt-1">
              Organiza el catálogo de tu ecosistema
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm
              transition-all duration-200 active:scale-95 shadow-sm shadow-orange-500/20 flex-shrink-0
              bg-orange-500 hover:bg-orange-600 border border-orange-500/50
              text-white"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span className="hidden sm:inline">Nueva categoría</span>
            <span className="sm:hidden">Añadir</span>
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-[3px] border-gray-200 dark:border-[#2C2C2E] rounded-full" />
              <div className="absolute inset-0 border-[3px] border-orange-500 rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="text-sm font-medium text-gray-400 dark:text-[#8E8E93] animate-pulse">Sincronizando jerarquía...</p>
          </div>

        ) : categories.length === 0 ? (
          /* Empty state */
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[24px] border border-gray-200/60 dark:border-[#2C2C2E] p-16 text-center shadow-sm">
            <div className="w-16 h-16 bg-orange-50 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <FolderTree size={28} className="text-orange-500" strokeWidth={2} />
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Sin categorías</p>
            <p className="text-sm font-medium text-gray-500 dark:text-[#8E8E93] mb-8 max-w-sm mx-auto">
              Crea una estructura organizada para que la navegación de tus clientes sea impecable.
            </p>
            <button
              onClick={handleOpenCreate}
              className="bg-orange-500 text-white px-6 py-3 rounded-xl text-sm font-semibold
                hover:bg-orange-600 transition-colors shadow-sm shadow-orange-500/20"
            >
              Crear la primera
            </button>
          </div>

        ) : (
          <div className="max-w-3xl">
            {renderTree(categories)}
          </div>
        )}
      </main>

      {/* Modal tipo Apple (Glassmorphism) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-gray-900/40 dark:bg-black/60 backdrop-blur-md
          flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300">
          <div className="w-full sm:max-w-lg sm:rounded-[28px] rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]
            bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#2C2C2E] transform transition-all">
            
            <div className="sm:hidden w-12 h-1.5 bg-gray-200 dark:bg-[#3A3A3C] rounded-full mx-auto mt-4 flex-shrink-0" />

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-5 sm:py-6 flex-shrink-0">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg sm:text-xl tracking-tight">
                  {editingId ? "Editar categoría" : "Nueva categoría"}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors
                  bg-gray-100 dark:bg-[#2C2C2E]
                  text-gray-500 dark:text-[#8E8E93]
                  hover:bg-gray-200 dark:hover:bg-[#3A3A3C]
                  hover:text-gray-900 dark:hover:text-white"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-6 space-y-5">

              {/* Nombre */}
              <div>
                <label className="text-[13px] font-semibold text-gray-700 dark:text-[#A1A1A6] mb-2 block">
                  Nombre de la categoría
                </label>
                <input
                  type="text"
                  placeholder="Ej: Laptops Pro"
                  className={inputCls}
                  value={form.name}
                  onChange={e => {
                    const newName = e.target.value;
                    setForm(f => ({ ...f, name: newName, slug: f.slug || generateSlug(newName) }));
                  }}
                />
              </div>

              {/* Categoría superior */}
              <div>
                <label className="text-[13px] font-semibold text-gray-700 dark:text-[#A1A1A6] mb-2 block">
                  Categoría padre
                </label>
                <div className="relative">
                  <select
                    className={`${inputCls} appearance-none pr-10`}
                    value={form.parent_id}
                    onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}
                  >
                    <option value="">Ninguna (Categoría Principal)</option>
                    {flatCategories
                      .filter(cat => cat.id !== editingId)
                      .map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {"— ".repeat((cat.level || 1) - 1)}{cat.name}
                        </option>
                      ))
                    }
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#8E8E93] pointer-events-none" />
                </div>
              </div>

              {/* Slug */}
              <div>
                <label className="text-[13px] font-semibold text-gray-700 dark:text-[#A1A1A6] mb-2 flex items-center justify-between">
                  <span>URL Slug</span>
                  <span className="text-[11px] font-normal text-gray-400">Opcional</span>
                </label>
                <input
                  type="text"
                  placeholder="generado-automaticamente"
                  className={`${inputCls} font-mono text-[13px]`}
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="text-[13px] font-semibold text-gray-700 dark:text-[#A1A1A6] mb-2 block">
                  Descripción
                </label>
                <textarea
                  rows="3"
                  placeholder="Añade un breve resumen de esta categoría..."
                  className={`${inputCls} resize-none`}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 sm:px-8 py-5 border-t border-gray-100 dark:border-[#2C2C2E] flex-shrink-0 flex gap-3 bg-gray-50/50 dark:bg-[#1C1C1E]">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3.5 rounded-xl text-sm font-semibold transition-colors
                  bg-gray-100 dark:bg-[#2C2C2E]
                  text-gray-700 dark:text-white
                  hover:bg-gray-200 dark:hover:bg-[#3A3A3C]"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-95
                  bg-orange-500 hover:bg-orange-600
                  text-white shadow-sm shadow-orange-500/20"
              >
                {editingId ? "Guardar cambios" : "Crear categoría"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;

/* pruba para subis el comit */