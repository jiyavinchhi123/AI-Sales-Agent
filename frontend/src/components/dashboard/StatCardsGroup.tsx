import React from 'react';
import { Users, CheckCircle2, Sparkles, Briefcase } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';

interface StatCardsGroupProps {
  totalLeads: number;
  qualified: number;
  interested: number;
  opportunities: number;
}

export const StatCardsGroup: React.FC<StatCardsGroupProps> = ({
  totalLeads,
  qualified,
  interested,
  opportunities,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Total Leads */}
      <StatCard
        label="Total Leads"
        value={totalLeads}
        icon={Users}
        iconColorClass="text-blue-600"
        iconBgClass="bg-blue-50"
      />

      {/* 2. Qualified */}
      <StatCard
        label="Qualified"
        value={qualified}
        icon={CheckCircle2}
        iconColorClass="text-indigo-600"
        iconBgClass="bg-indigo-50"
      />

      {/* 3. Interested */}
      <StatCard
        label="Interested"
        value={interested}
        icon={Sparkles}
        iconColorClass="text-amber-600"
        iconBgClass="bg-amber-50"
      />

      {/* 4. Opportunities */}
      <StatCard
        label="Opportunities"
        value={opportunities}
        icon={Briefcase}
        iconColorClass="text-emerald-600"
        iconBgClass="bg-emerald-50"
      />
    </div>
  );
};
