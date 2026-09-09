'use client';

import React, { useState, useEffect } from 'react';
import { Radar, Sparkles, Filter, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { BuyingSignal } from '@/lib/types';

export default function LeadDiscoveryPage() {
  const [signals, setSignals] = useState<BuyingSignal[]>([]);
  const [scanning, setScanning] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  useEffect(() => {
    api.getSignals().then(setSignals);
  }, []);

  const handleScan = async () => {
    setScanning(true);
    try {
      const newSigs = await api.scanSignals();
      setSignals((prev) => [...newSigs, ...prev]);
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setScanning(false);
    }
  };

  const handleConvert = async (signalId: string) => {
    setConvertingId(signalId);
    try {
      await api.convertSignalToLead(signalId);
      setSignals((prev) =>
        prev.map((s) => (s.id === signalId ? { ...s, processed: true } : s))
      );
    } catch (err) {
      console.error('Convert error:', err);
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Radar className="w-6 h-6 text-indigo-600" />
            <span>Buying Signal Discovery</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Detects high-intent market triggers (funding, hiring surges, compliance deadlines, tech changes) and qualifies buyer urgency.
          </p>
        </div>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-200 transition-all"
        >
          <Sparkles className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
          <span>{scanning ? 'Scanning Market Sources...' : 'Trigger AI Signal Scan'}</span>
        </button>
      </div>

      {/* Signals Feed */}
      <div className="space-y-4">
        {signals.map((sig) => (
          <div
            key={sig.id}
            className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-indigo-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-sm font-bold text-slate-900">{sig.company_name}</span>
                <span className="text-xs text-slate-400 font-mono">({sig.domain})</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  sig.urgency_score >= 90
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  Urgency {sig.urgency_score}/100 • {sig.signal_type.replace('_', ' ')}
                </span>
                <span className="text-[11px] text-slate-400">
                  Confidence: {Math.round(sig.confidence_score * 100)}%
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-800">{sig.title}</div>
              <p className="text-xs text-slate-600 leading-relaxed">{sig.summary}</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                <span>Source: {sig.source}</span>
                <span>•</span>
                <span>Detected: {new Date(sig.detected_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              {sig.processed ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Lead Created</span>
                </span>
              ) : (
                <button
                  onClick={() => handleConvert(sig.id)}
                  disabled={convertingId === sig.id}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs transition-all"
                >
                  <span>{convertingId === sig.id ? 'Enriching...' : 'Enrich & Match Lead'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
