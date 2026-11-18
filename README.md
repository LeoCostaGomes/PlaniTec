# 📊 PlaniTec — Gestão Financeira Familiar Inteligente

> Sistema minimalista de controle financeiro familiar com usabilidade inspirada no Excel, cálculo automático de saldo disponível e sincronização em nuvem via **Supabase**.

[![GitHub Repo](https://img.shields.io/badge/GitHub-LeoCostaGomes%2FPlaniTec-22c55e?logo=github)](https://github.com/LeoCostaGomes/PlaniTec)
[![Banco de Dados](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ecf8e?logo=supabase)](https://supabase.com)
[![Status](https://img.shields.io/badge/Status-100%25%20Funcional-brightgreen)](#)

---

## 👥 Equipe do Projeto
- **Leonardo**
- **João Gabriel**
- **Família** (Usuários Finais)

---

## 🎯 Problema e Proposta de Solução

### A Dor
Dificuldade recorrente no ambiente doméstico para registrar gastos diários, controlar despesas fixas da residência e saber com precisão quanto do salário ainda resta para gastar até o final do mês. Planilhas convencionais são complexas e difíceis de operar em conjunto pela família.

### A Solução (PlaniTec)
Uma aplicação web minimalista (verde e branca), responsiva e de entrada rápida estilo Excel, onde:
1. **Lançamento de Despesas:** Formulário em linha e tabela editável com **Data**, **Código da Categoria**, **Descrição**, **Valor** e **Sugestão Inteligente (Autocomplete)**.
2. **Rendas da Família:** Registro do salário mensal de cada membro.
3. **Despesas Fixas Recorrentes:** Custos mensais que são automaticamente deduzidos a cada mês (aluguel, água, luz, assinaturas).
4. **Cálculo de Saldo Disponível em Tempo Real:**
   $$\text{Saldo Disponível} = \sum(\text{Rendas Mensais}) - \sum(\text{Despesas Fixas}) - \sum(\text{Despesas do Mês Atual})$$
5. **Navegação por Abas Mensais:** Navegue entre meses (`Janeiro/26`, `Fevereiro/26` ... `Junho/26 (atual)`) exatamente como planilhas de pasta de trabalho.

---

## 📁 Estrutura do Projeto

```text
planitec/
├── index.html           # Interface principal com as 3 visualizações e abas
├── styles.css           # Estilização minimalista em verde e branco estilo Excel
├── app.js               # Controlador da aplicação (filtros, cálculos, autocomplete)
├── supabase-client.js   # Integração com Supabase JS SDK + fallback LocalStorage
├── supabase-schema.sql  # Script DDL completo para criar tabelas e políticas no Supabase
├── FICHA_DO_PROJETO.md  # Ficha formal da Etapa 1 do trabalho acadêmico
├── PROMPTS_LOG.md       # Diário de bordo com prompt inicial e os 5 prompts de correção
└── README.md            # Documentação técnica e instruções completas
```

---

## 🚀 Como Executar o Projeto Localmente

O PlaniTec foi desenhado com arquitetura de zero dependências pesadas de compilação, permitindo rodar imediatamente em qualquer máquina ou navegador.

### Opção 1: Abrir Direto no Navegador (Mais Rápido)
1. Dê um duplo-clique no arquivo `index.html`.
2. O sistema abrirá no seu navegador padrão com dados de exemplo pré-carregados (Modo Local / LocalStorage).

### Opção 2: Usando a Extensão Live Server do VS Code
1. Abra a pasta do projeto no VS Code:
   ```bash
   code C:\Users\Aluno05\.gemini\antigravity\scratch\planitec
   ```
2. Clique com botão direito no `index.html` e selecione **"Open with Live Server"**.

---

## 🗄️ Configuração do Banco de Dados Supabase

Para conectar o projeto ao banco de dados relacional PostgreSQL do Supabase:

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto gratuito.
2. No menu lateral esquerdo do Supabase, clique em **SQL Editor**.
3. Copie todo o conteúdo do arquivo [`supabase-schema.sql`](supabase-schema.sql) e cole no editor SQL do Supabase.
4. Clique no botão **Run** para executar o script.
   - Isso criará as tabelas `categories`, `monthly_incomes`, `recurring_expenses` e `expense_entries`, configurando os índices e políticas de acesso (RLS).
5. Vá em **Project Settings > API** e copie:
   - **Project URL**
   - **anon public API Key**
6. Abra o PlaniTec no navegador, clique no botão **⚙️ Banco** no canto superior direito, cole o URL e a chave anon e clique em **"Salvar e Conectar"**.
7. O indicador mudará imediatamente para **"● Supabase Online"** e todos os dados serão sincronizados na nuvem em tempo real!

---

## 🌐 Publicação Online (Deploy na Vercel)

1. Crie uma conta no [vercel.com](https://vercel.com) conectada à sua conta do GitHub.
2. Clique em **Add New... > Project**.
3. Selecione o repositório `LeoCostaGomes/PlaniTec`.
4. Mantenha as configurações padrão (Framework Preset: **Other**) e clique em **Deploy**.
5. Em menos de 1 minuto seu sistema estará no ar com link público HTTPS acessível por qualquer computador ou celular.

---

## 📤 Como Fazer o Commit e Push para o GitHub

No terminal (Git Bash ou PowerShell no repositório):

```bash
# 1. Entre na pasta do projeto
cd C:\Users\Aluno05\.gemini\antigravity\scratch\planitec

# 2. Inicialize o repositório local
git init

# 3. Adicione o repositório remoto
git remote add origin https://github.com/LeoCostaGomes/PlaniTec.git

# 4. Adicione todos os arquivos
git add .

# 5. Faça o commit da primeira versão
git commit -m "feat: primeira versão funcional do PlaniTec com Supabase e Excel UX"

# 6. Envie para o branch principal
git branch -M main
git push -u origin main
```

---

## 🤖 Guia para outros Agentes de IA (AI Agents)

Se você é um agente de inteligência artificial dando continuidade a este projeto, siga estas diretrizes:

1. **Arquitetura de Estado:** O objeto `state` em `app.js` gerencia a tela ativa (`currentView`), o mês selecionado (`currentMonthRef`), e as listas em memória (`incomes`, `recurringExpenses`, `expenses`).
2. **Camada de Dados:** Toda operação assíncrona passa por `window.db` (definido em `supabase-client.js`). Se o Supabase estiver desconectado, o sistema garante transparência total usando `localStorage` sem quebrar a UI.
3. **Regra de Negócio Central:**
   - O saldo disponível deve sempre respeitar a subtração das despesas fixas recorrentes e dos lançamentos do mês em relação à renda total familiar.
4. **Estilo Visual:** Mantenha a paleta de cores verde (`#22c55e`, `#16a34a`) e branco, com bordas limpas estilo planilha (`#cbd5e1`). Novas telas devem conter botões arredondados na barra lateral para preservar a identidade dos rascunhos originais.
