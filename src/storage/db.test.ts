import { beforeEach, describe, expect, it } from 'vitest'
import type { Attempt, SessionRecord } from '../domain/types'
import {
  addAttempt, allAttempts, allSessions, clearActive, eraseAllData, exportData, importData, loadActive,
  loadSettings, parseBackup, saveActive, saveSession, saveSettings, DEFAULT_SETTINGS,
} from './db'

const attempt = (o: Partial<Attempt> = {}): Attempt => ({
  sessionId: 's', exerciseId: 'e', competency: 'logica.sequencias', subcompetency: 'aritmetica', level: 2,
  kind: 'practice', answer: '5', verdict: 'correct', hintsUsed: 0, attemptNumber: 1, activeMs: 1200, at: 1, ...o,
})
const session: SessionRecord = { id: 's', kind: 'practice', plannedMinutes: 15, startedAt: 1, totalMs: 10, activeMs: 8, pausedMs: 2, finished: true }

beforeEach(async () => {
  await eraseAllData()
})

describe('persistência', () => {
  it('grava e relê tentativas e sessões (simula recarga ao reabrir o banco)', async () => {
    await addAttempt(attempt())
    await saveSession(session)
    const { closeDb } = await import('./db')
    await closeDb() // "recarregar a página"
    expect(await allAttempts()).toHaveLength(1)
    expect((await allSessions())[0]).toEqual(session)
  })
  it('configurações: padrões e persistência', async () => {
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS)
    await saveSettings({ ...DEFAULT_SETTINGS, sessionMinutes: 20 })
    expect((await loadSettings()).sessionMinutes).toBe(20)
  })
  it('sessão ativa pode ser salva, retomada e limpa', async () => {
    await saveActive({ id: 'current', session, clock: { activeMs: 5, pausedMs: 1, startedAt: 1 }, queue: ['a', 'b'], level: 2, savedAt: 9 })
    expect((await loadActive())?.queue).toEqual(['a', 'b'])
    await clearActive()
    expect(await loadActive()).toBeUndefined()
  })
  it('apagar tudo remove os dados', async () => {
    await addAttempt(attempt())
    await eraseAllData()
    expect(await allAttempts()).toHaveLength(0)
  })
})

describe('exportação e importação', () => {
  it('ida e volta preserva os dados', async () => {
    await addAttempt(attempt({ exerciseId: 'x1' }))
    await addAttempt(attempt({ exerciseId: 'x2', verdict: 'incorrect' }))
    await saveSession(session)
    const text = JSON.stringify(await exportData())
    await eraseAllData()
    const parsed = parseBackup(text)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) await importData(parsed.data)
    const back = await allAttempts()
    expect(back.map((a) => a.exerciseId)).toEqual(['x1', 'x2'])
    expect(await allSessions()).toHaveLength(1)
  })
  it.each([
    ['não-JSON', '{oops'],
    ['formato errado', JSON.stringify({ format: 'outro' })],
    ['versão futura', JSON.stringify({ format: 'neuro100-backup', version: 99 })],
    ['tentativa inválida', JSON.stringify({ format: 'neuro100-backup', version: 1, attempts: [{ foo: 1 }], sessions: [], assessments: [], settings: {} })],
  ])('rejeita %s sem gravar nada', async (_n, text) => {
    await addAttempt(attempt())
    expect(parseBackup(text).ok).toBe(false)
    expect(await allAttempts()).toHaveLength(1)
  })
})
