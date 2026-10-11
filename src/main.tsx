import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import App from './App'
import { installPointer } from './lib/interactions/pointer'
import { soundOnByDefault } from './lib/audio/sfx'
import './styles/index.css'

installPointer()
soundOnByDefault()

// Always start at the top: the experience assumes a fresh archive.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
)
