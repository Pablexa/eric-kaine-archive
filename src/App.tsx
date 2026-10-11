import { ExperienceProvider } from './lib/experience/ExperienceContext'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { Hero } from './components/professional/Hero'
import { Featured } from './components/professional/Featured'
import { Streams } from './components/professional/Streams'
import { About } from './components/professional/About'
import { Archive } from './components/professional/Archive'
import { Links } from './components/professional/Links'
import { TrollLayer } from './components/troll/TrollLayer'
import { VerityOrb } from './components/troll/VerityOrb'

function ColumnRules() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 hidden lg:block" aria-hidden="true">
      <div className="shell grid-12 h-full">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={`h-full border-l border-paper/[0.035] ${i === 11 ? 'border-r' : ''}`} />
        ))}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ExperienceProvider>
      <a href="#latest" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:bg-paper focus:px-4 focus:py-2 focus:text-ink">
        Skip to content
      </a>
      <ColumnRules />
      <Header />
      <main className="relative z-[1]">
        <Hero />
        <Featured />
        <Streams />
        <About />
        <Archive />
        <Links />
      </main>
      <div className="relative z-[1]">
        <Footer />
      </div>
      <TrollLayer />
      <VerityOrb />
      <div className="grain" aria-hidden="true" />
    </ExperienceProvider>
  )
}
