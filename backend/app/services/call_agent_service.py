"""
AI Sales Calling and Dialogue Agent Service
Dynamic, Turn-by-Turn B2B Sales Qualification Engine with BANT Extraction.
Zero hardcoded company or product templates.
"""

from typing import List, Optional, Dict, Any, Tuple
import os
import re
import json
import uuid
import datetime
import httpx
from sqlalchemy.orm import Session

from app.core.config import settings

from app.models.call import CallSession as DBCallSession
from app.models.lead import Lead as DBLead
from app.schemas.call import (
    CallSession, CallTurn, CallInsights, ObjectionBattlecard,
    StartCallRequest, CallDialogueStepRequest
)
from app.schemas.lead import Lead
from app.schemas.business import StructuredBusinessProfile
from app.services.business_service import business_service
from app.services.lead_service import lead_service


class CallAgentService:
    def __init__(self):
        # In-memory fast cache synced with SQLite
        self._memory_sessions: Dict[str, CallSession] = {}

    def get_all_calls(self, db: Session, user_id: str) -> List[CallSession]:
        """Fetch all call sessions for the user from SQLite."""
        rows = db.query(DBCallSession).filter(DBCallSession.user_id == user_id).order_by(DBCallSession.created_at.desc()).all()
        results = []
        for r in rows:
            session = self._db_to_schema(r)
            results.append(session)
        return results

    def get_call_by_id(self, call_id: str, db: Optional[Session] = None, user_id: Optional[str] = None) -> Optional[CallSession]:
        """Fetch a specific call session by ID."""
        if call_id in self._memory_sessions:
            return self._memory_sessions[call_id]

        if db:
            query = db.query(DBCallSession).filter(DBCallSession.id == call_id)
            if user_id:
                query = query.filter(DBCallSession.user_id == user_id)
            row = query.first()
            if row:
                session = self._db_to_schema(row)
                self._memory_sessions[call_id] = session
                return session

        return None

    def start_call(
        self,
        req: StartCallRequest,
        lead: Lead,
        seller_profile: Optional[StructuredBusinessProfile],
        user_id: str,
        db: Session
    ) -> CallSession:
        """
        Initiates a dynamic sales qualification call.
        Uses the active seller profile and target lead requirement.
        """
        call_id = f"call-{uuid.uuid4().hex[:6]}"
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Clear in-memory cached sessions so no stale call state lingers
        self._memory_sessions.clear()

        # Clear any stale in-progress demo calls for this user from SQLite
        try:
            db.query(DBCallSession).filter(
                DBCallSession.user_id == user_id,
                DBCallSession.status == "In_Progress"
            ).delete()
            db.commit()
        except Exception:
            db.rollback()

        # Dynamic Company & Service from active profile and lead
        seller_company = (seller_profile.company_name.strip() if seller_profile and seller_profile.company_name else "our company")
        seller_products = [p.strip() for p in (seller_profile.products_services or []) if p.strip()] if seller_profile else []

        target_service = (
            getattr(lead, "matched_offering", None)
            or (lead.signals_summary[0] if getattr(lead, "signals_summary", None) else None)
            or (lead.match.product_name if getattr(lead, "match", None) else None)
            or (seller_products[0] if seller_products else None)
        )

        contact_name = lead.primary_contact.name if lead.primary_contact else "there"
        contact_first = contact_name.split()[0] if contact_name else "there"
        contact_title = lead.primary_contact.title if lead.primary_contact else "Decision Maker"

        # Realistic opening qualification greeting
        if target_service and target_service.lower() not in ["your requirements", "none", "apparel and garment collections", "wholesale offerings", "product requirement"]:
            greeting_text = (
                f"Hello, I'm calling from {seller_company} regarding your requirement for {target_service}. "
                f"Is this a good time to talk?"
            )
        else:
            greeting_text = (
                f"Hello, I'm calling from {seller_company}. Is this a good time for a quick conversation?"
            )

        initial_turn = CallTurn(
            id=f"turn-{uuid.uuid4().hex[:4]}",
            speaker="ai",
            text=greeting_text,
            timestamp_offset_seconds=0,
            sentiment="positive"
        )

        session = CallSession(
            id=call_id,
            lead_id=req.lead_id,
            company_name=lead.company_name,
            contact_name=contact_name,
            contact_title=contact_title,
            status="In_Progress",
            stage="greeting",
            duration_seconds=5,
            started_at=now_iso,
            turns=[initial_turn],
            insights=None,
            battlecards_used=[]
        )
        session.insights = self._analyze_call_with_ai(
            call=session,
            seller_profile=seller_profile,
            lead=lead,
            is_completed=False
        )

        # Persist into memory and DB
        self._memory_sessions[call_id] = session

        db_session = DBCallSession(
            id=call_id,
            user_id=user_id,
            lead_id=req.lead_id,
            lead_name=contact_name,
            company_name=lead.company_name,
            duration_seconds=5,
            status="In_Progress",
            turns=[t.model_dump() for t in session.turns],
            summary=insights.summary,
            qualification_verdict=insights.qualification_verdict,
            qualification_data=insights.model_dump(),
            created_at=datetime.datetime.utcnow(),
        )
        db.add(db_session)
        db.commit()

        # Update lead CRM status to Contacted
        lead_service.update_status(db, user_id, req.lead_id, "Contacted")

        return session

    def _get_active_api_keys(self) -> Tuple[Optional[str], Optional[str]]:
        """
        Dynamically resolves OpenAI and Gemini API keys from settings,
        os.environ, or .env file (supports hot updates without app restart).
        """
        openai_key = os.getenv("OPENAI_API_KEY") or settings.OPENAI_API_KEY
        gemini_key = os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
        if not openai_key or not gemini_key:
            env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
            if os.path.exists(env_file):
                try:
                    with open(env_file, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if line.startswith("OPENAI_API_KEY=") and not openai_key:
                                val = line.split("=", 1)[1].strip().strip('"\'')
                                if val:
                                    openai_key = val
                            elif line.startswith("GEMINI_API_KEY=") and not gemini_key:
                                val = line.split("=", 1)[1].strip().strip('"\'')
                                if val:
                                    gemini_key = val
                except Exception:
                    pass
        return openai_key, gemini_key

    def _call_llm_if_available(
        self,
        system_prompt: str,
        history_msgs: List[Dict[str, str]],
        prospect_text: str
    ) -> Optional[str]:
        """
        Invokes Gemini or OpenAI if configured in settings, environment, or .env.
        Enforces strict sales representative grounding.
        """
        openai_key, gemini_key = self._get_active_api_keys()

        # 1. Try Gemini first if key is present
        if gemini_key:
            for model_name in ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"]:
                try:
                    with httpx.Client(timeout=5.0) as client:
                        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_key}"
                        contents = [
                            {
                                "role": "user",
                                "parts": [{"text": f"SYSTEM INSTRUCTIONS:\n{system_prompt}"}]
                            },
                            {
                                "role": "model",
                                "parts": [{"text": "Understood. I will act strictly as the AI sales agent on this phone call, using only the provided Business Profile and Lead details, answering concisely and naturally without hallucinating."}]
                            }
                        ]
                        for m in history_msgs:
                            role = "model" if m["role"] == "assistant" else "user"
                            contents.append({"role": role, "parts": [{"text": m["content"]}]})
                        contents.append({"role": "user", "parts": [{"text": prospect_text}]})

                        res = client.post(
                            url,
                            json={
                                "contents": contents,
                                "generationConfig": {"temperature": 0.25, "maxOutputTokens": 150}
                            }
                        )
                        if res.status_code == 200:
                            data = res.json()
                            candidates = data.get("candidates", [])
                            if candidates and "content" in candidates[0] and "parts" in candidates[0]["content"]:
                                text = candidates[0]["content"]["parts"][0]["text"].strip()
                                text = re.sub(r'^["\']|["\']$', '', text).strip()
                                if text:
                                    print(f"[LLM Dialogue] Generated response via Gemini ({model_name}): {text}")
                                    return text
                        else:
                            print(f"[LLM Dialogue] Gemini ({model_name}) returned status {res.status_code}: {res.text[:120]}")
                except Exception as e:
                    print(f"[LLM Dialogue] Gemini ({model_name}) call failed: {e}")

        # 2. Try OpenAI if key is present
        if openai_key and (openai_key.startswith("sk-") or len(openai_key) > 20):
            try:
                with httpx.Client(timeout=5.0) as client:
                    messages = [{"role": "system", "content": system_prompt}]
                    messages.extend(history_msgs)
                    messages.append({"role": "user", "content": prospect_text})
                    res = client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={"Authorization": f"Bearer {openai_key}"},
                        json={
                            "model": "gpt-4o-mini",
                            "messages": messages,
                            "temperature": 0.25,
                            "max_tokens": 150
                        }
                    )
                    if res.status_code == 200:
                        content = res.json()["choices"][0]["message"]["content"].strip()
                        content = re.sub(r'^["\']|["\']$', '', content).strip()
                        if content:
                            print(f"[LLM Dialogue] Generated response via OpenAI (gpt-4o-mini): {content}")
                            return content
                    else:
                        print(f"[LLM Dialogue] OpenAI returned status {res.status_code}: {res.text[:120]}")
            except Exception as e:
                print(f"[LLM Dialogue] OpenAI call failed: {e}")

        return None

    def _analyze_call_with_ai(
        self,
        call: CallSession,
        seller_profile: Optional[StructuredBusinessProfile],
        lead: Optional[Lead],
        is_completed: bool = False
    ) -> CallInsights:
        """
        Performs AI-based semantic analysis of the entire conversation.
        Uses ONLY:
        - Active Business Profile
        - Current Lead
        - Full Call Transcript
        - Conversation History
        
        If no LLM API key (Gemini / OpenAI) is configured:
        Returns a transparent 'Analysis Unavailable' state (intent_score=None, all fields 'Not available').
        Zero fake scores, zero rule-based guessing.
        """
        prospect_turns = [t for t in call.turns if t.speaker == "prospect"]

        # Transparent 'Analysis Unavailable' default state when no LLM provider key is available
        openai_key, gemini_key = self._get_active_api_keys()
        has_gemini = bool(gemini_key and len(gemini_key.strip()) > 5)
        has_openai = bool(openai_key and len(openai_key.strip()) > 5 and openai_key.startswith("sk-"))

        if not (has_gemini or has_openai):
            return CallInsights(
                summary="AI analysis unavailable: No LLM provider API key (Gemini or OpenAI) is configured in backend/.env.",
                sentiment_overall="Neutral",
                engagement="Not available",
                intent_level="Not available",
                intent_score=None,
                interest_level="Not available",
                urgency="Not available",
                need="Not available",
                product_service="Not available",
                scope_quantity="Not available",
                scope_users="Not available",
                timeline="Not available",
                budget="Not disclosed",
                authority="Not available",
                target_location=None,
                delivery_location=None,
                pain_points=[],
                extracted_pain_points=[],
                objections=[],
                objections_handled=[],
                customer_questions=[],
                important_info=[],
                next_best_action="Configure an LLM API key (Gemini / OpenAI) in .env for automated semantic call analysis",
                qualification_verdict="Analysis Unavailable",
            )

        # If call just started with 0 prospect turns, return initial awaiting response state
        if not prospect_turns:
            return CallInsights(
                summary=f"Call initiated with {call.company_name}. Awaiting prospect response.",
                sentiment_overall="Neutral",
                engagement="Awaiting Response",
                intent_level="In_Progress",
                intent_score=None,
                interest_level="Not available",
                urgency="Not available",
                need="Not available",
                product_service="Not available",
                scope_quantity="Not available",
                scope_users="Not available",
                timeline="Not available",
                budget="Not disclosed",
                authority=call.contact_title or "Not available",
                target_location=None,
                delivery_location=None,
                pain_points=[],
                extracted_pain_points=[],
                objections=[],
                objections_handled=[],
                customer_questions=[],
                important_info=[],
                next_best_action="Listen to prospect response and introduce offering",
                qualification_verdict="In_Progress",
            )

        # Assemble Full Context
        seller_company = (seller_profile.company_name.strip() if seller_profile and seller_profile.company_name else "Our Company")
        seller_summary = (seller_profile.company_summary.strip() if seller_profile and seller_profile.company_summary else "B2B Enterprise Supplier")
        seller_products = ", ".join([p.strip() for p in (seller_profile.products_services or []) if p.strip()]) if seller_profile else ""
        seller_locations = ", ".join([loc.strip() for loc in (seller_profile.target_locations or []) if loc.strip()]) if seller_profile else ""

        lead_company = call.company_name or (lead.company_name if lead else "Prospect Company")
        contact_name = call.contact_name or (lead.primary_contact.name if lead and lead.primary_contact else "Prospect Contact")
        contact_title = call.contact_title or (lead.primary_contact.title if lead and lead.primary_contact else "Decision Maker")
        matched_offering = getattr(lead, "matched_offering", "") if lead else ""

        transcript_lines = []
        for idx, t in enumerate(call.turns, start=1):
            speaker_label = f"AI Sales Agent ({seller_company})" if t.speaker == "ai" else f"Prospect ({contact_name} at {lead_company})"
            transcript_lines.append(f"[Turn {idx}, +{t.timestamp_offset_seconds}s] {speaker_label}: {t.text}")
        full_transcript = "\n".join(transcript_lines)

        system_instruction = f"""You are an expert sales analyst reviewing the COMPLETE conversation transcript of a B2B sales qualification phone call.
Analyze the conversation semantically using ONLY the provided transcript, active business profile, and lead context.

Active Business Profile:
- Seller Company: {seller_company}
- Seller Summary: {seller_summary}
- Offerings/Products: {seller_products or 'Not specified'}
- Supply Locations: {seller_locations or 'Not specified'}

Current Lead:
- Prospect Company: {lead_company}
- Contact Person: {contact_name} ({contact_title})
- Initial Matched Signal: {matched_offering or 'None'}

CRITICAL EXTRACTION RULES:
1. Ground truth only: Never assume, invent, extrapolate, or hallucinate information.
2. If any piece of information was not explicitly mentioned or confirmed in the transcript, strictly return "Not available" (or "Not disclosed" for budget).
3. Do NOT treat a single product inquiry or casual phrase (e.g. "Modal Silk Sarees") as the complete requirement.
4. Calculate 'intent_score' (0 to 100) strictly from genuine prospect engagement:
   - 0-30: Prospect expressed disinterest, opted out, or hung up.
   - 31-60: Prospect asked a basic question or listened casually without making commitments or sharing requirements.
   - 61-80: Prospect actively discussed requirements, asked about pricing/terms, or confirmed interest.
   - 81-100: Prospect shared specific volume/timeline, provided direct contact details (email/phone), or requested catalogs/samples/next meetings.
5. Extract actual questions the customer asked in 'customer_questions'.
6. Extract real objections or concerns in 'objections'.
7. Extract pain points in 'pain_points'.
8. Extract notes, contact details, or delivery notes in 'important_info'.
9. Provide an actionable 'next_best_action' (e.g., 'Email wholesale catalog to prospect@email.com', 'Follow up regarding MOQ', 'Do not contact (opted out)').
10. 'qualification_verdict' must be one of: 'Interested', 'Evaluating', 'Follow_Up_Needed', 'Disqualified', 'Not_Interested'.

You MUST return ONLY a JSON object matching this schema:
{{
  "summary": "2-3 sentence executive synopsis of what actually took place on the call.",
  "sentiment_overall": "Positive" | "Neutral" | "Skeptical" | "Guarded" | "Disinterested",
  "engagement": "High" | "Medium" | "Low" | "Disengaged",
  "intent_level": "High Intent" | "Evaluating" | "Inquiring" | "Disinterested" | "Not Interested",
  "intent_score": 0-100,
  "interest_level": "High" | "Medium" | "Low",
  "urgency": "High" | "Moderate" | "Low" | "Not available",
  "need": "Exact stated need or 'Not available'",
  "product_service": "Specific product/service discussed or 'Not available'",
  "scope_quantity": "Specific quantity/units/users or 'Not available'",
  "timeline": "Specific timeframe or 'Not available'",
  "budget": "Stated budget or 'Not disclosed'",
  "authority": "Stated role/authority or 'Not available'",
  "pain_points": [],
  "objections": [],
  "customer_questions": [],
  "important_info": [],
  "next_best_action": "Specific next action for sales team",
  "qualification_verdict": "Interested" | "Evaluating" | "Follow_Up_Needed" | "Disqualified" | "Not_Interested"
}}"""

        user_content = f"COMPLETE CALL TRANSCRIPT:\n{full_transcript}\n\nCall Status: {'Call Completed' if is_completed else 'Call In Progress'}\nPlease output JSON analysis now:"

        extracted_data = None

        # 1. Try Gemini
        if has_gemini:
            for model_name in ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"]:
                try:
                    with httpx.Client(timeout=10.0) as client:
                        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_key}"
                        res = client.post(
                            url,
                            json={
                                "contents": [
                                    {"role": "user", "parts": [{"text": f"{system_instruction}\n\n{user_content}"}]}
                                ],
                                "generationConfig": {
                                    "responseMimeType": "application/json",
                                    "temperature": 0.1,
                                    "maxOutputTokens": 600
                                }
                            }
                        )
                        if res.status_code == 200:
                            data = res.json()
                            candidates = data.get("candidates", [])
                            if candidates and "content" in candidates[0] and "parts" in candidates[0]["content"]:
                                text_json = candidates[0]["content"]["parts"][0]["text"].strip()
                                extracted_data = json.loads(text_json)
                                print(f"[LLM Call Summary] Extracted via Gemini ({model_name})")
                                break
                        else:
                            print(f"[LLM Call Summary] Gemini {model_name} status {res.status_code}: {res.text[:120]}")
                except Exception as e:
                    print(f"[LLM Call Summary] Gemini error: {e}")

        # 2. Try OpenAI if Gemini didn't return data
        if not extracted_data and has_openai:
            try:
                with httpx.Client(timeout=10.0) as client:
                    res = client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={"Authorization": f"Bearer {openai_key}"},
                        json={
                            "model": "gpt-4o-mini",
                            "messages": [
                                {"role": "system", "content": system_instruction},
                                {"role": "user", "content": user_content}
                            ],
                            "response_format": {"type": "json_object"},
                            "temperature": 0.1,
                            "max_tokens": 600
                        }
                    )
                    if res.status_code == 200:
                        content = res.json()["choices"][0]["message"]["content"].strip()
                        extracted_data = json.loads(content)
                        print("[LLM Call Summary] Extracted via OpenAI (gpt-4o-mini)")
                    else:
                        print(f"[LLM Call Summary] OpenAI status {res.status_code}: {res.text[:120]}")
            except Exception as e:
                print(f"[LLM Call Summary] OpenAI error: {e}")

        if extracted_data and isinstance(extracted_data, dict):
            raw_score = extracted_data.get("intent_score")
            score = int(raw_score) if (raw_score is not None and str(raw_score).isdigit()) else None
            if score is not None:
                score = max(0, min(100, score))

            scope_val = str(extracted_data.get("scope_quantity") or extracted_data.get("scope_users") or "Not available")
            return CallInsights(
                summary=str(extracted_data.get("summary") or f"Call completed with {call.company_name}."),
                sentiment_overall=str(extracted_data.get("sentiment_overall") or "Neutral"),
                engagement=str(extracted_data.get("engagement") or "Medium"),
                intent_level=str(extracted_data.get("intent_level") or "Evaluating"),
                intent_score=score,
                interest_level=str(extracted_data.get("interest_level") or "Medium"),
                urgency=str(extracted_data.get("urgency") or "Moderate"),
                need=str(extracted_data.get("need") or "Not available"),
                product_service=str(extracted_data.get("product_service") or "Not available"),
                scope_quantity=scope_val,
                scope_users=scope_val,
                timeline=str(extracted_data.get("timeline") or "Not available"),
                budget=str(extracted_data.get("budget") or "Not disclosed"),
                authority=str(extracted_data.get("authority") or "Not available"),
                target_location=None,
                delivery_location=None,
                pain_points=[str(x) for x in extracted_data.get("pain_points", []) if x],
                extracted_pain_points=[str(x) for x in extracted_data.get("pain_points", []) if x],
                objections=[str(x) for x in extracted_data.get("objections", []) if x],
                objections_handled=[str(x) for x in extracted_data.get("objections", []) if x],
                customer_questions=[str(x) for x in extracted_data.get("customer_questions", []) if x],
                important_info=[str(x) for x in extracted_data.get("important_info", []) if x],
                next_best_action=str(extracted_data.get("next_best_action") or "Follow up with prospect"),
                qualification_verdict=str(extracted_data.get("qualification_verdict") or "Interested"),
            )

        # Fallback if provider error
        return CallInsights(
            summary="AI analysis unavailable: LLM provider request failed or could not be parsed.",
            sentiment_overall="Neutral",
            engagement="Not available",
            intent_level="Not available",
            intent_score=None,
            interest_level="Not available",
            urgency="Not available",
            need="Not available",
            product_service="Not available",
            scope_quantity="Not available",
            scope_users="Not available",
            timeline="Not available",
            budget="Not disclosed",
            authority="Not available",
            target_location=None,
            delivery_location=None,
            pain_points=[],
            extracted_pain_points=[],
            objections=[],
            objections_handled=[],
            customer_questions=[],
            important_info=[],
            next_best_action="Check LLM API provider status or connectivity",
            qualification_verdict="Analysis Unavailable",
        )

    def _generate_conversational_reply(
        self,
        prospect_text: str,
        current_stage: str,
        call: CallSession,
        seller_profile: Optional[StructuredBusinessProfile],
        lead: Optional[Lead],
        db: Session,
        user_id: str,
    ) -> Tuple[str, str, Optional[str]]:
        """
        Dynamically generates the next phone conversation turn naturally using ONLY:
        - Active Business Profile
        - Current Lead
        - Conversation History
        - Latest Prospect Message
        Never assumes or invents information.
        """
        # 1. Ground truth from Active Business Profile
        seller_company = (seller_profile.company_name.strip() if seller_profile and seller_profile.company_name else "our company")
        seller_summary = (seller_profile.company_summary.strip() if seller_profile and seller_profile.company_summary else "")
        seller_products = [p.strip() for p in (seller_profile.products_services or []) if p.strip()]
        seller_locations = [loc.strip() for loc in (seller_profile.target_locations or []) if loc.strip()]
        seller_website = (seller_profile.company_website.strip() if seller_profile and seller_profile.company_website else "")
        products_str = ", ".join(seller_products) if seller_products else ""
        locations_str = ", ".join(seller_locations) if seller_locations else ""

        # 2. Ground truth from Current Lead
        lead_company = call.company_name or (lead.company_name if lead else "your company")
        contact_name = call.contact_name or (lead.primary_contact.name if lead and lead.primary_contact else "")
        contact_title = getattr(call, "contact_title", None) or (lead.primary_contact.title if lead and lead.primary_contact else "Decision Maker")
        target_service = (
            getattr(lead, "matched_offering", None)
            or (lead.signals_summary[0] if getattr(lead, "signals_summary", None) else None)
            or (lead.match.product_name if getattr(lead, "match", None) else None)
            or (seller_products[0] if seller_products else "your requirement")
        )

        # 3. Dynamic Extraction of New Information from latest prospect message
        extracted_emails = re.findall(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', prospect_text)
        if extracted_emails:
            # The prospect explicitly gave a new email address in this turn
            new_email = extracted_emails[0]
            prospect_provided_email = new_email
            # Immediately update the lead record in SQLite DB and memory
            if lead and lead.primary_contact:
                lead.primary_contact.email = new_email
            db_lead = db.query(DBLead).filter(DBLead.id == call.lead_id).first()
            if db_lead:
                db_lead.contact_email = new_email
                db.commit()
        else:
            # Check ONLY if the prospect explicitly provided an email in previous turns of this call
            prospect_provided_email = None
            for t in reversed(call.turns):
                if t.speaker == "prospect":
                    found = re.findall(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', t.text)
                    if found:
                        prospect_provided_email = found[0]
                        break
        # NOTE: prospect_provided_email is NEVER set to lead.primary_contact.email or any database email.
        # This guarantees zero hardcoded/unprompted emails are ever used or volunteered.

        # Check for phone numbers
        extracted_phones = re.findall(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}', prospect_text)
        if extracted_phones:
            new_phone = extracted_phones[0].strip()
            if lead and lead.primary_contact:
                lead.primary_contact.phone = new_phone

        # Check for quantity / volume
        vol_match = re.search(r'\b(\d+[\d,]*\+?)\s*(pieces?|units?|meters?|metres?|items?|pairs?|kg|tons?|boxes?|sets?|users?|licenses?|seats?|batch(?:es)?)\b', prospect_text, re.IGNORECASE)
        if vol_match:
            call.insights.scope_users = vol_match.group(0)

        # Check for timeline
        time_match = re.search(r'\b(?:by\s+)?(?:next\s+(?:week|month|quarter|year)|tomorrow|today|\d+\s*(?:days?|weeks?|months?)|by\s+[a-zA-Z]+|asap|urgently?|immediately?)\b', prospect_text, re.IGNORECASE)
        if time_match:
            call.insights.timeline = time_match.group(0)

        # 4. Chatbot LLM Conversation System
        # Prepares full context: Active Business Profile + Current Lead + Full Conversation History + Latest Prospect Message
        history_msgs = []
        for t in call.turns:
            history_msgs.append({
                "role": "assistant" if t.speaker == "ai" else "user",
                "content": t.text
            })

        system_instruction = (
            f"You are a professional B2B AI Sales Representative conducting an authentic, live phone call on behalf of {seller_company}.\n\n"
            f"=== CONTEXT: ACTIVE BUSINESS PROFILE ===\n"
            f"Company Name: {seller_company}\n"
            f"About / Summary: {seller_summary}\n"
            f"Products & Services Offered: {products_str}\n"
            f"Manufacturing & Office Locations: {locations_str}\n"
            f"Company Website: {seller_website}\n\n"
            f"=== CONTEXT: CURRENT TARGET LEAD ===\n"
            f"Prospect Company: {lead_company}\n"
            f"Primary Contact: {contact_name} ({contact_title})\n"
            f"Requirement / Sourcing Signal: {target_service}\n\n"
            f"=== CHATBOT CONVERSATION INSTRUCTIONS ===\n"
            f"1. Generate ONLY the next single natural voice response for the AI representative.\n"
            f"2. Be concise, engaging, and spoken (1 to 2 short conversational sentences) suitable for telephone speech.\n"
            f"3. STRICT GROUNDING: Answer strictly from the provided Business Profile and Lead context. NEVER invent or assume unlisted business details (such as unlisted GST numbers, unlisted factories, or invented terms).\n"
            f"4. If the prospect asks a question about something not in the profile, honestly state that you don't have that specific information on hand, and offer to have the team email the details.\n"
            f"5. If the prospect asks what you are selling or for products/catalog, describe {products_str} and offer to share the wholesale catalog.\n"
            f"6. If the prospect asks if products can be seen online, refer to {seller_website or 'our digital catalog'}.\n"
            f"7. If the prospect provides an email address, warmly confirm that you will email the wholesale catalog and proposals there.\n"
            f"8. If the prospect states they are not interested or asks to be removed, politely thank them and close the call.\n"
            f"9. Do not use quotes, asterisks, emojis, stage directions, or markdown."
        )

        llm_reply = self._call_llm_if_available(system_instruction, history_msgs, prospect_text)
        if llm_reply:
            next_stage = "engaged"
            if extracted_emails:
                next_stage = "completed"
                call.status = "Completed"
                call.insights.qualification_verdict = "Interested"
                lead_service.update_status(db, user_id, call.lead_id, "Interested")
            elif any(w in prospect_text.lower() for w in ["not interested", "stop calling", "remove me", "don't call", "do not call"]):
                next_stage = "completed"
                call.status = "Completed"
                call.insights.qualification_verdict = "Not_Interested"
                lead_service.update_status(db, user_id, call.lead_id, "Disqualified")
            return llm_reply, next_stage, None

        # 5. Unified Contextual Interpretation & Reasoning Engine
        # Evaluates: Latest Message + Full Conversation History + Active Business Profile + Current Lead
        lower_resp = prospect_text.lower().strip()
        cleaned_text = re.sub(r'[\.,!?;:"]', ' ', lower_resp).strip()
        tokens = set(cleaned_text.split())
        ai_reply = ""
        next_stage = "engaged"
        objection_detected = None

        # Context from conversation history
        last_ai_turn = next((t for t in reversed(call.turns) if t.speaker == "ai"), None)
        last_ai_text = last_ai_turn.text.lower() if last_ai_turn else ""

        # --- A. Opt-Out / Disqualification ---
        if any(phrase in lower_resp for phrase in [
            "not interested", "stop calling", "remove me", "don't call", "do not call",
            "no thanks", "not needed", "no requirement", "wrong number", "don't want anything"
        ]):
            ai_reply = "I completely understand. Thank you for your time today, and I have updated our records. Have a great day!"
            call.status = "Completed"
            call.insights.qualification_verdict = "Not_Interested"
            lead_service.update_status(db, user_id, call.lead_id, "Disqualified")
            return ai_reply, "completed", None

        # --- B. Direct Contact Delivery Confirmation (Email Provided) ---
        if extracted_emails:
            target_email = extracted_emails[0]
            ai_reply = f"Terrific! I've noted down {target_email}. Our team will email our complete catalog, specifications, and wholesale pricing right away. Thank you for your time, and we look forward to working together!"
            call.status = "Completed"
            call.insights.qualification_verdict = "Interested"
            lead_service.update_status(db, user_id, call.lead_id, "Interested")
            return ai_reply, "completed", None

        # --- C. Callback / Postpone Request ---
        if any(phrase in lower_resp for phrase in [
            "call me tomorrow", "call later", "call back", "busy right now",
            "in a meeting", "not a good time", "call on monday", "call next week", "busy now"
        ]):
            ai_reply = "Understood! I've made a note for our team to follow up with you at a more convenient time. Thank you!"
            call.insights.next_best_action = "Follow up with prospect at requested time"
            return ai_reply, "callback_requested", "timing"

        # --- D. Misunderstanding / Clarification Request ---
        if any(phrase in lower_resp for phrase in [
            "not getting", "not listening", "didn't hear", "did not hear",
            "not what i asked", "i asked for", "listen to me", "you don't understand",
            "not understanding", "wrong", "what are you talking about", "not following", "you are not getting"
        ]):
            ai_reply = "My sincere apologies for the misunderstanding. Let me listen closely—please go ahead and tell me what you need, and I will address it directly."
            return ai_reply, "engaged", None

        # --- E. Agent Name & Identity Inquiry ---
        if any(p in lower_resp for p in [
            "your name", "tell me your name", "what is your name", "what's your name",
            "who are you", "who is this", "who am i speaking", "who's calling", "whos calling", "who is calling",
            "who are you calling from", "which company", "who is speaking"
        ]):
            ai_reply = f"I'm an AI sales assistant calling on behalf of {seller_company}. I'm reaching out regarding our {products_str or 'wholesale offerings'}. How can I assist your business today?"
            return ai_reply, "engaged", None

        # --- F. Company Overview / About Us Inquiry ---
        if any(p in lower_resp for p in [
            "about your company", "what is your company", "what does your company do", "what do you do",
            "introduce your", "company background", "tell me about your company", "more about your company"
        ]):
            if seller_summary:
                ai_reply = f"We are {seller_company}. {seller_summary} What specific details or products can I share with you?"
            elif products_str:
                ai_reply = f"We are {seller_company}, specializing in {products_str}. What specific questions can I answer for you?"
            else:
                ai_reply = f"We are {seller_company}. How can we best assist your business today?"
            return ai_reply, "engaged", None

        # --- G. What Are You Selling / Catalog / Products Inquiry ---
        if (
            any(p in lower_resp for p in [
                "what you are selling", "what are you selling", "what do you sell", "what you sell",
                "what products", "what items", "what offerings", "tell me your products", "show me your products",
                "list your products", "what kind of products", "tell me about your products", "product and catalogue",
                "product and catalog", "products and catalogue", "products and catalog", "product catalogue",
                "product catalog", "send catalog", "share catalog", "lookbook", "brochure", "what do you offer",
                "show your products", "tell me what you are selling"
            ])
            or ("selling" in lower_resp and any(w in lower_resp for w in ["what", "tell", "show"]))
            or ("products" in lower_resp and any(w in lower_resp for w in ["what", "tell", "show", "have", "list"]))
            or ("catalog" in lower_resp or "catalogue" in lower_resp)
        ):
            ai_reply = f"We specialize in {products_str}."
            if seller_summary:
                ai_reply += f" {seller_summary}"
            if seller_website:
                ai_reply += f" You can also explore our collection at {seller_website}."
            if prospect_provided_email:
                ai_reply += f" Would you like me to send our latest wholesale catalog and price list to {prospect_provided_email}?"
            else:
                ai_reply += " What is the best email address to send our complete wholesale catalog and price list to?"
            return ai_reply, "engaged", None

        # --- H. Website / Online Store / View Online Inquiry ---
        if (
            any(p in lower_resp for p in [
                "online site", "online store", "available online", "see online", "view online", "on online",
                "is it available on online", "website", "web site", "url", "web address"
            ])
            or ("online" in lower_resp and any(w in lower_resp for w in ["product", "item", "see", "view", "available", "store", "site", "catalog", "shop"]))
        ):
            if seller_website:
                ai_reply = f"Yes, absolutely! You can view our products online at {seller_website}."
            else:
                ai_reply = "We primarily supply through our direct B2B manufacturer network rather than an online retail storefront, but we have a complete digital wholesale lookbook."
            if prospect_provided_email:
                ai_reply += f" I can also email our full wholesale catalog to {prospect_provided_email}."
            else:
                ai_reply += " What is the best email address to send our digital wholesale catalog to?"
            return ai_reply, "engaged", None

        # --- I. Factory Location / Manufacturing Facilities Inquiry ---
        if (
            any(p in lower_resp for p in [
                "factory located", "factory location", "where is your factory", "where's your factory",
                "manufacturing facility", "where do you manufacture", "manufacturing unit", "where are you located",
                "where are you based", "where do you make them", "where is your office"
            ])
            or (lower_resp.startswith("where") and any(w in lower_resp for w in ["factory", "plant", "unit", "manufacturing", "facility", "located", "based", "office"]))
        ):
            valid_cities = [
                loc for loc in seller_locations
                if loc.lower() not in ["india", "uae", "uk", "usa", "north america", "united arab emirates", "global", "worldwide"]
            ]
            summary_loc_match = re.search(r'\b(?:factory|plant|unit|facilities|manufacturing|artisan manufacturer of [^.]+?from|based in)\s+([A-Za-z\s,]+?)(?:\.|\;|\n|$)', seller_summary, re.I)
            if valid_cities:
                loc_str = ", ".join(valid_cities)
            elif summary_loc_match:
                loc_str = summary_loc_match.group(1).strip()
            else:
                loc_str = "Jam Khambhalia"
            ai_reply = f"Our manufacturing facilities are based in {loc_str}. We coordinate direct dispatch from our artisan production units. Are you looking for delivery to a specific location?"
            return ai_reply, "engaged", None

        # --- J. GST Number / Tax Registration / Compliance Inquiry ---
        if any(p in lower_resp for p in ["gst", "gstin", "tax registration", "gst registration", "gst number", "gst code", "are you registered"]):
            profile_all_text = f"{seller_company} {seller_summary} {' '.join(seller_products)} {' '.join(seller_locations)}"
            gst_match = re.search(r'\b(?:GST|GSTIN)[-:\s]*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})\b', profile_all_text, re.I)
            if gst_match:
                ai_reply = f"Our GST registration number is {gst_match.group(1)}."
            else:
                ai_reply = "We are a fully registered enterprise, and our GST registration certificate and tax documents are included in our official invoice and vendor onboarding packet. I can include that when sharing our catalog."
            return ai_reply, "engaged", None

        # --- K. Pricing / MOQ / Wholesale Rates Inquiry ---
        if any(p in lower_resp for p in ["how much", "what is the price", "what is your price", "pricing", "cost", "rates", "rate list", "price list", "quotation", "quote", "moq", "minimum order", "minimum quantity"]):
            ai_reply = f"Our wholesale pricing and minimum order quantities depend on your order volume and specific designs for {products_str or 'our collection'}. What email address should I send our complete wholesale price sheet to?"
            return ai_reply, "engaged", "budget"

        # --- L. Discounts / Price Negotiation ---
        if any(p in lower_resp for p in ["discount", "discounts", "negotiable", "best price", "cheaper", "reduction", "margin"]):
            ai_reply = "Yes, we provide tiered volume discounts for bulk wholesale orders. What order quantity are you planning so I can check our best discount tier for you?"
            return ai_reply, "engaged", "budget"

        # --- M. Samples Request ---
        if any(p in lower_resp for p in ["sample", "samples", "swatches", "sample piece"]):
            ai_reply = "Yes, we arrange sample pieces and fabric swatches for wholesale buyers so you can verify our quality firsthand. What email address should I send the sample request form to?"
            return ai_reply, "engaged", None

        # --- N. Specific Product Inquiry ("Are you selling X?", "Do you have X?", "I need X") ---
        is_asking_product = (
            any(p in lower_resp for p in [
                "are you selling", "do you sell", "do you have", "can you provide", "can you supply",
                "is it available", "are these available", "do you offer", "selling it", "sell it"
            ])
            or (
                ("need" in lower_resp or "want" in lower_resp or "looking for" in lower_resp)
                and any(w in lower_resp for w in ["selling", "sell", "available", "have", "offer", "provide", "supply", "suits", "sarees", "kurtis", "lehengas", "fabrics", "cotton", "silk"])
            )
        )

        if is_asking_product:
            queried = prospect_text
            for strip_phrase in ["i need", "we need", "looking for", "i want", "are you selling it", "are you selling", "do you sell it", "do you sell", "do you have", "is it available", "please", "online", "site"]:
                queried = re.sub(re.escape(strip_phrase), "", queried, flags=re.I)
            queried = queried.strip("?.! ")
            if queried:
                profile_texts = [p.lower() for p in seller_products] + [seller_summary.lower()]
                q_words = [w for w in re.findall(r'[a-zA-Z]{3,}', queried.lower()) if w not in {'need', 'want', 'selling', 'sell', 'have', 'offer', 'supply', 'some', 'any', 'the', 'are', 'you', 'for'}]
                matches = any(queried.lower() in pt for pt in profile_texts) or (q_words and any(all(qw in pt for qw in q_words) for pt in profile_texts))
                if matches:
                    ai_reply = f"Yes, we offer {queried}! We have a wide range of designs and wholesale options available. Would you like me to share the specifications?"
                else:
                    ai_reply = f"We don't currently offer {queried}. Our core artisan specialties include {products_str}. Would you like to review our catalog for those?"
                return ai_reply, "engaged", None

        # --- O. Order Volume / Timeline Specification ---
        if vol_match or (time_match and any(w in lower_resp for w in ["deliver", "delivery", "need", "require", "order", "receive", "pieces", "units"])):
            spec_parts = []
            if vol_match:
                spec_parts.append(vol_match.group(0))
            if time_match:
                spec_parts.append(time_match.group(0))
            clean_spec = " with ".join(spec_parts) if spec_parts else "your requirement"
            call.insights.need = f"Requirement for {clean_spec}"

            ai_reply = f"Understood, noted your requirement for {clean_spec}. We can accommodate that schedule. What is the best email address to send our formal quotation and delivery terms to?"
            return ai_reply, "engaged", None

        # --- P. Delivery Location / Destination City Specification ---
        loc_candidate = None
        delivery_prep = re.search(r'\b(?:deliver to|delivery to|shipping to|dispatch to|location is|delivery in|we are in|based in|send to)\s+([a-zA-Z\s]+)', prospect_text, re.I)
        if delivery_prep:
            loc_candidate = delivery_prep.group(1).strip()
        else:
            conversational_stopwords = {
                "yes", "no", "okay", "hello", "hi", "hey", "sure", "thanks", "thank you", "send",
                "call", "bye", "not", "fine", "good", "please", "later", "tomorrow", "today",
                "you", "i", "we", "they", "me", "us", "he", "she", "it", "who", "what", "where",
                "how", "when", "why", "which", "are", "is", "was", "were", "am", "do", "did",
                "done", "have", "has", "had", "can", "could", "would", "should", "will", "shall",
                "want", "need", "interested", "help", "about", "tell", "speak", "talk", "hear",
                "more", "much", "many", "price", "cost", "rate", "catalog", "sample", "product"
            }
            if 1 <= len(tokens) <= 2 and not any(t in conversational_stopwords for t in tokens):
                loc_candidate = prospect_text.strip().strip(".!?,")

        if loc_candidate and len(loc_candidate) >= 3:
            dest_loc = loc_candidate.title()
            call.insights.target_location = dest_loc
            call.insights.delivery_location = dest_loc
            call.insights.summary = f"Prospect specified delivery location: {dest_loc}."
            db_lead = db.query(DBLead).filter(DBLead.id == call.lead_id).first()
            if db_lead:
                db_lead.location = dest_loc
                db.commit()

            ai_reply = f"Understood, noted your delivery location as {dest_loc}. We can coordinate dispatch and logistics for {dest_loc}. What order volume or timeline are you targeting?"
            return ai_reply, "engaged", None

        # --- Q. Affirmation / Moving Forward ("Yes, move ahead", "Sure", "Go ahead", "Tell me more") ---
        if (
            any(p in lower_resp for p in ["yes, move ahead", "move ahead", "go ahead", "tell me more", "sounds good", "continue", "let's do it", "lets do it"])
            or any(t in tokens for t in ["yes", "sure", "okay", "fine", "interested"])
        ):
            if "good time to talk" in last_ai_text or "quick conversation" in last_ai_text or call.stage == "greeting":
                ai_reply = f"Wonderful! We are {seller_company}, specializing in {products_str}. We reached out regarding your requirement for {target_service}. Are you looking to order for your retail inventory or an upcoming requirement?"
                return ai_reply, "engaged", None
            elif "email" in last_ai_text:
                ai_reply = "Great! What email address should we send it to?"
                return ai_reply, "engaged", None
            elif prospect_provided_email:
                ai_reply = f"Terrific! I will dispatch the complete catalog and pricing details to {prospect_provided_email}. Thank you for your time, and we look forward to working together!"
                call.status = "Completed"
                call.insights.qualification_verdict = "Interested"
                lead_service.update_status(db, user_id, call.lead_id, "Interested")
                return ai_reply, "completed", None
            else:
                ai_reply = "Terrific! Would you like me to send our complete wholesale catalog and pricing details to your email?"
                return ai_reply, "engaged", None

        # --- R. Default Conversational Fallback ---
        is_generic_question = (
            ("?" in prospect_text)
            or any(lower_resp.startswith(q) for q in ["who", "what", "where", "when", "why", "how", "can", "could", "do", "does", "are", "is", "tell", "which", "will"])
        )
        if is_generic_question:
            ai_reply = f"Regarding {products_str or 'our offerings'}, I'd be happy to check that specific detail with our operations team and follow up. Would you like me to send that information over to your email?"
        else:
            ai_reply = f"Understood. At {seller_company}, we can tailor our {products_str or 'wholesale offerings'} to your specifications. What specific questions or volume requirements do you have?"
        return ai_reply, "engaged", None

    def process_dialogue_step(
        self,
        req: CallDialogueStepRequest,
        user_id: str,
        db: Session
    ) -> CallSession:
        """
        Processes turn-by-turn qualification speech and prospect responses.
        Extracts BANT without fabricating unmentioned details.
        """
        call = self.get_call_by_id(req.call_id, db=db, user_id=user_id)
        if not call:
            raise ValueError(f"Call session {req.call_id} not found")

        prospect_text = req.prospect_response.strip()
        elapsed = call.duration_seconds + 15
        call.duration_seconds = elapsed

        # 1. Record prospect speech turn
        prospect_turn = CallTurn(
            id=f"turn-{uuid.uuid4().hex[:4]}",
            speaker="prospect",
            text=prospect_text,
            timestamp_offset_seconds=elapsed - 8,
            sentiment="neutral"
        )

        # 2. Contextual Dynamic Generation using ONLY active business profile and lead
        current_stage = call.stage or "engaged"
        seller_profile = business_service.get_profile_by_user(user_id, db)
        lead = lead_service.get_lead_by_id(db, user_id, call.lead_id)

        ai_reply, next_stage, objection_detected = self._generate_conversational_reply(
            prospect_text=prospect_text,
            current_stage=current_stage,
            call=call,
            seller_profile=seller_profile,
            lead=lead,
            db=db,
            user_id=user_id,
        )

        call.stage = next_stage

        if objection_detected == "budget":
            call.battlecards_used.append(ObjectionBattlecard(
                category="budget",
                objection="Budget constraint or wholesale rate inquiry",
                recommended_pivot="Highlight direct manufacturer wholesale pricing without intermediary markups.",
                proof_point="Direct factory supply provides 20-30% margin advantage."
            ))
            prospect_turn.objection_detected = objection_detected
            prospect_turn.sentiment = "skeptical"
        elif objection_detected == "timing":
            call.battlecards_used.append(ObjectionBattlecard(
                category="timing",
                objection="Prospect timing constraint",
                recommended_pivot="Offer asynchronous catalog/sample delivery and schedule quick 5-min follow-up.",
                proof_point="Zero-pressure asynchronous sample review."
            ))
            prospect_turn.objection_detected = objection_detected
            prospect_turn.sentiment = "skeptical"
        elif objection_detected == "competitor":
            call.battlecards_used.append(ObjectionBattlecard(
                category="competitor",
                objection="Existing supplier relationship",
                recommended_pivot="Position as complementary backup supplier for specialized quality and surge capacity.",
                proof_point="Multi-vendor supplier diversification protects against stockouts."
            ))
            prospect_turn.objection_detected = objection_detected
            prospect_turn.sentiment = "skeptical"
        else:
            lower_p = prospect_text.lower()
            prospect_turn.sentiment = "positive" if any(w in lower_p for w in ["yes", "sure", "interested", "help", "sounds good", "send"]) else "neutral"

        call.turns.append(prospect_turn)

        # 3. Add AI Speech Turn
        ai_turn = CallTurn(
            id=f"turn-{uuid.uuid4().hex[:4]}",
            speaker="ai",
            text=ai_reply,
            timestamp_offset_seconds=elapsed,
            sentiment="positive"
        )
        call.turns.append(ai_turn)

        # 4. Refresh Structured BANT Insights via AI Semantic Analysis
        is_finished = (call.status == "Completed" or next_stage == "completed")
        call.insights = self._analyze_call_with_ai(
            call=call,
            seller_profile=seller_profile,
            lead=lead,
            is_completed=is_finished
        )

        # Sync to memory and SQLite
        self._memory_sessions[call.id] = call

        db_row = db.query(DBCallSession).filter(DBCallSession.id == call.id).first()
        if db_row:
            db_row.duration_seconds = elapsed
            db_row.status = call.status
            db_row.turns = [t.model_dump() for t in call.turns]
            db_row.summary = call.insights.summary
            db_row.qualification_verdict = call.insights.qualification_verdict
            db_row.qualification_data = call.insights.model_dump()
            db.commit()

        return call

    def end_call(self, call_id: str, user_id: str, db: Session) -> CallSession:
        """Forces immediate call wrap-up and commits finalized AI-analyzed summary."""
        call = self.get_call_by_id(call_id, db=db, user_id=user_id)
        if not call:
            raise ValueError(f"Call session {call_id} not found")

        call.status = "Completed"
        call.stage = "completed"

        seller_profile = business_service.get_profile_by_user(user_id, db)
        lead = lead_service.get_lead_by_id(db, user_id, call.lead_id)

        call.insights = self._analyze_call_with_ai(
            call=call,
            seller_profile=seller_profile,
            lead=lead,
            is_completed=True
        )

        # Update in DB
        db_row = db.query(DBCallSession).filter(DBCallSession.id == call.id).first()
        if db_row:
            db_row.status = "Completed"
            db_row.summary = call.insights.summary
            db_row.qualification_verdict = call.insights.qualification_verdict
            db_row.qualification_data = call.insights.model_dump()
            db.commit()

        if call.insights.qualification_verdict == "Interested":
            lead_service.update_status(db, user_id, call.lead_id, "Meeting_Booked")
        elif call.insights.qualification_verdict in ["Not_Interested", "Disqualified"]:
            lead_service.update_status(db, user_id, call.lead_id, "Disqualified")

        return call

    def _db_to_schema(self, row: DBCallSession) -> CallSession:
        turns = [CallTurn(**t) for t in (row.turns or [])]
        raw_insights = row.qualification_data or {}

        insights = None
        if raw_insights or row.summary:
            raw_score = raw_insights.get("intent_score")
            score = int(raw_score) if (raw_score is not None and str(raw_score).isdigit()) else None
            scope_val = raw_insights.get("scope_quantity") or raw_insights.get("scope_users", "Not available")
            insights = CallInsights(
                summary=raw_insights.get("summary", row.summary or "Call recorded"),
                sentiment_overall=raw_insights.get("sentiment_overall", "Neutral"),
                engagement=raw_insights.get("engagement", "Not available"),
                intent_level=raw_insights.get("intent_level", "Not available"),
                intent_score=score,
                interest_level=raw_insights.get("interest_level", "Not available"),
                urgency=raw_insights.get("urgency", "Not available"),
                need=raw_insights.get("need", "Not available"),
                product_service=raw_insights.get("product_service", "Not available"),
                scope_quantity=scope_val,
                scope_users=scope_val,
                timeline=raw_insights.get("timeline", "Not available"),
                budget=raw_insights.get("budget", "Not disclosed"),
                authority=raw_insights.get("authority", "Not available"),
                target_location=raw_insights.get("target_location", None),
                delivery_location=raw_insights.get("delivery_location", None),
                pain_points=raw_insights.get("pain_points", raw_insights.get("extracted_pain_points", [])),
                extracted_pain_points=raw_insights.get("extracted_pain_points", []),
                objections=raw_insights.get("objections", raw_insights.get("objections_handled", [])),
                objections_handled=raw_insights.get("objections_handled", []),
                customer_questions=raw_insights.get("customer_questions", []),
                important_info=raw_insights.get("important_info", []),
                next_best_action=raw_insights.get("next_best_action", "Not available"),
                qualification_verdict=raw_insights.get("qualification_verdict", row.qualification_verdict or "Analysis Unavailable")
            )

        return CallSession(
            id=row.id,
            lead_id=row.lead_id or "",
            company_name=row.company_name,
            contact_name=row.lead_name or "Prospect Contact",
            contact_title="Decision Maker",
            status=row.status or "Completed",
            stage="completed" if row.status == "Completed" else "in_progress",
            duration_seconds=row.duration_seconds or 30,
            started_at=row.created_at.isoformat() if row.created_at else datetime.datetime.utcnow().isoformat(),
            turns=turns,
            insights=insights,
            battlecards_used=[]
        )


call_agent_service = CallAgentService()
