// src/components/variants/AttributeChip.jsx

/**
 * AttributeChip — muestra un atributo con su ícono / color de manera compacta.
 * Soporta modo `sm` (tabla) y modo `md` (formulario / detalle).
 */
export default function AttributeChip({ attribute, size = "sm" }) {
  const { attribute_type, attribute_icon, display_value, value, hex_color } = attribute;

  const sizes = {
    sm: "px-2 py-0.5 text-[11px] gap-1",
    md: "px-3 py-1   text-xs      gap-1.5",
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full bg-gray-100 text-gray-700 border border-gray-200 ${sizes[size]}`}
    >
      {/* Swatch de color si existe */}
      {hex_color && (
        <span
          className="rounded-full border border-black/10 shrink-0"
          style={{
            backgroundColor: hex_color,
            width:  size === "sm" ? 8 : 10,
            height: size === "sm" ? 8 : 10,
          }}
        />
      )}

      {/* Ícono del tipo de atributo */}
      {!hex_color && attribute_icon && (
        <span className="leading-none">{attribute_icon}</span>
      )}

      {/* Etiqueta del tipo · valor */}
      <span className="text-gray-400 font-medium">{attribute_type}:</span>
      <span>{display_value ?? value}</span>
    </span>
  );
}