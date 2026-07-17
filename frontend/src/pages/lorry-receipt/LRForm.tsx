import { useState, useEffect, useCallback, useRef } from 'react';
import { api, getNextNumber } from '../../lib/api';
import { LorryReceipt, Customer, Vehicle, Driver, CompanySettings, GoodsLine, NavState } from '../../types';
import LRPdfPreview from './LRPdfPreview';
import html2pdf from 'html2pdf.js';
import {
  Save, Printer, ChevronDown, ChevronUp, Plus, Trash2, ArrowLeft, Eye, FileText, Download
} from 'lucide-react';
import { City, State } from 'country-state-city';

const emptyGoods = (): GoodsLine => ({
  description: '', packages: '', actual_weight: '', charged_weight: '',
  invoice_no: '', invoice_date: '', value: '',
});

interface Props {
  editId?: string;
  fromQuotationId?: string;
  onNav: (s: NavState) => void;
  autoPreview?: boolean;
  autoPrint?: boolean;
}

interface Section {
  key: string;
  label: string;
}

const sections: Section[] = [
  { key: 'basic', label: 'Basic Details' },
  { key: 'parties', label: 'Consignor & Consignee Details' },
  { key: 'transport', label: 'Transport Details' },
  { key: 'goods', label: 'Goods' },
  { key: 'charges', label: 'Charges' },
];

const INDIAN_CITIES = Array.from(
  new Set(City.getCitiesOfCountry('IN').map(c => c.name))
).sort();

interface SearchableDropdownProps<T> {
  label: string;
  options: T[];
  selectedValue: string;
  placeholder: string;
  onSelect: (value: string) => void;
  getOptionId: (option: T) => string;
  getOptionLabel: (option: T) => string;
  addNewLabel: string;
  onAddNew: () => void;
  renderHoverInfo: (option: T) => React.ReactNode;
  tooltipAlign?: 'left' | 'right';
}

function SearchableDropdown<T>({
  label,
  options,
  selectedValue,
  placeholder,
  onSelect,
  getOptionId,
  getOptionLabel,
  addNewLabel,
  onAddNew,
  renderHoverInfo,
  tooltipAlign = 'right',
}: SearchableDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredOption, setHoveredOption] = useState<T | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) setSearchQuery('');
  }, [isOpen]);

  const selectedOption = options.find(opt => getOptionId(opt) === selectedValue);
  const selectedLabel = selectedOption ? getOptionLabel(selectedOption) : '';

  const filteredOptions = options.filter(opt =>
    getOptionLabel(opt).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative" ref={ref}>
      <label className="form-label">{label}</label>
      <div
        className="form-input flex items-center justify-between cursor-pointer pr-10 relative bg-white min-h-[38px] py-1.5 group/trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedLabel ? 'text-gray-900 font-medium text-sm' : 'text-gray-400 text-sm'}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown size={16} className="text-gray-400" />

        {/* Floating details on hovering the selected option box (only if dropdown is closed) */}
        {!isOpen && selectedOption && (
          <div
            className={`absolute top-0 w-64 bg-white text-gray-900 text-xs rounded-lg shadow-xl border border-gray-200 p-3 opacity-0 pointer-events-none group-hover/trigger:opacity-100 transition-opacity duration-150 z-[110] text-left normal-case tracking-normal ${
              tooltipAlign === 'left' ? 'right-full mr-2' : 'left-full ml-2'
            }`}
          >
            <div
              className={`absolute top-4 border-4 border-transparent ${
                tooltipAlign === 'left' ? 'left-full border-l-white' : 'right-full border-r-white'
              }`}
            ></div>
            {renderHoverInfo(selectedOption)}
          </div>
        )}
      </div>

      {/* Floating Preview Card on Option Hover (when dropdown is open) */}
      {isOpen && hoveredOption && (
        <div
          className={`absolute top-12 w-64 bg-white text-gray-900 text-xs rounded-lg shadow-xl border border-gray-200 p-3 z-[110] text-left normal-case tracking-normal ${
            tooltipAlign === 'left' ? 'right-full mr-2' : 'left-full ml-2'
          }`}
        >
          <div
            className={`absolute top-4 border-4 border-transparent ${
              tooltipAlign === 'left' ? 'left-full border-l-white' : 'right-full border-r-white'
            }`}
          ></div>
          {renderHoverInfo(hoveredOption)}
        </div>
      )}

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[95] flex flex-col max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
            <span className="material-symbols-outlined text-[16px] text-gray-400">search</span>
            <input
              type="text"
              className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1 max-h-48 divide-y divide-gray-50">
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-xs font-semibold text-brand hover:bg-brand/5 transition-colors block"
              onClick={() => {
                onAddNew();
                setIsOpen(false);
              }}
            >
              {addNewLabel}
            </button>
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-400 italic">No matches found</div>
            ) : (
              filteredOptions.map(opt => (
                <div
                  key={getOptionId(opt)}
                  className="w-full"
                  onMouseEnter={() => setHoveredOption(opt)}
                  onMouseLeave={() => setHoveredOption(null)}
                >
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-50 transition-colors flex items-center justify-between"
                    onClick={() => {
                      onSelect(getOptionId(opt));
                      setIsOpen(false);
                    }}
                  >
                    <span>{getOptionLabel(opt)}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LRForm({ editId, fromQuotationId, onNav, autoPreview, autoPrint }: Props) {
  const [form, setForm] = useState<Partial<LorryReceipt>>({
    date: new Date().toISOString().split('T')[0],
    freight_status: 'To Pay',
    payment_terms: 'To Pay',
    goods: [emptyGoods()],
    freight_charge: 0,
    loading_charge: 0,
    unloading_charge: 0,
    detention_charge: 0,
    other_charges: 0,
    status: 'created',
  });
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    basic: true, parties: true, transport: true,
    goods: true, charges: true,
  });
  const [showPreview, setShowPreview] = useState(autoPreview || autoPrint || false);
  const [saved, setSaved] = useState(false);
  const autoPrintRef = useRef(false);

  const emptyCustomer: Partial<Customer> = { name: '', gstin: '', phone: '', email: '', address: '', city: '', state: '', pincode: '', contact_person: '', credit_days: 0, notes: '' };
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [modalType, setModalType] = useState<'consignor' | 'consignee' | null>(null);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>(emptyCustomer);
  const [savingCustomer, setSavingCustomer] = useState(false);

  const emptyVehicle: Partial<Vehicle> = { vehicle_number: '', vehicle_type: '', owner_name: '', owner_phone: '' };
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>(emptyVehicle);
  const [savingVehicle, setSavingVehicle] = useState(false);

  const emptyDriver: Partial<Driver> = { name: '', phone: '', license_number: '' };
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [newDriver, setNewDriver] = useState<Partial<Driver>>(emptyDriver);
  const [savingDriver, setSavingDriver] = useState(false);

  useEffect(() => {
    loadMasterData();
    if (editId) loadLR(editId);
    else if (fromQuotationId) loadQuotation(fromQuotationId);
    else generateLRNumber();
  }, [editId, fromQuotationId]);

  useEffect(() => {
    if (autoPrint && form.lr_number && !autoPrintRef.current && showPreview) {
      autoPrintRef.current = true;
      const timer = setTimeout(() => {
        window.print();
      }, 1000); // 1000ms delay to make sure styles/logos have fully drawn
      return () => clearTimeout(timer);
    }
  }, [autoPrint, form.lr_number, showPreview]);

  async function loadQuotation(id: string) {
    const { data } = await api.from('quotations').select('*').eq('id', id).maybeSingle();
    if (data) {
      const g = emptyGoods();
      g.description = `Vehicle: ${data.vehicle_type || ''}`;
      g.actual_weight = data.weight || '';
      const n = await getNextNumber('lr');
      setForm(f => ({
        ...f,
        lr_number: n,
        from_location: data.from_location,
        to_location: data.to_location,
        vehicle_number: data.vehicle_type, // Quotation has type, not number
        consignor_name: data.customer_name,
        consignor_id: data.customer_id,
        freight_charge: data.rate || 0,
        loading_charge: data.loading_charge || 0,
        unloading_charge: data.unloading_charge || 0,
        other_charges: data.other_charges || 0,
        goods: [g],
      }));
    }
  }

  async function loadMasterData() {
    const [compRes, custRes, vehicleRes, driverRes] = await Promise.all([
      api.from('company_settings').select('*').maybeSingle(),
      api.from('customers').select('*').order('name'),
      api.from('vehicles').select('*').order('vehicle_number'),
      api.from('drivers').select('*').order('name'),
    ]);
    setCompany(compRes.data);
    setCustomers(custRes.data || []);
    setVehicles(vehicleRes.data || []);
    setDrivers(driverRes.data || []);
  }

  async function generateLRNumber() {
    const num = await getNextNumber('lr');
    setForm(f => ({ ...f, lr_number: num }));
  }

  async function loadLR(id: string) {
    const { data } = await api.from('lorry_receipts').select('*').eq('id', id).maybeSingle();
    if (data) setForm({ ...data, goods: data.goods || [emptyGoods()] });
  }

  const setField = useCallback((field: keyof LorryReceipt, value: unknown) => {
    setForm(f => ({ ...f, [field]: value }));
  }, []);

  function selectConsignor(value: string) {
    if (value === 'NEW') {
      setModalType('consignor');
      setNewCustomer(emptyCustomer);
      setShowCustomerModal(true);
      return;
    }
    const c = customers.find(x => x.id === value);
    if (!c) {
      setForm(f => ({ ...f, consignor_id: '' }));
      return;
    }
    setForm(f => ({
      ...f,
      consignor_id: c.id,
      consignor_name: c.name,
      consignor_address: [c.address, c.city, c.state, c.pincode].filter(Boolean).join(', '),
      consignor_gstin: c.gstin || '',
      consignor_phone: c.phone || '',
    }));
  }

  function selectConsignee(value: string) {
    if (value === 'NEW') {
      setModalType('consignee');
      setNewCustomer(emptyCustomer);
      setShowCustomerModal(true);
      return;
    }
    const c = customers.find(x => x.id === value);
    if (!c) {
      setForm(f => ({ ...f, consignee_id: '' }));
      return;
    }
    setForm(f => ({
      ...f,
      consignee_id: c.id,
      consignee_name: c.name,
      consignee_address: [c.address, c.city, c.state, c.pincode].filter(Boolean).join(', '),
      consignee_gstin: c.gstin || '',
      consignee_phone: c.phone || '',
    }));
  }

  function editSelectedCustomer(type: 'consignor' | 'consignee') {
    const id = type === 'consignor' ? form.consignor_id : form.consignee_id;
    const c = customers.find(x => x.id === id);
    if (c) {
      setModalType(type);
      setNewCustomer(c);
      setShowCustomerModal(true);
    }
  }

  function editSelectedVehicle() {
    if (!form.vehicle_id) return;
    const v = vehicles.find(x => x.id === form.vehicle_id);
    if (v) {
      setNewVehicle(v);
      setShowVehicleModal(true);
    }
  }

  function editSelectedDriver() {
    if (!form.driver_id) return;
    const d = drivers.find(x => x.id === form.driver_id);
    if (d) {
      setNewDriver(d);
      setShowDriverModal(true);
    }
  }

  function selectVehicle(value: string) {
    if (value === 'NEW') {
      setNewVehicle(emptyVehicle);
      setShowVehicleModal(true);
      return;
    }
    const v = vehicles.find(x => x.id === value);
    if (!v) {
      setForm(f => ({ ...f, vehicle_id: '', vehicle_number: '' }));
      return;
    }
    setForm(f => ({ ...f, vehicle_id: v.id, vehicle_number: v.vehicle_number }));
  }

  function selectDriver(value: string) {
    if (value === 'NEW') {
      setNewDriver(emptyDriver);
      setShowDriverModal(true);
      return;
    }
    const d = drivers.find(x => x.id === value);
    if (!d) {
      setForm(f => ({ ...f, driver_id: '', driver_name: '', driver_phone: '' }));
      return;
    }
    setForm(f => ({ ...f, driver_id: d.id, driver_name: d.name, driver_phone: d.phone || '' }));
  }

  function updateGoods(index: number, field: keyof GoodsLine, value: string) {
    setForm(f => {
      const goods = [...(f.goods || [])];
      goods[index] = { ...goods[index], [field]: value };
      return { ...f, goods };
    });
  }

  function addGoods() {
    setForm(f => ({ ...f, goods: [...(f.goods || []), emptyGoods()] }));
  }

  function removeGoods(index: number) {
    setForm(f => {
      const goods = (f.goods || []).filter((_, i) => i !== index);
      return { ...f, goods: goods.length ? goods : [emptyGoods()] };
    });
  }

  const subTotal = (Number(form.freight_charge) || 0) +
    (Number(form.loading_charge) || 0) +
    (Number(form.unloading_charge) || 0) +
    (Number(form.detention_charge) || 0) +
    (Number(form.other_charges) || 0);

  const gstAmt = (subTotal * (Number(form.gst_rate) || 0)) / 100;
  const total = subTotal + gstAmt;

  const isIntraState = form.party_code === 'cgst_sgst' || (!form.party_code);

  async function handleSave(status = form.status) {
    if (!form.lr_number) return;
    setSaving(true);
    const payload = { ...form, gst_amount: gstAmt, total_amount: total, status: status || 'created', updated_at: new Date().toISOString() };

    let error;
    if (editId) {
      ({ error } = await api.from('lorry_receipts').update(payload).eq('id', editId));
    } else {
      ({ error } = await api.from('lorry_receipts').insert([payload]));
    }

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (!editId) onNav({ page: 'lr-list' });
    } else {
      alert('Save failed: ' + error.message);
    }
  }

  async function saveNewCustomer() {
    if (!newCustomer.name) return;
    setSavingCustomer(true);
    let data, error;
    if (newCustomer.id) {
      ({ data, error } = await api.from('customers').update(newCustomer).eq('id', newCustomer.id));
    } else {
      ({ data, error } = await api.from('customers').insert(newCustomer));
    }
    setSavingCustomer(false);

    if (!error && data) {
      if (newCustomer.id) {
        setCustomers(prev => prev.map(c => c.id === data.id ? data : c));
      } else {
        setCustomers(prev => [...prev, data]);
      }
      setShowCustomerModal(false);

      // Auto-select the newly created/updated customer
      if (modalType === 'consignor') {
        setForm(f => ({
          ...f,
          consignor_id: data.id,
          consignor_name: data.name,
          consignor_address: [data.address, data.city, data.state, data.pincode].filter(Boolean).join(', '),
          consignor_gstin: data.gstin || '',
          consignor_phone: data.phone || '',
        }));
      } else if (modalType === 'consignee') {
        setForm(f => ({
          ...f,
          consignee_id: data.id,
          consignee_name: data.name,
          consignee_address: [data.address, data.city, data.state, data.pincode].filter(Boolean).join(', '),
          consignee_gstin: data.gstin || '',
          consignee_phone: data.phone || '',
        }));
      }
    } else {
      alert('Save failed: ' + error?.message);
    }
  }

  async function saveNewVehicle() {
    if (!newVehicle.vehicle_number) return;
    setSavingVehicle(true);
    let data, error;
    if (newVehicle.id) {
      ({ data, error } = await api.from('vehicles').update(newVehicle).eq('id', newVehicle.id));
    } else {
      ({ data, error } = await api.from('vehicles').insert(newVehicle));
    }
    setSavingVehicle(false);

    if (!error && data) {
      if (newVehicle.id) {
        setVehicles(prev => prev.map(v => v.id === data.id ? data : v));
      } else {
        setVehicles(prev => [...prev, data]);
      }
      setShowVehicleModal(false);
      setForm(f => ({ ...f, vehicle_id: data.id, vehicle_number: data.vehicle_number }));
    } else {
      alert('Save failed: ' + error?.message);
    }
  }

  async function saveNewDriver() {
    if (!newDriver.name) return;
    setSavingDriver(true);
    let data, error;
    if (newDriver.id) {
      ({ data, error } = await api.from('drivers').update(newDriver).eq('id', newDriver.id));
    } else {
      ({ data, error } = await api.from('drivers').insert(newDriver));
    }
    setSavingDriver(false);

    if (!error && data) {
      if (newDriver.id) {
        setDrivers(prev => prev.map(d => d.id === data.id ? data : d));
      } else {
        setDrivers(prev => [...prev, data]);
      }
      setShowDriverModal(false);
      setForm(f => ({ ...f, driver_id: data.id, driver_name: data.name, driver_phone: data.phone || '' }));
    } else {
      alert('Save failed: ' + error?.message);
    }
  }

  function toggleSection(key: string) {
    setExpanded(e => ({ ...e, [key]: !e[key] }));
  }

  const downloadPDF = () => {
    const element = document.getElementById('lr-pdf-preview-container') || document.getElementById('lr-pdf-preview-container-hidden');
    if (!element) return;

    const opt = {
      margin: 0,
      filename: `LR_${form.lr_number || 'New'}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 794 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const inputClass = "form-input";
  const labelClass = "form-label";

  return (
    <div className="h-full flex flex-col">
      {/* Sticky Action Bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => onNav({ page: 'lr-list' })} className="btn-ghost">
            <ArrowLeft size={15} /> Back
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <div>
            <span className="text-xs text-gray-400">Lorry Receipt</span>
            <div className="text-sm font-bold text-gray-900">{form.lr_number || 'New LR'}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(p => !p)}
            className={`btn-ghost ${showPreview ? 'text-brand' : ''}`}
          >
            <Eye size={15} />
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
          <button onClick={() => handleSave('created')} disabled={saving} className="btn-secondary">
            <Save size={15} />
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Draft'}
          </button>
          <button onClick={() => window.print()} className="btn-secondary">
            <Printer size={15} />
            Print
          </button>
          <button onClick={downloadPDF} className="btn-secondary text-brand hover:text-brand-dark border-brand/20 hover:border-brand/40 bg-brand/5 hover:bg-brand/10 transition-colors">
            <Download size={15} />
            Download PDF
          </button>
          <button onClick={() => handleSave('in-transit')} disabled={saving} className="btn-primary">
            <FileText size={15} />
            Generate LR
          </button>
        </div>
      </div>

      {/* Split View */}
      <div className={`flex-1 flex overflow-hidden`}>
        {/* Form Panel */}
        {!showPreview && (
          <div className="w-full overflow-y-auto bg-[#F5F7FA]">
            <div className="p-5 max-w-5xl mx-auto space-y-3">
              {sections.map(s => (
                <div key={s.key} className="card overflow-hidden">
                  <button
                    onClick={() => toggleSection(s.key)}
                    className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-gray-800 text-sm">{s.label}</span>
                    {expanded[s.key] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </button>

                  {expanded[s.key] && (
                    <div className="px-5 pb-5 border-t border-gray-100">
                      {/* BASIC */}
                      {s.key === 'basic' && (
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div>
                            <label className={labelClass}>LR Number</label>
                            <input className={inputClass} value={form.lr_number || ''} onChange={e => setField('lr_number', e.target.value)} />
                          </div>
                          <div>
                            <label className={labelClass}>Date</label>
                            <input type="date" className={inputClass} value={form.date || ''} onChange={e => setField('date', e.target.value)} />
                          </div>
                          <div>
                            <label className={labelClass}>Branch</label>
                            <select
                              className={inputClass}
                              value={
                                ['Coimbatore', 'Chennai'].includes(form.branch || '')
                                  ? form.branch
                                  : form.branch
                                    ? 'CUSTOM'
                                    : ''
                              }
                              onChange={e => {
                                const val = e.target.value;
                                if (val === 'CUSTOM') {
                                  setField('branch', '');
                                } else {
                                  setField('branch', val);
                                }
                              }}
                            >
                              <option value="">— Select —</option>
                              <option value="Coimbatore">Coimbatore</option>
                              <option value="Chennai">Chennai</option>
                              <option value="CUSTOM">Custom Branch</option>
                            </select>
                            {(!['Coimbatore', 'Chennai'].includes(form.branch || '') || form.branch === '') && (
                              <input
                                className={`${inputClass} mt-1.5`}
                                placeholder="Enter custom branch"
                                value={form.branch || ''}
                                onChange={e => setField('branch', e.target.value)}
                              />
                            )}
                          </div>
                          <div>
                            <label className={labelClass}>From Location (Origin)</label>
                            <input list="indian-cities" className={inputClass} placeholder="e.g. Coimbatore" value={form.from_location || ''} onChange={e => setField('from_location', e.target.value)} />
                          </div>
                          <div>
                            <label className={labelClass}>To Location</label>
                            <input list="indian-cities" className={inputClass} placeholder="e.g. Chennai" value={form.to_location || ''} onChange={e => setField('to_location', e.target.value)} />
                          </div>
                          <div>
                            <label className={labelClass}>Delivery At</label>
                            <select
                              className={inputClass}
                              value={
                                ['DD unloading by party', 'DD against consignor copy', 'DD drivers copy'].includes(form.delivery_at || '')
                                  ? form.delivery_at
                                  : form.delivery_at
                                    ? 'CUSTOM'
                                    : ''
                              }
                              onChange={e => {
                                const val = e.target.value;
                                if (val === 'CUSTOM') {
                                  setField('delivery_at', '');
                                } else {
                                  setField('delivery_at', val);
                                }
                              }}
                            >
                              <option value="">— Select —</option>
                              <option value="DD unloading by party">DD unloading by party</option>
                              <option value="DD against consignor copy">DD against consignor copy</option>
                              <option value="DD drivers copy">DD drivers copy</option>
                              <option value="CUSTOM">Custom Location</option>
                            </select>
                            {(!['DD unloading by party', 'DD against consignor copy', 'DD drivers copy'].includes(form.delivery_at || '') || form.delivery_at === '') && (
                              <input
                                className={`${inputClass} mt-1.5`}
                                placeholder="Enter custom delivery location"
                                value={form.delivery_at || ''}
                                onChange={e => setField('delivery_at', e.target.value)}
                              />
                            )}
                          </div>
                          <div>
                            <label className={labelClass}>E-Way Bill No.</label>
                            <input className={inputClass} placeholder="Enter e-way bill" value={form.eway_bill_no || ''} onChange={e => setField('eway_bill_no', e.target.value)} />
                          </div>
                          <div>
                            <label className={labelClass}>Payment Terms</label>
                            <select className={inputClass} value={form.payment_terms || ''} onChange={e => setField('payment_terms', e.target.value)}>
                              <option>To Pay</option>
                              <option>Paid</option>
                              <option>TBB</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* PARTIES (CONSIGNOR & CONSIGNEE) */}
                      {s.key === 'parties' && (
                        <div className="grid grid-cols-2 gap-8 mt-4">
                          {/* CONSIGNOR */}
                          <div className="space-y-3 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                              <h3 className="font-semibold text-gray-800">Consignor (From)</h3>
                              {form.consignor_id && (
                                <button onClick={() => editSelectedCustomer('consignor')} className="text-xs text-brand hover:underline font-medium">
                                  Edit Details
                                </button>
                              )}
                            </div>
                            <SearchableDropdown<Customer>
                              label="Select Customer"
                              options={customers}
                              selectedValue={form.consignor_id || ''}
                              placeholder="Select Consignor"
                              onSelect={selectConsignor}
                              getOptionId={c => c.id}
                              getOptionLabel={c => c.name}
                              addNewLabel="+ Add New Customer"
                              onAddNew={() => selectConsignor('NEW')}
                              renderHoverInfo={c => (
                                <div className="space-y-1 text-gray-700">
                                  <div className="font-bold text-gray-900 text-sm mb-1">{c.name}</div>
                                  {c.gstin && <div><span className="text-gray-400 font-semibold">GSTIN:</span> {c.gstin}</div>}
                                  {c.phone && <div><span className="text-gray-400 font-semibold">Phone:</span> {c.phone}</div>}
                                  {c.address && <div className="mt-1"><span className="text-gray-400 font-semibold">Address:</span> {[c.address, c.city, c.state, c.pincode].filter(Boolean).join(', ')}</div>}
                                </div>
                              )}
                            />

                            {form.consignor_id && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                                <div className="font-semibold text-gray-900">{form.consignor_name}</div>
                                {form.consignor_gstin && <div className="text-gray-500 mt-1"><span className="text-gray-400">GSTIN:</span> {form.consignor_gstin}</div>}
                                {form.consignor_phone && <div className="text-gray-500"><span className="text-gray-400">Phone:</span> {form.consignor_phone}</div>}
                                {form.consignor_address && <div className="text-gray-500 mt-1"><span className="text-gray-400">Address:</span> {form.consignor_address}</div>}
                              </div>
                            )}
                          </div>

                          {/* CONSIGNEE */}
                          <div className="space-y-3 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                              <h3 className="font-semibold text-gray-800">Consignee (To)</h3>
                              {form.consignee_id && (
                                <button onClick={() => editSelectedCustomer('consignee')} className="text-xs text-brand hover:underline font-medium">
                                  Edit Details
                                </button>
                              )}
                            </div>
                            <SearchableDropdown<Customer>
                              label="Select Customer"
                              options={customers}
                              selectedValue={form.consignee_id || ''}
                              placeholder="Select Consignee"
                              onSelect={selectConsignee}
                              getOptionId={c => c.id}
                              getOptionLabel={c => c.name}
                              addNewLabel="+ Add New Customer"
                              onAddNew={() => selectConsignee('NEW')}
                              tooltipAlign="left"
                              renderHoverInfo={c => (
                                <div className="space-y-1 text-gray-700">
                                  <div className="font-bold text-gray-900 text-sm mb-1">{c.name}</div>
                                  {c.gstin && <div><span className="text-gray-400 font-semibold">GSTIN:</span> {c.gstin}</div>}
                                  {c.phone && <div><span className="text-gray-400 font-semibold">Phone:</span> {c.phone}</div>}
                                  {c.address && <div className="mt-1"><span className="text-gray-400 font-semibold">Address:</span> {[c.address, c.city, c.state, c.pincode].filter(Boolean).join(', ')}</div>}
                                </div>
                              )}
                            />

                            {form.consignee_id && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                                <div className="font-semibold text-gray-900">{form.consignee_name}</div>
                                {form.consignee_gstin && <div className="text-gray-500 mt-1"><span className="text-gray-400">GSTIN:</span> {form.consignee_gstin}</div>}
                                {form.consignee_phone && <div className="text-gray-500"><span className="text-gray-400">Phone:</span> {form.consignee_phone}</div>}
                                {form.consignee_address && <div className="text-gray-500 mt-1"><span className="text-gray-400">Address:</span> {form.consignee_address}</div>}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* TRANSPORT */}
                      {s.key === 'transport' && (
                        <div className="grid grid-cols-2 gap-8 mt-4">
                          {/* VEHICLE */}
                          <div className="space-y-3 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                              <h3 className="font-semibold text-gray-800">Vehicle Details</h3>
                              {form.vehicle_id && (
                                <button onClick={editSelectedVehicle} className="text-xs text-brand hover:underline font-medium">
                                  Edit Details
                                </button>
                              )}
                            </div>
                            <SearchableDropdown<Vehicle>
                              label="Select Vehicle"
                              options={vehicles}
                              selectedValue={form.vehicle_id || ''}
                              placeholder="Select Vehicle"
                              onSelect={selectVehicle}
                              getOptionId={v => v.id}
                              getOptionLabel={v => v.vehicle_number}
                              addNewLabel="+ Add New Vehicle"
                              onAddNew={() => selectVehicle('NEW')}
                              renderHoverInfo={v => (
                                <div className="space-y-1 text-gray-700">
                                  <div className="font-bold text-gray-900 text-sm mb-1">{v.vehicle_number}</div>
                                  {v.vehicle_type && <div><span className="text-gray-400 font-semibold">Type:</span> {v.vehicle_type}</div>}
                                  {v.owner_name && <div><span className="text-gray-400 font-semibold">Owner:</span> {v.owner_name}</div>}
                                  {v.owner_phone && <div><span className="text-gray-400 font-semibold">Owner Phone:</span> {v.owner_phone}</div>}
                                </div>
                              )}
                            />

                            {form.vehicle_id && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                                <div className="font-semibold text-gray-900 text-base">{form.vehicle_number}</div>
                                {(() => {
                                  const v = vehicles.find(x => x.id === form.vehicle_id);
                                  if (!v) return null;
                                  return (
                                    <>
                                      {v.vehicle_type && <div className="text-gray-500 mt-1"><span className="text-gray-400">Type:</span> {v.vehicle_type}</div>}
                                      {v.owner_name && <div className="text-gray-500"><span className="text-gray-400">Owner:</span> {v.owner_name}</div>}
                                      {v.owner_phone && <div className="text-gray-500"><span className="text-gray-400">Owner Phone:</span> {v.owner_phone}</div>}
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </div>

                          {/* DRIVER */}
                          <div className="space-y-3 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                              <h3 className="font-semibold text-gray-800">Driver Details</h3>
                              {form.driver_id && (
                                <button onClick={editSelectedDriver} className="text-xs text-brand hover:underline font-medium">
                                  Edit Details
                                </button>
                              )}
                            </div>
                            <SearchableDropdown<Driver>
                              label="Select Driver"
                              options={drivers}
                              selectedValue={form.driver_id || ''}
                              placeholder="Select Driver"
                              onSelect={selectDriver}
                              getOptionId={d => d.id}
                              getOptionLabel={d => d.name}
                              addNewLabel="+ Add New Driver"
                              onAddNew={() => selectDriver('NEW')}
                              tooltipAlign="left"
                              renderHoverInfo={d => (
                                <div className="space-y-1 text-gray-700">
                                  <div className="font-bold text-gray-900 text-sm mb-1">{d.name}</div>
                                  {d.phone && <div><span className="text-gray-400 font-semibold">Phone:</span> {d.phone}</div>}
                                  {d.license_number && <div><span className="text-gray-400 font-semibold">License:</span> {d.license_number}</div>}
                                </div>
                              )}
                            />

                            {form.driver_id && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                                <div className="font-semibold text-gray-900 text-base">{form.driver_name}</div>
                                {form.driver_phone && <div className="text-gray-500 mt-1"><span className="text-gray-400">Phone:</span> {form.driver_phone}</div>}
                                {(() => {
                                  const d = drivers.find(x => x.id === form.driver_id);
                                  if (d && d.license_number) {
                                    return <div className="text-gray-500"><span className="text-gray-400">License:</span> {d.license_number}</div>;
                                  }
                                  return null;
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* GOODS */}
                      {s.key === 'goods' && (
                        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                          <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
                            <thead>
                              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                                <th className="p-3 font-medium">Description</th>
                                <th className="p-3 font-medium w-24">Packages</th>
                                <th className="p-3 font-medium w-28">Actual Wt</th>
                                <th className="p-3 font-medium w-28">Charged Wt</th>
                                <th className="p-3 font-medium w-32">Invoice No</th>
                                <th className="p-3 font-medium w-36">Invoice Date</th>
                                <th className="p-3 font-medium w-28">Value (₹)</th>
                                <th className="p-3 font-medium w-12"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                              {(form.goods || []).map((g, i) => (
                                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="p-2"><input className="w-full bg-transparent border-0 focus:ring-1 focus:ring-brand rounded px-2 py-1.5 text-sm outline-none" placeholder="Description" value={g.description} onChange={e => updateGoods(i, 'description', e.target.value)} /></td>
                                  <td className="p-2"><input type="number" className="w-full bg-transparent border-0 focus:ring-1 focus:ring-brand rounded px-2 py-1.5 text-sm outline-none" placeholder="Pkgs" value={g.packages as string} onChange={e => updateGoods(i, 'packages', e.target.value)} /></td>
                                  <td className="p-2"><input type="number" className="w-full bg-transparent border-0 focus:ring-1 focus:ring-brand rounded px-2 py-1.5 text-sm outline-none" placeholder="KG" value={g.actual_weight as string} onChange={e => updateGoods(i, 'actual_weight', e.target.value)} /></td>
                                  <td className="p-2"><input type="number" className="w-full bg-transparent border-0 focus:ring-1 focus:ring-brand rounded px-2 py-1.5 text-sm outline-none" placeholder="KG" value={g.charged_weight as string} onChange={e => updateGoods(i, 'charged_weight', e.target.value)} /></td>
                                  <td className="p-2"><input className="w-full bg-transparent border-0 focus:ring-1 focus:ring-brand rounded px-2 py-1.5 text-sm outline-none" placeholder="Inv No" value={g.invoice_no} onChange={e => updateGoods(i, 'invoice_no', e.target.value)} /></td>
                                  <td className="p-2"><input type="date" className="w-full bg-transparent border-0 focus:ring-1 focus:ring-brand rounded px-2 py-1.5 text-sm text-gray-600 outline-none" value={g.invoice_date} onChange={e => updateGoods(i, 'invoice_date', e.target.value)} /></td>
                                  <td className="p-2"><input type="number" className="w-full bg-transparent border-0 focus:ring-1 focus:ring-brand rounded px-2 py-1.5 text-sm outline-none" placeholder="₹0" value={g.value as string} onChange={e => updateGoods(i, 'value', e.target.value)} /></td>
                                  <td className="p-2 text-center">
                                    {(form.goods || []).length > 1 ? (
                                      <button onClick={() => removeGoods(i)} className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                                        <Trash2 size={16} />
                                      </button>
                                    ) : <div className="w-8"></div>}
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-gray-50 border-t border-gray-200">
                                <td colSpan={8} className="p-0">
                                  <button onClick={addGoods} className="w-full py-2.5 text-sm text-brand hover:text-brand-dark font-medium flex items-center justify-center gap-1 hover:bg-brand/5 transition-colors">
                                    <Plus size={16} /> Add Next Row
                                  </button>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* CHARGES */}
                      {s.key === 'charges' && (
                        <div className="mt-4 flex flex-col lg:flex-row gap-6">
                          <div className="flex-1 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                                  <th className="p-3 font-medium">Charge Details</th>
                                  <th className="p-3 font-medium w-48 text-right">Amount (₹)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 bg-white">
                                {[
                                  { label: 'Freight Charge', field: 'freight_charge' as const },
                                  { label: 'Loading Charge', field: 'loading_charge' as const },
                                  { label: 'Unloading Charge', field: 'unloading_charge' as const },
                                  { label: 'Detention / Halting', field: 'detention_charge' as const },
                                  { label: 'Other Charges', field: 'other_charges' as const },
                                ].map(({ label, field }) => (
                                  <tr key={field} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-3 text-sm text-gray-700 font-medium">{label}</td>
                                    <td className="p-2">
                                      <input
                                        type="number"
                                        className="w-full text-right bg-transparent border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand rounded-md px-2 py-1.5 text-sm outline-none transition-shadow"
                                        value={form[field] || ''}
                                        onChange={e => setField(field, Number(e.target.value))}
                                      />
                                    </td>
                                  </tr>
                                ))}
                                <tr className="bg-gray-50 border-t border-gray-200">
                                  <td className="p-3 text-sm text-gray-700 font-medium">GST Type</td>
                                  <td className="p-2">
                                    <select
                                      className="w-full text-right bg-white border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand rounded-md px-2 py-1.5 text-sm outline-none transition-shadow"
                                      value={form.party_code || (isIntraState ? 'cgst_sgst' : 'igst')}
                                      onChange={e => setField('party_code', e.target.value)}
                                    >
                                      <option value="cgst_sgst">CGST + SGST</option>
                                      <option value="igst">IGST</option>
                                    </select>
                                  </td>
                                </tr>
                                <tr className="bg-gray-50">
                                  <td className="p-3 text-sm text-gray-700 font-medium">GST Rate (%)</td>
                                  <td className="p-2">
                                    <select
                                      className="w-full text-right bg-white border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand rounded-md px-2 py-1.5 text-sm outline-none transition-shadow"
                                      value={form.gst_rate || 0}
                                      onChange={e => setField('gst_rate', Number(e.target.value))}
                                    >
                                      {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                                    </select>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          <div className="lg:w-80 shrink-0">
                            <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl p-6 text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                              <h4 className="text-slate-400 text-xs font-semibold mb-5 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-brand"></span>
                                Payment Summary
                              </h4>
                              <div className="space-y-3.5">
                                <div className="flex justify-between text-sm items-center"><span className="text-slate-300">Sub Total</span><span className="font-medium text-base">₹{subTotal.toLocaleString('en-IN')}</span></div>
                                {gstAmt > 0 && (
                                  isIntraState ? (
                                    <>
                                      <div className="flex justify-between text-sm"><span className="text-slate-400">CGST ({(form.gst_rate || 0) / 2}%)</span><span>₹{(gstAmt / 2).toLocaleString('en-IN')}</span></div>
                                      <div className="flex justify-between text-sm"><span className="text-slate-400">SGST ({(form.gst_rate || 0) / 2}%)</span><span>₹{(gstAmt / 2).toLocaleString('en-IN')}</span></div>
                                    </>
                                  ) : (
                                    <div className="flex justify-between text-sm"><span className="text-slate-400">IGST ({form.gst_rate}%)</span><span>₹{gstAmt.toLocaleString('en-IN')}</span></div>
                                  )
                                )}
                                <div className="flex justify-between font-bold text-2xl pt-4 border-t border-slate-700/60 mt-2 text-white items-end">
                                  <span className="text-sm font-medium text-slate-300 mb-1">Total</span>
                                  <span className="text-emerald-400">₹{total.toLocaleString('en-IN')}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}


                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PDF Preview Panel */}
        {showPreview && (
          <div className="w-full overflow-y-auto bg-gray-200 p-6">
            <div className="flex justify-center">
              <div className="w-[794px]">
                <div className="text-xs text-gray-400 text-center mb-3 font-medium">LIVE PREVIEW — updates as you type</div>
                <div id="lr-pdf-preview-container" className="shadow-2xl overflow-hidden print-area bg-white w-[794px]">
                  <LRPdfPreview lr={form} company={company} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden PDF container for downloading when preview is closed */}
      {!showPreview && (
        <div className="print-only-container-hidden print-area">
          <style>{`
            @media screen {
              .print-only-container-hidden {
                display: none !important;
              }
            }
            @media print {
              .print-only-container-hidden {
                display: block !important;
                position: absolute;
                left: 0;
                top: 0;
                width: 794px;
                visibility: visible !important;
              }
              .print-only-container-hidden * {
                visibility: visible !important;
              }
            }
          `}</style>
          <div id="lr-pdf-preview-container-hidden" className="bg-white w-[794px]">
            <LRPdfPreview lr={form} company={company} />
          </div>
        </div>
      )}

      {/* NEW CUSTOMER MODAL */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-lg text-gray-900">
                Add New {modalType === 'consignor' ? 'Consignor' : 'Consignee'}
              </h2>
              <button onClick={() => setShowCustomerModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-light">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelClass}>Company Name *</label>
                  <input className={inputClass} value={newCustomer.name || ''} onChange={e => setNewCustomer(c => ({ ...c, name: e.target.value }))} autoFocus />
                </div>
                <div>
                  <label className={labelClass}>GSTIN</label>
                  <input className={inputClass} value={newCustomer.gstin || ''} onChange={e => setNewCustomer(c => ({ ...c, gstin: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input className={inputClass} value={newCustomer.phone || ''} onChange={e => setNewCustomer(c => ({ ...c, phone: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Address</label>
                  <input className={inputClass} value={newCustomer.address || ''} onChange={e => setNewCustomer(c => ({ ...c, address: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input className={inputClass} value={newCustomer.city || ''} onChange={e => setNewCustomer(c => ({ ...c, city: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <input className={inputClass} value={newCustomer.state || ''} onChange={e => setNewCustomer(c => ({ ...c, state: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>Pincode</label>
                  <input className={inputClass} value={newCustomer.pincode || ''} onChange={e => setNewCustomer(c => ({ ...c, pincode: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowCustomerModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={saveNewCustomer} disabled={savingCustomer || !newCustomer.name} className="btn-primary">
                {savingCustomer ? 'Saving...' : 'Save Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW VEHICLE MODAL */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-lg text-gray-900">Add New Vehicle</h2>
              <button onClick={() => setShowVehicleModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-light">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className={labelClass}>Vehicle Number *</label>
                <input className={inputClass} value={newVehicle.vehicle_number || ''} onChange={e => setNewVehicle(v => ({ ...v, vehicle_number: e.target.value }))} autoFocus />
              </div>
              <div>
                <label className={labelClass}>Vehicle Type</label>
                <input className={inputClass} value={newVehicle.vehicle_type || ''} onChange={e => setNewVehicle(v => ({ ...v, vehicle_type: e.target.value }))} placeholder="e.g. Open Body, Container" />
              </div>
              <div>
                <label className={labelClass}>Owner Name</label>
                <input className={inputClass} value={newVehicle.owner_name || ''} onChange={e => setNewVehicle(v => ({ ...v, owner_name: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>Owner Phone</label>
                <input className={inputClass} value={newVehicle.owner_phone || ''} onChange={e => setNewVehicle(v => ({ ...v, owner_phone: e.target.value }))} />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowVehicleModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={saveNewVehicle} disabled={savingVehicle || !newVehicle.vehicle_number} className="btn-primary">
                {savingVehicle ? 'Saving...' : 'Save Vehicle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW DRIVER MODAL */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-lg text-gray-900">Add New Driver</h2>
              <button onClick={() => setShowDriverModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-light">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className={labelClass}>Driver Name *</label>
                <input className={inputClass} value={newDriver.name || ''} onChange={e => setNewDriver(d => ({ ...d, name: e.target.value }))} autoFocus />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input className={inputClass} value={newDriver.phone || ''} onChange={e => setNewDriver(d => ({ ...d, phone: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>License Number</label>
                <input className={inputClass} value={newDriver.license_number || ''} onChange={e => setNewDriver(d => ({ ...d, license_number: e.target.value }))} />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowDriverModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={saveNewDriver} disabled={savingDriver || !newDriver.name} className="btn-primary">
                {savingDriver ? 'Saving...' : 'Save Driver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INDIAN CITIES DATALIST */}
      <datalist id="indian-cities">
        {INDIAN_CITIES.map(city => (
          <option key={city} value={city} />
        ))}
      </datalist>
    </div>
  );
}
