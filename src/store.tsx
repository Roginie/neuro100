import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AssessmentResult, Attempt, SessionRecord, Settings } from './domain/types'
import { allAssessments, allAttempts, allSessions, DEFAULT_SETTINGS, loadSettings, saveSettings } from './storage/db'

interface Data {
  ready: boolean
  settings: Settings
  attempts: Attempt[]
  sessions: SessionRecord[]
  assessments: AssessmentResult[]
  refresh: () => Promise<void>
  updateSettings: (s: Settings) => Promise<void>
}

const Ctx = createContext<Data | null>(null)

export function useData() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useData fora do provider')
  return v
}

function applyTheme(s: Settings) {
  const dark = s.theme === 'escuro' || (s.theme === 'sistema' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const el = document.documentElement
  el.dataset.theme = dark ? 'dark' : 'light'
  el.dataset.palette = s.palette
  el.classList.toggle('anim', s.animations)
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<Data, 'refresh' | 'updateSettings'>>({
    ready: false,
    settings: DEFAULT_SETTINGS,
    attempts: [],
    sessions: [],
    assessments: [],
  })

  const refresh = useCallback(async () => {
    const [settings, attempts, sessions, assessments] = await Promise.all([
      loadSettings(),
      allAttempts(),
      allSessions(),
      allAssessments(),
    ])
    applyTheme(settings)
    setState({ ready: true, settings, attempts, sessions, assessments })
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const on = () => applyTheme(state.settings)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [state.settings])

  const updateSettings = useCallback(
    async (s: Settings) => {
      await saveSettings(s)
      await refresh()
    },
    [refresh],
  )

  return <Ctx.Provider value={{ ...state, refresh, updateSettings }}>{children}</Ctx.Provider>
}
