# NEURO100 — Laboratório de Inteligência e Raciocínio

Plataforma pessoal de aprendizagem baseada em evidências: avaliação inicial (linha de base), treino com dicas progressivas, tempo ativo, painel de progresso e comparação entre avaliações. **Não mede QI** e não promete ganhos cognitivos.

## Comandos
```bash
npm install
npm run dev         # desenvolvimento
npm test            # testes unitários (Vitest)
npm run e2e         # testes no navegador (Playwright; desktop e celular)
npm run build       # produção em dist/
```
Primeira vez com Playwright: `npx playwright install chromium`.

## Publicação (GitHub Pages)
O workflow `.github/workflows/deploy.yml` publica `dist/` ao enviar para `main` (Settings → Pages → Source: GitHub Actions). **O site publicado é público**; repositório privado não o torna privado. Seus dados ficam só no seu navegador.

## Dados
IndexedDB local. Celular e computador **não sincronizam**: use Configurações → Exportar/Importar. Faça backups periódicos.

## Documentação
`SCIENTIFIC_FOUNDATIONS.md` · `METRICS.md` · `ARCHITECTURE.md`
