export default function TabNavigation({ tabs, activeTab, onTabChange }) {
  return (
    <div className="border-b border-[--border] bg-[--bg-subtle] transition-colors duration-300">
      <nav className="flex -mb-px overflow-x-auto scrollbar-none px-3 sm:px-6 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-1.5 px-3 sm:px-5 py-3 sm:py-4
              border-b-2 transition-all whitespace-nowrap flex-shrink-0
              text-xs sm:text-sm font-medium
              ${activeTab === tab.id
                ? "border-blue-500 text-blue-500 bg-[--bg-card]"
                : "border-transparent text-[--text-muted] hover:text-[--text-secondary] hover:bg-[--bg-card]/60"
              }
            `}
          >
            <span className="flex-shrink-0">{tab.icon}</span>
            <span className="hidden xs:inline sm:inline">{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                activeTab === tab.id
                  ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                  : "bg-[--bg-subtle] text-[--text-muted] border border-[--border]"
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}