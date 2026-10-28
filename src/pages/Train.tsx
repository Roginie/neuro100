import { useEffect, useState } from 'react'
import { COMPETENCY_LABEL } from '../domain/bank'
import type { Competency, Settings } from '../domain/types'
import { loadActive, clearActive, type ActiveSessionState } from '../storage/db'
import { useData } from '../store'
import { LESSONS } from '../ui/lessons'
import SessionRunner from '../ui/SessionRunner'

const MODULE1: Competency[] = ['logica.sequencias', 'logica.padroes', 'logica.classificacao', 'logica.deducao', 'logica.contradicao']
const EXTRA: Competency[] = ['matematica.basica', 'problemas.resolucao', 'explicacao.raciocinio']

export default function Train() {
  const { settings, updateSettings, ready, refresh } = useData()
  const [resume, setResume] = useState<ActiveSessionState | null | undefined>(undefined)
  const [selected, setSelected] = useState<Competency[]>(['logica.sequencias'])
  const [started, setStarted] = useState(false)

  useEffect(() => {
    void loadActive().then((a) => setResume(a && a.session.kind === 'practice' ? a : null))
  }, [])
  if (!ready || resume === undefined) return <p>Carregando…</p>

  if (started || resume) {
    const comps = (!started && (resume?.meta as { competencies?: Competency[] } | undefined)?.competencies) || selected
    return <SessionRunner mode={{ type: 'practice', competencies: comps }} resume={resume && !started ? resume : undefined} />
  }

  const toggle = (c: Competency) => setSelected((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]))
  const lessons = selected.map((c) => ({ c, l: LESSONS[c] })).filter((x) => x.l)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Treinar</h1>
      <p className="muted">Ciclo: ler a explicação e o exemplo resolvido → praticar com dicas progressivas → explicar o raciocínio → receber feedback. A dificuldade se ajusta pelas regras (visíveis em Configurações).</p>

      <fieldset className="card space-y-2">
        <legend className="px-1 font-semibold">Competências</legend>
        {[...MODULE1, ...EXTRA].map((c) => (
          <label key={c} className="flex min-h-11 items-center gap-2">
            <input type="checkbox" checked={selected.includes(c)} onChange={() => toggle(c)} className="size-5" />
            {COMPETENCY_LABEL[c]}
          </label>
        ))}
      </fieldset>

      <label className="card block">
        <span className="font-semibold">Duração da sessão (tempo ativo)</span>
        <select className="input mt-2" value={settings.sessionMinutes} onChange={(e) => void updateSettings({ ...settings, sessionMinutes: Number(e.target.value) as Settings['sessionMinutes'] })}>
          {[5, 10, 15, 20, 30].map((m) => <option key={m} value={m}>{m} minutos</option>)}
        </select>
        <span className="muted text-sm">Opção de experiência de uso; não é uma prescrição científica.</span>
      </label>

      {lessons.map(({ c, l }) => (
        <details key={c} className="card">
          <summary className="cursor-pointer font-semibold">Aprender: {l!.title}</summary>
          <p className="mt-2">{l!.concept}</p>
          <p className="mt-2"><b>Exemplo resolvido:</b> {l!.exampleProblem}</p>
          <ol className="ml-5 list-decimal">{l!.exampleSteps.map((s) => <li key={s}>{s}</li>)}</ol>
        </details>
      ))}

      <button className="btn" disabled={selected.length === 0} onClick={async () => { await clearActive(); await refresh(); setStarted(true) }}>Iniciar sessão</button>
    </div>
  )
}
