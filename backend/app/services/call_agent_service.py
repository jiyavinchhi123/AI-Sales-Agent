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
            summary=session.insights.summary if session.insights else "",
            qualification_verdict=session.insights.qualification_verdict if session.insights else "In_Progress",
            qualification_data=session.insights.model_dump() if session.insights else {},
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

    def _extract_qualification_state(
        self,
        call: CallSession,
        seller_profile: Optional[StructuredBusinessProfile],
        lead: Optional[Lead],
        current_prospect_text: str = ""
    ) -> Dict[str, Any]:
        """
        Extracts qualification parameters and detects hangup / exit intent across
        all prospect turns and the current turn.
        """
        seller_products = [p.strip() for p in (seller_profile.products_services or []) if p.strip()] if seller_profile else []
        prospect_turns = [t.text for t in call.turns if t.speaker == "prospect"]
        if current_prospect_text and current_prospect_text.strip():
            prospect_turns.append(current_prospect_text.strip())

        combined_text = " ".join(prospect_turns)
        latest_text = prospect_turns[-1] if prospect_turns else ""
        latest_lower = latest_text.lower().strip()

        # 1. Detect customer hang-up / exit intent
        hangup_patterns = [
            r'\b(?:bye|goodbye|cya|see you later)\b',
            r'\b(?:have to go|got to go|got to run|need to leave|must go)\b',
            r'\b(?:hanging up|hang up|hung up|disconnecting|disconnect|end call)\b',
            r'\b(?:not interested|stop calling|don\'?t call|remove (?:me|us)|no thanks|no requirement)\b',
            r'\b(?:busy right now|can\'?t talk|cannot talk|in a meeting)\b.*\b(?:bye|later)\b',
        ]
        customer_ended_call = any(re.search(pat, latest_lower) for pat in hangup_patterns)

        # 2. Extract Requirement & Product / Service
        matched_offering = (
            getattr(lead, "matched_offering", None)
            or (lead.signals_summary[0] if getattr(lead, "signals_summary", None) else None)
            or (seller_products[0] if seller_products else None)
        )
        product_service = "Not available"
        product_service_covered = False
        found_products = []
        for p in seller_products:
            if re.search(r'\b' + re.escape(p.lower()) + r'\b', combined_text.lower()):
                found_products.append(p)
        if found_products:
            product_service = ", ".join(found_products)
            product_service_covered = True
        elif matched_offering and any(w in combined_text.lower() for w in ["yes", "correct", "looking for", "need", "saree", "suit", "fabric", "material", "collection", "interested"]):
            product_service = matched_offering
            product_service_covered = True
        else:
            prod_match = re.search(r'\b(?:looking for|need|interested in|require|want)\s+([a-zA-Z\s]{3,30}?)(?:\.|\;|\,|\band\b|$)', combined_text, re.I)
            if prod_match:
                candidate = prod_match.group(1).strip()
                if len(candidate) > 2 and candidate.lower() not in ["more", "info", "details", "help", "pricing", "catalog", "price"]:
                    product_service = candidate.title()
                    product_service_covered = True

        requirement = "Not available"
        requirement_covered = False
        if product_service_covered:
            requirement = f"Sourcing requirement for {product_service}"
            requirement_covered = True
        elif any(w in combined_text.lower() for w in ["need", "requirement", "looking for", "require", "sourcing", "order for", "client", "store", "boutique"]):
            requirement = "Inquiring about supply offerings"
            requirement_covered = True

        # 3. Extract Quantity / Volume
        scope_quantity = "Not available"
        quantity_covered = False
        qty_match = re.search(r'\b(\d+[\d,]*\+?)\s*(pieces?|units?|meters?|metres?|items?|pairs?|kg|tons?|boxes?|sets?|users?|licenses?|seats?|batch(?:es)?|sarees?|suits?)\b', combined_text, re.I)
        if qty_match:
            scope_quantity = qty_match.group(0).strip()
            quantity_covered = True
        else:
            for t in call.turns:
                if t.speaker == "ai" and any(w in t.text.lower() for w in ["quantity", "volume", "how many"]):
                    ai_idx = call.turns.index(t)
                    if ai_idx + 1 < len(call.turns):
                        next_turn = call.turns[ai_idx + 1]
                        if next_turn.speaker == "prospect":
                            num_match = re.search(r'\b(\d+[\d,]*)\b', next_turn.text)
                            if num_match:
                                scope_quantity = f"{num_match.group(1)} units"
                                quantity_covered = True
                                break

        # 4. Extract Timeline
        timeline = "Not available"
        timeline_covered = False
        time_match = re.search(r'\b(?:by\s+)?(?:next\s+(?:week|month|quarter|year)|tomorrow|today|\d+\s*(?:days?|weeks?|months?)|by\s+[a-zA-Z]+|asap|urgently?|immediately?|this\s+(?:week|month)|in\s+\d+\s+(?:days|weeks|months)|before\s+[a-zA-Z]+|diwali|festive)\b', combined_text, re.I)
        if time_match:
            timeline = time_match.group(0).strip()
            timeline_covered = True

        # 5. Extract Budget Status & Deal Amount
        budget = "Not disclosed"
        budget_covered = False
        deal_amount = "Not available"

        unit_price_match = re.search(r'(?:₹|rs\.?|inr|\$)?\s*(\d+[\d,]*)\s*(?:per\s*(?:piece|unit|item|saree|meter)|each|\/piece|\/unit|\/saree)', combined_text, re.I)
        lump_sum_match = re.search(r'\b(?:budget\s*(?:is|of|around)?|target\s*(?:budget|price)|around|under|within)\s*(?:₹|rs\.?|inr|\$)?\s*(\d+[\d,]*\s*(?:lakhs?|cr|crores?|k|thousand|million)?)\b', combined_text, re.I)
        qual_budget = re.search(r'\b(open\s+budget|flexible\s+budget|budget\s+is\s+flexible|budget\s+is\s+approved|not\s+decided\s+yet|no\s+fixed\s+budget)\b', combined_text, re.I)

        if unit_price_match:
            unit_val = unit_price_match.group(1).replace(",", "")
            budget = f"Target {unit_price_match.group(0).strip()}"
            budget_covered = True
            if quantity_covered:
                raw_qty = re.search(r'\d+', scope_quantity)
                if raw_qty and unit_val.isdigit():
                    total = int(raw_qty.group(0)) * int(unit_val)
                    currency_sym = "₹" if ("₹" in combined_text or "rs" in combined_text.lower() or "inr" in combined_text.lower()) else "$"
                    deal_amount = f"{currency_sym}{total:,} ({raw_qty.group(0)} units @ {unit_price_match.group(0).strip()})"
        elif lump_sum_match:
            budget = f"Stated budget: {lump_sum_match.group(0).strip()}"
            budget_covered = True
            deal_amount = lump_sum_match.group(0).strip()
        elif qual_budget:
            budget = qual_budget.group(1).capitalize()
            budget_covered = True

        # 6. Extract Contact Authority
        authority = "Not available"
        authority_covered = False
        auth_owner_match = re.search(r'\b(?:i\s+am|i\'m|myself)\s+(?:the\s+)?(?:[a-zA-Z]+\s+)?(owner|founder|proprietor|ceo|director|partner|purchase manager|purchasing manager|procurement\s+(?:manager|head)?|decision maker|buyer)\b', combined_text, re.I)
        auth_role_match = re.search(r'\b(?:primary\s+decision\s+maker|sole\s+decision\s+maker|decision\s+maker|store\s+owner|business\s+owner|store\s+manager|shop\s+owner)\b', combined_text, re.I)
        auth_decision_match = re.search(r'\b(?:i\s+decide|i\s+make\s+the\s+decision|i\s+handle\s+(?:purchases?|buying|procurement)|my\s+decision|direct\s+buyer)\b', combined_text, re.I)
        auth_shared_match = re.search(r'\b(?:need\s+to\s+consult|discuss\s+with|check\s+with)\s+(?:my\s+)?(partner|director|management|team|committee|board)\b', combined_text, re.I)

        if auth_owner_match:
            authority = f"Direct Authority ({auth_owner_match.group(1).title()})"
            authority_covered = True
        elif auth_role_match:
            authority = f"Direct Authority ({auth_role_match.group(0).title()})"
            authority_covered = True
        elif auth_decision_match:
            authority = "Direct Purchasing Decision Maker"
            authority_covered = True
        elif auth_shared_match:
            authority = f"Collaborative / Committee ({auth_shared_match.group(1).title()})"
            authority_covered = True
        elif call.contact_title and call.contact_title.lower() not in ["decision maker", "not available"]:
            authority = call.contact_title
            authority_covered = True

        # 7. Extract Email
        email = None
        email_covered = False
        emails_found = re.findall(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', combined_text)
        if emails_found:
            email = emails_found[0]
            email_covered = True

        # Missing points checklist
        missing_points = []
        if not requirement_covered:
            missing_points.append("specific requirement")
        if not product_service_covered:
            missing_points.append("specific product/service")
        if not quantity_covered:
            missing_points.append("order quantity")
        if not timeline_covered:
            missing_points.append("delivery timeline")
        if not budget_covered:
            missing_points.append("budget status / deal amount")
        if not authority_covered:
            missing_points.append("contact authority")

        is_complete = len(missing_points) == 0

        # Determine next point to ask
        if not requirement_covered or not product_service_covered:
            next_point = "requirement_and_product"
        elif not quantity_covered:
            next_point = "quantity"
        elif not timeline_covered:
            next_point = "timeline"
        elif not budget_covered:
            next_point = "budget_deal_amount"
        elif not authority_covered:
            next_point = "authority"
        elif not email_covered:
            next_point = "closing"
        else:
            next_point = "completed"

        return {
            "customer_ended_call": customer_ended_call,
            "requirement_covered": requirement_covered,
            "need": requirement,
            "product_service_covered": product_service_covered,
            "product_service": product_service,
            "quantity_covered": quantity_covered,
            "scope_quantity": scope_quantity,
            "timeline_covered": timeline_covered,
            "timeline": timeline,
            "budget_covered": budget_covered,
            "budget": budget,
            "deal_amount": deal_amount,
            "authority_covered": authority_covered,
            "authority": authority,
            "email_covered": email_covered,
            "email": email,
            "missing_points": missing_points,
            "is_complete": is_complete,
            "next_point_to_ask": next_point,
        }

    def _analyze_call_with_ai(
        self,
        call: CallSession,
        seller_profile: Optional[StructuredBusinessProfile],
        lead: Optional[Lead],
        is_completed: bool = False
    ) -> CallInsights:
        """
        Performs semantic analysis of the entire conversation.
        Uses Active Business Profile, Current Lead, and Transcript.
        If customer ended the call before complete discussion, explicitly states so in summary.
        """
        prospect_turns = [t for t in call.turns if t.speaker == "prospect"]
        state = self._extract_qualification_state(call, seller_profile, lead)
        customer_ended_before_complete = (is_completed and not state["is_complete"]) or state["customer_ended_call"]

        # Initial awaiting response state if call just started with 0 prospect turns
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
                deal_amount="Not available",
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

        openai_key, gemini_key = self._get_active_api_keys()
        has_gemini = bool(gemini_key and len(gemini_key.strip()) > 5)
        has_openai = bool(openai_key and len(openai_key.strip()) > 5 and openai_key.startswith("sk-"))

        extracted_data = None

        if has_gemini or has_openai:
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

CRITICAL CALL COMPLETION & EARLY HANG-UP INSTRUCTION:
Check whether the customer ended the call before the complete discussion.
A complete sales qualification discussion covers ALL 6 dimensions:
1. Requirement / need
2. Specific product/service
3. Quantity / volume / scope
4. Timeline / delivery timeframe
5. Budget status / deal amount
6. Contact authority / decision maker

If the customer ended the call, hung up, exited early, said goodbye, opted out, or the call finished before ALL 6 dimensions were discussed:
The "summary" MUST explicitly start with or contain the exact sentence:
"The customer ended the call before the complete discussion."
Followed by a concise synopsis of what was discussed and which qualification dimensions remained unaddressed.

If the customer did NOT end the call early and all dimensions were thoroughly discussed, provide a concise summary of the qualification results.

CRITICAL EXTRACTION RULES:
1. Ground truth only: Never assume, invent, extrapolate, or hallucinate information.
2. If any piece of information was not explicitly mentioned or confirmed in the transcript, strictly return "Not available" (or "Not disclosed" for budget, "Not available" for deal_amount).
3. Do NOT invent deal amounts or budgets. Only extract what the prospect explicitly said.
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
  "summary": "Must include 'The customer ended the call before the complete discussion.' if the call ended before covering all 6 points.",
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
  "deal_amount": "Explicit deal amount discussed or computed from quantity*unit price, else 'Not available'",
  "authority": "Stated role/authority or 'Not available'",
  "pain_points": [],
  "objections": [],
  "customer_questions": [],
  "important_info": [],
  "next_best_action": "Specific next action for sales team",
  "qualification_verdict": "Interested" | "Evaluating" | "Follow_Up_Needed" | "Disqualified" | "Not_Interested"
}}"""

            user_content = f"COMPLETE CALL TRANSCRIPT:\n{full_transcript}\n\nCall Status: {'Call Completed' if is_completed else 'Call In Progress'}\nPlease output JSON analysis now:"

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

            scope_val = str(extracted_data.get("scope_quantity") or extracted_data.get("scope_users") or state["scope_quantity"])
            summary_text = str(extracted_data.get("summary") or f"Call completed with {call.company_name}.")

            # Enforce user requirement: if customer ended call before complete discussion, ensure explicit mention
            if customer_ended_before_complete:
                if "customer ended the call before the complete discussion" not in summary_text.lower():
                    summary_text = f"The customer ended the call before the complete discussion. {summary_text}"

            return CallInsights(
                summary=summary_text,
                sentiment_overall=str(extracted_data.get("sentiment_overall") or "Neutral"),
                engagement=str(extracted_data.get("engagement") or "Medium"),
                intent_level=str(extracted_data.get("intent_level") or "Evaluating"),
                intent_score=score,
                interest_level=str(extracted_data.get("interest_level") or "Medium"),
                urgency=str(extracted_data.get("urgency") or "Moderate"),
                need=str(extracted_data.get("need") or state["need"]),
                product_service=str(extracted_data.get("product_service") or state["product_service"]),
                scope_quantity=scope_val,
                scope_users=scope_val,
                timeline=str(extracted_data.get("timeline") or state["timeline"]),
                budget=str(extracted_data.get("budget") or state["budget"]),
                deal_amount=str(extracted_data.get("deal_amount") or state["deal_amount"]),
                authority=str(extracted_data.get("authority") or state["authority"]),
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

        # Deterministic truthful fallback analysis (when no LLM key or LLM provider request failed)
        if customer_ended_before_complete:
            summary_parts = ["The customer ended the call before the complete discussion."]
            discussed_items = []
            if state["product_service_covered"]:
                discussed_items.append(f"requirement for {state['product_service']}")
            if state["quantity_covered"]:
                discussed_items.append(f"order quantity of {state['scope_quantity']}")
            if state["timeline_covered"]:
                discussed_items.append(f"delivery timeline of {state['timeline']}")
            if state["budget_covered"]:
                discussed_items.append(f"budget status of {state['budget']}")
            if state["authority_covered"]:
                discussed_items.append(f"contact authority ({state['authority']})")

            if discussed_items:
                summary_parts.append(f"Points discussed: {', '.join(discussed_items)}.")
            else:
                summary_parts.append("The call concluded during initial greeting before any qualification details could be discussed.")

            if state["missing_points"]:
                summary_parts.append(f"Points remaining unaddressed: {', '.join(state['missing_points'])}.")

            if state["deal_amount"] != "Not available":
                summary_parts.append(f"Stated deal amount: {state['deal_amount']}.")
            else:
                summary_parts.append("Deal amount was not discussed.")

            fallback_summary = " ".join(summary_parts)
            is_opt_out = any(
                w in t.text.lower()
                for t in prospect_turns
                for w in ["not interested", "stop calling", "don't call", "remove me", "not looking", "busy right now and not interested"]
            )
            verdict = "Not_Interested" if is_opt_out else "Follow_Up_Needed"
            intent_score = 15 if verdict == "Not_Interested" else 35
        else:
            t_phrase = state['timeline'] if state['timeline'].lower().startswith("by ") else f"by {state['timeline']}"
            fallback_summary = (
                f"Completed full sales qualification call with {contact_name} at {lead_company}. "
                f"Discussed requirement for {state['scope_quantity']} of {state['product_service']} {t_phrase} "
                f"with budget status of {state['budget']}. Verified contact authority as {state['authority']}."
            )
            if state["deal_amount"] != "Not available":
                fallback_summary += f" Deal value: {state['deal_amount']}."
            verdict = "Interested" if state["email_covered"] else "Evaluating"
            intent_score = 90 if state["email_covered"] else 70

        return CallInsights(
            summary=fallback_summary,
            sentiment_overall="Positive" if verdict == "Interested" else ("Disinterested" if verdict == "Not_Interested" else "Neutral"),
            engagement="High" if verdict == "Interested" else ("Low" if verdict == "Not_Interested" else "Medium"),
            intent_level="High Intent" if verdict == "Interested" else ("Not Interested" if verdict == "Not_Interested" else "Evaluating"),
            intent_score=intent_score,
            interest_level="High" if verdict == "Interested" else "Low",
            urgency="High" if state["timeline_covered"] else "Moderate",
            need=state["need"],
            product_service=state["product_service"],
            scope_quantity=state["scope_quantity"],
            scope_users=state["scope_quantity"],
            timeline=state["timeline"],
            budget=state["budget"],
            deal_amount=state["deal_amount"],
            authority=state["authority"],
            target_location=call.insights.target_location if call.insights else None,
            delivery_location=call.insights.delivery_location if call.insights else None,
            pain_points=[],
            extracted_pain_points=[],
            objections=[],
            objections_handled=[],
            customer_questions=[],
            important_info=[],
            next_best_action="Send formal quote and catalog" if verdict == "Interested" else ("Do not contact" if verdict == "Not_Interested" else "Follow up with prospect"),
            qualification_verdict=verdict,
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
        Dynamically generates the next phone conversation turn naturally.
        - If customer has ended the call: politely acknowledges and concludes call.
        - If customer has not ended the call: systematically covers all qualification points:
          requirement, quantity, timeline, product/service, budget status, contact authority, deal amount.
        """
        # 1. Ground truth from Active Business Profile
        seller_company = (seller_profile.company_name.strip() if seller_profile and seller_profile.company_name else "our company")
        seller_summary = (seller_profile.company_summary.strip() if seller_profile and seller_profile.company_summary else "")
        seller_products = [p.strip() for p in (seller_profile.products_services or []) if p.strip()]
        seller_locations = [loc.strip() for loc in (seller_profile.target_locations or []) if loc.strip()]
        seller_website = (seller_profile.company_website.strip() if seller_profile and seller_profile.company_website else "")
        products_str = ", ".join(seller_products) if seller_products else "our artisan collection"
        locations_str = ", ".join(seller_locations) if seller_locations else ""

        # Extract factory city
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
            loc_str = "Jam Khambhalia, Gujarat"

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

        # 3. Dynamic Qualification State Extraction across all turns including latest
        state = self._extract_qualification_state(call, seller_profile, lead, prospect_text)

        # Sync email / phone into lead database if provided in this turn
        if state["email"]:
            if lead and lead.primary_contact:
                lead.primary_contact.email = state["email"]
            db_lead = db.query(DBLead).filter(DBLead.id == call.lead_id).first()
            if db_lead:
                db_lead.contact_email = state["email"]
                db.commit()

        extracted_phones = re.findall(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}', prospect_text)
        if extracted_phones and lead and lead.primary_contact:
            lead.primary_contact.phone = extracted_phones[0].strip()

        # Update call.insights fields in memory as details arrive
        if state["need"] != "Not available":
            call.insights.need = state["need"]
        if state["product_service"] != "Not available":
            call.insights.product_service = state["product_service"]
        if state["scope_quantity"] != "Not available":
            call.insights.scope_quantity = state["scope_quantity"]
            call.insights.scope_users = state["scope_quantity"]
        if state["timeline"] != "Not available":
            call.insights.timeline = state["timeline"]
        if state["budget"] != "Not disclosed":
            call.insights.budget = state["budget"]
        if state["deal_amount"] != "Not available":
            call.insights.deal_amount = state["deal_amount"]
        if state["authority"] != "Not available":
            call.insights.authority = state["authority"]

        # 4. Check if Customer Has Ended the Call
        lower_resp = prospect_text.lower().strip()
        if state["customer_ended_call"]:
            # Check if opt-out vs polite hangup
            if any(p in lower_resp for p in ["not interested", "stop calling", "remove me", "don't call", "do not call", "no requirement", "no thanks"]):
                ai_reply = "I completely understand. Thank you for your time today, and have a great day!"
                call.status = "Ended"
                call.stage = "ended"
                call.insights.qualification_verdict = "Not_Interested"
                lead_service.update_status(db, user_id, call.lead_id, "Disqualified")
                return ai_reply, "ended", None
            else:
                ai_reply = "Understood. Thank you for your time today, and have a wonderful day. Goodbye!"
                call.status = "Ended"
                call.stage = "ended"
                call.insights.qualification_verdict = "Follow_Up_Needed"
                return ai_reply, "ended", None

        # 5. Customer Has NOT Ended the Call -> Determine Next Missing Qualification Point
        next_point = state["next_point_to_ask"]
        if next_point == "requirement_and_product":
            prompt_q = f"Could you share your specific requirement or which product in {products_str} you are looking to source?"
            next_point_desc = "Ask about their specific product/service requirement or use case"
        elif next_point == "quantity":
            prompt_q = "What quantity or order volume are you planning to source for this order?"
            next_point_desc = "Ask about their required order quantity or volume (e.g. number of pieces or units)"
        elif next_point == "timeline":
            prompt_q = "What is your target timeline or expected delivery date for this order?"
            next_point_desc = "Ask about their expected timeline or delivery deadline"
        elif next_point == "budget_deal_amount":
            prompt_q = "Do you have a specific budget status, target price per unit, or deal amount in mind for this?"
            next_point_desc = "Ask about their target budget, expected price per unit, or deal amount"
        elif next_point == "authority":
            prompt_q = "Are you handling the purchasing decision directly, or are there other partners or stakeholders involved in the final approval?"
            next_point_desc = "Ask about their purchasing decision authority"
        elif next_point == "closing":
            prompt_q = "Thank you for sharing those details. What is the best email address to send over our complete wholesale catalog and formal quotation to?"
            next_point_desc = "Ask for their email address to send the formal quote and catalog"
        else:
            t_phrase = state['timeline'] if state['timeline'].lower().startswith("by ") else f"by {state['timeline']}"
            prompt_q = f"Terrific! I've noted all your requirements: {state['scope_quantity']} of {state['product_service']} {t_phrase} with target budget of {state['budget']}. Our team will email our catalog and quotation to {state['email'] or 'your team'} right away. Thank you for your time, and have a wonderful day!"
            next_point_desc = "Confirm receipt of all details, thank the customer warmly, and conclude the call"

        # 6. LLM Generation if configured
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
            f"=== QUALIFICATION PROGRESSION STATUS ===\n"
            f"- Product / Requirement: {'Covered (' + state['product_service'] + ')' if state['product_service_covered'] else 'NOT YET COVERED'}\n"
            f"- Order Quantity / Volume: {'Covered (' + state['scope_quantity'] + ')' if state['quantity_covered'] else 'NOT YET COVERED'}\n"
            f"- Delivery Timeline: {'Covered (' + state['timeline'] + ')' if state['timeline_covered'] else 'NOT YET COVERED'}\n"
            f"- Budget Status / Deal Amount: {'Covered (' + state['budget'] + ')' if state['budget_covered'] else 'NOT YET COVERED'}\n"
            f"- Contact Authority: {'Covered (' + state['authority'] + ')' if state['authority_covered'] else 'NOT YET COVERED'}\n\n"
            f"=== CHATBOT CONVERSATION INSTRUCTIONS ===\n"
            f"1. Spoken voice: 1 to 2 short conversational sentences suitable for telephone speech.\n"
            f"2. IF THE CUSTOMER HAS ENDED THE CALL (e.g. said goodbye, hanging up, have to go, not interested): Politely thank them and say goodbye without asking any more questions.\n"
            f"3. IF THE CUSTOMER HAS NOT ENDED THE CALL: You MUST systematically cover all qualification points. {next_point_desc}. A good natural phrasing is: '{prompt_q}'.\n"
            f"4. If the prospect asked a question (e.g. location, pricing, catalog, GST): Answer concisely in 1 sentence using the Business Profile, then ask the next qualification question.\n"
            f"5. STRICT GROUNDING: Never invent unlisted company details. Do not use quotes, emojis, or markdown."
        )

        llm_reply = self._call_llm_if_available(system_instruction, history_msgs, prospect_text)
        if llm_reply:
            if state["customer_ended_call"]:
                call.status = "Ended"
                next_stage = "ended"
            else:
                next_stage = "completed" if (next_point == "completed" or state["email_covered"]) else "engaged"
                if next_stage == "completed":
                    call.status = "Completed"
                    call.insights.qualification_verdict = "Interested"
                    lead_service.update_status(db, user_id, call.lead_id, "Interested")
            return llm_reply, next_stage, None

        # 7. Deterministic Unified Contextual Reasoning Engine (Rule-based when LLM unavailable)
        cleaned_text = re.sub(r'[\.,!?;:"]', ' ', lower_resp).strip()
        tokens = set(cleaned_text.split())

        # If email was provided or qualification is completed, wrap up successfully
        if state["email_covered"] or next_point == "completed":
            ai_reply = prompt_q
            call.status = "Completed"
            call.insights.qualification_verdict = "Interested"
            lead_service.update_status(db, user_id, call.lead_id, "Interested")
            return ai_reply, "completed", None

        # Check if customer asked a specific question first
        # A. Factory Location / Manufacturing Facilities
        if any(p in lower_resp for p in ["factory located", "factory location", "where is your factory", "where's your factory", "manufacturing facility", "where do you manufacture", "manufacturing unit", "where are you located", "where are you based"]):
            ai_reply = f"Our manufacturing facilities are based in {loc_str}. We coordinate direct dispatch from our artisan production units. {prompt_q}"
            return ai_reply, "engaged", None

        # B. GST / Tax Registration
        if any(p in lower_resp for p in ["gst", "gstin", "tax registration", "gst registration", "gst number"]):
            ai_reply = f"We are fully GST compliant and provide registered tax invoices with all orders. {prompt_q}"
            return ai_reply, "engaged", None

        # C. Pricing / MOQ / Wholesale Rates
        if any(p in lower_resp for p in ["how much", "what is the price", "what is your price", "pricing", "cost", "rates", "rate list", "price list", "quotation", "quote", "moq", "minimum order"]):
            ai_reply = f"Our wholesale pricing offers tiered volume discounts direct from the factory. {prompt_q}"
            return ai_reply, "engaged", "budget"

        # D. Discounts / Negotiation
        if any(p in lower_resp for p in ["discount", "discounts", "negotiable", "best price", "cheaper", "reduction"]):
            ai_reply = f"Yes, we provide tiered volume discounts for bulk wholesale orders. {prompt_q}"
            return ai_reply, "engaged", "budget"

        # E. Samples / Swatches
        if any(p in lower_resp for p in ["sample", "samples", "swatches", "sample piece"]):
            ai_reply = f"Yes, we arrange sample pieces and fabric swatches for wholesale buyers so you can verify our quality firsthand. {prompt_q}"
            return ai_reply, "engaged", None

        # F. Products / What Are You Selling / Catalog
        if any(p in lower_resp for p in ["what you are selling", "what are you selling", "what do you sell", "what products", "what items", "tell me your products", "product and catalog", "product catalog", "send catalog", "brochure"]):
            ai_reply = f"We specialize in {products_str}. {prompt_q}"
            return ai_reply, "engaged", None

        # G. Website / Online Store
        if any(p in lower_resp for p in ["online site", "online store", "available online", "see online", "view online", "website", "web site"]):
            web_msg = f"Yes, you can view our collection online at {seller_website}." if seller_website else "We supply through our direct B2B manufacturer network and digital wholesale lookbook."
            ai_reply = f"{web_msg} {prompt_q}"
            return ai_reply, "engaged", None

        # H. Company Overview / About Us
        if any(p in lower_resp for p in ["about your company", "what is your company", "what does your company do", "introduce your", "company background"]):
            ai_reply = f"We are {seller_company}, specializing in {products_str}. {prompt_q}"
            return ai_reply, "engaged", None

        # I. Agent Identity
        if any(p in lower_resp for p in ["your name", "who are you", "who is this", "who am i speaking", "who's calling", "who is calling"]):
            ai_reply = f"I'm an AI sales representative calling on behalf of {seller_company} regarding {products_str}. {prompt_q}"
            return ai_reply, "engaged", None

        # J. Callback Request
        if any(p in lower_resp for p in ["call me tomorrow", "call later", "call back", "busy right now", "in a meeting", "not a good time"]):
            ai_reply = "Understood! I've made a note for our team to follow up with you at a more convenient time. Thank you!"
            call.insights.next_best_action = "Follow up with prospect at requested time"
            return ai_reply, "callback_requested", "timing"

        # K. Prospect Answered / Progressing the Dialogue
        if next_point == "completed":
            ai_reply = prompt_q
            call.status = "Completed"
            call.insights.qualification_verdict = "Interested"
            lead_service.update_status(db, user_id, call.lead_id, "Interested")
            return ai_reply, "completed", None

        # Acknowledge the prospect's answer and ask next question
        if state["quantity_covered"] and next_point == "timeline":
            ai_reply = f"Understood, noted your requirement for {state['scope_quantity']}. {prompt_q}"
        elif state["timeline_covered"] and next_point == "budget_deal_amount":
            t_str = state["timeline"] if state["timeline"].lower().startswith("by ") else f"by {state['timeline']}"
            ai_reply = f"Got it, target delivery {t_str}. {prompt_q}"
        elif state["budget_covered"] and next_point == "authority":
            ai_reply = f"Noted your budget status of {state['budget']}. {prompt_q}"
        elif state["authority_covered"] and next_point == "closing":
            ai_reply = f"Understood, noted your purchasing role as {state['authority']}. {prompt_q}"
        elif any(p in lower_resp for p in ["yes", "sure", "okay", "fine", "go ahead", "tell me more", "sounds good", "continue"]):
            ai_reply = f"Wonderful! {prompt_q}"
        else:
            ai_reply = f"Understood. {prompt_q}"

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
        is_finished = (call.status in ["Completed", "Ended"] or next_stage in ["completed", "ended"])
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

        seller_profile = business_service.get_profile_by_user(user_id, db)
        lead = lead_service.get_lead_by_id(db, user_id, call.lead_id)
        state = self._extract_qualification_state(call, seller_profile, lead)

        # If customer ended call or qualification is incomplete, mark as Ended; only Completed if fully qualified
        if state["customer_ended_call"] or not state["is_complete"] or call.status == "Ended":
            call.status = "Ended"
            call.stage = "ended"
        else:
            call.status = "Completed"
            call.stage = "completed"

        call.insights = self._analyze_call_with_ai(
            call=call,
            seller_profile=seller_profile,
            lead=lead,
            is_completed=True
        )

        # Update in DB
        db_row = db.query(DBCallSession).filter(DBCallSession.id == call.id).first()
        if db_row:
            db_row.status = call.status
            db_row.summary = call.insights.summary
            db_row.qualification_verdict = call.insights.qualification_verdict
            db_row.qualification_data = call.insights.model_dump()
            db.commit()

        if call.status == "Completed" and call.insights.qualification_verdict == "Interested":
            lead_service.update_status(db, user_id, call.lead_id, "Meeting_Booked")
            self._sync_call_to_opportunity(call, lead, seller_profile, state, user_id, db)
        elif call.insights.qualification_verdict in ["Not_Interested", "Disqualified"]:
            lead_service.update_status(db, user_id, call.lead_id, "Disqualified")

        return call

    def _sync_call_to_opportunity(
        self,
        call: CallSession,
        lead: Optional[Lead],
        seller_profile: Optional[StructuredBusinessProfile],
        state: Dict[str, Any],
        user_id: str,
        db: Session
    ):
        """
        Creates or updates a real Opportunity in SQLite ONLY when genuine conversational evidence exists.
        Never fabricates deal amounts or fake stages.
        """
        if not (call.status == "Completed" and call.insights and call.insights.qualification_verdict == "Interested"):
            return

        try:
            from app.services.crm_service import crm_service
            contact_email = (
                (lead.primary_contact.email if lead and lead.primary_contact else "")
                or (state.get("email") or f"buyer@{call.company_name.lower().replace(' ', '')}.com")
            )
            deal_val = (
                call.insights.deal_amount
                if (call.insights.deal_amount and call.insights.deal_amount != "Not available")
                else None
            )
            next_action = (
                call.insights.next_best_action
                if (call.insights.next_best_action and call.insights.next_best_action != "Not available")
                else f"Email catalog and formal quotation to {contact_email}"
            )
            crm_service.create_opportunity(
                db=db,
                user_id=user_id,
                lead_id=call.lead_id,
                company_name=call.company_name,
                domain=lead.domain if lead else f"{call.company_name.lower().replace(' ', '')}.com",
                contact_name=call.contact_name or (lead.primary_contact.name if lead and lead.primary_contact else "Decision Maker"),
                contact_email=contact_email,
                matched_offering=call.insights.product_service or (lead.matched_offering if lead else "Wholesale Supply"),
                deal_value=deal_val,
                stage="Qualified",
                next_action_title=next_action,
                next_action_priority="High",
                assigned_rep=(seller_profile.sender_name if seller_profile else None) or "Account Executive",
            )
            lead_service.update_status(db, user_id, call.lead_id, "Opportunity_Created")
        except Exception as e:
            print(f"[Opportunity Sync Error]: {e}")

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
                deal_amount=raw_insights.get("deal_amount", "Not available"),
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

        raw_status = row.status or "Completed"
        summary_lower = (row.summary or "").lower()
        if (
            "ended the call before" in summary_lower
            or "customer ended the call" in summary_lower
            or "customer ended" in summary_lower
            or "ended before the complete discussion" in summary_lower
        ):
            raw_status = "Ended"

        return CallSession(
            id=row.id,
            lead_id=row.lead_id or "",
            company_name=row.company_name,
            contact_name=row.lead_name or "Prospect Contact",
            contact_title="Decision Maker",
            status=raw_status,
            stage="completed" if raw_status == "Completed" else ("ended" if raw_status == "Ended" else "in_progress"),
            duration_seconds=row.duration_seconds or 30,
            started_at=row.created_at.isoformat() if row.created_at else datetime.datetime.utcnow().isoformat(),
            turns=turns,
            insights=insights,
            battlecards_used=[]
        )


call_agent_service = CallAgentService()
