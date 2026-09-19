import React from 'react';
import Link from 'next/link';
import { PhoneCall, Briefcase, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { CallSession, Opportunity } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

interface RecentActivityFeedProps {
  calls: CallSession[];
  opportunities: Opportunity[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  calls,
  opportunities,
}) => {
  // Combine calls and opportunities into unified activity list
  type ActivityItem =
    | {
        type: 'call';
        id: string;
        company: string;
        status: string;
        detail: string;
        nextAction?: string;
        isInterested?: boolean;
        isEnded?: boolean;
      }
    | {
        type: 'opportunity';
        id: string;
        company: string;
        status: string;
        detail: string;
        dealValue: string;
        isSynced?: boolean;
      };

  const activities: ActivityItem[] = [
    ...opportunities.slice(0, 3).map(
      (opp): ActivityItem => ({
        type: 'opportunity',
        id: opp.id,
        company: opp.company_name,
        status: opp.stage || 'Qualified',
        detail: opp.matched_offering || 'Enterprise Sourcing',
        dealValue:
          opp.deal_value_estimate && opp.deal_value_estimate.toLowerCase() !== 'not available'
            ? opp.deal_value_estimate
            : 'Not available',
        isSynced: opp.crm_synced,
      })
    ),
    ...calls.slice(0, 3).map((call): ActivityItem => {
      const isInterested = call.insights?.qualification_verdict === 'Interested';
      const isEnded = call.status === 'Ended' || call.insights?.qualification_verdict === 'Not_Interested';
      const statusText =
        call.status === 'Ended'
          ? 'Ended'
          : call.insights?.qualification_verdict?.replace('_', ' ') || call.status;

      const requirement =
        call.insights?.need && call.insights.need !== 'Not available'
          ? call.insights.need
          : call.insights?.product_service && call.insights.product_service !== 'Not available'
          ? call.insights.product_service
          : 'Requirement discussion';

      return {
        type: 'call',
        id: call.id,
        company: call.company_name,
        status: statusText,
        detail: requirement,
        nextAction: call.insights?.next_best_action,
        isInterested,
        isEnded,
      };
    }),
  ].slice(0, 5);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
            <p className="text-xs text-slate-500">Live calls and pipeline updates</p>
          </div>
        </div>

        <Link
          href="/analytics"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          <span>Pipeline</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Activity Items */}
      <div className="p-6 divide-y divide-slate-100 flex-1 space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <Clock className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-xs font-semibold text-slate-600">No recent activity</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Calls and pipeline updates will appear here.</p>
          </div>
        ) : (
          activities.map((item, idx) => {
            const isCall = item.type === 'call';

            return (
              <div key={`${item.type}-${item.id}-${idx}`} className="pt-3 first:pt-0 space-y-1.5">
                {/* Top Row: Icon + Company + Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0 ${
                        isCall ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {isCall ? <PhoneCall className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                    </div>
                    <span className="font-bold text-xs text-slate-900 truncate max-w-[150px] sm:max-w-[180px]">
                      {item.company}
                    </span>
                  </div>

                  <Badge
                    variant={
                      !isCall
                        ? 'success'
                        : item.isInterested
                        ? 'success'
                        : item.isEnded
                        ? 'default'
                        : 'warning'
                    }
                    size="sm"
                    className="shrink-0"
                  >
                    {item.status}
                  </Badge>
                </div>

                {/* Second Row: Key Metric or Detail */}
                <div className="pl-8 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate max-w-[200px]">{item.detail}</span>
                  {!isCall ? (
                    <span className="font-bold text-slate-800 font-mono shrink-0 ml-1">
                      {item.dealValue}
                    </span>
                  ) : item.nextAction ? (
                    <span className="text-slate-600 truncate max-w-[130px] italic">
                      {item.nextAction}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
