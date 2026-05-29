import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, icon: Icon, growth, growthLabel, iconColor = 'bg-orange-100 text-accent' }) {
  return (
    <div className="bg-white shadow-card rounded-card p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-muted font-medium">{title}</p>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconColor}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="text-2xl font-heading font-bold text-[#1A1F2E] mb-2">{value}</p>
      {growth !== undefined && (
        <div className="flex items-center gap-1">
          {growth >= 0 ? (
            <TrendingUp size={14} className="text-success" />
          ) : (
            <TrendingDown size={14} className="text-danger" />
          )}
          <span className={`text-xs font-medium ${growth >= 0 ? 'text-success' : 'text-danger'}`}>
            {growth >= 0 ? '+' : ''}{growth}%
          </span>
          {growthLabel && <span className="text-xs text-muted ml-1">{growthLabel}</span>}
        </div>
      )}
    </div>
  );
}
