import React from 'react';
import { Users, Sparkles, CheckCircle2, Briefcase } from 'lucide-react';

interface CommandKpisProps {
  leads: number;
  interested: number;
  qualified: number;
  opportunities: number;
}

export const CommandKpis: React.FC<CommandKpisProps> = ({
  leads,
  interested,
  qualified,
  opportunities,
}) => {
  const kpis = [
    {
      label: 'Leads',
      value: leads,
      subtitle: 'Active prospects in database',
      icon: Users,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      borderHover: 'hover:border-blue-300',
    },
    {
      label: 'Interested',
      value: interested,
      subtitle: 'Expressed buyer interest',
      icon: Sparkles,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
      borderHover: 'hover:border-amber-300',
    },
    {
      label: 'Qualified',
      value: qualified,
      subtitle: 'Requirements & ICP verified',
      icon: CheckCircle2,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
      borderHover: 'hover:border-indigo-300',
    },
    {
      label: 'Opportunities',
      value: opportunities,
      subtitle: 'Active deals in pipeline',
      icon: Briefcase,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      borderHover: 'hover:border-emerald-300',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.label}
            className={`bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs ${kpi.borderHover} transition-all`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {kpi.label}
              </span>
              <div className={`w-9 h-9 rounded-lg ${kpi.iconBg} ${kpi.iconColor} flex items-center justify-center shadow-2xs`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="text-3xl font-bold tracking-tight text-slate-900">
              {kpi.value}
            </div>

            <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
              {kpi.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
};
