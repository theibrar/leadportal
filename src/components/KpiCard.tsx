import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  color?: 'blue' | 'emerald' | 'amber' | 'purple';
  trend?: string;
}

export function KpiCard({ title, value, subtext, icon: Icon, color = 'blue', trend }: KpiCardProps) {
  const colorMap = {
    blue: 'bg-blue-50/50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50/50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50/50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50/50 text-purple-600 border-purple-100',
  };

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
        <div className={`p-2.5 rounded-xl border ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
        {trend && <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{trend}</span>}
      </div>
      {subtext && <p className="text-xs text-slate-500 font-medium">{subtext}</p>}
    </div>
  );
}
