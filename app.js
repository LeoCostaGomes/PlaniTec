/**
 * PlaniTec - Lógica da Aplicação (App Controller)
 * Equipe: Leonardo, João Gabriel e Família
 */

document.addEventListener('DOMContentLoaded', () => {
  // Estado da Aplicação
  const state = {
    currentView: 'expenses', // 'expenses' | 'recurring' | 'incomes'
    currentMonthRef: '2026-06', // Mês padrão Junho/2026 como no mockup
    months: [
      { ref: '2026-01', label: 'Janeiro/26' },
      { ref: '2026-02', label: 'Fevereiro/26' },
      { ref: '2026-03', label: 'Março/26' },
      { ref: '2026-04', label: 'Abril/26' },
      { ref: '2026-05', label: 'Maio/26' },
      { ref: '2026-06', label: 'Junho/26', isCurrent: true },
      { ref: '2026-07', label: 'Julho/26' },
      { ref: '2026-08', label: 'Agosto/26' }
    ],
    incomes: [],
    recurringExpenses: [],
    expenses: [],
    categories: [],
    filters: {
      search: '',
      category: '',
      minVal: null,
      maxVal: null
    }
  };

  // Elementos do DOM
  const elements = {
    // Topbar
    kpiSaldoTopbar: document.getElementById('kpi-saldo-topbar'),
    topbarSaldoBox: document.getElementById('topbar-saldo-box'),
    btnOpenConfig: document.getElementById('btn-open-config'),
    supabaseStatusIndicator: document.getElementById('supabase-status-indicator'),
    supabaseStatusText: document.getElementById('supabase-status-text'),

    // Sheet Header
    sheetTitle: document.getElementById('sheet-title'),
    sheetSubtitle: document.getElementById('sheet-subtitle'),
    expenseFilters: document.getElementById('expense-filters'),
    filterSearch: document.getElementById('filter-search'),
    filterCategory: document.getElementById('filter-category'),
    filterMinVal: document.getElementById('filter-min-val'),
    filterMaxVal: document.getElementById('filter-max-val'),

    // Tabelas
    tableExpenses: document.getElementById('table-expenses'),
    tbodyExpenses: document.getElementById('tbody-expenses'),
    tableRecurring: document.getElementById('table-recurring'),
    tbodyRecurring: document.getElementById('tbody-recurring'),
    tableIncomes: document.getElementById('table-incomes'),
    tbodyIncomes: document.getElementById('tbody-incomes'),

    // Inputs Quick Add Despesa
    inputExpDate: document.getElementById('input-exp-date'),
    inputExpCode: document.getElementById('input-exp-code'),
    inputExpDesc: document.getElementById('input-exp-desc'),
    inputExpVal: document.getElementById('input-exp-val'),
    btnAddExpense: document.getElementById('btn-add-expense'),
    suggestionBox: document.getElementById('suggestion-box'),

    // Inputs Quick Add Recorrente
    inputRecCode: document.getElementById('input-rec-code'),
    inputRecDesc: document.getElementById('input-rec-desc'),
    inputRecVal: document.getElementById('input-rec-val'),
    btnAddRecurring: document.getElementById('btn-add-recurring'),

    // Inputs Quick Add Renda
    inputIncName: document.getElementById('input-inc-name'),
    inputIncVal: document.getElementById('input-inc-val'),
    btnAddIncome: document.getElementById('btn-add-income'),

    // Abas de Meses
    excelTabsBar: document.getElementById('excel-tabs-bar'),

    // Sidebar de Navegação e Resumo
    btnNavExpenses: document.getElementById('btn-nav-expenses'),
    btnNavRecurring: document.getElementById('btn-nav-recurring'),
    btnNavIncomes: document.getElementById('btn-nav-incomes'),
    sidebarTotalIncome: document.getElementById('sidebar-total-income'),
    sidebarTotalRecurring: document.getElementById('sidebar-total-recurring'),
    sidebarTotalExpenses: document.getElementById('sidebar-total-expenses'),
    sidebarBalance: document.getElementById('sidebar-balance'),

    // Modal Config Supabase
    configModal: document.getElementById('config-modal'),
    btnCloseConfig: document.getElementById('btn-close-config'),
    btnSaveConfig: document.getElementById('btn-save-config'),
    btnClearConfig: document.getElementById('btn-clear-config'),
    cfgSupabaseUrl: document.getElementById('cfg-supabase-url'),
    cfgSupabaseKey: document.getElementById('cfg-supabase-key')
  };

  // Formatador de Moeda BRL
  const formatMoney = (val) => {
    const num = parseFloat(val) || 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Inicialização
  async function initApp() {
    state.categories = window.db.getCategories();
    populateCategorySelects();
    updateSupabaseStatusBadge();
    setupEventListeners();
    renderMonthTabs();
    setDefaultExpenseDate();

    await loadAllData();
    switchView('expenses');
  }

  // Preenche dropdowns de categoria
  function populateCategorySelects() {
    const optionsHtml = state.categories.map(c => `<option value="${c.code}">${c.code} - ${c.name}</option>`).join('');
    elements.inputExpCode.innerHTML = optionsHtml;
    elements.inputRecCode.innerHTML = optionsHtml;

    // Filtro de categorias
    elements.filterCategory.innerHTML = '<option value="">Todas as categorias</option>' + 
      state.categories.map(c => `<option value="${c.code}">${c.code} - ${c.name}</option>`).join('');
  }

  // Data padrão no input de despesa (hoje ou dia do mês selecionado)
  function setDefaultExpenseDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    elements.inputExpDate.value = `${yyyy}-${mm}-${dd}`;
  }

  // Carrega todos os dados do banco (Supabase ou Local)
  async function loadAllData() {
    state.incomes = await window.db.getIncomes();
    state.recurringExpenses = await window.db.getRecurringExpenses();
    state.expenses = await window.db.getExpenses(state.currentMonthRef);
    calculateAndRender();
  }

  // Renderiza abas no rodapé estilo Excel
  function renderMonthTabs() {
    elements.excelTabsBar.innerHTML = '';
    state.months.forEach(m => {
      const tab = document.createElement('button');
      tab.className = `excel-tab ${m.ref === state.currentMonthRef ? 'active' : ''}`;
      tab.innerHTML = `
        <span>${m.label}</span>
        ${m.isCurrent ? '<span class="tab-badge">atual</span>' : ''}
      `;
      tab.addEventListener('click', async () => {
        state.currentMonthRef = m.ref;
        renderMonthTabs();
        updateSheetSubtitle();
        state.expenses = await window.db.getExpenses(state.currentMonthRef);
        calculateAndRender();
      });
      elements.excelTabsBar.appendChild(tab);
    });

    // Botão de adicionar novo mês
    const addTabBtn = document.createElement('button');
    addTabBtn.className = 'btn-add-tab';
    addTabBtn.title = 'Adicionar novo mês de planejamento';
    addTabBtn.innerHTML = '+ Adicionar Mês';
    addTabBtn.addEventListener('click', () => {
      const nextMonthNum = state.months.length + 1;
      const ref = `2026-${String(nextMonthNum).padStart(2, '0')}`;
      const label = `Mês ${nextMonthNum}/26`;
      state.months.push({ ref, label });
      renderMonthTabs();
    });
    elements.excelTabsBar.appendChild(addTabBtn);
  }

  function updateSheetSubtitle() {
    const currentMonth = state.months.find(m => m.ref === state.currentMonthRef);
    elements.sheetSubtitle.textContent = `Mês de referência: ${currentMonth ? currentMonth.label : state.currentMonthRef}`;
  }

  // Alterna entre as telas conforme o rascunho
  function switchView(viewName) {
    state.currentView = viewName;

    // Oculta todas as tabelas
    elements.tableExpenses.style.display = 'none';
    elements.tableRecurring.style.display = 'none';
    elements.tableIncomes.style.display = 'none';

    // Oculta/exibe botões da sidebar de acordo com a tela atual
    elements.btnNavExpenses.style.display = viewName === 'expenses' ? 'none' : 'flex';
    elements.btnNavRecurring.style.display = viewName === 'recurring' ? 'none' : 'flex';
    elements.btnNavIncomes.style.display = viewName === 'incomes' ? 'none' : 'flex';

    // Filtros e abas só aparecem na tela de despesas do mês
    elements.expenseFilters.style.display = viewName === 'expenses' ? 'flex' : 'none';
    elements.excelTabsBar.style.display = viewName === 'expenses' ? 'flex' : 'none';

    if (viewName === 'expenses') {
      elements.tableExpenses.style.display = 'table';
      elements.sheetTitle.textContent = 'Lançamento de Despesas';
      updateSheetSubtitle();
    } else if (viewName === 'recurring') {
      elements.tableRecurring.style.display = 'table';
      elements.sheetTitle.textContent = 'Despesas Mensais Recorrentes (Fixas)';
      elements.sheetSubtitle.textContent = 'Valores descontados automaticamente do saldo a cada mês';
    } else if (viewName === 'incomes') {
      elements.tableIncomes.style.display = 'table';
      elements.sheetTitle.textContent = 'Rendas Mensais da Família';
      elements.sheetSubtitle.textContent = 'Salários e rendimentos somados ao saldo da casa';
    }

    calculateAndRender();
  }

  // Cálculos financeiros e atualização de tabelas
  function calculateAndRender() {
    // 1. Total Rendas
    const totalIncome = state.incomes.reduce((acc, cur) => acc + (parseFloat(cur.amount) || 0), 0);

    // 2. Total Despesas Fixas Recorrentes
    const totalRecurring = state.recurringExpenses.reduce((acc, cur) => acc + (parseFloat(cur.amount) || 0), 0);

    // 3. Total Lançamentos do Mês
    const totalExpenses = state.expenses.reduce((acc, cur) => acc + (parseFloat(cur.amount) || 0), 0);

    // 4. Saldo Disponível
    const availableBalance = totalIncome - totalRecurring - totalExpenses;

    // Atualiza Topbar KPI
    if (state.currentView === 'recurring') {
      elements.kpiSaldoTopbar.textContent = formatMoney(totalRecurring);
      document.querySelector('.kpi-saldo-label').textContent = 'Total Despesas Fixas';
    } else if (state.currentView === 'incomes') {
      elements.kpiSaldoTopbar.textContent = formatMoney(totalIncome);
      document.querySelector('.kpi-saldo-label').textContent = 'Total Rendas da Família';
    } else {
      elements.kpiSaldoTopbar.textContent = formatMoney(availableBalance);
      document.querySelector('.kpi-saldo-label').textContent = 'Saldo Disponível no Mês';
      
      if (availableBalance < 0) {
        elements.kpiSaldoTopbar.style.color = '#fecaca';
      } else {
        elements.kpiSaldoTopbar.style.color = '#ffffff';
      }
    }

    // Atualiza Sidebar Card
    elements.sidebarTotalIncome.textContent = formatMoney(totalIncome);
    elements.sidebarTotalRecurring.textContent = formatMoney(totalRecurring);
    elements.sidebarTotalExpenses.textContent = formatMoney(totalExpenses);
    elements.sidebarBalance.textContent = formatMoney(availableBalance);
    elements.sidebarBalance.style.color = availableBalance < 0 ? '#ef4444' : '#16a34a';

    // Renderiza Tabelas
    renderExpensesTable();
    renderRecurringTable();
    renderIncomesTable();
  }

  // --- RENDER TABELA DESPESAS COM FILTRO ---
  function renderExpensesTable() {
    const tbody = elements.tbodyExpenses;
    tbody.innerHTML = '';

    // Aplica filtros
    let filtered = state.expenses.filter(e => {
      const matchSearch = !state.filters.search || e.description.toLowerCase().includes(state.filters.search.toLowerCase());
      const matchCat = !state.filters.category || e.category_code === state.filters.category;
      const val = parseFloat(e.amount) || 0;
      const matchMin = state.filters.minVal === null || val >= state.filters.minVal;
      const matchMax = state.filters.maxVal === null || val <= state.filters.maxVal;
      return matchSearch && matchCat && matchMin && matchMax;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 24px;">Nenhuma despesa lançada neste mês com os filtros atuais. Use a linha abaixo para lançar!</td></tr>`;
      return;
    }

    filtered.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="date" class="excel-cell-input" value="${item.expense_date}" data-id="${item.id}" data-field="expense_date"></td>
        <td>
          <select class="excel-cell-input" data-id="${item.id}" data-field="category_code">
            ${state.categories.map(c => `<option value="${c.code}" ${c.code === item.category_code ? 'selected' : ''}>${c.code}</option>`).join('')}
          </select>
        </td>
        <td><input type="text" class="excel-cell-input" value="${item.description}" data-id="${item.id}" data-field="description"></td>
        <td style="text-align: right;"><input type="number" step="0.01" class="excel-cell-input" style="text-align: right;" value="${parseFloat(item.amount).toFixed(2)}" data-id="${item.id}" data-field="amount"></td>
        <td style="text-align: center;">
          <button class="btn-delete-row" data-id="${item.id}" title="Excluir Lançamento">&times;</button>
        </td>
      `;

      // Eventos inline edit estilo Excel
      tr.querySelectorAll('.excel-cell-input').forEach(input => {
        input.addEventListener('change', async (ev) => {
          const id = ev.target.dataset.id;
          const field = ev.target.dataset.field;
          const val = ev.target.value;
          const targetItem = state.expenses.find(i => i.id === id);
          if (targetItem) {
            targetItem[field] = field === 'amount' ? parseFloat(val) || 0 : val;
            await window.db.saveExpense(targetItem);
            calculateAndRender();
          }
        });
      });

      // Botão de deletar
      tr.querySelector('.btn-delete-row').addEventListener('click', async () => {
        if (confirm('Deseja excluir este lançamento de despesa?')) {
          await window.db.deleteExpense(item.id);
          state.expenses = state.expenses.filter(i => i.id !== item.id);
          calculateAndRender();
        }
      });

      tbody.appendChild(tr);
    });
  }

  // --- RENDER TABELA RECORRENTES ---
  function renderRecurringTable() {
    const tbody = elements.tbodyRecurring;
    tbody.innerHTML = '';

    if (state.recurringExpenses.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 24px;">Nenhuma despesa fixa cadastrada.</td></tr>`;
      return;
    }

    state.recurringExpenses.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <select class="excel-cell-input" data-id="${item.id}" data-field="code">
            ${state.categories.map(c => `<option value="${c.code}" ${c.code === item.code ? 'selected' : ''}>${c.code}</option>`).join('')}
          </select>
        </td>
        <td><input type="text" class="excel-cell-input" value="${item.description}" data-id="${item.id}" data-field="description"></td>
        <td style="text-align: right;"><input type="number" step="0.01" class="excel-cell-input" style="text-align: right;" value="${parseFloat(item.amount).toFixed(2)}" data-id="${item.id}" data-field="amount"></td>
        <td style="text-align: center;">
          <button class="btn-delete-row" data-id="${item.id}" title="Excluir Despesa Fixa">&times;</button>
        </td>
      `;

      tr.querySelectorAll('.excel-cell-input').forEach(input => {
        input.addEventListener('change', async (ev) => {
          const id = ev.target.dataset.id;
          const field = ev.target.dataset.field;
          const val = ev.target.value;
          const target = state.recurringExpenses.find(i => i.id === id);
          if (target) {
            target[field] = field === 'amount' ? parseFloat(val) || 0 : val;
            await window.db.saveRecurringExpense(target);
            calculateAndRender();
          }
        });
      });

      tr.querySelector('.btn-delete-row').addEventListener('click', async () => {
        if (confirm('Deseja excluir esta despesa mensal recorrente?')) {
          await window.db.deleteRecurringExpense(item.id);
          state.recurringExpenses = state.recurringExpenses.filter(i => i.id !== item.id);
          calculateAndRender();
        }
      });

      tbody.appendChild(tr);
    });
  }

  // --- RENDER TABELA RENDAS ---
  function renderIncomesTable() {
    const tbody = elements.tbodyIncomes;
    tbody.innerHTML = '';

    if (state.incomes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #94a3b8; padding: 24px;">Nenhuma renda familiar cadastrada.</td></tr>`;
      return;
    }

    state.incomes.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="text" class="excel-cell-input" value="${item.member_name}" data-id="${item.id}" data-field="member_name"></td>
        <td style="text-align: right;"><input type="number" step="0.01" class="excel-cell-input" style="text-align: right;" value="${parseFloat(item.amount).toFixed(2)}" data-id="${item.id}" data-field="amount"></td>
        <td style="text-align: center;">
          <button class="btn-delete-row" data-id="${item.id}" title="Excluir Renda">&times;</button>
        </td>
      `;

      tr.querySelectorAll('.excel-cell-input').forEach(input => {
        input.addEventListener('change', async (ev) => {
          const id = ev.target.dataset.id;
          const field = ev.target.dataset.field;
          const val = ev.target.value;
          const target = state.incomes.find(i => i.id === id);
          if (target) {
            target[field] = field === 'amount' ? parseFloat(val) || 0 : val;
            await window.db.saveIncome(target);
            calculateAndRender();
          }
        });
      });

      tr.querySelector('.btn-delete-row').addEventListener('click', async () => {
        if (confirm('Deseja excluir esta renda?')) {
          await window.db.deleteIncome(item.id);
          state.incomes = state.incomes.filter(i => i.id !== item.id);
          calculateAndRender();
        }
      });

      tbody.appendChild(tr);
    });
  }

  // --- SUGESTÃO AUTOMÁTICA INTELIGENTE (AUTOCOMPLETE) ---
  const suggestionsDatabase = [
    { desc: 'Supermercado Mensal', code: 'ALIM', val: 650.00 },
    { desc: 'Padaria e Café', code: 'ALIM', val: 28.50 },
    { desc: 'Farmácia e Remédios', code: 'SAUD', val: 85.00 },
    { desc: 'Gasolina / Posto de Combustível', code: 'TRAN', val: 150.00 },
    { desc: 'Aplicativo de Transporte (Uber/99)', code: 'TRAN', val: 32.00 },
    { desc: 'Restaurante / Almoço Família', code: 'LAZE', val: 120.00 },
    { desc: 'Pizzaria Fim de Semana', code: 'LAZE', val: 95.00 },
    { desc: 'Material Escolar e Livros', code: 'EDUC', val: 110.00 },
    { desc: 'Manutenção da Casa / Ferramentas', code: 'MORA', val: 140.00 },
    { desc: 'Conta de Energia (Enel/Cemig)', code: 'UTIL', val: 220.00 },
    { desc: 'Conta de Água e Saneamento', code: 'UTIL', val: 95.00 }
  ];

  function handleAutocompleteInput(e) {
    const text = e.target.value.toLowerCase().trim();
    const box = elements.suggestionBox;

    if (!text || text.length < 2) {
      box.style.display = 'none';
      return;
    }

    // Busca sugestões combinando a lista padrão e despesas anteriores já lançadas
    const historySuggestions = state.expenses.map(exp => ({
      desc: exp.description,
      code: exp.category_code,
      val: exp.amount
    }));

    const allOptions = [...historySuggestions, ...suggestionsDatabase];
    const matches = allOptions.filter(opt => opt.desc.toLowerCase().includes(text)).slice(0, 5);

    if (matches.length === 0) {
      box.style.display = 'none';
      return;
    }

    box.innerHTML = matches.map(m => `
      <div class="suggestion-item" data-desc="${m.desc}" data-code="${m.code}" data-val="${m.val || ''}">
        <span><strong>${m.desc}</strong> (${m.code})</span>
        <span style="color: #16a34a;">${m.val ? formatMoney(m.val) : ''}</span>
      </div>
    `).join('');

    box.style.display = 'block';

    box.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        elements.inputExpDesc.value = item.dataset.desc;
        elements.inputExpCode.value = item.dataset.code;
        if (item.dataset.val && (!elements.inputExpVal.value || elements.inputExpVal.value === '0')) {
          elements.inputExpVal.value = item.dataset.val;
        }
        box.style.display = 'none';
        elements.inputExpVal.focus();
      });
    });
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Navegação Sidebar
    elements.btnNavExpenses.addEventListener('click', () => switchView('expenses'));
    elements.btnNavRecurring.addEventListener('click', () => switchView('recurring'));
    elements.btnNavIncomes.addEventListener('click', () => switchView('incomes'));

    // Adicionar Despesa
    const submitExpense = async () => {
      const desc = elements.inputExpDesc.value.trim();
      const val = parseFloat(elements.inputExpVal.value) || 0;
      const date = elements.inputExpDate.value;
      const code = elements.inputExpCode.value;

      if (!desc) {
        alert('Por favor, informe a descrição da despesa.');
        elements.inputExpDesc.focus();
        return;
      }
      if (val <= 0) {
        alert('O valor da despesa deve ser maior que zero.');
        elements.inputExpVal.focus();
        return;
      }

      const newExpense = await window.db.saveExpense({
        expense_date: date,
        month_ref: state.currentMonthRef,
        category_code: code,
        description: desc,
        amount: val
      });

      state.expenses.push(newExpense);
      calculateAndRender();

      // Limpa para a próxima digitação rápida estilo Excel
      elements.inputExpDesc.value = '';
      elements.inputExpVal.value = '';
      elements.inputExpDesc.focus();
    };

    elements.btnAddExpense.addEventListener('click', submitExpense);
    elements.inputExpVal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitExpense();
    });

    // Autocomplete na descrição
    elements.inputExpDesc.addEventListener('input', handleAutocompleteInput);
    document.addEventListener('click', (e) => {
      if (!elements.suggestionBox.contains(e.target) && e.target !== elements.inputExpDesc) {
        elements.suggestionBox.style.display = 'none';
      }
    });

    // Adicionar Despesa Recorrente
    const submitRecurring = async () => {
      const desc = elements.inputRecDesc.value.trim();
      const val = parseFloat(elements.inputRecVal.value) || 0;
      const code = elements.inputRecCode.value;

      if (!desc) {
        alert('Informe a descrição da despesa mensal fixa.');
        elements.inputRecDesc.focus();
        return;
      }

      const item = await window.db.saveRecurringExpense({
        code,
        description: desc,
        amount: val
      });

      state.recurringExpenses.push(item);
      calculateAndRender();

      elements.inputRecDesc.value = '';
      elements.inputRecVal.value = '';
      elements.inputRecDesc.focus();
    };

    elements.btnAddRecurring.addEventListener('click', submitRecurring);
    elements.inputRecVal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitRecurring();
    });

    // Adicionar Renda
    const submitIncome = async () => {
      const name = elements.inputIncName.value.trim();
      const val = parseFloat(elements.inputIncVal.value) || 0;

      if (!name) {
        alert('Informe o nome do integrante ou descrição da renda.');
        elements.inputIncName.focus();
        return;
      }

      const item = await window.db.saveIncome({
        member_name: name,
        amount: val
      });

      state.incomes.push(item);
      calculateAndRender();

      elements.inputIncName.value = '';
      elements.inputIncVal.value = '';
      elements.inputIncName.focus();
    };

    elements.btnAddIncome.addEventListener('click', submitIncome);
    elements.inputIncVal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitIncome();
    });

    // Filtros
    elements.filterSearch.addEventListener('input', (e) => {
      state.filters.search = e.target.value;
      renderExpensesTable();
    });

    elements.filterCategory.addEventListener('change', (e) => {
      state.filters.category = e.target.value;
      renderExpensesTable();
    });

    elements.filterMinVal.addEventListener('input', (e) => {
      state.filters.minVal = e.target.value ? parseFloat(e.target.value) : null;
      renderExpensesTable();
    });

    elements.filterMaxVal.addEventListener('input', (e) => {
      state.filters.maxVal = e.target.value ? parseFloat(e.target.value) : null;
      renderExpensesTable();
    });

    // Modal Supabase
    elements.btnOpenConfig.addEventListener('click', () => {
      const cfg = window.db.getConfig();
      elements.cfgSupabaseUrl.value = cfg.url;
      elements.cfgSupabaseKey.value = cfg.key;
      elements.configModal.classList.add('open');
    });

    elements.btnCloseConfig.addEventListener('click', () => {
      elements.configModal.classList.remove('open');
    });

    elements.btnSaveConfig.addEventListener('click', async () => {
      const url = elements.cfgSupabaseUrl.value;
      const key = elements.cfgSupabaseKey.value;
      window.db.configure(url, key);
      updateSupabaseStatusBadge();
      elements.configModal.classList.remove('open');
      await loadAllData();
      alert('Configurações salvas! Carregando dados do Supabase.');
    });

    elements.btnClearConfig.addEventListener('click', async () => {
      window.db.configure('', '');
      updateSupabaseStatusBadge();
      elements.configModal.classList.remove('open');
      await loadAllData();
      alert('Alternado para armazenamento Local (Offline).');
    });
  }

  function updateSupabaseStatusBadge() {
    const cfg = window.db.getConfig();
    if (cfg.isOnline) {
      elements.supabaseStatusIndicator.style.color = '#22c55e';
      elements.supabaseStatusText.textContent = 'Supabase Online';
    } else {
      elements.supabaseStatusIndicator.style.color = '#f59e0b';
      elements.supabaseStatusText.textContent = 'Modo Local';
    }
  }

  // Iniciar aplicação
  initApp();
});
