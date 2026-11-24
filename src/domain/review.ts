import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type Grade } from 'ts-fsrs'
import type { Competency } from './types'

/**
 * Revisão espaçada por competência, usando a implementação de referência do FSRS (`ts-fsrs`,
 * pacote oficial open-spaced-repetition). Os 21 parâmetros padrão vêm do pacote e foram
 * conferidos com a documentação (awesome-fsrs wiki, "The Algorithm", FSRS-6). Nada aqui é de memória.
 *
 * ADAPTAÇÃO (hipótese de implementação, não validada): o FSRS modela a memória de itens individuais.
 * Aqui o "cartão" é uma COMPETÊNCIA e cada exercício concluído é uma "revisão" dela. Os exercícios
 * gerados mudam a cada vez, então o que se agenda é a prática da habilidade, não a lembrança de um item.
 * Os parâmetros padrão não foram otimizados com os dados desta usuária.
 */
export const REVIEW_CONFIG = {
  /** probabilidade-alvo de acerto no momento da revisão (padrão do FSRS) */
  requestRetention: 0.9,
  /** sem aleatorização, para que o agendamento seja reproduzível e testável */
  enableFuzz: false,
  /** sem passos de aprendizagem em minutos: o menor intervalo é de 1 dia (ver ARCHITECTURE.md) */
  enableShortTerm: false,
}

const scheduler = fsrs(
  generatorParameters({
    request_retention: REVIEW_CONFIG.requestRetention,
    enable_fuzz: REVIEW_CONFIG.enableFuzz,
    enable_short_term: REVIEW_CONFIG.enableShortTerm,
  }),
)

export type ReviewRating = 'again' | 'hard' | 'good'

/** Cartão persistido: datas como timestamps (IndexedDB e JSON de backup). */
export type StoredCard = Omit<Card, 'due' | 'last_review'> & { due: number; last_review?: number }

export interface ReviewState {
  /** chave: uma competência */
  competency: Competency
  card: StoredCard
  /** nº de exercícios que já atualizaram este cartão */
  count: number
  learnedAt: number
  lastReviewedAt: number
  lastRating: ReviewRating
}

const RATING: Record<ReviewRating, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
}

/**
 * Converte o desfecho de um exercício em nota. Regra (hipótese de implementação):
 * - Good: acertou na 1ª tentativa e sem dicas;
 * - Hard: acertou, mas precisou de dica ou de nova tentativa;
 * - Again: errou ou abriu a explicação completa.
 * "Easy" nunca é atribuído automaticamente: não há autoavaliação confiável para isso.
 */
export function ratingFor(outcome: { correct: boolean; hintsUsed: number; attemptNumber: number }): ReviewRating {
  if (!outcome.correct) return 'again'
  return outcome.hintsUsed === 0 && outcome.attemptNumber === 1 ? 'good' : 'hard'
}

const toCard = (c: StoredCard): Card => ({
  ...c,
  due: new Date(c.due),
  last_review: c.last_review === undefined ? undefined : new Date(c.last_review),
})
const toStored = (c: Card): StoredCard => ({
  ...c,
  due: c.due.getTime(),
  last_review: c.last_review ? c.last_review.getTime() : undefined,
})

/** Aplica uma revisão e devolve o novo estado (função pura). */
export function applyReview(
  competency: Competency,
  prev: ReviewState | undefined,
  rating: ReviewRating,
  now: number,
): ReviewState {
  const card = prev ? toCard(prev.card) : createEmptyCard(new Date(now))
  const { card: next } = scheduler.next(card, new Date(now), RATING[rating])
  return {
    competency,
    card: toStored(next),
    count: (prev?.count ?? 0) + 1,
    learnedAt: prev?.learnedAt ?? now,
    lastReviewedAt: now,
    lastRating: rating,
  }
}

/** Probabilidade estimada de acerto agora, de 0 a 1 (curva de esquecimento do FSRS). */
export function retrievabilityNow(r: ReviewState, now: number): number {
  if (r.card.state === State.New) return 0
  return scheduler.retrievability(toCard(r.card), new Date(now))
}

export const isDue = (r: ReviewState, now: number) => r.card.due <= now

export function dueReviews(all: ReviewState[], now: number): ReviewState[] {
  return all.filter((r) => isDue(r, now)).sort((a, b) => a.card.due - b.card.due)
}

export function upcomingReviews(all: ReviewState[], now: number): ReviewState[] {
  return all.filter((r) => !isDue(r, now)).sort((a, b) => a.card.due - b.card.due)
}

/** Estrutura mínima para validar importação de um cartão. */
export function validReviewState(v: unknown): v is ReviewState {
  if (typeof v !== 'object' || v === null) return false
  const r = v as Record<string, unknown>
  const c = r.card as Record<string, unknown> | undefined
  return (
    typeof r.competency === 'string' &&
    typeof r.count === 'number' &&
    typeof r.learnedAt === 'number' &&
    typeof r.lastReviewedAt === 'number' &&
    ['again', 'hard', 'good'].includes(r.lastRating as string) &&
    typeof c === 'object' &&
    c !== null &&
    typeof c.due === 'number' &&
    typeof c.stability === 'number' &&
    typeof c.difficulty === 'number' &&
    typeof c.state === 'number'
  )
}
