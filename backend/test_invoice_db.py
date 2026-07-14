from database import SessionLocal
import models
import traceback
import uuid

data = {
    "id": str(uuid.uuid4()),
    "invoice_number": "INV1001",
    "date": "2024-03-20"
}

try:
    db = SessionLocal()
    db_obj = models.LorryInvoice(**data)
    db.add(db_obj)
    db.commit()
    print("Success")
except Exception as e:
    print("Error:")
    traceback.print_exc()
finally:
    db.close()
