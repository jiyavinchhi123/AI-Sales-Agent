from app.core.database import SessionLocal
from app.models.user import User
from app.models.business import CompanyProfile
from app.schemas.business import StructuredBusinessProfile
from app.services.business_service import business_service
from app.services.lead_service import lead_service

def test_industry_adaptation():
    db = SessionLocal()
    user = db.query(User).filter(User.email == 'jiya.vinchhi1690@gmail.com').first()
    if not user:
        user = db.query(User).first()
    user_id = user.id
    print(f"Testing for user: {user.email} (id: {user_id})")

    # 1. Test CLOTHING Profile
    print("\n--- 1. Testing Clothing Company Profile ---")
    clothing_profile = StructuredBusinessProfile(
        company_name="SiyaRang Bandhej",
        company_website="https://siyarangbandhej.com",
        company_summary="Heritage artisan manufacturer of authentic Kutch and Jamnagar Bandhani, pure cotton satin and modal silk sarees, kurtis and lehengas.",
        products_services=["Bandhani Kurtis", "Modal Silk Sarees", "Festive Lehengas"],
        target_customers=["Boutique Owners", "Fashion Merchandisers"],
        target_industries=["Ethnic Fashion", "Boutique Retail", "Apparel"],
        target_locations=["India", "UAE"],
        ideal_customer_profile="National ethnic retail chains and luxury bridal boutiques.",
        keywords=["bandhani", "saree", "kurti", "wholesale"],
        buying_signals=["Expanding festive collections"],
        sender_email="jiya.vinchhi1690@gmail.com",
        sender_name="SiyaRang Bandhej Sourcing",
        smtp_host="smtp.gmail.com",
        smtp_port=465,
        is_demo_mode=False
    )
    business_service.save_or_update_profile(user_id, clothing_profile, db)
    lead_service.ensure_demo_lead(db, user_id)

    leads = lead_service.get_leads(db, user_id)
    demo_lead = [l for l in leads if l.primary_contact and l.primary_contact.email == "jiyacrafthub@gmail.com"][0]
    print(f"Lead Company: {demo_lead.company_name}")
    print(f"Lead Industry: {demo_lead.industry}")
    print(f"Lead Contact: {demo_lead.primary_contact.name} ({demo_lead.primary_contact.title})")
    print(f"Lead Email: {demo_lead.primary_contact.email}")
    print(f"Requirement: {demo_lead.signals_summary[0] if demo_lead.signals_summary else 'None'}")

    draft = lead_service.generate_email_draft(db, user_id, demo_lead.id, tone="direct")
    print(f"Email Subject: {draft['subject']}")
    print(f"Email Snippet: {draft['body'][:160]}...")
    assert "bandhani" in draft['body'].lower() or "apparel" in draft['body'].lower()
    assert demo_lead.primary_contact.email == "jiyacrafthub@gmail.com"
    print(">>> CLOTHING PROFILE MATCH SUCCESSFUL!")

    # 2. Test IT Profile
    print("\n--- 2. Testing IT / Software Company Profile ---")
    it_profile = StructuredBusinessProfile(
        company_name="Apex Cloud Technologies",
        company_website="https://apexcloud.tech",
        company_summary="Enterprise cloud architecture, custom full-stack software development, DevOps automation, and AI workflows.",
        products_services=["Cloud Infrastructure Migration", "Custom Full-Stack Development", "AI Pipeline Automation"],
        target_customers=["CTOs", "VP of Engineering", "IT Directors"],
        target_industries=["Software", "Fintech", "SaaS", "Enterprise IT"],
        target_locations=["San Francisco", "Bangalore", "Global"],
        ideal_customer_profile="High-growth SaaS and enterprise companies modernizing legacy systems.",
        keywords=["cloud", "devops", "software", "ai"],
        buying_signals=["Cloud migration RFP", "Software engineering capacity scaling"],
        sender_email="jiya.vinchhi1690@gmail.com",
        sender_name="Apex Cloud Advisory",
        smtp_host="smtp.gmail.com",
        smtp_port=465,
        is_demo_mode=False
    )
    business_service.save_or_update_profile(user_id, it_profile, db)
    lead_service.ensure_demo_lead(db, user_id)

    leads_it = lead_service.get_leads(db, user_id)
    demo_lead_it = [l for l in leads_it if l.primary_contact and l.primary_contact.email == "jiyacrafthub@gmail.com"][0]
    print(f"Lead Company: {demo_lead_it.company_name}")
    print(f"Lead Industry: {demo_lead_it.industry}")
    print(f"Lead Contact: {demo_lead_it.primary_contact.name} ({demo_lead_it.primary_contact.title})")
    print(f"Lead Email: {demo_lead_it.primary_contact.email}")
    print(f"Requirement: {demo_lead_it.signals_summary[0] if demo_lead_it.signals_summary else 'None'}")

    draft_it = lead_service.generate_email_draft(db, user_id, demo_lead_it.id, tone="direct")
    print(f"Email Subject: {draft_it['subject']}")
    print(f"Email Snippet: {draft_it['body'][:160]}...")
    assert "cloud" in draft_it['body'].lower() or "software" in draft_it['body'].lower() or "apex" in draft_it['body'].lower()
    assert demo_lead_it.primary_contact.email == "jiyacrafthub@gmail.com"
    print(">>> IT PROFILE MATCH SUCCESSFUL!")

    # 3. Restore Clothing profile for the user's active session
    business_service.save_or_update_profile(user_id, clothing_profile, db)
    lead_service.ensure_demo_lead(db, user_id)
    print("\n>>> RESTORED SIYARANG BANDHEJ FOR ACTIVE SESSION.")

if __name__ == "__main__":
    test_industry_adaptation()
