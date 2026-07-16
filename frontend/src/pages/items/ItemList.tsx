import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Item } from '../../types';
import { Plus, Search, Pencil, Trash2, Package, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ItemList() {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Partial<Item> | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showImportPanel, setShowImportPanel] = useState(false);

  const empty: Partial<Item> = { name: '', hsn_code: '', unit: 'KG', gst_rate: 0, description: '' };

  useEffect(() => { load(); }, [search]);

  async function load() {
    setLoading(true);
    let q = api.from('items').select('*').order('name');
    if (search) q = q.or(`name.ilike.%${search}%,hsn_code.ilike.%${search}%`);
    const { data } = await q;
    const loaded = data || [];
    setItems(loaded);
    setSelectedIds(prev => prev.filter(id => loaded.some((i: any) => i.id === id)));
    setLoading(false);
  }

  async function save() {
    if (!editItem?.name) return;
    setSaving(true);
    let error;
    if (editItem.id) ({ error } = await api.from('items').update(editItem).eq('id', editItem.id));
    else ({ error } = await api.from('items').insert([editItem]));
    setSaving(false);
    if (!error) { setShowForm(false); setEditItem(null); load(); }
    else alert('Save failed: ' + error.message);
  }

  async function del(id: string) {
    if (!confirm('Delete this item?')) return;
    await api.from('items').delete().eq('id', id);
    load();
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (items.length === 0) return;
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(i => i.id));
    }
  };

  const downloadTemplate = (format: 'xlsx' | 'csv') => {
    try {
      const headers = [
        'Item Name',
        'HSN Code',
        'Unit',
        'GST Rate',
        'Description'
      ];
      const exampleRow = [
        'Textile Machinery Parts',
        '8448',
        'KG',
        '18',
        'Spare parts for textile machines'
      ];

      const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Items Template');

      if (format === 'csv') {
        XLSX.writeFile(wb, 'item_import_template.csv', { bookType: 'csv' });
      } else {
        XLSX.writeFile(wb, 'item_import_template.xlsx', { bookType: 'xlsx' });
      }
    } catch (err: any) {
      console.error('Template generation error:', err);
      alert('Failed to generate template: ' + (err.message || err));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) return;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet) as any[];

        if (rows.length === 0) {
          alert('The uploaded file is empty.');
          return;
        }

        const keyMapping: Record<string, keyof Item> = {
          'itemname': 'name',
          'name': 'name',
          'hsncode': 'hsn_code',
          'hsn': 'hsn_code',
          'unit': 'unit',
          'gstrate': 'gst_rate',
          'gst': 'gst_rate',
          'description': 'description'
        };

        const parsedItems: Partial<Item>[] = rows.map((row: any) => {
          const itm: any = {};
          for (const [key, val] of Object.entries(row)) {
            const norm = key.toLowerCase().replace(/[\s_-]/g, '');
            const mappedKey = keyMapping[norm];
            if (mappedKey) {
              if (mappedKey === 'gst_rate') {
                itm[mappedKey] = val !== undefined && val !== null ? Number(val) : 0;
              } else {
                itm[mappedKey] = val !== undefined && val !== null ? String(val).trim() : '';
              }
            }
          }
          if (!itm.unit) itm.unit = 'KG';
          return itm;
        }).filter(i => i.name);

        if (parsedItems.length === 0) {
          alert('No valid item records found. Please ensure "Item Name" column is filled.');
          return;
        }

        const res = await api.post('/items/bulk', parsedItems);
        alert(`Successfully processed file. Added ${res.added_count} new items.`);
        setShowImportPanel(false);
        load();
      } catch (err: any) {
        console.error(err);
        alert('Failed to parse file: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const exportToExcel = () => {
    try {
      const listToExport = selectedIds.length > 0
        ? items.filter(i => selectedIds.includes(i.id))
        : items;

      if (listToExport.length === 0) {
        alert('No items to export.');
        return;
      }

      const dataRows = listToExport.map((i, index) => ({
        'S.No': index + 1,
        'Item Name': i.name,
        'HSN Code': i.hsn_code || '',
        'Unit': i.unit || 'KG',
        'GST Rate (%)': i.gst_rate || 0,
        'Description': i.description || ''
      }));

      const ws = XLSX.utils.json_to_sheet(dataRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Items');

      const wscols = [
        { wch: 6 },
        { wch: 30 },
        { wch: 15 },
        { wch: 10 },
        { wch: 15 },
        { wch: 40 }
      ];
      ws['!cols'] = wscols;

      XLSX.writeFile(wb, `items_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err: any) {
      console.error('Export error:', err);
      alert('Failed to export data: ' + (err.message || err));
    }
  };

  const inp = 'form-input', lbl = 'form-label';

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Items / Commodities</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {items.length} items {selectedIds.length > 0 ? `(${selectedIds.length} selected)` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImportPanel(prev => !prev)} className="btn-secondary">
            <Upload size={16} /> Import
          </button>
          <button onClick={exportToExcel} className="btn-secondary">
            <Download size={16} />
            {selectedIds.length > 0 ? `Export Selected (${selectedIds.length})` : 'Export All'}
          </button>
          <button onClick={() => { setEditItem(empty); setShowForm(true); }} className="btn-primary">
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {showImportPanel && (
        <div className="card p-6 border-dashed border-2 border-brand/35 bg-brand-light/10 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="space-y-1">
            <h3 className="font-semibold text-gray-900 text-sm">Bulk Import Items</h3>
            <p className="text-xs text-gray-500">
              Download the template, fill in details, and upload the completed Excel or CSV file. Duplicate item names will be skipped.
            </p>
            <div className="flex gap-2 text-xs font-semibold text-brand mt-1.5">
              <button onClick={() => downloadTemplate('xlsx')} className="hover:underline flex items-center gap-1">
                <Download size={12} /> Excel Template
              </button>
              <span className="text-gray-300">|</span>
              <button onClick={() => downloadTemplate('csv')} className="hover:underline flex items-center gap-1">
                <Download size={12} /> CSV Template
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="btn-secondary cursor-pointer text-xs py-1.5 px-3">
              <span>Choose File</span>
              <input 
                type="file" 
                accept=".xlsx,.csv" 
                className="hidden" 
                onChange={handleFileUpload} 
              />
            </label>
            <button onClick={() => setShowImportPanel(false)} className="btn-ghost text-xs py-1.5 px-3">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="form-input pl-9" placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {items.length > 0 && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <input 
              type="checkbox" 
              id="select-all" 
              checked={selectedIds.length === items.length && items.length > 0} 
              onChange={toggleSelectAll} 
              className="w-4 h-4 rounded text-brand border-gray-300 focus:ring-brand cursor-pointer"
            />
            <label htmlFor="select-all" className="text-xs font-semibold text-gray-500 cursor-pointer select-none">
              SELECT ALL ({items.length})
            </label>
          </div>
        )}
      </div>

      {showForm && editItem && (
        <div className="card p-6 border-brand/30 border-2">
          <h2 className="font-semibold text-gray-900 mb-4">{editItem.id ? 'Edit Item' : 'Add Item'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lbl}>Item Name *</label><input className={inp} value={editItem.name || ''} onChange={e => setEditItem(i => ({ ...i!, name: e.target.value }))} /></div>
            <div><label className={lbl}>HSN Code</label><input className={inp} value={editItem.hsn_code || ''} onChange={e => setEditItem(i => ({ ...i!, hsn_code: e.target.value }))} /></div>
            <div><label className={lbl}>Unit</label>
              <select className={inp} value={editItem.unit || 'KG'} onChange={e => setEditItem(i => ({ ...i!, unit: e.target.value }))}>
                {['KG', 'MT', 'Unit', 'Box', 'Bundle', 'Litre'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div><label className={lbl}>GST Rate (%)</label>
              <select className={inp} value={editItem.gst_rate || 0} onChange={e => setEditItem(i => ({ ...i!, gst_rate: Number(e.target.value) }))}>
                {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
            <div className="col-span-2"><label className={lbl}>Description</label><textarea rows={2} className={inp} value={editItem.description || ''} onChange={e => setEditItem(i => ({ ...i!, description: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => { setShowForm(false); setEditItem(null); }} className="btn-secondary">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Item'}</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">
            <th className="table-th w-10">
              {/* Spacer / header cell */}
            </th>
            <th className="table-th">Item Name</th>
            <th className="table-th">HSN Code</th>
            <th className="table-th">Unit</th>
            <th className="table-th">GST Rate</th>
            <th className="table-th">Description</th>
            <th className="table-th">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? [...Array(5)].map((_, i) => <tr key={i}>{[...Array(7)].map((_, j) => <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>)
              : items.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center">
                  <Package size={36} className="mx-auto text-gray-200 mb-3" />
                  <div className="text-gray-400 text-sm">No items found</div>
                </td></tr>
              ) : items.map(item => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <tr 
                    key={item.id} 
                    className={`transition-colors ${
                      isSelected ? 'bg-brand-light/10 hover:bg-brand-light/20' : 'hover:bg-gray-50/60'
                    }`}
                  >
                    <td className="table-td text-center">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelect(item.id)}
                        className="w-4 h-4 rounded text-brand border-gray-300 focus:ring-brand cursor-pointer"
                      />
                    </td>
                    <td className="table-td font-medium">{item.name}</td>
                    <td className="table-td font-mono text-xs">{item.hsn_code || '—'}</td>
                    <td className="table-td">{item.unit}</td>
                    <td className="table-td"><span className="status-pill bg-blue-50 text-blue-700">{item.gst_rate || 0}%</span></td>
                    <td className="table-td text-gray-400 text-xs">{item.description || '—'}</td>
                    <td className="table-td">
                      <div className="flex gap-1">
                        <button onClick={() => { setEditItem(item); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-brand"><Pencil size={14} /></button>
                        <button onClick={() => del(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
