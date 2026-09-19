'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  Radar,
  Users,
  Send,
  Briefcase,
  ArrowRight,
  RefreshCw,
  Share2,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  PhoneCall,
  DollarSign,
  Tag,
} from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardOverview, OpportunityRecord, BuyingSignalItem } from '@/lib/types';

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = async () => {
    try {
      const data = await api.getDashboardOverview();
      setOverview(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  const handleCRMExport = async (oppId: string, targetCrm: string) => {
    setExportingId(oppId);
    try {
      await api.exportToCRM(oppId, targetCrm);
      await loadAnalytics();
    } catch (err) {
      console.error('Failed export:', err);
    } finally {
      setExportingId(null);
    }
  };

  const rates = overview?.conversion_rates;
  const counts = rates?.counts || {
    signals: overview?.funnel?.[0]?.count ?? 0,
    leads: overview?.funnel?.[1]?.count ?? 0,
    outreach: overview?.funnel?.[2]?.count ?? 0,
    opportunities: overview?.funnel?.[3]?.count ?? 0,
  };

  const signalsSummary = overview?.buying_signals_summary;
  const signalsList: BuyingSignalItem[] = signalsSummary?.signals || [];
  const oppSummary = overview?.opportunity_summary;
  const oppsList: OpportunityRecord[] = oppSummary?.opportunities || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <span>Sales Funnel & Conversion Analytics</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Answers directly: How many buying signals did AI find, how many became leads, how many were contacted, and how many became opportunities?
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            title="Refresh database metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/discovery"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition-all"
          >
            <Radar className="w-3.5 h-3.5 text-amber-500" />
            <span>Scout Signals</span>
          </Link>
          <Link
            href="/calling"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-200 transition-all"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>AI Calling</span>
          </Link>
        </div>
      </div>

      {/* 1. CONVERSION FUNNEL: Signals ➔ Leads ➔ Outreach ➔ Opportunities */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Feature 1: Conversion Funnel</span>
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                100% Database Sourced
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              End-to-End Sales Pipeline Funnel
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time counts tracking buying signals through lead enrichment, AI outreach contact, and CRM deal creation.
            </p>
          </div>
        </div>

        {/* 4-Stage Visual Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Stage 1: Buying Signals */}
          <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-200/70 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Radar className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded">
                  Stage 1
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-700">Buying Signals</h3>
              <div className="text-3xl font-black text-slate-900 font-mono mt-1">
                {counts.signals}
              </div>
              <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                Active buyer requirements & market purchase intent detected by AI.
              </p>
            </div>
            <div className="pt-3 mt-4 border-t border-amber-200/50 flex items-center justify-between text-xs text-amber-800 font-semibold">
              <span>Signals Ingested</span>
              <Link href="/discovery" className="hover:underline flex items-center gap-0.5">
                <span>View</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Stage 2: Qualified Leads */}
          <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-200/70 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded">
                  Stage 2
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-700">Qualified Leads</h3>
              <div className="text-3xl font-black text-slate-900 font-mono mt-1">
                {counts.leads}
              </div>
              <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                Verified buyer companies matched with decision-makers in database.
              </p>
            </div>
            <div className="pt-3 mt-4 border-t border-blue-200/50 flex items-center justify-between text-xs text-blue-800 font-semibold">
              <span>Leads Enriched</span>
              <Link href="/leads" className="hover:underline flex items-center gap-0.5">
                <span>View</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Stage 3: AI Outreach */}
          <div className="bg-indigo-50/50 rounded-xl p-5 border border-indigo-200/70 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Send className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded">
                  Stage 3
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-700">AI Outreach</h3>
              <div className="text-3xl font-black text-slate-900 font-mono mt-1">
                {counts.outreach}
              </div>
              <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                Unique leads contacted via personalized AI email or voice calling.
              </p>
            </div>
            <div className="pt-3 mt-4 border-t border-indigo-200/50 flex items-center justify-between text-xs text-indigo-800 font-semibold">
              <span>Leads Contacted</span>
              <Link href="/calling" className="hover:underline flex items-center gap-0.5">
                <span>View</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Stage 4: Opportunities */}
          <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-200/70 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Briefcase className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                  Stage 4
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-700">Opportunities</h3>
              <div className="text-3xl font-black text-slate-900 font-mono mt-1">
                {counts.opportunities}
              </div>
              <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                Active sales opportunities and qualified deals in the pipeline.
              </p>
            </div>
            <div className="pt-3 mt-4 border-t border-emerald-200/50 flex items-center justify-between text-xs text-emerald-800 font-semibold">
              <span>Deals Created</span>
              <span className="text-[10px] text-emerald-600 font-normal">Active Deals</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC CONVERSION RATES: Calculated purely from actual database data */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Feature 2: Conversion Rates</span>
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">
              Actual Database Conversion Metrics
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Calculated dynamically: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">count / base × 100</code>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Signal ➔ Lead Conversion */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">
              Signal → Lead Conversion
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-900 font-mono">
                {rates?.signal_to_lead ?? 0}%
              </span>
              <span className="text-xs text-slate-400 font-medium">rate</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              <strong>{counts.leads}</strong> leads qualified from <strong>{counts.signals}</strong> total buying signals in database.
            </p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, rates?.signal_to_lead ?? 0))}%` }}
              />
            </div>
          </div>

          {/* Lead ➔ Opportunity Conversion */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">
              Lead → Opportunity Conversion
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-900 font-mono">
                {rates?.lead_to_opportunity ?? 0}%
              </span>
              <span className="text-xs text-slate-400 font-medium">rate</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              <strong>{counts.opportunities}</strong> opportunities converted from <strong>{counts.leads}</strong> qualified leads.
            </p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, rates?.lead_to_opportunity ?? 0))}%` }}
              />
            </div>
          </div>

          {/* Overall Conversion */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">
              Overall Pipeline Conversion
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-900 font-mono">
                {rates?.overall_conversion ?? 0}%
              </span>
              <span className="text-xs text-slate-400 font-medium">rate</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              <strong>{counts.opportunities}</strong> opportunities resulting from <strong>{counts.signals}</strong> total buying signals.
            </p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, rates?.overall_conversion ?? 0))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. BUYING SIGNAL BREAKDOWN */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                <Radar className="w-3.5 h-3.5" />
                <span>Feature 3: Buying Signal Breakdown</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                {signalsList.length} Active Signals
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              Active Buying Signals & Requirements
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified buying signals, source platforms, product requirements, and intent levels from the database.
            </p>
          </div>

          <Link
            href="/discovery"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Discover More Signals</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {signalsList.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-500">
            No buying signals currently recorded in database.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            {signalsList.map((sig) => (
              <div
                key={sig.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {sig.company_name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Urgency/Intent ONLY if actually available */}
                      {sig.intent_level && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            sig.intent_level.toLowerCase() === 'high'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {sig.intent_level} Intent
                        </span>
                      )}
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {sig.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-relaxed mb-2">
                    {sig.requirement}
                  </h3>

                  {sig.product && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mb-2">
                      <Tag className="w-3 h-3 text-indigo-500 shrink-0" />
                      <span className="truncate">Product: <strong>{sig.product}</strong></span>
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="truncate">
                    Source: <strong className="text-slate-700">{sig.source}</strong>
                  </span>

                  {sig.lead_id ? (
                    <Link
                      href={`/leads?search=${encodeURIComponent(sig.company_name)}`}
                      className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 shrink-0 ml-2"
                    >
                      <span>Lead Dossier</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <span className="text-slate-400">Monitored Trigger</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. OPPORTUNITY SUMMARY: Active opportunities, pipeline stage, pipeline value only if real */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Feature 4: Opportunity Summary</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                {oppsList.length} Active Opportunities
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              CRM Pipeline & Active Sales Opportunities
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Current pipeline stages and real deal values from database.
            </p>
          </div>

          {/* Pipeline Value ONLY if real deal values exist */}
          <div className="flex items-center gap-2">
            {oppSummary?.has_real_values && oppSummary.formatted_pipeline_value && oppSummary.formatted_pipeline_value.toLowerCase() !== 'not available' ? (
              <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-right">
                <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider block">
                  Real Pipeline Value
                </span>
                <span className="text-base font-black text-emerald-900 font-mono">
                  {oppSummary.formatted_pipeline_value}
                </span>
              </div>
            ) : (
              <span className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-mono">
                Pipeline Value: <strong>Not available</strong>
              </span>
            )}
          </div>
        </div>

        {/* Stage Breakdown Chips */}
        {oppSummary?.stage_breakdown && oppSummary.stage_breakdown.length > 0 && (
          <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2 flex-wrap text-xs">
            <span className="font-semibold text-slate-600 text-[11px] uppercase tracking-wider">
              Stages:
            </span>
            {oppSummary.stage_breakdown.map((st) => (
              <span
                key={st.stage}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200 text-xs"
              >
                <span className="font-medium">{st.stage}</span>
                <strong className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-[10px] text-slate-900">
                  {st.count}
                </strong>
              </span>
            ))}
          </div>
        )}

        {/* Opportunities List */}
        {oppsList.length === 0 ? (
          <div className="text-center py-16 px-4 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Briefcase className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No active opportunities yet.</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Opportunities are generated only from verified buyer interactions and actual lead/call agreements.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {oppsList.map((opp) => (
              <div key={opp.id} className="p-5 space-y-3 hover:bg-slate-50/60 transition-all">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm text-slate-900">{opp.company_name}</span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      Stage: {opp.stage || 'Not available'}
                    </span>
                  </div>

                  {/* Real Deal Value or Not available */}
                  <div className="flex items-center gap-2">
                    {opp.formatted_deal_value && opp.formatted_deal_value.toLowerCase() !== 'not available' ? (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                        {opp.formatted_deal_value}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-mono">
                        Deal Value: Not available
                      </span>
                    )}
                  </div>
                </div>

                {/* Next Action Title if present */}
                {opp.next_action_title && opp.next_action_title.toLowerCase() !== 'not available' ? (
                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 flex items-center justify-between gap-2">
                    <span>Next Action: <strong>{opp.next_action_title}</strong></span>
                    {opp.next_action_priority && opp.next_action_priority.toLowerCase() !== 'not available' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        {opp.next_action_priority} Priority
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 bg-slate-50/50 p-2 rounded border border-slate-100">
                    Next Action: Not available
                  </div>
                )}

                {/* Footer with Rep & CRM Export Actions */}
                <div className="flex items-center justify-between pt-1 text-xs text-slate-500 flex-wrap gap-2">
                  <span>Assigned Rep: <strong>{opp.assigned_rep || 'Not assigned'}</strong></span>

                  <div className="flex items-center gap-2">
                    {opp.crm_synced ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Synced to {opp.crm_target || 'CRM'}</span>
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCRMExport(opp.id, 'HubSpot')}
                          disabled={exportingId === opp.id}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>Export to HubSpot</span>
                        </button>
                        <button
                          onClick={() => handleCRMExport(opp.id, 'Salesforce')}
                          disabled={exportingId === opp.id}
                          className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded text-xs font-semibold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
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
