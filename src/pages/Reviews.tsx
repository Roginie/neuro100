import { Link } from 'react-router-dom'
import { COMPETENCY_LABEL } from '../domain/bank'
import { dueReviews, retrievabilityNow, upcomingReviews, REVIEW_CONFIG } from '../domain/review'
import { useData } from '../store'

export const MILESTONE_DAYS = [7, 14, 30, 60, 90]

export default function Reviews() {
  const { assessments, reviews } = useData()
  const now = Date.now()
  const due = dueReviews(reviews, now)
  const upcoming = upcomingReviews(reviews, now)
  const fmtDate = (t: number) => new Date(t).toLocaleDateString('pt-BR')
  const RESULT = { again: 'errou ou precisou da explicação', hard: 'acertou com ajuda', good: 'acertou sem ajuda' }
  const baseline = assessments.find((a) => a.isBaseline)
  const doneAt = assessments.filter((a) => !a.isBaseline).map((a) => a.at)
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Calendário de revisões</h1>
      <div className="card space-y-3" data-testid="spaced-reviews">
        <h2 className="font-semibold">Revisão espaçada de competências</h2>
        {reviews.length === 0 ? (
          <p>Nada agendado ainda. Cada exercício concluído em <Link className="underline" to="/treino">Treinar</Link> agenda a próxima revisão da competência.</p>
        ) : (
          <>
            <p data-testid="due-count">{due.length === 0 ? 'Nenhuma revisão vencida hoje.' : `${due.length} competência(s) para revisar agora.`}</p>
            {due.length > 0 && (
              <>
                <ul className="space-y-1" data-testid="due-list">
                  {due.map((r) => (
                    <li key={r.competency}>
                      <b>{COMPETENCY_LABEL[r.competency]}</b> — venceu em {fmtDate(r.card.due)}; última vez: {RESULT[r.lastRating]} ({fmtDate(r.lastReviewedAt)}); chance estimada de acerto agora: {Math.round(retrievabilityNow(r, now) * 100)}%
                    </li>
                  ))}
                </ul>
                <Link className="btn inline-block" data-testid="start-review" to={`/treino?revisar=${due.map((r) => r.competency).join(',')}`}>Revisar agora</Link>
              </>
            )}
            {upcoming.length > 0 && (
              <>
                <h3 className="font-semibold">Próximas</h3>
                <ul className="space-y-1" data-testid="upcoming-list">
                  {upcoming.map((r) => (
                    <li key={r.competency}>{COMPETENCY_LABEL[r.competency]} — {fmtDate(r.card.due)} (última: {RESULT[r.lastRating]})</li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
        <p className="muted text-sm">
          Agendamento pelo algoritmo FSRS (implementação de referência <code>ts-fsrs</code>, parâmetros padrão, retenção-alvo de {Math.round(REVIEW_CONFIG.requestRetention * 100)}%). É uma <b>adaptação</b>: o FSRS foi feito para itens de memória e aqui agenda a prática de uma habilidade. Não foi calibrado com seus dados nem validado para raciocínio. Veja SCIENTIFIC_FOUNDATIONS.md.
        </p>
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
              const isDueDay = Date.now() >= date.getTime()
              const nearest = doneAt.some((t) => Math.abs(t - date.getTime()) < 3.5 * 86_400_000)
              return (
                <li key={d}>
                  Dia {d}: {date.toLocaleDateString('pt-BR')} — {nearest ? 'avaliação realizada' : isDueDay ? 'disponível' : 'a vencer'}
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
