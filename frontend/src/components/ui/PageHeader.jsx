export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-heading font-bold text-[#1A1F2E]">{title}</h2>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-btn flex items-center justify-center gap-2 text-sm font-medium transition-colors whitespace-nowrap w-full sm:w-auto"
        >
          {action.icon && <action.icon size={18} />}
          <span className="hidden sm:inline">{action.label}</span>
          <span className="sm:hidden">{action.label.split(' ')[0]}</span>
        </button>
      )}
    </div>
  );
}
