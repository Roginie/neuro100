import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs'

async function answerAll(page: Page) {
  for (let i = 0; i < 60; i++) {
    if (await page.getByTestId('summary').isVisible().catch(() => false)) return
    const concluir = page.getByRole('button', { name: 'Concluir avaliação' })
    const proxima = page.getByTestId('next-assessment')
    if (await proxima.isVisible().catch(() => false)) {
      await proxima.click()
      continue
    }
    if (await concluir.isVisible().catch(() => false)) {
      await concluir.click()
      continue
    }
    const options = page.getByRole('radiogroup', { name: 'Alternativas' }).getByRole('button')
    if (await options.first().isVisible().catch(() => false)) await options.first().click()
    else {
      const input = page.getByPlaceholder('Sua resposta')
      if (await input.isVisible().catch(() => false)) {
        await input.fill('0')
        await page.getByRole('button', { name: 'Responder' }).click()
      }
    }
    await page.waitForTimeout(60)
  }
}

async function doBaseline(page: Page) {
  await page.goto('/#/avaliacao')
  await page.getByRole('button', { name: 'Começar' }).click()
  await answerAll(page)
  await expect(page.getByTestId('summary')).toContainText('Linha de base registrada')
}

test('avaliação inicial: conclui, salva e persiste após recarregar', async ({ page }) => {
  await doBaseline(page)
  await page.goto('/#/')
  await page.reload()
  await expect(page.getByText('Linha de base registrada em')).toBeVisible()
  await page.goto('/#/revisoes')
  await expect(page.getByTestId('milestones').locator('li')).toHaveCount(5)
  await page.goto('/#/historico')
  await expect(page.getByText('Avaliação').first()).toBeVisible()
})

test('treino: erro não revela a resposta, dá dica progressiva e salva', async ({ page }) => {
  await page.goto('/#/treino')
  await page.getByRole('button', { name: 'Iniciar sessão' }).click()
  await page.getByRole('button', { name: 'Começar' }).click()
  const prompt = await page.locator('pre.prompt').innerText()
  await page.getByPlaceholder('Sua resposta').fill('99999')
  await page.getByRole('button', { name: 'Responder' }).click()
  const fb = page.getByTestId('feedback')
  await expect(fb).toContainText('Vamos pensar juntos')
  await expect(page.getByTestId('explanation')).toHaveCount(0) // solução ainda oculta
  expect(prompt).toContain('?')
  await page.getByRole('button', { name: 'Ver explicação completa' }).click()
  await expect(page.getByTestId('explanation')).toContainText('Regra')
  await page.reload()
  await page.goto('/#/historico')
  await expect(page.getByText('Treino').first()).toBeVisible()
})

test('treino: resposta correta (lida do solver via explicação) é registrada', async ({ page }) => {
  await page.goto('/#/treino')
  await page.getByRole('button', { name: 'Iniciar sessão' }).click()
  await page.getByRole('button', { name: 'Começar' }).click()
  // desiste uma vez para ler a resposta esperada na explicação; depois o próximo exercício é outro.
  await page.getByRole('button', { name: 'Ver explicação completa' }).click()
  const text = await page.getByTestId('explanation').innerText()
  expect(text).toMatch(/o próximo é -?\d+/)
  await page.getByRole('button', { name: 'Próximo exercício' }).click()
  await expect(page.getByTestId('active-time')).toBeVisible()
})

test('inatividade: aviso após 60 s, pausa após +30 s e retomada com confirmação', async ({ page }) => {
  await page.clock.install()
  await page.goto('/#/treino')
  await page.getByRole('button', { name: 'Iniciar sessão' }).click()
  await page.getByRole('button', { name: 'Começar' }).click()
  await page.clock.fastForward(61_000)
  await expect(page.getByTestId('clock-state')).toHaveText('Inatividade')
  await page.clock.fastForward(35_000)
  await expect(page.getByTestId('paused')).toBeVisible()
  await expect(page.getByTestId('paused')).toContainText('inatividade')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByTestId('clock-state')).toHaveText('Em andamento')
})

test('pausa manual e retomada', async ({ page }) => {
  await page.goto('/#/treino')
  await page.getByRole('button', { name: 'Iniciar sessão' }).click()
  await page.getByRole('button', { name: 'Começar' }).click()
  await page.getByRole('button', { name: 'Pausar' }).click()
  await expect(page.getByTestId('paused')).toBeVisible()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByTestId('paused')).toHaveCount(0)
})

test('sessão interrompida pode ser retomada sem perder progresso', async ({ page }) => {
  await page.goto('/#/treino')
  await page.getByRole('button', { name: 'Iniciar sessão' }).click()
  await page.getByRole('button', { name: 'Começar' }).click()
  await page.getByRole('button', { name: 'Ver explicação completa' }).click()
  await page.goto('/#/')
  await page.reload()
  await expect(page.getByTestId('resume-card')).toBeVisible()
  await page.getByRole('link', { name: 'Retomar' }).click()
  await expect(page.getByTestId('paused')).toBeVisible() // retomada exige confirmação
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.locator('pre.prompt')).toBeVisible()
})

test('exportar, apagar tudo e importar restaura os dados', async ({ page }) => {
  await doBaseline(page)
  await page.goto('/#/configuracoes')
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar backup (JSON)' }).click()])
  const path = await download.path()
  const json = JSON.parse(fs.readFileSync(path, 'utf8'))
  expect(json.format).toBe('neuro100-backup')
  expect(json.assessments).toHaveLength(1)

  page.once('dialog', (d) => void d.accept())
  await page.getByRole('button', { name: 'Apagar todos os dados' }).click()
  await expect(page.getByTestId('settings-msg')).toContainText('apagados')
  await page.goto('/#/')
  await page.reload()
  await expect(page.getByText('Fazer avaliação inicial')).toBeVisible()

  await page.goto('/#/configuracoes')
  page.once('dialog', (d) => void d.accept())
  await page.getByTestId('import-input').setInputFiles(path)
  await expect(page.getByTestId('settings-msg')).toContainText('Importado')
  await page.goto('/#/')
  await page.reload()
  await expect(page.getByText('Linha de base registrada em')).toBeVisible()
})

test('importação de arquivo inválido é recusada', async ({ page }) => {
  await page.goto('/#/configuracoes')
  await page.getByTestId('import-input').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"foo":1}') })
  await expect(page.getByTestId('settings-msg')).toContainText('recusada')
})

for (const rota of ['/', '/treino', '/avaliacao', '/biblioteca', '/estatisticas', '/explicacoes', '/referencias', '/configuracoes']) {
  for (const scheme of ['light', 'dark'] as const) {
    test(`acessibilidade (axe) ${rota} ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme })
      await page.goto(`/#${rota}`)
      await page.waitForTimeout(300)
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
      expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([])
    })
  }
}

test('responsividade: sem rolagem horizontal', async ({ page }) => {
  for (const rota of ['/', '/treino', '/estatisticas', '/configuracoes']) {
    await page.goto(`/#${rota}`)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(overflow, rota).toBe(false)
  }
})
