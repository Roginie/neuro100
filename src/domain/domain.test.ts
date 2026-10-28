import { describe, expect, it } from 'vitest'
import { decideLevel, DEFAULT_ADAPTIVE } from './adaptive'
import { competencyMastery, evolution, independentResolution, median, precision, retention } from './metrics'
import { fittingRules, generateSequence, gradeAnswer } from './sequences'
import { SessionClock } from './sessionClock'
import type { Attempt, Level } from './types'

const att = (o: Partial<Attempt>): Attempt => ({
  sessionId: 's1',
  exerciseId: 'e1',
  competency: 'logica.sequencias',
  subcompetency: 'x',
  level: 3,
  kind: 'practice',
  answer: '1',
  verdict: 'correct',
  hintsUsed: 0,
  attemptNumber: 1,
  activeMs: 1000,
  at: 0,
  ...o,
})

describe('métricas', () => {
  it('precisão', () => {
    const r = precision([att({}), att({ verdict: 'incorrect' }), att({ verdict: 'valid-alternative' }), att({})])
    expect(r.value).toBe(75)
    expect(r.lowReliability).toBe(true)
  })
  it('precisão sem dados é null, não 0', () => expect(precision([]).value).toBeNull())
  it('resolução independente usa só a conclusão de cada exercício', () => {
    const r = independentResolution([
      att({ exerciseId: 'a' }),
      att({ exerciseId: 'b', hintsUsed: 2 }),
      att({ exerciseId: 'c', verdict: 'incorrect', attemptNumber: 1 }),
      att({ exerciseId: 'c', attemptNumber: 2 }), // acertou na 2ª tentativa: não é independente
    ])
    expect(r.num).toBe(1)
    expect(r.den).toBe(3)
  })
  it('retenção só considera revisões', () => {
    const r = retention([att({ kind: 'review' }), att({ kind: 'review', verdict: 'incorrect' }), att({})])
    expect(r.value).toBe(50)
  })
  it('mediana', () => {
    expect(median([5, 1, 3])).toBe(3)
    expect(median([1, 2, 3, 4])).toBe(2.5)
    expect(median([])).toBeNull()
  })
  it('evolução: diferença absoluta e percentual', () => {
    const e = evolution({ correct: 4, total: 10 }, { correct: 6, total: 10 })!
    expect(e.absolute).toBeCloseTo(20)
    expect(e.percent).toBeCloseTo(50)
    expect(evolution({ correct: 0, total: 10 }, { correct: 3, total: 10 })!.percent).toBeNull()
  })
  it('domínio exige revisões tardias, não só exercícios', () => {
    const day = 86_400_000
    const practice = Array.from({ length: 8 }, (_, i) => att({ exerciseId: `p${i}`, at: i }))
    expect(competencyMastery(practice).mastered).toBe(false)
    const reviews = [att({ kind: 'review', exerciseId: 'r1', at: 8 * day }), att({ kind: 'review', exerciseId: 'r2', at: 9 * day })]
    expect(competencyMastery([...practice, ...reviews]).mastered).toBe(true)
  })
})

describe('sequências', () => {
  it('exemplo do enunciado: 2,6,12,20,30 → 42; 60 é incorreto', () => {
    const rules = fittingRules([2, 6, 12, 20, 30])
    expect(rules.map((r) => r.next)).toContain(42)
    expect(rules.map((r) => r.next)).not.toContain(60)
  })
  it('todo exercício gerado tem resposta confirmada pelo solver independente (400 casos)', () => {
    for (const level of [1, 2, 3, 4, 5] as Level[]) {
      for (let seed = 1; seed <= 80; seed++) {
        const ex = generateSequence(seed, level)
        const shown = ex.prompt.split('\n')[1].replace(', ?', '').split(', ').map(Number)
        expect(fittingRules(shown).some((r) => String(r.next) === ex.answer)).toBe(true)
      }
    }
  })
  it('é determinístico por semente', () => {
    expect(generateSequence(7, 3)).toEqual(generateSequence(7, 3))
  })
  it('alternativa válida (outra regra) conta como correta, com nota', () => {
    const ex = {
      ...generateSequence(3, 1),
      answer: '32',
      alternatives: [{ answer: '31', note: 'Regra alternativa válida.' }],
    }
    expect(gradeAnswer(ex, '31')).toEqual({ verdict: 'valid-alternative', note: 'Regra alternativa válida.' })
    expect(gradeAnswer(ex, '33').verdict).toBe('incorrect')
  })
  it('solver reconhece só regras que explicam todos os termos', () => {
    expect(fittingRules([1, 2, 4, 8, 16]).map((r) => r.next)).toEqual([32])
    expect(fittingRules([1, 2, 4, 7, 11]).map((r) => r.next)).toEqual([16])
  })
  it('correção aceita vírgula e espaços', () => {
    const ex = generateSequence(3, 1)
    expect(gradeAnswer(ex, ` ${ex.answer} `).verdict).toBe('correct')
    expect(gradeAnswer(ex, 'abc').verdict).toBe('incorrect')
  })
})

describe('dificuldade adaptativa', () => {
  const ok = { correct: true, hintsUsed: 0 }
  const bad = { correct: false, hintsUsed: 1 }
  it('mantém sem dados suficientes', () => {
    expect(decideLevel(2, [ok, ok]).action).toBe('hold')
  })
  it('sobe no máximo 1 nível', () => {
    const d = decideLevel(2, Array(6).fill(ok))
    expect(d).toMatchObject({ action: 'raise', level: 3 })
  })
  it('não passa do nível 5', () => {
    expect(decideLevel(5, Array(6).fill(ok)).level).toBe(5)
  })
  it('sugere revisão com erros e dicas frequentes', () => {
    expect(decideLevel(3, Array(6).fill(bad))).toMatchObject({ action: 'review', level: 2 })
  })
  it('depende de dicas, não de velocidade; limites configuráveis', () => {
    const hinted = Array(6).fill({ correct: true, hintsUsed: 1 })
    expect(decideLevel(2, hinted).action).toBe('review') // dependência frequente de dicas
    expect(decideLevel(2, hinted, { ...DEFAULT_ADAPTIVE, raiseMaxHintRate: 1 }).action).toBe('raise')
  })
})

describe('relógio de sessão', () => {
  const T0 = 1_000_000
  it('conta tempo ativo por timestamps', () => {
    const c = new SessionClock()
    c.start(T0)
    c.interact(T0 + 30_000)
    expect(c.snapshot(T0 + 40_000).activeMs).toBe(40_000)
  })
  it('avisa após 60s e pausa após mais 30s, creditando ativo até a pausa', () => {
    const c = new SessionClock()
    c.start(T0)
    c.tick(T0 + 61_000)
    expect(c.state).toBe('warning')
    c.tick(T0 + 200_000) // timer suspenso: chamada tardia
    expect(c.state).toBe('paused-idle')
    const s = c.snapshot(T0 + 200_000)
    expect(s.activeMs).toBe(90_000)
    expect(s.pausedMs).toBe(110_000)
  })
  it('interação durante o aviso cancela a pausa', () => {
    const c = new SessionClock()
    c.start(T0)
    c.tick(T0 + 61_000)
    c.interact(T0 + 70_000)
    expect(c.state).toBe('running')
    c.tick(T0 + 120_000)
    expect(c.state).toBe('running')
  })
  it('página oculta pausa; retomar só quando confirmado', () => {
    const c = new SessionClock()
    c.start(T0)
    c.setHidden(true, T0 + 10_000)
    expect(c.state).toBe('paused-hidden')
    expect(c.snapshot(T0 + 50_000).activeMs).toBe(10_000)
    c.resume(T0 + 50_000)
    expect(c.state).toBe('running')
  })
  it('pausa manual separa tempo pausado', () => {
    const c = new SessionClock()
    c.start(T0)
    c.interact(T0 + 5_000)
    c.pause(T0 + 10_000)
    const s = c.snapshot(T0 + 25_000)
    expect(s).toMatchObject({ activeMs: 10_000, pausedMs: 15_000, totalMs: 25_000 })
  })
})

import { periodKey, precisionSeries } from './metrics'

describe('séries por período', () => {
  it('chaves de semana, mês e trimestre', () => {
    const t = new Date(2026, 9, 28, 12).getTime() // qua 28/10/2026
    expect(periodKey(t, 'semana')).toBe('2026-10-26')
    expect(periodKey(t, 'mes')).toBe('2026-10')
    expect(periodKey(t, 'trimestre')).toBe('2026-T4')
  })
  it('série agrega por período e ignora avaliações', () => {
    const t1 = new Date(2026, 0, 5).getTime()
    const t2 = new Date(2026, 1, 5).getTime()
    const s = precisionSeries(
      [att({ at: t1 }), att({ at: t1, exerciseId: 'b', verdict: 'incorrect' }), att({ at: t2, exerciseId: 'c' }), att({ at: t2, kind: 'assessment', exerciseId: 'd' })],
      'mes',
    )
    expect(s).toEqual([
      { period: '2026-01', precision: 50, n: 2, independent: 50 },
      { period: '2026-02', precision: 100, n: 1, independent: 100 },
    ])
  })
})
