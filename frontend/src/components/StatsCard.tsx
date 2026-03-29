import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorScheme?: 'green' | 'yellow' | 'blue';
}

export function StatsCard({ title, value, icon: Icon, colorScheme = 'green' }: StatsCardProps) {
  const getColorClasses = () => {
    switch (colorScheme) {
      case 'green':
        return {
          cardBg: 'bg-green-50',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-700',
        };
      case 'yellow':
        return {
          cardBg: 'bg-yellow-50',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-700',
        };
      case 'blue':
        return {
          cardBg: 'bg-blue-50',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-700',
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className={`${colors.cardBg} border border-gray-200 rounded-lg p-6 shadow-md`}>
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 ${colors.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className={colors.iconColor} size={26} strokeWidth={2} />
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wide text-gray-600 font-medium mb-1.5">{title}</p>
          <p className="text-3xl font-bold text-gray-800 tabular-nums">{value}</p>
        </div>
      </div>
    </div>
  );
}
