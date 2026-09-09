import React from 'react';
import { BarChart2, Zap, Clock, ShieldCheck } from 'lucide-react';
import { Lead } from '@/lib/types';

interface IntentDistributionProps {
  leads: Lead[];
}

export const IntentDistribution: React.FC<IntentDistributionProps> = ({ leads }) => {
  const total = leads.length || 1;
  const gradeA = leads.filter((l) => l.intent?.grade === 'A').length;
  const gradeB = leads.filter((l) => l.intent?.grade === 'B').length;
  const gradeC = leads.filter((l) => l.intent?.grade === 'C').length;
  const gradeD = leads.filter((l) => l.intent?.grade === 'D' || !l.intent).length;

  const distribution = [
    {
      grade: 'Grade A (Score 90-100)',
      description: 'Immediate Buying Window (0-30 Days)',
      count: gradeA,
      percentage: Math.round((gradeA / total) * 100),
      colorBg: 'bg-emerald-500',
      textColor: 'text-emerald-700',
    },
    {
      grade: 'Grade B (Score 80-89)',
      description: 'High Intent (30-60 Days)',
      count: gradeB,
      percentage: Math.round((gradeB / total) * 100),
      colorBg: 'bg-indigo-500',
      textColor: 'text-indigo-700',
    },
    {
      grade: 'Grade C (Score 70-79)',
      description: 'Exploring / Evaluation (60-90 Days)',
      count: gradeC,
      percentage: Math.round((gradeC / total) * 100),
      colorBg: 'bg-amber-500',
      textColor: 'text-amber-700',
    },
    {
      grade: 'Grade D (Score <70)',
      description: 'Early Nurture / Low Trigger',
      count: gradeD,
      percentage: Math.round((gradeD / total) * 100),
      colorBg: 'bg-slate-400',
      textColor: 'text-slate-600',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Lead Intent Distribution</h3>
            <p className="text-xs text-slate-500">
              Multi-factor scoring: Urgency (30%) + Product Fit (30%) + Authority (20%) + Timing (20%)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Zap className="w-3 h-3" />
          <span>75% High Intent (A+B)</span>
        </div>
      </div>

      {/* Distribution Bars */}
      <div className="space-y-4">
        {distribution.map((item, idx) => (
          <div key={idx} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className={`font-bold ${item.textColor}`}>{item.grade}</span>
                <span className="text-slate-400 text-[11px] ml-2 font-normal hidden sm:inline">
                  — {item.description}
                </span>
              </div>
              <div className="font-semibold text-slate-700 font-mono">
                {item.count} leads ({item.percentage}%)
              </div>
            </div>

            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${item.colorBg}`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-slate-100 text-xs">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60">
          <div className="text-slate-400 text-[11px]">Average Intent Score</div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">86.8 / 100</div>
        </div>
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60">
          <div className="text-slate-400 text-[11px]">Primary Intent Factor</div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">Series B Funding + Hiring</div>
        </div>
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60">
          <div className="text-slate-400 text-[11px]">Conversion Probability</div>
          <div className="text-sm font-bold text-emerald-600 mt-0.5">68.5% Meeting Rate</div>
        </div>
      </div>
    </div>
  );
};
