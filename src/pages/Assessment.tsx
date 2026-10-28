import { useEffect, useState } from 'react'
import { assessmentItems, findExerciseById, type Form } from '../domain/bank'
import type { Exercise } from '../domain/types'
import { loadActive, type ActiveSessionState } from '../storage/db'
import { useData } from '../store'
import SessionRunner from '../ui/SessionRunner'

export default function Assessment() {
  const { assessments, ready } = useData()
  const [resume, setResume] = useState<ActiveSessionState | null | undefined>(undefined)
  useEffect(() => {
    void loadActive().then((a) => setResume(a && a.session.kind === 'assessment' ? a : null))
  }, [])
  if (!ready || resume === undefined) return <p>Carregando…</p>

  // Forma A na linha de base; depois alterna B/A para reduzir memorização dos itens.
  const form: Form = assessments.length % 2 === 0 ? 'A' : 'B'
  const items: Exercise[] = resume
    ? resume.queue.map((id) => findExerciseById(id)).filter((e): e is Exercise => !!e)
    : assessmentItems(form)
  return <SessionRunner mode={{ type: 'assessment', items }} resume={resume ?? undefined} />
}
