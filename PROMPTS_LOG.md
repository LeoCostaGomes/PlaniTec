# Diário de Bordo & Documentação de Prompts - PlaniTec
**Projeto Web com Vibe Coding**  
**Equipe:** João Gabriel, Leonardo e Família  

---

## 1. Prompt Inicial Completo

```text
Você é um desenvolvedor especialista em arquitetura web moderna e UX minimalista.
Estamos desenvolvendo o projeto PlaniTec para solucionar o problema de controle financeiro na minha casa.
Usuário Final: Minha Família.
MVP:
1 - O sistema deve permitir lançar as despesas (data, código da categoria, descrição e valor).
2 - Cadastrar o salário mensal de cada integrante da família e calcular automaticamente quanto ainda pode gastar (Saldo Disponível).
3 - Adicionar e remover despesas mensais recorrentes (fixas), descontadas do salário a cada mês.
4 - Interface inspirada no Excel: grade de dados limpa, abas inferiores mensais (Janeiro/26 a Junho/26 atual) e digitação rápida com Enter/Tab.
Identidade: Estilo minimalista, cores verde e branco como principais.
Tecnologias: HTML5, CSS3, JavaScript modular, Supabase (PostgreSQL) para persistência em nuvem e suporte offline local via LocalStorage.
```

---

## 2. Registro dos 5 Prompts de Correção / Evolução (Vibe Coding)

Abaixo estão registrados os 5 ciclos de auditoria, validação e refinamento realizados pela equipe:

### Ciclo 1: Ajuste da fórmula de cálculo do Saldo Disponível
- **O que estava impreciso:** Inicialmente, o cálculo de saldo subtraía apenas os lançamentos esporádicos do mês, esquecendo de deduzir as despesas fixas recorrentes cadastradas.
- **Como a equipe percebeu:** Ao cadastrar um aluguel de R$ 1.800 em "Despesas Mensais", o saldo no topo continuava mostrando apenas a renda total menos as compras do mercado.
- **Prompt usado para ajustar:**
  ```text
  "Ajuste a regra de negócio do Saldo Disponível: a fórmula correta deve ser:
  Saldo Disponível = (Soma das Rendas Familiares) - (Soma das Despesas Recorrentes Fixas) - (Soma dos Lançamentos do Mês Atual).
  Exiba também um resumo desses 3 valores na barra lateral."
  ```

---

### Ciclo 2: Alinhamento das Telas e Botões com o Rascunho / Wireframe
- **O que estava impreciso:** A navegação estava em abas no topo, diferente dos desenhos feitos pela equipe onde os botões ficavam na barra lateral direita.
- **Como a equipe percebeu:** Ao comparar a tela gerada com o desenho original (wireframe das três telas), os botões "Editar Despesas Mensais" e "Editar Renda" ficavam à direita em destaque verde.
- **Prompt usado para ajustar:**
  ```text
  "Reestruture o layout para seguir rigorosamente os rascunhos de tela: coloque a barra de ações à direita com botões arredondados em verde e branco ('Editar Despesas Mensais', 'Editar Renda', 'Lançar Despesas') e coloque as abas de meses ('Janeiro/26', 'Fevereiro/26', 'Junho/26 (atual)') na barra inferior, exatamente como no Excel."
  ```

---

### Ciclo 3: Sugestão de Preenchimento Automático (Caso de Uso «extend»)
- **O que estava impreciso:** A digitação da descrição era um campo de texto comum, sem o preenchimento automático previsto no diagrama de casos de uso.
- **Como a equipe percebeu:** O diagrama de caso de uso UML modela a relação «extend» de sugerir preenchimento durante a digitação para compras comuns (como mercado, padaria, remédios).
- **Prompt usado para ajustar:**
  ```text
  "Implemente a funcionalidade de Autocomplete / Sugestão Inteligente durante a digitação no campo de descrição da despesa. Ao começar a digitar (ex: 'super'), exiba uma caixinha com sugestões baseadas no histórico e em compras frequentes, preenchendo automaticamente o código da categoria correspondente."
  ```

---

### Ciclo 4: Validação de Campos Vazios e Valores Negativos
- **O que estava impreciso:** Se o usuário clicasse no botão '+' com a descrição em branco ou valor zerado, uma linha vazia era adicionada ao banco.
- **Como a equipe percebeu:** Teste de estresse preenchendo rapidamente pelo teclado e apertando Enter acidentalmente.
- **Prompt usado para ajustar:**
  ```text
  "Adicione validações rigorosas antes de salvar qualquer despesa ou renda: descrição não pode ser vazia, valor deve ser maior que zero (R$ > 0,00) e formate o valor digitado automaticamente para duas casas decimais no padrão brasileiro (R$ 0,00)."
  ```

---

### Ciclo 5: Fallback Offline e Modal de Configuração do Supabase
- **O que estava impreciso:** Sem configurar as credenciais do Supabase no código fonte, a página travava ou lançava erro de rede.
- **Como a equipe percebeu:** Ao abrir o arquivo localmente antes de criar o projeto no Supabase, a tabela não carregava os dados de demonstração.
- **Prompt usado para ajustar:**
  ```text
  "Crie um mecanismo híbrido no supabase-client.js: se o usuário ainda não tiver configurado o URL e a chave anon do Supabase, o sistema deve funcionar 100% no LocalStorage com dados iniciais de demonstração, e incluir um botão '⚙️ Banco' no topo para que a equipe possa colar as chaves do Supabase sem precisar editar o código fonte."
  ```
