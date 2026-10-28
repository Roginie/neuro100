import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { decideLevel, type Outcome } from '../domain/adaptive'
import { BANK_VERSION, COMPETENCY_LABEL, findExerciseById, practiceExercise } from '../domain/bank'
import { gradeAnswer } from '../domain/sequences'
import { SessionClock } from '../domain/sessionClock'
import type { AssessmentResult, Attempt, Competency, Exercise, Level, SessionRecord } from '../domain/types'
import { addAttempt, clearActive, saveActive, saveAssessment, saveSession, type ActiveSessionState } from '../storage/db'
import { useData } from '../store'
import { LESSONS } from './lessons'

export type RunnerMode =
  | { type: 'assessment'; items: Exercise[] }
  | { type: 'practice'; competencies: Competency[] }

interface Props {
  mode: RunnerMode
  resume?: ActiveSessionState
}

interface AdaptiveMeta {
  levels: Record<string, Level>
  recent: Record<string, Outcome[]>
  seed: number
  rot: number
  competencies?: Competency[]
}

const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

type Phase = 'intro' | 'running' | 'summary'

export default function SessionRunner({ mode, resume }: Props) {
  const { settings, refresh, assessments } = useData()
  const isAssessment = mode.type === 'assessment'

  const clock = useRef<SessionClock>(null as unknown as SessionClock)
  if (!clock.current) {
    const cfg = { warnAfterMs: settings.inactivityWarnSeconds * 1000, pauseAfterWarnMs: settings.inactivityPauseSeconds * 1000 }
    clock.current = resume ? SessionClock.restore(resume.clock, Date.now(), cfg) : new SessionClock(cfg)
  }
  const sessionRef = useRef<SessionRecord>(
    resume?.session ?? {
      id: crypto.randomUUID(),
      kind: isAssessment ? 'assessment' : 'practice',
      plannedMinutes: settings.sessionMinutes,
      startedAt: Date.now(),
      totalMs: 0,
      activeMs: 0,
      pausedMs: 0,
      finished: false,
    },
  )

  const [phase, setPhase] = useState<Phase>(resume ? 'running' : 'intro')
  const [, force] = useState(0)
  const [queue, setQueue] = useState<string[]>(
    resume?.queue ?? (mode.type === 'assessment' ? mode.items.map((e) => e.id) : []),
  )
  const meta = useRef<AdaptiveMeta>(
    (resume?.meta as unknown as AdaptiveMeta) ?? {
      levels: {},
      recent: {},
      seed: Math.floor(Math.random() * 1e6),
      rot: 0,
      competencies: mode.type === 'practice' ? mode.competencies : undefined,
    },
  )
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [answer, setAnswer] = useState('')
  const [reasoning, setReasoning] = useState('')
  const [hints, setHints] = useState(0)
  const [tries, setTries] = useState(0)
  const [status, setStatus] = useState<'answering' | 'done'>('answering')
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'bad' | 'info'; text: string } | null>(null)
  const [levelMsg, setLevelMsg] = useState<string | null>(null)
  const [done, setDone] = useState<{ ex: Exercise; given: string; verdict: Attempt['verdict'] }[]>([])
  const [masked, setMasked] = useState(false)
  const [timeUp, setTimeUp] = useState(false)
  const [savedResult, setSavedResult] = useState<AssessmentResult | null>(null)
  const exStart = useRef(0)

  // ---------- relógio, inatividade e visibilidade ----------
  useEffect(() => {
    if (phase !== 'running') return
    const c = clock.current
    if (c.state === 'stopped') c.start(Date.now())
    const id = setInterval(() => {
      c.tick(Date.now())
      force((n) => n + 1)
    }, 1000)
    const interact = () => c.interact(Date.now())
    const vis = () => {
      c.setHidden(document.hidden, Date.now())
      force((n) => n + 1)
    }
    const evs = ['pointerdown', 'keydown', 'input'] as const
    evs.forEach((e) => document.addEventListener(e, interact))
    document.addEventListener('visibilitychange', vis)
    return () => {
      clearInterval(id)
      evs.forEach((e) => document.removeEventListener(e, interact))
      document.removeEventListener('visibilitychange', vis)
    }
  }, [phase])

  // ---------- escolha do próximo exercício ----------
  const loadNext = useCallback(
    (q: string[]) => {
      let next: Exercise | null = null
      if (mode.type === 'assessment') {
        next = q.length ? (mode.items.find((e) => e.id === q[0]) ?? findExerciseById(q[0])) : null
      } else {
        const m = meta.current
        for (let i = 0; i < mode.competencies.length && !next; i++) {
          const comp = mode.competencies[(m.rot + i) % mode.competencies.length]
          const level = m.levels[comp] ?? 1
          m.seed += 1
          next = practiceExercise(comp, level, m.seed)
          if (next) m.rot = (m.rot + i + 1) % mode.competencies.length
        }
      }
      setExercise(next)
      setAnswer('')
      setReasoning('')
      setHints(0)
      setTries(0)
      setStatus('answering')
      setFeedback(null)
      exStart.current = clock.current.snapshot(Date.now()).activeMs
      setMasked(false)
      return next
    },
    [mode],
  )

  useEffect(() => {
    if (phase === 'running' && !exercise) loadNext(queue)
  }, [phase, exercise, loadNext, queue])

  // memória de trabalho: mostrar a sequência por alguns segundos e ocultar
  useEffect(() => {
    if (exercise?.subcompetency !== 'sequencia-inversa') return
    const t = setTimeout(() => setMasked(true), 4000)
    return () => clearTimeout(t)
  }, [exercise])

  const persist = useCallback(
    async (nextQueue: string[]) => {
      const snap = clock.current.snapshot(Date.now())
      const s = { ...sessionRef.current, activeMs: snap.activeMs, pausedMs: snap.pausedMs, totalMs: snap.totalMs }
      sessionRef.current = s
      await saveSession(s)
      await saveActive({
        id: 'current',
        session: s,
        clock: { activeMs: snap.activeMs, pausedMs: snap.pausedMs, startedAt: snap.startedAt },
        queue: nextQueue,
        level: 0,
        meta: meta.current as unknown as Record<string, unknown>,
        savedAt: Date.now(),
      })
    },
    [],
  )

  const recordAttempt = async (given: string, verdict: Attempt['verdict'], hintsUsed: number, n: number) => {
    if (!exercise) return
    const now = Date.now()
    await addAttempt({
      sessionId: sessionRef.current.id,
      exerciseId: exercise.id,
      competency: exercise.competency,
      subcompetency: exercise.subcompetency,
      level: exercise.level,
      kind: isAssessment ? 'assessment' : 'practice',
      answer: given,
      verdict,
      hintsUsed,
      attemptNumber: n,
      activeMs: Math.max(0, clock.current.snapshot(now).activeMs - exStart.current),
      explanation: reasoning || undefined,
      at: now,
    })
  }

  const finishExercise = async (given: string, verdict: Attempt['verdict'], hintsUsed: number) => {
    if (!exercise) return
    setDone((d) => [...d, { ex: exercise, given, verdict }])
    const nextQueue = queue.slice(1)
    if (!isAssessment) {
      const m = meta.current
      const comp = exercise.competency
      const level = (m.levels[comp] ?? 1) as Level
      const recent = [...(m.recent[comp] ?? []), { correct: verdict !== 'incorrect', hintsUsed }]
      const d = decideLevel(level, recent, settings.adaptive)
      m.recent[comp] = d.action === 'raise' || d.action === 'review' ? [] : recent
      m.levels[comp] = d.level
      setLevelMsg(
        d.action === 'raise'
          ? `Nível de ${COMPETENCY_LABEL[comp]} subiu para ${d.level}. ${d.reason}`
          : d.action === 'review'
            ? `Sugestão: revisar os conceitos de ${COMPETENCY_LABEL[comp]} (nível ${d.level}). ${d.reason}`
            : null,
      )
    }
    setQueue(nextQueue)
    await persist(nextQueue)
    setStatus('done')
    const snap = clock.current.snapshot(Date.now())
    if (!isAssessment && snap.activeMs >= sessionRef.current.plannedMinutes * 60_000) setTimeUp(true)
  }

  const submit = async (value: string) => {
    if (!exercise || status !== 'answering' || !value.trim()) return
    const g = gradeAnswer(exercise, value)
    const n = tries + 1
    setTries(n)
    if (isAssessment) {
      await recordAttempt(value, g.verdict, 0, 1)
      await finishExercise(value, g.verdict, 0)
      return
    }
    if (g.verdict !== 'incorrect') {
      await recordAttempt(value, g.verdict, hints, n)
      setFeedback({ tone: 'ok', text: g.note ? `Correto — ${g.note}` : 'Correto.' })
      await finishExercise(value, g.verdict, hints)
    } else {
      await recordAttempt(value, 'incorrect', hints, n)
      if (hints < exercise.hints.length) {
        setFeedback({ tone: 'info', text: `Ainda não. Vamos pensar juntos: ${exercise.hints[hints]}` })
        setHints(hints + 1)
      } else {
        setFeedback({ tone: 'bad', text: 'Ainda não. Quando quiser, veja a explicação completa.' })
      }
      setAnswer('')
    }
  }

  const giveUp = async () => {
    if (!exercise) return
    await recordAttempt('(explicação completa)', 'incorrect', hints, tries + 1)
    setFeedback({ tone: 'bad', text: 'Sem problema. Leia a explicação e, depois, siga para o próximo.' })
    await finishExercise('(explicação completa)', 'incorrect', hints)
  }

  const askHint = () => {
    if (!exercise || hints >= exercise.hints.length) return
    setFeedback({ tone: 'info', text: `Dica ${hints + 1}: ${exercise.hints[hints]}` })
    setHints(hints + 1)
  }

  const next = () => {
    setLevelMsg(null)
    if (isAssessment && queue.length === 0) return void finish()
    loadNext(queue)
  }

  const finish = async () => {
    const c = clock.current
    c.stop(Date.now())
    const snap = c.snapshot(Date.now())
    const s = { ...sessionRef.current, ...snap, activeMs: snap.activeMs, pausedMs: snap.pausedMs, totalMs: snap.totalMs, endedAt: Date.now(), finished: true }
    sessionRef.current = s
    await saveSession(s)
    // Avaliação interrompida não vira linha de base nem ponto de comparação.
    if (isAssessment && queue.length === 0) {
      const by: AssessmentResult['byCompetency'] = {}
      for (const d of done) {
        const b = (by[d.ex.competency] ??= { correct: 0, total: 0 })
        b.total += 1
        if (d.verdict !== 'incorrect') b.correct += 1
      }
      const result: AssessmentResult = {
        id: s.id,
        at: Date.now(),
        byCompetency: by,
        activeMs: s.activeMs,
        isBaseline: assessments.length === 0,
        bankVersion: BANK_VERSION,
      }
      await saveAssessment(result)
      setSavedResult(result)
    }
    await clearActive()
    await refresh()
    setPhase('summary')
  }

  const state = clock.current.state
  const paused = state.startsWith('paused')
  const snap = clock.current.snapshot(Date.now())
  const planned = sessionRef.current.plannedMinutes * 60_000
  const pct = Math.min(100, (snap.activeMs / planned) * 100)

  const intros = useMemo(() => {
    const comps = isAssessment ? [...new Set(mode.items.map((e) => e.competency))] : []
    return comps.map((c) => ({ c, l: LESSONS[c] })).filter((x) => x.l)
  }, [isAssessment, mode])

  // ---------------- renderização ----------------
  if (phase === 'intro') {
    return (
      <div className="space-y-4 fade">
        <h1 className="text-2xl font-bold">{isAssessment ? 'Avaliação inicial' : 'Sessão de treino'}</h1>
        {isAssessment ? (
          <>
            <p>
              Esta avaliação registra uma <b>linha de base individual</b>. Ela <b>não mede QI</b> nem inteligência: apenas o seu desempenho nestes itens, hoje. Não há dicas durante a avaliação. Comece pelos exemplos resolvidos:
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {intros.map(({ c, l }) => (
                <details key={c} className="card">
                  <summary className="cursor-pointer font-semibold">{l!.title} — exemplo resolvido</summary>
                  <p className="muted mt-2">{l!.concept}</p>
                  <p className="mt-2"><b>Exemplo:</b> {l!.exampleProblem}</p>
                  <ol className="ml-5 list-decimal">{l!.exampleSteps.map((s) => <li key={s}>{s}</li>)}</ol>
                </details>
              ))}
            </div>
          </>
        ) : (
          <p>
            Duração planejada: <b>{settings.sessionMinutes} min</b> de tempo <b>ativo</b>. O tempo pausa se você ficar sem interagir (mas pensar é permitido: você será avisado antes) ou sair da página.
          </p>
        )}
        <button className="btn" onClick={() => setPhase('running')}>Começar</button>
      </div>
    )
  }

  if (phase === 'summary') {
    const correct = done.filter((d) => d.verdict !== 'incorrect').length
    return (
      <div className="space-y-4 fade" data-testid="summary">
        <h1 className="text-2xl font-bold">{isAssessment ? 'Avaliação concluída' : 'Sessão concluída'}</h1>
        <div className="card space-y-1">
          <p>Respostas corretas: <b>{correct}</b> de <b>{done.length}</b></p>
          <p>Tempo ativo: <b>{fmt(sessionRef.current.activeMs)}</b> · Pausado: {fmt(sessionRef.current.pausedMs)}</p>
          {isAssessment && !savedResult && <p className="font-semibold">Avaliação incompleta: não foi registrada como linha de base.</p>}
          {savedResult && (
            <>
              <p className="font-semibold">{savedResult.isBaseline ? 'Linha de base registrada.' : 'Avaliação registrada para comparação.'}</p>
              <ul>
                {Object.entries(savedResult.byCompetency).map(([k, v]) => (
                  <li key={k}>{COMPETENCY_LABEL[k as Competency]}: {v.correct} de {v.total}</li>
                ))}
              </ul>
              <p className="muted text-sm">Poucos itens por área: os números são indicativos, não conclusivos.</p>
            </>
          )}
        </div>
        {isAssessment && (
          <details className="card">
            <summary className="cursor-pointer font-semibold">Ver respostas e explicações</summary>
            {done.map((d) => (
              <div key={d.ex.id} className="mt-3 border-t pt-2" style={{ borderColor: 'var(--border)' }}>
                <pre className="prompt">{d.ex.prompt}</pre>
                <p>Sua resposta: {d.given} — {d.verdict === 'incorrect' ? 'incorreta' : 'correta'}. Esperada: <b>{d.ex.answer}</b></p>
                <p className="muted">{d.ex.explanation}</p>
              </div>
            ))}
          </details>
        )}
        <div className="card">
          <b>Recuperação (informativo, não é aconselhamento médico):</b>
          <ul className="ml-5 list-disc muted">
            <li>Pausas ajudam quando você sente fadiga; distribuir a prática em vários dias favorece a retenção.</li>
            <li>Manter uma rotina de sono regular (adultos: 7 h ou mais por noite, segundo o CDC) favorece atenção e memória.</li>
            <li>Atividade física regular está associada a benefícios cognitivos, de magnitude variável.</li>
            <li>Retome o que aprendeu sem consultar anotações: a recuperação ativa fortalece a aprendizagem.</li>
          </ul>
          <Link to="/referencias" className="underline">Fontes</Link>
        </div>
        <Link to="/" className="btn inline-block">Voltar ao painel</Link>
      </div>
    )
  }

  const idxLabel = isAssessment ? `Questão ${done.length + 1} de ${done.length + queue.length}` : `Exercício ${done.length + 1}`
  const lines = exercise?.prompt.split('\n') ?? []
  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-3">
        <div className="min-w-40 flex-1">
          <div className="flex justify-between text-sm">
            <span>Tempo ativo <b data-testid="active-time">{fmt(snap.activeMs)}</b></span>
            {!isAssessment && <span className="muted">meta {settings.sessionMinutes} min</span>}
          </div>
          {!isAssessment && <div className="bar" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso do tempo planejado"><div style={{ width: `${pct}%` }} /></div>}
        </div>
        <span className="muted text-sm" data-testid="clock-state">{paused ? 'Pausado' : state === 'warning' ? 'Inatividade' : 'Em andamento'}</span>
        <button className="btn btn-ghost" onClick={() => { clock.current.pause(Date.now()); force((n) => n + 1) }} disabled={paused}>Pausar</button>
        <button className="btn btn-ghost" onClick={() => void finish()}>Encerrar</button>
      </div>

      {state === 'warning' && (
        <div role="alert" className="card" style={{ borderColor: 'var(--warn)' }}>
          Você está sem interagir. Se estiver pensando, tudo bem: toque em qualquer lugar para continuar, ou a sessão pausa em instantes.
        </div>
      )}

      {paused && (
        <div role="dialog" aria-modal="true" aria-label="Sessão pausada" className="card space-y-2" style={{ borderColor: 'var(--accent)' }} data-testid="paused">
          <b>Sessão pausada.</b> {state === 'paused-idle' ? 'Pausamos por inatividade.' : state === 'paused-hidden' ? 'A página ficou oculta.' : ''} O tempo parado não conta como ativo. Deseja continuar?
          <div><button className="btn" onClick={() => { clock.current.resume(Date.now()); force((n) => n + 1) }}>Continuar</button></div>
        </div>
      )}

      {exercise ? (
        <div className="card space-y-3 fade" aria-live="polite">
          <div className="flex justify-between text-sm muted">
            <span>{idxLabel} · {COMPETENCY_LABEL[exercise.competency]}</span>
            {!isAssessment && <span>Nível {exercise.level}</span>}
          </div>
          {exercise.subcompetency === 'sequencia-inversa' && masked ? (
            <pre className="prompt">{lines[0]}{'\n'}• • • •   (sequência oculta)</pre>
          ) : (
            <pre className="prompt">{exercise.prompt}</pre>
          )}

          {status === 'answering' && !paused && (
            <form onSubmit={(e) => { e.preventDefault(); void submit(answer) }} className="space-y-3">
              {exercise.options ? (
                <div role="radiogroup" aria-label="Alternativas" className="grid gap-2">
                  {exercise.options.map((o) => (
                    <button type="button" key={o} className="btn btn-ghost text-left" onClick={() => void submit(o)}>{o}</button>
                  ))}
                </div>
              ) : (
                <>
                  <label className="block"><span className="sr-only">Sua resposta</span>
                    <input className="input" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Sua resposta" inputMode="text" autoFocus autoComplete="off" />
                  </label>
                  {!isAssessment && (
                    <label className="block text-sm"><span className="muted">Explique em uma frase como pensou (opcional)</span>
                      <input className="input mt-1" value={reasoning} onChange={(e) => setReasoning(e.target.value)} />
                    </label>
                  )}
                  <button className="btn" type="submit" disabled={!answer.trim()}>Responder</button>
                </>
              )}
              {!isAssessment && (
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn btn-ghost" onClick={askHint} disabled={hints >= exercise.hints.length}>Pedir dica ({hints}/{exercise.hints.length})</button>
                  <button type="button" className="btn btn-ghost" onClick={() => void giveUp()}>Ver explicação completa</button>
                </div>
              )}
            </form>
          )}

          {feedback && (
            <p role="status" style={{ color: feedback.tone === 'ok' ? 'var(--ok)' : feedback.tone === 'bad' ? 'var(--bad)' : 'var(--text)' }} data-testid="feedback">{feedback.text}</p>
          )}

          {status === 'done' && !isAssessment && (
            <div className="space-y-2" data-testid="explanation">
              <p className="muted">{exercise.explanation}</p>
              {levelMsg && <p className="font-semibold">{levelMsg}</p>}
              {timeUp ? (
                <div className="space-y-2">
                  <p>Tempo planejado concluído. Você pode encerrar agora ou continuar.</p>
                  <button className="btn" onClick={() => void finish()}>Encerrar sessão</button>{' '}
                  <button className="btn btn-ghost" onClick={() => { setTimeUp(false); next() }}>Continuar mais um pouco</button>
                </div>
              ) : (
                <button className="btn" onClick={next} autoFocus>Próximo exercício</button>
              )}
            </div>
          )}
          {status === 'done' && isAssessment && (
            <button className="btn" onClick={next} autoFocus data-testid="next-assessment">
              {queue.length === 0 ? 'Concluir avaliação' : 'Próxima questão'}
            </button>
          )}
        </div>
      ) : (
        <div className="card">Sem mais exercícios disponíveis. <button className="btn" onClick={() => void finish()}>Concluir</button></div>
      )}
    </div>
  )
}
