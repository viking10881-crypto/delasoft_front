import { CheckCircle2, Trash2 } from "lucide-react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmLabel = "Eliminar permanentemente",
  tone = "danger",
  onConfirm,
  onClose,
}) => {
  const isDanger = tone === "danger";
  const Icon = isDanger ? Trash2 : CheckCircle2;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{
          backgroundColor: isDanger ? "rgba(239,68,68,0.1)" : "var(--brand-muted)",
          color: isDanger ? "#ef4444" : "var(--brand)",
        }}
      >
        <Icon size={32} />
      </div>

      <h3 className="text-xl font-black mb-2" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
      <p className="font-medium mb-8 leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {message}
      </p>

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant={isDanger ? "danger" : "primary"} className="flex-1" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
