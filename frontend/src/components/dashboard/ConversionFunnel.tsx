'use client';

import React from 'react';
import Link from 'next/link';
import {
  Radar,
  Users,
  CheckCircle2,
  Briefcase,
  ArrowRight,
} from 'lucide-react';

interface FunnelStep {
  stage: string;
  label?: string;
  count: number;
  percentage?: number;
}

interface SimplePipelineProps {
  title?: string;
  subtitle?: string;
  signals?: number;
  leads?: number;
  qualified?: number;
  opportunities?: number;
  funnel?: FunnelStep[];
  className?: string;
}

export const ConversionFunnel: React.FC<SimplePipelineProps> = ({
  title = 'Sales Flow',
  subtitle = 'Progression from active signals to closed opportunities',
  signals,
  leads,
  qualified,
  opportunities,
  funnel,
  className = '',
}) => {
  // Extract counts prioritizing direct props, then funnel array fallback
  const signalsCount =
    signals ??
    funnel?.find((f) => f.stage.toLowerCase().includes('signal') || f.label?.toLowerCase().includes('signal'))?.count ??
    0;

  const leadsCount =
    leads ??
    funnel?.find((f) => f.stage.toLowerCase().includes('lead') || f.label?.toLowerCase().includes('lead'))?.count ??
    0;

  const qualifiedCount =
    qualified ??
    funnel?.find((f) => f.stage.toLowerCase().includes('qualif') || f.label?.toLowerCase().includes('qualif'))?.count ??
    0;

  const opportunitiesCount =
    opportunities ??
    funnel?.find((f) => f.stage.toLowerCase().includes('opp') || f.label?.toLowerCase().includes('opp') || f.label?.toLowerCase().includes('deal'))?.count ??
    0;

  const stages = [
    {
      name: 'Signals',
      count: signalsCount,
      icon: Radar,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
      link: '/discovery',
      linkText: 'Scout Signals',
    },
    {
      name: 'Leads',
      count: leadsCount,
      icon: Users,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      link: '/leads',
      linkText: 'View Leads',
    },
    {
      name: 'Qualified',
      count: qualifiedCount,
      icon: CheckCircle2,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
      link: '/leads',
      linkText: 'Inspect Fit',
    },
    {
      name: 'Opportunities',
      count: opportunitiesCount,
      icon: Briefcase,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      link: '/analytics',
      linkText: 'View Pipeline',
    },
  ];

  return (
    <div className={`bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {subtitle}
          </p>
        </div>
        <Link
          href="/analytics"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          <span>Analytics Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4-Stage Horizontal Pipeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isLast = idx === stages.length - 1;

          return (
            <div key={stage.name} className="relative">
              <Link
                href={stage.link}
                className="block p-5 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-xs transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 group-hover:text-indigo-600 transition-colors">
                    {stage.name}
                  </span>
                  <div className={`w-8 h-8 rounded-lg ${stage.iconBg} ${stage.iconColor} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
                  {stage.count}
                </div>

                <div className="flex items-center text-[11px] font-medium text-slate-400 group-hover:text-indigo-600 transition-colors">
                  <span>{stage.linkText}</span>
                  <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              {/* Arrow divider for larger screens */}
              {!isLast && (
                <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white border border-slate-200 items-center justify-center text-slate-400 shadow-2xs">
                  <ArrowRight className="w-3 h-3" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
