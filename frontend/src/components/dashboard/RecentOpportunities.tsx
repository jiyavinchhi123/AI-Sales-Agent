import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, CheckCircle2, DollarSign, Building } from 'lucide-react';
import { Opportunity } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

interface RecentOpportunitiesProps {
  opportunities: Opportunity[];
}

export const RecentOpportunities: React.FC<RecentOpportunitiesProps> = ({ opportunities }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Opportunities</h3>
            <p className="text-xs text-slate-500">Qualified deals handed off to sales reps</p>
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

      <div className="p-6 divide-y divide-slate-100 flex-1">
        {opportunities.length === 0 ? (
          <div className="text-center py-10 flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <DollarSign className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-xs font-semibold text-slate-600">No opportunities generated yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Qualified leads converted to deals will appear here.</p>
          </div>
        ) : (

          opportunities.map((opp) => (
            <div key={opp.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{opp.company_name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">({opp.domain})</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Offering: <span className="font-medium text-slate-700">{opp.matched_offering}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900">{opp.deal_value_estimate}</div>
                  <Badge variant="purple" size="sm" className="mt-0.5">
                    {opp.stage.replace('_', ' ')} • {opp.win_probability}% Win
                  </Badge>
                </div>
              </div>

              {opp.next_action && (
                <div className="p-2 bg-indigo-50/50 rounded-lg border border-indigo-100/70 text-[11px] flex items-center justify-between text-indigo-950">
                  <div className="flex items-center gap-1.5 truncate">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate">
                      <strong>Next Action:</strong> {opp.next_action.title}
                    </span>
                  </div>
                  <Badge variant="warning" size="sm" className="shrink-0 ml-2">
                    {opp.next_action.priority}
                  </Badge>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Rep: {opp.assigned_rep}</span>
                {opp.crm_synced ? (
                  <span className="text-emerald-600 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Synced to {opp.crm_target}</span>
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium">Ready for CRM Sync</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
