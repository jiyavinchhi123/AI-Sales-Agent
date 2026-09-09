import {
  BusinessProfile,
  BuyingSignal,
  Lead,
  CallSession,
  Campaign,
  Opportunity,
  DashboardOverview,
  OfferingMatch,
  IntentScore,
} from './types';
import {
  MOCK_BUSINESS_PROFILE,
  MOCK_SIGNALS,
  MOCK_LEADS,
  MOCK_CALLS,
  MOCK_OPPORTUNITIES,
  MOCK_OVERVIEW,
} from './mockData';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

async function fetchWithFallback<T>(endpoint: string, fallbackData: T, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`API returned ${res.status} for ${endpoint}, using demo dataset fallback.`);
      return fallbackData;
    }

    return await res.json();
  } catch (err: any) {
    // Graceful fallback to rich mock data ensures smooth offline demo experience
    return fallbackData;
  }
}

export const api = {
  // Health
  checkHealth: () =>
    fetchWithFallback<{ status: string; platform: string; mode: string }>(
      '/health',
      { status: 'online', platform: 'AI Sales Agent', mode: 'Demo / Active' }
    ),

  // Analytics & Dashboard
  getDashboardOverview: () =>
    fetchWithFallback<DashboardOverview>('/analytics/overview', MOCK_OVERVIEW),

  // Business Profile
  getBusinessProfile: () =>
    fetchWithFallback<BusinessProfile>('/business/profile', MOCK_BUSINESS_PROFILE),
  updateBusinessProfile: (data: Partial<BusinessProfile>) =>
    fetchWithFallback<BusinessProfile>('/business/profile', MOCK_BUSINESS_PROFILE, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  resetBusinessProfile: () =>
    fetchWithFallback<BusinessProfile>('/business/reset', MOCK_BUSINESS_PROFILE, { method: 'POST' }),

  // Signals & Discovery
  getSignals: (params?: { signal_type?: string; min_urgency?: number }) => {
    const query = new URLSearchParams();
    if (params?.signal_type) query.set('signal_type', params.signal_type);
    if (params?.min_urgency !== undefined) query.set('min_urgency', params.min_urgency.toString());
    return fetchWithFallback<BuyingSignal[]>(`/discovery/signals?${query.toString()}`, MOCK_SIGNALS);
  },
  scanSignals: () =>
    fetchWithFallback<BuyingSignal[]>('/discovery/scan', [
      {
        id: `sig-scan-${Date.now()}`,
        company_name: 'Acuity Robotics',
        domain: 'acuityrobotics.ai',
        signal_type: 'funding',
        title: 'Secured $42M Series B for Autonomous Drone Fleet',
        summary: 'Cloud-connected fleet expanding into defense and critical infrastructure.',
        source: 'VentureBeat',
        detected_at: new Date().toISOString(),
        confidence_score: 0.94,
        urgency_level: 'High',
        urgency_score: 93,
        processed: false,
      },
    ], { method: 'POST' }),
  convertSignalToLead: (signalId: string) =>
    fetchWithFallback<Lead>(`/discovery/convert-to-lead/${signalId}`, MOCK_LEADS[0], {
      method: 'POST',
    }),

  // Leads
  getLeads: (params?: { status?: string; grade?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.grade) query.set('grade', params.grade);
    if (params?.search) query.set('search', params.search);
    return fetchWithFallback<Lead[]>(`/leads?${query.toString()}`, MOCK_LEADS);
  },
  getLead: (leadId: string) =>
    fetchWithFallback<Lead>(
      `/leads/${leadId}`,
      MOCK_LEADS.find((l) => l.id === leadId) || MOCK_LEADS[0]
    ),
  matchLead: (leadId: string) =>
    fetchWithFallback<OfferingMatch>(`/leads/${leadId}/match`, MOCK_LEADS[0].match!, {
      method: 'POST',
    }),
  scoreLead: (leadId: string) =>
    fetchWithFallback<IntentScore>(`/leads/${leadId}/score`, MOCK_LEADS[0].intent!, {
      method: 'POST',
    }),
  updateLeadStatus: (leadId: string, status: string) =>
    fetchWithFallback<Lead>(
      `/leads/${leadId}/status?status=${encodeURIComponent(status)}`,
      { ...MOCK_LEADS[0], status },
      { method: 'PUT' }
    ),

  // AI Calling
  getCallSessions: () =>
    fetchWithFallback<CallSession[]>('/calling/sessions', MOCK_CALLS),
  getCallSession: (callId: string) =>
    fetchWithFallback<CallSession>(`/calling/sessions/${callId}`, MOCK_CALLS[0]),
  startCall: (leadId: string, voiceTone?: string) =>
    fetchWithFallback<CallSession>('/calling/start', MOCK_CALLS[0], {
      method: 'POST',
      body: JSON.stringify({ lead_id: leadId, voice_tone: voiceTone }),
    }),
  stepCall: (callId: string, prospectResponse: string, voiceTone?: string) =>
    fetchWithFallback<CallSession>('/calling/step', {
      ...MOCK_CALLS[0],
      turns: [
        ...MOCK_CALLS[0].turns,
        {
          id: `t-p-${Date.now()}`,
          speaker: 'prospect',
          text: prospectResponse,
          timestamp_offset_seconds: 130,
        },
        {
          id: `t-ai-${Date.now()}`,
          speaker: 'ai',
          text: 'That makes total sense. We specifically designed CloudArmor to automate evidence collection without interrupting your sprint velocity. Can we show you a 15-minute live preview this Thursday?',
          timestamp_offset_seconds: 145,
          sentiment: 'positive',
        },
      ],
    }, {
      method: 'POST',
      body: JSON.stringify({
        call_id: callId,
        prospect_response: prospectResponse,
        voice_tone: voiceTone,
      }),
    }),

  // Campaigns
  getCampaigns: () =>
    fetchWithFallback<Campaign[]>('/campaigns', [
      {
        id: 'camp-001',
        name: 'Q1 Scaleup Compliance & Audit Acceleration',
        description: 'Outreach targeting recently funded Series A/B SaaS companies.',
        target_criteria: 'Series A/B funding within 60 days, hiring DevOps/Security',
        status: 'Active',
        channels: ['AI Voice Call', 'Personalized Email'],
        total_leads: 18,
        contacted_count: 14,
        interested_count: 6,
        scheduled_meetings: 4,
        response_rate: 42.8,
        created_at: '2026-03-01T09:00:00Z',
      },
    ]),

  // Opportunities & CRM
  getOpportunities: () =>
    fetchWithFallback<Opportunity[]>('/opportunities', MOCK_OPPORTUNITIES),
  createOpportunityFromLead: (leadId: string) =>
    fetchWithFallback<Opportunity>(`/opportunities/create-from-lead/${leadId}`, MOCK_OPPORTUNITIES[0], {
      method: 'POST',
    }),
  exportToCRM: (oppId: string, targetCrm: string = 'HubSpot') =>
    fetchWithFallback<Opportunity>(
      '/opportunities/crm-export',
      {
        ...MOCK_OPPORTUNITIES[0],
        crm_synced: true,
        crm_target: targetCrm,
        crm_record_id: `${targetCrm.slice(0, 2).toUpperCase()}-9941`,
      },
      {
        method: 'POST',
        body: JSON.stringify({ opportunity_id: oppId, target_crm: targetCrm }),
      }
    ),
};
