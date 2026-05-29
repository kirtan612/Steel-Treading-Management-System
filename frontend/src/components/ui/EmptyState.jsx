export default function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && <Icon size={48} className="text-muted mb-3" />}
      <p className="text-muted">{message}</p>
    </div>
  );
}
