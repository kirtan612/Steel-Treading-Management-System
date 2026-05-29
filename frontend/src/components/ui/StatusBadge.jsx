export default function StatusBadge({ status }) {
  const getStatusStyle = () => {
    const s = status?.toLowerCase() || '';
    
    if (['in stock', 'confirmed', 'paid', 'delivered'].includes(s)) {
      return 'bg-success-bg text-success';
    }
    if (['low stock', 'pending', 'partial', 'dispatched'].includes(s)) {
      return 'bg-warning-bg text-warning';
    }
    if (['out of stock', 'cancelled', 'overdue', 'unpaid'].includes(s)) {
      return 'bg-danger-bg text-danger';
    }
    return 'bg-gray-100 text-gray-500';
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle()}`}>
      {status}
    </span>
  );
}
