import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import Assessment from './pages/Assessment'
import Dashboard from './pages/Dashboard'
import Explain from './pages/Explain'
import History from './pages/History'
import Library from './pages/Library'
import References from './pages/References'
import Reviews from './pages/Reviews'
import Settings from './pages/Settings'
import Stats from './pages/Stats'
import Train from './pages/Train'
import { DataProvider } from './store'

const NAV = [
  ['/', 'Painel'],
  ['/treino', 'Treinar'],
  ['/avaliacao', 'Avaliação'],
  ['/biblioteca', 'Competências'],
  ['/revisoes', 'Revisões'],
  ['/estatisticas', 'Estatísticas'],
  ['/historico', 'Histórico'],
  ['/explicacoes', 'Explicações'],
  ['/referencias', 'Referências'],
  ['/configuracoes', 'Configurações'],
] as const

export default function App() {
  return (
    <DataProvider>
      <HashRouter>
        <a href="#conteudo" className="sr-only focus:not-sr-only">Ir para o conteúdo</a>
        <header className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
            <strong className="text-lg">NEURO100</strong>
            <nav aria-label="Principal" className="flex flex-wrap gap-1">
              {NAV.map(([to, label]) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className="flex min-h-11 items-center rounded-lg px-2.5 text-sm"
                  style={({ isActive }) => ({ background: isActive ? 'var(--accent)' : 'transparent', color: isActive ? 'var(--accent-text)' : 'var(--text)' })}
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>
        <main id="conteudo" className="mx-auto max-w-5xl px-4 py-5">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/treino" element={<Train />} />
            <Route path="/avaliacao" element={<Assessment />} />
            <Route path="/biblioteca" element={<Library />} />
            <Route path="/revisoes" element={<Reviews />} />
            <Route path="/estatisticas" element={<Stats />} />
            <Route path="/historico" element={<History />} />
            <Route path="/explicacoes" element={<Explain />} />
            <Route path="/referencias" element={<References />} />
            <Route path="/configuracoes" element={<Settings />} />
          </Routes>
        </main>
        <footer className="mx-auto max-w-5xl px-4 pb-8 text-xs muted">
          Ferramenta de estudo pessoal. Os resultados não são avaliação clínica, não medem QI e não comprovam mudanças cognitivas.
        </footer>
      </HashRouter>
    </DataProvider>
  )
}
