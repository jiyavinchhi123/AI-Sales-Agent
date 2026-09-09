import React from 'react';
import { Users, Flame, Award, HeartHandshake } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';

interface StatCardsGroupProps {
  totalLeads: number;
  highIntent: number;
  qualified: number;
  interested: number;
}

export const StatCardsGroup: React.FC<StatCardsGroupProps> = ({
  totalLeads,
  highIntent,
  qualified,
  interested,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Leads */}
      <StatCard
        label="Total Leads"
        value={totalLeads}
        icon={Users}
        iconColorClass="text-blue-600"
        iconBgClass="bg-blue-50"
        trend={{ value: '+18% this week', isPositive: true }}
        subtitle="from active signals"
      />

      {/* 2. High Intent */}
      <StatCard
        label="High Intent"
        value={highIntent}
        icon={Flame}
        iconColorClass="text-rose-600"
        iconBgClass="bg-rose-50"
        trend={{ value: 'Grade A/B', isPositive: true }}
        subtitle="score >= 80/100"
      />

      {/* 3. Qualified */}
      <StatCard
        label="Qualified"
        value={qualified}
        icon={Award}
        iconColorClass="text-indigo-600"
        iconBgClass="bg-indigo-50"
        trend={{ value: '82% match rate', isPositive: true }}
        subtitle="ICP verified"
      />

      {/* 4. Interested */}
      <StatCard
        label="Interested"
        value={interested}
        icon={HeartHandshake}
        iconColorClass="text-emerald-600"
        iconBgClass="bg-emerald-50"
        trend={{ value: 'Ready for Demo', isPositive: true }}
        subtitle="post-AI outreach"
      />
    </div>
  );
};
