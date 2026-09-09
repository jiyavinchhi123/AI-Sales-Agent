import React from 'react';
import Link from 'next/link';
import { PhoneCall, ArrowRight, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import { CallSession } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

interface RecentAICallsProps {
  calls: CallSession[];
}

export const RecentAICalls: React.FC<RecentAICallsProps> = ({ calls }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent AI Calls</h3>
            <p className="text-xs text-slate-500">Autonomous outreach dialogue and insights</p>
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

      <div className="p-6 divide-y divide-slate-100 flex-1">
        {calls.length === 0 ? (
          <div className="text-center py-10 flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <PhoneCall className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-xs font-semibold text-slate-600">No AI calls recorded yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Simulate outreach dialogue from the Leads console.</p>
          </div>
        ) : (

          calls.map((call) => (
            <div key={call.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900">{call.company_name}</div>
                  <div className="text-[11px] text-slate-500">
                    {call.contact_name} • <span className="text-slate-400">{call.contact_title}</span>
                  </div>
                </div>

                <div className="text-right">
                  <Badge
                    variant={
                      call.insights?.qualification_verdict === 'Qualified_Interested'
                        ? 'success'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {call.insights?.qualification_verdict?.replace('_', ' ') || call.status}
                  </Badge>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 justify-end mt-1">
                    <Clock className="w-3 h-3" />
                    <span>{call.duration_seconds}s duration</span>
                  </div>
                </div>
              </div>

              {call.insights && (
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/70 p-2 rounded-lg border border-slate-200/50">
                  {call.insights.summary}
                </p>
              )}

              {call.battlecards_used && call.battlecards_used.length > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <ShieldAlert className="w-3 h-3 text-amber-500" />
                  <span>Objection resolved: <strong>{call.battlecards_used[0].objection}</strong></span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
