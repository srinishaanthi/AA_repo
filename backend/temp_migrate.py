import sys
sys.path.append('.')
from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text('ALTER TABLE lorry_receipts ADD COLUMN IF NOT EXISTS party_code VARCHAR'))
    conn.execute(text('ALTER TABLE lorry_receipts ADD COLUMN IF NOT EXISTS gst_rate FLOAT'))
    conn.execute(text('ALTER TABLE lorry_receipts ADD COLUMN IF NOT EXISTS gst_amount FLOAT'))
    conn.execute(text('ALTER TABLE lorry_receipts ADD COLUMN IF NOT EXISTS delivery_at VARCHAR'))
    conn.commit()
print("Migration done")
