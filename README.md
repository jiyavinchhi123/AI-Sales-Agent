# AI Sales Agent — Signal to Opportunity

> **Autonomous End-to-End B2B Sales Intelligence, AI Voice Qualification, and CRM Opportunity Platform**

Turn live market buying signals into qualified sales opportunities. The **AI Sales Agent** continuously monitors verified procurement intent, enriches decision-maker contact intelligence, executes multi-turn voice qualification calls powered by **Google Gemini LLM** with sub-second turnaround (~1.4s), and commits verified BANT deals straight into your CRM pipeline.

---

## 🌟 Key Highlights

- ⚡ **Google Gemini LLM Conversational Brain**: Powered by Gemini (`gemini-3.1-flash-lite-preview` / `gemini-3.1-flash-lite`). Reads complete conversation context before each turn, understands quantities and budgets without rigid regexes, answers unexpected prospect questions using your verified business profile as ground truth, and concludes calls dynamically.
- 🚀 **Sub-Second Voice Turnaround (~1.4s)**: Persistent HTTP connection pooling and socket keep-alive ensure voice responses return in ~1.4s for fluid phone dialogue.
- 🎯 **Signal to Opportunity Lifecycle**:
  `Understand Business` → `Discover Leads` → `Enrich Contacts` → `Match Requirements` → `AI Outreach` → `AI Phone Call` → `Extract BANT Opportunity` → `Sales Follow-up`.
- 📊 **Pure Dynamic Database Architecture**: Powered by SQLite via SQLAlchemy. All user workspaces, company profiles, discovered leads, call transcripts, and CRM deals are 100% dynamic with zero hardcoded mocks.
- 🎨 **Modern SaaS Landing Page & Command Center**: Sleek, minimalist public landing page at `http://localhost:3000/` and authenticated Sales Command Center at `http://localhost:3000/dashboard`.

---

## 🎯 The 16 Core Capabilities

1. **AI Business Understanding**: Ingests your catalog, USPs, target industries, and company summary as ground truth for all AI actions.
2. **Buying Signal & Lead Discovery**: Monitors public buying intent, RFP signals, and procurement inquiries.
3. **Lead Enrichment**: Resolves verified primary decision makers, corporate emails, and direct phone lines.
4. **AI Product/Prospect Matching**: Semantic matching algorithm that aligns prospect pain points with your exact catalog items.
5. **Intent Scoring (0–100)**: Multi-factor intent algorithm evaluating fit, authority, urgency, and budget.
6. **AI Email Outreach**: Generates tailored outreach emails referencing exact buyer requirements.
7. **Gemini-Powered AI Calling**: Low-latency voice calls conducting live spoken qualification.
8. **Natural Conversation & Reasoning**: Multi-turn contextual reasoning without rigid scripts or keyword regexes.
9. **BANT/Requirement Analysis**: Extracts confirmed Budget, Authority, Need, and Timeline directly from prospect dialogue.
10. **Call Transcripts & AI Summary**: Speaker-separated verbatim transcripts and executive qualification summaries.
11. **Opportunity & CRM Management**: 1-click promotion of qualified calls into structured CRM deals with stage tracking.
12. **Follow-up & Next-Best Action**: Tailored sales recommendations and automated quotation prep.
13. **Analytics & Sales Funnel**: Real-time telemetry tracking conversion rates from discovered signals to won deals.
14. **Multilingual AI Conversations**: Fluid voice reasoning across diverse global business languages and regional dialects.
15. **CSV/Excel Lead Upload**: Upload existing prospect spreadsheets for automated AI enrichment and qualification.
16. **CRM & SQLite Storage**: Secure persistent storage of all profiles, calls, transcripts, and pipeline deals.

---

## 🏗️ Architecture & Tech Stack

```
AI Sales Agent/
├── backend/                  # FastAPI (Python 3.10+)
│   ├── app/
│   │   ├── api/v1/endpoints/ # Authentication, Discovery, Leads, Calling, CRM, Analytics
│   │   ├── core/             # Security, Database config, Settings
│   │   ├── models/           # SQLAlchemy ORM models (User, CompanyProfile, Lead, CallSession, Opportunity)
│   │   ├── schemas/          # Pydantic v2 data contracts
│   │   └── services/         # Modular AI domain services (CallAgentService, LeadService, BusinessService)
│   ├── requirements.txt
│   └── sales_agent.db        # SQLite database
├── frontend/                 # Next.js 14 / React 18 / Tailwind CSS
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx      # Public SaaS Landing Page (/)
│   │   │   ├── dashboard/    # Sales Command Center (/dashboard)
│   │   │   ├── discovery/    # Lead & Signal Discovery (/discovery)
│   │   │   ├── leads/        # Leads CRM Table (/leads)
│   │   │   ├── calling/      # AI Voice Calling Console (/calling)
│   │   │   ├── analytics/    # Sales Funnel Analytics (/analytics)
│   │   │   ├── business/     # Business Profile & Offerings (/business)
│   │   │   ├── login/        # User Login (/login)
│   │   │   └── register/     # Account Registration (/register)
│   │   ├── components/       # Modern SaaS UI components, Sidebar, Header
│   │   └── lib/              # API client & TypeScript interfaces
│   └── package.json
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10 or higher
- Node.js 18+ and npm
- Google Gemini API Key ([Google AI Studio](https://aistudio.google.com/))

---

### 1. Backend Setup (FastAPI)

```powershell
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables in backend/.env
# GEMINI_API_KEY="your-gemini-api-key"
# DATABASE_URL="sqlite:///./sales_agent.db"

# Start backend server
uvicorn app.main:app --reload --port 8000
```

- **API Documentation (Swagger):** `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/api/v1/health`

---

### 2. Frontend Setup (Next.js)

```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```

- **Product Landing Page:** `http://localhost:3000/`
- **Sales Command Center:** `http://localhost:3000/dashboard`

---

## 🌐 Application Routes Overview

| Route | Access | Purpose |
| :--- | :--- | :--- |
| **`/`** | Public | Minimalist SaaS Product Landing Page |
| **`/landing`** | Public | Landing Page alias |
| **`/login`** | Public | User authentication login screen |
| **`/register`** | Public | New user workspace registration |
| **`/dashboard`** | Authenticated | Sales Command Center: KPIs, Attention queue, and Funnel |
| **`/discovery`** | Authenticated | Live procurement signal search and lead discovery |
| **`/leads`** | Authenticated | CRM Leads manager, status workflows, and contact cards |
| **`/calling`** | Authenticated | Real-time AI Calling console with Web Speech audio and BANT insights |
| **`/analytics`** | Authenticated | Conversion metrics, pipeline velocities, and intent distribution |
| **`/business`** | Authenticated | Business Profile ground truth, catalog items, and SMTP settings |

---

## 📞 How the Gemini AI Calling Brain Works

1. **Initial Greeting**: Formulates a natural, professional phone greeting referencing the buyer's requirement and your business profile.
2. **Contextual Understanding**:
   - Short responses like `"300"` are understood from context as order quantity.
   - Compound statements like `"300 pieces for festive lehengas"` extract both quantity and requirement simultaneously.
   - Statements like `"Total budget is 60,000 rupees"` lock in budget and Gemini **never** asks about budget again.
3. **Ground-Truth Protection**: Answers unexpected questions regarding factory locations, certifications, or wholesale delivery terms strictly from your business profile without hallucinations.
4. **Fast Turnaround**: Persistent HTTP connection pooling delivers replies in **~1.4s**.
5. **Call Conclusion & BANT Extraction**: Upon hang-up or call completion, Gemini analyzes the complete verbatim transcript to produce structured BANT insights (Budget, Authority, Need, Timeline, Intent Score, Summary, and Recommended Next Action).

---

## 🔒 Security & Privacy

- Authentication uses **PBKDF2-HMAC-SHA256** (100,000 iterations) with salted password hashing.
- API requests are authorized via stateless **JWT Bearer Tokens**.
- `.env` files and local database binaries are strictly ignored by `.gitignore`.

---

## 📄 License
This project is proprietary and built for enterprise B2B sales automation. All rights reserved.
