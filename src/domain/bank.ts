import { generateSequence, rng } from './sequences'
import type { Competency, Exercise, Level } from './types'

export const BANK_VERSION = 'mvp-1'
export type Form = 'A' | 'B'

const SRC = 'Item autoral do NEURO100 (hipótese pedagógica; não validado psicometricamente)'

function item(p: Omit<Exercise, 'source' | 'grading'> & { grading?: string }): Exercise {
  return { source: SRC, grading: 'Igualdade com a resposta esperada (texto normalizado).', ...p }
}

// ---------- Matemática (gerada e validada por cálculo) ----------
export function generateMath(seed: number, level: Level): Exercise {
  const r = rng(seed * 7919 + level)
  const n = (lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1))
  const kind = level <= 1 ? 'soma' : level === 2 ? 'porcentagem' : level === 3 ? 'proporcao' : 'fracao'
  let prompt = ''
  let answer = 0
  let method = ''
  let hints: string[] = []
  if (kind === 'soma') {
    const a = n(12, 49), b = n(12, 49), c = n(5, 20)
    answer = a + b - c
    prompt = `Calcule mentalmente: ${a} + ${b} − ${c}`
    method = `Somar ${a} + ${b} = ${a + b} e subtrair ${c}.`
    hints = ['Resolva primeiro a soma.', 'Depois subtraia o último número.', `Exemplo: 20 + 15 − 5 = 30.`, `${a} + ${b} = ${a + b}`]
  } else if (kind === 'porcentagem') {
    const p = [10, 20, 25, 50][n(0, 3)], base = n(2, 20) * 20
    answer = (base * p) / 100
    prompt = `Quanto é ${p}% de ${base}?`
    method = `${base} × ${p}/100 = ${answer}.`
    hints = ['Porcentagem é "por cem": p% = p/100.', `Escreva ${p}% como fração de 100.`, 'Exemplo: 10% de 80 = 80 ÷ 10 = 8.', `${base} × ${p} ÷ 100`]
  } else if (kind === 'proporcao') {
    const k = n(2, 6), a = n(2, 9), b = n(2, 9)
    answer = a * b * k / a
    prompt = `Se ${a} cadernos custam R$ ${a * k}, quanto custam ${b} cadernos ao mesmo preço unitário?`
    answer = b * k
    method = `Preço unitário ${k}; ${b} × ${k} = ${answer}.`
    hints = ['Descubra o preço de 1 caderno.', 'Divida o total pelo número de cadernos.', 'Exemplo: 3 itens custam 12 → 1 item custa 4.', `Preço unitário = ${k}`]
  } else {
    const d = n(2, 6), num = n(1, d - 1), mult = n(2, 8)
    answer = num * mult
    prompt = `Quanto é ${num}/${d} de ${d * mult}?`
    method = `${d * mult} ÷ ${d} = ${mult}; ${mult} × ${num} = ${answer}.`
    hints = ['Divida o número pelo denominador.', 'Depois multiplique pelo numerador.', 'Exemplo: 2/3 de 12 → 12÷3=4 → 4×2=8.', `${d * mult} ÷ ${d} = ${mult}`]
  }
  return item({
    id: `mat-${level}-${seed}`,
    competency: 'matematica.basica',
    subcompetency: kind,
    level,
    prompt,
    answer: String(answer),
    method,
    hints,
    explanation: `${method} Resposta: ${answer}.`,
    estimatedSeconds: 30 + level * 10,
  })
}

// ---------- Itens autorais, em duas formas equivalentes (A/B) ----------
type Pair = [Exercise, Exercise]

const HAND: Record<string, Pair[]> = {
  'logica.padroes': [
    [
      item({ id: 'pad-1A', competency: 'logica.padroes', subcompetency: 'repeticao', level: 1, prompt: 'Qual é o próximo elemento?\n▲ ● ■ ▲ ● ■ ▲ ●  ?', options: ['▲', '●', '■'], answer: '■', method: 'O padrão ▲ ● ■ se repete.', hints: ['Identifique o grupo que se repete.', 'Quantos elementos tem o grupo?', 'Exemplo: A B A B A ? → B.', 'Veja qual elemento completa o grupo atual.'], explanation: 'O grupo ▲ ● ■ se repete; após ▲ ● vem ■.', estimatedSeconds: 20 }),
      item({ id: 'pad-1B', competency: 'logica.padroes', subcompetency: 'repeticao', level: 1, prompt: 'Qual é o próximo elemento?\n◆ ★ ◆ ★ ★ ◆ ★ ★ ★ ◆ ?', options: ['◆', '★'], answer: '★', method: 'Após cada ◆ aumenta em um a quantidade de ★.', hints: ['Conte quantas ★ há entre os ◆.', '1, 2, 3… o que vem depois?', 'Exemplo: A B A B B A B B B → próximo bloco tem 4 B.', 'Após o último ◆ começa um bloco com 4 ★.'], explanation: 'Blocos de ★ crescem 1, 2, 3, 4…; após ◆ vem ★.', estimatedSeconds: 30 }),
    ],
    [
      item({ id: 'pad-2A', competency: 'logica.padroes', subcompetency: 'analogia', level: 2, prompt: 'Cão está para latir assim como gato está para…', options: ['miar', 'correr', 'pelo', 'dormir'], answer: 'miar', method: 'Relação animal → som que emite.', hints: ['Qual é a relação entre cão e latir?', 'Latir é o quê para o cão?', 'Exemplo: pássaro está para cantar como… ', 'Procure o som característico do gato.'], explanation: 'Latir é o som do cão; miar é o som do gato.', estimatedSeconds: 20 }),
      item({ id: 'pad-2B', competency: 'logica.padroes', subcompetency: 'analogia', level: 2, prompt: 'Livro está para ler assim como música está para…', options: ['ouvir', 'cantor', 'nota', 'rádio'], answer: 'ouvir', method: 'Relação objeto → ação de fruí-lo.', hints: ['O que se faz com um livro?', 'A ação que se faz com a música é de qual sentido?', 'Exemplo: comida está para comer…', 'Procure a ação correspondente.'], explanation: 'Livro se lê; música se ouve.', estimatedSeconds: 20 }),
    ],
    [
      item({ id: 'pad-3A', competency: 'logica.padroes', subcompetency: 'matriz', level: 3, prompt: 'Cada linha tem a regra "terceiro número = primeiro × segundo".\n2  3  6\n4  2  8\n5  3  ?', answer: '15', method: '5 × 3 = 15.', hints: ['Veja a relação nas duas primeiras linhas.', 'Teste multiplicar os dois primeiros números.', 'Exemplo: 3 × 3 = 9.', '5 × 3.'], explanation: '2×3=6, 4×2=8, logo 5×3=15.', estimatedSeconds: 40 }),
      item({ id: 'pad-3B', competency: 'logica.padroes', subcompetency: 'matriz', level: 3, prompt: 'Cada linha tem a regra "terceiro número = primeiro + segundo × 2".\n1  2  5\n3  1  5\n4  3  ?', answer: '10', method: '4 + 3×2 = 10.', hints: ['Teste relacionar os dois primeiros.', 'Primeira linha: 1 e 2 dão 5.', 'Exemplo: 2 + 2×2 = 6.', '4 + (3 × 2).'], explanation: '1+2×2=5; 3+1×2=5; 4+3×2=10.', estimatedSeconds: 45 }),
    ],
  ],
  'logica.classificacao': [
    [
      item({ id: 'cla-1A', competency: 'logica.classificacao', subcompetency: 'intruso', level: 1, prompt: 'Qual NÃO pertence ao grupo?', options: ['maçã', 'banana', 'cenoura', 'uva'], answer: 'cenoura', method: 'Frutas × legume.', hints: ['Qual a categoria da maioria?', 'Três são frutas.', 'Exemplo: cão, gato, mesa, vaca → mesa.', 'Procure o legume.'], explanation: 'Maçã, banana e uva são frutas; cenoura é legume.', estimatedSeconds: 15 }),
      item({ id: 'cla-1B', competency: 'logica.classificacao', subcompetency: 'intruso', level: 1, prompt: 'Qual NÃO pertence ao grupo?', options: ['martelo', 'chave de fenda', 'alicate', 'caneca'], answer: 'caneca', method: 'Ferramentas × utensílio.', hints: ['Qual a categoria da maioria?', 'Três são ferramentas.', 'Exemplo: rosa, tulipa, pedra, margarida → pedra.', 'Procure o que não é ferramenta.'], explanation: 'Martelo, chave de fenda e alicate são ferramentas.', estimatedSeconds: 15 }),
    ],
    [
      item({ id: 'cla-2A', competency: 'logica.classificacao', subcompetency: 'intruso-numerico', level: 2, prompt: 'Qual número NÃO pertence ao grupo?\n3, 9, 15, 20, 27', answer: '20', method: 'Os demais são múltiplos de 3.', hints: ['Procure uma propriedade comum.', 'Teste a divisão por 3.', 'Exemplo: 2, 4, 7, 8 → 7 (ímpar).', 'Qual não é divisível por 3?'], explanation: '3, 9, 15 e 27 são múltiplos de 3; 20 não.', estimatedSeconds: 25 }),
      item({ id: 'cla-2B', competency: 'logica.classificacao', subcompetency: 'intruso-numerico', level: 2, prompt: 'Qual número NÃO pertence ao grupo?\n4, 8, 12, 18, 24', answer: '18', method: 'Os demais são múltiplos de 4.', hints: ['Procure uma propriedade comum.', 'Teste a divisão por 4.', 'Exemplo: 5, 10, 15, 22 → 22.', 'Qual não é divisível por 4?'], explanation: '4, 8, 12 e 24 são múltiplos de 4; 18 não.', estimatedSeconds: 25 }),
    ],
  ],
  'logica.deducao': [
    [
      item({ id: 'ded-1A', competency: 'logica.deducao', subcompetency: 'silogismo', level: 2, prompt: 'Todos os gatos são mamíferos. Mimi é um gato. O que se conclui?', options: ['Mimi é mamífero', 'Mimi não é mamífero', 'Todo mamífero é gato', 'Nada se pode concluir'], answer: 'Mimi é mamífero', method: 'Se todo A é B e x é A, então x é B.', hints: ['Mimi pertence a qual grupo?', 'E esse grupo está contido em qual?', 'Exemplo: todo pássaro tem penas; Pip é pássaro → Pip tem penas.', 'Cuidado: o inverso não vale.'], explanation: 'Mimi ∈ gatos ⊂ mamíferos, logo Mimi é mamífero. Mas "todo mamífero é gato" não decorre.', estimatedSeconds: 30 }),
      item({ id: 'ded-1B', competency: 'logica.deducao', subcompetency: 'silogismo', level: 2, prompt: 'Todos os professores são formados. Ana é professora. O que se conclui?', options: ['Ana é formada', 'Ana não é formada', 'Todo formado é professor', 'Nada se pode concluir'], answer: 'Ana é formada', method: 'Se todo A é B e x é A, então x é B.', hints: ['Ana pertence a qual grupo?', 'E esse grupo está contido em qual?', 'Exemplo: todo carro tem rodas; Fusca é carro → tem rodas.', 'O inverso não vale.'], explanation: 'Ana ∈ professores ⊂ formados.', estimatedSeconds: 30 }),
    ],
    [
      item({ id: 'ded-2A', competency: 'logica.deducao', subcompetency: 'condicional', level: 3, prompt: 'Regra: "Se chove, a rua fica molhada." A rua NÃO está molhada. O que se conclui?', options: ['Não choveu', 'Choveu', 'Pode ter chovido', 'A regra é falsa'], answer: 'Não choveu', method: 'Contrapositiva: ¬Q → ¬P.', hints: ['Se tivesse chovido, o que teria acontecido?', 'Isso aconteceu?', 'Exemplo: se há fogo, há fumaça; sem fumaça → sem fogo.', 'Use a contrapositiva.'], explanation: 'Se P→Q e ¬Q, então ¬P (modus tollens).', estimatedSeconds: 40 }),
      item({ id: 'ded-2B', competency: 'logica.deducao', subcompetency: 'condicional', level: 3, prompt: 'Regra: "Se o alarme toca, há alguém em casa." Não há ninguém em casa. O que se conclui?', options: ['O alarme não tocou', 'O alarme tocou', 'Pode ter tocado', 'A regra é falsa'], answer: 'O alarme não tocou', method: 'Contrapositiva: ¬Q → ¬P.', hints: ['Se o alarme tivesse tocado, o que teria de ser verdade?', 'Isso é verdade?', 'Exemplo: se há fogo, há fumaça; sem fumaça → sem fogo.', 'Use a contrapositiva.'], explanation: 'Se P→Q e ¬Q, então ¬P (modus tollens).', estimatedSeconds: 40 }),
    ],
  ],
  'logica.contradicao': [
    [
      item({ id: 'con-1A', competency: 'logica.contradicao', subcompetency: 'afirmacoes', level: 2, prompt: 'Qual par de afirmações é contraditório (não podem ser ambas verdadeiras)?', options: ['"Todos os alunos passaram" e "Algum aluno não passou"', '"Chove hoje" e "Faz frio hoje"', '"Ana é alta" e "Bia é baixa"', '"Há pão" e "Há leite"'], answer: '"Todos os alunos passaram" e "Algum aluno não passou"', method: 'Uma é a negação da outra.', hints: ['Qual par não pode ser verdadeiro ao mesmo tempo?', 'Procure uma afirmação que nega a outra.', 'Exemplo: "É dia" e "É noite".', 'Se uma é verdadeira, a outra precisa ser falsa.'], explanation: '"Todos passaram" é exatamente negada por "algum não passou".', estimatedSeconds: 35 }),
      item({ id: 'con-1B', competency: 'logica.contradicao', subcompetency: 'afirmacoes', level: 2, prompt: 'Qual par de afirmações é contraditório (não podem ser ambas verdadeiras)?', options: ['"Nenhum produto está em estoque" e "Algum produto está em estoque"', '"Há café" e "Há açúcar"', '"João chegou" e "Maria saiu"', '"O céu é azul" e "O mar é grande"'], answer: '"Nenhum produto está em estoque" e "Algum produto está em estoque"', method: 'Uma é a negação da outra.', hints: ['Qual par não pode ser verdadeiro ao mesmo tempo?', 'Procure uma afirmação que nega a outra.', 'Exemplo: "É dia" e "É noite".', 'Se uma é verdadeira, a outra precisa ser falsa.'], explanation: '"Nenhum" é negado por "algum".', estimatedSeconds: 35 }),
    ],
  ],
  'memoria.trabalho': [
    [
      item({ id: 'mem-1A', competency: 'memoria.trabalho', subcompetency: 'sequencia-inversa', level: 1, prompt: 'Memorize e depois digite na ordem INVERSA (apenas dígitos, sem espaços):\n4 7 2 9', answer: '9274', method: 'Inverter a sequência.', hints: ['Comece pelo último dígito.', 'Anote mentalmente de trás para frente.', 'Exemplo: 1 2 3 → 321.', 'O primeiro dígito da resposta é o último que apareceu.'], explanation: 'Sequência 4 7 2 9 invertida: 9 2 7 4.', estimatedSeconds: 25 }),
      item({ id: 'mem-1B', competency: 'memoria.trabalho', subcompetency: 'sequencia-inversa', level: 1, prompt: 'Memorize e depois digite na ordem INVERSA (apenas dígitos, sem espaços):\n6 1 8 3', answer: '3816', method: 'Inverter a sequência.', hints: ['Comece pelo último dígito.', 'Anote mentalmente de trás para frente.', 'Exemplo: 1 2 3 → 321.', 'O primeiro dígito da resposta é o último que apareceu.'], explanation: 'Sequência 6 1 8 3 invertida: 3 8 1 6.', estimatedSeconds: 25 }),
    ],
    [
      item({ id: 'mem-2A', competency: 'memoria.trabalho', subcompetency: 'atualizacao', level: 2, prompt: 'Você tem 5 reais. Ganha 3, gasta 4, ganha 6 e gasta 2. Quanto tem agora?', answer: '8', method: '5+3−4+6−2 = 8.', hints: ['Vá atualizando o saldo passo a passo.', 'Depois de ganhar 3 e gastar 4, quanto resta?', 'Exemplo: 2+1−2 = 1.', '4 + 6 − 2.'], explanation: '5→8→4→10→8.', estimatedSeconds: 30 }),
      item({ id: 'mem-2B', competency: 'memoria.trabalho', subcompetency: 'atualizacao', level: 2, prompt: 'Você tem 7 reais. Gasta 2, ganha 5, gasta 6 e ganha 4. Quanto tem agora?', answer: '8', method: '7−2+5−6+4 = 8.', hints: ['Vá atualizando o saldo passo a passo.', 'Depois de gastar 2 e ganhar 5, quanto resta?', 'Exemplo: 2+1−2 = 1.', '10 − 6 + 4.'], explanation: '7→5→10→4→8.', estimatedSeconds: 30 }),
    ],
  ],
  'verbal.compreensao': [
    [
      item({ id: 'ver-1A', competency: 'verbal.compreensao', subcompetency: 'inferencia', level: 2, prompt: 'Texto: "Marta chegou molhada e deixou o guarda-chuva na porta." O que se pode inferir com mais segurança?', options: ['Marta usou o guarda-chuva', 'Provavelmente chovia', 'Marta mora perto', 'Marta esqueceu algo'], answer: 'Provavelmente chovia', method: 'Inferência a partir de pistas do texto.', hints: ['Que pistas o texto dá?', 'Por que alguém chega molhado com guarda-chuva?', 'Exemplo: "João tirou o casaco ao entrar" → fazia frio.', 'Escolha a conclusão mais sustentada pelo texto.'], explanation: 'Molhada + guarda-chuva sugerem chuva. Não se sabe se ela o usou, onde mora ou se esqueceu algo.', estimatedSeconds: 40 }),
      item({ id: 'ver-1B', competency: 'verbal.compreensao', subcompetency: 'inferencia', level: 2, prompt: 'Texto: "Pedro conferiu o relógio pela terceira vez e acelerou o passo." O que se pode inferir com mais segurança?', options: ['Pedro está atrasado ou com receio de se atrasar', 'Pedro gosta de caminhar', 'Pedro perdeu o relógio', 'Pedro está cansado'], answer: 'Pedro está atrasado ou com receio de se atrasar', method: 'Inferência a partir de pistas do texto.', hints: ['Que pistas o texto dá?', 'Por que alguém confere o horário e acelera?', 'Exemplo: "Ana olhou o céu e abriu o guarda-chuva" → vai chover.', 'Escolha a conclusão mais sustentada pelo texto.'], explanation: 'Conferir o horário repetidamente e acelerar sugere pressa de tempo.', estimatedSeconds: 40 }),
    ],
  ],
  'problemas.resolucao': [
    [
      item({ id: 'prb-1A', competency: 'problemas.resolucao', subcompetency: 'decomposicao', level: 2, prompt: 'Uma loja vende 3 camisetas por R$ 90. Você quer 5 camisetas, ao mesmo preço unitário. Quanto pagará?', answer: '150', method: '90÷3=30; 30×5=150.', hints: ['Que informação falta para chegar ao total?', 'Descubra o preço de uma camiseta.', 'Exemplo: 2 itens por 10 → 5 cada.', 'Preço unitário × 5.'], explanation: 'Cada camiseta custa 30; 5 custam 150.', estimatedSeconds: 40 }),
      item({ id: 'prb-1B', competency: 'problemas.resolucao', subcompetency: 'decomposicao', level: 2, prompt: 'Uma padaria vende 4 pães por R$ 12. Você quer 7 pães, ao mesmo preço unitário. Quanto pagará?', answer: '21', method: '12÷4=3; 3×7=21.', hints: ['Que informação falta para chegar ao total?', 'Descubra o preço de um pão.', 'Exemplo: 2 itens por 10 → 5 cada.', 'Preço unitário × 7.'], explanation: 'Cada pão custa 3; 7 custam 21.', estimatedSeconds: 40 }),
    ],
  ],
  'explicacao.raciocinio': [
    [
      item({ id: 'exp-1A', competency: 'explicacao.raciocinio', subcompetency: 'identificar-erro', level: 2, prompt: 'Um aluno resolveu: 12 + 8 ÷ 4 = 5. Qual foi o erro?', options: ['Somou antes de dividir', 'Dividiu antes de somar', 'Errou a divisão', 'Não houve erro'], answer: 'Somou antes de dividir', method: 'Divisão tem precedência: 8÷4=2; 12+2=14.', hints: ['Refaça a conta seguindo a ordem das operações.', 'Qual operação vem primeiro?', 'Exemplo: 2 + 3 × 4 = 14, não 20.', '(12+8)÷4 = 5; mas o correto é 12 + (8÷4).'], explanation: 'O correto é 12 + 8÷4 = 12 + 2 = 14. O aluno fez (12+8)÷4 = 5.', estimatedSeconds: 45 }),
      item({ id: 'exp-1B', competency: 'explicacao.raciocinio', subcompetency: 'identificar-erro', level: 2, prompt: 'Um aluno resolveu: 6 + 4 × 3 = 30. Qual foi o erro?', options: ['Somou antes de multiplicar', 'Multiplicou antes de somar', 'Errou a multiplicação', 'Não houve erro'], answer: 'Somou antes de multiplicar', method: 'Multiplicação tem precedência: 4×3=12; 6+12=18.', hints: ['Refaça a conta seguindo a ordem das operações.', 'Qual operação vem primeiro?', 'Exemplo: 2 + 3 × 4 = 14, não 20.', '(6+4)×3 = 30; o correto é 6 + (4×3).'], explanation: 'O correto é 6 + 4×3 = 6 + 12 = 18. O aluno fez (6+4)×3 = 30.', estimatedSeconds: 45 }),
    ],
  ],
}

/** Itens de cada área que compõem uma avaliação (forma A ou B). */
export function assessmentItems(form: Form): Exercise[] {
  const idx = form === 'A' ? 0 : 1
  const seedBase = form === 'A' ? 100 : 200
  const out: Exercise[] = []
  for (const lvl of [1, 3, 4] as Level[]) out.push(generateSequence(seedBase + lvl, lvl))
  for (const lvl of [1, 2, 4] as Level[]) out.push(generateMath(seedBase + lvl, lvl))
  for (const pairs of Object.values(HAND)) for (const pair of pairs) out.push(pair[idx])
  return out
}

export function handItems(): Exercise[] {
  return Object.values(HAND).flatMap((p) => p.flat())
}

export const COMPETENCY_LABEL: Record<Competency, string> = {
  'logica.sequencias': 'Sequências numéricas',
  'logica.padroes': 'Reconhecimento de padrões',
  'logica.classificacao': 'Classificação',
  'logica.deducao': 'Dedução',
  'logica.contradicao': 'Contradições',
  'matematica.basica': 'Matemática básica',
  'memoria.trabalho': 'Memória de trabalho',
  'verbal.compreensao': 'Compreensão verbal',
  'problemas.resolucao': 'Resolução de problemas',
  'explicacao.raciocinio': 'Identificar erros',
}

/** Módulo 1 — trilha de prática: sequências geradas + itens autorais de lógica. */
export function practiceExercise(competency: Competency, level: Level, seed: number): Exercise | null {
  if (competency === 'logica.sequencias') return generateSequence(seed, level)
  if (competency === 'matematica.basica') return generateMath(seed, level)
  const pairs = HAND[competency]
  if (!pairs) return null
  const pick = pairs[seed % pairs.length]
  return pick[(seed >> 1) % 2]
}

/** Recupera um exercício pelo id (gerados são reconstruídos pela semente; ids determinísticos). */
export function findExerciseById(id: string): Exercise | null {
  const m = /^(seq|mat)-(\d)-(\d+)$/.exec(id)
  if (m) {
    const level = Number(m[2]) as Level
    return m[1] === 'seq' ? generateSequence(Number(m[3]), level) : generateMath(Number(m[3]), level)
  }
  return handItems().find((e) => e.id === id) ?? null
}
