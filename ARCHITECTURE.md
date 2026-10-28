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

Campos de revisão espaçada (data de aprendizado, última revisão, resultado, dificuldade percebida, próxima revisão) entram na migração de versão 2 (Fase 2).

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
- **Não implementado ainda:** revisão espaçada/FSRS, módulos 3–6 completos, avaliações de 7–90 dias com bancos maiores, testes de transferência, PWA/offline, relatórios. Ver roadmap abaixo.
- Se a página for fechada no meio de um exercício, retomar exige confirmação e recomeça aquele exercício.

## Roadmap
- **Fase 1 (MVP) — feito neste commit:** interface, avaliação inicial, módulo de lógica (parcial), explicações progressivas, temporizador com inatividade, persistência, painel, estatísticas básicas, exportação/importação, e2e e acessibilidade (axe).
- **Fase 2:** módulos 2–6, revisão espaçada (avaliar FSRS após ler a documentação; adaptar a raciocínio), histórico detalhado.
- **Fase 3:** avaliações periódicas com mais formas equivalentes, testes de transferência, análise estatística, domínio completo.
- **Fase 4:** PWA e offline (service worker), relatórios, personalização, otimizações de acessibilidade.
