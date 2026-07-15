import sys
sys.path.append('.')
from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Adding to invoices table
    try:
        conn.execute(text('ALTER TABLE invoices ADD COLUMN amount_received FLOAT DEFAULT 0.0'))
        conn.execute(text('ALTER TABLE invoices ADD COLUMN amount_pending FLOAT DEFAULT 0.0'))
        conn.commit()
        print("Columns added")
    except Exception as e:
        print(f"Migration error or already exists: {e}")
