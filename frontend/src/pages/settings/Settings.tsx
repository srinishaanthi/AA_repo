import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { CompanySettings, NumberSeries, Tax, Bank } from '../../types';
import { Save, Plus, Trash2, Building2, Hash, Receipt, Landmark, Users } from 'lucide-react';

type Tab = 'company' | 'series' | 'taxes' | 'banks' | 'users';

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'company', label: 'Company', icon: <Building2 size={15} /> },
  { key: 'series', label: 'Number Series', icon: <Hash size={15} /> },
  { key: 'taxes', label: 'Taxes', icon: <Receipt size={15} /> },
  { key: 'banks', label: 'Banks', icon: <Landmark size={15} /> },
  { key: 'users', label: 'Users', icon: <Users size={15} /> },
];

export default function Settings() {
  const [tab, setTab] = useState<Tab>('company');
  const [company, setCompany] = useState<Partial<CompanySettings>>({});
  const [series, setSeries] = useState<NumberSeries[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [compRes, serRes, taxRes, bankRes] = await Promise.all([
      api.from('company_settings').select('*').maybeSingle(),
      api.from('number_series').select('*').order('series_type'),
      api.from('taxes').select('*').order('rate'),
      api.from('banks').select('*').order('bank_name'),
    ]);
    setCompany(compRes.data || {});
    setSeries(serRes.data || []);
    setTaxes(taxRes.data || []);
    setBanks(bankRes.data || []);
  }

  async function saveCompany() {
    setSaving(true);
    let error;
    if (company.id) ({ error } = await api.from('company_settings').update(company).eq('id', company.id));
    else ({ error } = await api.from('company_settings').insert([company]));
    setSaving(false);
    if (!error) { setSaved('company'); setTimeout(() => setSaved(''), 2000); loadAll(); }
    else alert('Save failed: ' + error.message);
  }

  async function saveSeries(s: NumberSeries) {
    await api.from('number_series').update(s).eq('id', s.id);
    loadAll();
  }

  async function saveTax(t: Partial<Tax>) {
    if (t.id) await api.from('taxes').update(t).eq('id', t.id);
    else await api.from('taxes').insert([t]);
    loadAll();
  }

  async function deleteTax(id: string) {
    if (!confirm('Delete this tax?')) return;
    await api.from('taxes').delete().eq('id', id);
    loadAll();
  }

  async function saveBank(b: Partial<Bank>) {
    if (b.id) await api.from('banks').update(b).eq('id', b.id);
    else await api.from('banks').insert([b]);
    loadAll();
  }

  async function deleteBank(id: string) {
    if (!confirm('Delete this bank?')) return;
    await api.from('banks').delete().eq('id', id);
    loadAll();
  }

  const inp = 'form-input';
  const lbl = 'form-label';

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Configure your TMS application</p>
      </div>

      <div className="flex gap-6">
        {/* Tab Nav */}
        <div className="w-48 flex-shrink-0">
          <div className="card p-2 space-y-0.5">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${tab === t.key ? 'bg-brand text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {/* Company */}
          {tab === 'company' && (
            <div className="card p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h2 className="font-semibold text-gray-900">Company Profile</h2>
                <button onClick={saveCompany} disabled={saving} className="btn-primary">
                  <Save size={14} />{saving ? 'Saving…' : saved === 'company' ? 'Saved!' : 'Save Changes'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className={lbl}>Company Name</label><input className={inp} value={company.company_name || ''} onChange={e => setCompany(c => ({ ...c, company_name: e.target.value }))} /></div>
                <div><label className={lbl}>GSTIN</label><input className={inp} value={company.gstin || ''} onChange={e => setCompany(c => ({ ...c, gstin: e.target.value }))} /></div>
                <div><label className={lbl}>PAN</label><input className={inp} value={company.pan || ''} onChange={e => setCompany(c => ({ ...c, pan: e.target.value }))} /></div>
                <div><label className={lbl}>Phone</label><input className={inp} value={company.phone || ''} onChange={e => setCompany(c => ({ ...c, phone: e.target.value }))} /></div>
                <div><label className={lbl}>Email</label><input className={inp} value={company.email || ''} onChange={e => setCompany(c => ({ ...c, email: e.target.value }))} /></div>
                <div className="col-span-2"><label className={lbl}>Address</label><input className={inp} value={company.address || ''} onChange={e => setCompany(c => ({ ...c, address: e.target.value }))} /></div>
                <div><label className={lbl}>City</label><input className={inp} value={company.city || ''} onChange={e => setCompany(c => ({ ...c, city: e.target.value }))} /></div>
                <div><label className={lbl}>State</label><input className={inp} value={company.state || ''} onChange={e => setCompany(c => ({ ...c, state: e.target.value }))} /></div>
                <div><label className={lbl}>Pincode</label><input className={inp} value={company.pincode || ''} onChange={e => setCompany(c => ({ ...c, pincode: e.target.value }))} /></div>
                <div className="col-span-2"><label className={lbl}>Footer Text</label><input className={inp} value={company.footer_text || ''} onChange={e => setCompany(c => ({ ...c, footer_text: e.target.value }))} /></div>
                <div className="col-span-2"><label className={lbl}>Terms & Conditions</label><textarea rows={5} className={inp} value={company.terms || ''} onChange={e => setCompany(c => ({ ...c, terms: e.target.value }))} /></div>
              </div>
            </div>
          )}

          {/* Number Series */}
          {tab === 'series' && (
            <div className="card p-6 space-y-5">
              <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-4">Number Series</h2>
              <div className="space-y-4">
                {series.map(s => (
                  <div key={s.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-gray-700 capitalize">{s.series_type === 'lr' ? 'Lorry Receipt' : s.series_type === 'invoice' ? 'Lorry Invoice' : 'Quotation'}</span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className={`w-9 h-5 rounded-full transition-colors relative ${s.auto_generate ? 'bg-brand' : 'bg-gray-300'}`} onClick={() => saveSeries({ ...s, auto_generate: !s.auto_generate })}>
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${s.auto_generate ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </div>
                        <span className="text-xs text-gray-500">Auto Generate</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><label className={lbl}>Prefix</label><input className={inp} value={s.prefix} onChange={e => setSeries(arr => arr.map(x => x.id === s.id ? { ...x, prefix: e.target.value } : x))} onBlur={() => saveSeries(s)} /></div>
                      <div><label className={lbl}>Next Number</label><input type="number" className={inp} value={s.next_number} onChange={e => setSeries(arr => arr.map(x => x.id === s.id ? { ...x, next_number: Number(e.target.value) } : x))} onBlur={() => saveSeries(s)} /></div>
                      <div><label className={lbl}>Financial Year</label><input className={inp} value={s.financial_year || ''} onChange={e => setSeries(arr => arr.map(x => x.id === s.id ? { ...x, financial_year: e.target.value } : x))} onBlur={() => saveSeries(s)} /></div>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">Preview: <span className="font-mono font-medium text-gray-600">{s.prefix}{s.next_number}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Taxes */}
          {tab === 'taxes' && (
            <div className="card p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h2 className="font-semibold text-gray-900">GST Rates</h2>
                <button onClick={() => saveTax({ name: 'GST 0%', rate: 0, is_active: true })} className="btn-primary"><Plus size={14} /> Add Rate</button>
              </div>
              <div className="space-y-3">
                {taxes.map(t => (
                  <div key={t.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <input className="form-input flex-1" value={t.name} onChange={e => setTaxes(arr => arr.map(x => x.id === t.id ? { ...x, name: e.target.value } : x))} onBlur={() => saveTax(t)} />
                    <div className="flex items-center gap-2">
                      <input type="number" className="form-input w-20 text-right" value={t.rate} onChange={e => setTaxes(arr => arr.map(x => x.id === t.id ? { ...x, rate: Number(e.target.value) } : x))} onBlur={() => saveTax(t)} />
                      <span className="text-gray-500 text-sm">%</span>
                    </div>
                    <button onClick={() => deleteTax(t.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Banks */}
          {tab === 'banks' && (
            <div className="card p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h2 className="font-semibold text-gray-900">Bank Accounts</h2>
                <button onClick={() => saveBank({ bank_name: 'New Bank', is_primary: false })} className="btn-primary"><Plus size={14} /> Add Bank</button>
              </div>
              <div className="space-y-4">
                {banks.map(b => (
                  <div key={b.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Landmark size={16} className="text-brand" />
                        <span className="font-semibold text-gray-800">{b.bank_name}</span>
                        {b.is_primary && <span className="status-pill bg-brand/10 text-brand text-[9px]">Primary</span>}
                      </div>
                      <div className="flex gap-2">
                        {!b.is_primary && <button onClick={() => { banks.forEach(x => saveBank({ ...x, is_primary: x.id === b.id })); }} className="text-xs text-brand font-medium hover:underline">Set Primary</button>}
                        <button onClick={() => deleteBank(b.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={lbl}>Bank Name</label><input className={inp} value={b.bank_name} onChange={e => setBanks(arr => arr.map(x => x.id === b.id ? { ...x, bank_name: e.target.value } : x))} onBlur={() => saveBank(b)} /></div>
                      <div><label className={lbl}>Account Name</label><input className={inp} value={b.account_name || ''} onChange={e => setBanks(arr => arr.map(x => x.id === b.id ? { ...x, account_name: e.target.value } : x))} onBlur={() => saveBank(b)} /></div>
                      <div><label className={lbl}>Account Number</label><input className={inp} value={b.account_number || ''} onChange={e => setBanks(arr => arr.map(x => x.id === b.id ? { ...x, account_number: e.target.value } : x))} onBlur={() => saveBank(b)} /></div>
                      <div><label className={lbl}>IFSC Code</label><input className={inp} value={b.ifsc_code || ''} onChange={e => setBanks(arr => arr.map(x => x.id === b.id ? { ...x, ifsc_code: e.target.value } : x))} onBlur={() => saveBank(b)} /></div>
                      <div><label className={lbl}>Branch</label><input className={inp} value={b.branch || ''} onChange={e => setBanks(arr => arr.map(x => x.id === b.id ? { ...x, branch: e.target.value } : x))} onBlur={() => saveBank(b)} /></div>
                      <div><label className={lbl}>UPI ID</label><input className={inp} value={b.upi_id || ''} onChange={e => setBanks(arr => arr.map(x => x.id === b.id ? { ...x, upi_id: e.target.value } : x))} onBlur={() => saveBank(b)} /></div>
                    </div>
                  </div>
                ))}
                {banks.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">No bank accounts added. Click "Add Bank" to get started.</div>}
              </div>
            </div>
          )}

          {/* Users */}
          {tab === 'users' && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-4 mb-5">Users & Access</h2>
              <div className="text-center py-12">
                <Users size={40} className="mx-auto text-gray-200 mb-3" />
                <div className="text-gray-400 text-sm font-medium">User management coming soon</div>
                <div className="text-gray-300 text-xs mt-1">Add authentication and multi-user access control</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
