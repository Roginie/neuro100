import type { AdaptiveConfig, Level } from './types'

/** Limiares iniciais: HIPÓTESE DE IMPLEMENTAÇÃO (não vêm de estudo). Configuráveis em Configurações. */
export const DEFAULT_ADAPTIVE: AdaptiveConfig = {
  windowSize: 6,
  raiseAccuracy: 0.85,
  raiseMaxHintRate: 0.2,
  lowerAccuracy: 0.5,
  lowerHintRate: 0.6,
}

export interface Outcome {
  correct: boolean
  hintsUsed: number
  explained?: boolean
}

export type Decision =
  | { action: 'raise'; level: Level; reason: string }
  | { action: 'hold'; level: Level; reason: string }
  | { action: 'review'; level: Level; reason: string }

const clamp = (n: number): Level => Math.max(1, Math.min(5, n)) as Level

/**
 * Regras transparentes. Velocidade NÃO entra na decisão.
 * Proteções: janela mínima, aumento de no máximo 1 nível por decisão,
 * e a janela é "consumida" pelo chamador após qualquer mudança de nível.
 */
export function decideLevel(level: Level, recent: Outcome[], cfg: AdaptiveConfig = DEFAULT_ADAPTIVE): Decision {
  if (recent.length < cfg.windowSize) {
    return { action: 'hold', level, reason: `Poucos dados no nível atual (${recent.length}/${cfg.windowSize}).` }
  }
  const w = recent.slice(-cfg.windowSize)
  const acc = w.filter((o) => o.correct).length / w.length
  const hintRate = w.filter((o) => o.hintsUsed > 0).length / w.length
  if (acc >= cfg.raiseAccuracy && hintRate <= cfg.raiseMaxHintRate) {
    if (level === 5) return { action: 'hold', level, reason: 'Nível máximo atingido.' }
    return { action: 'raise', level: clamp(level + 1), reason: `Precisão ${pct(acc)} com ${pct(hintRate)} de uso de dicas.` }
  }
  if (acc < cfg.lowerAccuracy || hintRate >= cfg.lowerHintRate) {
    return {
      action: 'review',
      level: clamp(level - 1),
      reason: `Precisão ${pct(acc)} / dicas em ${pct(hintRate)} dos exercícios: vale revisar os conceitos antes de avançar.`,
    }
  }
  return { action: 'hold', level, reason: 'Desempenho intermediário: manter o nível.' }
}

const pct = (x: number) => `${Math.round(x * 100)}%`
