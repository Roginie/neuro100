# Métricas — NEURO100

Implementação: `src/domain/metrics.ts` (testes em `src/domain/domain.test.ts`). Todas devolvem `null`/"—" quando não há dados (nunca 0% falso) e marcam **baixa confiabilidade** quando há menos de `MIN_SAMPLE = 10` itens (hipótese de implementação, não teste estatístico).

Interpretação geral: são medidas de **desempenho em exercícios do app**. Não são QI, avaliação clínica, percentis populacionais nem prova de mudança neurológica ou de melhora no cotidiano.

## O que são os "100%"
Cumprimento dos critérios de domínio de uma trilha (ver *Domínio*). Não é inteligência máxima nem "porcentagem do cérebro".

## A. Precisão
`corretas ÷ respostas válidas × 100`. Respostas de regra alternativa válida (ex.: outra regra que também explica a sequência) contam como corretas. Limitação: depende do nível e do tipo de exercício.

## B. Resolução independente
`exercícios corretos na 1ª tentativa e sem dicas ÷ exercícios concluídos × 100`. A conclusão de um exercício é o último registro dele na sessão. Desistir (ver explicação completa) conta como concluído e não independente.

## C. Retenção observada
`revisões corretas sem consulta ÷ total de revisões válidas × 100`. Só terá dados após a Fase 2 (revisões espaçadas). Hoje exibe "—".

## D. Evolução individual
Entre duas avaliações (forma A × B): `antes`, `agora`, diferença absoluta em pontos percentuais, diferença percentual **somente se a base > 0**, número de questões, intervalo em dias. Aviso se alguma tem < 10 itens. As formas são equivalentes por construção, **sem calibração**: diferenças pequenas podem ser acaso ou diferença de dificuldade entre formas.

## E. Tempo de resolução
Mediana do tempo ativo por competência × nível. Não se comparam níveis diferentes. Rapidez não é medida de inteligência e não entra na dificuldade adaptativa.

## F. Domínio de competência
Critérios padrão (hipótese de implementação, configuráveis no código `DEFAULT_MASTERY`):
- ≥ 8 exercícios novos em nível ≥ 3;
- ≥ 80% corretos sem dicas nesses exercícios;
- ≥ 2 revisões corretas sem dicas feitas ≥ 7 dias após a primeira prática.

`progresso% = média(min(1, n/8), min(1, precisão/80), min(1, revisões/2)) × 100`. Como as revisões só existem na Fase 2, hoje nenhuma competência chega a 100%.

## G. Transferência
`acertos em exercícios de transferência ÷ total` — indicador separado, disponível na Fase 3.

## Tempo
- **Tempo ativo**: tempo com a sessão em andamento (inclui o período de pensamento antes da pausa por inatividade).
- **Pausado**: manual, por inatividade ou página oculta.
- **Total** = ativo + pausado. Calculado por timestamps (não por contagem de `setInterval`).
- Por exercício: diferença do tempo ativo entre início e resposta. Por competência: soma/mediana dos exercícios dela.

## Séries históricas
`precisionSeries(attempts, 'semana' | 'mes' | 'trimestre')`: agrupa treino/transferência (não avaliações) por período no fuso local; semana = segunda-feira. Sem intervalos de confiança nem significância.
