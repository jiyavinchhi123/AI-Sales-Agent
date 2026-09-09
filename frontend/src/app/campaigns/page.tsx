'use client';

import React, { useState, useEffect } from 'react';
import { Send, Plus, Users, PhoneCall, Mail, CheckCircle, ArrowUpRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Campaign } from '@/lib/types';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    api.getCampaigns().then(setCampaigns);
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Send className="w-6 h-6 text-indigo-600" />
            <span>Outbound AI Campaigns</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated multi-channel cadences (AI voice calls, hyper-personalized emails) targeted by buying signals.
          </p>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.map((camp) => (
          <div
            key={camp.id}
            className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {camp.status}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Created {new Date(camp.created_at).toLocaleDateString()}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900">{camp.name}</h2>
              <p className="text-xs text-slate-600 mt-1">{camp.description}</p>

              <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200/60 text-xs">
                <span className="font-semibold text-slate-700">Target Criteria: </span>
                <span className="text-slate-500">{camp.target_criteria}</span>
              </div>

              {/* Channels */}
              <div className="flex items-center gap-2 mt-4">
                {camp.channels.map((ch, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200"
                  >
                    {ch}
                  </span>
                ))}
              </div>
            </div>

            {/* Performance Stats */}
            <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-xs text-slate-400">Leads</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{camp.total_leads}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Contacted</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{camp.contacted_count}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Meetings</div>
                <div className="text-sm font-bold text-emerald-600 mt-0.5">{camp.scheduled_meetings}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Response</div>
                <div className="text-sm font-bold text-indigo-600 mt-0.5">{camp.response_rate}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
