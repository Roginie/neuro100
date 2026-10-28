import type { Attempt } from './types'

export interface Ratio {
  value: number | null // 0-100
  num: number
  den: number
  lowReliability: boolean
}

/** Mínimo de itens para não exibir aviso de baixa confiabilidade.
 *  Hipótese de implementação (não é parâmetro científico). */
export const MIN_SAMPLE = 10

function ratio(num: number, den: number, minSample = MIN_SAMPLE): Ratio {
  return { value: den === 0 ? null : (num / den) * 100, num, den, lowReliability: den < minSample }
}

const isCorrect = (a: Attempt) => a.verdict !== 'incorrect'

/** Último registro de cada (sessão, exercício): representa a conclusão do exercício. */
export function finalAttempts(attempts: Attempt[]): Attempt[] {
  const map = new Map<string, Attempt>()
  for (const a of attempts) {
    const key = `${a.sessionId}|${a.exerciseId}`
    const prev = map.get(key)
    if (!prev || a.attemptNumber >= prev.attemptNumber) map.set(key, a)
  }
  return [...map.values()]
}

/** Precisão = corretas / respostas válidas × 100 (alternativas válidas contam como corretas). */
export function precision(attempts: Attempt[], minSample = MIN_SAMPLE): Ratio {
  return ratio(attempts.filter(isCorrect).length, attempts.length, minSample)
}

/** Resolução independente = corretos sem dicas / exercícios concluídos × 100. */
export function independentResolution(attempts: Attempt[], minSample = MIN_SAMPLE): Ratio {
  const finished = finalAttempts(attempts)
  const ok = finished.filter((a) => isCorrect(a) && a.hintsUsed === 0 && a.attemptNumber === 1).length
  return ratio(ok, finished.length, minSample)
}

/** Retenção observada = revisões corretas sem consulta / total de revisões válidas × 100. */
export function retention(attempts: Attempt[], minSample = MIN_SAMPLE): Ratio {
  const reviews = attempts.filter((a) => a.kind === 'review')
  const ok = reviews.filter((a) => isCorrect(a) && a.hintsUsed === 0).length
  return ratio(ok, reviews.length, minSample)
}

/** Transferência (indicador separado): acertos em exercícios de transferência. */
export function transfer(attempts: Attempt[], minSample = MIN_SAMPLE): Ratio {
  const t = attempts.filter((a) => a.kind === 'transfer')
  return ratio(t.filter(isCorrect).length, t.length, minSample)
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const s = [...values].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Mediana do tempo ativo por categoria × nível (não mistura dificuldades). */
export function medianTimeByCategoryLevel(attempts: Attempt[]): Record<string, number> {
  const groups = new Map<string, number[]>()
  for (const a of finalAttempts(attempts)) {
    const k = `${a.competency}|N${a.level}`
    groups.set(k, [...(groups.get(k) ?? []), a.activeMs])
  }
  const out: Record<string, number> = {}
  for (const [k, v] of groups) out[k] = median(v)!
  return out
}

export interface Evolution {
  before: number
  after: number
  absolute: number
  percent: number | null
  questionsBefore: number
  questionsAfter: number
  lowReliability: boolean
}

/** Compara duas avaliações equivalentes. Diferença percentual só existe se a base > 0. */
export function evolution(
  before: { correct: number; total: number },
  after: { correct: number; total: number },
  minSample = MIN_SAMPLE,
): Evolution | null {
  if (before.total === 0 || after.total === 0) return null
  const b = (before.correct / before.total) * 100
  const a = (after.correct / after.total) * 100
  return {
    before: b,
    after: a,
    absolute: a - b,
    percent: b > 0 ? ((a - b) / b) * 100 : null,
    questionsBefore: before.total,
    questionsAfter: after.total,
    lowReliability: before.total < minSample || after.total < minSample,
  }
}

export interface MasteryCriteria {
  minNovelExercises: number
  minAccuracy: number // 0-100
  minLevel: number
  minDelayedReviewsCorrect: number
  minDaysBetween: number
}

/** Critérios padrão: HIPÓTESE DE IMPLEMENTAÇÃO, configuráveis; não são limiares validados. */
export const DEFAULT_MASTERY: MasteryCriteria = {
  minNovelExercises: 8,
  minAccuracy: 80,
  minLevel: 3,
  minDelayedReviewsCorrect: 2,
  minDaysBetween: 7,
}

export interface MasteryStatus {
  mastered: boolean
  progress: number // 0-100
  checks: { label: string; ok: boolean; detail: string }[]
}

/** Domínio exige exercícios novos sem dica E revisões corretas após um intervalo. */
export function competencyMastery(
  attempts: Attempt[],
  criteria: MasteryCriteria = DEFAULT_MASTERY,
): MasteryStatus {
  const practice = finalAttempts(attempts.filter((a) => a.kind === 'practice' || a.kind === 'transfer'))
  const atLevel = practice.filter((a) => a.level >= criteria.minLevel)
  const good = atLevel.filter((a) => isCorrect(a) && a.hintsUsed === 0).length
  const acc = atLevel.length ? (good / atLevel.length) * 100 : 0
  const firstPractice = practice.length ? Math.min(...practice.map((a) => a.at)) : Infinity
  const delayed = attempts.filter(
    (a) =>
      a.kind === 'review' &&
      isCorrect(a) &&
      a.hintsUsed === 0 &&
      a.at - firstPractice >= criteria.minDaysBetween * 86_400_000,
  ).length
  const enough = atLevel.length >= criteria.minNovelExercises
  const checks = [
    {
      label: `Exercícios novos no nível ≥ ${criteria.minLevel}`,
      ok: enough,
      detail: `${atLevel.length}/${criteria.minNovelExercises}`,
    },
    {
      label: `Precisão sem dicas ≥ ${criteria.minAccuracy}%`,
      ok: enough && acc >= criteria.minAccuracy,
      detail: `${acc.toFixed(0)}%`,
    },
    {
      label: `Revisões corretas após ≥ ${criteria.minDaysBetween} dias`,
      ok: delayed >= criteria.minDelayedReviewsCorrect,
      detail: `${delayed}/${criteria.minDelayedReviewsCorrect}`,
    },
  ]
  const progress =
    ((Math.min(1, atLevel.length / criteria.minNovelExercises) +
      Math.min(1, acc / criteria.minAccuracy) +
      Math.min(1, delayed / criteria.minDelayedReviewsCorrect)) /
      3) *
    100
  return { mastered: checks.every((c) => c.ok), progress, checks }
}

export type Period = 'semana' | 'mes' | 'trimestre'

/** Chave do período (fuso local). Semana = data da segunda-feira. */
export function periodKey(ts: number, p: Period): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = d.getMonth()
  if (p === 'mes') return `${y}-${String(m + 1).padStart(2, '0')}`
  if (p === 'trimestre') return `${y}-T${Math.floor(m / 3) + 1}`
  const monday = new Date(y, m, d.getDate() - ((d.getDay() + 6) % 7))
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
}

export interface SeriesPoint {
  period: string
  precision: number | null
  n: number
  independent: number | null
}

/** Série histórica de precisão e resolução independente por período (apenas treino/transferência). */
export function precisionSeries(attempts: Attempt[], p: Period): SeriesPoint[] {
  const groups = new Map<string, Attempt[]>()
  for (const a of attempts.filter((x) => x.kind === 'practice' || x.kind === 'transfer')) {
    const k = periodKey(a.at, p)
    groups.set(k, [...(groups.get(k) ?? []), a])
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, list]) => {
      const fin = finalAttempts(list)
      return { period, precision: precision(fin).value, n: fin.length, independent: independentResolution(list).value }
    })
}
