'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Radar, PhoneCall, RefreshCw, Activity } from 'lucide-react';
import { api } from '@/lib/api';
import { Lead, Opportunity, CallSession, DashboardOverview } from '@/lib/types';
import { CommandKpis } from '@/components/dashboard/CommandKpis';
import { AttentionLeads } from '@/components/dashboard/AttentionLeads';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { ConversionFunnel } from '@/components/dashboard/ConversionFunnel';

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [calls, setCalls] = useState<CallSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('Welcome back');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const loadDashboardData = async () => {
    try {
      const [overviewData, leadsData, oppsData, callsData] = await Promise.all([
        api.getDashboardOverview(),
        api.getLeads(),
        api.getOpportunities(),
        api.getCallSessions(),
      ]);
      setOverview(overviewData);
      setLeads(leadsData);
      setOpportunities(oppsData);
      setCalls(callsData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // Pure dynamic counts from verified database data
  const totalLeadsCount = leads.length;

  const qualifiedCount = leads.filter(
    (l) =>
      l.status === 'Matched' ||
      l.status === 'Outreach_Ready' ||
      l.status === 'Interested' ||
      l.status === 'Opportunity_Created' ||
      Boolean(l.match)
  ).length;

  const interestedCount = leads.filter(
    (l) => l.status === 'Interested' || l.status === 'Opportunity_Created'
  ).length;

  const opportunitiesCount = opportunities.length;

  const signalsCount =
    overview?.buying_signals_summary?.total_active_signals ||
    overview?.funnel?.[0]?.count ||
    totalLeadsCount;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header + Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {greeting}, Sales Leader
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Database
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Sales Command Center — real-time attention queue and pipeline execution.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/discovery"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs shadow-indigo-100 transition-all"
          >
            <Radar className="w-3.5 h-3.5" />
            <span>Discover Signals</span>
          </Link>
          <Link
            href="/calling"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-all"
          >
            <PhoneCall className="w-3.5 h-3.5 text-indigo-400" />
            <span>Launch AI Call</span>
          </Link>
        </div>
      </div>

      {/* 2. Top 4 KPIs: Leads, Interested, Qualified, Opportunities */}
      <CommandKpis
        leads={totalLeadsCount}
        interested={interestedCount}
        qualified={qualifiedCount}
        opportunities={opportunitiesCount}
      />

      {/* 3 & 4. Main Two-Column Hub: What Needs Attention (Left) & Recent Activity (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7">
          <AttentionLeads leads={leads} />
        </div>
        <div className="lg:col-span-5">
          <RecentActivityFeed calls={calls} opportunities={opportunities} />
        </div>
      </div>

      {/* 5. Bottom "Sales Flow": Signals → Leads → Qualified → Opportunities */}
      <ConversionFunnel
        title="Sales Flow"
        subtitle="Signals → Leads → Qualified → Opportunities"
        signals={signalsCount}
        leads={totalLeadsCount}
        qualified={qualifiedCount}
        opportunities={opportunitiesCount}
      />
    </div>
  );
}
