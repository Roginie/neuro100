# Arquitetura — NEURO100

## Visão geral
SPA estática (React + TypeScript + Vite + Tailwind 4 + Recharts), sem backend. Todo dado fica no **IndexedDB do navegador** do dispositivo. Roteamento por hash (`HashRouter`) e `base: './'` para funcionar em subcaminho do GitHub Pages.

```
src/
  domain/    lógica pura e testável (sem React/DOM)
    types.ts          modelos
    sequences.ts      PRNG, gerador de sequências, SOLVER independente, correção
    bank.ts           matemática gerada; itens autorais em pares A/B; busca por id
    adaptive.ts       regras transparentes de dificuldade
    metrics.ts        indicadores, domínio, séries
    sessionClock.ts   máquina de estados do tempo ativo/inatividade
  storage/db.ts       IndexedDB (idb), exportação/importação validada
  store.tsx           contexto (configurações, tentativas, sessões, avaliações)
  ui/                 SessionRunner (avaliação e treino), lições
  pages/              Painel, Treinar, Avaliação, Competências, Revisões, Estatísticas,
                      Histórico, Explicações, Referências, Configurações
e2e/                  Playwright (desktop + Pixel 7)
```

## Modelo de dados (IndexedDB `neuro100`, versão 1)
| Store | Chave | Conteúdo |
|---|---|---|
| `attempts` | autoincremento (índices por sessão e competência) | exercício, competência, subcompetência, nível, tipo (`assessment/practice/review/transfer`), resposta, veredito, dicas, nº da tentativa, tempo ativo, texto de explicação (opcional), timestamp |
| `sessions` | id | planejado, início/fim, tempo total/ativo/pausado, finalizada |
| `assessments` | id | resultado por competência, `isBaseline`, versão do banco |
| `settings` | `'settings'` | tema, paleta, animações, duração, inatividade, limiares adaptativos |
| `active` | `'current'` | sessão em andamento (relógio, fila, níveis) para retomada |
| `reviews` (v2) | competência | cartão FSRS da competência (estabilidade, dificuldade, próxima revisão, estado), nº de revisões, data de aprendizado, última revisão e último resultado (`again/hard/good`) |

A versão 2 do banco só **adiciona** a store `reviews`; dados da v1 são preservados (testado). O backup passou à versão 2 e continua aceitando arquivos v1 (sem `reviews`). A dificuldade percebida pela usuária **não** foi implementada (ver limitações).

## Decisões
1. **Domínio puro e determinístico.** Exercícios gerados usam PRNG com semente; o id codifica nível e semente, então a sessão retomada reconstrói o mesmo exercício.
2. **Validação independente.** Para sequências, `fittingRules()` não usa o gerador: ela descobre quais regras explicam os termos. O gerador só aceita um exercício se a regra pretendida for reconhecida; regras alternativas válidas viram respostas alternativas. Testes: 400 exercícios gerados conferidos; matemática recalculada à parte (400 casos).
3. **Sem IA no caminho crítico.** Nada depende de modelo pago.
4. **Tempo por timestamps.** `SessionClock` recebe `now` e aplica avisos/pausas retroativamente, então timers suspensos pelo navegador não distorcem. Ao pausar por inatividade, o tempo ativo é creditado até a pausa (o usuário pode estar raciocinando). Page Visibility API pausa ao ocultar; retomar exige confirmação.
5. **Persistência incremental.** Cada tentativa é gravada no ato; o estado da sessão ativa é gravado ao fim de cada exercício. Se o app fechar no meio de um exercício, só esse exercício e seu tempo parcial se perdem.
6. **Avaliação interrompida não vira linha de base.**
7. **Importação atômica.** `parseBackup` valida formato, versão e cada registro; só então `importData` substitui os dados numa transação única.

## Limitações conhecidas
- **Sem sincronização** entre celular e computador (dados independentes). Transferência por exportar/importar JSON.
- **GitHub Pages é público.** Repositório privado não torna o site privado (ver `SCIENTIFIC_FOUNDATIONS.md` §8). Os dados do usuário não estão no repositório.
- **IndexedDB pode ser apagado pelo navegador** (limpeza de dados do site, modo privado). Faça backup manual periodicamente.
- Bancos de itens pequenos (22 itens por avaliação, 2 formas A/B alternadas); formas não calibradas.
- **Revisão espaçada (Fase 2, implementada) é uma adaptação não validada.** O FSRS modela memória de itens; aqui o cartão é uma *competência* e cada exercício concluído é uma revisão dela (os exercícios mudam a cada vez). Parâmetros padrão do pacote `ts-fsrs@6.0.0`, sem otimização com dados da usuária. Nota por exercício (hipótese de implementação): acerto na 1ª tentativa e sem dicas = Good; acerto com dica ou nova tentativa = Hard; erro ou explicação completa = Again; Easy nunca é automático. Sem passos de aprendizagem em minutos (`enable_short_term: false`) e sem aleatorização (`enable_fuzz: false`): o menor intervalo é de 1 dia e o agendamento é reproduzível. A API usada (`next`, `retrievability`) está marcada como *deprecated* na v6; a versão fica fixada em 6.0.0 e testes conferem as estabilidades iniciais com a documentação.
- **Não implementado ainda:** módulos 3–6 completos, avaliações de 7–90 dias com bancos maiores, testes de transferência, PWA/offline, relatórios. Ver roadmap abaixo.
- Se a página for fechada no meio de um exercício, retomar exige confirmação e recomeça aquele exercício.

## Roadmap
- **Fase 1 (MVP) — feito neste commit:** interface, avaliação inicial, módulo de lógica (parcial), explicações progressivas, temporizador com inatividade, persistência, painel, estatísticas básicas, exportação/importação, e2e e acessibilidade (axe).
- **Fase 2:** *revisão espaçada com FSRS — feita* (ver limitações). Pendentes: módulos 3–6 e histórico detalhado.
- **Fase 3:** avaliações periódicas com mais formas equivalentes, testes de transferência, análise estatística, domínio completo.
- **Fase 4:** PWA e offline (service worker), relatórios, personalização, otimizações de acessibilidade.
