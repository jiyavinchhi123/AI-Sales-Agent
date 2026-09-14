import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000/api"

def get(url):
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode())

def post(url, data=None):
    payload = json.dumps(data or {}).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode())

def run_tests():
    print("=== 1. Checking Business Profile ===")
    status, profile = get(f"{BASE_URL}/business/profile")
    print(f"Status: {status}")
    if profile:
        print(f"Company: {profile.get('company_name')}")
        print(f"Sender Email: {profile.get('sender_email')}")
        print(f"SMTP Host: {profile.get('smtp_host')}")
        print(f"Products: {profile.get('products_services')[:2]}")

    print("\n=== 2. Checking Leads & Demo Lead ===")
    status, leads = get(f"{BASE_URL}/leads/")
    print(f"Status: {status}")
    print(f"Total leads: {len(leads)}")
    
    demo_lead = None
    for lead in leads:
        if "jiyacrafthub" in lead.get("company_name", "").lower() or "jiyacrafthub" in lead.get("domain", "").lower():
            demo_lead = lead
            break
            
    if demo_lead:
        print(f"FOUND Demo Lead: {demo_lead.get('company_name')}")
        contact = demo_lead.get('primary_contact', {})
        print(f"Contact Name: {contact.get('name')}")
        print(f"Contact Email: {contact.get('email')}")
        print(f"Requirement Title: {demo_lead.get('requirement_title')}")
        print(f"Matched Offering: {demo_lead.get('matched_offering')}")
        assert contact.get('email') == "jiyacrafthub@gmail.com", f"Expected jiyacrafthub@gmail.com, got {contact.get('email')}"
        print(">>> SUCCESS: Demo lead contact_email is jiyacrafthub@gmail.com!")
    else:
        print("Demo lead JiyaCraftHub not found in /api/leads/!")

    print("\n=== 4. Updating Business Profile with Siyarang Bandhej & Custom Email ===")
    update_data = {
        "company_name": "SiyaRang Bandhej",
        "company_website": "https://siyarangbandhej.com",
        "company_summary": "Heritage artisan manufacturer of authentic Kutch and Jamnagar Bandhani, handcrafted pure Gaji silk sarees, traditional tie-dye dupattas, and bridal lehenga fabrics from Jam Khambhalia.",
        "products_services": ["Pure Gaji Silk Bandhani Sarees", "Modal Silk Sarees", "Bandhani Kurtis", "Festive Lehengas"],
        "target_customers": ["Retail Sourcing Managers", "Boutique Owners", "Wholesale Distributors"],
        "target_industries": ["Ethnic Retail", "Fashion", "Boutiques"],
        "target_locations": ["India", "UAE", "UK", "North America"],
        "ideal_customer_profile": "Premium ethnic fashion boutiques and national retail chains seeking authentic hand-tied Bandhani directly from manufacturer.",
        "keywords": ["bandhani", "gaji silk", "jamnagar", "wholesale sarees"],
        "buying_signals": ["Expanding festive collection", "Seeking direct manufacturer supply"],
        "sender_email": "sales@siyarangbandhej.com",
        "sender_name": "SiyaRang Bandhej Sales",
        "smtp_host": "smtp.gmail.com",
        "smtp_port": 465,
        "is_demo_mode": False
    }
    req = urllib.request.Request(f"{BASE_URL}/business/profile", data=json.dumps(update_data).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='PUT')
    with urllib.request.urlopen(req) as resp:
        updated_prof = json.loads(resp.read().decode())
        print(f"Updated Company: {updated_prof.get('company_name')}")
        print(f"Updated Sender Email: {updated_prof.get('sender_email')}")
        assert updated_prof.get('sender_email') == "sales@siyarangbandhej.com"

    print("\n=== 5. Verifying Demo Lead Dynamic Alignment ===")
    status, leads = get(f"{BASE_URL}/leads/")
    demo_lead = [l for l in leads if "jiyacrafthub" in l.get("company_name", "").lower()][0]
    print(f"Demo Lead: {demo_lead.get('company_name')}")
    print(f"Contact Email: {demo_lead.get('primary_contact', {}).get('email')}")
    print(f"Requirement: {demo_lead.get('requirement_title')}")
    assert demo_lead.get('primary_contact', {}).get('email') == "jiyacrafthub@gmail.com"

    print("\n=== 6. Checking Dynamic Email Draft for Siyarang Bandhej ===")
    status, draft = post(f"{BASE_URL}/leads/{demo_lead.get('id')}/email-draft", {"tone": "consultative"})
    print(f"To: {draft.get('recipient_email')}")
    print(f"Subject: {draft.get('subject')}")
    print(f"Body snippet:\n{draft.get('body')[:250]}...")
    assert draft.get('recipient_email') == "jiyacrafthub@gmail.com"
    assert "bandhani" in draft.get('body').lower() or "saree" in draft.get('body').lower() or "siyarang" in draft.get('body').lower()
    print(">>> ALL CHECKS PASSED: Custom company email preserved & customer demo lead remains jiyacrafthub@gmail.com!")


if __name__ == "__main__":
    run_tests()
