'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  PhoneCall,
  Users,
  Building2,
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  Clock,
  RefreshCw,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { SubscriptionData, SubscriptionTier, PlanTierDefinition } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradingTier, setUpgradingTier] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchSubscription = async () => {
    try {
      const data = await api.getSubscription();
      setSubscription(data);
      setBillingCycle(data.billing_cycle || 'monthly');
    } catch (err) {
      console.error('Failed to load subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleSwitchPlan = async (tier: SubscriptionTier) => {
    if (!subscription || subscription.plan_tier === tier) return;
    setUpgradingTier(tier);
    setNotification(null);

    try {
      const updated = await api.upgradeSubscription(tier, billingCycle);
      setSubscription(updated);
      setNotification({
        type: 'success',
        message: `Plan successfully switched to ${tier}! Quotas and features have been updated.`,
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to update subscription. Please try again.',
      });
    } finally {
      setUpgradingTier(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-indigo-600" />
              <span>SaaS Subscription & Quota Center</span>
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Usage-Based Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Scale your autonomous outbound pipeline with flexible tiers for voice minutes, enriched contacts, and CRM integrations.
          </p>
        </div>

        {/* Current Plan Badge */}
        {subscription && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 shrink-0">
            <div className="text-right">
              <div className="text-[10.5px] uppercase tracking-wider font-semibold text-slate-400">
                Active Tier
              </div>
              <div className="text-base font-bold text-slate-900 flex items-center gap-1.5 justify-end">
                <span>{subscription.plan_tier} Plan</span>
                <Badge variant={subscription.plan_tier === 'Enterprise' ? 'purple' : 'primary'} size="sm">
                  Active
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* 2. Real-Time Quota Usage Dashboard */}
      {subscription && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Real-Time Quota Consumption</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculated directly from active SQLite lead records and completed AI voice sessions.
              </p>
            </div>
            <button
              onClick={fetchSubscription}
              className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1 p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-all"
              title="Refresh Quota Meters"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Meter 1: AI Voice Calling Minutes */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />
                  <span>AI Voice Calling Minutes</span>
                </span>
                <span className="text-xs font-bold text-slate-900 font-mono">
                  {subscription.voice_minutes_used} / {subscription.voice_minutes_limit} min
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(subscription.voice_minutes_percentage, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{subscription.voice_minutes_percentage}% consumed</span>
                <span>{Math.max(0, subscription.voice_minutes_limit - subscription.voice_minutes_used)} mins left</span>
              </div>
            </div>

            {/* Meter 2: Enriched Leads Quota */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Enriched Leads in Pipeline</span>
                </span>
                <span className="text-xs font-bold text-slate-900 font-mono">
                  {subscription.leads_used} / {subscription.leads_limit} leads
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(subscription.leads_percentage, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{subscription.leads_percentage}% consumed</span>
                <span>{Math.max(0, subscription.leads_limit - subscription.leads_used)} contacts left</span>
              </div>
            </div>

            {/* Meter 3: Team Seats */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sales Rep Seats</span>
                </span>
                <span className="text-xs font-bold text-slate-900 font-mono">
                  {subscription.seats_used} / {subscription.seats_limit} seats
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      (subscription.seats_used / Math.max(subscription.seats_limit, 1)) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{subscription.seats_limit > 10 ? 'Enterprise Pool' : 'Standard Allocation'}</span>
                <span>{Math.max(0, subscription.seats_limit - subscription.seats_used)} seats open</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Monthly / Yearly Billing Switcher */}
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Select Billing Frequency
        </div>
        <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              billingCycle === 'yearly'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Annual Billing</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* 4. Tier Comparison Cards: Starter, Growth, Enterprise */}
      {subscription && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {subscription.available_tiers.map((tier) => {
            const isCurrent = subscription.plan_tier === tier.id;
            const price = billingCycle === 'yearly' ? tier.price_yearly : tier.price_monthly;
            const priceInr = billingCycle === 'yearly' ? tier.price_inr_yearly : tier.price_inr_monthly;
            const isUpgrading = upgradingTier === tier.id;

            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl bg-white border flex flex-col transition-all p-6 ${
                  tier.is_popular
                    ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                {/* Popular / Recommended Badge */}
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xs">
                      {tier.badge}
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">{tier.name}</h3>
                    {isCurrent && (
                      <Badge variant="success" size="sm">
                        Current Plan
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{tier.tagline}</p>
                </div>

                {/* Pricing Box */}
                <div className="mb-6 pb-6 border-b border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                      ${price}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">/month</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">
                    ₹{priceInr.toLocaleString('en-IN')}/mo (billed {billingCycle})
                  </div>
                </div>

                {/* Key Usage Limits */}
                <div className="bg-slate-50 rounded-xl p-3.5 mb-6 space-y-2 text-xs border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">AI Voice Minutes:</span>
                    <strong className="text-slate-900 font-mono">{tier.voice_minutes} min/mo</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Enriched Contacts:</span>
                    <strong className="text-slate-900 font-mono">{tier.leads_count} leads/mo</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Sales Seats:</span>
                    <strong className="text-slate-900 font-mono">{tier.seats} seat{tier.seats > 1 ? 's' : ''}</strong>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3 flex-1 mb-8">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Included Features:
                  </div>
                  {tier.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Action CTA */}
                <div>
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 cursor-default"
                    >
                      Active Subscription
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSwitchPlan(tier.id)}
                      disabled={isUpgrading}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                        tier.is_popular
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {isUpgrading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Switching Plan...</span>
                        </>
                      ) : (
                        <>
                          <span>Switch to {tier.name}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Enterprise Guarantee & FAQ Accordion */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-8 shadow-xs">
        <div className="max-w-2xl mx-auto text-center mb-8">
          <h3 className="text-lg font-bold text-slate-900">SaaS Architecture & Billing FAQ</h3>
          <p className="text-xs text-slate-500 mt-1">
            Transparent usage-based rules aligned with the platform requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
          <div className="space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <strong className="text-slate-800 font-bold block text-sm">
              How are Voice Minutes metered?
            </strong>
            <p className="leading-relaxed text-slate-500">
              Each AI outbound dialogue records duration from prospect pickup to call wrap-up. Minutes are pooled across all team members in your workspace.
            </p>
          </div>

          <div className="space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <strong className="text-slate-800 font-bold block text-sm">
              What happens when quotas are reached?
            </strong>
            <p className="leading-relaxed text-slate-500">
              You receive warning banners at 80% and 100% capacity. You can upgrade instantly to Growth or Enterprise without downtime or losing any lead data.
            </p>
          </div>

          <div className="space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <strong className="text-slate-800 font-bold block text-sm">
              Can I upgrade or downgrade anytime?
            </strong>
            <p className="leading-relaxed text-slate-500">
              Yes. Upgrades apply immediately with expanded quotas in your SQLite database. Downgrades take effect at the end of the current billing cycle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
