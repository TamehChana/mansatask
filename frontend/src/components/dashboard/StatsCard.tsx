'use client';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
}

/**
 * Stats Card Component
 * Displays a single statistic in a card format
 */
export function StatsCard({
  title,
  value,
  icon,
  description,
  trend,
}: StatsCardProps) {
  return (
    <div className="bg-surface rounded-card shadow-soft hover:shadow-soft-md transition-fast p-6 border border-gray-100 hover-lift">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-small font-medium text-text-secondary mb-2">{title}</p>
          <p className="text-3xl font-semibold text-text-primary">{value}</p>
          {description && (
            <p className="text-small text-text-secondary mt-2">{description}</p>
          )}
          {trend && (
            <p
              className={`text-small mt-2 font-medium ${
                trend.isPositive ? 'text-success' : 'text-error'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 ml-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-accent/10 text-accent">
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



