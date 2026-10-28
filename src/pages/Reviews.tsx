import { Link } from 'react-router-dom'
import { useData } from '../store'

export const MILESTONE_DAYS = [7, 14, 30, 60, 90]

export default function Reviews() {
  const { assessments } = useData()
  const baseline = assessments.find((a) => a.isBaseline)
  const done = assessments.filter((a) => !a.isBaseline).map((a) => a.at)
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Calendário de revisões</h1>
      <div className="card">
        <b>Revisão espaçada de competências:</b> ainda não implementada (Fase 2). Quando existir, as revisões agendadas aparecerão aqui, com data da última revisão, resultado e próxima data. Nada é agendado hoje.
      </div>
      <div className="card space-y-2">
        <h2 className="font-semibold">Marcos de reavaliação</h2>
        <p className="muted text-sm">Marcos de acompanhamento do produto (7, 14, 30, 60 e 90 dias após a linha de base). Não são garantias de resultados cognitivos.</p>
        {!baseline ? (
          <p>Faça a <Link className="underline" to="/avaliacao">avaliação inicial</Link> para gerar os marcos.</p>
        ) : (
          <ul data-testid="milestones">
            {MILESTONE_DAYS.map((d) => {
              const date = new Date(baseline.at + d * 86_400_000)
              const due = Date.now() >= date.getTime()
              const nearest = done.some((t) => Math.abs(t - date.getTime()) < 3.5 * 86_400_000)
              return (
                <li key={d}>
                  Dia {d}: {date.toLocaleDateString('pt-BR')} — {nearest ? 'avaliação realizada' : due ? 'disponível' : 'a vencer'}
                </li>
              )
            })}
          </ul>
        )}
        {baseline && <Link className="btn inline-block" to="/avaliacao">Fazer avaliação equivalente</Link>}
      </div>
    </div>
  )
}
