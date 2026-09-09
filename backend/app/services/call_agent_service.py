"""AI Sales Calling and Dialogue Agent Service"""

from typing import List, Optional
import uuid
import datetime
from app.schemas.call import (
    CallSession, CallTurn, CallInsights, ObjectionBattlecard,
    StartCallRequest, CallDialogueStepRequest
)
class CallAgentService:
    def __init__(self):
        self._calls: List[CallSession] = []

    def get_all_calls(self) -> List[CallSession]:
        return self._calls


    def get_call_by_id(self, call_id: str) -> Optional[CallSession]:
        for c in self._calls:
            if c.id == call_id:
                return c
        return None

    def start_call(self, req: StartCallRequest, lead_company: str, contact_name: str, contact_title: str) -> CallSession:
        call_id = f"call-{uuid.uuid4().hex[:6]}"
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        initial_turn = CallTurn(
            id=f"turn-{uuid.uuid4().hex[:4]}",
            speaker="ai",
            text=(
                f"Hi {contact_name.split()[0]}, this is Alex reaching out from CloudArmor AI. "
                f"I've been following {lead_company}'s rapid cloud expansion and noticed you're gearing up "
                f"for major enterprise customer security reviews. Are you currently leading that audit preparation?"
            ),
            timestamp_offset_seconds=0,
            sentiment="positive"
        )

        session = CallSession(
            id=call_id,
            lead_id=req.lead_id,
            company_name=lead_company,
            contact_name=contact_name,
            contact_title=contact_title,
            status="In_Progress",
            duration_seconds=20,
            started_at=now_iso,
            turns=[initial_turn],
            insights=None,
            battlecards_used=[]
        )
        self._calls.insert(0, session)
        return session

    def process_dialogue_step(self, req: CallDialogueStepRequest) -> CallSession:
        call = self.get_call_by_id(req.call_id)
        if not call:
            raise ValueError(f"Call session {req.call_id} not found")

        prospect_text = req.prospect_response.strip()
        elapsed = call.duration_seconds + 25
        call.duration_seconds = elapsed

        # Prospect turn
        prospect_turn = CallTurn(
            id=f"turn-{uuid.uuid4().hex[:4]}",
            speaker="prospect",
            text=prospect_text,
            timestamp_offset_seconds=elapsed - 15,
            sentiment="neutral"
        )

        # Objection detection and AI response generator
        lower_resp = prospect_text.lower()
        ai_reply = ""
        objection_detected = None

        if "budget" in lower_resp or "cost" in lower_resp or "expensive" in lower_resp or "freeze" in lower_resp:
            objection_detected = "budget"
            ai_reply = (
                "I completely respect budget considerations. What most engineering leaders tell us is that "
                "spending $20k on an automated platform saves upwards of $120k in senior DevOps billable hours "
                "spent manually gathering audit evidence. We also offer a flexible quarterly model. Could we test "
                "it on a single sandbox cluster at no cost first?"
            )
            call.battlecards_used.append(ObjectionBattlecard(
                category="budget",
                objection="Budget constraint / spend freeze",
                recommended_pivot="Compare software cost against 150+ hours of senior engineering detour.",
                proof_point="Average ROI realized within 45 days of SOC 2 audit readiness."
            ))
        elif "competitor" in lower_resp or "already have" in lower_resp or "aws" in lower_resp or "native" in lower_resp:
            objection_detected = "competitor"
            ai_reply = (
                "That makes total sense—most teams have native cloud alerts turned on. The key difference is that "
                "native tools flood your inbox with raw alerts without fixing anything. CloudArmor actually writes "
                "and verifies Terraform pull requests to remediate issues automatically, and packages evidence for auditors."
            )
            call.battlecards_used.append(ObjectionBattlecard(
                category="competitor",
                objection="Existing native security tooling in place",
                recommended_pivot="Emphasize actionable Terraform PR remediation over raw notification fatigue.",
                proof_point="Reduces alert fatigue by 82% compared to default AWS Security Hub."
            ))
        elif "busy" in lower_resp or "timing" in lower_resp or "next quarter" in lower_resp or "later" in lower_resp:
            objection_detected = "timing"
            ai_reply = (
                "Understood on the timing—your team is heads-down shipping core product. The reason we reached out "
                "now is that compliance prep typically takes 90 days if done manually. If we can show you in 15 minutes "
                "how to automate 90% of that upfront, would next Tuesday morning be worth a brief chat?"
            )
        elif "demo" in lower_resp or "yes" in lower_resp or "interested" in lower_resp or "schedule" in lower_resp:
            ai_reply = (
                "Fantastic! I will lock in a 25-minute technical discovery session for our solutions architect. "
                "I will send a calendar invite along with our SOC 2 acceleration blueprint. Looking forward to our discussion!"
            )
            call.status = "Completed"
        else:
            ai_reply = (
                "That makes complete sense. We specifically built CloudArmor so engineering teams don't have to "
                "interrupt their development roadmap. If you're open to it, I can share a 2-minute interactive demo "
                "link directly to your inbox."
            )

        if objection_detected:
            prospect_turn.objection_detected = objection_detected
            prospect_turn.sentiment = "skeptical"

        call.turns.append(prospect_turn)

        # AI Turn
        ai_turn = CallTurn(
            id=f"turn-{uuid.uuid4().hex[:4]}",
            speaker="ai",
            text=ai_reply,
            timestamp_offset_seconds=elapsed,
            sentiment="positive"
        )
        call.turns.append(ai_turn)

        # Auto-update insights
        call.insights = CallInsights(
            summary=f"Engaged with {call.contact_name} at {call.company_name}. Handled objection '{objection_detected or 'general inquiry'}' successfully.",
            sentiment_overall="Positive" if call.status == "Completed" else "Engaged",
            interest_level="High" if "demo" in lower_resp or "yes" in lower_resp else "Medium",
            urgency="High",
            budget_indicator="Under review / evaluating business case",
            timeline_indicator="Targeting solution within 30-60 days",
            extracted_pain_points=["Engineering time lost to security questionnaires", "Audit compliance requirements"],
            objections_handled=[f"{objection_detected}: Addressed with ROI & Terraform auto-PR comparison"] if objection_detected else [],
            qualification_verdict="Qualified_Interested" if call.status == "Completed" else "Needs_Followup"
        )

        return call


call_agent_service = CallAgentService()
