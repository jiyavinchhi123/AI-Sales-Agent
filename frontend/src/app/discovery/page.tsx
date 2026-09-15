'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Radar,
  Sparkles,
  Filter,
  Search,
  ExternalLink,
  Flame,
  CheckCircle2,
  Building2,
  MapPin,
  Clock,
  ArrowRight,
  SlidersHorizontal,
  Layers,
  Table as TableIcon,
  LayoutGrid,
  ShieldCheck,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { api } from '@/lib/api';
import { DiscoveredOpportunity, StructuredBusinessProfile, DiscoveryFilters } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

export default function LeadDiscoveryPage() {
  // State
  const [opportunities, setOpportunities] = useState<DiscoveredOpportunity[]>([]);
  const [sellerProfile, setSellerProfile] = useState<StructuredBusinessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [convertedIds, setConvertedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Filter state
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('All');
  const [industry, setIndustry] = useState('All');
  const [requirementType, setRequirementType] = useState('All');
  const [recency, setRecency] = useState('All');
  const [intentLevel, setIntentLevel] = useState('All');

  // Load active seller profile & run discovery only if profile is configured
  const loadDiscoveryData = async (customFilters?: DiscoveryFilters) => {
    setIsSearching(true);
    try {
      const profileData = await api.getStructuredBusinessProfile();
      setSellerProfile(profileData);
      if (profileData && profileData.company_name) {
        const opps = await api.discoverLeads(customFilters || {
          search: search || undefined,
          location: location !== 'All' ? location : undefined,
          industry: industry !== 'All' ? industry : undefined,
          requirement_type: requirementType !== 'All' ? requirementType : undefined,
          recency: recency !== 'All' ? recency : undefined,
          intent_level: intentLevel !== 'All' ? intentLevel : undefined,
        });
        setOpportunities(opps);
      } else {
        setOpportunities([]);
      }
    } catch (err) {
      console.error('Failed to load discovery data:', err);
      setOpportunities([]);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    loadDiscoveryData();
  }, []);


  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    loadDiscoveryData({
      search: search || undefined,
      location: location !== 'All' ? location : undefined,
      industry: industry !== 'All' ? industry : undefined,
      requirement_type: requirementType !== 'All' ? requirementType : undefined,
      recency: recency !== 'All' ? recency : undefined,
      intent_level: intentLevel !== 'All' ? intentLevel : undefined,
    });
  };

  const handleResetFilters = () => {
    setSearch('');
    setLocation('All');
    setIndustry('All');
    setRequirementType('All');
    setRecency('All');
    setIntentLevel('All');
    loadDiscoveryData({});
  };

  const handleConvertLead = async (oppId: string) => {
    setConvertingId(oppId);
    try {
      await api.convertDiscoveredOpportunity(oppId);
      setConvertedIds((prev) => new Set(prev).add(oppId));
      setOpportunities((prev) =>
        prev.map((o) => (o.id === oppId ? { ...o, status: 'Converted' } : o))
      );
    } catch (err) {
      console.error('Failed to convert opportunity:', err);
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white border border-indigo-100 shadow-sm p-1 shrink-0 flex items-center justify-center">
            <img src="/logo.png" alt="Signal Discovery" className="w-full h-full object-cover rounded-lg" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Step 3: Buying Signal & Requirement Discovery
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Discovers verified public buyer requirements and matches them against your seller business profile.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'cards'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. When No Business Profile Configured Yet */}
      {!sellerProfile && !isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-xs mt-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Configure Business Profile First</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            You haven&apos;t added your company details yet. Set up your company&apos;s products, services, and target market on the Business Profile page so the AI Sales Agent can discover and match relevant buyer requirements.
          </p>
          <div className="mt-6">
            <Link
              href="/business"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-200 transition-all"
            >
              <span>Go to Business Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Active Seller Profile Context Banner */}
          {sellerProfile && (
            <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-white rounded-xl border border-indigo-100/90 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Active Matching Profile:
                    </span>
                    <span className="text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {sellerProfile.company_name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      ({sellerProfile.products_services.length} Products Cataloged)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1 flex-wrap">
                    <span className="font-semibold text-indigo-700">Top Intent Keywords:</span>
                    {sellerProfile.keywords.slice(0, 4).map((kw, i) => (
                      <span key={i} className="text-[11px] font-mono bg-white/80 px-1.5 py-0.5 rounded border border-indigo-100 text-slate-700">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <Link
                href="/business"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white px-3 py-1.5 rounded-lg border border-indigo-200 shadow-2xs shrink-0 self-start md:self-auto"
              >
                <span>Edit Profile in Step 2</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Real-Time Live Web Scanner Indicator */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs text-emerald-900 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div>
                <span className="font-bold text-emerald-950">Real-Time Live Web & Procurement Scanner Active: </span>
                <span className="text-emerald-800">
                  Zero static or mock data. Discoveries are dynamically fetched from the live internet based on your business profile.
                </span>
              </div>
            </div>
          </div>

          {/* 3. Filter Controls Bar */}
          <form
            onSubmit={handleApplyFilters}
            className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs space-y-3"
          >

        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
            <span>Search & Discovery Filters</span>
          </div>
          {(search || location !== 'All' || industry !== 'All' || requirementType !== 'All' || intentLevel !== 'All') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-medium text-slate-500 hover:text-indigo-600"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company, requirement, quote..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Location Filter */}
          <div>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="All">Location: All</option>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Chicago">Chicago, IL</option>
              <option value="New York">New York, NY</option>
              <option value="San Francisco">San Francisco, CA</option>
              <option value="Boston">Boston, MA</option>
              <option value="Austin">Austin, TX</option>
              <option value="London">London, UK</option>
            </select>
          </div>

          {/* Industry Filter */}
          <div>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="All">Industry: All</option>
              <option value="Manufacturing">Manufacturing & Industrial</option>
              <option value="FinTech">Digital Banks & FinTech</option>
              <option value="Healthcare">Healthcare & Telehealth</option>
              <option value="Data">Enterprise Data & Analytics</option>
              <option value="Retail">E-Commerce & Retail Tech</option>
            </select>
          </div>

          {/* Requirement Type */}
          <div>
            <select
              value={requirementType}
              onChange={(e) => setRequirementType(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="All">Requirement: All</option>
              <option value="Migration">Cloud Migration & Support</option>
              <option value="AML">AML & Fraud Prevention</option>
              <option value="Compliance">Compliance & Security Posture</option>
              <option value="IAM">Cloud Security & IAM</option>
            </select>
          </div>

          {/* Intent Level */}
          <div>
            <select
              value={intentLevel}
              onChange={(e) => setIntentLevel(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="All">Intent: All Levels</option>
              <option value="High">High Intent</option>
              <option value="Medium">Medium Intent</option>
              <option value="Low">Low Intent</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Showing <strong>{opportunities.length}</strong> verified buying requirements
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm shadow-indigo-200 flex items-center gap-1.5 transition-all"
          >
            <Radar className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
            <span>{isSearching ? 'Discovering Requirements...' : 'Discover Buying Signals'}</span>
          </button>
        </div>
      </form>

      {/* 4. Discovered Opportunities View */}
      {viewMode === 'cards' ? (
        /* CARDS VIEW */
        <div className="space-y-4">
          {opportunities.map((opp) => {
            const isHighIntent = opp.intent_level === 'High';
            const isConverted = opp.status === 'Converted' || convertedIds.has(opp.id);

            return (
              <div
                key={opp.id}
                className="bg-white rounded-xl border border-slate-200/90 hover:border-indigo-300 p-6 shadow-xs transition-all flex flex-col justify-between gap-5"
              >
                <div>
                  {/* Top Bar: Company & Badges */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-base font-bold text-slate-900">{opp.company.name}</span>
                        <span className="text-xs text-slate-400 font-mono">({opp.company.domain})</span>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{opp.company.location}</span>
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <span>{opp.company.industry}</span>
                        <span>•</span>
                        <span>{opp.company.employee_count} employees</span>
                        {opp.company.revenue_estimate && (
                          <>
                            <span>•</span>
                            <span>{opp.company.revenue_estimate}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Intent & Match Pills */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isHighIntent
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isHighIntent && <Flame className="w-3.5 h-3.5 text-rose-500" />}
                        <span>Intent: {opp.intent_level}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Match: {opp.match_score}%</span>
                      </span>
                    </div>
                  </div>

                  {/* Highlighted Requirement Box */}
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                        Requirement: {opp.requirement.title}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {opp.requirement.requirement_type}
                      </span>
                    </div>

                    {/* Verbatim quote */}
                    <blockquote className="text-xs font-medium text-slate-800 italic leading-relaxed border-l-2 border-indigo-500 pl-3">
                      "{opp.requirement.description}"
                    </blockquote>

                    {opp.requirement.budget_hint && (
                      <div className="text-[11px] text-slate-500 pt-1">
                        <strong>Budget Indication:</strong> {opp.requirement.budget_hint}
                      </div>
                    )}
                  </div>

                  {/* Matching Rationale & Matched Offering */}
                  <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 pt-2 border-t border-slate-100">
                    <div className="text-slate-600">
                      <strong className="text-slate-800">Matched Offering: </strong>
                      <span className="font-semibold text-indigo-700">{opp.matched_offering}</span>
                      <span className="text-slate-400 block sm:inline sm:ml-2">
                        — {opp.match_rationale}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer: Source Platform, Original URL, and Convert Action */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs flex-wrap gap-3">
                  <div className="flex items-center gap-3 text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Source: {opp.source.platform}</span>
                    </span>
                    <span>•</span>
                    <a
                      href={opp.source.original_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 hover:underline"
                    >
                      <span>Original Requirement URL</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <span>•</span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(opp.detected_date).toLocaleDateString()}</span>
                    </span>
                  </div>

                  {/* Convert to Lead Button */}
                  <div>
                    {isConverted ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-bold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Lead Created in Pipeline</span>
                        </span>
                        <Link
                          href="/leads"
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline flex items-center gap-0.5"
                        >
                          <span>View Lead</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    ) : (

                      <button
                        type="button"
                        onClick={() => handleConvertLead(opp.id)}
                        disabled={convertingId === opp.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg font-bold text-xs shadow-2xs transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{convertingId === opp.id ? 'Converting...' : 'Convert to Qualified Lead'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Company</th>
                  <th className="p-4">Requirement</th>
                  <th className="p-4">Industry / Location</th>
                  <th className="p-4">Source Platform</th>
                  <th className="p-4">Intent</th>
                  <th className="p-4">Match</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {opportunities.map((opp) => {
                  const isConverted = opp.status === 'Converted' || convertedIds.has(opp.id);
                  return (
                    <tr key={opp.id} className="hover:bg-slate-50/80 transition-all">
                      <td className="p-4 font-bold text-slate-900 whitespace-nowrap">
                        <div>{opp.company.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{opp.company.domain}</div>
                      </td>
                      <td className="p-4 max-w-sm">
                        <div className="font-semibold text-slate-800">{opp.requirement.title}</div>
                        <div className="text-slate-500 text-[11px] truncate mt-0.5">"{opp.requirement.description}"</div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="text-slate-700">{opp.company.industry}</div>
                        <div className="text-slate-400 text-[10px]">{opp.company.location}</div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="text-slate-700 font-medium">{opp.source.platform}</div>
                        <a
                          href={opp.source.original_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline text-[10px] flex items-center gap-0.5"
                        >
                          <span>URL</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            opp.intent_level === 'High'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {opp.intent_level}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {opp.match_score}%
                        </span>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        {isConverted ? (
                          <span className="text-emerald-700 font-bold text-[11px] flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Converted</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleConvertLead(opp.id)}
                            disabled={convertingId === opp.id}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-[11px]"
                          >
                            Convert
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

