from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime

class CustomerBase(BaseModel):
    name: str
    gstin: Optional[str] = None
    pan: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    contact_person: Optional[str] = None
    credit_days: Optional[int] = None
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    id: Optional[str] = None

class CustomerOut(CustomerBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

class VehicleBase(BaseModel):
    vehicle_number: str
    vehicle_type: Optional[str] = None
    owner_name: Optional[str] = None
    owner_phone: Optional[str] = None
    status: str = "active"
    insurance_expiry: Optional[str] = None
    fitness_expiry: Optional[str] = None
    permit_expiry: Optional[str] = None
    pollution_expiry: Optional[str] = None

class VehicleCreate(VehicleBase):
    id: Optional[str] = None

class VehicleOut(VehicleBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

class DriverBase(BaseModel):
    name: str
    phone: Optional[str] = None
    license_number: Optional[str] = None
    license_expiry: Optional[str] = None
    address: Optional[str] = None
    vehicle_id: Optional[str] = None
    status: str = "active"

class DriverCreate(DriverBase):
    id: Optional[str] = None

class DriverOut(DriverBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

class ItemBase(BaseModel):
    name: str
    hsn_code: Optional[str] = None
    unit: Optional[str] = None
    gst_rate: Optional[float] = None
    description: Optional[str] = None

class ItemCreate(ItemBase):
    id: Optional[str] = None

class ItemOut(ItemBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

class NumberSeriesBase(BaseModel):
    series_type: str
    prefix: str = ""
    next_number: int = 1001
    auto_generate: bool = True
    financial_year: Optional[str] = None

class NumberSeriesOut(NumberSeriesBase):
    id: str
    class Config:
        from_attributes = True

class GoodsLine(BaseModel):
    description: str
    packages: Any
    actual_weight: Any
    charged_weight: Any
    invoice_no: str
    invoice_date: str
    value: Any

class LRBase(BaseModel):
    lr_number: str
    date: str
    branch: Optional[str] = None
    consignor_id: Optional[str] = None
    consignor_name: Optional[str] = None
    consignor_address: Optional[str] = None
    consignor_gstin: Optional[str] = None
    consignor_phone: Optional[str] = None
    consignee_id: Optional[str] = None
    consignee_name: Optional[str] = None
    consignee_address: Optional[str] = None
    consignee_gstin: Optional[str] = None
    consignee_phone: Optional[str] = None
    vehicle_id: Optional[str] = None
    vehicle_number: Optional[str] = None
    driver_id: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    from_location: Optional[str] = None
    to_location: Optional[str] = None
    delivery_at: Optional[str] = None
    trip_date: Optional[str] = None
    delivery_date: Optional[str] = None
    eway_bill_no: Optional[str] = None
    freight_status: Optional[str] = None
    carrier_gstin: Optional[str] = None
    goods: List[Dict[str, Any]] = []
    freight_charge: float = 0.0
    loading_charge: float = 0.0
    unloading_charge: float = 0.0
    detention_charge: float = 0.0
    other_charges: float = 0.0
    party_code: Optional[str] = None
    gst_rate: float = 0.0
    gst_amount: float = 0.0
    total_amount: float = 0.0
    payment_terms: Optional[str] = None
    status: str = "pending"
    remarks: Optional[str] = None
    terms: Optional[str] = None

class LRCreate(LRBase):
    id: Optional[str] = None

class LROut(LRBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class InvoiceBase(BaseModel):
    invoice_number: str
    date: str
    branch: Optional[str] = None
    bill_no: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_gstin: Optional[str] = None
    customer_address: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_state: Optional[str] = None
    customer_contact_person: Optional[str] = None
    lr_id: Optional[str] = None
    lr_number: Optional[str] = None
    lr_date: Optional[str] = None
    vehicle_number: Optional[str] = None
    driver_name: Optional[str] = None
    from_location: Optional[str] = None
    to_location: Optional[str] = None
    trip_date: Optional[str] = None
    delivery_date: Optional[str] = None
    party_code: Optional[str] = None
    consignor_name: Optional[str] = None
    consignee_name: Optional[str] = None
    material_description: Optional[str] = None
    no_of_packages: Optional[str] = None
    actual_weight: Optional[str] = None
    chargeable_weight: Optional[str] = None
    goods: List[Dict[str, Any]] = []
    freight_charge: float = 0.0
    loading_charge: float = 0.0
    unloading_charge: float = 0.0
    halting_charge: float = 0.0
    toll_charge: float = 0.0
    detention_charge: float = 0.0
    fuel_surcharge: float = 0.0
    st_charge: float = 0.0
    other_charges: float = 0.0
    gst_rate: float = 0.0
    gst_amount: float = 0.0
    total_amount: float = 0.0
    status: str = "pending"
    remarks: Optional[str] = None
    terms: Optional[str] = None

class InvoiceCreate(InvoiceBase):
    id: Optional[str] = None

class InvoiceOut(InvoiceBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class QuotationBase(BaseModel):
    quotation_number: str
    date: str
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    from_location: Optional[str] = None
    to_location: Optional[str] = None
    vehicle_type: Optional[str] = None
    weight: Optional[float] = None
    rate: float = 0.0
    loading_charge: float = 0.0
    unloading_charge: float = 0.0
    other_charges: float = 0.0
    gst_rate: float = 0.0
    gst_amount: float = 0.0
    total_amount: float = 0.0
    valid_till: Optional[str] = None
    status: str = "pending"
    remarks: Optional[str] = None
    converted_to_lr: Optional[str] = None

class QuotationCreate(QuotationBase):
    id: Optional[str] = None

class QuotationOut(QuotationBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

class CompanySettingsBase(BaseModel):
    company_name: str
    gstin: Optional[str] = None
    pan: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    logo_url: Optional[str] = None
    footer_text: Optional[str] = None
    terms: Optional[str] = None
    bank_details: Optional[Dict[str, Any]] = None

class CompanySettingsCreate(CompanySettingsBase):
    id: Optional[str] = None

class CompanySettingsOut(CompanySettingsBase):
    id: str
    class Config:
        from_attributes = True

class TaxBase(BaseModel):
    name: str
    rate: float = 0.0
    description: Optional[str] = None
    is_active: bool = True

class TaxCreate(TaxBase):
    id: Optional[str] = None

class TaxOut(TaxBase):
    id: str
    class Config:
        from_attributes = True

class BankBase(BaseModel):
    bank_name: str
    account_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    branch: Optional[str] = None
    upi_id: Optional[str] = None
    is_primary: bool = False

class BankCreate(BankBase):
    id: Optional[str] = None

class BankOut(BankBase):
    id: str
    class Config:
        from_attributes = True

class NumberSeriesBase(BaseModel):
    series_type: str
    prefix: str = ""
    next_number: int = 1001
    auto_generate: bool = True
    financial_year: Optional[str] = None

class NumberSeriesCreate(NumberSeriesBase):
    id: Optional[str] = None

class NumberSeriesOut(NumberSeriesBase):
    id: str
    class Config:
        from_attributes = True
