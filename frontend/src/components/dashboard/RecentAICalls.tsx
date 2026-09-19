import React from 'react';
import Link from 'next/link';
import { PhoneCall, ArrowRight } from 'lucide-react';
import { CallSession } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

interface RecentAICallsProps {
  calls: CallSession[];
}

export const RecentAICalls: React.FC<RecentAICallsProps> = ({ calls }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent AI Calls</h3>
            <p className="text-xs text-slate-500">Autonomous voice outreach & qualification</p>
          </div>
        </div>
        <Link
          href="/calling"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          <span>Open Console</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* List */}
      <div className="p-6 divide-y divide-slate-100 flex-1 space-y-3">
        {calls.length === 0 ? (
          <div className="text-center py-10 flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <PhoneCall className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-xs font-semibold text-slate-600">No AI calls recorded yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Calls conducted in the calling console will appear here.</p>
          </div>
        ) : (
          calls.slice(0, 5).map((call) => {
            const statusLabel =
              call.status === 'Ended'
                ? 'Ended'
                : call.insights?.qualification_verdict?.replace('_', ' ') || call.status;

            const isInterested = call.insights?.qualification_verdict === 'Interested';
            const isEnded = call.status === 'Ended' || call.insights?.qualification_verdict === 'Not_Interested';

            const requirementText =
              call.insights?.need && call.insights.need !== 'Not available'
                ? call.insights.need
                : call.insights?.product_service && call.insights.product_service !== 'Not available'
                ? call.insights.product_service
                : 'Not discussed';

            const nextActionText =
              call.insights?.next_best_action && call.insights.next_best_action !== 'Not available'
                ? call.insights.next_best_action
                : 'Follow up with prospect';

            return (
              <div key={call.id} className="pt-3 first:pt-0 space-y-2">
                {/* Row 1: Company + Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900">{call.company_name}</span>
                      {call.contact_name && (
                        <span className="text-[11px] text-slate-400 font-medium">({call.contact_name})</span>
                      )}
                    </div>
                  </div>

                  <Badge
                    variant={isInterested ? 'success' : isEnded ? 'default' : 'warning'}
                    size="sm"
                    className="shrink-0"
                  >
                    {statusLabel}
                  </Badge>
                </div>

                {/* Row 2: Requirement */}
                <div className="text-xs text-slate-600 truncate text-[11px]">
                  <span className="text-slate-400">Requirement: </span>
                  <span className="font-medium text-slate-700">{requirementText}</span>
                </div>

                {/* Row 3: Next Action */}
                <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium shrink-0">Next Action:</span>
                  <span className="font-semibold text-slate-800 truncate">{nextActionText}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
