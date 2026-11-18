# Ficha do Projeto: PlaniTec
**Disciplina / Atividade:** Projeto Web com Vibe Coding  
**Equipe:** João Gabriel, Leonardo e Família  
**Repositório GitHub:** [https://github.com/LeoCostaGomes/PlaniTec](https://github.com/LeoCostaGomes/PlaniTec)  
**Banco de Dados:** Supabase (PostgreSQL)  
**Hospedagem Recomendada:** Vercel / GitHub Pages  

---

## 1. A Dor (Qual problema o sistema resolve?)
Em muitas residências, as famílias enfrentam enorme dificuldade para organizar, registrar e acompanhar suas despesas financeiras cotidianas. Cadernos manuais são fáceis de esquecer, e planilhas complexas tradicionais de Excel costumam ser pouco intuitivas no celular e difíceis de manter sincronizadas entre todos os membros da família. O **PlaniTec** resolve esse problema ao oferecer uma experiência tão ágil e simples quanto uma planilha, acessível de qualquer dispositivo, mantendo a família sempre ciente de quanto do salário ainda está disponível para gastar até o final do mês.

---

## 2. O Usuário Final (Quem vai operar o sistema no dia a dia?)
**A Família (Membros da Família):**
- Os provedores e administradores do lar que precisam acompanhar a renda familiar e planejar o orçamento do mês.
- Qualquer integrante da casa que realize compras do dia a dia (supermercado, farmácia, transporte, lazer) e precise lançar rapidamente o gasto no momento da compra.

---

## 3. O MVP (Exatamente 3 Funcionalidades Essenciais)
1. **Lançamento Ágil de Despesas Estilo Planilha com Autocomplete:**
   - Registro instantâneo de contas informando **Data**, **Código da Categoria**, **Descrição** e **Valor**.
   - Sugestão inteligente de preenchimento automático durante a digitação para acelerar o cadastro e navegação por abas mensais (ex: Janeiro/26, Fevereiro/26, Junho/26).
2. **Controle de Renda Familiar e Cálculo em Tempo Real do Saldo Disponível:**
   - Cadastro do salário/renda mensal de cada integrante da família.
   - O sistema calcula e exibe de forma automática e visual o saldo que a família ainda pode gastar:  
     $$\text{Saldo Disponível} = \text{Total Rendas} - \text{Total Despesas Fixas} - \text{Total Despesas do Mês}$$.
3. **Gestão de Despesas Mensais Recorrentes (Fixas):**
   - Adição e remoção de custos fixos recorrentes (aluguel, água, energia, internet, assinaturas) que são automaticamente deduzidos do saldo mensal familiar.

---

## 4. A Identidade Visual
- **Nome do Sistema:** PlaniTec (Planilhas e Tecnologia para Finanças Familiares)
- **Estilo:** Minimalista, limpo e direto, focado na produtividade e usabilidade.
- **Paleta de Cores:**
  - **Verde Principal (Header e Ações):** `#22c55e` e `#16a34a` (transmite saúde financeira, prosperidade e estabilidade)
  - **Verde Limão (Destaques e Selos de Mês Atual):** `#84cc16`
  - **Branco e Cinza Claro (Fundo e Cartões):** `#ffffff`, `#f0fdf4` e `#f8fafc`
  - **Linhas de Grade Estilo Excel:** `#cbd5e1`
  - **Alerta de Saldo Negativo:** `#ef4444` (Vermelho)
- **Tipografia:** Sistema moderno sem serifa (Inter, Segoe UI, Roboto, -apple-system), garantindo legibilidade perfeita de números e tabelas em monitores e celulares.
- **Sistemas de Referência:**
  - Microsoft Excel e Google Sheets (grade de dados, abas inferiores de meses, digitação rápida com Enter/Tab).
  - Nuvem Supabase para persistência relacional colaborativa.
