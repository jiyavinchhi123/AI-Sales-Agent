'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  PhoneCall,
  Sparkles,
  ChevronRight,
  Radar,
  ArrowRight,
  Mail,
  Download,
  Send,
  Copy,
  Check,
  X,
  RefreshCw,
  ShieldCheck,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Lead, EmailDraftResponse, StructuredBusinessProfile } from '@/lib/types';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [businessProfile, setBusinessProfile] = useState<StructuredBusinessProfile | null>(null);

  // Email Outreach Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState<EmailDraftResponse | null>(null);
  const [emailTone, setEmailTone] = useState<'direct' | 'consultative' | 'executive'>('direct');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; real_sent?: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchLeads();
    api.getStructuredBusinessProfile().then((data) => {
      if (data) setBusinessProfile(data);
    });
  }, []);

  const fetchLeads = async () => {
    try {
      const data = await api.getLeads();
      setLeads(data);
      if (data.length > 0 && !selectedLead) {
        // Prioritize JiyaCraftHub if present for prominent demo visibility
        const jiyaLead = data.find((l) => l.company_name.toLowerCase().includes('jiyacrafthub'));
        setSelectedLead(jiyaLead || data[0]);
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = leads.filter(
    (l) =>
      l.company_name.toLowerCase().includes(search.toLowerCase()) ||
      l.domain.toLowerCase().includes(search.toLowerCase()) ||
      l.industry.toLowerCase().includes(search.toLowerCase())
  );

  // Open Email Outreach Modal
  const handleOpenEmailModal = async (tone: 'direct' | 'consultative' | 'executive' = 'direct') => {
    if (!selectedLead) return;
    setIsEmailModalOpen(true);
    setEmailSentSuccess(false);
    setSendResult(null);
    setEmailTone(tone);
    setLoadingDraft(true);

    try {
      const draft = await api.getEmailDraft(selectedLead.id, tone);
      setEmailDraft(draft);
      setEmailSubject(draft.subject);
      setEmailBody(draft.body);
    } catch (err) {
      console.error('Failed to generate draft:', err);
    } finally {
      setLoadingDraft(false);
    }
  };

  // Tone Switch
  const handleToneChange = async (tone: 'direct' | 'consultative' | 'executive') => {
    if (!selectedLead) return;
    setEmailTone(tone);
    setLoadingDraft(true);
    try {
      const draft = await api.getEmailDraft(selectedLead.id, tone);
      setEmailDraft(draft);
      setEmailSubject(draft.subject);
      setEmailBody(draft.body);
    } catch (err) {
      console.error('Failed to switch tone:', err);
    } finally {
      setLoadingDraft(false);
    }
  };

  // Send Email (Dispatches directly via SMTP or records in CRM)
  const handleSendEmail = async () => {
    if (!selectedLead || !emailDraft) return;
    setSendingEmail(true);
    setSendResult(null);

    try {
      const res = await api.sendLeadEmail(selectedLead.id, {
        recipient_email: emailDraft.recipient_email,
        recipient_name: emailDraft.recipient_name,
        subject: emailSubject,
        body: emailBody,
        method: 'AI Direct Dispatch',
      });

      setSendResult(res);
      setEmailSentSuccess(true);
      // Update local state
      const updated = { ...selectedLead, status: 'Email_Sent' };
      setSelectedLead(updated);
      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? updated : l)));
    } catch (err: any) {
      console.error('Failed to send email:', err);
      setSendResult({ success: false, message: err.message || 'Email dispatch failed.' });
    } finally {
      setSendingEmail(false);
    }
  };

  // Copy to clipboard
  const handleCopyEmail = () => {
    const fullText = `To: ${emailDraft?.recipient_email}\nSubject: ${emailSubject}\n\n${emailBody}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  // Export Leads to CSV
  const handleExportCSV = () => {
    if (leads.length === 0) return;
    const headers = [
      'Company Name',
      'Domain',
      'Industry',
      'Contact Name',
      'Contact Email',
      'Matched Offering',
      'Intent Score',
      'Status',
    ];
    const rows = leads.map((l) => [
      `"${l.company_name}"`,
      `"${l.domain}"`,
      `"${l.industry}"`,
      `"${l.primary_contact?.name || ''}"`,
      `"${l.primary_contact?.email || ''}"`,
      `"${l.match?.product_name || l.matched_offering || ''}"`,
      `"${l.intent?.overall_score || 90}"`,
      `"${l.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ai_sales_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Enriched Leads & Intent Scores</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enriched firmographics, decision-makers, AI product matching, and autonomous outreach.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition-all"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <Link
            href="/discovery"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-200 transition-all"
          >
            <Radar className="w-3.5 h-3.5" />
            <span>Discover New Leads</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      {leads.length === 0 && !loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Leads in Pipeline Yet</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Your lead pipeline is clean. Discover verified buying requirements matching your business profile and convert
            them directly into scored leads.
          </p>
          <div className="mt-6">
            <Link
              href="/discovery"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-200 transition-all"
            >
              <span>Discover Buying Requirements</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        /* Main Split View: Lead List & Dossier Drawer */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Lead List Table (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  All Enriched Leads ({filtered.length})
                </div>
                <input
                  type="text"
                  placeholder="Filter by company, domain, or industry..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs w-60 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="divide-y divide-slate-100">
                {filtered.map((lead) => {
                  const isSelected = selectedLead?.id === lead.id;
                  const isDemoLead =
                    lead.company_name.toLowerCase().includes('jiyacrafthub') ||
                    lead.domain.toLowerCase().includes('jiyacrafthub');

                  return (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className={`p-4 flex items-center justify-between gap-4 cursor-pointer transition-all ${
                        isSelected ? 'bg-indigo-50/60 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{lead.company_name}</span>
                          <span className="text-xs text-slate-400 font-mono">({lead.domain})</span>
                          {isDemoLead && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Safe Demo Lead
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          {lead.industry} • {lead.location}
                        </div>
                        <div className="text-xs text-indigo-700 font-medium">
                          Offering: {lead.match?.product_name || lead.matched_offering || 'Enterprise Solution'}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-900">
                            {lead.intent?.overall_score || 90}/100
                          </div>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              lead.status === 'Email_Sent'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : lead.status === 'Meeting_Booked'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {lead.status.replace('_', ' ')}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Lead Dossier Detail (5 cols) */}
          <div className="lg:col-span-5">
            {selectedLead ? (
              <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs space-y-6 sticky top-24">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Lead Intelligence Dossier
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Intent Score: {selectedLead.intent?.overall_score || 90}/100 (Grade{' '}
                      {selectedLead.intent?.grade || 'A'})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <h2 className="text-xl font-bold text-slate-900">{selectedLead.company_name}</h2>
                    {selectedLead.company_name.toLowerCase().includes('jiyacrafthub') && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ⭐ Verified Safe Demo
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-indigo-600 font-medium">{selectedLead.domain}</div>
                </div>

                {/* Product Match Card */}
                <div className="bg-indigo-50/60 rounded-xl p-4 border border-indigo-100/90">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>AI Offering Match ({selectedLead.match?.fit_score || 90}% Fit)</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {selectedLead.match?.product_name || selectedLead.matched_offering || 'Enterprise Solution'}
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{selectedLead.match?.reasoning}</p>
                  {selectedLead.match?.suggested_pitch && (
                    <div className="text-xs font-medium text-indigo-700 mt-2 italic">
                      &ldquo;{selectedLead.match.suggested_pitch}&rdquo;
                    </div>
                  )}
                </div>

                {/* Decision Maker */}
                {selectedLead.primary_contact && (
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Key Decision Maker
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-900">{selectedLead.primary_contact.name}</div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200/60 text-slate-700">
                          {selectedLead.primary_contact.role_level}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{selectedLead.primary_contact.title}</div>
                      <div className="text-xs text-indigo-600 mt-1 font-mono font-medium flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-indigo-500" />
                        <span>{selectedLead.primary_contact.email}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Outreach Action Buttons */}
                <div className="pt-4 border-t border-slate-100 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => handleOpenEmailModal('direct')}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-200 transition-all"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Send AI Email</span>
                    </button>

                    <Link
                      href="/calling"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition-all"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Simulate AI Call</span>
                    </Link>
                  </div>

                  {selectedLead.status === 'Email_Sent' && (
                    <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-lg flex items-center gap-2 text-xs text-sky-800">
                      <CheckCircle2 className="w-4 h-4 text-sky-600 flex-shrink-0" />
                      <span>Cold outreach email dispatched and logged in CRM history.</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                Select a lead to view details
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Email Outreach Modal */}
      {isEmailModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>AI Cold Outreach Generator</span>
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                    <span>
                      Sender:{' '}
                      <strong className="text-slate-800 font-mono">
                        {businessProfile?.sender_email || 'Dynamic Business Email'}
                      </strong>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>
                      Lead Recipient:{' '}
                      <strong className="text-slate-800">{emailDraft?.recipient_name}</strong> &lt;
                      <span className="font-mono text-indigo-600 font-bold">{emailDraft?.recipient_email}</span>&gt;
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Safe Demo Mode Notice */}
            {emailDraft?.recipient_email === 'jiyacrafthub@gmail.com' && (
              <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  <strong>Default Testing Lead:</strong> All AI outreach tests are safely routed to{' '}
                  <code className="font-bold font-mono">jiyacrafthub@gmail.com</code> sent dynamically from your business address{' '}
                  <strong className="font-mono text-emerald-950">
                    {businessProfile?.sender_email || 'your business email'}
                  </strong>.
                </span>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Tone Switcher */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Outreach Angle & Tone
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleToneChange('direct')}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      emailTone === 'direct'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    ⚡ High-Conversion Direct
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToneChange('consultative')}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      emailTone === 'consultative'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    💼 Consultative Technical
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToneChange('executive')}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      emailTone === 'executive'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    🤝 Executive Value
                  </button>
                </div>
              </div>

              {loadingDraft ? (
                <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Generating tailored outreach pitch...</span>
                </div>
              ) : (
                <>
                  {/* Subject Line */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Subject Line</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Body Textarea */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">Email Pitch</label>
                      <span className="text-[11px] text-slate-400">Fully editable</span>
                    </div>
                    <textarea
                      rows={10}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-sans text-slate-800 leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}

              {/* Dispatch Feedback Alert */}
              {sendResult && (
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                    sendResult.real_sent
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : sendResult.success
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-950'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <CheckCircle2
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      sendResult.real_sent
                        ? 'text-emerald-600'
                        : sendResult.success
                        ? 'text-indigo-600'
                        : 'text-rose-600'
                    }`}
                  />
                  <div className="space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      {sendResult.real_sent ? (
                        <span>🎉 REAL EMAIL DELIVERED DIRECTLY TO INBOX!</span>
                      ) : (
                        <span>Outbound Outreach Dispatched & Recorded</span>
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed">{sendResult.message}</p>
                    {!sendResult.real_sent && (
                      <Link
                        href="/business"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 hover:underline pt-0.5"
                      >
                        <span>Configure Gmail App Password in Business Profile for automated delivery ➔</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Pitch'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Close
                </button>

                <button
                  type="button"
                  disabled={sendingEmail || loadingDraft}
                  onClick={handleSendEmail}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-200 transition-all cursor-pointer"
                >
                  {sendingEmail ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Dispatching Email...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Direct Send AI Email</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
