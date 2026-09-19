import React from 'react';
import Link from 'next/link';
import { PhoneCall, Mail, ArrowRight, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { Lead } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

interface AttentionLeadsProps {
  leads: Lead[];
}

export const AttentionLeads: React.FC<AttentionLeadsProps> = ({ leads }) => {
  // Prioritize leads needing action: New, Matched, Email_Sent, or Opportunity_Created
  const prioritizedLeads = [...leads]
    .sort((a, b) => {
      const scoreA = a.intent?.overall_score || 70;
      const scoreB = b.intent?.overall_score || 70;
      return scoreB - scoreA;
    })
    .slice(0, 4);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">What Needs Your Attention</h3>
            <p className="text-xs text-slate-500">Prioritized leads and immediate next actions</p>
          </div>
        </div>

        <Link
          href="/leads"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          <span>All Leads ({leads.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* List */}
      <div className="p-6 divide-y divide-slate-100 flex-1 space-y-4">
        {prioritizedLeads.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-xs font-semibold text-slate-700">All caught up!</p>
            <p className="text-[11px] text-slate-400 mt-0.5">No urgent lead follow-ups pending right now.</p>
          </div>
        ) : (
          prioritizedLeads.map((lead) => {
            const isOpportunity = lead.status === 'Opportunity_Created';
            const isEmailSent = lead.status === 'Email_Sent';
            const isMeeting = lead.status === 'Meeting_Booked';

            // Clean, dynamic requirement display
            const requirementText =
              lead.matched_offering || lead.match?.product_name || 'Commercial Procurement';

            // Determine actionable next step
            let actionText = 'Initiate outreach to qualify requirement & order quantity.';
            let actionLink = '/calling';
            let actionBtnLabel = 'Start Call';
            let ActionIcon = PhoneCall;

            if (isOpportunity) {
              actionText = 'Active opportunity registered. Review pipeline deal and quotation.';
              actionLink = '/analytics';
              actionBtnLabel = 'View Deal';
              ActionIcon = ArrowRight;
            } else if (isEmailSent) {
              actionText = 'Cold email sent. Follow up with a phone call to secure meeting.';
              actionLink = '/calling';
              actionBtnLabel = 'Call Follow-up';
              ActionIcon = PhoneCall;
            } else if (isMeeting) {
              actionText = 'Meeting scheduled. Prepare product specifications and price list.';
              actionLink = '/leads';
              actionBtnLabel = 'Prepare Dossier';
              ActionIcon = Mail;
            }

            return (
              <div key={lead.id} className="pt-4 first:pt-0 space-y-2.5">
                {/* Top Row: Company Name + Status Badge */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{lead.company_name}</span>
                    {lead.domain && (
                      <span className="text-xs text-slate-400 font-mono hidden sm:inline">({lead.domain})</span>
                    )}
                  </div>

                  <Badge
                    variant={
                      isOpportunity
                        ? 'success'
                        : isMeeting
                        ? 'purple'
                        : isEmailSent
                        ? 'primary'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {lead.status.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Requirement & Decision Maker */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-slate-600">
                  <div className="truncate max-w-md">
                    <span className="text-slate-400">Requirement: </span>
                    <span className="font-medium text-slate-800">{requirementText}</span>
                  </div>

                  {lead.primary_contact && (
                    <div className="text-slate-500 text-[11px] shrink-0">
                      Contact: <strong className="text-slate-700">{lead.primary_contact.name}</strong>
                    </div>
                  )}
                </div>

                {/* What to do next & Action Button */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">Next Step: </span>
                    <span>{actionText}</span>
                  </div>

                  <Link
                    href={actionLink}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all shrink-0"
                  >
                    <ActionIcon className="w-3.5 h-3.5" />
                    <span>{actionBtnLabel}</span>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
