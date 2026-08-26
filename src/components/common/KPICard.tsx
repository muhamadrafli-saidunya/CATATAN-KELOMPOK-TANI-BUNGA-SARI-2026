import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  icon: LucideIcon;
  variant?: 'gojek' | 'emerald' | 'amber' | 'blue' | 'purple' | 'slate';
  onClick?: () => void;
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  variant = 'gojek',
  onClick,
  className,
}) => {
  const iconVariants = {
    gojek: 'bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-200 flex flex-col justify-between',
        onClick && 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
            {title}
          </p>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight truncate">
            {value}
          </h3>
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', iconVariants[variant])}>
          <Icon className="w-5 h-5 stroke-[2]" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          {subtitle && <span className="truncate">{subtitle}</span>}
          {trend && (
            <span
              className={cn(
                'inline-flex items-center font-bold px-1.5 py-0.5 rounded text-[11px] shrink-0',
                trend.isPositive
                  ? 'text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-950/40'
                  : 'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40'
              )}
            >
              {trend.value} {trend.label && <span className="font-normal ml-1 opacity-80">{trend.label}</span>}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
