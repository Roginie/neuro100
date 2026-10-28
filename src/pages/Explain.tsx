import { DEFAULT_MASTERY, MIN_SAMPLE } from '../domain/metrics'

const METRICS = [
  { name: 'Precisão', formula: 'respostas corretas ÷ respostas válidas × 100', limits: 'Alternativas válidas (outra regra lógica) contam como corretas. Depende do nível dos exercícios.' },
  { name: 'Resolução independente', formula: 'exercícios corretos na 1ª tentativa e sem dicas ÷ exercícios concluídos × 100', limits: 'Desistir (ver explicação) conta como concluído, não independente.' },
  { name: 'Retenção observada', formula: 'revisões corretas sem consulta ÷ total de revisões válidas × 100', limits: 'Só existe após as revisões espaçadas (Fase 2).' },
  { name: 'Evolução individual', formula: 'avaliação atual − avaliação inicial (diferença absoluta em p.p.; percentual só se a base > 0)', limits: 'Formas A/B são equivalentes por construção, não calibradas. Poucos itens por área.' },
  { name: 'Tempo de resolução', formula: 'mediana do tempo ativo por competência × nível', limits: 'Nunca compare níveis diferentes. Rapidez não é inteligência.' },
  { name: 'Domínio', formula: `≥ ${DEFAULT_MASTERY.minNovelExercises} exercícios novos no nível ≥ ${DEFAULT_MASTERY.minLevel} com ≥ ${DEFAULT_MASTERY.minAccuracy}% sem dicas e ≥ ${DEFAULT_MASTERY.minDelayedReviewsCorrect} revisões corretas após ≥ ${DEFAULT_MASTERY.minDaysBetween} dias`, limits: 'Critérios são hipótese de implementação, ainda não validados.' },
  { name: 'Transferência', formula: 'acertos em problemas diferentes dos de treino ÷ total (indicador separado)', limits: 'Fase 3. Não equivale a melhoria na vida cotidiana.' },
]

export default function Explain() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Central de explicações</h1>
      <section className="card space-y-2">
        <h2 className="font-semibold">O que significam os “100%”?</h2>
        <p>É o cumprimento dos critérios de domínio de uma trilha, não inteligência perfeita, não QI, não “uso do cérebro”. O app mede desempenho em exercícios; isso não prova mudanças neurológicas nem melhora no cotidiano.</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold">Indicadores</h2>
        {METRICS.map((m) => (
          <article key={m.name} className="card text-sm">
            <b>{m.name}</b>
            <p><b>Fórmula:</b> {m.formula}</p>
            <p className="muted"><b>Limitações:</b> {m.limits}</p>
          </article>
        ))}
        <p className="muted text-sm">Amostras com menos de {MIN_SAMPLE} itens exibem aviso de baixa confiabilidade. Não há percentis populacionais nem testes de significância.</p>
      </section>
      <section className="card space-y-1 text-sm">
        <h2 className="font-semibold">Aprender, memorizar, aplicar, explicar, transferir</h2>
        <p>São habilidades distintas: aprender uma regra (entender), memorizá-la (lembrar depois), aplicá-la (resolver), explicá-la (justificar) e transferi-la (usar em contexto novo). O app registra cada uma separadamente quando possível (explicação opcional; revisão na Fase 2; transferência na Fase 3).</p>
      </section>
      <section className="card space-y-1 text-sm">
        <h2 className="font-semibold">Sequências curtas e mais de uma regra</h2>
        <p>Sequências curtas podem admitir várias regras. Um solver independente verifica quais regras explicam os termos; respostas de regras alternativas válidas contam como corretas e recebem uma nota.</p>
      </section>
    </div>
  )
}
