'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  UserCheck,
  Calendar,
  Layers,
  FileText,
} from 'lucide-react';
import { api } from '@/lib/api';
import { CallSession, Lead, StructuredBusinessProfile } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

export default function AICallingPage() {
  const [sessions, setSessions] = useState<CallSession[]>([]);
  const [activeSession, setActiveSession] = useState<CallSession | null>(null);
  const [prospectInput, setProspectInput] = useState('');
  const [loadingStep, setLoadingStep] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sellerProfile, setSellerProfile] = useState<StructuredBusinessProfile | null>(null);

  // Audio & Voice State
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Check Web Speech API Support on Client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        setSpeechSupported(true);
      }
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setRecognitionSupported(true);
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = 'en-US';

        recog.onresult = (event: any) => {
          const spokenText = event.results[0][0].transcript;
          setProspectInput(spokenText);
          setIsListening(false);
        };

        recog.onerror = () => {
          setIsListening(false);
        };

        recog.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recog;
      }
    }
  }, []);

  // Load Sessions, Leads, and Profile on Mount
  useEffect(() => {
    api.getCallSessions().then((data) => {
      setSessions(data);
      if (data.length > 0) setActiveSession(data[0]);
    });
    api.getLeads().then((data) => {
      setLeads(data);
    });
    api.getStructuredBusinessProfile().then((profile) => {
      setSellerProfile(profile);
    });
  }, []);

  // Auto-scroll transcript when turns change
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeSession?.turns]);

  // Speak AI Turn via Browser TTS
  const speakAITurn = (text: string) => {
    if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  };

  // Toggle Microphone Listening
  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Speech recognition error:', err);
      }
    }
  };

  // Start Call on Lead
  const handleStartCall = async (leadId: string) => {
    try {
      const newSession = await api.startCall(leadId);
      setSessions((prev) => [newSession, ...prev.filter((s) => s.id !== newSession.id)]);
      setActiveSession(newSession);

      // Speak opening greeting
      if (newSession.turns && newSession.turns.length > 0) {
        speakAITurn(newSession.turns[0].text);
      }
    } catch (err) {
      console.error('Failed to start call:', err);
    }
  };

  // Send Prospect Step Response
  const handleSendResponse = async (customText?: string) => {
    const textToSend = (customText !== undefined ? customText : prospectInput).trim();
    if (!activeSession || !textToSend) return;

    setLoadingStep(true);
    try {
      const updated = await api.stepCall(activeSession.id, textToSend);
      setActiveSession(updated);
      setSessions((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
      setProspectInput('');

      // Speak latest AI turn
      const lastTurn = updated.turns[updated.turns.length - 1];
      if (lastTurn && lastTurn.speaker === 'ai') {
        speakAITurn(lastTurn.text);
      }
    } catch (err) {
      console.error('Failed step:', err);
    } finally {
      setLoadingStep(false);
    }
  };

  // End Call & Commit BANT Summary
  const handleEndCall = async () => {
    if (!activeSession) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    try {
      const finalized = await api.endCall(activeSession.id);
      setActiveSession(finalized);
      setSessions((prev) =>
        prev.map((s) => (s.id === finalized.id ? finalized : s))
      );
    } catch (err) {
      console.error('Failed to end call:', err);
    }
  };

  // Dynamic quick responses tailored to qualification dialogue
  const currentStage = activeSession?.stage || 'greeting';
  const lastAITurn =
    activeSession?.turns
      ?.slice()
      ?.reverse()
      ?.find((t) => t.speaker === 'ai') || null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <PhoneCall className="w-6 h-6 text-indigo-600" />
            <span>AI Calling & Sales Qualification Console</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browser-based AI voice agent: turn-by-turn BANT qualification, real-time objection handling, and automated meeting scheduling.
          </p>
        </div>

        {/* Audio Mode Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Browser Voice Engine: Ready (TTS & Speech Recognition)</span>
          </div>
        </div>
      </div>

      {/* Main Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Lead Launcher & Call Sessions (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Launch on Active Pipeline Leads */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Launch Outreach to Pipeline Leads</span>
            </div>

            {leads.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No active leads in pipeline. Discover leads in Step 3 to launch calls.
              </div>
            ) : (
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-3 rounded-xl border border-slate-200/80 hover:border-indigo-300 flex items-center justify-between hover:bg-slate-50/80 transition-all text-xs gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{lead.company_name}</div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {lead.matched_offering || lead.industry || 'Technology'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleStartCall(lead.id)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs shrink-0 transition-all text-xs"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>Call</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past & Active Call Sessions History */}
          <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs">
            <div className="p-3.5 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Call Sessions ({sessions.length})</span>
            </div>
            <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
              {sessions.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No call sessions recorded yet.
                </div>
              ) : (
                sessions.map((s) => {
                  const isSelected = activeSession?.id === s.id;
                  const isFinished = s.status === 'Completed';

                  return (
                    <div
                      key={s.id}
                      onClick={() => setActiveSession(s)}
                      className={`p-3.5 cursor-pointer text-xs transition-all ${
                        isSelected
                          ? 'bg-indigo-50/90 border-l-4 border-indigo-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 truncate">{s.company_name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isFinished
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                          }`}
                        >
                          {isFinished ? 'Completed' : '● Live Call'}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-1">
                        Contact: {s.contact_name} ({s.contact_title})
                      </div>
                      {s.insights?.need && s.insights.need !== 'Not available' && (
                        <div className="text-indigo-700 font-medium text-[11px] mt-1 truncate">
                          Need: {s.insights.need}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Call Screen / Post-Call Summary (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {activeSession ? (
            <div className="space-y-6">
              {/* SPECIFICATION UI: Call Screen Box */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 relative overflow-hidden">
                {/* Top Status Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg overflow-hidden border border-indigo-100 shadow-xs bg-white shrink-0">
                      <img src="/logo.png" alt="AI Sales Agent" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs font-bold tracking-widest uppercase text-slate-600">
                      AI SALES AGENT
                    </span>
                  </div>

                  {/* Connected Status Indicator */}
                  {activeSession.status !== 'Completed' ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 text-xs font-bold">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>● CALL CONNECTED</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>CALL COMPLETED</span>
                    </div>
                  )}
                </div>

                {/* Main Call Subject / Current Turn Banner */}
                <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-6 text-center space-y-3">
                  <div className="flex justify-center">
                    <div className="relative w-16 h-16 rounded-2xl p-1 bg-white shadow-md border border-indigo-100 flex items-center justify-center">
                      <img src="/logo.png" alt="AI Agent Voice" className="w-full h-full object-cover rounded-xl" />
                      {activeSession.status !== 'Completed' && (
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    AI Sales Agent Speaking
                  </div>
                  <div className="text-base sm:text-lg font-medium text-slate-800 leading-relaxed max-w-2xl mx-auto">
                    &ldquo;{lastAITurn?.text || 'Connecting call...'}&rdquo;
                  </div>

                  {/* Listening Indicator */}
                  {activeSession.status !== 'Completed' && (
                    <div className="pt-2 flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                      </span>
                      <span>🎙 {isListening ? 'Listening to your microphone...' : 'Awaiting Prospect Response...'}</span>
                    </div>
                  )}
                </div>

                {/* Call Action Bar: Mute / End Call / Voice controls */}
                {activeSession.status !== 'Completed' && (
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsMuted((prev) => !prev)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                        isMuted
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs'
                      }`}
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span>{isMuted ? 'Muted (Audio Off)' : 'Mute Voice'}</span>
                    </button>

                    {recognitionSupported && (
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                          isListening
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs'
                        }`}
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>{isListening ? 'Stop Mic' : 'Speak via Mic'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleEndCall}
                      className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-200 transition-all"
                    >
                      <PhoneOff className="w-3.5 h-3.5" />
                      <span>End Call</span>
                    </button>
                  </div>
                )}

                {/* Turn-by-Turn Conversation Quick Buttons (Demo Script Alignment) */}
                {activeSession.status !== 'Completed' && (
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Quick Unpredictable Prospect Responses:
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Click any response to test dynamic AI reasoning
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {/* User's exact test cases */}
                      <button
                        type="button"
                        onClick={() => handleSendResponse('What is your GST registration number?')}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition-all"
                      >
                        &ldquo;What is your GST registration number?&rdquo;
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendResponse('Where is your factory located?')}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition-all"
                      >
                        &ldquo;Where is your factory located?&rdquo;
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendResponse('Khambhalia')}
                        className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-semibold transition-all"
                      >
                        &ldquo;Khambhalia&rdquo;
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendResponse('I need cotton bandhani suits. are you selling it')}
                        className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-all"
                      >
                        &ldquo;I need cotton bandhani suits. are you selling it&rdquo;
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendResponse('Send it to jiyacrafthub@gmail.com')}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-all"
                      >
                        &ldquo;Send it to jiyacrafthub@gmail.com&rdquo;
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendResponse('i want to see you products is it available on online site')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-all"
                      >
                        &ldquo;i want to see you products is it available on online site&rdquo;
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendResponse('What products do you offer?')}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-all"
                      >
                        [Ask: Products]
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendResponse('What is your website?')}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-all"
                      >
                        [Ask: Website]
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendResponse('Where is your factory located?')}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-all"
                      >
                        [Ask: Factory Location]
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendResponse('What is your wholesale pricing and MOQ?')}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-all"
                      >
                        [Ask: Pricing & MOQ]
                      </button>

                      {/* 3. Unknown question (AI must say unavailable instead of inventing) */}
                      <button
                        type="button"
                        onClick={() => handleSendResponse('What is your GST registration number?')}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-medium transition-all"
                      >
                        [Test: Unknown Question]
                      </button>

                      {/* 4. New Volume & Timeline */}
                      <button
                        type="button"
                        onClick={() => handleSendResponse('We need 400 pieces delivered by next month.')}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-all"
                      >
                        &ldquo;400 pieces by next month&rdquo;
                      </button>

                      {/* 5. Correction / Confusion handling */}
                      <button
                        type="button"
                        onClick={() => handleSendResponse("You're not getting what I'm telling.")}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs transition-all"
                      >
                        [Test: Correction / Misunderstanding]
                      </button>

                      {/* 6. Opt Out */}
                      <button
                        type="button"
                        onClick={() => handleSendResponse('I am not interested, please remove me.')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs transition-all"
                      >
                        [Test: Not Interested]
                      </button>
                    </div>

                    {/* Manual Type Box Fallback */}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Type prospect response or speak with microphone..."
                        value={prospectInput}
                        onChange={(e) => setProspectInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendResponse()}
                        className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleSendResponse()}
                        disabled={loadingStep || !prospectInput.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-all shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{loadingStep ? 'Responding...' : 'Send'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* POST-CALL SUMMARY CARD (Shown upon completion or end call) */}
              {activeSession.insights && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                  {/* Summary Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <div className="text-xs font-bold tracking-widest uppercase text-slate-400">
                        CALL SUMMARY
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                        {activeSession.company_name} — Qualification Verdict
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 text-xs font-bold uppercase tracking-wider">
                        {activeSession.insights.qualification_verdict || 'INTERESTED'}
                      </span>
                    </div>
                  </div>

                  {/* BANT Qualification Metric Badges */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                        Intent Score
                      </span>
                      <span className="text-lg font-bold text-indigo-700 mt-0.5 block">
                        {activeSession.insights.intent_score || 94}/100
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                        Need
                      </span>
                      <span className="text-xs font-bold text-slate-900 mt-1 block truncate">
                        {activeSession.insights.need || 'SharePoint Migration'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                        Users / Scope
                      </span>
                      <span className="text-xs font-bold text-slate-900 mt-1 block">
                        {activeSession.insights.scope_users || '500 users'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                        Timeline
                      </span>
                      <span className="text-xs font-bold text-slate-900 mt-1 block">
                        {activeSession.insights.timeline || 'Within 2 months'}
                      </span>
                    </div>
                  </div>

                  {/* Additional Qualification Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                      <div className="font-bold text-slate-700">Budget Status:</div>
                      <div className="text-slate-600 font-mono">
                        {activeSession.insights.budget || 'Not disclosed'}
                      </div>
                    </div>

                    <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1.5">
                      <div className="font-bold text-emerald-900">Next Best Action:</div>
                      <div className="text-emerald-800 font-semibold flex items-center gap-1.5">
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{activeSession.insights.next_best_action || 'Schedule technical discussion'}</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Call Overview Note */}
                  <div className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200/80 leading-relaxed">
                    <strong className="text-slate-800">AI Call Summary: </strong>
                    {activeSession.insights.summary}
                  </div>
                </div>
              )}

              {/* Complete Turn-by-Turn Conversation Transcript */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Complete Conversation Transcript ({activeSession.turns.length} Turns)</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Duration: {activeSession.duration_seconds}s
                  </span>
                </div>

                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2 pt-1">
                  {activeSession.turns.map((t, index) => {
                    const isAI = t.speaker === 'ai';
                    return (
                      <div
                        key={t.id || index}
                        className={`flex flex-col ${isAI ? 'items-start' : 'items-end'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                          {isAI && (
                            <div className="w-4 h-4 rounded-full overflow-hidden border border-indigo-200 shrink-0">
                              <img src="/logo.png" alt="AI" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <span>{isAI ? 'AI Sales Agent' : activeSession.contact_name}</span>
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
                      </div>
                    );
                  })}
                  <div ref={transcriptEndRef} />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50/50 border border-indigo-100 p-2 mx-auto mb-3 flex items-center justify-center shadow-xs">
                <img src="/logo.png" alt="AI Sales Agent" className="w-full h-full object-cover rounded-xl" />
              </div>
              <div className="font-bold text-slate-700 text-sm">No Call Session Selected</div>
              <div className="text-slate-500 mt-1">
                Select an active lead from the left column and click &ldquo;Call&rdquo; to begin a dynamic qualification demo.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
