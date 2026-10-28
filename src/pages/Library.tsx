import { COMPETENCY_LABEL } from '../domain/bank'
import { competencyMastery, DEFAULT_MASTERY } from '../domain/metrics'
import type { Competency } from '../domain/types'
import { useData } from '../store'
import { LESSONS } from '../ui/lessons'

const MODULES: { name: string; items: Competency[] }[] = [
  { name: 'Módulo 1 — Fundamentos da lógica', items: ['logica.sequencias', 'logica.padroes', 'logica.classificacao', 'logica.deducao', 'logica.contradicao'] },
  { name: 'Módulo 2 — Raciocínio matemático', items: ['matematica.basica'] },
  { name: 'Módulo 3 — Memória e aprendizagem', items: ['memoria.trabalho'] },
  { name: 'Módulo 4 — Pensamento crítico', items: ['verbal.compreensao', 'explicacao.raciocinio'] },
  { name: 'Módulo 5 — Resolução de problemas', items: ['problemas.resolucao'] },
]

export default function Library() {
  const { attempts } = useData()
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Biblioteca de competências</h1>
      <p className="muted">
        Critérios de domínio atuais (hipótese de implementação, ainda não validada): ≥ {DEFAULT_MASTERY.minNovelExercises} exercícios novos no nível ≥ {DEFAULT_MASTERY.minLevel}, ≥ {DEFAULT_MASTERY.minAccuracy}% de precisão sem dicas e ≥ {DEFAULT_MASTERY.minDelayedReviewsCorrect} revisões corretas após ≥ {DEFAULT_MASTERY.minDaysBetween} dias. As revisões espaçadas chegam na Fase 2: até lá, nenhuma competência pode atingir 100%.
      </p>
      {MODULES.map((m) => (
        <section key={m.name} className="space-y-2">
          <h2 className="font-semibold">{m.name}</h2>
          {m.items.map((c) => {
            const st = competencyMastery(attempts.filter((a) => a.competency === c))
            const l = LESSONS[c]
            return (
              <details key={c} className="card">
                <summary className="cursor-pointer">{COMPETENCY_LABEL[c]} — {st.progress.toFixed(0)}%</summary>
                {l && <p className="mt-2">{l.concept}</p>}
                <ul className="mt-2 text-sm">
                  {st.checks.map((k) => <li key={k.label}>{k.ok ? '✔' : '○'} {k.label}: {k.detail}</li>)}
                </ul>
              </details>
            )
          })}
        </section>
      ))}
      <p className="muted text-sm">Módulo 6 (aplicação prática) e demais conteúdos dos módulos 2–5 estão previstos para as próximas fases.</p>
    </div>
  )
}
