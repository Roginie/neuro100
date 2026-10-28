import { deleteDB, openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { DEFAULT_ADAPTIVE } from '../domain/adaptive'
import type { AssessmentResult, Attempt, SessionRecord, Settings } from '../domain/types'

export const DB_NAME = 'neuro100'
export const DB_VERSION = 1
export const EXPORT_FORMAT = 'neuro100-backup'
export const EXPORT_VERSION = 1

export const DEFAULT_SETTINGS: Settings = {
  theme: 'sistema',
  palette: 'indigo',
  animations: true,
  sessionMinutes: 15,
  inactivityWarnSeconds: 60,
  inactivityPauseSeconds: 30,
  adaptive: DEFAULT_ADAPTIVE,
}

/** Sessão em andamento (permite interromper e retomar sem perder progresso). */
export interface ActiveSessionState {
  id: 'current'
  session: SessionRecord
  clock: { activeMs: number; pausedMs: number; startedAt: number }
  queue: string[] // ids de exercícios ainda não concluídos (avaliação)
  meta?: Record<string, unknown> // estado do modo adaptativo (níveis, janelas, semente)
  level: number
  savedAt: number
}

interface Schema extends DBSchema {
  attempts: { key: number; value: Attempt; indexes: { 'by-session': string; 'by-competency': string } }
  sessions: { key: string; value: SessionRecord }
  assessments: { key: string; value: AssessmentResult }
  settings: { key: string; value: Settings & { id: 'settings' } }
  active: { key: string; value: ActiveSessionState }
}

let dbp: Promise<IDBPDatabase<Schema>> | null = null

export function getDb() {
  dbp ??= openDB<Schema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const att = db.createObjectStore('attempts', { keyPath: 'id', autoIncrement: true })
      att.createIndex('by-session', 'sessionId')
      att.createIndex('by-competency', 'competency')
      db.createObjectStore('sessions', { keyPath: 'id' })
      db.createObjectStore('assessments', { keyPath: 'id' })
      db.createObjectStore('settings', { keyPath: 'id' })
      db.createObjectStore('active', { keyPath: 'id' })
    },
  })
  return dbp
}

export async function closeDb() {
  if (dbp) (await dbp).close()
  dbp = null
}

export async function addAttempt(a: Attempt) {
  return (await getDb()).add('attempts', a)
}
export async function allAttempts() {
  return (await getDb()).getAll('attempts')
}
export async function saveSession(s: SessionRecord) {
  await (await getDb()).put('sessions', s)
}
export async function allSessions() {
  return (await getDb()).getAll('sessions')
}
export async function saveAssessment(a: AssessmentResult) {
  await (await getDb()).put('assessments', a)
}
export async function allAssessments() {
  return (await getDb()).getAll('assessments')
}
export async function loadSettings(): Promise<Settings> {
  const s = await (await getDb()).get('settings', 'settings')
  if (!s) return DEFAULT_SETTINGS
  const { id: _id, ...rest } = s
  return { ...DEFAULT_SETTINGS, ...rest, adaptive: { ...DEFAULT_ADAPTIVE, ...rest.adaptive } }
}
export async function saveSettings(s: Settings) {
  await (await getDb()).put('settings', { ...s, id: 'settings' })
}
export async function saveActive(s: ActiveSessionState) {
  await (await getDb()).put('active', s)
}
export async function loadActive() {
  return (await getDb()).get('active', 'current')
}
export async function clearActive() {
  await (await getDb()).delete('active', 'current')
}

export async function eraseAllData() {
  await closeDb()
  await deleteDB(DB_NAME)
}

// ---------- exportação / importação ----------

export interface BackupFile {
  format: typeof EXPORT_FORMAT
  version: number
  exportedAt: number
  attempts: Attempt[]
  sessions: SessionRecord[]
  assessments: AssessmentResult[]
  settings: Settings
}

export async function exportData(now = Date.now()): Promise<BackupFile> {
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: now,
    attempts: await allAttempts(),
    sessions: await allSessions(),
    assessments: await allAssessments(),
    settings: await loadSettings(),
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const VERDICTS = ['correct', 'valid-alternative', 'incorrect']
const KINDS = ['assessment', 'practice', 'review', 'transfer']

function validAttempt(a: unknown): a is Attempt {
  return (
    isObj(a) &&
    typeof a.sessionId === 'string' &&
    typeof a.exerciseId === 'string' &&
    typeof a.competency === 'string' &&
    typeof a.level === 'number' &&
    a.level >= 1 &&
    a.level <= 5 &&
    KINDS.includes(a.kind as string) &&
    VERDICTS.includes(a.verdict as string) &&
    typeof a.hintsUsed === 'number' &&
    typeof a.attemptNumber === 'number' &&
    typeof a.activeMs === 'number' &&
    a.activeMs >= 0 &&
    typeof a.at === 'number'
  )
}
const validSession = (s: unknown): s is SessionRecord =>
  isObj(s) && typeof s.id === 'string' && typeof s.startedAt === 'number' && typeof s.activeMs === 'number' && typeof s.totalMs === 'number'
const validAssessment = (s: unknown): s is AssessmentResult =>
  isObj(s) && typeof s.id === 'string' && typeof s.at === 'number' && isObj(s.byCompetency)

export type ParseResult = { ok: true; data: BackupFile } | { ok: false; error: string }

/** Valida um arquivo importado; nada é gravado se qualquer parte for inválida. */
export function parseBackup(text: string): ParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'O arquivo não é um JSON válido.' }
  }
  if (!isObj(raw) || raw.format !== EXPORT_FORMAT) return { ok: false, error: 'Arquivo não reconhecido como backup do NEURO100.' }
  if (typeof raw.version !== 'number' || raw.version > EXPORT_VERSION)
    return { ok: false, error: 'Versão do backup não suportada por esta versão do app.' }
  for (const k of ['attempts', 'sessions', 'assessments'] as const) {
    if (!Array.isArray(raw[k])) return { ok: false, error: `Campo ausente ou inválido: ${k}.` }
  }
  if (!(raw.attempts as unknown[]).every(validAttempt)) return { ok: false, error: 'Há tentativas com dados inválidos.' }
  if (!(raw.sessions as unknown[]).every(validSession)) return { ok: false, error: 'Há sessões com dados inválidos.' }
  if (!(raw.assessments as unknown[]).every(validAssessment)) return { ok: false, error: 'Há avaliações com dados inválidos.' }
  if (!isObj(raw.settings)) return { ok: false, error: 'Configurações ausentes.' }
  return { ok: true, data: raw as unknown as BackupFile }
}

/** Substitui todos os dados locais pelo conteúdo do backup (atômico por transação). */
export async function importData(data: BackupFile) {
  const db = await getDb()
  const tx = db.transaction(['attempts', 'sessions', 'assessments', 'settings', 'active'], 'readwrite')
  await Promise.all([
    tx.objectStore('attempts').clear(),
    tx.objectStore('sessions').clear(),
    tx.objectStore('assessments').clear(),
    tx.objectStore('active').clear(),
  ])
  for (const a of data.attempts) {
    const { id: _id, ...rest } = a
    await tx.objectStore('attempts').add(rest as Attempt)
  }
  for (const s of data.sessions) await tx.objectStore('sessions').put(s)
  for (const s of data.assessments) await tx.objectStore('assessments').put(s)
  await tx.objectStore('settings').put({ ...DEFAULT_SETTINGS, ...data.settings, id: 'settings' })
  await tx.done
}
