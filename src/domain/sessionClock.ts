export type ClockState = 'running' | 'warning' | 'paused-manual' | 'paused-idle' | 'paused-hidden' | 'stopped'

export interface ClockConfig {
  warnAfterMs: number
  pauseAfterWarnMs: number
}

export const DEFAULT_CLOCK: ClockConfig = { warnAfterMs: 60_000, pauseAfterWarnMs: 30_000 }

/**
 * Relógio de sessão baseado em timestamps (Date.now injetado), não em contagem de setInterval:
 * timers suspensos pelo navegador não distorcem o tempo. É uma máquina de estados pura e testável.
 *
 * Decisão: ao pausar por inatividade, o tempo ativo é creditado até o instante da pausa
 * (última interação + aviso + tolerância), pois o usuário pode estar raciocinando.
 */
export class SessionClock {
  state: ClockState = 'stopped'
  activeMs = 0
  pausedMs = 0
  private lastStamp = 0
  private lastInteraction = 0
  startedAt = 0

  private cfg: ClockConfig

  constructor(cfg: ClockConfig = DEFAULT_CLOCK) {
    this.cfg = cfg
  }

  static restore(snapshot: { activeMs: number; pausedMs: number; startedAt: number }, now: number, cfg?: ClockConfig) {
    const c = new SessionClock(cfg)
    c.activeMs = snapshot.activeMs
    c.pausedMs = snapshot.pausedMs
    c.startedAt = snapshot.startedAt
    c.state = 'paused-manual'
    c.lastStamp = now
    c.lastInteraction = now
    return c
  }

  start(now: number) {
    this.state = 'running'
    this.startedAt = now
    this.lastStamp = now
    this.lastInteraction = now
  }

  private advance(now: number) {
    const dt = Math.max(0, now - this.lastStamp)
    if (this.state === 'running' || this.state === 'warning') this.activeMs += dt
    else if (this.state !== 'stopped') this.pausedMs += dt
    this.lastStamp = now
  }

  private idleDeadlines() {
    const warnAt = this.lastInteraction + this.cfg.warnAfterMs
    return { warnAt, pauseAt: warnAt + this.cfg.pauseAfterWarnMs }
  }

  /** Chamar periodicamente e antes de qualquer leitura. Aplica retroativamente avisos/pausas vencidos. */
  tick(now: number) {
    if (this.state === 'running' || this.state === 'warning') {
      const { warnAt, pauseAt } = this.idleDeadlines()
      if (now >= pauseAt) {
        this.advance(pauseAt)
        this.state = 'paused-idle'
      } else if (now >= warnAt && this.state === 'running') {
        this.advance(warnAt)
        this.state = 'warning'
      }
    }
    this.advance(now)
  }

  /** Qualquer interação (clique, tecla, digitação) zera o contador de inatividade. */
  interact(now: number) {
    this.tick(now)
    if (this.state === 'warning') this.state = 'running'
    if (this.state === 'running') this.lastInteraction = now
  }

  pause(now: number) {
    this.tick(now)
    if (this.state === 'running' || this.state === 'warning') this.state = 'paused-manual'
  }

  /** Retomada: só efetiva quando o usuário confirma (a UI pergunta antes). */
  resume(now: number) {
    this.tick(now)
    if (this.state.startsWith('paused')) {
      this.state = 'running'
      this.lastInteraction = now
    }
  }

  /** Page Visibility API: página oculta pausa; ao voltar, a UI pergunta se deseja continuar. */
  setHidden(hidden: boolean, now: number) {
    this.tick(now)
    if (hidden && (this.state === 'running' || this.state === 'warning')) this.state = 'paused-hidden'
  }

  stop(now: number) {
    this.tick(now)
    this.state = 'stopped'
  }

  get isActive() {
    return this.state === 'running' || this.state === 'warning'
  }

  snapshot(now: number) {
    this.tick(now)
    return { activeMs: this.activeMs, pausedMs: this.pausedMs, totalMs: this.activeMs + this.pausedMs, startedAt: this.startedAt }
  }
}
