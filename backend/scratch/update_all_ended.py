import sys
import os
sys.path.insert(0, os.path.abspath("."))
import sqlite3
import json
from app.core.database import SessionLocal
from app.models.call import CallSession as DBCallSession
from app.schemas.call import CallTurn
from app.services.call_agent_service import call_agent_service

db = SessionLocal()
rows = db.query(DBCallSession).all()
updated_count = 0
for row in rows:
    if row.status == "In_Progress":
        continue
    turns = [CallTurn(**t) for t in (row.turns or [])]
    if not turns:
        continue
    call = call_agent_service._db_to_schema(row)
    state = call_agent_service._extract_qualification_state(call, None, None)
    if not state["is_complete"] or state["customer_ended_call"]:
        if row.status != "Ended":
            row.status = "Ended"
            updated_count += 1
            print(f"Updated {row.id} ({row.company_name}) from {row.status} -> Ended")

db.commit()
print(f"Total rows updated to Ended: {updated_count}")
db.close()
