/**
 * PlaniTec - Conexão e Operações com o Supabase
 * Suporta sincronização em nuvem via Supabase e fallback automático via LocalStorage.
 */

const DEFAULT_CATEGORIES = [
  { code: 'ALIM', name: 'Alimentação / Mercado' },
  { code: 'MORA', name: 'Moradia (Aluguel, Condomínio)' },
  { code: 'UTIL', name: 'Contas Básicas (Água, Luz, Net)' },
  { code: 'TRAN', name: 'Transporte / Combustível' },
  { code: 'SAUD', name: 'Saúde e Farmácia' },
  { code: 'EDUC', name: 'Educação / Cursos' },
  { code: 'LAZE', name: 'Lazer e Viagens' },
  { code: 'VEST', name: 'Vestuário' },
  { code: 'SERV', name: 'Assinaturas e Serviços' },
  { code: 'OUTR', name: 'Outros' }
];

const INITIAL_INCOMES = [
  { id: '1', member_name: 'Salário Leonardo', amount: 4500.00 },
  { id: '2', member_name: 'Salário João Gabriel', amount: 3800.00 }
];

const INITIAL_RECURRING = [
  { id: '1', code: 'MORA', description: 'Aluguel do Imóvel', amount: 1800.00 },
  { id: '2', code: 'UTIL', description: 'Internet Fibra', amount: 120.00 },
  { id: '3', code: 'UTIL', description: 'Energia Elétrica', amount: 260.00 },
  { id: '4', code: 'SERV', description: 'Streaming / Assinaturas', amount: 89.90 }
];

const INITIAL_EXPENSES = [
  { id: '101', expense_date: '2026-06-02', month_ref: '2026-06', category_code: 'ALIM', description: 'Supermercado Mensal', amount: 950.40 },
  { id: '102', expense_date: '2026-06-05', month_ref: '2026-06', category_code: 'TRAN', description: 'Gasolina Posto Central', amount: 180.00 },
  { id: '103', expense_date: '2026-06-10', month_ref: '2026-06', category_code: 'SAUD', description: 'Farmácia Remédios', amount: 115.50 },
  { id: '104', expense_date: '2026-06-14', month_ref: '2026-06', category_code: 'LAZE', description: 'Pizzaria em Família', amount: 145.00 }
];

class PlaniTecDB {
  constructor() {
    this.client = null;
    this.isOnline = false;
    this.init();
  }

  init() {
    const savedUrl = localStorage.getItem('planitec_supabase_url');
    const savedKey = localStorage.getItem('planitec_supabase_key');

    if (savedUrl && savedKey && window.supabase) {
      try {
        this.client = window.supabase.createClient(savedUrl, savedKey);
        this.isOnline = true;
      } catch (err) {
        console.warn('Falha ao conectar com Supabase, usando LocalStorage:', err);
        this.client = null;
        this.isOnline = false;
      }
    } else {
      this.isOnline = false;
    }

    this._ensureLocalStorageDefaults();
  }

  configure(url, key) {
    if (url && key) {
      localStorage.setItem('planitec_supabase_url', url.trim());
      localStorage.setItem('planitec_supabase_key', key.trim());
      if (window.supabase) {
        this.client = window.supabase.createClient(url.trim(), key.trim());
        this.isOnline = true;
        return true;
      }
    } else {
      localStorage.removeItem('planitec_supabase_url');
      localStorage.removeItem('planitec_supabase_key');
      this.client = null;
      this.isOnline = false;
    }
    return false;
  }

  getConfig() {
    return {
      url: localStorage.getItem('planitec_supabase_url') || '',
      key: localStorage.getItem('planitec_supabase_key') || '',
      isOnline: this.isOnline
    };
  }

  _ensureLocalStorageDefaults() {
    if (!localStorage.getItem('planitec_incomes')) {
      localStorage.setItem('planitec_incomes', JSON.stringify(INITIAL_INCOMES));
    }
    if (!localStorage.getItem('planitec_recurring')) {
      localStorage.setItem('planitec_recurring', JSON.stringify(INITIAL_RECURRING));
    }
    if (!localStorage.getItem('planitec_expenses')) {
      localStorage.setItem('planitec_expenses', JSON.stringify(INITIAL_EXPENSES));
    }
  }

  // --- RENDAS MENSAIS ---
  async getIncomes() {
    if (this.isOnline && this.client) {
      try {
        const { data, error } = await this.client.from('monthly_incomes').select('*').order('created_at', { ascending: true });
        if (!error && data) return data;
      } catch (e) {
        console.warn('Erro ao consultar Supabase monthly_incomes, caindo para local:', e);
      }
    }
    return JSON.parse(localStorage.getItem('planitec_incomes') || '[]');
  }

  async saveIncome(income) {
    if (this.isOnline && this.client) {
      try {
        if (income.id && !income.id.startsWith('local_')) {
          const { data, error } = await this.client.from('monthly_incomes').update({
            member_name: income.member_name,
            amount: parseFloat(income.amount) || 0
          }).eq('id', income.id).select();
          if (!error && data) return data[0];
        } else {
          const { data, error } = await this.client.from('monthly_incomes').insert([{
            member_name: income.member_name,
            amount: parseFloat(income.amount) || 0
          }]).select();
          if (!error && data) return data[0];
        }
      } catch (e) {
        console.warn('Erro ao salvar no Supabase monthly_incomes:', e);
      }
    }

    // Local fallback
    let list = JSON.parse(localStorage.getItem('planitec_incomes') || '[]');
    if (income.id) {
      list = list.map(item => item.id === income.id ? { ...income, amount: parseFloat(income.amount) || 0 } : item);
    } else {
      const newItem = {
        id: 'local_' + Date.now(),
        member_name: income.member_name,
        amount: parseFloat(income.amount) || 0
      };
      list.push(newItem);
      income = newItem;
    }
    localStorage.setItem('planitec_incomes', JSON.stringify(list));
    return income;
  }

  async deleteIncome(id) {
    if (this.isOnline && this.client) {
      try {
        await this.client.from('monthly_incomes').delete().eq('id', id);
      } catch (e) {
        console.warn('Erro ao deletar no Supabase monthly_incomes:', e);
      }
    }
    let list = JSON.parse(localStorage.getItem('planitec_incomes') || '[]');
    list = list.filter(item => item.id !== id);
    localStorage.setItem('planitec_incomes', JSON.stringify(list));
    return true;
  }

  // --- DESPESAS RECORRENTES (MENSAIS FIXAS) ---
  async getRecurringExpenses() {
    if (this.isOnline && this.client) {
      try {
        const { data, error } = await this.client.from('recurring_expenses').select('*').order('created_at', { ascending: true });
        if (!error && data) return data;
      } catch (e) {
        console.warn('Erro ao consultar recurring_expenses:', e);
      }
    }
    return JSON.parse(localStorage.getItem('planitec_recurring') || '[]');
  }

  async saveRecurringExpense(item) {
    if (this.isOnline && this.client) {
      try {
        if (item.id && !item.id.startsWith('local_')) {
          const { data, error } = await this.client.from('recurring_expenses').update({
            code: item.code,
            description: item.description,
            amount: parseFloat(item.amount) || 0
          }).eq('id', item.id).select();
          if (!error && data) return data[0];
        } else {
          const { data, error } = await this.client.from('recurring_expenses').insert([{
            code: item.code,
            description: item.description,
            amount: parseFloat(item.amount) || 0
          }]).select();
          if (!error && data) return data[0];
        }
      } catch (e) {
        console.warn('Erro ao salvar no Supabase recurring_expenses:', e);
      }
    }

    let list = JSON.parse(localStorage.getItem('planitec_recurring') || '[]');
    if (item.id) {
      list = list.map(i => i.id === item.id ? { ...item, amount: parseFloat(item.amount) || 0 } : i);
    } else {
      const newItem = {
        id: 'local_' + Date.now(),
        code: item.code,
        description: item.description,
        amount: parseFloat(item.amount) || 0
      };
      list.push(newItem);
      item = newItem;
    }
    localStorage.setItem('planitec_recurring', JSON.stringify(list));
    return item;
  }

  async deleteRecurringExpense(id) {
    if (this.isOnline && this.client) {
      try {
        await this.client.from('recurring_expenses').delete().eq('id', id);
      } catch (e) {
        console.warn('Erro ao deletar recurring_expenses:', e);
      }
    }
    let list = JSON.parse(localStorage.getItem('planitec_recurring') || '[]');
    list = list.filter(item => item.id !== id);
    localStorage.setItem('planitec_recurring', JSON.stringify(list));
    return true;
  }

  // --- LANÇAMENTO DE DESPESAS DO MÊS (EXCEL STYLE) ---
  async getExpenses(monthRef = null) {
    if (this.isOnline && this.client) {
      try {
        let query = this.client.from('expense_entries').select('*').order('expense_date', { ascending: true });
        if (monthRef) {
          query = query.eq('month_ref', monthRef);
        }
        const { data, error } = await query;
        if (!error && data) return data;
      } catch (e) {
        console.warn('Erro ao consultar expense_entries:', e);
      }
    }
    let list = JSON.parse(localStorage.getItem('planitec_expenses') || '[]');
    if (monthRef) {
      list = list.filter(e => e.month_ref === monthRef);
    }
    return list;
  }

  async saveExpense(expense) {
    if (this.isOnline && this.client) {
      try {
        if (expense.id && !expense.id.startsWith('local_')) {
          const { data, error } = await this.client.from('expense_entries').update({
            expense_date: expense.expense_date,
            month_ref: expense.month_ref,
            category_code: expense.category_code,
            description: expense.description,
            amount: parseFloat(expense.amount) || 0
          }).eq('id', expense.id).select();
          if (!error && data) return data[0];
        } else {
          const { data, error } = await this.client.from('expense_entries').insert([{
            expense_date: expense.expense_date,
            month_ref: expense.month_ref,
            category_code: expense.category_code,
            description: expense.description,
            amount: parseFloat(expense.amount) || 0
          }]).select();
          if (!error && data) return data[0];
        }
      } catch (e) {
        console.warn('Erro ao salvar no Supabase expense_entries:', e);
      }
    }

    let list = JSON.parse(localStorage.getItem('planitec_expenses') || '[]');
    if (expense.id) {
      list = list.map(e => e.id === expense.id ? { ...expense, amount: parseFloat(expense.amount) || 0 } : e);
    } else {
      const newItem = {
        id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        expense_date: expense.expense_date,
        month_ref: expense.month_ref,
        category_code: expense.category_code,
        description: expense.description,
        amount: parseFloat(expense.amount) || 0
      };
      list.push(newItem);
      expense = newItem;
    }
    localStorage.setItem('planitec_expenses', JSON.stringify(list));
    return expense;
  }

  async deleteExpense(id) {
    if (this.isOnline && this.client) {
      try {
        await this.client.from('expense_entries').delete().eq('id', id);
      } catch (e) {
        console.warn('Erro ao deletar expense_entries:', e);
      }
    }
    let list = JSON.parse(localStorage.getItem('planitec_expenses') || '[]');
    list = list.filter(e => e.id !== id);
    localStorage.setItem('planitec_expenses', JSON.stringify(list));
    return true;
  }

  getCategories() {
    return DEFAULT_CATEGORIES;
  }
}

window.db = new PlaniTecDB();
