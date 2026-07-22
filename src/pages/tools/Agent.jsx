import AgentChat from "../../components/AgentChat";

export default function Agent() {
  return (
    <div
      className="overflow-hidden"
      style={{ height: "calc(100vh - var(--header-height, 80px))" }}
    >
      <AgentChat inline={true} />
    </div>
  );
}