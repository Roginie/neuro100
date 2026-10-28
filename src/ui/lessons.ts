import type { Competency } from '../domain/types'

export interface Lesson {
  title: string
  concept: string
  exampleProblem: string
  exampleSteps: string[]
}

/** Etapas A (explicação) e B (demonstração) do ciclo pedagógico. Texto autoral do NEURO100. */
export const LESSONS: Partial<Record<Competency, Lesson>> = {
  'logica.sequencias': {
    title: 'Sequências numéricas',
    concept:
      'Uma sequência segue uma regra. Para descobri-la, compare termos vizinhos: por subtração (quanto muda?), por divisão (quantas vezes cresce?) e, se as mudanças não forem iguais, olhe para as próprias mudanças. Sequências curtas podem admitir mais de uma regra; o app aceita regras alternativas válidas.',
    exampleProblem: '3, 5, 8, 12, 17, ?',
    exampleSteps: [
      'Diferenças: 5−3=2, 8−5=3, 12−8=4, 17−12=5.',
      'As diferenças não são iguais, mas crescem 1 a cada passo.',
      'Próxima diferença: 6. Logo, 17 + 6 = 23.',
    ],
  },
  'matematica.basica': {
    title: 'Raciocínio matemático básico',
    concept:
      'Decomponha o problema em passos pequenos: identifique o que é dado, o que é pedido e qual operação conecta os dois. Em porcentagens e proporções, ache primeiro o valor unitário ou a fração de 100.',
    exampleProblem: 'Quanto é 25% de 80?',
    exampleSteps: ['25% = 25/100 = 1/4.', 'Um quarto de 80 é 80 ÷ 4 = 20.', 'Resposta: 20.'],
  },
  'logica.padroes': {
    title: 'Padrões e relações',
    concept:
      'Padrões aparecem em repetições, analogias (A está para B como C está para ?) e regras entre números. Descreva em palavras a relação antes de aplicá-la.',
    exampleProblem: 'Pé está para sapato assim como mão está para…',
    exampleSteps: ['Relação: parte do corpo → peça que a veste.', 'Mão → luva.'],
  },
  'logica.classificacao': {
    title: 'Classificação',
    concept: 'Classificar é agrupar por uma propriedade comum. Ache a propriedade que a maioria compartilha; o intruso é quem a viola.',
    exampleProblem: '2, 4, 6, 9, 10 — qual não pertence?',
    exampleSteps: ['Propriedade da maioria: números pares.', '9 é ímpar → é o intruso.'],
  },
  'logica.deducao': {
    title: 'Dedução',
    concept:
      'Na dedução, a conclusão decorre necessariamente das premissas. Atenção: "todo A é B" não permite concluir "todo B é A". Com "se P então Q", negar Q permite negar P; afirmar Q não permite afirmar P.',
    exampleProblem: 'Todo atleta treina. Léo é atleta. O que se conclui?',
    exampleSteps: ['Léo está em "atletas".', '"Atletas" estão contidos em "quem treina".', 'Logo, Léo treina.'],
  },
  'logica.contradicao': {
    title: 'Contradições',
    concept: 'Duas afirmações são contraditórias quando não podem ser ambas verdadeiras (nem ambas falsas). "Todos" é contradito por "algum não".',
    exampleProblem: '"Todos chegaram" × "Alguém não chegou"',
    exampleSteps: ['Se todos chegaram, ninguém deixou de chegar.', 'Então "alguém não chegou" seria falso: contradição.'],
  },
  'memoria.trabalho': {
    title: 'Memória de trabalho',
    concept: 'É segurar e manipular informação por alguns segundos. Agrupar itens e repetir mentalmente ajuda; aqui o desempenho mede esta tarefa, não "memória geral".',
    exampleProblem: 'Memorize 3 5 8 e digite ao contrário.',
    exampleSteps: ['Último dígito primeiro: 8.', 'Depois 5, depois 3.', 'Resposta: 853.'],
  },
  'verbal.compreensao': {
    title: 'Compreensão verbal',
    concept: 'Diferencie o que o texto afirma, o que sugere e o que não permite concluir. Prefira a conclusão com mais sustentação nas pistas dadas.',
    exampleProblem: '"Ele pegou o casaco antes de sair." O que sugere?',
    exampleSteps: ['Pista: casaco ao sair.', 'Sugere frio, mas não prova.'],
  },
  'problemas.resolucao': {
    title: 'Resolução de problemas',
    concept: 'Passos: entender o que se pede, listar os dados, decompor em subproblemas, resolver e verificar se a resposta faz sentido.',
    exampleProblem: '3 canetas custam R$ 12. Quanto custam 5?',
    exampleSteps: ['Subproblema: preço de 1 caneta = 12 ÷ 3 = 4.', 'Total: 4 × 5 = 20.', 'Verificação: 20 > 12 e 5 > 3 → faz sentido.'],
  },
  'explicacao.raciocinio': {
    title: 'Identificar erros',
    concept: 'Refaça o cálculo seguindo as regras e compare passo a passo com a solução apresentada; o erro está onde os caminhos divergem.',
    exampleProblem: '5 + 2 × 3 = 21. Qual o erro?',
    exampleSteps: ['Correto: 2×3=6; 5+6=11.', 'O aluno somou 5+2 antes de multiplicar.'],
  },
}
