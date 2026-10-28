import { describe, expect, it } from 'vitest'
import { assessmentItems, generateMath, handItems } from './bank'
import { gradeAnswer } from './sequences'
import type { Level } from './types'

describe('banco de exercícios', () => {
  it('formas A e B têm mesma estrutura (competência e nível por posição)', () => {
    const a = assessmentItems('A'), b = assessmentItems('B')
    expect(a.length).toBe(b.length)
    a.forEach((x, i) => {
      expect(x.competency).toBe(b[i].competency)
      expect(x.level).toBe(b[i].level)
    })
  })
  it('formas A e B não repetem enunciados', () => {
    const key = (x: { prompt: string; options?: string[] }) => x.prompt + '|' + (x.options ?? []).join('/')
    const a = new Set(assessmentItems('A').map(key))
    for (const x of assessmentItems('B')) expect(a.has(key(x))).toBe(false)
  })
  it('ids únicos e campos obrigatórios presentes', () => {
    const all = [...assessmentItems('A'), ...assessmentItems('B'), ...handItems()]
    const ids = new Set<string>()
    for (const e of all) {
      ids.add(e.id)
      expect(e.hints.length).toBe(4)
      expect(e.answer).not.toBe('')
      expect(e.explanation.length).toBeGreaterThan(10)
      if (e.options) expect(e.options).toContain(e.answer)
    }
    expect(ids.size).toBe(new Set(all.map((e) => e.id)).size)
  })
  it('resposta esperada é aceita pela correção', () => {
    for (const e of assessmentItems('A')) expect(gradeAnswer(e, e.answer).verdict).toBe('correct')
  })
  it('matemática gerada confere com recálculo independente', () => {
    for (const level of [1, 2, 3, 4] as Level[]) {
      for (let seed = 1; seed <= 100; seed++) {
        const e = generateMath(seed, level)
        const nums = e.prompt.match(/\d+/g)!.map(Number)
        let expected: number
        if (e.subcompetency === 'soma') expected = nums[0] + nums[1] - nums[2]
        else if (e.subcompetency === 'porcentagem') expected = (nums[0] * nums[1]) / 100
        else if (e.subcompetency === 'proporcao') expected = (nums[1] / nums[0]) * nums[2]
        else expected = (nums[1] * nums[2]) / nums[0] ? (nums[2] / nums[1]) * nums[0] : NaN
        expect(Number(e.answer)).toBeCloseTo(expected)
      }
    }
  })
})
