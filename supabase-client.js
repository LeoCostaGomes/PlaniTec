/**
 * PlaniTec - Conexão e Operações com o Supabase
 * Suporta sincronização em nuvem via Supabase e fallback transparente via LocalStorage.
 */

// Credenciais do Supabase (podem ser configuradas aqui ou diretamente pela interface)
let SUPABASE_PROJECT_URL = '';
let SUPABASE_ANON_KEY = '';

const DEFAULT_CATEGORIES = [
  { code: 'ALIM', name: 'Alimentação / Supermercado' },
  { code: 'MORA', name: 'Moradia (Aluguel, Condomínio)' },
  { code: 'UTIL', name: 'Contas Básicas (Água, Luz, Net)' },
  { code: 'TRAN', name: 'Transporte e Combustível' },
  { code: 'SAUD', name: 'Saúde e Farmácia' },
  { code: 'EDUC', name: 'Educação e Cursos' },
  { code: 'LAZE', name: 'Lazer e Viagens' },
  { code: 'VEST', name: 'Vestuário' },
  { code: 'SERV', name: 'Assinaturas e Serviços' },
  { code: 'OUTR', name: 'Outros Gastos' }
];

const INITIAL_INCOMES = [
  { id: '1', member_name: 'Salário Leonardo', amount: 4500.00 },
  { id: '2', member_name: 'Salário João Gabriel', amount: 3800.00 }
];

const INITIAL_RECURRING = [
  { id: '1', code: 'MORA', description: 'Aluguel do Imóvel', amount: 1800.00 },
  { id: '2', code: 'UTIL', description: 'Internet Fibra Óptica', amount: 120.00 },
  { id: '3', code: 'UTIL', description: 'Energia Elétrica', amount: 260.00 },
  { id: '4', code: 'SERV', description: 'Assinaturas de Streaming', amount: 89.90 }
];

// Dados iniciais com datas coincidentes com os meses reais do calendário (Novembro/26 e Outubro/26)
const INITIAL_EXPENSES = [
  // Mês Atual do Calendário (Novembro 2026)
  { id: '101', expense_date: '2026-11-03', month_ref: '2026-11', category_code: 'ALIM', description: 'Supermercado Mensal', amount: 890.50 },
  { id: '102', expense_date: '2026-11-06', month_ref: '2026-11', category_code: 'TRAN', description: 'Gasolina / Posto Ipiranga', amount: 190.00 },
  { id: '103', expense_date: '2026-11-10', month_ref: '2026-11', category_code: 'SAUD', description: 'Farmácia Remédios', amount: 95.40 },
  { id: '104', expense_date: '2026-11-15', month_ref: '2026-11', category_code: 'LAZE', description: 'Almoço em Família', amount: 135.00 },

  // Mês Passado (Outubro 2026)
  { id: '201', expense_date: '2026-10-02', month_ref: '2026-10', category_code: 'ALIM', description: 'Compras de Alimentos Outubro', amount: 920.00 },
  { id: '202', expense_date: '2026-10-12', month_ref: '2026-10', category_code: 'TRAN', description: 'Combustível Outubro', amount: 175.00 },
  { id: '203', expense_date: '2026-10-20', month_ref: '2026-10', category_code: 'LAZE', description: 'Cinema e Passeio', amount: 85.00 },

  // Meses anteriores
  { id: '301', expense_date: '2026-09-05', month_ref: '2026-09', category_code: 'ALIM', description: 'Mercado Setembro', amount: 840.00 },
  { id: '302', expense_date: '2026-09-18', month_ref: '2026-09', category_code: 'UTIL', description: 'Manutenção Hidráulica', amount: 150.00 }
];

class PlaniTecDB {
  constructor() {
    this.client = null;
    this.isOnline = false;
    this.init();
  }

  init() {
    const savedUrl = localStorage.getItem('planitec_supabase_url') || SUPABASE_PROJECT_URL;
    const savedKey = localStorage.getItem('planitec_supabase_key') || SUPABASE_ANON_KEY;

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
      url: localStorage.getItem('planitec_supabase_url') || SUPABASE_PROJECT_URL || '',
      key: localStorage.getItem('planitec_supabase_key') || SUPABASE_ANON_KEY || '',
      isOnline: this.isOnline
    };
  }

  _ensureLocalStorageDefaults() {
    // Se não existirem dados ou estiverem no esquema antigo, inicializa com o novo
    if (!localStorage.getItem('planitec_incomes_v2')) {
      localStorage.setItem('planitec_incomes_v2', JSON.stringify(INITIAL_INCOMES));
    }
    if (!localStorage.getItem('planitec_recurring_v2')) {
      localStorage.setItem('planitec_recurring_v2', JSON.stringify(INITIAL_RECURRING));
    }
    if (!localStorage.getItem('planitec_expenses_v2')) {
      localStorage.setItem('planitec_expenses_v2', JSON.stringify(INITIAL_EXPENSES));
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
    return JSON.parse(localStorage.getItem('planitec_incomes_v2') || '[]');
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

    let list = JSON.parse(localStorage.getItem('planitec_incomes_v2') || '[]');
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
    localStorage.setItem('planitec_incomes_v2', JSON.stringify(list));
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
    let list = JSON.parse(localStorage.getItem('planitec_incomes_v2') || '[]');
    list = list.filter(item => item.id !== id);
    localStorage.setItem('planitec_incomes_v2', JSON.stringify(list));
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
    return JSON.parse(localStorage.getItem('planitec_recurring_v2') || '[]');
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

    let list = JSON.parse(localStorage.getItem('planitec_recurring_v2') || '[]');
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
    localStorage.setItem('planitec_recurring_v2', JSON.stringify(list));
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
    let list = JSON.parse(localStorage.getItem('planitec_recurring_v2') || '[]');
    list = list.filter(item => item.id !== id);
    localStorage.setItem('planitec_recurring_v2', JSON.stringify(list));
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
    let list = JSON.parse(localStorage.getItem('planitec_expenses_v2') || '[]');
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

    let list = JSON.parse(localStorage.getItem('planitec_expenses_v2') || '[]');
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
    localStorage.setItem('planitec_expenses_v2', JSON.stringify(list));
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
    let list = JSON.parse(localStorage.getItem('planitec_expenses_v2') || '[]');
    list = list.filter(e => e.id !== id);
    localStorage.setItem('planitec_expenses_v2', JSON.stringify(list));
    return true;
  }

  getCategories() {
    return DEFAULT_CATEGORIES;
  }
}

window.db = new PlaniTecDB();
