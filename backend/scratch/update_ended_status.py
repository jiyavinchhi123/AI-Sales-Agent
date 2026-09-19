import sqlite3

def update_ended_records():
    conn = sqlite3.connect('sales_agent.db')
    c = conn.cursor()
    c.execute("""
        UPDATE call_sessions
        SET status = 'Ended'
        WHERE status = 'Completed'
          AND (
            LOWER(summary) LIKE '%ended the call%'
            OR LOWER(summary) LIKE '%ended before the complete discussion%'
            OR LOWER(summary) LIKE '%customer ended%'
          )
    """)
    print('Updated rows to Ended:', c.rowcount)
    conn.commit()
    conn.close()

if __name__ == '__main__':
    update_ended_records()
