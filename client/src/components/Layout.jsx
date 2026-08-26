import { NavLink, Outlet } from 'react-router-dom'
import { Button, useTheme } from '@heroui/react'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/map', label: 'Live Map' },
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/recommendations', label: 'Intelligence' },
  { to: '/home', label: 'My Home' },
]

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme('dark')
  const isDark = resolvedTheme === 'dark'

  if (!resolvedTheme) return <div aria-hidden className="h-9 w-16" />

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? 'Light' : 'Dark'}
    </Button>
  )
}

export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <span className="font-serif text-xl font-semibold tracking-tight">
            GridShare
          </span>

          <nav className="flex items-center gap-1 rounded-full border border-border bg-surface p-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground/70 hover:text-foreground'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}
