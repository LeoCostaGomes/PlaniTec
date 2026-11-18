/**
 * PlaniTec - Lógica da Aplicação (App Controller)
 * Experiência Ultra-Prática inspirada no Microsoft Excel
 * Suporte a categorias numéricas (1 a 10) e detecção inteligente de meses
 * Equipe: Leonardo, João Gabriel e Família
 */

document.addEventListener('DOMContentLoaded', () => {
  const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Identifica o Mês Atual do Calendário Real
  const today = new Date();
  const realCurrentYear = today.getFullYear();
  const realCurrentMonth = today.getMonth() + 1; // 1 a 12
  const realCurrentMonthRef = `${realCurrentYear}-${String(realCurrentMonth).padStart(2, '0')}`;

  // Gera a lista inicial de abas com base no calendário
  function generateInitialMonths() {
    const months = [];
    for (let m = 1; m <= 12; m++) {
      const ref = `${realCurrentYear}-${String(m).padStart(2, '0')}`;
      const label = `${MONTH_NAMES[m - 1]}/${String(realCurrentYear).slice(-2)}`;
      months.push({
        ref,
        label,
        isCurrent: ref === realCurrentMonthRef
      });
    }
    return months;
  }

  // Estado da Aplicação
  const state = {
    currentView: 'expenses', // 'expenses' | 'recurring' | 'incomes'
    currentMonthRef: realCurrentMonthRef, // Inicia no mês real do calendário!
    months: generateInitialMonths(),
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

    // Toast Notificação
    toastNotification: document.getElementById('toast-notification'),

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
    tfootExpensesTotal: document.getElementById('expenses-total-cell'),
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

  // Exibe notificação Toast flutuante
  let toastTimeout = null;
  function showToast(message, isWarning = false) {
    if (!elements.toastNotification) return;
    clearTimeout(toastTimeout);
    elements.toastNotification.textContent = message;
    elements.toastNotification.className = `toast-notification show ${isWarning ? 'warning' : 'success'}`;
    toastTimeout = setTimeout(() => {
      elements.toastNotification.className = 'toast-notification';
    }, 4000);
  }

  // Garante Primeira Letra Maiúscula
  function capitalizeFirstLetter(str) {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Formatador de Moeda BRL
  const formatMoney = (val) => {
    const num = parseFloat(val) || 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Garante que uma aba de mês exista
  function ensureMonthExists(monthRef) {
    let existing = state.months.find(m => m.ref === monthRef);
    if (!existing) {
      const [y, m] = monthRef.split('-').map(Number);
      const label = `${MONTH_NAMES[m - 1]}/${String(y).slice(-2)}`;
      existing = {
        ref: monthRef,
        label,
        isCurrent: monthRef === realCurrentMonthRef
      };
      state.months.push(existing);
      // Ordena as abas cronologicamente
      state.months.sort((a, b) => a.ref.localeCompare(b.ref));
    }
    return existing;
  }

  // Inicialização Geral
  async function initApp() {
    state.categories = window.db.getCategories();
    populateCategorySelects();
    updateSupabaseStatusBadge();
    setupEventListeners();
    renderMonthTabs();
    syncExpenseDateWithMonth(state.currentMonthRef);

    await loadAllData();
    switchView('expenses');
  }

  // Preenche opções de categorias numéricas (1 a 10)
  function populateCategorySelects() {
    const optionsHtml = state.categories.map(c => `<option value="${c.code}">[${c.code}] ${c.name}</option>`).join('');
    elements.inputExpCode.innerHTML = optionsHtml;
    elements.inputRecCode.innerHTML = optionsHtml;

    elements.filterCategory.innerHTML = '<option value="">Todas as categorias</option>' + 
      state.categories.map(c => `<option value="${c.code}">[${c.code}] ${c.name}</option>`).join('');
  }

  // Sincroniza a data do input de despesas com o mês selecionado
  function syncExpenseDateWithMonth(monthRef) {
    const [year, month] = monthRef.split('-');
    const now = new Date();
    let day = String(now.getDate()).padStart(2, '0');

    if (monthRef !== realCurrentMonthRef) {
      day = '01'; // Se navegar para outro mês, inicia no primeiro dia do mês
    }
    elements.inputExpDate.value = `${year}-${month}-${day}`;
  }

  // Carrega todos os dados
  async function loadAllData() {
    state.incomes = await window.db.getIncomes();
    state.recurringExpenses = await window.db.getRecurringExpenses();
    state.expenses = await window.db.getExpenses(state.currentMonthRef);
    calculateAndRender();
  }

  // Renderiza Abas de Meses Estilo Planilha Excel
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
        syncExpenseDateWithMonth(m.ref);
        renderMonthTabs();
        updateSheetSubtitle();
        state.expenses = await window.db.getExpenses(state.currentMonthRef);
        calculateAndRender();
      });
      elements.excelTabsBar.appendChild(tab);
    });

    // Botão Adicionar Próximo Mês
    const addTabBtn = document.createElement('button');
    addTabBtn.className = 'btn-add-tab';
    addTabBtn.title = 'Adicionar próximo mês sequencial no calendário';
    addTabBtn.innerHTML = '➕ Novo Mês';
    addTabBtn.addEventListener('click', () => {
      const lastMonth = state.months[state.months.length - 1];
      let [y, m] = lastMonth.ref.split('-').map(Number);
      
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }

      const ref = `${y}-${String(m).padStart(2, '0')}`;
      const label = `${MONTH_NAMES[m - 1]}/${String(y).slice(-2)}`;
      
      state.months.push({
        ref,
        label,
        isCurrent: ref === realCurrentMonthRef
      });

      renderMonthTabs();
    });
    elements.excelTabsBar.appendChild(addTabBtn);
  }

  function updateSheetSubtitle() {
    const currentMonth = state.months.find(m => m.ref === state.currentMonthRef);
    elements.sheetSubtitle.textContent = `Mês selecionado: ${currentMonth ? currentMonth.label : state.currentMonthRef}`;
  }

  // Alterna as Telas
  function switchView(viewName) {
    state.currentView = viewName;

    elements.tableExpenses.style.display = 'none';
    elements.tableRecurring.style.display = 'none';
    elements.tableIncomes.style.display = 'none';

    elements.btnNavExpenses.style.display = viewName === 'expenses' ? 'none' : 'flex';
    elements.btnNavRecurring.style.display = viewName === 'recurring' ? 'none' : 'flex';
    elements.btnNavIncomes.style.display = viewName === 'incomes' ? 'none' : 'flex';

    elements.expenseFilters.style.display = viewName === 'expenses' ? 'flex' : 'none';
    elements.excelTabsBar.style.display = viewName === 'expenses' ? 'flex' : 'none';

    if (viewName === 'expenses') {
      elements.tableExpenses.style.display = 'table';
      elements.sheetTitle.textContent = 'Lançamento de Despesas';
      updateSheetSubtitle();
    } else if (viewName === 'recurring') {
      elements.tableRecurring.style.display = 'table';
      elements.sheetTitle.textContent = 'Despesas Mensais Recorrentes (Fixas)';
      elements.sheetSubtitle.textContent = 'Custos fixos subtraídos automaticamente todo mês';
    } else if (viewName === 'incomes') {
      elements.tableIncomes.style.display = 'table';
      elements.sheetTitle.textContent = 'Rendas Mensais da Família';
      elements.sheetSubtitle.textContent = 'Salários e rendimentos somados ao saldo da família';
    }

    calculateAndRender();
  }

  // Cálculos Financeiros
  function calculateAndRender() {
    const totalIncome = state.incomes.reduce((acc, cur) => acc + (parseFloat(cur.amount) || 0), 0);
    const totalRecurring = state.recurringExpenses.reduce((acc, cur) => acc + (parseFloat(cur.amount) || 0), 0);
    const totalExpenses = state.expenses.reduce((acc, cur) => acc + (parseFloat(cur.amount) || 0), 0);
    const availableBalance = totalIncome - totalRecurring - totalExpenses;

    if (state.currentView === 'recurring') {
      elements.kpiSaldoTopbar.textContent = formatMoney(totalRecurring);
      document.querySelector('.kpi-saldo-label').textContent = 'Total Despesas Fixas';
    } else if (state.currentView === 'incomes') {
      elements.kpiSaldoTopbar.textContent = formatMoney(totalIncome);
      document.querySelector('.kpi-saldo-label').textContent = 'Total Rendas da Família';
    } else {
      elements.kpiSaldoTopbar.textContent = formatMoney(availableBalance);
      document.querySelector('.kpi-saldo-label').textContent = 'Saldo Disponível no Mês';
      elements.kpiSaldoTopbar.style.color = availableBalance < 0 ? '#fecaca' : '#ffffff';
    }

    elements.sidebarTotalIncome.textContent = formatMoney(totalIncome);
    elements.sidebarTotalRecurring.textContent = formatMoney(totalRecurring);
    elements.sidebarTotalExpenses.textContent = formatMoney(totalExpenses);
    elements.sidebarBalance.textContent = formatMoney(availableBalance);
    elements.sidebarBalance.style.color = availableBalance < 0 ? '#ef4444' : '#16a34a';

    renderExpensesTable();
    renderRecurringTable();
    renderIncomesTable();
  }

  // Render Tabela de Despesas
  function renderExpensesTable() {
    const tbody = elements.tbodyExpenses;
    tbody.innerHTML = '';

    let filtered = state.expenses.filter(e => {
      const matchSearch = !state.filters.search || e.description.toLowerCase().includes(state.filters.search.toLowerCase());
      const matchCat = !state.filters.category || String(e.category_code) === String(state.filters.category);
      const val = parseFloat(e.amount) || 0;
      const matchMin = state.filters.minVal === null || val >= state.filters.minVal;
      const matchMax = state.filters.maxVal === null || val <= state.filters.maxVal;
      return matchSearch && matchCat && matchMin && matchMax;
    });

    const sumTotal = filtered.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
    if (elements.tfootExpensesTotal) {
      elements.tfootExpensesTotal.textContent = formatMoney(sumTotal);
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 20px;">Nenhuma despesa para este mês. Lance na linha abaixo e pressione Enter!</td></tr>`;
      return;
    }

    filtered.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.className = 'excel-row';
      tr.innerHTML = `
        <td class="excel-row-idx">${index + 1}</td>
        <td><input type="date" class="excel-cell-input date-cell" value="${item.expense_date}" data-id="${item.id}" data-field="expense_date"></td>
        <td>
          <select class="excel-cell-input" data-id="${item.id}" data-field="category_code">
            ${state.categories.map(c => `<option value="${c.code}" ${String(c.code) === String(item.category_code) ? 'selected' : ''}>[${c.code}] ${c.name}</option>`).join('')}
          </select>
        </td>
        <td><input type="text" class="excel-cell-input desc-cell" value="${item.description}" data-id="${item.id}" data-field="description"></td>
        <td style="text-align: right;"><input type="number" step="0.01" class="excel-cell-input" style="text-align: right;" value="${parseFloat(item.amount).toFixed(2)}" data-id="${item.id}" data-field="amount"></td>
        <td style="text-align: center;">
          <button class="btn-delete-row" data-id="${item.id}" title="Excluir Lançamento (Del)">&times;</button>
        </td>
      `;

      // Auto-capitalização ao digitar
      const descInput = tr.querySelector('.desc-cell');
      descInput.addEventListener('input', (e) => {
        e.target.value = capitalizeFirstLetter(e.target.value);
      });

      // Inline edits estilo Excel com Detecção Automática de Mês!
      tr.querySelectorAll('.excel-cell-input').forEach(input => {
        input.addEventListener('change', async (ev) => {
          const id = ev.target.dataset.id;
          const field = ev.target.dataset.field;
          let val = ev.target.value;
          if (field === 'description') val = capitalizeFirstLetter(val);

          const targetItem = state.expenses.find(i => i.id === id);
          if (!targetItem) return;

          // Se o usuário alterou a DATA para outro mês na própria célula
          if (field === 'expense_date' && val) {
            const newMonthRef = val.substring(0, 7);
            if (newMonthRef !== state.currentMonthRef) {
              ensureMonthExists(newMonthRef);
              targetItem.expense_date = val;
              targetItem.month_ref = newMonthRef;
              await window.db.saveExpense(targetItem);

              // Remove da aba atual e avisa o usuário
              state.expenses = state.expenses.filter(i => i.id !== id);
              calculateAndRender();

              const [y, m] = newMonthRef.split('-').map(Number);
              showToast(`📅 Data alterada! A despesa foi movida automaticamente para a aba de ${MONTH_NAMES[m - 1]}/${String(y).slice(-2)}.`);
              return;
            }
          }

          targetItem[field] = field === 'amount' ? parseFloat(val) || 0 : val;
          await window.db.saveExpense(targetItem);
          calculateAndRender();
        });
      });

      tr.querySelector('.btn-delete-row').addEventListener('click', async () => {
        if (confirm('Deseja excluir esta linha de despesa?')) {
          await window.db.deleteExpense(item.id);
          state.expenses = state.expenses.filter(i => i.id !== item.id);
          calculateAndRender();
        }
      });

      tbody.appendChild(tr);
    });
  }

  // Render Tabela Recorrentes
  function renderRecurringTable() {
    const tbody = elements.tbodyRecurring;
    tbody.innerHTML = '';

    if (state.recurringExpenses.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 20px;">Nenhuma despesa fixa cadastrada.</td></tr>`;
      return;
    }

    state.recurringExpenses.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="excel-row-idx">${index + 1}</td>
        <td>
          <select class="excel-cell-input" data-id="${item.id}" data-field="code">
            ${state.categories.map(c => `<option value="${c.code}" ${String(c.code) === String(item.code) ? 'selected' : ''}>[${c.code}] ${c.name}</option>`).join('')}
          </select>
        </td>
        <td><input type="text" class="excel-cell-input desc-cell" value="${item.description}" data-id="${item.id}" data-field="description"></td>
        <td style="text-align: right;"><input type="number" step="0.01" class="excel-cell-input" style="text-align: right;" value="${parseFloat(item.amount).toFixed(2)}" data-id="${item.id}" data-field="amount"></td>
        <td style="text-align: center;">
          <button class="btn-delete-row" data-id="${item.id}" title="Excluir Despesa Fixa">&times;</button>
        </td>
      `;

      const descInput = tr.querySelector('.desc-cell');
      descInput.addEventListener('input', (e) => {
        e.target.value = capitalizeFirstLetter(e.target.value);
      });

      tr.querySelectorAll('.excel-cell-input').forEach(input => {
        input.addEventListener('change', async (ev) => {
          const id = ev.target.dataset.id;
          const field = ev.target.dataset.field;
          let val = ev.target.value;
          if (field === 'description') val = capitalizeFirstLetter(val);

          const target = state.recurringExpenses.find(i => i.id === id);
          if (target) {
            target[field] = field === 'amount' ? parseFloat(val) || 0 : val;
            await window.db.saveRecurringExpense(target);
            calculateAndRender();
          }
        });
      });

      tr.querySelector('.btn-delete-row').addEventListener('click', async () => {
        if (confirm('Deseja excluir esta despesa fixa?')) {
          await window.db.deleteRecurringExpense(item.id);
          state.recurringExpenses = state.recurringExpenses.filter(i => i.id !== item.id);
          calculateAndRender();
        }
      });

      tbody.appendChild(tr);
    });
  }

  // Render Tabela Rendas
  function renderIncomesTable() {
    const tbody = elements.tbodyIncomes;
    tbody.innerHTML = '';

    if (state.incomes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 20px;">Nenhuma renda familiar cadastrada.</td></tr>`;
      return;
    }

    state.incomes.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="excel-row-idx">${index + 1}</td>
        <td><input type="text" class="excel-cell-input name-cell" value="${item.member_name}" data-id="${item.id}" data-field="member_name"></td>
        <td style="text-align: right;"><input type="number" step="0.01" class="excel-cell-input" style="text-align: right;" value="${parseFloat(item.amount).toFixed(2)}" data-id="${item.id}" data-field="amount"></td>
        <td style="text-align: center;">
          <button class="btn-delete-row" data-id="${item.id}" title="Excluir Renda">&times;</button>
        </td>
      `;

      const nameInput = tr.querySelector('.name-cell');
      nameInput.addEventListener('input', (e) => {
        e.target.value = capitalizeFirstLetter(e.target.value);
      });

      tr.querySelectorAll('.excel-cell-input').forEach(input => {
        input.addEventListener('change', async (ev) => {
          const id = ev.target.dataset.id;
          const field = ev.target.dataset.field;
          let val = ev.target.value;
          if (field === 'member_name') val = capitalizeFirstLetter(val);

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

  // Base de Sugestões com Categorias Numéricas
  const suggestionsDatabase = [
    { desc: 'Supermercado Mensal', code: '1', val: 650.00 },
    { desc: 'Padaria e Café da Manhã', code: '1', val: 28.50 },
    { desc: 'Aluguel / Condomínio', code: '2', val: 1800.00 },
    { desc: 'Energia Elétrica (Luz)', code: '3', val: 220.00 },
    { desc: 'Conta de Água e Esgoto', code: '3', val: 95.00 },
    { desc: 'Internet Fibra Óptica', code: '3', val: 120.00 },
    { desc: 'Gasolina / Posto de Combustível', code: '4', val: 150.00 },
    { desc: 'Uber / Transporte Aplicativo', code: '4', val: 32.00 },
    { desc: 'Farmácia e Medicamentos', code: '5', val: 85.00 },
    { desc: 'Mensalidade Escolar / Cursos', code: '6', val: 450.00 },
    { desc: 'Restaurante em Família', code: '7', val: 120.00 },
    { desc: 'Pizzaria / Lanche Fim de Semana', code: '7', val: 95.00 },
    { desc: 'Roupas e Calçados', code: '8', val: 180.00 },
    { desc: 'Assinatura Streaming (Netflix/Spotify)', code: '9', val: 55.90 }
  ];

  function handleAutocompleteInput(e) {
    const rawText = e.target.value;
    e.target.value = capitalizeFirstLetter(rawText);

    const text = e.target.value.toLowerCase().trim();
    const box = elements.suggestionBox;

    if (!text || text.length < 2) {
      box.style.display = 'none';
      return;
    }

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

    box.innerHTML = matches.map(m => {
      const catObj = state.categories.find(c => String(c.code) === String(m.code));
      const catLabel = catObj ? `[${m.code}] ${catObj.name.split(' ')[0]}` : `[${m.code}]`;
      return `
        <div class="suggestion-item" data-desc="${m.desc}" data-code="${m.code}" data-val="${m.val || ''}">
          <span><strong>${m.desc}</strong> <small style="color: #64748b;">${catLabel}</small></span>
          <span style="color: #16a34a; font-weight: 600;">${m.val ? formatMoney(m.val) : ''}</span>
        </div>
      `;
    }).join('');

    box.style.display = 'block';

    box.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        elements.inputExpDesc.value = capitalizeFirstLetter(item.dataset.desc);
        elements.inputExpCode.value = item.dataset.code;
        if (item.dataset.val && (!elements.inputExpVal.value || elements.inputExpVal.value === '0')) {
          elements.inputExpVal.value = item.dataset.val;
        }
        box.style.display = 'none';
        elements.inputExpVal.focus();
      });
    });
  }

  // LANÇAMENTO DE DESPESA COM DETECÇÃO AUTOMÁTICA DE MÊS!
  const submitExpense = async () => {
    const desc = capitalizeFirstLetter(elements.inputExpDesc.value.trim());
    const val = parseFloat(elements.inputExpVal.value) || 0;
    const date = elements.inputExpDate.value;
    const code = elements.inputExpCode.value;

    if (!date) {
      alert('Por favor, informe a data da despesa.');
      elements.inputExpDate.focus();
      return;
    }
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

    // DETECÇÃO AUTOMÁTICA: O usuário digitou uma data de outro mês?
    const targetMonthRef = date.substring(0, 7); // ex: '2026-03'
    const isDifferentMonth = targetMonthRef !== state.currentMonthRef;

    if (isDifferentMonth) {
      // 1. Garante que a aba do mês digitado exista
      ensureMonthExists(targetMonthRef);

      // 2. Salva a despesa vinculada ao mês real da data
      await window.db.saveExpense({
        expense_date: date,
        month_ref: targetMonthRef,
        category_code: code,
        description: desc,
        amount: val
      });

      // 3. Muda a aba automaticamente para o mês correto
      state.currentMonthRef = targetMonthRef;
      renderMonthTabs();
      updateSheetSubtitle();
      state.expenses = await window.db.getExpenses(state.currentMonthRef);
      calculateAndRender();

      // 4. Notifica o usuário com destaque elegante
      const [y, m] = targetMonthRef.split('-').map(Number);
      showToast(`🎯 Data identificada como ${MONTH_NAMES[m - 1]}/${String(y).slice(-2)}! Movido automaticamente para a aba correta.`);
    } else {
      // Data coincide com o mês atual da aba
      const newExpense = await window.db.saveExpense({
        expense_date: date,
        month_ref: state.currentMonthRef,
        category_code: code,
        description: desc,
        amount: val
      });

      state.expenses.push(newExpense);
      calculateAndRender();
      showToast(`✅ Despesa salva com sucesso em ${state.months.find(m => m.ref === state.currentMonthRef)?.label}!`);
    }

    // Reset limpo e foco imediato para continuar digitando no estilo Excel
    elements.inputExpDesc.value = '';
    elements.inputExpVal.value = '';
    elements.inputExpDesc.focus();
  };

  // Setup de Eventos
  function setupEventListeners() {
    elements.btnNavExpenses.addEventListener('click', () => switchView('expenses'));
    elements.btnNavRecurring.addEventListener('click', () => switchView('recurring'));
    elements.btnNavIncomes.addEventListener('click', () => switchView('incomes'));

    elements.btnAddExpense.addEventListener('click', submitExpense);
    elements.inputExpVal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitExpense();
      }
    });
    elements.inputExpDesc.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && elements.inputExpVal.value) {
        e.preventDefault();
        submitExpense();
      }
    });

    elements.inputExpDesc.addEventListener('input', handleAutocompleteInput);
    elements.inputRecDesc.addEventListener('input', (e) => {
      e.target.value = capitalizeFirstLetter(e.target.value);
    });
    elements.inputIncName.addEventListener('input', (e) => {
      e.target.value = capitalizeFirstLetter(e.target.value);
    });

    document.addEventListener('click', (e) => {
      if (!elements.suggestionBox.contains(e.target) && e.target !== elements.inputExpDesc) {
        elements.suggestionBox.style.display = 'none';
      }
    });

    // Recorrentes
    const submitRecurring = async () => {
      const desc = capitalizeFirstLetter(elements.inputRecDesc.value.trim());
      const val = parseFloat(elements.inputRecVal.value) || 0;
      const code = elements.inputRecCode.value;

      if (!desc || val <= 0) {
        alert('Informe a descrição e um valor maior que zero.');
        return;
      }

      const item = await window.db.saveRecurringExpense({ code, description: desc, amount: val });
      state.recurringExpenses.push(item);
      calculateAndRender();

      elements.inputRecDesc.value = '';
      elements.inputRecVal.value = '';
      elements.inputRecDesc.focus();
      showToast(`✅ Despesa fixa adicionada!`);
    };

    elements.btnAddRecurring.addEventListener('click', submitRecurring);
    elements.inputRecVal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitRecurring();
    });

    // Rendas
    const submitIncome = async () => {
      const name = capitalizeFirstLetter(elements.inputIncName.value.trim());
      const val = parseFloat(elements.inputIncVal.value) || 0;

      if (!name || val <= 0) {
        alert('Informe o nome do integrante e um valor maior que zero.');
        return;
      }

      const item = await window.db.saveIncome({ member_name: name, amount: val });
      state.incomes.push(item);
      calculateAndRender();

      elements.inputIncName.value = '';
      elements.inputIncVal.value = '';
      elements.inputIncName.focus();
      showToast(`✅ Renda familiar adicionada!`);
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
      showToast('Configurações salvas e conectadas ao Supabase!');
    });

    elements.btnClearConfig.addEventListener('click', async () => {
      window.db.configure('', '');
      updateSupabaseStatusBadge();
      elements.configModal.classList.remove('open');
      await loadAllData();
      showToast('Modo Local (Offline) ativado.');
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

  initApp();
});
