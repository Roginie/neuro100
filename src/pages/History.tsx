import { COMPETENCY_LABEL } from '../domain/bank'
import { finalAttempts } from '../domain/metrics'
import { useData } from '../store'
import { fmtMin } from './Dashboard'

const verdictLabel = { correct: 'correta', 'valid-alternative': 'alternativa válida', incorrect: 'incorreta' } as const

export default function History() {
  const { sessions, attempts } = useData()
  const list = [...sessions].sort((a, b) => b.startedAt - a.startedAt)
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Histórico</h1>
      {list.length === 0 && <p className="muted">Nenhuma sessão registrada ainda.</p>}
      {list.map((s) => {
        const att = finalAttempts(attempts.filter((a) => a.sessionId === s.id))
        return (
          <details key={s.id} className="card">
            <summary className="cursor-pointer">
              {new Date(s.startedAt).toLocaleString('pt-BR')} · {s.kind === 'assessment' ? 'Avaliação' : 'Treino'} · ativo {fmtMin(s.activeMs)} · {att.filter((a) => a.verdict !== 'incorrect').length}/{att.length} corretas{s.finished ? '' : ' · não finalizada'}
            </summary>
            <p className="muted text-sm">Total {fmtMin(s.totalMs)} · pausado {fmtMin(s.pausedMs)}</p>
            <ul className="mt-2 text-sm">
              {att.map((a) => (
                <li key={`${a.exerciseId}-${a.attemptNumber}`}>
                  {COMPETENCY_LABEL[a.competency]} (nível {a.level}): {verdictLabel[a.verdict]}, {a.hintsUsed} dica(s), {Math.round(a.activeMs / 1000)} s
                </li>
              ))}
            </ul>
          </details>
        )
      })}
    </div>
  )
}
