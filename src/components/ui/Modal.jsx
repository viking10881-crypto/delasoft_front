export default function Modal({ isOpen, onClose, maxWidth = "max-w-sm", children }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={`rounded-[2.5rem] p-8 w-full shadow-2xl animate-in zoom-in-95 duration-200 ${maxWidth}`}
        style={{ backgroundColor: "var(--bg-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
