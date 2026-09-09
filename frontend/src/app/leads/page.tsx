'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, PhoneCall, Award, Sparkles, CheckCircle2, ChevronRight, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { Lead } from '@/lib/types';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getLeads().then((data) => {
      setLeads(data);
      if (data.length > 0) setSelectedLead(data[0]);
    });
  }, []);

  const filtered = leads.filter((l) =>
    l.company_name.toLowerCase().includes(search.toLowerCase()) ||
    l.domain.toLowerCase().includes(search.toLowerCase())
  );

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
            Enriched firmographics, decision-makers, AI product matching, and intent score breakdown (0-100).
          </p>
        </div>
      </div>

      {/* Main Split View: Lead List & Dossier Drawer */}
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
                placeholder="Filter leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs w-48 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="divide-y divide-slate-100">
              {filtered.map((lead) => {
                const isSelected = selectedLead?.id === lead.id;
                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`p-4 cursor-pointer transition-all flex items-center justify-between ${
                      isSelected ? 'bg-indigo-50/60 border-l-4 border-indigo-600' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{lead.company_name}</span>
                        <span className="text-xs text-slate-400 font-mono">({lead.domain})</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {lead.industry} • {lead.employee_count} employees • {lead.estimated_revenue}
                      </div>
                      <div className="text-xs text-indigo-700 font-medium mt-1">
                        Match: {lead.match?.product_name || 'Calculating...'}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Grade {lead.intent?.grade} ({lead.intent?.overall_score})
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">{lead.status}</div>
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
                    Intent Score: {selectedLead.intent?.overall_score}/100 (Grade {selectedLead.intent?.grade})
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedLead.company_name}</h2>
                <div className="text-xs text-indigo-600 font-medium">{selectedLead.domain}</div>
              </div>

              {/* Product Match Card */}
              <div className="bg-indigo-50/60 rounded-xl p-4 border border-indigo-100/90">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>AI Offering Match ({selectedLead.match?.fit_score}% Fit)</span>
                </div>
                <div className="text-sm font-bold text-slate-900">{selectedLead.match?.product_name}</div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{selectedLead.match?.reasoning}</p>
                <div className="text-xs font-medium text-indigo-700 mt-2 italic">
                  "{selectedLead.match?.suggested_pitch}"
                </div>
              </div>

              {/* Decision Maker */}
              {selectedLead.primary_contact && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Key Decision Maker
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                    <div className="text-xs font-bold text-slate-900">{selectedLead.primary_contact.name}</div>
                    <div className="text-xs text-slate-500">{selectedLead.primary_contact.title}</div>
                    <div className="text-xs text-indigo-600 mt-1 font-mono">{selectedLead.primary_contact.email}</div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <Link
                  href="/calling"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-200 transition-all"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Simulate AI Call</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
              Select a lead to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
