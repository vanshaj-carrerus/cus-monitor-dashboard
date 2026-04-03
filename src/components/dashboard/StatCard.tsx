import { LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendType?: 'positive' | 'negative';
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, trendType, className }: StatCardProps) {
  return (
    <Card className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
          <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            trendType === 'positive' ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          )}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <h4 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</h4>
      </div>
    </Card>
  );
}
