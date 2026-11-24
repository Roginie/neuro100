import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  const [params] = useSearchParams()
  const reviewComps = (params.get('revisar')?.split(',') ?? []).filter((c): c is Competency => c in COMPETENCY_LABEL)
  const [reviewStarted, setReviewStarted] = useState(false)
  // há sessão em andamento e foi pedida uma revisão: a usuária escolhe, nada é descartado sem pedir
  const [conflict, setConflict] = useState<'ask' | 'resume' | 'discard'>('ask')

  useEffect(() => {
    void loadActive().then((a) => setResume(a && a.session.kind === 'practice' ? a : null))
  }, [])
  useEffect(() => {
    if (reviewComps.length > 0 && !reviewStarted && (resume === null || conflict === 'discard')) {
      void clearActive().then(refresh).then(() => {
        setResume(null)
        setReviewStarted(true)
      })
    }
  }, [resume, reviewComps.length, reviewStarted, conflict, refresh])
  if (!ready || resume === undefined) return <p>Carregando…</p>
  if (reviewComps.length > 0 && reviewStarted) {
    return <SessionRunner key="revisao" mode={{ type: 'practice', competencies: reviewComps, review: true }} />
  }
  if (reviewComps.length > 0 && resume && conflict === 'ask') {
    return (
      <div className="card space-y-3" data-testid="review-conflict">
        <h1 className="text-xl font-bold">Você tem uma sessão em andamento</h1>
        <p>Para fazer a revisão agora, é preciso encerrar a sessão em andamento. O que já foi respondido nela continua salvo; só o restante da fila é descartado.</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={() => setConflict('discard')}>Descartar a sessão e revisar</button>
          <button className="btn" onClick={() => setConflict('resume')}>Retomar a sessão em andamento</button>
        </div>
      </div>
    )
  }
  // descartando a sessão antiga: não renderizar o runner com ela nem por um instante
  if (reviewComps.length > 0 && (!resume || conflict === 'discard')) return <p>Preparando revisão…</p>

  if (started || resume) {
    const comps = (!started && (resume?.meta as { competencies?: Competency[] } | undefined)?.competencies) || selected
    const isRev = !!(resume && !started && (resume.meta as { review?: boolean } | undefined)?.review)
    return <SessionRunner mode={{ type: 'practice', competencies: comps, review: isRev }} resume={resume && !started ? resume : undefined} />
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
