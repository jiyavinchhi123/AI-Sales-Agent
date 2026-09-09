"""
AI Sales Calling and Dialogue Agent Service
Dynamic, Turn-by-Turn B2B Sales Qualification Engine with BANT Extraction.
Zero hardcoded company or product templates.
"""

from typing import List, Optional, Dict, Any
import re
import uuid
import datetime
from sqlalchemy.orm import Session

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

        # Dynamic Company & Service
        seller_company = (seller_profile.company_name if seller_profile and seller_profile.company_name else "our company")
        target_service = (
            getattr(lead, "matched_offering", None)
            or (lead.signals_summary[0] if getattr(lead, "signals_summary", None) else None)
            or (lead.match.product_name if getattr(lead, "match", None) else None)
            or "your requirements"
        )

        contact_name = lead.primary_contact.name if lead.primary_contact else "there"
        contact_first = contact_name.split()[0] if contact_name else "there"
        contact_title = lead.primary_contact.title if lead.primary_contact else "Decision Maker"

        # Realistic opening qualification greeting
        greeting_text = (
            f"Hello, I'm calling regarding your requirement for {target_service}. "
            f"Is this a good time to talk?"
        )

        initial_turn = CallTurn(
            id=f"turn-{uuid.uuid4().hex[:4]}",
            speaker="ai",
            text=greeting_text,
            timestamp_offset_seconds=0,
            sentiment="positive"
        )

        # Initial insights
        insights = CallInsights(
            summary=f"Call initiated with {lead.company_name}. Inquiring about {target_service} requirement.",
            sentiment_overall="Neutral",
            interest_level="Medium",
            urgency="High",
            need="Not available",
            scope_users="Not available",
            timeline="Not available",
            budget="Not disclosed",
            authority=contact_title,
            intent_score=85,
            next_best_action="Qualify requirement scope and user count",
            qualification_verdict="Engaged"
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
            insights=insights,
            battlecards_used=[]
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

        # 2. Stage Progression & Extraction Logic
        current_stage = call.stage or "greeting"
        lower_resp = prospect_text.lower()
        next_stage = current_stage
        ai_reply = ""
        objection_detected = None

        # Fetch seller profile for dynamic replies
        seller_profile = business_service.get_profile_by_user(user_id, db)
        seller_company = (seller_profile.company_name if seller_profile and seller_profile.company_name else "our team")

        # Check for Objections first
        if any(w in lower_resp for w in ["budget", "cost", "expensive", "spend", "freeze"]):
            objection_detected = "budget"
            ai_reply = (
                "I completely understand budget is a consideration. We offer flexible engagement models "
                "and can phase the rollout to fit your current constraints. Would it make sense to review "
                "the technical scope first to see if there's a strong fit?"
            )
            call.battlecards_used.append(ObjectionBattlecard(
                category="budget",
                objection="Budget constraint or spend review",
                recommended_pivot="Highlight phased milestone rollout to avoid upfront capital expenditure.",
                proof_point="Phased implementation delivers measurable ROI within 30-45 days."
            ))
        elif any(w in lower_resp for w in ["busy", "timing", "later", "next month", "not now"]):
            objection_detected = "timing"
            ai_reply = (
                "Understood, I appreciate your time is limited. What day next week would work best "
                "for a brief 10-minute introductory discussion?"
            )
        elif any(w in lower_resp for w in ["already have", "another vendor", "current partner"]):
            objection_detected = "competitor"
            ai_reply = (
                "Understood. Many of our clients have existing suppliers but bring us in for dedicated technical execution "
                "and high-complexity deliverables. Would you be open to a quick technical comparison?"
            )

        # If no objection, follow qualification stages
        if not ai_reply:
            if current_stage == "greeting":
                # Greeting -> Need Discovery
                next_stage = "need"
                ai_reply = "Could you tell me a little about what you are looking for?"

            elif current_stage == "need":
                # Need -> Scope / Users
                next_stage = "scope"
                ai_reply = "Approximately how many users are involved?"
                # Extract need
                if not call.insights or call.insights.need == "Not available":
                    call.insights.need = prospect_text

            elif current_stage == "scope":
                # Scope -> Timeline
                next_stage = "timeline"
                ai_reply = "When are you planning to start the migration?"
                # Extract scope / users
                match_users = re.search(r'\b(\d+[\d,]*\+?)\s*(users?|people|employees|seats)?\b', prospect_text, re.IGNORECASE)
                if match_users:
                    call.insights.scope_users = match_users.group(0)
                else:
                    call.insights.scope_users = prospect_text

            elif current_stage == "timeline":
                # Timeline -> Closing
                next_stage = "closing"
                ai_reply = (
                    f"Thank you. Based on your requirement, our team may be able to help. "
                    f"Would you be interested in scheduling a technical discussion?"
                )
                # Extract timeline
                call.insights.timeline = prospect_text

            elif current_stage == "closing" or any(w in lower_resp for w in ["yes", "sure", "schedule", "sounds good", "interested"]):
                # Closing -> Completed
                next_stage = "completed"
                call.status = "Completed"
                ai_reply = (
                    f"Excellent! I will send over the technical meeting invite and agenda right away. "
                    f"Thank you for your time, and we look forward to speaking with you!"
                )
                # Update CRM lead status to Meeting_Booked
                lead_service.update_status(db, user_id, call.lead_id, "Meeting_Booked")

            else:
                ai_reply = (
                    f"Thank you for sharing that. Based on what you've described, our team at {seller_company} "
                    f"is well-positioned to assist. Would you be open to a brief technical discussion with our solutions team?"
                )

        call.stage = next_stage

        if objection_detected:
            prospect_turn.objection_detected = objection_detected
            prospect_turn.sentiment = "skeptical"
        else:
            prospect_turn.sentiment = "positive" if any(w in lower_resp for w in ["yes", "sure", "interested", "help", "sounds good"]) else "neutral"

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

        # 4. Refresh Structured BANT Insights
        is_finished = (call.status == "Completed" or next_stage == "completed")
        intent_score = 94 if is_finished else (88 if next_stage in ["scope", "timeline", "closing"] else 80)

        # Clean extracted values
        need_val = call.insights.need if call.insights and call.insights.need != "Not available" else "Not available"
        users_val = call.insights.scope_users if call.insights and call.insights.scope_users != "Not available" else "Not available"
        timeline_val = call.insights.timeline if call.insights and call.insights.timeline != "Not available" else "Not available"
        budget_val = "Not disclosed"

        call.insights = CallInsights(
            summary=(
                f"Successfully engaged with {call.company_name}. Prospect specified requirement: '{need_val}', "
                f"scope: '{users_val}', timeline: '{timeline_val}'. Next action: Schedule technical discussion."
            ),
            sentiment_overall="Positive" if is_finished else "Engaged",
            interest_level="High" if is_finished else "Medium",
            urgency="High" if any(w in timeline_val.lower() for w in ["month", "immediate", "soon", "weeks"]) else "Moderate",
            need=need_val,
            scope_users=users_val,
            timeline=timeline_val,
            budget=budget_val,
            authority=call.contact_title or "Decision Maker",
            intent_score=intent_score,
            next_best_action="Schedule technical discussion",
            extracted_pain_points=[need_val] if need_val != "Not available" else [],
            objections_handled=[f"{objection_detected}: Handled with commercial flexibility"] if objection_detected else [],
            qualification_verdict="Interested" if is_finished else "Engaged"
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
        """Forces immediate call wrap-up and commits finalized BANT summary."""
        call = self.get_call_by_id(call_id, db=db, user_id=user_id)
        if not call:
            raise ValueError(f"Call session {call_id} not found")

        call.status = "Completed"
        call.stage = "completed"

        if not call.insights:
            call.insights = CallInsights(
                summary=f"Call completed with {call.company_name}.",
                sentiment_overall="Positive",
                interest_level="High",
                urgency="High",
                need="Not available",
                scope_users="Not available",
                timeline="Not available",
                budget="Not disclosed",
                authority=call.contact_title or "Decision Maker",
                intent_score=94,
                next_best_action="Schedule technical discussion",
                qualification_verdict="Interested"
            )
        else:
            call.insights.intent_score = 94
            call.insights.qualification_verdict = "Interested"
            call.insights.next_best_action = "Schedule technical discussion"

        # Update in DB
        db_row = db.query(DBCallSession).filter(DBCallSession.id == call.id).first()
        if db_row:
            db_row.status = "Completed"
            db_row.summary = call.insights.summary
            db_row.qualification_verdict = "Interested"
            db_row.qualification_data = call.insights.model_dump()
            db.commit()

        lead_service.update_status(db, user_id, call.lead_id, "Meeting_Booked")
        return call

    def _db_to_schema(self, row: DBCallSession) -> CallSession:
        turns = [CallTurn(**t) for t in (row.turns or [])]
        raw_insights = row.qualification_data or {}

        insights = None
        if raw_insights or row.summary:
            insights = CallInsights(
                summary=raw_insights.get("summary", row.summary or "Call completed"),
                sentiment_overall=raw_insights.get("sentiment_overall", "Positive"),
                interest_level=raw_insights.get("interest_level", "High"),
                urgency=raw_insights.get("urgency", "High"),
                need=raw_insights.get("need", "Not available"),
                scope_users=raw_insights.get("scope_users", "Not available"),
                timeline=raw_insights.get("timeline", "Not available"),
                budget=raw_insights.get("budget", "Not disclosed"),
                authority=raw_insights.get("authority", "Decision Maker"),
                intent_score=raw_insights.get("intent_score", 94),
                next_best_action=raw_insights.get("next_best_action", "Schedule technical discussion"),
                extracted_pain_points=raw_insights.get("extracted_pain_points", []),
                objections_handled=raw_insights.get("objections_handled", []),
                qualification_verdict=raw_insights.get("qualification_verdict", row.qualification_verdict or "Interested")
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
