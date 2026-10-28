import { useRef, useState } from 'react'
import type { AdaptiveConfig, Settings as S } from '../domain/types'
import { DEFAULT_ADAPTIVE } from '../domain/adaptive'
import { eraseAllData, exportData, importData, parseBackup } from '../storage/db'
import { useData } from '../store'

function Num({ label, value, onChange, step = 1, min = 0, max }: { label: string; value: number; onChange: (n: number) => void; step?: number; min?: number; max?: number }) {
  return (
    <label className="block text-sm">
      <span>{label}</span>
      <input type="number" className="input mt-1" value={value} step={step} min={min} max={max} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  )
}

export default function Settings() {
  const { settings, updateSettings, refresh } = useData()
  const [msg, setMsg] = useState('')
  const file = useRef<HTMLInputElement>(null)
  const set = (p: Partial<S>) => void updateSettings({ ...settings, ...p })
  const setA = (p: Partial<AdaptiveConfig>) => set({ adaptive: { ...settings.adaptive, ...p } })

  const doExport = async () => {
    const data = await exportData()
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `neuro100-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg('Backup exportado.')
  }

  const doImport = async (f: File) => {
    const r = parseBackup(await f.text())
    if (!r.ok) return setMsg(`Importação recusada: ${r.error}`)
    if (!confirm('Importar substitui TODOS os dados deste dispositivo. Continuar?')) return
    await importData(r.data)
    await refresh()
    setMsg(`Importado: ${r.data.attempts.length} tentativas, ${r.data.sessions.length} sessões.`)
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <section className="card grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">Tema
          <select className="input mt-1" value={settings.theme} onChange={(e) => set({ theme: e.target.value as S['theme'] })}>
            <option value="sistema">Seguir o sistema</option><option value="claro">Claro</option><option value="escuro">Escuro</option>
          </select>
        </label>
        <label className="block text-sm">Cor de destaque
          <select className="input mt-1" value={settings.palette} onChange={(e) => set({ palette: e.target.value as S['palette'] })}>
            <option value="indigo">Índigo</option><option value="verde">Verde-azulado</option><option value="ambar">Âmbar</option>
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" className="size-5" checked={settings.animations} onChange={(e) => set({ animations: e.target.checked })} />Animações discretas</label>
      </section>

      <section className="card grid gap-3 sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">Inatividade</h2>
        <Num label="Avisar após (segundos sem interação)" value={settings.inactivityWarnSeconds} onChange={(n) => set({ inactivityWarnSeconds: n })} min={10} />
        <Num label="Pausar após o aviso (segundos)" value={settings.inactivityPauseSeconds} onChange={(n) => set({ inactivityPauseSeconds: n })} min={5} />
        <p className="muted text-sm sm:col-span-2">Valem para a próxima sessão. Pensar sem clicar é legítimo: o tempo é creditado até a pausa.</p>
      </section>

      <section className="card grid gap-3 sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">Dificuldade adaptativa (limites configuráveis)</h2>
        <p className="muted text-sm sm:col-span-2">Valores iniciais são hipóteses de implementação, não achados científicos. A velocidade não entra na decisão.</p>
        <Num label="Janela (exercícios por competência)" value={settings.adaptive.windowSize} min={3} max={20} onChange={(n) => setA({ windowSize: n })} />
        <Num label="Subir nível se precisão ≥" value={settings.adaptive.raiseAccuracy} step={0.05} max={1} onChange={(n) => setA({ raiseAccuracy: n })} />
        <Num label="…e uso de dicas ≤" value={settings.adaptive.raiseMaxHintRate} step={0.05} max={1} onChange={(n) => setA({ raiseMaxHintRate: n })} />
        <Num label="Sugerir revisão se precisão <" value={settings.adaptive.lowerAccuracy} step={0.05} max={1} onChange={(n) => setA({ lowerAccuracy: n })} />
        <Num label="…ou uso de dicas ≥" value={settings.adaptive.lowerHintRate} step={0.05} max={1} onChange={(n) => setA({ lowerHintRate: n })} />
        <div><button className="btn btn-ghost" onClick={() => set({ adaptive: DEFAULT_ADAPTIVE })}>Restaurar padrão</button></div>
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Dados (somente neste dispositivo)</h2>
        <p className="muted text-sm">Não há servidor nem sincronização automática: celular e computador têm dados independentes. Para transferir, exporte aqui e importe no outro aparelho. Nada é enviado a serviços externos.</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={() => void doExport()}>Exportar backup (JSON)</button>
          <button className="btn btn-ghost" onClick={() => file.current?.click()}>Importar backup</button>
          <input ref={file} type="file" accept="application/json,.json" hidden data-testid="import-input" onChange={(e) => { const f = e.target.files?.[0]; if (f) void doImport(f); e.target.value = '' }} />
          <button className="btn btn-ghost" style={{ color: 'var(--bad)' }} onClick={async () => { if (confirm('Apagar TODOS os dados locais? Isso não pode ser desfeito.')) { await eraseAllData(); await refresh(); setMsg('Todos os dados locais foram apagados.') } }}>Apagar todos os dados</button>
        </div>
        <p role="status" data-testid="settings-msg">{msg}</p>
      </section>
    </div>
  )
}
