import urllib.request
import urllib.error
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_short_password():
    payload = {
        "recipient_email": "jiyacrafthub@gmail.com",
        "sender_email": "jiya.vinchhi1690@gmail.com",
        "smtp_password": "shortpassword10", # 15 chars
        "smtp_port": 465
    }
    req = urllib.request.Request(
        f"{BASE_URL}/business/test-email",
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        urllib.request.urlopen(req)
        print("Unexpected success with 15 char password")
    except urllib.error.HTTPError as e:
        body = json.loads(e.read().decode())
        print("Status code:", e.code)
        print("Helpful error message returned to user:")
        print(body.get('detail'))
        assert "Google App Passwords must be exactly 16 letters" in body.get('detail')
        print(">>> SUCCESS: Frontend/user receives direct actionable explanation of why their password failed!")

if __name__ == "__main__":
    test_short_password()
