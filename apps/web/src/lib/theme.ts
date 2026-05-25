// Theme and density persistence via localStorage
export type Theme = 'light' | 'dark'
export type Density = 'comfortable' | 'compact'

const THEME_KEY   = 'pi-theme'
const DENSITY_KEY = 'pi-density'

export function getStoredTheme(): Theme {
  return (localStorage.getItem(THEME_KEY) as Theme) ?? 'light'
}

export function getStoredDensity(): Density {
  return (localStorage.getItem(DENSITY_KEY) as Density) ?? 'comfortable'
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem(THEME_KEY, theme)
}

export function applyDensity(density: Density) {
  document.documentElement.classList.toggle('compact', density === 'compact')
  localStorage.setItem(DENSITY_KEY, density)
}

// Called once on app boot
export function initTheme() {
  applyTheme(getStoredTheme())
  applyDensity(getStoredDensity())
}
