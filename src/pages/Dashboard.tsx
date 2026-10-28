import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { COMPETENCY_LABEL } from '../domain/bank'
import { competencyMastery, independentResolution, precision, retention, transfer, type Ratio } from '../domain/metrics'
import type { Competency } from '../domain/types'
import { loadActive, type ActiveSessionState } from '../storage/db'
import { useData } from '../store'

export const fmtMin = (ms: number) => `${Math.round(ms / 60000)} min`

function Metric({ label, r, def }: { label: string; r: Ratio; def: string }) {
  return (
    <div className="card">
      <div className="muted text-sm">{label}</div>
      <div className="text-3xl font-bold" data-testid={`metric-${label}`}>{r.value === null ? '—' : `${r.value.toFixed(0)}%`}</div>
      <div className="muted text-sm">{r.num} de {r.den}{r.lowReliability && r.den > 0 ? ' · amostra pequena: baixa confiabilidade' : ''}</div>
      <div className="muted mt-1 text-xs">{def}</div>
    </div>
  )
}

export default function Dashboard() {
  const { attempts, sessions, assessments, ready } = useData()
  const [active, setActive] = useState<ActiveSessionState | undefined>()
  useEffect(() => {
    void loadActive().then(setActive)
  }, [])
  if (!ready) return <p>Carregando…</p>

  const practice = attempts.filter((a) => a.kind === 'practice' || a.kind === 'transfer')
  const totalActive = sessions.reduce((s, x) => s + x.activeMs, 0)
  const comps = [...new Set(attempts.map((a) => a.competency))] as Competency[]
  const mastery = comps.map((c) => ({ c, m: competencyMastery(attempts.filter((a) => a.competency === c)) }))
  const overall = mastery.length ? mastery.reduce((s, x) => s + x.m.progress, 0) / mastery.length : 0
  const baseline = assessments.find((a) => a.isBaseline)

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Painel</h1>

      {active && (
        <div className="card flex flex-wrap items-center justify-between gap-3" style={{ borderColor: 'var(--accent)' }} data-testid="resume-card">
          <span>Você tem uma {active.session.kind === 'assessment' ? 'avaliação' : 'sessão'} em andamento ({fmtMin(active.session.activeMs)} de tempo ativo).</span>
          <Link className="btn" to={active.session.kind === 'assessment' ? '/avaliacao' : '/treino'}>Retomar</Link>
        </div>
      )}

      {!baseline ? (
        <div className="card space-y-2">
          <p>Comece pela <b>avaliação inicial</b>: ela registra a sua linha de base (não é um teste de QI).</p>
          <Link className="btn inline-block" to="/avaliacao">Fazer avaliação inicial</Link>
        </div>
      ) : (
        <div className="card space-y-2">
          <h2 className="font-semibold">Linha de base registrada em {new Date(baseline.at).toLocaleDateString('pt-BR')}</h2>
          <ul className="grid gap-x-6 sm:grid-cols-2">
            {Object.entries(baseline.byCompetency).map(([k, v]) => (
              <li key={k}>{COMPETENCY_LABEL[k as Competency]}: {v.correct} de {v.total}</li>
            ))}
          </ul>
          <Link className="btn inline-block" to="/treino">Treinar agora</Link>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Precisão" r={precision(practice)} def="corretas ÷ respostas válidas (treino)" />
        <Metric label="Resolução independente" r={independentResolution(practice)} def="corretos na 1ª tentativa, sem dicas ÷ concluídos" />
        <Metric label="Retenção" r={retention(attempts)} def="revisões corretas sem consulta ÷ revisões (Fase 2)" />
        <Metric label="Transferência" r={transfer(attempts)} def="acertos em problemas novos (Fase 3)" />
      </div>

      <div className="card space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">Domínio das competências</h2>
          <span className="text-2xl font-bold" data-testid="overall">{overall.toFixed(0)}%</span>
        </div>
        <div className="bar" role="progressbar" aria-valuenow={Math.round(overall)} aria-valuemin={0} aria-valuemax={100} aria-label="Domínio geral"><div style={{ width: `${overall}%` }} /></div>
        <p className="muted text-sm">
          100% significa cumprir os critérios de domínio definidos (exercícios novos sem dicas <i>e</i> revisões corretas após dias). Não significa inteligência máxima nem uso do cérebro.{' '}
          <Link className="underline" to="/explicacoes">Definição e limitações</Link>
        </p>
        {mastery.length === 0 && <p className="muted">Sem dados ainda.</p>}
        {mastery.map(({ c, m }) => (
          <div key={c}>
            <div className="flex justify-between text-sm"><span>{COMPETENCY_LABEL[c]}</span><span>{m.progress.toFixed(0)}%{m.mastered ? ' · dominada' : ''}</span></div>
            <div className="bar"><div style={{ width: `${m.progress}%` }} /></div>
          </div>
        ))}
      </div>

      <div className="card">
        Tempo ativo acumulado: <b>{fmtMin(totalActive)}</b> em {sessions.filter((s) => s.finished).length} sessões concluídas.
      </div>
    </div>
  )
}
