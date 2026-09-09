'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Shield, Layers, Users, FileText, CheckCircle, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { BusinessProfile } from '@/lib/types';

export default function BusinessProfilePage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBusinessProfile()
      .then((res) => {
        setProfile(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load profile:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-indigo-600" />
            <span>Business Profile & Product Offerings</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Defines the seller’s core products, value props, personas, and collateral used by the AI Agent to match leads and drive sales dialogue.
          </p>
        </div>
        <button
          onClick={() => {
            api.resetBusinessProfile().then((res) => setProfile(res));
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset Demo Defaults</span>
        </button>
      </div>

      {profile && (
        <div className="space-y-6">
          {/* Company Overview Card */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                  {profile.industry}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">{profile.company_name}</h2>
                <div className="text-xs text-indigo-600 font-medium mt-0.5">{profile.domain}</div>
              </div>
            </div>

            <p className="text-sm font-medium text-slate-700 mt-4 leading-relaxed bg-slate-50/80 p-3.5 rounded-lg border border-slate-200/60">
              "{profile.headline}"
            </p>
            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              {profile.description}
            </p>

            {/* Value Propositions & Differentiators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Core Value Propositions</span>
                </h3>
                <ul className="space-y-2">
                  {profile.value_propositions.map((vp, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                      <span>{vp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>Competitive Differentiators</span>
                </h3>
                <ul className="space-y-2">
                  {profile.differentiators.map((diff, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <span>{diff}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Product Offerings Catalog */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Product Offerings ({profile.products.length})</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {profile.products.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all"
                >
                  <div>
                    <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                      {prod.category}
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{prod.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{prod.tagline}</p>
                    <p className="text-xs text-slate-600 mt-3">{prod.description}</p>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Target Pain Points:
                      </div>
                      <ul className="space-y-1">
                        {prod.target_pain_points.map((pt, i) => (
                          <li key={i} className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-slate-400" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100">
                    <div className="text-xs font-semibold text-slate-900">{prod.pricing_tier}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Ideal for: {prod.ideal_customer_size}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
