-- ==============================================================================
-- PlaniTec - Schema do Banco de Dados Supabase (PostgreSQL)
-- Categorias com códigos numéricos (1 a 10) para digitação ultra-rápida
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabela de Categorias
CREATE TABLE IF NOT EXISTS categories (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir categorias com números (1 a 10)
INSERT INTO categories (code, name) VALUES
    ('1', 'Alimentação / Mercado'),
    ('2', 'Moradia (Aluguel, Condomínio)'),
    ('3', 'Contas Básicas (Água, Luz, Internet)'),
    ('4', 'Transporte e Combustível'),
    ('5', 'Saúde e Medicamentos'),
    ('6', 'Educação e Cursos'),
    ('7', 'Lazer e Viagens'),
    ('8', 'Vestuário'),
    ('9', 'Assinaturas e Serviços'),
    ('10', 'Outros Gastos')
ON CONFLICT (code) DO NOTHING;

-- 2. Tabela de Rendas Mensais (Salários)
CREATE TABLE IF NOT EXISTS monthly_incomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_name VARCHAR(120) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Despesas Mensais Recorrentes/Fixas
CREATE TABLE IF NOT EXISTS recurring_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) REFERENCES categories(code) ON DELETE SET NULL,
    description VARCHAR(200) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Lançamento de Despesas (Excel Style)
CREATE TABLE IF NOT EXISTS expense_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    month_ref VARCHAR(7) NOT NULL, -- Exemplo: '2026-11'
    category_code VARCHAR(10),
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_expense_entries_month ON expense_entries(month_ref);
CREATE INDEX IF NOT EXISTS idx_expense_entries_category ON expense_entries(category_code);
CREATE INDEX IF NOT EXISTS idx_expense_entries_date ON expense_entries(expense_date);

-- Dados de Exemplo
INSERT INTO monthly_incomes (member_name, amount) VALUES
    ('Salário Leonardo', 4500.00),
    ('Salário João Gabriel', 3800.00)
ON CONFLICT DO NOTHING;

INSERT INTO recurring_expenses (code, description, amount) VALUES
    ('2', 'Aluguel do Imóvel', 1800.00),
    ('3', 'Internet Fibra Óptica', 120.00),
    ('3', 'Energia Elétrica', 260.00),
    ('9', 'Assinaturas de Streaming', 89.90)
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso publico categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso publico monthly_incomes" ON monthly_incomes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso publico recurring_expenses" ON recurring_expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso publico expense_entries" ON expense_entries FOR ALL USING (true) WITH CHECK (true);
