-- ==============================================================================
-- PlaniTec - Schema do Banco de Dados Supabase (PostgreSQL)
-- Projeto: Gestão Financeira Familiar Inteligente no Estilo Excel
-- Equipe: Leonardo, João Gabriel e Família
-- ==============================================================================

-- 1. Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela de Categorias pré-definidas (para sugestão automática e código de categoria)
CREATE TABLE IF NOT EXISTS categories (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir categorias padrão comuns em finanças familiares
INSERT INTO categories (code, name) VALUES
    ('ALIM', 'Alimentação / Mercado'),
    ('MORA', 'Moradia (Aluguel, Condomínio)'),
    ('UTIL', 'Contas Básicas (Água, Luz, Gás, Internet)'),
    ('TRAN', 'Transporte / Combustível'),
    ('SAUD', 'Saúde e Farmácia'),
    ('EDUC', 'Educação / Cursos'),
    ('LAZE', 'Lazer e Viagens'),
    ('VEST', 'Vestuário'),
    ('SERV', 'Assinaturas e Serviços'),
    ('OUTR', 'Outros')
ON CONFLICT (code) DO NOTHING;

-- 3. Tabela de Rendas Mensais (Salário de cada integrante da família)
CREATE TABLE IF NOT EXISTS monthly_incomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_name VARCHAR(120) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Despesas Mensais Recorrentes/Fixas (subtraídas todo mês)
CREATE TABLE IF NOT EXISTS recurring_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) REFERENCES categories(code) ON DELETE SET NULL,
    description VARCHAR(200) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Lançamento de Despesas do Mês (Semelhante ao Excel)
CREATE TABLE IF NOT EXISTS expense_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    month_ref VARCHAR(7) NOT NULL, -- Exemplo: '2026-06' para Junho de 2026
    category_code VARCHAR(10),
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização de busca e filtros por mês
CREATE INDEX IF NOT EXISTS idx_expense_entries_month ON expense_entries(month_ref);
CREATE INDEX IF NOT EXISTS idx_expense_entries_category ON expense_entries(category_code);
CREATE INDEX IF NOT EXISTS idx_expense_entries_date ON expense_entries(expense_date);

-- Dados de exemplo iniciais para demonstração
INSERT INTO monthly_incomes (member_name, amount) VALUES
    ('Salário Leonardo', 4500.00),
    ('Salário João Gabriel', 3800.00)
ON CONFLICT DO NOTHING;

INSERT INTO recurring_expenses (code, description, amount) VALUES
    ('MORA', 'Aluguel do Imóvel', 1800.00),
    ('UTIL', 'Internet Fibra', 120.00),
    ('UTIL', 'Energia Elétrica', 250.00),
    ('SERV', 'Streaming e Assinaturas', 85.00)
ON CONFLICT DO NOTHING;

-- Configuração de Políticas de Segurança (Row Level Security - RLS)
-- Para ambiente acadêmico / protótipo Vibe Coding, liberamos leitura e escrita pública com anon key
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso publico categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso publico monthly_incomes" ON monthly_incomes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso publico recurring_expenses" ON recurring_expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso publico expense_entries" ON expense_entries FOR ALL USING (true) WITH CHECK (true);
