export type Competency =
  | 'logica.sequencias'
  | 'logica.padroes'
  | 'logica.classificacao'
  | 'logica.deducao'
  | 'logica.contradicao'
  | 'matematica.basica'
  | 'memoria.trabalho'
  | 'verbal.compreensao'
  | 'problemas.resolucao'
  | 'explicacao.raciocinio'

export type Level = 1 | 2 | 3 | 4 | 5

export interface Exercise {
  id: string
  competency: Competency
  subcompetency: string
  level: Level
  prompt: string
  options?: string[]
  /** resposta esperada (normalizada na correção) */
  answer: string
  /** respostas alternativas válidas (outra regra lógica/matemática) */
  alternatives?: { answer: string; note: string }[]
  method: string
  hints: string[]
  explanation: string
  source: string
  estimatedSeconds: number
  grading: string
}

export type Verdict = 'correct' | 'valid-alternative' | 'incorrect'

export interface Attempt {
  id?: number
  sessionId: string
  exerciseId: string
  competency: Competency
  subcompetency: string
  level: Level
  kind: 'assessment' | 'practice' | 'review' | 'transfer'
  answer: string
  verdict: Verdict
  hintsUsed: number
  attemptNumber: number
  activeMs: number
  explanation?: string
  at: number
}

export interface SessionRecord {
  id: string
  kind: 'assessment' | 'practice'
  plannedMinutes: number
  startedAt: number
  endedAt?: number
  totalMs: number
  activeMs: number
  pausedMs: number
  finished: boolean
}

export interface AssessmentResult {
  id: string
  at: number
  byCompetency: Record<string, { correct: number; total: number }>
  activeMs: number
  isBaseline: boolean
  bankVersion: string
}

export interface AdaptiveConfig {
  windowSize: number
  raiseAccuracy: number
  raiseMaxHintRate: number
  lowerAccuracy: number
  lowerHintRate: number
}

export interface Settings {
  theme: 'claro' | 'escuro' | 'sistema'
  palette: 'indigo' | 'verde' | 'ambar'
  animations: boolean
  sessionMinutes: 5 | 10 | 15 | 20 | 30
  inactivityWarnSeconds: number
  inactivityPauseSeconds: number
  adaptive: AdaptiveConfig
}
