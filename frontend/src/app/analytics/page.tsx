'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, CheckCircle2, ArrowRight, Share2, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { Opportunity, DashboardOverview } from '@/lib/types';

export default function AnalyticsPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  useEffect(() => {
    api.getOpportunities().then(setOpportunities);
    api.getDashboardOverview().then(setOverview);
  }, []);

  const handleCRMExport = async (oppId: string, targetCrm: string) => {
    setExportingId(oppId);
    try {
      const updated = await api.exportToCRM(oppId, targetCrm);
      setOpportunities((prev) =>
        prev.map((o) => (o.id === oppId ? updated : o))
      );
    } catch (err) {
      console.error('Failed export:', err);
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <span>Pipeline Analytics & CRM Opportunities</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tracks opportunity velocity, AI recommendation actions, and 1-click CRM sync (HubSpot, Salesforce).
          </p>
        </div>
      </div>

      {/* Conversion Funnel Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4">
          Lifecycle Conversion Efficiency
        </h2>
        <div className="space-y-3">
          {(overview?.funnel || []).map((step, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700">{step.stage}</span>
                <span className="text-slate-500 font-mono">
                  {step.count} ({step.percentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${step.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Qualified Opportunities & CRM Handoff Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">CRM Opportunity Pipeline & Next Best Actions</h2>
            <p className="text-xs text-slate-500">Qualified leads ready for account executive closing</p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            {opportunities.length} Active Deals
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {opportunities.map((opp) => (
            <div key={opp.id} className="p-5 space-y-3 hover:bg-slate-50/60 transition-all">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-bold text-base text-slate-900">{opp.company_name}</span>
                  <span className="text-xs text-slate-400 font-mono ml-2">({opp.domain})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {opp.deal_value_estimate}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    Stage: {opp.stage.replace('_', ' ')} ({opp.win_probability}% Win Prob)
                  </span>
                </div>
              </div>

              {/* Next Best Action Card */}
              {opp.next_action && (
                <div className="bg-indigo-50/50 p-3.5 rounded-lg border border-indigo-100 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Recommended Next Action: {opp.next_action.title}</span>
                    </span>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {opp.next_action.priority} Priority
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{opp.next_action.rationale}</p>
                </div>
              )}

              {/* Contact & Rep & CRM Status */}
              <div className="flex items-center justify-between pt-2 text-xs flex-wrap gap-3">
                <div className="text-slate-500">
                  <span>Assigned Rep: <strong>{opp.assigned_rep}</strong></span>
                  <span className="mx-2">•</span>
                  <span>Buyer: {opp.contact_name} ({opp.contact_email})</span>
                </div>

                <div className="flex items-center gap-2">
                  {opp.crm_synced ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Synced to {opp.crm_target} ({opp.crm_record_id})</span>
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCRMExport(opp.id, 'HubSpot')}
                        disabled={exportingId === opp.id}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>Export to HubSpot</span>
                      </button>
                      <button
                        onClick={() => handleCRMExport(opp.id, 'Salesforce')}
                        disabled={exportingId === opp.id}
                        className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
                      >
                        <span>Salesforce</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
