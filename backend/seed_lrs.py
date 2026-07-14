import uuid
from database import SessionLocal
import models
from datetime import datetime, timedelta

db = SessionLocal()

def seed_lrs():
    print("Seeding Lorry Receipts...")
    today = datetime.now()

    sample_lrs = [
        {
            "id": str(uuid.uuid4()),
            "lr_number": "LR-1001",
            "date": today.strftime("%Y-%m-%d"),
            "branch": "Coimbatore Main",
            "consignor_name": "ABC Manufacturing Ltd",
            "consignor_address": "123 Industrial Estate, Coimbatore",
            "consignee_name": "XYZ Retailers",
            "consignee_address": "456 Market St, Chennai",
            "vehicle_number": "TN 38 BX 1234",
            "driver_name": "Ramesh",
            "driver_phone": "9876543210",
            "from_location": "Coimbatore",
            "to_location": "Chennai",
            "delivery_at": "Chennai Warehouse",
            "eway_bill_no": "123456789012",
            "goods": [
                {
                    "description": "Textile Machinery Parts",
                    "packages": "10",
                    "actual_weight": "500",
                    "charged_weight": "550"
                }
            ],
            "freight_charge": 5000.0,
            "loading_charge": 200.0,
            "unloading_charge": 200.0,
            "total_amount": 5400.0,
            "payment_terms": "To Pay",
            "status": "in-transit"
        },
        {
            "id": str(uuid.uuid4()),
            "lr_number": "LR-1002",
            "date": (today - timedelta(days=2)).strftime("%Y-%m-%d"),
            "branch": "Coimbatore Main",
            "consignor_name": "Global Traders",
            "consignor_address": "789 Trade City, Tiruppur",
            "consignee_name": "Mega Mart",
            "consignee_address": "321 Retail Hub, Bangalore",
            "vehicle_number": "TN 39 CD 5678",
            "driver_name": "Suresh",
            "driver_phone": "9876543211",
            "from_location": "Tiruppur",
            "to_location": "Bangalore",
            "delivery_at": "Bangalore",
            "eway_bill_no": "987654321098",
            "goods": [
                {
                    "description": "Cotton Garments",
                    "packages": "50",
                    "actual_weight": "1200",
                    "charged_weight": "1200"
                }
            ],
            "freight_charge": 12000.0,
            "loading_charge": 500.0,
            "unloading_charge": 500.0,
            "total_amount": 13000.0,
            "payment_terms": "Paid",
            "status": "delivered"
        },
        {
            "id": str(uuid.uuid4()),
            "lr_number": "LR-1003",
            "date": today.strftime("%Y-%m-%d"),
            "branch": "Coimbatore Main",
            "consignor_name": "Tech Solutions Inc",
            "consignor_address": "Tech Park, Coimbatore",
            "consignee_name": "Data Centers India",
            "consignee_address": "IT Corridor, Hyderabad",
            "vehicle_number": "TN 38 AA 9999",
            "driver_name": "Kumar",
            "driver_phone": "9876543212",
            "from_location": "Coimbatore",
            "to_location": "Hyderabad",
            "delivery_at": "Hyderabad IT Park",
            "eway_bill_no": "555555555555",
            "goods": [
                {
                    "description": "Server Racks",
                    "packages": "5",
                    "actual_weight": "800",
                    "charged_weight": "1000"
                }
            ],
            "freight_charge": 15000.0,
            "loading_charge": 1000.0,
            "unloading_charge": 0.0,
            "total_amount": 16000.0,
            "payment_terms": "TBB",
            "status": "created"
        }
    ]

    for lr_data in sample_lrs:
        lr = models.LorryReceipt(**lr_data)
        db.add(lr)
    
    db.commit()
    print(f"Successfully seeded {len(sample_lrs)} Lorry Receipts.")

if __name__ == "__main__":
    seed_lrs()
