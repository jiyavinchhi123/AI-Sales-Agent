'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Share2,
  Sparkles,
  Activity,
  Radar,
  Clock,
  ExternalLink,
  Layers,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Opportunity, DashboardOverview } from '@/lib/types';
import { ConversionFunnel } from '@/components/dashboard/ConversionFunnel';

export default function AnalyticsPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getOpportunities(), api.getDashboardOverview()])
      .then(([opps, over]) => {
        setOpportunities(opps);
        setOverview(over);
      })
      .finally(() => setLoading(false));
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

  const health = overview?.pipeline_health;
  const buyingSignals = overview?.top_buying_signals || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <span>Pipeline Analytics & Sales Intelligence</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            End-to-end conversion funnel, pipeline velocity health charts, and monitored buying signal breakdown.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/discovery"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition-all"
          >
            <Radar className="w-3.5 h-3.5 text-amber-500" />
            <span>Radar Scanner</span>
          </Link>
          <Link
            href="/calling"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-200 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Voice Outreach</span>
          </Link>
        </div>
      </div>

      {/* 1. Complete Conversion Funnel: Signals ➔ Leads ➔ Outreach ➔ Deals */}
      <ConversionFunnel funnel={overview?.funnel || []} />

      {/* 2. Pipeline Health & Stage Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Health Score Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pipeline Health Score</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {health?.health_label || 'Strong Velocity'}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-slate-900 font-mono">
                {health?.health_score || 82}
              </span>
              <span className="text-xs font-semibold text-slate-400">/ 100 Health Index</span>
            </div>

            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Calculated dynamically from outreach response rates, qualified opportunity velocity, and stage win probabilities.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Total Active Pipeline</span>
              <span className="font-bold text-slate-900 font-mono">
                {health?.total_pipeline_value || overview?.kpis.pipeline_value_estimate || '$0'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Avg Sales Velocity</span>
              <span className="font-bold text-slate-900 font-mono">
                {health?.average_cycle_days || 6.4} days to close
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>AI Qualification Rate</span>
              <span className="font-bold text-indigo-600 font-mono">
                {overview?.kpis.ai_qualification_rate || '60%'}
              </span>
            </div>
          </div>
        </div>

        {/* Stage-by-Stage Value & Win Probability Distribution */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Pipeline Stage Breakdown & Win Probabilities</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Stage distribution of deal values and estimated win rates
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
              {health?.active_deals_count || opportunities.length} Active Deals
            </span>
          </div>

          <div className="space-y-3 mt-4">
            {(health?.stage_breakdown || [
              { stage: 'Discovery', count: 0, formatted_value: '$0', avg_win_rate: 40 },
              { stage: 'Qualified', count: 0, formatted_value: '$0', avg_win_rate: 50 },
              { stage: 'Proposal', count: 1, formatted_value: '$50,000', avg_win_rate: 75 },
              { stage: 'Negotiation', count: 0, formatted_value: '$0', avg_win_rate: 65 },
              { stage: 'Won', count: 0, formatted_value: '$0', avg_win_rate: 90 },
            ]).map((st) => (
              <div key={st.stage} className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/60">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{st.stage}</span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {st.count} {st.count === 1 ? 'deal' : 'deals'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 font-mono">{st.formatted_value}</span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {st.avg_win_rate}% Win Prob
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-200/60 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      st.stage === 'Won'
                        ? 'bg-emerald-500'
                        : st.stage === 'Proposal'
                        ? 'bg-indigo-600'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.max(6, st.avg_win_rate)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Monitored Buying Signals Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                <Radar className="w-3.5 h-3.5" />
                <span>Monitored Signals</span>
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {buyingSignals.length} Active Triggers
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              Live Buying Signals & Market Intent Breakdown
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              High-intent purchase signals detected and prioritized by the autonomous AI crawler.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(health?.signals_by_category || []).map((cat) => (
              <span
                key={cat.category}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
              >
                {cat.category}: <strong>{cat.count}</strong>
              </span>
            ))}
          </div>
        </div>

        {buyingSignals.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">
            No buying signals detected yet. Configure your Business Profile keywords or discover live signals.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {buyingSignals.map((signal) => (
              <div
                key={signal.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {signal.company_name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          signal.urgency_level === 'High'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {signal.urgency_level} Urgency
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                        {signal.confidence_score}% Fit
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-relaxed mb-1.5">
                    {signal.title}
                  </h3>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {signal.summary}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1 font-medium text-slate-600">
                    <Radar className="w-3 h-3 text-indigo-500" />
                    <span>{signal.source}</span>
                  </span>

                  {signal.lead_id ? (
                    <Link
                      href={`/leads?search=${encodeURIComponent(signal.company_name)}`}
                      className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <span>View Lead Dossier</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <Link
                      href={`/discovery?q=${encodeURIComponent(signal.company_name)}`}
                      className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <span>Scout Signal</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Qualified Opportunities & CRM Handoff Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">CRM Opportunity Pipeline & Next Best Actions</h2>
            <p className="text-xs text-slate-500">Qualified accounts ready for account executive closing</p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            {opportunities.length} Active Deals
          </span>
        </div>

        {opportunities.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-500">
            No CRM opportunities generated yet. Engage leads with AI Outreach or voice calling to convert them into active deals.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {opportunities.map((opp) => (
              <div key={opp.id} className="p-5 space-y-3 hover:bg-slate-50/60 transition-all">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-bold text-base text-slate-900">{opp.company_name}</span>
                    <span className="text-xs text-slate-400 font-mono ml-2">({opp.domain})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
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
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>Export to HubSpot</span>
                        </button>
                        <button
                          onClick={() => handleCRMExport(opp.id, 'Salesforce')}
                          disabled={exportingId === opp.id}
                          className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
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
        )}
      </div>
    </div>
  );
}

