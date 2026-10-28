interface Ref {
  title: string
  authors: string
  url: string
  status: 'verificada' | 'parcial' | 'não verificada'
  note: string
}

/** Status reflete o que foi efetivamente consultado ao construir o app. Detalhes: SCIENTIFIC_FOUNDATIONS.md */
const REFS: Ref[] = [
  { title: 'Improving Students’ Learning With Effective Learning Techniques (2013)', authors: 'Dunlosky e colaboradores', url: 'https://pubmed.ncbi.nlm.nih.gov/26173288/', status: 'não verificada', note: 'A página do PubMed exigiu verificação (reCAPTCHA) e não pôde ser lida. Citada como indicada no briefing: recuperação ativa e prática distribuída como técnicas de alta utilidade.' },
  { title: 'A Meta-Analysis of Ten Learning Techniques (2021)', authors: 'Donoghue & Hattie, Frontiers in Education', url: 'https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2021.581216/full', status: 'verificada', note: '242 estudos, 169.179 participantes. Prática distribuída (d=0,85) e testes de recuperação (d=0,74) com os maiores efeitos. Limitações: 93% dos desfechos superficiais/factuais, alta heterogeneidade, maioria universitários norte-americanos, pouca evidência de retenção longa e de transferência distante.' },
  { title: 'How People Learn II: Learners, Contexts, and Cultures (2018)', authors: 'National Academies of Sciences, Engineering, and Medicine', url: 'https://www.nationalacademies.org/read/24783/chapter/7', status: 'parcial', note: 'Lido o capítulo 5 ("Knowledge and Reasoning"; ~87% do texto): conhecimento prévio, recuperação, autoexplicação e transferência. A metacognição não é tema próprio do capítulo; a autoexplicação pode atrapalhar com pouco conhecimento prévio.' },
  { title: 'The science of effective learning with spacing and retrieval practice (2022)', authors: 'Nature Reviews Psychology', url: 'https://www.nature.com/articles/s44159-022-00089-1', status: 'não verificada', note: 'Acesso redirecionado para autenticação; conteúdo não lido. Citada como indicada no briefing.' },
  { title: 'Exercício físico e cognição (2025)', authors: 'British Journal of Sports Medicine', url: 'https://doi.org/10.1136/BJSPORTS-2024-108589', status: 'não verificada', note: 'Acesso negado (HTTP 403). Citada como indicada no briefing: benefícios de magnitude variável.' },
  { title: 'A game-factors approach to cognitive benefits from video-game training: a meta-analysis (2023)', authors: 'Smith & Basak, PLOS ONE', url: 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0285925', status: 'verificada', note: '63 estudos, 118 intervenções, N=2.079; efeito médio g=0,25 (IC95% 0,12–0,39); sem efeito em memória (g=−0,14); viés de publicação detectado; heterogeneidade significativa. Por isso os jogos não são tratados como meio de elevar “inteligência”.' },
  { title: 'About Sleep', authors: 'CDC', url: 'https://www.cdc.gov/sleep/about/', status: 'verificada', note: 'Sono adequado ajuda atenção e memória; adultos de 18–60 anos: 7 horas ou mais por noite. Informação geral, não aconselhamento médico.' },
]

const color = { verificada: 'var(--ok)', parcial: 'var(--warn)', 'não verificada': 'var(--bad)' } as const

export default function References() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Referências científicas</h1>
      <p className="muted">
        Cada método do app indica a evidência em que se apoia. Decisões de produto sem respaldo específico (limiares adaptativos, critérios de domínio, durações de sessão, marcos de 7/14/30/60/90 dias) são <b>hipóteses de implementação</b>. Nenhum número do app é um percentual de melhoria cognitiva comprovado. Detalhes por estudo: <code>SCIENTIFIC_FOUNDATIONS.md</code>.
      </p>
      {REFS.map((r) => (
        <article key={r.url} className="card space-y-1">
          <h2 className="font-semibold"><a className="underline" href={r.url} target="_blank" rel="noreferrer noopener">{r.title}</a></h2>
          <div className="muted text-sm">{r.authors}</div>
          <div className="text-sm"><b style={{ color: color[r.status] }}>Leitura: {r.status}</b> — {r.note}</div>
        </article>
      ))}
    </div>
  )
}
