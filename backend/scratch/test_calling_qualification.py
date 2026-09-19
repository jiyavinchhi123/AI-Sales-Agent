import sys
import os

# Ensure utf-8 output encoding for console
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.lead import Lead as DBLead
from app.models.business import CompanyProfile as DBBusinessProfile
from app.schemas.call import StartCallRequest, CallDialogueStepRequest
from app.services.call_agent_service import call_agent_service
from app.services.lead_service import lead_service
from app.services.business_service import business_service

def test_calling_flow():
    db = SessionLocal()
    try:
        user = db.query(User).first()
        if not user:
            print("No user found in DB!")
            return

        lead = db.query(DBLead).filter(DBLead.user_id == user.id).first()
        if not lead:
            print("No lead found in DB!")
            return

        print(f"Testing with User: {user.id}, Lead: {lead.id} ({lead.company_name})")

        # ==========================================
        # TEST 1: Customer ends call early ("bye")
        # ==========================================
        print("\n--- TEST 1: Early Customer Hang-up ---")
        start_req = StartCallRequest(lead_id=lead.id)
        session1 = call_agent_service.start_call(
            req=start_req,
            lead=lead_service.get_lead_by_id(db, user.id, lead.id),
            seller_profile=business_service.get_profile_by_user(user.id, db),
            user_id=user.id,
            db=db
        )
        print(f"Call started: {session1.id}. AI greeting: {session1.turns[0].text}")

        # Customer responds by saying they are busy and hanging up
        step_req = CallDialogueStepRequest(
            call_id=session1.id,
            prospect_response="I am very busy right now, have to go, bye!"
        )
        session1 = call_agent_service.process_dialogue_step(step_req, user.id, db)
        print(f"AI response: {session1.turns[-1].text}")
        print(f"Call status: {session1.status}")
        print(f"Summary: {session1.insights.summary}")

        assert session1.status == "Ended", f"Call status should be Ended, got: {session1.status}"
        assert "customer ended the call before the complete discussion" in session1.insights.summary.lower(), (
            f"Expected 'customer ended the call before the complete discussion' in summary, got: {session1.insights.summary}"
        )
        print(">>> TEST 1 PASSED: Early hang-up status is Ended and explicitly noted in summary!")

        # ==========================================
        # TEST 2: User clicks End Call prematurely
        # ==========================================
        print("\n--- TEST 2: UI End Call Button Prematurely ---")
        session2 = call_agent_service.start_call(
            req=start_req,
            lead=lead_service.get_lead_by_id(db, user.id, lead.id),
            seller_profile=business_service.get_profile_by_user(user.id, db),
            user_id=user.id,
            db=db
        )
        # Customer discusses requirement only
        step_req2 = CallDialogueStepRequest(
            call_id=session2.id,
            prospect_response="Yes, we need Modal Silk Sarees."
        )
        session2 = call_agent_service.process_dialogue_step(step_req2, user.id, db)
        print(f"AI asked: {session2.turns[-1].text}")

        # Now user clicks End Call
        session2 = call_agent_service.end_call(session2.id, user.id, db)
        print(f"Summary after End Call: {session2.insights.summary}")

        assert session2.status == "Ended", f"Call status should be Ended, got: {session2.status}"
        assert "customer ended the call before the complete discussion" in session2.insights.summary.lower(), (
            f"Expected 'customer ended the call before the complete discussion' in summary, got: {session2.insights.summary}"
        )
        print(">>> TEST 2 PASSED: Premature End Call status is Ended and explicitly noted in summary!")

        # ==========================================
        # TEST 3: Complete discussion covering ALL points
        # ==========================================
        print("\n--- TEST 3: Complete Qualification Dialogue ---")
        session3 = call_agent_service.start_call(
            req=start_req,
            lead=lead_service.get_lead_by_id(db, user.id, lead.id),
            seller_profile=business_service.get_profile_by_user(user.id, db),
            user_id=user.id,
            db=db
        )

        turns_input = [
            ("Customer asks about factory location", "Where is your factory located?"),
            ("Customer specifies requirement/product", "We are looking for Modal Silk Sarees."),
            ("Customer specifies quantity", "We need 500 pieces."),
            ("Customer specifies timeline", "We need delivery by next month."),
            ("Customer specifies budget/deal amount", "Our target price is ₹750 per saree."),
            ("Customer specifies authority", "I am the store owner and primary decision maker."),
            ("Customer provides email for closing", "Send the catalog and quote to buyer@testboutique.com")
        ]

        for desc, prospect_msg in turns_input:
            print(f"\n[Prospect]: {prospect_msg}")
            s_req = CallDialogueStepRequest(call_id=session3.id, prospect_response=prospect_msg)
            session3 = call_agent_service.process_dialogue_step(s_req, user.id, db)
            print(f"[AI Sales Agent]: {session3.turns[-1].text}")

        print("\n=== FINAL QUALIFICATION INSIGHTS ===")
        print(f"Product: {session3.insights.product_service}")
        print(f"Quantity: {session3.insights.scope_quantity}")
        print(f"Timeline: {session3.insights.timeline}")
        print(f"Budget: {session3.insights.budget}")
        print(f"Deal Amount: {session3.insights.deal_amount}")
        print(f"Authority: {session3.insights.authority}")
        print(f"Summary: {session3.insights.summary}")

        assert session3.insights.product_service != "Not available", "Product should be covered"
        assert session3.insights.scope_quantity != "Not available", "Quantity should be covered"
        assert session3.insights.timeline != "Not available", "Timeline should be covered"
        assert session3.insights.budget != "Not disclosed", "Budget should be covered"
        assert session3.insights.deal_amount != "Not available", "Deal amount should be covered"
        assert session3.insights.authority != "Not available", "Authority should be covered"
        assert "customer ended the call before the complete discussion" not in session3.insights.summary.lower(), (
            "Complete discussion should NOT say ended before complete discussion"
        )
        print(">>> TEST 3 PASSED: Full qualification covers all 6 points + deal amount + closing!")

    finally:
        db.close()

if __name__ == "__main__":
    test_calling_flow()
