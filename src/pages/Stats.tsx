import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { COMPETENCY_LABEL } from '../domain/bank'
import { evolution, MIN_SAMPLE, medianTimeByCategoryLevel, precisionSeries, type Period } from '../domain/metrics'
import type { Competency } from '../domain/types'
import { useData } from '../store'

export default function Stats() {
  const { attempts, assessments } = useData()
  const [period, setPeriod] = useState<Period>('semana')
  const series = useMemo(() => precisionSeries(attempts, period), [attempts, period])
  const medians = useMemo(() => medianTimeByCategoryLevel(attempts.filter((a) => a.kind === 'practice')), [attempts])
  const sorted = [...assessments].sort((a, b) => a.at - b.at)
  const first = sorted[0]
  const last = sorted.length > 1 ? sorted[sorted.length - 1] : undefined

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Estatísticas</h1>

      <section className="card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Precisão e resolução independente</h2>
          <select aria-label="Período" className="input w-auto" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
            <option value="semana">Por semana</option>
            <option value="mes">Por mês</option>
            <option value="trimestre">Por trimestre</option>
          </select>
        </div>
        {series.length === 0 ? (
          <p className="muted">Sem dados de treino ainda.</p>
        ) : (
          <div style={{ width: '100%', height: 260 }} role="img" aria-label="Gráfico histórico de precisão e resolução independente">
            <ResponsiveContainer>
              <LineChart data={series}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="period" stroke="var(--muted)" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="var(--muted)" fontSize={12} unit="%" />
                <Tooltip formatter={(v) => (typeof v === 'number' ? `${v.toFixed(0)}%` : v)} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                <Line type="monotone" dataKey="precision" name="Precisão" stroke="var(--accent)" strokeWidth={2} />
                <Line type="monotone" dataKey="independent" name="Resolução independente" stroke="var(--warn)" strokeWidth={2} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {series.some((p) => p.n < MIN_SAMPLE) && <p className="muted text-sm">Atenção: períodos com menos de {MIN_SAMPLE} exercícios têm baixa confiabilidade. Não há intervalos de confiança nem testes de significância; variações pequenas podem ser acaso.</p>}
        <table className="w-full text-sm">
          <thead><tr className="text-left"><th>Período</th><th>Exercícios</th><th>Precisão</th><th>Independente</th></tr></thead>
          <tbody>
            {series.map((p) => (
              <tr key={p.period}><td>{p.period}</td><td>{p.n}</td><td>{p.precision?.toFixed(0)}%</td><td>{p.independent?.toFixed(0)}%</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold">Evolução entre avaliações</h2>
        {!first ? (
          <p className="muted">Nenhuma avaliação concluída.</p>
        ) : !last ? (
          <p className="muted">Só há a linha de base. Faça uma avaliação equivalente para comparar.</p>
        ) : (
          <>
            <p className="muted text-sm">
              Linha de base ({new Date(first.at).toLocaleDateString('pt-BR')}) × avaliação atual ({new Date(last.at).toLocaleDateString('pt-BR')}) · intervalo de {Math.round((last.at - first.at) / 86_400_000)} dia(s) · formas equivalentes, mas não idênticas em dificuldade: interprete com cautela.
            </p>
            <table className="w-full text-sm" data-testid="evolution">
              <thead><tr className="text-left"><th>Área</th><th>Antes</th><th>Agora</th><th>Dif. abs.</th><th>Dif. %</th></tr></thead>
              <tbody>
                {Object.keys(first.byCompetency).map((k) => {
                  const e = last.byCompetency[k] && evolution(first.byCompetency[k], last.byCompetency[k])
                  return e ? (
                    <tr key={k}>
                      <td>{COMPETENCY_LABEL[k as Competency]}</td>
                      <td>{first.byCompetency[k].correct}/{e.questionsBefore}</td>
                      <td>{last.byCompetency[k].correct}/{e.questionsAfter}</td>
                      <td>{e.absolute > 0 ? '+' : ''}{e.absolute.toFixed(0)} p.p.</td>
                      <td>{e.percent === null ? '—' : `${e.percent.toFixed(0)}%`}{e.lowReliability ? ' ⚠' : ''}</td>
                    </tr>
                  ) : null
                })}
              </tbody>
            </table>
            <p className="muted text-xs">⚠ = poucos itens (&lt; {MIN_SAMPLE}): diferença com baixa confiabilidade. Não é percentil populacional nem medida de QI.</p>
          </>
        )}
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold">Mediana do tempo ativo (por competência e nível)</h2>
        {Object.keys(medians).length === 0 ? <p className="muted">Sem dados.</p> : (
          <ul className="text-sm">
            {Object.entries(medians).sort().map(([k, ms]) => {
              const [c, l] = k.split('|')
              return <li key={k}>{COMPETENCY_LABEL[c as Competency]} · {l}: {(ms / 1000).toFixed(0)} s</li>
            })}
          </ul>
        )}
        <p className="muted text-xs">Não compare níveis diferentes entre si. Rapidez não é medida de inteligência.</p>
      </section>
    </div>
  )
}
