# AI Sales Agent — Signal to Opportunity

> **Autonomous End-to-End B2B Sales Intelligence & Outreach Platform**

Built for rapid, robust hackathon demonstration. Transforms unstructured market signals (funding, hiring surges, compliance deadlines, expansions) into qualified, high-intent CRM opportunities through agentic intelligence.

---

## 🎯 The 11 Core Capabilities

1. **Understand Business Offerings**: Catalogs products, target personas, differentiators, and sales collateral (CloudArmor AI B2B demo profile).
2. **Discover Buying Signals**: Ingests, analyzes, and urgency-scores signals (funding, tech changes, compliance deadlines).
3. **Enrich & Qualify Leads**: Firmographics, tech stack, and primary executive decision-makers.
4. **Match Offerings Semantically**: Maps buyer pain points and tech stack to the ideal product tier and tailored pitch.
5. **Score Lead Intent**: Multi-factor scoring (0–100) and Grades (A/B/C/D) evaluating Urgency, Fit, Authority, and Timing.
6. **AI Sales Calling**: Turn-by-turn interactive voice/dialogue outreach simulator with tone configuration.
7. **Capture Responses**: Real-time buyer feedback and objection categorization.
8. **Transcripts & Insights**: Automated extraction of pain points, sentiment velocity, timelines, and budget indicators.
9. **Identify Interested Prospects**: Qualification tagging (`Qualified_Interested`, `Needs_Followup`, `Disqualified`).
10. **Next Best Action**: Context-aware recommendations (e.g., technical deep dive, custom case study share).
11. **CRM Opportunity Handoff**: 1-click export to HubSpot, Salesforce, or webhook pipelines.

---

## 🏗️ Architecture

```
AI Sales Agent/
├── backend/                  # FastAPI (Python 3)
│   ├── app/
│   │   ├── api/v1/endpoints/ # 7 Core REST endpoints
│   │   ├── core/             # Configuration & environment
│   │   ├── schemas/          # Pydantic v2 data contracts
│   │   └── services/         # Modular AI and domain services
│   └── requirements.txt
├── frontend/                 # Next.js 14 / React / Tailwind CSS
│   ├── src/
│   │   ├── app/              # 7 Core Views
│   │   ├── components/       # Modern SaaS Sidebar & Header
│   │   └── lib/              # API client & TypeScript interfaces
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### 1. Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/api/v1/health`

### 2. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:3000`

### 3. Docker (Optional)
```bash
docker-compose up --build
```
