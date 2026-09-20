'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  PhoneCall,
  Radar,
  Building2,
  CheckCircle2,
  Brain,
  Briefcase,
  Zap,
  Target,
  Clock,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { StructuredBusinessProfile } from '@/lib/types';

export default function LandingPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StructuredBusinessProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    api.getStructuredBusinessProfile()
      .then((data) => {
        if (data?.company_name) setProfile(data);
      })
      .catch(() => {});
  }, []);

  const companyName = profile?.company_name || 'Your Company';

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* 1. MINIMAL STICKY HEADER */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="AI Sales Agent" className="w-8 h-8 object-contain" />
            <span className="font-bold text-sm text-slate-900 tracking-tight">AI Sales Agent</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-500">
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How It Works</a>
            <a href="#ai-agent" className="hover:text-slate-900 transition-colors">Gemini Voice AI</a>
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
          </nav>

          {/* Action Button */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-2 text-xs font-semibold text-slate-700">
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-2">How It Works</a>
            <a href="#ai-agent" onClick={() => setMobileMenuOpen(false)} className="block py-2">Gemini Voice AI</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-2">Features</a>
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link href="/discovery" className="py-2 text-center rounded-lg bg-indigo-50 text-indigo-700">Discover Leads</Link>
              <Link href="/calling" className="py-2 text-center rounded-lg bg-indigo-600 text-white">Launch AI Call</Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="pt-8 pb-20 sm:pt-12 sm:pb-28 text-center px-4 sm:px-6 max-w-4xl mx-auto">
        {/* Video Showcase (First) */}
        <div className="mb-10 w-full rounded-2xl overflow-hidden shadow-2xl shadow-slate-200/80">
          <video
            src="/demo-video.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto block"
          />
        </div>

        {/* Center Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/logo.png"
            alt="AI Sales Agent Logo"
            className="w-44 h-44 sm:w-56 sm:h-56 object-contain hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
          <span>AI Sales Agent</span>
          <span className="text-indigo-300">•</span>
          <span>Signal to Opportunity</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
          Signal to Opportunity
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
          Discover the right prospects, understand their requirements, and turn buying signals into qualified sales opportunities.
        </p>

        {/* Dual CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href="/discovery"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all"
          >
            <Radar className="w-4 h-4" />
            <span>Discover Leads</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/calling"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 transition-all"
          >
            <PhoneCall className="w-4 h-4 text-indigo-600" />
            <span>Launch AI Call</span>
          </Link>
        </div>

        {/* The 3-Step Transformation Card (Shows what the product actually does in 5 seconds) */}
        <div className="mt-16 bg-slate-50 rounded-2xl border border-slate-200/80 p-6 sm:p-8 text-left shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs mb-1.5 uppercase tracking-wider">
                <Radar className="w-3.5 h-3.5" />
                <span>1. Public Buying Signal</span>
              </div>
              <div className="text-sm font-bold text-slate-900 mb-1">Apex Retailers</div>
              <p className="text-xs text-slate-500 leading-relaxed">
                "Seeking wholesale supplier for 300 units by next month."
              </p>
            </div>

            <div className="md:border-l md:border-slate-200 md:pl-6">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs mb-1.5 uppercase tracking-wider">
                <Brain className="w-3.5 h-3.5" />
                <span>2. Gemini Phone Call</span>
              </div>
              <div className="text-sm font-bold text-slate-900 mb-1">~1.4s Voice Turnaround</div>
              <p className="text-xs text-slate-500 leading-relaxed">
                AI calls the procurement head, answers questions, and confirms volume.
              </p>
            </div>

            <div className="md:border-l md:border-slate-200 md:pl-6">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs mb-1.5 uppercase tracking-wider">
                <Briefcase className="w-3.5 h-3.5" />
                <span>3. Qualified CRM Deal</span>
              </div>
              <div className="text-sm font-bold text-slate-900 mb-1">₹60,000 Opportunity</div>
              <p className="text-xs text-slate-500 leading-relaxed">
                BANT verified, transcript recorded, handed off to sales rep to close.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (Simple, Minimalist 3 Pillars) */}
      <section id="how-it-works" className="py-20 bg-slate-50/70 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">The Workflow</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              How It Works
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Three clear stages from raw market intent to closed sales deals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Discover & Match</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                AI continuously monitors public buying signals and pairs them directly with your catalog, pricing, and capabilities.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Qualify with Voice AI</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Google Gemini LLM conducts a genuine phone conversation, discovering volume, budget, and decision-maker requirements.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Deliver Opportunity</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every verified detail is stored into your CRM pipeline with full transcripts, so reps focus strictly on closing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. GEMINI CONVERSATIONAL BRAIN (Clean & Concrete) */}
      <section id="ai-agent" className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                <Brain className="w-4 h-4" />
                <span>Conversational Brain</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                Real Conversation, Not a Script
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Powered directly by Google Gemini LLM. It reads the full conversation history before every turn to qualify buyers naturally.
              </p>

              <div className="space-y-2.5 pt-1 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Never repeats questions</strong> already answered by the prospect.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Understands context:</strong> "300" means quantity; "budget is 60k" locks in price.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Fast ~1.4s response time</strong> with persistent HTTP connection pooling.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Answers unexpected questions</strong> strictly using your business profile.</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/calling"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 group"
                >
                  <span>Launch AI Calling Console</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Conversation Preview Box */}
            <div className="md:col-span-6 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-200/80">
                <span className="font-bold text-slate-800">Live Phone Call Preview</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  1.4s Response Speed
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="text-[10px] font-bold text-indigo-600 mb-0.5">AI Sales Agent</div>
                <div className="text-slate-700">"Hi Karan, this is Alex from {companyName}. I saw your wholesale inquiry for festive collections. Do you have a moment to chat?"</div>
              </div>

              <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100">
                <div className="text-[10px] font-bold text-slate-800 mb-0.5">Prospect (Karan)</div>
                <div className="text-slate-700">"Yes, we need 300 pieces of festive lehengas for next month. Can you do that?"</div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="text-[10px] font-bold text-indigo-600 mb-0.5">AI Sales Agent</div>
                <div className="text-slate-700">"We can certainly deliver 300 pieces by next month. What target budget per piece are you working with?"</div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Understands "300" as volume</span>
                <span className="text-emerald-600 font-bold">Verdict: High Intent (95)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ESSENTIAL FEATURES (Clean 6-Card Grid) */}
      <section id="features" className="py-20 bg-slate-50/70 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Capabilities</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Core Features
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Built to turn market intent into pipeline revenue without manual data entry.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
              <Radar className="w-5 h-5 text-indigo-600 mb-2.5" />
              <h4 className="text-sm font-bold text-slate-900 mb-1">Signal Discovery</h4>
              <p className="text-xs text-slate-600">Monitors public buying requests and procurement requirements automatically.</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
              <PhoneCall className="w-5 h-5 text-indigo-600 mb-2.5" />
              <h4 className="text-sm font-bold text-slate-900 mb-1">Gemini Voice AI</h4>
              <p className="text-xs text-slate-600">Conducts intelligent phone calls with sub-second (~1.4s) natural dialogue.</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
              <Target className="w-5 h-5 text-indigo-600 mb-2.5" />
              <h4 className="text-sm font-bold text-slate-900 mb-1">BANT Qualification</h4>
              <p className="text-xs text-slate-600">Extracts Budget, Authority, Need, and Timeline directly from prospect answers.</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
              <Briefcase className="w-5 h-5 text-indigo-600 mb-2.5" />
              <h4 className="text-sm font-bold text-slate-900 mb-1">CRM Pipeline</h4>
              <p className="text-xs text-slate-600">1-click conversion from qualified call to active deals with full transcripts.</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
              <Building2 className="w-5 h-5 text-indigo-600 mb-2.5" />
              <h4 className="text-sm font-bold text-slate-900 mb-1">Profile Grounding</h4>
              <p className="text-xs text-slate-600">Speaks accurately about your catalog, pricing, and factory locations without hallucinations.</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
              <Clock className="w-5 h-5 text-indigo-600 mb-2.5" />
              <h4 className="text-sm font-bold text-slate-900 mb-1">Zero Cold Calling</h4>
              <p className="text-xs text-slate-600">Sales reps step in only after the buyer has confirmed volume, budget, and interest.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FINAL CTA */}
      <section className="py-20 bg-slate-900 text-white text-center px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Stop chasing leads. Start finding opportunities.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Turn live buying signals into high-converting sales conversations today.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-slate-900 bg-white hover:bg-slate-100 shadow-md transition-all"
            >
              <span>Launch AI Sales Agent</span>
              <ArrowRight className="w-4 h-4 text-indigo-600" />
            </Link>
            <Link
              href="/discovery"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
            >
              <Radar className="w-4 h-4 text-indigo-300" />
              <span>Discover Leads</span>
            </Link>
            <Link
              href="/calling"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
            >
              <PhoneCall className="w-4 h-4 text-indigo-300" />
              <span>Launch AI Call</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-slate-950 text-slate-500 py-8 text-xs border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">AI Sales Agent</span>
            <span>•</span>
            <span>Signal to Opportunity</span>
          </div>
          <div className="flex items-center gap-5 text-[11px]">
            <Link href="/dashboard" className="hover:text-slate-300 transition-colors">Dashboard</Link>
            <Link href="/discovery" className="hover:text-slate-300 transition-colors">Leads</Link>
            <Link href="/calling" className="hover:text-slate-300 transition-colors">AI Calling</Link>
            <Link href="/analytics" className="hover:text-slate-300 transition-colors">Analytics</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
