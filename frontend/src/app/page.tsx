'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Radar,
  PhoneCall,
  Sparkles,
  RefreshCw,
  Building2,
  Users,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Lead, Opportunity, CallSession, DashboardOverview } from '@/lib/types';
import { StatCardsGroup } from '@/components/dashboard/StatCardsGroup';
import { RecentOpportunities } from '@/components/dashboard/RecentOpportunities';
import { RecentAICalls } from '@/components/dashboard/RecentAICalls';
import { IntentDistribution } from '@/components/dashboard/IntentDistribution';

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [calls, setCalls] = useState<CallSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  // Pure dynamic counts from database
  const totalLeadsCount = leads.length;
  const highIntentCount = leads.filter(
    (l) => l.intent && (l.intent.grade === 'A' || l.intent.overall_score >= 80)
  ).length;
  const qualifiedCount = leads.filter(
    (l) =>
      l.status === 'Matched' ||
      l.status === 'Outreach_Ready' ||
      l.status === 'Interested' ||
      l.status === 'Opportunity_Created'
  ).length;
  const interestedCount = leads.filter(
    (l) => l.status === 'Interested' || l.status === 'Opportunity_Created'
  ).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Sales Intelligence & Opportunity Dashboard</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Database
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time signal tracking, intent qualification, automated AI calling, and CRM pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/discovery"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-200 transition-all"
          >
            <Radar className="w-3.5 h-3.5" />
            <span>Discover Signals</span>
          </Link>
          <Link
            href="/calling"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all"
          >
            <PhoneCall className="w-3.5 h-3.5 text-indigo-400" />
            <span>Launch AI Call</span>
          </Link>
        </div>
      </div>

      {/* Dynamic Metric Cards */}
      <StatCardsGroup
        totalLeads={totalLeadsCount}
        highIntent={highIntentCount}
        qualified={qualifiedCount}
        interested={interestedCount}
      />

      {/* Guided Onboarding Banner when database has 0 leads */}
      {leads.length === 0 && (
        <div className="bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/80 border border-indigo-100 rounded-2xl p-6 sm:p-8">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Workspace Ready</span>
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Welcome! Let&apos;s start discovering high-intent buyer signals.
            </h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Your database is clean with zero hardcoded fake data. Set up your business profile so the AI agent understands your offerings, then discover verified buying requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Link
              href="/business"
              className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm mb-3">
                  1
                </div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Set Up Business Profile
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Provide your company offerings or upload docs for AI extraction.
                </p>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 mt-4">
                <span>Configure Profile</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              href="/discovery"
              className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm mb-3">
                  2
                </div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Discover Buying Signals
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Search and score live buyer RFPs and intent requirements.
                </p>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 mt-4">
                <span>Find Signals</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              href="/leads"
              className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm mb-3">
                  3
                </div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Build Your Pipeline
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Convert high-match opportunities into qualified pipeline leads.
                </p>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 mt-4">
                <span>View Pipeline</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Middle Grid: Recent Opportunities & Recent AI Calls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <RecentOpportunities opportunities={opportunities} />
        <RecentAICalls calls={calls} />
      </div>

      {/* Bottom Section: Lead Intent Distribution */}
      <IntentDistribution leads={leads} />
    </div>
  );
}
