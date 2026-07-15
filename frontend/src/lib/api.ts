const API_BASE = 'http://localhost:8000/api';

const tableMap: Record<string, string> = {
  'customers': 'customers',
  'vehicles': 'vehicles',
  'drivers': 'drivers',
  'items': 'items',
  'lorry_receipts': 'lorry-receipts',
  'invoices': 'invoices',
  'lorry_invoices': 'invoices', // dashboard uses this name
  'quotations': 'quotations'
};

class QueryBuilder {
  table: string;
  endpoint: string;
  _action: string = 'select';
  _data: any = null;
  _eq: Record<string, any> = {};
  _or: string[] = [];
  _order: { field: string, ascending: boolean } | null = null;
  _single: boolean = false;
  _range: [number, number] | null = null;
  _countMode: boolean = false;

  constructor(table: string) {
    this.table = table;
    this.endpoint = `${API_BASE}/${tableMap[table] || table}`;
  }

  select(fields: string = '*', options?: { count?: string }) {
    this._action = 'select';
    if (options && options.count) this._countMode = true;
    return this;
  }

  insert(data: any) {
    this._action = 'insert';
    this._data = Array.isArray(data) ? data[0] : data;
    return this;
  }

  update(data: any) {
    this._action = 'update';
    this._data = data;
    return this;
  }

  delete() {
    this._action = 'delete';
    return this;
  }

  eq(field: string, value: any) {
    this._eq[field] = value;
    return this;
  }

  or(query: string) {
    // query is like "name.ilike.%search%,gstin.ilike.%search%"
    this._or.push(query);
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this._order = { field, ascending: options?.ascending ?? false };
    return this;
  }

  single() {
    this._single = true;
    return this;
  }

  maybeSingle() {
    this._single = true;
    return this;
  }

  range(start: number, end: number) {
    this._range = [start, end];
    return this;
  }

  async then(resolve: any, reject: any) {
    try {
      if (this._action === 'select') {
        const res = await fetch(this.endpoint);
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        let records = await res.json();
        
        // Filter .eq
        for (const [k, v] of Object.entries(this._eq)) {
          records = records.filter((r: any) => r[k] === v);
        }

        // Filter .or
        for (const orStr of this._or) {
          const conditions = orStr.split(',').map((c: string) => c.trim());
          records = records.filter((r: any) => {
            return conditions.some((cond: string) => {
              const parts = cond.split('.ilike.');
              if (parts.length === 2) {
                const field = parts[0];
                const val = parts[1].replace(/%/g, '').toLowerCase();
                return String(r[field] || '').toLowerCase().includes(val);
              }
              const partsEq = cond.split('.eq.');
              if (partsEq.length === 2) {
                return String(r[partsEq[0]]) === String(partsEq[1]);
              }
              return false;
            });
          });
        }

        // Order
        if (this._order) {
          const { field, ascending } = this._order;
          records.sort((a: any, b: any) => {
            if (a[field] < b[field]) return ascending ? -1 : 1;
            if (a[field] > b[field]) return ascending ? 1 : -1;
            return 0;
          });
        }

        let count = records.length;

        // Range
        if (this._range) {
          records = records.slice(this._range[0], this._range[1] + 1);
        }

        if (this._single) {
          resolve({ data: records.length > 0 ? records[0] : null, error: null, count });
        } else {
          resolve({ data: records, error: null, count: this._countMode ? count : null });
        }
      } else {
        // Mutations
        let url = this.endpoint;
        let method = 'POST';
        
        let bodyData = this._data;

        if (this._action === 'update') {
          method = 'PUT';
          url = `${this.endpoint}/${this._eq.id}`;
          try {
            const existingRes = await fetch(url);
            if (existingRes.ok) {
              const existing = await existingRes.json();
              bodyData = { ...existing, ...this._data };
            }
          } catch (e) {
            console.error('Failed to merge for update', e);
          }
        } else if (this._action === 'delete') {
          method = 'DELETE';
          url = `${this.endpoint}/${this._eq.id}`;
        }

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: ['POST', 'PUT'].includes(method) ? JSON.stringify(bodyData) : undefined
        });

        if (!res.ok) throw new Error('Mutation failed');
        const data = await res.json();
        resolve({ data, error: null });
      }
    } catch (error) {
      resolve({ data: null, error });
    }
  }
}

export const api = {
  from: (table: string) => new QueryBuilder(table)
};

export async function getNextNumber(seriesType: string): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/number-series/${seriesType}/next`, { method: 'POST' });
    if (!res.ok) return `${seriesType.toUpperCase()}-1001`;
    const data = await res.json();
    return data.next_number;
  } catch (e) {
    return `${seriesType.toUpperCase()}-1001`;
  }
}
