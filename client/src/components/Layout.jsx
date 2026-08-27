import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Button, Card, Chip, Drawer, useTheme } from '@heroui/react'
import PageSkeleton from './PageSkeleton.jsx'
import { MenuIcon } from './icons.jsx'
import { useCommunity } from '../context/useCommunity.js'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/map', label: 'Live Map' },
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/recommendations', label: 'Intelligence' },
  { to: '/home', label: 'My Home' },
]

function BackendUnreachable() {
  return (
    <Card>
      <Card.Content className="space-y-2 py-10 text-center">
        <p className="font-medium">Can&apos;t reach the backend</p>
        <p className="text-sm text-muted">
          The simulation server isn&apos;t responding. Start it with <code className="rounded bg-surface-secondary px-1 py-0.5">node server/app.js</code> and this page will connect automatically.
        </p>
      </Card.Content>
    </Card>
  )
}

function ThemeToggle({ fullWidth = false }) {
  const { resolvedTheme, setTheme } = useTheme('light')
  const isDark = resolvedTheme === 'dark'

  if (!resolvedTheme) return <div aria-hidden className="h-9 w-16" />

  return (
    <Button
      variant="outline"
      size="sm"
      fullWidth={fullWidth}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? 'Light' : 'Dark'}
    </Button>
  )
}

function NavPills() {
  return (
    <nav className="hidden items-center gap-1 rounded-full border border-border bg-surface p-1 lg:flex">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
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
  )
}

function NavDrawer({ isOpen, onOpenChange }) {
  return (
    <Drawer isOpen={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Backdrop>
        <Drawer.Content placement="right">
          <Drawer.Dialog>
            <Drawer.Header>
              <Drawer.Heading>Menu</Drawer.Heading>
              <Drawer.CloseTrigger />
            </Drawer.Header>
            <Drawer.Body className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => onOpenChange(false)}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-foreground/70 hover:text-foreground'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="flex items-center justify-between border-t border-border px-4 pt-4">
                <span className="text-sm text-muted">Theme</span>
                <ThemeToggle />
              </div>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  )
}

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { status } = useCommunity()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:gap-6 sm:px-6">
          <span className="shrink-0 font-serif text-xl font-semibold tracking-tight">
            GridShare
          </span>

          <NavPills />

          <div className="flex items-center gap-3">
            {status === 'reconnecting' && (
              <Chip color="warning" variant="soft" size="sm">Reconnecting…</Chip>
            )}
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
            >
              <MenuIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <NavDrawer isOpen={isMenuOpen} onOpenChange={setIsMenuOpen} />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {status === 'connecting' && <PageSkeleton />}
        {status === 'failed' && <BackendUnreachable />}
        {(status === 'open' || status === 'reconnecting') && <Outlet />}
      </main>
    </div>
  )
}
