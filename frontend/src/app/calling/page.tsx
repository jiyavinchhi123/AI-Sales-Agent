'use client';

import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  PhoneOff,
  Mic,
  Send,
  Sparkles,
  ShieldAlert,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { CallSession, Lead } from '@/lib/types';

export default function AICallingPage() {
  const [sessions, setSessions] = useState<CallSession[]>([]);
  const [activeSession, setActiveSession] = useState<CallSession | null>(null);
  const [prospectInput, setProspectInput] = useState('');
  const [loadingStep, setLoadingStep] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    api.getCallSessions().then((data) => {
      setSessions(data);
      if (data.length > 0) setActiveSession(data[0]);
    });
    api.getLeads().then(setLeads);
  }, []);

  const handleStartCall = async (leadId: string) => {
    try {
      const newSession = await api.startCall(leadId);
      setSessions((prev) => [newSession, ...prev]);
      setActiveSession(newSession);
    } catch (err) {
      console.error('Failed to start call:', err);
    }
  };

  const handleSendResponse = async () => {
    if (!activeSession || !prospectInput.trim()) return;
    setLoadingStep(true);
    try {
      const updated = await api.stepCall(activeSession.id, prospectInput);
      setActiveSession(updated);
      setSessions((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
      setProspectInput('');
    } catch (err) {
      console.error('Failed step:', err);
    } finally {
      setLoadingStep(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <PhoneCall className="w-6 h-6 text-indigo-600" />
            <span>AI Calling & Objection Handling Console</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Turn-by-turn AI sales outreach simulation, real-time objection battlecards, sentiment extraction, and meeting conversion.
          </p>
        </div>
      </div>

      {/* Main Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Call History & Lead Launcher (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Launch Call on Leads */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Launch Outreach to Lead</span>
            </div>
            <div className="space-y-2">
              {leads.slice(0, 3).map((lead) => (
                <div
                  key={lead.id}
                  className="p-2.5 rounded-lg border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-all text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{lead.company_name}</div>
                    <div className="text-[11px] text-slate-500">{lead.primary_contact?.name}</div>
                  </div>
                  <button
                    onClick={() => handleStartCall(lead.id)}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium flex items-center gap-1 shadow-2xs"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>Call</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Past Sessions List */}
          <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs">
            <div className="p-3.5 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
              Active & Recent Calls ({sessions.length})
            </div>
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {sessions.map((s) => {
                const isSelected = activeSession?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setActiveSession(s)}
                    className={`p-3.5 cursor-pointer text-xs transition-all ${
                      isSelected ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{s.company_name}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {s.duration_seconds}s
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{s.contact_name}</div>
                    <div className="text-indigo-600 text-[11px] font-medium mt-1">
                      {s.insights?.qualification_verdict || s.status}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Transcript & Battlecards (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {activeSession ? (
            <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs space-y-6">
              {/* Call Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    Live Dialogue Simulation
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                    {activeSession.company_name} — {activeSession.contact_name} ({activeSession.contact_title})
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                    Status: {activeSession.status}
                  </span>
                </div>
              </div>

              {/* Transcript Chat Window */}
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2">
                {activeSession.turns.map((t) => {
                  const isAI = t.speaker === 'ai';
                  return (
                    <div
                      key={t.id}
                      className={`flex flex-col ${isAI ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-1">
                        <span>{isAI ? 'AI Sales Agent (Alex)' : activeSession.contact_name}</span>
                        <span>•</span>
                        <span>+{t.timestamp_offset_seconds}s</span>
                      </div>
                      <div
                        className={`p-3.5 rounded-2xl max-w-xl text-xs leading-relaxed ${
                          isAI
                            ? 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/80'
                            : 'bg-indigo-600 text-white rounded-tr-none shadow-xs'
                        }`}
                      >
                        {t.text}
                      </div>
                      {t.objection_detected && (
                        <div className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 mt-1">
                          Objection Detected: {t.objection_detected}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Simulation Response Input & Quick Objections */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Quick Objections for Demo:
                  </span>
                  <button
                    onClick={() =>
                      setProspectInput(
                        "We already use AWS native tools like Security Hub, why do we need this?"
                      )
                    }
                    className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-all"
                  >
                    Competitor/Native
                  </button>
                  <button
                    onClick={() =>
                      setProspectInput("Our budget is completely frozen until next fiscal quarter.")
                    }
                    className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-all"
                  >
                    Budget Freeze
                  </button>
                  <button
                    onClick={() =>
                      setProspectInput(
                        "That sounds promising. Can we schedule a 25-minute technical demo this Thursday?"
                      )
                    }
                    className="text-[11px] px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded transition-all font-medium"
                  >
                    Agree to Demo
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type prospect response to test AI objection handling..."
                    value={prospectInput}
                    onChange={(e) => setProspectInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendResponse()}
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleSendResponse}
                    disabled={loadingStep || !prospectInput.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{loadingStep ? 'Responding...' : 'Simulate Response'}</span>
                  </button>
                </div>
              </div>

              {/* Insights & Battlecards */}
              {activeSession.insights && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Automated Conversation Insights</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {activeSession.insights.summary}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 text-[11px]">
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-slate-400 block">Interest:</span>
                      <span className="font-bold text-slate-800">{activeSession.insights.interest_level}</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-slate-400 block">Sentiment:</span>
                      <span className="font-bold text-slate-800">{activeSession.insights.sentiment_overall}</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-slate-400 block">Timeline:</span>
                      <span className="font-bold text-slate-800">{activeSession.insights.timeline_indicator || 'Immediate'}</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-slate-400 block">Verdict:</span>
                      <span className="font-bold text-indigo-700">{activeSession.insights.qualification_verdict}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
              Select or launch a call session
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
