import uuid
from database import SessionLocal
import models
from datetime import datetime, timedelta

db = SessionLocal()

def seed_data():
    print("Seeding Master Data...")
    today = datetime.now()

    # 1. Dummy Customers
    sample_customers = [
        {
            "id": str(uuid.uuid4()),
            "name": "ABC Manufacturing Ltd",
            "gstin": "33AABCA1234D1Z5",
            "pan": "AABCA1234D",
            "address": "123 Industrial Estate",
            "city": "Coimbatore",
            "state": "Tamil Nadu",
            "pincode": "641001",
            "phone": "9876543210",
            "email": "contact@abc.com",
            "contact_person": "Mr. Sharma",
            "credit_days": 30
        },
        {
            "id": str(uuid.uuid4()),
            "name": "XYZ Retailers",
            "gstin": "33XYZCR9876E1Z2",
            "pan": "XYZCR9876E",
            "address": "456 Market St",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "pincode": "600001",
            "phone": "9998887776",
            "email": "sales@xyz.com",
            "contact_person": "Mr. Verma",
            "credit_days": 15
        }
    ]

    for cust_data in sample_customers:
        customer = models.Customer(**cust_data)
        db.add(customer)

    # 2. Dummy Vehicles
    sample_vehicles = [
        {
            "id": str(uuid.uuid4()),
            "vehicle_number": "TN 38 BX 1234",
            "vehicle_type": "Open Truck 19ft",
            "owner_name": "Ravi Transports",
            "owner_phone": "8888888888",
            "status": "active"
        },
        {
            "id": str(uuid.uuid4()),
            "vehicle_number": "TN 39 CD 5678",
            "vehicle_type": "Container 24ft",
            "owner_name": "Kumar Logistics",
            "owner_phone": "7777777777",
            "status": "active"
        }
    ]

    for veh_data in sample_vehicles:
        vehicle = models.Vehicle(**veh_data)
        db.add(vehicle)

    # 3. Dummy Drivers
    sample_drivers = [
        {
            "id": str(uuid.uuid4()),
            "name": "Ramesh",
            "phone": "9876543210",
            "license_number": "TN3820101234567",
            "status": "active"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Suresh",
            "phone": "9876543211",
            "license_number": "TN3920119876543",
            "status": "active"
        }
    ]

    for driver_data in sample_drivers:
        driver = models.Driver(**driver_data)
        db.add(driver)

    # 4. Dummy Items
    sample_items = [
        {
            "id": str(uuid.uuid4()),
            "name": "Textile Machinery Parts",
            "hsn_code": "8448",
            "unit": "KGS",
            "gst_rate": 18.0,
            "description": "Spare parts for textile machines"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Cotton Garments",
            "hsn_code": "6109",
            "unit": "BOX",
            "gst_rate": 5.0,
            "description": "Assorted cotton t-shirts"
        }
    ]

    for item_data in sample_items:
        item = models.Item(**item_data)
        db.add(item)

    # 5. Dummy Taxes
    sample_taxes = [
        {
            "id": str(uuid.uuid4()),
            "name": "GST 5%",
            "rate": 5.0,
            "description": "Standard GST for essentials",
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "GST 12%",
            "rate": 12.0,
            "description": "GST for moderate items",
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "GST 18%",
            "rate": 18.0,
            "description": "GST for services and most goods",
            "is_active": True
        }
    ]

    for tax_data in sample_taxes:
        tax = models.Tax(**tax_data)
        db.add(tax)

    # 6. Dummy Banks
    sample_banks = [
        {
            "id": str(uuid.uuid4()),
            "bank_name": "HDFC Bank",
            "account_name": "ABC Logistics",
            "account_number": "50200012345678",
            "ifsc_code": "HDFC0001234",
            "branch": "Coimbatore Main",
            "is_primary": True
        },
        {
            "id": str(uuid.uuid4()),
            "bank_name": "ICICI Bank",
            "account_name": "ABC Logistics",
            "account_number": "000105012345",
            "ifsc_code": "ICIC0000001",
            "branch": "Chennai Branch",
            "is_primary": False
        }
    ]

    for bank_data in sample_banks:
        bank = models.Bank(**bank_data)
        db.add(bank)

    print("Seeding Lorry Receipts and Invoices...")
    # 7. Dummy Lorry Receipts
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
        }
    ]

    for lr_data in sample_lrs:
        lr = models.LorryReceipt(**lr_data)
        db.add(lr)

    # 8. Dummy Lorry Invoices
    sample_invoices = [
        {
            "id": str(uuid.uuid4()),
            "invoice_number": "INV-2001",
            "date": today.strftime("%Y-%m-%d"),
            "branch": "Coimbatore Main",
            "bill_no": "BILL-001",
            "customer_name": "XYZ Retailers",
            "customer_phone": "9998887776",
            "customer_address": "456 Market St, Chennai",
            "customer_state": "Tamil Nadu",
            "lr_number": "LR-1001",
            "lr_date": today.strftime("%Y-%m-%d"),
            "vehicle_number": "TN 38 BX 1234",
            "from_location": "Coimbatore",
            "to_location": "Chennai",
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
            "gst_rate": 5.0,
            "gst_amount": 270.0,
            "total_amount": 5670.0,
            "status": "pending"
        },
        {
            "id": str(uuid.uuid4()),
            "invoice_number": "INV-2002",
            "date": (today - timedelta(days=1)).strftime("%Y-%m-%d"),
            "branch": "Coimbatore Main",
            "bill_no": "BILL-002",
            "customer_name": "Mega Mart",
            "customer_phone": "8887776665",
            "customer_address": "321 Retail Hub, Bangalore",
            "customer_state": "Karnataka",
            "lr_number": "LR-1002",
            "lr_date": (today - timedelta(days=2)).strftime("%Y-%m-%d"),
            "vehicle_number": "TN 39 CD 5678",
            "from_location": "Tiruppur",
            "to_location": "Bangalore",
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
            "gst_rate": 12.0,
            "gst_amount": 1560.0,
            "total_amount": 14560.0,
            "status": "paid"
        }
    ]

    for inv_data in sample_invoices:
        invoice = models.LorryInvoice(**inv_data)
        db.add(invoice)
    
    db.commit()
    print("Successfully seeded all data!")

if __name__ == "__main__":
    seed_data()
