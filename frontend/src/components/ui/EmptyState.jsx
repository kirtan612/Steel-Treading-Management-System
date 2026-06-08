/**
 * Empty state component for lists and tables
 * @param {Component} icon - Lucide icon component
 * @param {string} title - Bold title text
 * @param {string} message - Description text
 * @param {string} actionLabel - Optional action button label
 * @param {Function} onAction - Optional action button callback
 */
export default function EmptyState({ icon: Icon, title, message, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && <Icon size={48} className="text-muted mb-4" />}
      {title && (
        <h3 className="text-lg font-heading font-bold text-[#1A1F2E] mb-2">
          {title}
        </h3>
      )}
      {message && <p className="text-muted mb-6 max-w-md">{message}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-primary text-white rounded-btn text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
