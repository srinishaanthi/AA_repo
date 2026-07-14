export interface Customer {
  id: string;
  name: string;
  gstin?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  contact_person?: string;
  credit_days?: number;
  notes?: string;
  created_at: string;
}

export interface Vehicle {
  id: string;
  vehicle_number: string;
  vehicle_type?: string;
  owner_name?: string;
  owner_phone?: string;
  status: string;
  insurance_expiry?: string;
  fitness_expiry?: string;
  permit_expiry?: string;
  pollution_expiry?: string;
  created_at: string;
}

export interface Driver {
  id: string;
  name: string;
  phone?: string;
  license_number?: string;
  license_expiry?: string;
  address?: string;
  vehicle_id?: string;
  status: string;
  created_at: string;
}

export interface Item {
  id: string;
  name: string;
  hsn_code?: string;
  unit?: string;
  gst_rate?: number;
  description?: string;
  created_at: string;
}

export interface GoodsLine {
  description: string;
  packages: number | string;
  actual_weight: number | string;
  charged_weight: number | string;
  invoice_no: string;
  invoice_date: string;
  value: number | string;
}

export interface LorryReceipt {
  id: string;
  lr_number: string;
  date: string;
  branch?: string;
  consignor_id?: string;
  consignor_name?: string;
  consignor_address?: string;
  consignor_gstin?: string;
  consignor_phone?: string;
  consignee_id?: string;
  consignee_name?: string;
  consignee_address?: string;
  consignee_gstin?: string;
  consignee_phone?: string;
  vehicle_id?: string;
  vehicle_number?: string;
  driver_id?: string;
  driver_name?: string;
  driver_phone?: string;
  from_location?: string;
  to_location?: string;
  delivery_at?: string;
  trip_date?: string;
  delivery_date?: string;
  eway_bill_no?: string;
  freight_status?: string;
  carrier_gstin?: string;
  goods: GoodsLine[];
  freight_charge: number;
  loading_charge: number;
  unloading_charge: number;
  detention_charge: number;
  other_charges: number;
  party_code?: string;
  gst_rate?: number;
  gst_amount?: number;
  total_amount: number;
  payment_terms?: string;
  status: string;
  remarks?: string;
  terms?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceGoodsLine {
  description: string;
  packages: number | string;
  weight: number | string;
  invoice_no: string;
  eway_bill: string;
}

export interface LorryInvoice {
  id: string;
  invoice_number: string;
  date: string;
  branch?: string;
  bill_no?: string;
  customer_id?: string;
  customer_name?: string;
  customer_gstin?: string;
  customer_address?: string;
  customer_phone?: string;
  customer_state?: string;
  customer_contact_person?: string;
  lr_id?: string;
  lr_number?: string;
  lr_date?: string;
  vehicle_number?: string;
  driver_name?: string;
  from_location?: string;
  to_location?: string;
  trip_date?: string;
  delivery_date?: string;
  party_code?: string;
  consignor_name?: string;
  consignee_name?: string;
  material_description?: string;
  no_of_packages?: number | string;
  actual_weight?: number | string;
  chargeable_weight?: number | string;
  goods: InvoiceGoodsLine[];
  freight_charge: number;
  loading_charge: number;
  unloading_charge: number;
  halting_charge: number;
  toll_charge: number;
  detention_charge: number;
  fuel_surcharge: number;
  st_charge: number;
  other_charges: number;
  gst_rate: number;
  gst_amount: number;
  total_amount: number;
  status: string;
  remarks?: string;
  terms?: string;
  created_at: string;
  updated_at: string;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  date: string;
  customer_id?: string;
  customer_name?: string;
  from_location?: string;
  to_location?: string;
  vehicle_type?: string;
  weight?: number;
  rate: number;
  loading_charge: number;
  unloading_charge: number;
  other_charges: number;
  gst_rate: number;
  gst_amount: number;
  total_amount: number;
  valid_till?: string;
  status: string;
  remarks?: string;
  converted_to_lr?: string;
  created_at: string;
}

export interface CompanySettings {
  id: string;
  company_name: string;
  gstin?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  footer_text?: string;
  terms?: string;
  bank_details?: Record<string, string>;
}

export interface NumberSeries {
  id: string;
  series_type: string;
  prefix: string;
  next_number: number;
  auto_generate: boolean;
  financial_year?: string;
}

export interface Tax {
  id: string;
  name: string;
  rate: number;
  description?: string;
  is_active: boolean;
}

export interface Bank {
  id: string;
  bank_name: string;
  account_name?: string;
  account_number?: string;
  ifsc_code?: string;
  branch?: string;
  upi_id?: string;
  is_primary: boolean;
}

export type Page =
  | 'dashboard'
  | 'lr-list' | 'lr-create' | 'lr-edit'
  | 'invoice-list' | 'invoice-create' | 'invoice-edit'
  | 'quotation-list' | 'quotation-create' | 'quotation-edit'
  | 'delivery-status'
  | 'customers' | 'customer-create' | 'customer-edit'
  | 'items'
  | 'vehicles'
  | 'drivers'
  | 'report-lr' | 'report-invoice' | 'report-quotation'
  | 'settings';

export interface NavState {
  page: Page;
  id?: string;
}
