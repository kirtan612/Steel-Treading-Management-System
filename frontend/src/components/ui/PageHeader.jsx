export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-[#1A1F2E]">{title}</h2>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-btn flex items-center gap-2 text-sm font-medium transition-colors"
        >
          {action.icon && <action.icon size={18} />}
          {action.label}
        </button>
      )}
    </div>
  );
}
