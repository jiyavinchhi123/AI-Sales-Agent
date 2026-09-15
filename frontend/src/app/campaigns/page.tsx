'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Send,
  Plus,
  Users,
  PhoneCall,
  Mail,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Play,
  Pause,
  Trash2,
  Clock,
  Layers,
  Flame,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  X,
  Radio,
  Calendar,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Campaign, CampaignCreateInput, Lead } from '@/lib/types';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedLeadsCampaign, setSelectedLeadsCampaign] = useState<Campaign | null>(null);

  // Launch action state
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [launchNotification, setLaunchNotification] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Form State
  const [formData, setFormData] = useState<CampaignCreateInput>({
    name: '',
    description: '',
    target_criteria: 'High-Intent Verified Leads',
    channels: ['Personalized Email', 'AI Voice Call'],
    tone: 'Consultative & Solution-Focused',
    target_intent: 'All',
  });

  const loadData = async () => {
    try {
      const [camps, leadList] = await Promise.all([api.getCampaigns(), api.getLeads()]);
      setCampaigns(camps);
      setLeads(leadList);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setCreating(true);
    try {
      const created = await api.createCampaign(formData);
      setCampaigns((prev) => [created, ...prev]);
      setCreateModalOpen(false);
      setFormData({
        name: '',
        description: '',
        target_criteria: 'High-Intent Verified Leads',
        channels: ['Personalized Email', 'AI Voice Call'],
        tone: 'Consultative & Solution-Focused',
        target_intent: 'All',
      });
      setLaunchNotification({
        success: true,
        message: `Campaign '${created.name}' created and ready for launch!`,
      });
    } catch (err: any) {
      alert(`Failed to create campaign: ${err.message || 'Unknown error'}`);
    } finally {
      setCreating(false);
    }
  };

  const handleLaunch = async (campId: string) => {
    setLaunchingId(campId);
    setLaunchNotification(null);
    try {
      const res = await api.launchCampaign(campId);
      setLaunchNotification({
        success: true,
        message: res.message,
      });
      // Refresh list to pull updated stats
      await loadData();
    } catch (err: any) {
      setLaunchNotification({
        success: false,
        message: err.message || 'Failed to launch campaign',
      });
    } finally {
      setLaunchingId(null);
    }
  };

  const handleToggle = async (campId: string) => {
    try {
      const updated = await api.toggleCampaignStatus(campId);
      setCampaigns((prev) => prev.map((c) => (c.id === campId ? updated : c)));
    } catch (err: any) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDelete = async (campId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await api.deleteCampaign(campId);
      setCampaigns((prev) => prev.filter((c) => c.id !== campId));
    } catch (err: any) {
      alert('Failed to delete campaign');
    }
  };

  const toggleChannel = (channel: string) => {
    setFormData((prev) => {
      const exists = prev.channels.includes(channel);
      if (exists && prev.channels.length === 1) return prev; // Keep at least one
      return {
        ...prev,
        channels: exists ? prev.channels.filter((c) => c !== channel) : [...prev.channels, channel],
      };
    });
  };

  // KPI Calculations
  const activeCount = campaigns.filter((c) => c.status === 'Active' || c.status === 'Running').length;
  const totalEnrolled = campaigns.reduce((acc, c) => acc + (c.total_leads || leads.length), 0);
  const totalContacted = campaigns.reduce((acc, c) => acc + (c.contacted_count || 0), 0);
  const totalMeetings = campaigns.reduce((acc, c) => acc + (c.scheduled_meetings || 0), 0);
  const avgResponse =
    campaigns.length > 0
      ? (campaigns.reduce((acc, c) => acc + (c.response_rate || 0), 0) / campaigns.length).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white border border-indigo-100 shadow-sm p-1 shrink-0 flex items-center justify-center">
            <img src="/logo.png" alt="AI Campaigns" className="w-full h-full object-cover rounded-lg" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Autonomous AI Outbound Campaigns
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Orchestrate multi-touch outreach cadences (Personalized AI Email + Autonomous Voice Calls) across verified buyer leads.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            title="Refresh Campaigns"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold rounded-lg shadow-sm shadow-indigo-200 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New AI Campaign</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {launchNotification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            launchNotification.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-medium">
            {launchNotification.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{launchNotification.message}</span>
          </div>
          <button
            onClick={() => setLaunchNotification(null)}
            className="text-slate-400 hover:text-slate-600 text-xs p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Active Cadences</span>
            <Radio className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">{activeCount}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <span>Live autonomous agents</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Enrolled Leads</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">{totalEnrolled}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Matched to target criteria</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>AI Engagements</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">{totalContacted}</div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-1">Emails & calls dispatched</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Meetings Secured</span>
            <Calendar className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">{totalMeetings}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">{avgResponse}% response rate</div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Outbound AI Cadences ({campaigns.length})
          </h2>
          <span className="text-xs text-slate-500">
            Click <strong>Launch Cadence</strong> to automatically contact all matching leads.
          </span>
        </div>

        {campaigns.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No campaigns created yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
              Create your first multi-channel outbound cadence to reach verified buyers using autonomous AI emails and phone calls.
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First AI Campaign</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {campaigns.map((camp) => {
              const isLaunching = launchingId === camp.id;
              const hasEmail = camp.channels.includes('Personalized Email');
              const hasVoice = camp.channels.includes('AI Voice Call');
              const progressPct =
                camp.total_leads > 0
                  ? Math.min(100, Math.round((camp.contacted_count / camp.total_leads) * 100))
                  : 0;

              return (
                <div
                  key={camp.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all group"
                >
                  <div>
                    {/* Top Row: Status, Created & Actions */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            camp.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : camp.status === 'Running'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {camp.status}
                        </span>

                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(camp.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleToggle(camp.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title={camp.status === 'Active' ? 'Pause Campaign' : 'Resume Campaign'}
                        >
                          {camp.status === 'Active' ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(camp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-base font-bold text-slate-900 leading-tight mb-1">
                      {camp.name}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {camp.description || 'Targeted AI campaign targeting verified buyer requirements.'}
                    </p>

                    {/* Channel & Target Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/70 border border-indigo-100 text-indigo-800 font-semibold text-[11px]">
                        {hasEmail && <Mail className="w-3 h-3 text-indigo-600" />}
                        {hasVoice && <PhoneCall className="w-3 h-3 text-indigo-600" />}
                        <span>{camp.channels.join(' + ')}</span>
                      </div>

                      <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-700 text-[11px]">
                        <strong>Target:</strong> {camp.target_criteria}
                      </div>

                      {camp.tone && (
                        <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-600 text-[11px]">
                          <strong>Tone:</strong> {camp.tone}
                        </div>
                      )}
                    </div>

                    {/* Cadence Steps Timeline */}
                    {camp.cadence_steps && camp.cadence_steps.length > 0 && (
                      <div className="mb-5 p-3 rounded-xl bg-slate-50/80 border border-slate-200/60">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-indigo-500" />
                          <span>Cadence Sequence</span>
                        </div>
                        <div className="space-y-1.5">
                          {camp.cadence_steps.map((st, i) => (
                            <div key={i} className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center text-[9px] font-bold">
                                  {st.step}
                                </span>
                                <span className="font-semibold text-slate-800">{st.channel}</span>
                                <span className="text-slate-400 font-mono">({st.timing})</span>
                              </div>
                              <span className="text-slate-500 text-[10px] truncate max-w-[180px]">
                                {st.action}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">Outreach Execution</span>
                        <span className="font-bold text-slate-800 font-mono">
                          {camp.contacted_count} / {camp.total_leads || leads.length} leads ({progressPct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 transition-all duration-500"
                          style={{ width: `${Math.max(4, progressPct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Performance Stats Bar */}
                    <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-xl bg-slate-50/50 border border-slate-100 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400">Target Leads</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
                          {camp.total_leads || leads.length}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Contacted</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
                          {camp.contacted_count}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Meetings</div>
                        <div className="text-sm font-bold text-emerald-600 mt-0.5 font-mono">
                          {camp.scheduled_meetings}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Response</div>
                        <div className="text-sm font-bold text-indigo-600 mt-0.5 font-mono">
                          {camp.response_rate}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA Actions */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedLeadsCampaign(camp)}
                      className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>View Enrolled Leads</span>
                    </button>

                    <button
                      onClick={() => handleLaunch(camp.id)}
                      disabled={isLaunching}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm shadow-indigo-200 transition-all cursor-pointer"
                    >
                      {isLaunching ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Dispatching Outreach...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Launch Cadence</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE CAMPAIGN WIZARD MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create Outbound AI Campaign</h3>
                  <p className="text-xs text-slate-500">Configure multi-channel autonomous cadence</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4 text-xs">
              {/* Campaign Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Campaign Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Retail Boutique Sourcing Cadence"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Campaign Objective</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Engage luxury boutiques with our handcrafted modal silk catalog to secure wholesale sample orders."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Channels Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Outreach Channels</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleChannel('Personalized Email')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      formData.channels.includes('Personalized Email')
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Mail className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div>Personalized Email</div>
                      <div className="text-[10px] font-normal text-slate-500">
                        Direct SMTP delivery
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleChannel('AI Voice Call')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      formData.channels.includes('AI Voice Call')
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <PhoneCall className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div>AI Voice Call</div>
                      <div className="text-[10px] font-normal text-slate-500">
                        Voice agent briefing
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Target Audience Criteria */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Audience Criteria</label>
                <select
                  value={formData.target_criteria}
                  onChange={(e) => setFormData({ ...formData, target_criteria: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="High-Intent Verified Leads">High-Intent Verified Leads (Grade A & B)</option>
                  <option value="Fashion, Luxury Boutiques & Wholesale Apparel Retail">
                    Fashion, Boutiques & Apparel Wholesale
                  </option>
                  <option value="Information Technology, Enterprise Software & Cloud Solutions">
                    IT, Software & Cloud Enterprise
                  </option>
                  <option value="All Active Database Leads">All Active Database Leads</option>
                </select>
              </div>

              {/* Communication Tone */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">AI Communication Tone</label>
                <select
                  value={formData.tone}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="Consultative & Solution-Focused">Consultative & Solution-Focused</option>
                  <option value="Executive Briefing & High-Level">Executive Briefing & High-Level</option>
                  <option value="Direct, Urgent & Procurement-Driven">Direct, Urgent & Procurement-Driven</option>
                  <option value="Warm, Partnership-Oriented">Warm, Partnership-Oriented</option>
                </select>
              </div>

              {/* Cadence Preview Box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Cadence Flow Preview
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {formData.channels.includes('Personalized Email') && formData.channels.includes('AI Voice Call')
                    ? 'Day 1: Tailored value prop email ➔ Day 3: Autonomous voice discovery call ➔ Day 5: Case study & booking follow-up.'
                    : formData.channels.includes('AI Voice Call')
                    ? 'Immediate: Autonomous outbound voice agent qualification call.'
                    : 'Day 1: Pain-point alignment email ➔ Day 4: Case study follow-up email.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-sm shadow-indigo-200 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {creating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Deploy Campaign</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ENROLLED LEADS PREVIEW MODAL */}
      {selectedLeadsCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  Targeted Accounts
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Leads Enrolled in &apos;{selectedLeadsCampaign.name}&apos;
                </h3>
              </div>
              <button
                onClick={() => setSelectedLeadsCampaign(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto divide-y divide-slate-100 my-4 flex-1">
              {leads.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  No leads found in database. Discover leads via Radar Scanner first.
                </div>
              ) : (
                leads.map((lead) => (
                  <div key={lead.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{lead.company_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({lead.domain})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {lead.signals_summary?.[0] || lead.matched_offering}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Contact: {lead.primary_contact?.name || 'Buyer'} ({lead.primary_contact?.email || 'N/A'})
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          lead.status === 'Email_Sent'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : lead.status === 'Meeting_Booked'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {lead.status.replace('_', ' ')}
                      </span>

                      <Link
                        href={`/leads?search=${encodeURIComponent(lead.company_name)}`}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View Full Dossier"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Total matching leads: <strong>{leads.length}</strong>
              </span>
              <button
                onClick={() => setSelectedLeadsCampaign(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
