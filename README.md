# PrevSUS Insights

Crie a interface web moderna, limpa e responsiva do sistema 'PrevSUS', voltado para a previsão de demanda em Unidades Básicas de Saúde (UBS) de Manaus.

A aplicação deve ser desenvolvida em React + TypeScript com Tailwind CSS e shadcn/ui, utilizando uma paleta de cores institucional de saúde pública (tons de azul royal, ciano e branco).

A interface precisa conter as seguintes páginas/seções:

Header: Logotipo PrevSUS, slogan 'Previsão de Demanda em UBS de Manaus' e indicador do ODS 3 (Saúde e Bem-Estar).

Área de Busca e Seleção (RF01): Barra de pesquisa por nome da UBS ou bairro de Manaus (coloque como exemplos reais: UBS Dr. José Rayol dos Santos, UBS Nilton Lins, UBS Arthur Virgílio Filho).

Card de Detalhes da UBS selecionada: Endereço, bairro, status (aberto/fechado) e horário de funcionamento.

Painel de Consulta Preditiva (RF02, RF04): Seletores para o dia da semana (Segunda a Sábado) e faixa horária (ex.: 08h-10h, 10h-12h, 13h-15h, 15h-17h).

Exibição do Nível de Demanda (RF03): Card visual em destaque com badge colorido indicando: Baixa (verde pastel), Moderada (amarelo/âmbar) ou Alta (vermelho suave).

Aviso Metodológico Obrigatório (RB05): Card informativo com ícone de alerta e o texto: 'Nota: Os níveis apresentados correspondem a uma estimativa preditiva estatística calculada via Machine Learning com base no histórico de atendimentos, não representando a contagem de fila em tempo real'.

Simulação de Dados (Mock): Insira dados fictícios locais para que o usuário possa testar e ver as variações de demanda mudando os seletores.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7d5d04b4-4ac4-47c2-8035-c06e3f7bd12f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
