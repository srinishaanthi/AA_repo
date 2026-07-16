from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from database import engine, Base, get_db, SessionLocal
import models
import schemas
import uuid
import smtplib
from email.message import EmailMessage
import base64
import os
from dotenv import load_dotenv

load_dotenv()

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        # Seed default company settings if empty
        if not db.query(models.CompanySettings).first():
            company_id = str(uuid.uuid4())
            default_company = models.CompanySettings(
                id=company_id,
                company_name="A & A Logistics",
                gstin="33AABM3640J1Z7",
                pan="AABM3640J",
                phone="93603 33500, 89438 17500",
                email="info@aalogistics.com",
                address="2/7A, Jayalakshmi Nagar, Thondamuthur Road,",
                city="Vadamalli, B.U Post",
                state="Coimbatore",
                pincode="641 046.",
                footer_text="Thank you for your business!",
                terms="1. Payment should be made immediately upon receipt of invoice.\n2. Interest @ 18% p.a. will be charged for delayed payments.\n3. All disputes are subject to Coimbatore jurisdiction."
            )
            db.add(default_company)
            db.commit()
            print("Seeded default company settings.")

        # Seed default bank settings if empty
        if not db.query(models.Bank).first():
            bank_id = str(uuid.uuid4())
            default_bank = models.Bank(
                id=bank_id,
                bank_name="State Bank of India",
                account_name="A & A Logistics",
                account_number="33812345678",
                ifsc_code="SBIN0001234",
                branch="Vadavalli Branch",
                upi_id="aalogistics@sbi",
                is_primary=True
            )
            db.add(default_bank)
            db.commit()
            print("Seeded default primary bank account.")

        # Seed default taxes if empty
        if not db.query(models.Tax).first():
            db.add_all([
                models.Tax(id=str(uuid.uuid4()), name="GST 5%", rate=5.0, is_active=True),
                models.Tax(id=str(uuid.uuid4()), name="GST 12%", rate=12.0, is_active=True),
                models.Tax(id=str(uuid.uuid4()), name="GST 18%", rate=18.0, is_active=True),
                models.Tax(id=str(uuid.uuid4()), name="GST 28%", rate=28.0, is_active=True),
            ])
            db.commit()
            print("Seeded default GST taxes.")
    except Exception as e:
        print(f"Error seeding default data: {e}")
    finally:
        db.close()
    
    yield

app = FastAPI(title="Logistics API", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Logistics API is running"}

# --- Generic CRUD helpers ---
def get_object_or_404(db: Session, model, id: str):
    obj = db.query(model).filter(model.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Item not found")
    return obj

# --- Customers ---
@app.get("/api/customers", response_model=List[schemas.CustomerOut])
def get_customers(db: Session = Depends(get_db)):
    return db.query(models.Customer).order_by(models.Customer.created_at.desc()).all()

@app.post("/api/customers", response_model=schemas.CustomerOut)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    data = customer.model_dump()
    if not data.get("id"):
        data["id"] = str(uuid.uuid4())
    db_obj = models.Customer(**data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@app.post("/api/customers/bulk")
def create_customers_bulk(customers: List[schemas.CustomerCreate], db: Session = Depends(get_db)):
    added_count = 0
    for cust in customers:
        data = cust.model_dump()
        if not data.get("id"):
            data["id"] = str(uuid.uuid4())
        # Check if customer already exists by name (case-insensitive strip query)
        existing = db.query(models.Customer).filter(func.lower(models.Customer.name) == func.lower(data["name"].strip())).first()
        if not existing:
            db_obj = models.Customer(**data)
            db.add(db_obj)
            added_count += 1
    db.commit()
    return {"status": "ok", "added_count": added_count}

@app.get("/api/customers/{id}", response_model=schemas.CustomerOut)
def get_customer(id: str, db: Session = Depends(get_db)):
    return get_object_or_404(db, models.Customer, id)

@app.put("/api/customers/{id}", response_model=schemas.CustomerOut)
def update_customer(id: str, customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    db_obj = get_object_or_404(db, models.Customer, id)
    for key, value in customer.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@app.delete("/api/customers/{id}")
def delete_customer(id: str, db: Session = Depends(get_db)):
    db_obj = get_object_or_404(db, models.Customer, id)
    db.delete(db_obj)
    db.commit()
    return {"ok": True}

# --- Vehicles ---
@app.get("/api/vehicles", response_model=List[schemas.VehicleOut])
def get_vehicles(db: Session = Depends(get_db)):
    return db.query(models.Vehicle).order_by(models.Vehicle.created_at.desc()).all()

@app.post("/api/vehicles", response_model=schemas.VehicleOut)
def create_vehicle(vehicle: schemas.VehicleCreate, db: Session = Depends(get_db)):
    data = vehicle.model_dump()
    if not data.get("id"):
        data["id"] = str(uuid.uuid4())
    db_obj = models.Vehicle(**data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@app.post("/api/vehicles/bulk")
def create_vehicles_bulk(vehicles: List[schemas.VehicleCreate], db: Session = Depends(get_db)):
    added_count = 0
    for veh in vehicles:
        data = veh.model_dump()
        if not data.get("id"):
            data["id"] = str(uuid.uuid4())
        existing = db.query(models.Vehicle).filter(func.lower(models.Vehicle.vehicle_number) == func.lower(data["vehicle_number"].strip())).first()
        if not existing:
            db_obj = models.Vehicle(**data)
            db.add(db_obj)
            added_count += 1
    db.commit()
    return {"status": "ok", "added_count": added_count}

@app.get("/api/vehicles/{id}", response_model=schemas.VehicleOut)
def get_vehicle(id: str, db: Session = Depends(get_db)):
    return get_object_or_404(db, models.Vehicle, id)

@app.put("/api/vehicles/{id}", response_model=schemas.VehicleOut)
def update_vehicle(id: str, vehicle: schemas.VehicleCreate, db: Session = Depends(get_db)):
    db_obj = get_object_or_404(db, models.Vehicle, id)
    for key, value in vehicle.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@app.delete("/api/vehicles/{id}")
def delete_vehicle(id: str, db: Session = Depends(get_db)):
    db_obj = get_object_or_404(db, models.Vehicle, id)
    db.delete(db_obj)
    db.commit()
    return {"ok": True}

# --- Drivers ---
@app.get("/api/drivers", response_model=List[schemas.DriverOut])
def get_drivers(db: Session = Depends(get_db)):
    return db.query(models.Driver).order_by(models.Driver.created_at.desc()).all()

@app.post("/api/drivers", response_model=schemas.DriverOut)
def create_driver(driver: schemas.DriverCreate, db: Session = Depends(get_db)):
    data = driver.model_dump()
    if not data.get("id"):
        data["id"] = str(uuid.uuid4())
    db_obj = models.Driver(**data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@app.post("/api/drivers/bulk")
def create_drivers_bulk(drivers: List[schemas.DriverCreate], db: Session = Depends(get_db)):
    added_count = 0
    for drv in drivers:
        data = drv.model_dump()
        if not data.get("id"):
            data["id"] = str(uuid.uuid4())
        existing = None
        if data.get("license_number"):
            existing = db.query(models.Driver).filter(func.lower(models.Driver.license_number) == func.lower(data["license_number"].strip())).first()
        else:
            existing = db.query(models.Driver).filter(
                func.lower(models.Driver.name) == func.lower(data["name"].strip()),
                models.Driver.phone == data.get("phone")
            ).first()
        if not existing:
            db_obj = models.Driver(**data)
            db.add(db_obj)
            added_count += 1
    db.commit()
    return {"status": "ok", "added_count": added_count}

@app.get("/api/drivers/{id}", response_model=schemas.DriverOut)
def get_driver(id: str, db: Session = Depends(get_db)):
    return get_object_or_404(db, models.Driver, id)

@app.put("/api/drivers/{id}", response_model=schemas.DriverOut)
def update_driver(id: str, driver: schemas.DriverCreate, db: Session = Depends(get_db)):
    db_obj = get_object_or_404(db, models.Driver, id)
    for key, value in driver.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@app.delete("/api/drivers/{id}")
def delete_driver(id: str, db: Session = Depends(get_db)):
    db_obj = get_object_or_404(db, models.Driver, id)
    db.delete(db_obj)
    db.commit()
    return {"ok": True}

# --- Items ---
@app.get("/api/items", response_model=List[schemas.ItemOut])
def get_items(db: Session = Depends(get_db)):
    return db.query(models.Item).order_by(models.Item.created_at.desc()).all()

@app.post("/api/items", response_model=schemas.ItemOut)
def create_item(item: schemas.ItemCreate, db: Session = Depends(get_db)):
    data = item.model_dump()
    if not data.get("id"):
        data["id"] = str(uuid.uuid4())
    db_obj = models.Item(**data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@app.post("/api/items/bulk")
def create_items_bulk(items: List[schemas.ItemCreate], db: Session = Depends(get_db)):
    added_count = 0
    for itm in items:
        data = itm.model_dump()
        if not data.get("id"):
            data["id"] = str(uuid.uuid4())
        existing = db.query(models.Item).filter(func.lower(models.Item.name) == func.lower(data["name"].strip())).first()
        if not existing:
            db_obj = models.Item(**data)
            db.add(db_obj)
            added_count += 1
    db.commit()
    return {"status": "ok", "added_count": added_count}

@app.get("/api/items/{id}", response_model=schemas.ItemOut)
def get_item(id: str, db: Session = Depends(get_db)):
    return get_object_or_404(db, models.Item, id)

@app.put("/api/items/{id}", response_model=schemas.ItemOut)
def update_item(id: str, item: schemas.ItemCreate, db: Session = Depends(get_db)):
    db_obj = get_object_or_404(db, models.Item, id)
    for key, value in item.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@app.delete("/api/items/{id}")
def delete_item(id: str, db: Session = Depends(get_db)):
    db_obj = get_object_or_404(db, models.Item, id)
    db.delete(db_obj)
    db.commit()
    return {"ok": True}

# --- Lorry Receipts ---
@app.get("/api/lorry-receipts", response_model=List[schemas.LROut])
def get_lrs(db: Session = Depends(get_db)):
    return db.query(models.LorryReceipt).order_by(models.LorryReceipt.created_at.desc()).all()

@app.post("/api/lorry-receipts", response_model=schemas.LROut)
def create_lr(lr: schemas.LRCreate, db: Session = Depends(get_db)):
    data = lr.model_dump()
    if not data.get("id"):
        data["id"] = str(uuid.uuid4())
    db_obj = models.LorryReceipt(**data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@app.get("/api/lorry-receipts/{id}", response_model=schemas.LROut)
def get_lr(id: str, db: Session = Depends(get_db)):
    return get_object_or_404(db, models.LorryReceipt, id)

@app.put("/api/lorry-receipts/{id}", response_model=schemas.LROut)
def update_lr(id: str, lr: schemas.LRCreate, db: Session = Depends(get_db)):
    db_obj = get_object_or_404(db, models.LorryReceipt, id)
    for key, value in lr.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@app.delete("/api/lorry-receipts/{id}")
def delete_lr(id: str, db: Session = Depends(get_db)):
    db_obj = get_object_or_404(db, models.LorryReceipt, id)
    db.delete(db_obj)
    db.commit()
    return {"ok": True}

# --- Invoices ---
@app.get("/api/invoices", response_model=List[schemas.InvoiceOut])
def get_invoices(db: Session = Depends(get_db)):
    return db.query(models.LorryInvoice).order_by(models.LorryInvoice.created_at.desc()).all()

@app.post("/api/invoices", response_model=schemas.InvoiceOut)
def create_invoice(invoice: schemas.InvoiceCreate, db: Session = Depends(get_db)):
    data = invoice.model_dump()
    if not data.get("id"):
        data["id"] = str(uuid.uuid4())
    db_obj = models.LorryInvoice(**data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@app.get("/api/invoices/{id}", response_model=schemas.InvoiceOut)
def get_invoice(id: str, db: Session = Depends(get_db)):
    return get_object_or_404(db, models.LorryInvoice, id)

@app.put("/api/invoices/{id}", response_model=schemas.InvoiceOut)
def update_invoice(id: str, invoice: schemas.InvoiceCreate, db: Session = Depends(get_db)):
    db_obj = get_object_or_404(db, models.LorryInvoice, id)
    for key, value in invoice.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@app.delete("/api/invoices/{id}")
def delete_invoice(id: str, db: Session = Depends(get_db)):
    db_obj = get_object_or_404(db, models.LorryInvoice, id)
    db.delete(db_obj)
    db.commit()
    return {"ok": True}

# --- Quotations ---
@app.get("/api/quotations", response_model=List[schemas.QuotationOut])
def get_quotations(db: Session = Depends(get_db)):
    return db.query(models.Quotation).order_by(models.Quotation.created_at.desc()).all()

@app.post("/api/quotations", response_model=schemas.QuotationOut)
def create_quotation(quotation: schemas.QuotationCreate, db: Session = Depends(get_db)):
    data = quotation.model_dump()
    if not data.get("id"):
        data["id"] = str(uuid.uuid4())
    db_obj = models.Quotation(**data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@app.get("/api/quotations/{id}", response_model=schemas.QuotationOut)
def get_quotation(id: str, db: Session = Depends(get_db)):
    return get_object_or_404(db, models.Quotation, id)

@app.put("/api/quotations/{id}", response_model=schemas.QuotationOut)
def update_quotation(id: str, quotation: schemas.QuotationCreate, db: Session = Depends(get_db)):
    db_obj = get_object_or_404(db, models.Quotation, id)
    for key, value in quotation.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@app.delete("/api/quotations/{id}")
def delete_quotation(id: str, db: Session = Depends(get_db)):
    db_obj = get_object_or_404(db, models.Quotation, id)
    db.delete(db_obj)
    db.commit()
    return {"ok": True}

# --- NumberSeries (Auto-number generation) ---
@app.post("/api/number-series/{series_type}/next")
def get_next_number(series_type: str, db: Session = Depends(get_db)):
    series = db.query(models.NumberSeries).filter(models.NumberSeries.series_type == series_type).first()
    if not series:
        prefix_map = {"lr": "LR", "invoice": "INV", "quotation": "QTN"}
        prefix = prefix_map.get(series_type, series_type.upper())
        series = models.NumberSeries(id=str(uuid.uuid4()), series_type=series_type, prefix=prefix, next_number=1001)
        db.add(series)
        db.commit()
        db.refresh(series)
    
    current_num = series.next_number
    formatted_num = f"{series.prefix}{current_num}"
    
    series.next_number += 1
    db.commit()
    
    return {"next_number": formatted_num}

# --- Company Settings CRUD ---
@app.get("/api/company_settings", response_model=List[schemas.CompanySettingsOut])
def get_company_settings(db: Session = Depends(get_db)):
    return db.query(models.CompanySettings).all()

@app.post("/api/company_settings", response_model=schemas.CompanySettingsOut)
def create_company_settings(company: schemas.CompanySettingsCreate, db: Session = Depends(get_db)):
    data = company.model_dump()
    if not data.get("id"):
        data["id"] = str(uuid.uuid4())
    db_obj = models.CompanySettings(**data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@app.put("/api/company_settings/{id}", response_model=schemas.CompanySettingsOut)
def update_company_settings(id: str, company: schemas.CompanySettingsCreate, db: Session = Depends(get_db)):
    db_obj = get_object_or_404(db, models.CompanySettings, id)
    for key, value in company.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

# --- Taxes CRUD ---
@app.get("/api/taxes", response_model=List[schemas.TaxOut])
def get_taxes(db: Session = Depends(get_db)):
    return db.query(models.Tax).order_by(models.Tax.rate.asc()).all()

@app.post("/api/taxes", response_model=schemas.TaxOut)
def create_tax(tax: schemas.TaxCreate, db: Session = Depends(get_db)):
    data = tax.model_dump()
    if not data.get("id"):
        data["id"] = str(uuid.uuid4())
    db_obj = models.Tax(**data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@app.put("/api/taxes/{id}", response_model=schemas.TaxOut)
def update_tax(id: str, tax: schemas.TaxCreate, db: Session = Depends(get_db)):
    db_obj = get_object_or_404(db, models.Tax, id)
    for key, value in tax.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@app.delete("/api/taxes/{id}")
def delete_tax(id: str, db: Session = Depends(get_db)):
    db_obj = get_object_or_404(db, models.Tax, id)
    db.delete(db_obj)
    db.commit()
    return {"ok": True}

# --- Banks CRUD ---
@app.get("/api/banks", response_model=List[schemas.BankOut])
def get_banks(db: Session = Depends(get_db)):
    return db.query(models.Bank).order_by(models.Bank.bank_name.asc()).all()

@app.post("/api/banks", response_model=schemas.BankOut)
def create_bank(bank: schemas.BankCreate, db: Session = Depends(get_db)):
    data = bank.model_dump()
    if not data.get("id"):
        data["id"] = str(uuid.uuid4())
    db_obj = models.Bank(**data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@app.put("/api/banks/{id}", response_model=schemas.BankOut)
def update_bank(id: str, bank: schemas.BankCreate, db: Session = Depends(get_db)):
    db_obj = get_object_or_404(db, models.Bank, id)
    for key, value in bank.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@app.delete("/api/banks/{id}")
def delete_bank(id: str, db: Session = Depends(get_db)):
    db_obj = get_object_or_404(db, models.Bank, id)
    db.delete(db_obj)
    db.commit()
    return {"ok": True}

# --- NumberSeries CRUD ---
@app.get("/api/number_series", response_model=List[schemas.NumberSeriesOut])
def get_number_series(db: Session = Depends(get_db)):
    return db.query(models.NumberSeries).order_by(models.NumberSeries.series_type.asc()).all()

@app.put("/api/number_series/{id}", response_model=schemas.NumberSeriesOut)
def update_number_series(id: str, series: schemas.NumberSeriesCreate, db: Session = Depends(get_db)):
    db_obj = get_object_or_404(db, models.NumberSeries, id)
    for key, value in series.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@app.post("/api/send-email")
def send_email(req: schemas.EmailRequest):
    smtp_host = os.environ.get("SMTP_HOST")
    smtp_port = os.environ.get("SMTP_PORT")
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASS")
    
    if not all([smtp_host, smtp_port, smtp_user, smtp_pass]):
        raise HTTPException(status_code=500, detail="SMTP credentials not configured on the server.")
        
    try:
        msg = EmailMessage()
        msg["Subject"] = req.subject
        msg["From"] = smtp_user
        msg["To"] = req.to_email
        msg.set_content(req.body)
        
        if req.attachment_base64 and req.filename:
            pdf_data = base64.b64decode(req.attachment_base64.split(",")[-1])
            msg.add_attachment(pdf_data, maintype="application", subtype="pdf", filename=req.filename)
        
        with smtplib.SMTP(smtp_host, int(smtp_port)) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
            
        return {"ok": True, "message": "Email sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
