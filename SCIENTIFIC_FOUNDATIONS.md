# Fundamentos científicos — NEURO100

Estado da revisão: **inicial e incompleta**. Registramos o que foi de fato lido ao construir o MVP e o que ficou pendente. Nenhum percentual de melhoria é afirmado em nenhum lugar do app.

Legenda de leitura: **verificada** (conteúdo da fonte lido), **parcial** (lido em parte), **não verificada** (a fonte não pôde ser acessada; só consta o que o briefing do projeto afirma — tratar como pendência).

---

## 1. Prática distribuída e recuperação ativa (testes)

| Campo | Conteúdo |
|---|---|
| Referência | Donoghue & Hattie (2021). *A Meta-Analysis of Ten Learning Techniques.* Frontiers in Education. https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2021.581216/full |
| Leitura | **verificada** |
| Método | Prática distribuída; prática de recuperação (testes) |
| Objetivo do estudo | Comparar o efeito de 10 técnicas de estudo |
| População | Maioria universitários (~65%), ~86% dos estudos norte-americanos |
| Tipo de evidência | Meta-análise: 242 estudos, 1.619 efeitos, 169.179 participantes |
| Resultados principais | d médio geral = 0,56. Prática distribuída d = 0,85; recuperação d = 0,74 (maiores efeitos). Recuperação **com feedback** supera sem feedback. |
| Limitações | 93% dos desfechos eram superficiais/factuais; transferência distante com efeito menor (0,39 vs 0,61 próxima); 74% das medidas feitas em ≤ 1 dia (pouca evidência de retenção longa); heterogeneidade alta (I² = 85%); estudos de alta habilidade escassos; divisão em categorias de eficácia é arbitrária (segundo os autores). |
| Aplicação na plataforma | Exercícios exigem produzir a resposta (não só reconhecer); feedback explicativo após cada tentativa; prática espalhada em sessões curtas; revisões espaçadas (Fase 2). **Cautela:** os resultados vêm sobretudo de aprendizagem factual; para raciocínio complexo o app trata a eficácia como hipótese a ser observada nos próprios dados do usuário. |

## 2. Dunlosky et al. (2013)

| Campo | Conteúdo |
|---|---|
| Referência | Dunlosky e colaboradores (2013). *Improving Students' Learning With Effective Learning Techniques.* https://pubmed.ncbi.nlm.nih.gov/26173288/ |
| Leitura | **não verificada** (PubMed exigiu reCAPTCHA) |
| Informação indireta | Donoghue & Hattie descrevem que a classificação alta/média/baixa utilidade do estudo de Dunlosky tem diferenças pequenas entre categorias. |
| Pendência | Ler o artigo original (resumo e tabelas de utilidade, população e condições). |

## 3. Aprendizagem: conhecimento prévio, explicação, transferência

| Campo | Conteúdo |
|---|---|
| Referência | National Academies (2018). *How People Learn II.* Cap. 5, "Knowledge and Reasoning". https://www.nationalacademies.org/read/24783/chapter/7 |
| Leitura | **parcial** (~87% do capítulo) |
| Tipo de evidência | Revisão de consenso de comitê |
| Resultados principais | Conhecimento prévio facilita o novo, mas pode enviesar. Recuperar ativamente fortalece a aprendizagem; tentativas falhas também informam lacunas. Autoexplicação e interrogação elaborativa ajudam; autoexplicação pode atrapalhar com pouco conhecimento prévio. Transferência exige adaptar o conhecimento; comparar problemas relacionados ajuda. |
| Limitações | Metacognição não é tema próprio do capítulo; "transferência" não aparece como termo; explicações tendem a generalizar demais. |
| Aplicação | Ciclo exemplo resolvido → prática com dicas → explicação opcional do raciocínio → feedback; indicador de transferência separado; explicação **opcional** (por causa do risco com pouco conhecimento prévio). |

## 4. Espaçamento e recuperação — mecanismos

| Referência | *The science of effective learning with spacing and retrieval practice* (Nature Reviews Psychology, 2022). https://www.nature.com/articles/s44159-022-00089-1 |
|---|---|
| Leitura | **não verificada** (acesso redirecionado para autenticação) |
| Pendência | Ler o artigo; só então fundamentar escolhas de intervalos na Fase 2. |

## 5. Exercício físico e cognição

| Referência | Revisão no *British Journal of Sports Medicine* (2025), DOI 10.1136/bjsports-2024-108589 |
|---|---|
| Leitura | **não verificada** (HTTP 403) |
| Uso no app | Apenas uma frase genérica ("associado a benefícios, magnitude variável") na tela de recuperação, conforme o briefing. Pendência: ler antes de ampliar qualquer recomendação. |

## 6. Jogos e treinamento cognitivo

| Campo | Conteúdo |
|---|---|
| Referência | Smith & Basak (2023). *A game-factors approach to cognitive benefits from video-game training: a meta-analysis.* PLOS ONE. https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0285925 |
| Leitura | **verificada** (primeiros ~100 mil caracteres) |
| População | Adultos sem comprometimento clínico |
| Tipo de evidência | Meta-análise: 63 estudos, 118 intervenções, N = 2.079 |
| Resultados | Efeito médio g = 0,25 (IC95% 0,12–0,39); atenção/percepção g = 0,27; cognição de ordem superior g = 0,31; memória g = −0,14 (n.s.) |
| Limitações | Viés de publicação (funil assimétrico), heterogeneidade significativa, achados sobre fatores de jogo são correlacionais, poucos estudos para memória. |
| Aplicação | O NEURO100 **não** promete aumento de inteligência por exercícios; avalia desempenho em competências específicas e se há retenção/transferência para problemas novos. |

## 7. Sono

| Referência | CDC — *About Sleep*. https://www.cdc.gov/sleep/about/ |
|---|---|
| Leitura | **verificada** |
| Conteúdo | Sono adequado ajuda atenção e memória; adultos de 18–60 anos: 7 h ou mais por noite; dicas de higiene do sono. |
| Limitação | Página informativa de saúde pública, não estudo primário. Não é aconselhamento médico. |
| Aplicação | Mensagem de recuperação pós-sessão. Não afirmamos que beber água ou qualquer ação imediata melhora a consolidação. |

## 8. GitHub Pages e privacidade

Busca em 2026-10-27: a documentação oficial descreve controle de acesso para sites publicados de repositórios privados/internos **de organizações**, e o acesso é limitado a quem tem leitura no repositório. Fontes secundárias e uma resposta antiga da equipe indicam disponibilidade só em planos Enterprise. **Não confirmamos a matriz atual de planos.** Regra de projeto: tratar o site publicado como **público**; um repositório privado não torna o site privado. Os dados do usuário ficam só no navegador dele (IndexedDB), nunca no repositório.
Fonte oficial a conferir: https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site

---

## Hipóteses de implementação (sem respaldo específico)

Cada uma é uma decisão de produto, a ser avaliada com dados do próprio uso:

| Decisão | Valor inicial | Como avaliar |
|---|---|---|
| Janela e limiares de dificuldade adaptativa | 6 exercícios; subir com ≥ 85% e ≤ 20% de dicas; revisar com < 50% ou ≥ 60% de dicas | Verificar se o nível proposto produz precisão sem dicas estável (sem tédio nem frustração); ajustar em Configurações |
| Critérios de domínio | 8 exercícios novos no nível ≥ 3, ≥ 80% sem dicas, 2 revisões após ≥ 7 dias | Conferir se competências "dominadas" mantêm desempenho em reavaliações |
| Durações de sessão (5–30 min) | opção de UX | Comparar adesão e desempenho do próprio usuário |
| Inatividade 60 s + 30 s | configurável | Ver quantas pausas automáticas ocorrem durante raciocínio legítimo |
| Marcos 7/14/30/60/90 dias | marcos de acompanhamento | Não indicam ganhos esperados |
| Mínimo de 10 itens para "confiabilidade" | aviso, não teste estatístico | Substituir por análise adequada quando houver dados suficientes |
| Itens autorais e formas A/B | equivalência por construção | Sem calibração psicométrica; formas podem diferir em dificuldade |

## Pendências da revisão bibliográfica

1. Ler Dunlosky et al. (2013), Nature Reviews Psychology (2022) e BJSM (2025).
2. Para a Fase 2: documentação do FSRS (parâmetros e quando é adequado a habilidades de raciocínio, que diferem de memorização de fatos).
3. Buscar evidências sobre transferência de raciocínio lógico e sobre autoexplicação em adultos com pouco conhecimento prévio.
