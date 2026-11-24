import { describe, expect, it } from 'vitest'
import { applyReview, dueReviews, isDue, ratingFor, retrievabilityNow, upcomingReviews, validReviewState, type ReviewState } from './review'

const DAY = 86_400_000
const T0 = Date.UTC(2026, 0, 1)

describe('ratingFor', () => {
  it('Good só com acerto na 1ª tentativa e sem dicas', () => {
    expect(ratingFor({ correct: true, hintsUsed: 0, attemptNumber: 1 })).toBe('good')
  })
  it('Hard se acertou com dica ou após nova tentativa', () => {
    expect(ratingFor({ correct: true, hintsUsed: 1, attemptNumber: 2 })).toBe('hard')
    expect(ratingFor({ correct: true, hintsUsed: 0, attemptNumber: 2 })).toBe('hard')
  })
  it('Again se errou ou abriu a explicação', () => {
    expect(ratingFor({ correct: false, hintsUsed: 3, attemptNumber: 4 })).toBe('again')
  })
})

describe('applyReview (FSRS via ts-fsrs)', () => {
  it('primeira revisão boa agenda para dias depois, nunca para minutos', () => {
    const r = applyReview('logica.sequencias', undefined, 'good', T0)
    expect(r.count).toBe(1)
    expect(r.learnedAt).toBe(T0)
    expect(r.card.due - T0).toBeGreaterThanOrEqual(DAY)
    expect(r.card.stability).toBeCloseTo(2.3065, 4) // w[2] documentado
  })
  it('estabilidade inicial segue os parâmetros documentados (again/hard/good)', () => {
    expect(applyReview('logica.padroes', undefined, 'again', T0).card.stability).toBeCloseTo(0.212, 3)
    expect(applyReview('logica.padroes', undefined, 'hard', T0).card.stability).toBeCloseTo(1.2931, 3)
  })
  it('é determinístico (sem fuzz)', () => {
    const a = applyReview('logica.deducao', undefined, 'good', T0)
    const b = applyReview('logica.deducao', undefined, 'good', T0)
    expect(a).toEqual(b)
  })
  it('revisar no prazo com acerto aumenta o intervalo; errar o reduz', () => {
    const first = applyReview('logica.sequencias', undefined, 'good', T0)
    const t1 = first.card.due
    const ok = applyReview('logica.sequencias', first, 'good', t1)
    const bad = applyReview('logica.sequencias', first, 'again', t1)
    expect(ok.card.due - t1).toBeGreaterThan(first.card.due - T0)
    expect(bad.card.due - t1).toBeLessThan(ok.card.due - t1)
    expect(ok.count).toBe(2)
    expect(ok.learnedAt).toBe(T0)
  })
  it('retrievability cai com o tempo e fica ~90% no vencimento', () => {
    const r = applyReview('logica.sequencias', undefined, 'good', T0)
    const atDue = retrievabilityNow(r, r.card.due)
    expect(atDue).toBeGreaterThan(0.85)
    expect(atDue).toBeLessThan(0.95)
    expect(retrievabilityNow(r, r.card.due + 30 * DAY)).toBeLessThan(atDue)
  })
  it('separa vencidas e futuras, e valida o formato persistido', () => {
    const a = applyReview('logica.sequencias', undefined, 'good', T0)
    const b = applyReview('logica.padroes', undefined, 'good', T0 + 20 * DAY)
    const now = T0 + 10 * DAY
    expect(isDue(a, now)).toBe(true)
    expect(dueReviews([a, b], now).map((x) => x.competency)).toEqual(['logica.sequencias'])
    expect(upcomingReviews([a, b], now).map((x) => x.competency)).toEqual(['logica.padroes'])
    expect(validReviewState(JSON.parse(JSON.stringify(a)) as ReviewState)).toBe(true)
    expect(validReviewState({ competency: 'x' })).toBe(false)
  })
})
