import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fonte da identidade "Executivo" (ADR-017) — requer: pnpm --filter web add @fontsource/schibsted-grotesk
import '@fontsource/schibsted-grotesk/400.css'
import '@fontsource/schibsted-grotesk/500.css'
import '@fontsource/schibsted-grotesk/600.css'
import '@fontsource/schibsted-grotesk/700.css'
import '@fontsource/schibsted-grotesk/800.css'
import './index.css'
import App from './App'
import { initTheme } from './lib/theme'

// Apply persisted theme/density before first render — prevents flash
initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
