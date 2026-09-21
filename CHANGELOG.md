# Histórico de Versionamento — PrevSUS

> **PrevSUS: Sistema Inteligente de Previsão de Demanda em UBS de Manaus**  
> Trabalho de Conclusão de Curso (TCC) — Bacharelado em Sistemas de Informação  
> **Instituição:** Centro Universitário FAMETRO (Turno Noturno)  
> **Orientadora:** Profa. Luana Leal  
> **Autores:** Cauã Vitor Castro dos Santos (2374760) & Icaro Maximus da Silva Souza (2388786)  
> **Alinhamento Estratégico:** ODS 3 — Saúde e Bem-Estar (ONU) / Atenção Primária à Saúde (SEMSA/SUS)  
> **Padrão de Versionamento:** [Semantic Versioning 2.0.0](https://semver.org/lang/pt-BR/)  

---

## [Não Lançado] - Em Desenvolvimento (Backlog do TCC)

### Planejado
- **Backend & API:** Implementação de endpoints REST com FastAPI (Python) para substituir a camada de dados simulados (mock).
- **Inteligência Artificial:** Integração do modelo preditivo treinado em XGBoost para inferência estatística de demanda hospitalar/ambulatorial.
- **Banco de Dados:** Conexão e persistência relacional em PostgreSQL para o histórico de atendimentos.
- **Infraestrutura:** Empacotamento de microsserviços em contêineres Docker e pipeline CI/CD.

---

## [0.2.4] - 2026-09-20

### Corrigido (Fixed)
- **Acessibilidade (WCAG 2.5.5 / RNF02 — Alvo de Toque):** Ampliação da área clicável e de toque para a dimensão mínima de 44 × 44 pixels (`min-h-11` e `h-12`) no logótipo, nos links do cabeçalho (`Header.tsx`) e no botão de geolocalização (`LocationButton.tsx`), prevenindo toques acidentais em dispositivos móveis[cite: 5].
- **Acessibilidade (WCAG 3.1.1 — Idioma do Documento):** Declaração explícita de `lang="pt-BR"` na raiz do layout (`src/routes/__root.tsx`) e na página de erro (`src/lib/error-page.ts`), garantindo a pronúncia fonética correta por tecnologias assistivas.
- **Acessibilidade (WCAG 3.3.2 — Rótulos e Instruções):** Associação semântica de atributos descritivos e rótulos explícitos nos seletores de dia da semana e faixa horária[cite: 5].
- **Acessibilidade (WCAG 4.1.3 — Mensagens de Status):** Adição dos atributos `aria-live="polite"` e `aria-atomic="true"` no contentor de exibição da demanda preditiva em `PredictivePanel.tsx`, permitindo que leitores de ecrã vocalizem mudanças de fluxo assincronamente sem transferir o foco do utilizador[cite: 5].

---

## [0.2.3] - 2026-09-20

### Corrigido (Fixed)
- **Acessibilidade (WCAG 2.4.7 — Foco Visível):** Implementação de anéis de foco destacados via utilitários do Tailwind CSS (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2`) em todos os elementos interativos da aplicação:
  - Logotipo e links de rota no cabeçalho institucional (`src/components/prevsus/Header.tsx`).
  - Botões de seleção rápida por zona geográfica de Manaus (`src/routes/ubs.index.tsx`)[cite: 3].
  - Cartões interativos de acesso às unidades de saúde (`src/components/prevsus/UbsCard.tsx`)[cite: 3].
- **Ergonomia de Teclado (WCAG 2.1.1):** Eliminação da perda de indicador de foco decorrente do reset de estilos nativos do navegador, assegurando rastreamento visual contínuo durante a tabulação sequencial (`Tab` / `Shift+Tab`)[cite: 3].

---

## [0.2.2] - 2026-09-20

### Corrigido (Fixed)
- **Acessibilidade (WCAG 1.4.11 — Contraste Não-Textual):** Adequação da borda do componente base `Input` (`src/components/ui/input.tsx`), substituindo `border-input` por `border-slate-500`. A taxa de contraste contra o fundo subiu de 1.23:1 (e 2.63:1) para ~4.60:1, superando a exigência mínima de 3.00:1.
- **Acessibilidade (WCAG 1.4.3 — Contraste de Textos Secundários):** Homologação dos disclaimers auxiliares (aviso de privacidade da localização/LGPD e exemplos de busca de UBS), atingindo taxa real de 20.16:1 sobre fundo claro, em conformidade com o Nível AAA.

---

## [0.2.1] - 2026-09-20

### Corrigido (Fixed)
- **Acessibilidade (WCAG 1.4.3 Nível AA/AAA):** Correção da taxa de contraste de luminância no menu de navegação (`src/components/prevsus/Header.tsx`), eliminando a sobreposição de texto claro sobre fundo branco e elevando a razão de 1.00:1 para ~12.0:1 (100% de conformidade).
- **Arquitetura de Componentes:** Resolução da colisão de especificidade do Tailwind CSS no TanStack Router através da separação estrita de propriedades ativas e inativas (`activeProps` com `!bg-white !text-[#1E3A8A]` e `inactiveProps` com `text-white/85`).
- **Eliminação de Ambiguidade:** Alinhamento do componente oficial de cabeçalho dentro do namespace modular `components/prevsus/`.

---

## [0.2.0] - 2026-09-20

### Adicionado (Added)
- **Auditoria de Acessibilidade:** Validação de conformidade técnica com WCAG 2.1 (Nível AA) e eMAG (Lighthouse Acessibilidade 98+).
- **Avaliação Heurística:** Mapeamento integral das telas pelas 10 Heurísticas de Usabilidade de Jakob Nielsen.
- **Geolocalização Client-Side (RNF04):** Ordenação por proximidade geográfica via HTML5 Geolocation API e Fórmula de Haversine, executada exclusivamente no navegador do usuário sem persistência de rastro.
- **Microtexto de Privacidade:** Mensagem explícita de conformidade com a LGPD e processamento local exibida abaixo da busca.
- **Filtro por Região Geográfica:** Botões de seleção rápida por Zona de Manaus (Norte, Sul, Leste, Oeste, Centro-Sul) combinados com a busca textual.

### Modificado (Changed)
- **Regra RB02 (Horário de Funcionamento):** Refinamento da lógica dos seletores para diferenciar unidades de horário padrão (07h às 17h) de unidades de horário ampliado (07h às 21h e sábados).
- **Regra RB04 (Dados Insuficientes):** Inclusão de fallback visual amigável com ícone e aviso neutro caso a combinação selecionada não possua histórico suficiente.
- **Regra RB05 (Aviso Metodológico):** Fixação do card explicativo obrigatório reforçando o caráter estatístico preditivo (sem promessa de contagem de fila em tempo real).
- **Base Mock Manaus:** Correção cadastral das UBS reais (ex.: UBS Dr. José Rayol dos Santos alocada na Av. Constantino Nery, bairro Flores — Zona Centro-Sul).

---

## [0.1.0] - 2026-08-17

### Adicionado (Added)
- **Inicialização do Projeto:** Estruturação inicial do frontend em React, TypeScript e Tailwind CSS v4.
- **Roteamento:** Configuração de rotas declarativas com TanStack Router (`/`, `/ubs`, `/ubs/$id`).
- **Design System:** Integração de primitivos Radix UI / shadcn/ui e ícones Lucide React.
- **Componentes Centrais:** `UBSSearch`, `UBSCard`, `PredictivePanel` e `DemandBadge` com suporte redundante a daltônicos (WCAG 1.4.1).
- **Base Mock (`prevsus-data.ts`):** Inclusão de 5 Unidades Básicas de Saúde representativas de Manaus com coordenadas geográficas e séries temporais simuladas.
