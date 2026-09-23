export default function Card({ className = "", style = {}, children, ...props }) {
  return (
    <div
      className={`rounded-[2rem] border shadow-xl ${className}`}
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)", ...style }}
      {...props}
    >
      {children}
    </div>
  );
}
