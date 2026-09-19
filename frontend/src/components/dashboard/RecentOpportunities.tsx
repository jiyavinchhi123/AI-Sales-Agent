import React from 'react';
import Link from 'next/link';
import { ArrowRight, Briefcase } from 'lucide-react';
import { Opportunity } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

interface RecentOpportunitiesProps {
  opportunities: Opportunity[];
}

export const RecentOpportunities: React.FC<RecentOpportunitiesProps> = ({ opportunities }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Opportunities</h3>
            <p className="text-xs text-slate-500">Active deals in pipeline</p>
          </div>
        </div>
        <Link
          href="/analytics"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* List */}
      <div className="p-6 divide-y divide-slate-100 flex-1 space-y-3">
        {opportunities.length === 0 ? (
          <div className="text-center py-10 flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <Briefcase className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-xs font-semibold text-slate-600">No active opportunities yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Qualified leads promoted to deals will appear here.</p>
          </div>
        ) : (
          opportunities.slice(0, 5).map((opp) => (
            <div key={opp.id} className="pt-3 first:pt-0 space-y-2">
              {/* Row 1: Company + Deal Value */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900">{opp.company_name}</span>
                    {opp.domain && (
                      <span className="text-[11px] text-slate-400 font-mono">({opp.domain})</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-xs text-slate-900 font-mono">
                    {opp.deal_value_estimate && opp.deal_value_estimate.toLowerCase() !== 'not available'
                      ? opp.deal_value_estimate
                      : 'Not available'}
                  </span>
                </div>
              </div>

              {/* Row 2: Requirement + Stage */}
              <div className="flex items-center justify-between text-xs gap-2">
                <div className="text-slate-600 truncate text-[11px]">
                  <span className="text-slate-400">Requirement: </span>
                  <span className="font-medium text-slate-700">{opp.matched_offering || 'Direct Procurement'}</span>
                </div>
                <Badge variant="purple" size="sm" className="shrink-0">
                  {opp.stage && opp.stage.toLowerCase() !== 'not available' ? opp.stage.replace('_', ' ') : 'Qualified'}
                </Badge>
              </div>

              {/* Row 3: Next Action */}
              {opp.next_action?.title && (
                <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium shrink-0">Next Action:</span>
                  <span className="font-semibold text-slate-800 truncate">{opp.next_action.title}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
