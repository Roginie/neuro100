import type { Exercise, Level, Verdict } from './types'

/** PRNG determinístico (mulberry32): mesma semente → mesmo exercício (reprodutível e testável). */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const int = (r: () => number, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1))

/** Regras candidatas: cada uma, dados os termos mostrados, devolve o próximo termo ou null se não se ajusta. */
export interface FittedRule {
  name: string
  next: number
  description: string
}

function diffs(t: number[]) {
  return t.slice(1).map((v, i) => v - t[i])
}

/** Solver independente do gerador: descobre quais regras simples explicam os termos. */
export function fittingRules(terms: number[]): FittedRule[] {
  const out: FittedRule[] = []
  const n = terms.length
  // polinomial por diferenças finitas (ordem 1 e 2), exigindo ao menos 2 verificações
  const d1 = diffs(terms)
  if (n >= 3 && d1.every((d) => d === d1[0])) {
    out.push({ name: 'aritmética', next: terms[n - 1] + d1[0], description: `soma constante de ${d1[0]}` })
  }
  const d2 = diffs(d1)
  if (n >= 4 && d2.every((d) => d === d2[0]) && d2[0] !== 0) {
    out.push({
      name: 'diferenças crescentes',
      next: terms[n - 1] + d1[d1.length - 1] + d2[0],
      description: `as diferenças entre termos aumentam ${d2[0]} a cada passo (${d1.join(', ')}…)`,
    })
  }
  // geométrica
  if (n >= 3 && terms[0] !== 0 && terms.every((v) => v !== 0)) {
    const q = terms[1] / terms[0]
    if (terms.slice(1).every((v, i) => v === terms[i] * q) && q !== 1) {
      out.push({ name: 'geométrica', next: terms[n - 1] * q, description: `multiplicação constante por ${q}` })
    }
  }
  // fibonacci-like
  if (n >= 4 && terms.slice(2).every((v, i) => v === terms[i] + terms[i + 1])) {
    out.push({ name: 'soma dos dois anteriores', next: terms[n - 1] + terms[n - 2], description: 'cada termo é a soma dos dois anteriores' })
  }
  // alternada +a / -b
  if (n >= 5) {
    const odd = d1.filter((_, i) => i % 2 === 0)
    const even = d1.filter((_, i) => i % 2 === 1)
    if (odd.every((d) => d === odd[0]) && even.every((d) => d === even[0]) && odd[0] !== even[0]) {
      const nextDiff = d1.length % 2 === 0 ? odd[0] : even[0]
      out.push({ name: 'alternada', next: terms[n - 1] + nextDiff, description: `alterna ${odd[0] >= 0 ? '+' : ''}${odd[0]} e ${even[0] >= 0 ? '+' : ''}${even[0]}` })
    }
  }
  return out
}

type Kind = 'aritmetica' | 'geometrica' | 'diferencas' | 'alternada' | 'fibonacci'

const KINDS_BY_LEVEL: Record<Level, Kind[]> = {
  1: ['aritmetica'],
  2: ['aritmetica', 'geometrica'],
  3: ['diferencas', 'alternada'],
  4: ['fibonacci', 'diferencas', 'geometrica'],
  5: ['diferencas', 'fibonacci', 'alternada'],
}

function build(kind: Kind, r: () => number, level: Level): { shown: number[]; answer: number; rule: string } | null {
  const count = kind === 'diferencas' || kind === 'alternada' ? 6 : kind === 'fibonacci' ? 7 : 5
  const t: number[] = []
  let rule = ''
  switch (kind) {
    case 'aritmetica': {
      const a = int(r, 1, 10 * level)
      const d = int(r, 2, 3 + 2 * level) * (level >= 3 && r() < 0.4 ? -1 : 1)
      for (let i = 0; i <= count; i++) t.push(a + d * i)
      rule = `soma constante de ${d}`
      break
    }
    case 'geometrica': {
      const a = int(r, 1, 4)
      const q = int(r, 2, level >= 4 ? 4 : 3)
      for (let i = 0; i <= count; i++) t.push(a * q ** i)
      rule = `multiplicação constante por ${q}`
      break
    }
    case 'diferencas': {
      const a = int(r, 1, 8)
      const d = int(r, 1, 5)
      const k = int(r, 1, level >= 5 ? 4 : 3)
      let diff = d
      t.push(a)
      for (let i = 0; i < count; i++) {
        t.push(t[t.length - 1] + diff)
        diff += k
      }
      rule = `as diferenças começam em ${d} e aumentam ${k} a cada passo`
      break
    }
    case 'alternada': {
      const a = int(r, 5, 20)
      const p = int(r, 2, 9)
      const m = int(r, 1, p - 1)
      t.push(a)
      for (let i = 0; i < count; i++) t.push(t[t.length - 1] + (i % 2 === 0 ? p : -m))
      rule = `alterna +${p} e -${m}`
      break
    }
    case 'fibonacci': {
      const a = int(r, 1, 5)
      const b = int(r, 1, 6)
      t.push(a, b)
      for (let i = 2; i <= count; i++) t.push(t[i - 1] + t[i - 2])
      rule = 'cada termo é a soma dos dois anteriores'
      break
    }
  }
  const shown = t.slice(0, -1)
  const answer = t[t.length - 1]
  return { shown, answer, rule }
}

const HINT_BY_KIND: Record<Kind, string[]> = {
  aritmetica: [
    'Quanto muda de um número para o seguinte? Calcule a diferença entre o 1º e o 2º, e entre o 2º e o 3º.',
    'Se as diferenças são sempre iguais, a regra é uma soma (ou subtração) constante.',
    'Exemplo semelhante: 3, 7, 11, 15, ? → diferença 4 → próximo é 19.',
    'Aplique a mesma diferença ao último número da sequência.',
  ],
  geometrica: [
    'Compare os números por divisão: quanto vale o 2º dividido pelo 1º? E o 3º pelo 2º?',
    'Se o resultado da divisão é sempre o mesmo, cada termo é o anterior multiplicado por esse valor.',
    'Exemplo semelhante: 2, 6, 18, 54, ? → ×3 → próximo é 162.',
    'Multiplique o último número pelo fator que você encontrou.',
  ],
  diferencas: [
    'Calcule quanto aumenta de cada número para o seguinte. Esses aumentos são iguais?',
    'Se não são iguais, olhe para os próprios aumentos: eles seguem um padrão?',
    'Exemplo semelhante: 1, 3, 6, 10, ? → aumentos 2, 3, 4 → o próximo aumento é 5 → 15.',
    'Descubra o próximo aumento e some ao último número.',
  ],
  alternada: [
    'Calcule a diferença entre termos consecutivos. Os sinais ou valores se repetem de dois em dois?',
    'Duas operações podem se alternar: uma soma, depois uma subtração.',
    'Exemplo semelhante: 10, 15, 12, 17, 14, ? → +5, −3, +5, −3 → próximo é 19.',
    'Veja qual operação vem agora na alternância.',
  ],
  fibonacci: [
    'Tente relacionar cada número com os dois anteriores. Some os dois primeiros: o que dá?',
    'Se a soma de dois termos seguidos dá o próximo, a regra usa os dois anteriores.',
    'Exemplo semelhante: 2, 3, 5, 8, 13, ? → 8 + 13 = 21.',
    'Some os dois últimos números da sequência.',
  ],
}

/** Gera exercício de sequência numérica validado: o solver independente deve reconhecer a resposta esperada. */
export function generateSequence(seed: number, level: Level): Exercise {
  for (let attempt = 0; attempt < 50; attempt++) {
    const r = rng(seed * 1009 + attempt)
    const kinds = KINDS_BY_LEVEL[level]
    const kind = kinds[int(r, 0, kinds.length - 1)]
    const b = build(kind, r, level)
    if (!b) continue
    const fits = fittingRules(b.shown)
    if (!fits.some((f) => f.next === b.answer)) continue // validação: regra pretendida reconhecida
    if (b.shown.some((v) => Math.abs(v) > 5000)) continue
    const alternatives = fits
      .filter((f) => f.next !== b.answer)
      .map((f) => ({ answer: String(f.next), note: `Regra alternativa válida: ${f.description}.` }))
    return {
      id: `seq-${level}-${seed}`,
      competency: 'logica.sequencias',
      subcompetency: kind,
      level,
      prompt: `Qual é o próximo número da sequência?\n${b.shown.join(', ')}, ?`,
      answer: String(b.answer),
      alternatives: alternatives.length ? alternatives : undefined,
      method: b.rule,
      hints: HINT_BY_KIND[kind],
      explanation: `Regra: ${b.rule}. Aplicando ao último termo (${b.shown[b.shown.length - 1]}), o próximo é ${b.answer}. Sequências curtas podem admitir mais de uma regra; aqui adotamos a mais simples que explica todos os termos.`,
      source: 'Gerador determinístico com solver independente (src/domain/sequences.ts)',
      estimatedSeconds: 20 + level * 15,
      grading: 'Igualdade numérica com a resposta esperada; regra alternativa verificada pelo solver conta como válida.',
    }
  }
  throw new Error(`Não foi possível gerar sequência válida (seed=${seed}, nível=${level})`)
}

/** Normaliza texto numérico: aceita vírgula decimal, espaços e sinal. */
export function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ').replace(',', '.').replace(/\.0+$/, '')
}

export function gradeAnswer(ex: Exercise, given: string): { verdict: Verdict; note?: string } {
  const g = normalizeAnswer(given)
  if (g === normalizeAnswer(ex.answer)) return { verdict: 'correct' }
  const alt = ex.alternatives?.find((a) => normalizeAnswer(a.answer) === g)
  if (alt) return { verdict: 'valid-alternative', note: alt.note }
  return { verdict: 'incorrect' }
}
