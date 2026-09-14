'use client';

import React from 'react';
import Link from 'next/link';
import {
  Radar,
  Users,
  Send,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Briefcase,
  ChevronRight,
} from 'lucide-react';

interface FunnelStep {
  stage: string;
  label?: string;
  count: number;
  percentage: number;
  dropoff_percentage?: number;
  description?: string;
}

interface ConversionFunnelProps {
  funnel?: FunnelStep[];
  className?: string;
  compact?: boolean;
}

const STAGE_CONFIGS = [
  {
    key: 'Signals',
    label: 'Buying Signals',
    icon: Radar,
    color: 'amber',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    barClass: 'from-amber-500 to-amber-600',
    dotClass: 'bg-amber-500',
    link: '/discovery',
    actionText: 'Find Signals',
    defaultDesc: 'Monitored buyer intent requirements & active RFPs detected across the web',
  },
  {
    key: 'Leads',
    label: 'Qualified Leads',
    icon: Users,
    color: 'blue',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    barClass: 'from-blue-500 to-indigo-600',
    dotClass: 'bg-blue-500',
    link: '/leads',
    actionText: 'Review Leads',
    defaultDesc: 'Enriched company profiles with verified decision-maker contact dossiers',
  },
  {
    key: 'Outreach',
    label: 'AI Outreach',
    icon: Send,
    color: 'indigo',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    barClass: 'from-indigo-600 to-purple-600',
    dotClass: 'bg-indigo-600',
    link: '/calling',
    actionText: 'Launch Outreach',
    defaultDesc: 'Personalized AI emails dispatched and autonomous voice agent calls executed',
  },
  {
    key: 'Deals',
    label: 'Pipeline Deals',
    icon: Briefcase,
    color: 'emerald',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    barClass: 'from-emerald-500 to-teal-600',
    dotClass: 'bg-emerald-500',
    link: '/analytics',
    actionText: 'Manage Deals',
    defaultDesc: 'Active CRM opportunities, proposal presentations, and meetings booked',
  },
];

export const ConversionFunnel: React.FC<ConversionFunnelProps> = ({
  funnel = [],
  className = '',
  compact = false,
}) => {
  // Normalize funnel to ensure 4 stages are mapped properly
  const steps = STAGE_CONFIGS.map((cfg, index) => {
    const found = funnel.find(
      (f) =>
        f.label?.toLowerCase() === cfg.key.toLowerCase() ||
        f.stage.toLowerCase().includes(cfg.key.toLowerCase())
    ) || funnel[index];

    return {
      ...cfg,
      count: found ? found.count : 0,
      percentage: found ? found.percentage : 0,
      dropoff: found?.dropoff_percentage ?? 0,
      desc: found?.description || cfg.defaultDesc,
    };
  });

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs transition-all ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Conversion Funnel</span>
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Live Pipeline Sync
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            End-to-End Sales Lifecycle (Signals ➔ Leads ➔ Outreach ➔ Deals)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stage velocity, conversion efficiency, and drop-off analytics across your pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/analytics"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
          >
            <span>Detailed Analytics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Funnel 4-Stage Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isLast = idx === steps.length - 1;
          const nextStep = !isLast ? steps[idx + 1] : null;

          return (
            <div
              key={step.key}
              className="relative bg-slate-50/80 rounded-xl p-4 border border-slate-200/70 hover:border-indigo-300 hover:bg-slate-50 hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              {/* Top Row: Stage Name & Icon */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white bg-gradient-to-tr ${step.barClass} shadow-2xs`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Stage 0{idx + 1}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 leading-tight">
                        {step.label}
                      </h3>
                    </div>
                  </div>

                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${step.badgeClass}`}>
                    {step.percentage}%
                  </span>
                </div>

                {/* Count & Stage Metric */}
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                    {step.count}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {idx === 0
                      ? 'signals captured'
                      : idx === 1
                      ? 'verified accounts'
                      : idx === 2
                      ? 'engagements'
                      : 'active deals'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${step.barClass} transition-all duration-700`}
                    style={{ width: `${Math.max(8, step.percentage)}%` }}
                  />
                </div>

                {/* Stage Description */}
                <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                  {step.desc}
                </p>
              </div>

              {/* Bottom Row: Conversion to Next Stage & Action Link */}
              <div className="pt-4 mt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                {nextStep ? (
                  <div className="flex items-center gap-1 text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {step.count > 0 ? `${Math.round((nextStep.count / step.count) * 100)}%` : '0%'}
                    </span>
                    <span className="text-[10px]">advances</span>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Closing Pipeline</span>
                  </div>
                )}

                <Link
                  href={step.link}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
                >
                  <span>{step.actionText}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
