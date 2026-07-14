from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, JSON
from sqlalchemy.sql import func
from database import Base

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    gstin = Column(String, nullable=True)
    pan = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    contact_person = Column(String, nullable=True)
    credit_days = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Vehicle(Base):
    __tablename__ = "vehicles"
    
    id = Column(String, primary_key=True, index=True)
    vehicle_number = Column(String, index=True)
    vehicle_type = Column(String, nullable=True)
    owner_name = Column(String, nullable=True)
    owner_phone = Column(String, nullable=True)
    status = Column(String, default="active")
    insurance_expiry = Column(String, nullable=True)
    fitness_expiry = Column(String, nullable=True)
    permit_expiry = Column(String, nullable=True)
    pollution_expiry = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Driver(Base):
    __tablename__ = "drivers"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String, nullable=True)
    license_number = Column(String, nullable=True)
    license_expiry = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    vehicle_id = Column(String, nullable=True)
    status = Column(String, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Item(Base):
    __tablename__ = "items"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    hsn_code = Column(String, nullable=True)
    unit = Column(String, nullable=True)
    gst_rate = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class LorryReceipt(Base):
    __tablename__ = "lorry_receipts"
    
    id = Column(String, primary_key=True, index=True)
    lr_number = Column(String, index=True, unique=True)
    date = Column(String)
    branch = Column(String, nullable=True)
    consignor_id = Column(String, nullable=True)
    consignor_name = Column(String, nullable=True)
    consignor_address = Column(Text, nullable=True)
    consignor_gstin = Column(String, nullable=True)
    consignor_phone = Column(String, nullable=True)
    consignee_id = Column(String, nullable=True)
    consignee_name = Column(String, nullable=True)
    consignee_address = Column(Text, nullable=True)
    consignee_gstin = Column(String, nullable=True)
    consignee_phone = Column(String, nullable=True)
    vehicle_id = Column(String, nullable=True)
    vehicle_number = Column(String, nullable=True)
    driver_id = Column(String, nullable=True)
    driver_name = Column(String, nullable=True)
    driver_phone = Column(String, nullable=True)
    from_location = Column(String, nullable=True)
    to_location = Column(String, nullable=True)
    delivery_at = Column(String, nullable=True)
    trip_date = Column(String, nullable=True)
    delivery_date = Column(String, nullable=True)
    eway_bill_no = Column(String, nullable=True)
    freight_status = Column(String, nullable=True)
    carrier_gstin = Column(String, nullable=True)
    goods = Column(JSON, default=list)
    freight_charge = Column(Float, default=0.0)
    loading_charge = Column(Float, default=0.0)
    unloading_charge = Column(Float, default=0.0)
    detention_charge = Column(Float, default=0.0)
    other_charges = Column(Float, default=0.0)
    party_code = Column(String, nullable=True)
    gst_rate = Column(Float, default=0.0)
    gst_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    payment_terms = Column(String, nullable=True)
    status = Column(String, default="pending")
    remarks = Column(Text, nullable=True)
    terms = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class LorryInvoice(Base):
    __tablename__ = "invoices"
    
    id = Column(String, primary_key=True, index=True)
    invoice_number = Column(String, index=True, unique=True)
    date = Column(String)
    branch = Column(String, nullable=True)
    bill_no = Column(String, nullable=True)
    customer_id = Column(String, nullable=True)
    customer_name = Column(String, nullable=True)
    customer_gstin = Column(String, nullable=True)
    customer_address = Column(Text, nullable=True)
    customer_phone = Column(String, nullable=True)
    customer_state = Column(String, nullable=True)
    customer_contact_person = Column(String, nullable=True)
    lr_id = Column(String, nullable=True)
    lr_number = Column(String, nullable=True)
    lr_date = Column(String, nullable=True)
    vehicle_number = Column(String, nullable=True)
    driver_name = Column(String, nullable=True)
    from_location = Column(String, nullable=True)
    to_location = Column(String, nullable=True)
    trip_date = Column(String, nullable=True)
    delivery_date = Column(String, nullable=True)
    party_code = Column(String, nullable=True)
    consignor_name = Column(String, nullable=True)
    consignee_name = Column(String, nullable=True)
    material_description = Column(Text, nullable=True)
    no_of_packages = Column(String, nullable=True)
    actual_weight = Column(String, nullable=True)
    chargeable_weight = Column(String, nullable=True)
    goods = Column(JSON, default=list)
    freight_charge = Column(Float, default=0.0)
    loading_charge = Column(Float, default=0.0)
    unloading_charge = Column(Float, default=0.0)
    halting_charge = Column(Float, default=0.0)
    toll_charge = Column(Float, default=0.0)
    detention_charge = Column(Float, default=0.0)
    fuel_surcharge = Column(Float, default=0.0)
    st_charge = Column(Float, default=0.0)
    other_charges = Column(Float, default=0.0)
    gst_rate = Column(Float, default=0.0)
    gst_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    status = Column(String, default="pending")
    remarks = Column(Text, nullable=True)
    terms = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Quotation(Base):
    __tablename__ = "quotations"
    
    id = Column(String, primary_key=True, index=True)
    quotation_number = Column(String, index=True, unique=True)
    date = Column(String)
    customer_id = Column(String, nullable=True)
    customer_name = Column(String, nullable=True)
    from_location = Column(String, nullable=True)
    to_location = Column(String, nullable=True)
    vehicle_type = Column(String, nullable=True)
    weight = Column(Float, nullable=True)
    rate = Column(Float, default=0.0)
    loading_charge = Column(Float, default=0.0)
    unloading_charge = Column(Float, default=0.0)
    other_charges = Column(Float, default=0.0)
    gst_rate = Column(Float, default=0.0)
    gst_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    valid_till = Column(String, nullable=True)
    status = Column(String, default="pending")
    remarks = Column(Text, nullable=True)
    converted_to_lr = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class NumberSeries(Base):
    __tablename__ = "number_series"
    
    id = Column(String, primary_key=True, index=True)
    series_type = Column(String, index=True, unique=True)
    prefix = Column(String, default="")
    next_number = Column(Integer, default=1001)
    auto_generate = Column(Boolean, default=True)
    financial_year = Column(String, nullable=True)

class CompanySettings(Base):
    __tablename__ = "company_settings"
    
    id = Column(String, primary_key=True, index=True)
    company_name = Column(String, index=True)
    gstin = Column(String, nullable=True)
    pan = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    footer_text = Column(Text, nullable=True)
    terms = Column(Text, nullable=True)
    bank_details = Column(JSON, nullable=True)

class Tax(Base):
    __tablename__ = "taxes"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    rate = Column(Float, default=0.0)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

class Bank(Base):
    __tablename__ = "banks"
    
    id = Column(String, primary_key=True, index=True)
    bank_name = Column(String, index=True)
    account_name = Column(String, nullable=True)
    account_number = Column(String, nullable=True)
    ifsc_code = Column(String, nullable=True)
    branch = Column(String, nullable=True)
    upi_id = Column(String, nullable=True)
    is_primary = Column(Boolean, default=False)
