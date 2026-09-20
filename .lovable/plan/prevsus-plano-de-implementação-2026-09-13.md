# PrevSUS — Plano de Implementação

## Visão geral

Criar a interface web do **PrevSUS**, sistema de previsão de demanda para Unidades Básicas de Saúde (UBS) de Manaus. A aplicação será construída em React + TypeScript + Tailwind CSS v4 + shadcn/ui, com dados mock locais para simulação imediata.

## Direção visual

- **Paleta institucional de saúde pública:** azul royal, ciano e branco.
- **Estilo:** limpo, moderno, responsivo, com hierarquia clara e espaçamento generoso.
- **Tipografia:** fonte sans-serif padrão do sistema, mantendo legibilidade institucional.
- **Componentes:** shadcn/ui (select, card, badge, input, alert, separator, etc.).

## Estrutura de rotas

```text
src/routes/
  __root.tsx       -> layout compartilhado (header + footer + outlet)
  index.tsx        -> / (home: hero, apresentação do sistema, busca rápida)
  ubs.index.tsx    -> /ubs (busca e listagem de UBS)
  ubs.$id.tsx      -> /ubs/$id (detalhes da UBS + painel preditivo)
```

## Conteúdo e funcionalidade por rota

Cada rota abaixo inclui também o **tratamento de estados especiais**:

- **Unidade Fechada (RB02):** desabilitar os seletores de faixas horárias fora do expediente da UBS selecionada, respeitando unidades de horário ampliado vs. horário padrão.
- **Dados Insuficientes (RB04):** exibir aviso neutro quando a combinação dia/horário selecionada não possuir dados históricos mínimos para inferência do modelo.
- **Acessibilidade:** badges de demanda sempre acompanhados de ícones visuais (além da cor) para suporte a daltônicos.

### `/` — Home

- Hero com logotipo **PrevSUS**, slogan "Previsão de Demanda em UBS de Manaus" e indicador do **ODS 3 — Saúde e Bem-Estar**.
- Breve descrição do propósito do sistema.
- Campo de busca rápida direcionando para `/ubs` com query.
- Links para as páginas principais.

### `/ubs` — Busca e Listagem

- Barra de pesquisa por nome da UBS ou bairro de Manaus.
- Sugestões/exemplos reais:
  - UBS Dr. José Rayol dos Santos
  - UBS Nilton Lins
  - UBS Arthur Virgílio Filho
- Lista de resultados filtráveis com cards resumidos.
- Cada card leva para `/ubs/$id`.

### `/ubs/$id` — Detalhes e Painel Preditivo

- **Card de detalhes da UBS:** endereço, bairro, status (aberto/fechado), horário de funcionamento.
- **Painel de consulta preditiva:**
  - Seletor de dia da semana (Segunda a Sábado).
  - Seletor de faixa horária (08h-10h, 10h-12h, 13h-15h, 15h-17h).
- **Card de nível de demanda em destaque:**
  - Baixa → badge verde pastel.
  - Moderada → badge amarelo/âmbar.
  - Alta → badge vermelho suave.
- **Aviso metodológico obrigatório (RB05):** card com ícone de alerta e o texto exato:
  > "Nota: Os níveis apresentados correspondem a uma estimativa preditiva estatística calculada via Machine Learning com base no histórico de atendimentos, não representando a contagem de fila em tempo real."

## Dados mock

- Criar um arquivo de dados locais (`src/lib/prevsus-data.ts`) com UBS fictícias baseadas nos exemplos reais.
- Cada UBS terá: id, nome, endereço, bairro, horário de funcionamento, coordenadas fictícias e tabela de demanda simulada por dia/faixa horária.
- A demanda variará conforme dia da semana e horário para demonstrar variações ao usar os seletores.

## Componentes a criar/utilizar

- `Header`: logo, slogan, indicador ODS 3, navegação.
- `Footer`: créditos institucionais.
- `UBSSearch`: input de busca com debounce e lista filtrada.
- `UBSCard`: card resumido na listagem.
- `UBSDetailsCard`: endereço, bairro, status, horário.
- `PredictivePanel`: seletores de dia/horário e card de demanda.
- `DemandBadge`: badge colorido por nível.
- `MethodologyAlert`: card de aviso metodológico.

## Tokens de design (src/styles.css)

Adicionar cores semânticas alinhadas à identidade visual:

- `--color-royal`: azul royal institucional.
- `--color-cyan`: ciano de destaque.
- `--color-ods-3`: verde associado ao ODS 3.
- `--color-demand-low`: verde pastel.
- `--color-demand-medium`: amarelo/âmbar.
- `--color-demand-high`: vermelho suave.

Mapear as variáveis no `@theme inline` para uso como utilitários Tailwind (`bg-royal`, `text-cyan`, etc.).

## SEO/Metadados

Cada rota terá `head()` com título, descrição, `og:title`, `og:description`, `og:type` e `twitter:card`. A home também terá metadados específicos.

## Critérios de aceitação

1. `/` exibe hero, slogan, indicador ODS 3 e busca rápida.
2. `/ubs` permite buscar UBS por nome ou bairro e mostrar resultados filtrados.
3. `/ubs/$id` exibe detalhes da UBS e painel preditivo funcional.
4. Os seletores de dia/horário atualizam o nível de demanda em tempo real.
5. O aviso metodológico aparece sempre no painel preditivo.
6. A interface é responsiva (mobile, tablet, desktop).
7. Não há placeholders padrão da Lovable; todas as páginas têm conteúdo real.
