import type { ReactNode } from 'react'
import { Link, useLocation } from 'wouter'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [location] = useLocation()
  const isInventoryActive = location === '/'

  return (
    <div className="app-frame">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="app-header">
        <div className="app-header__inner">
          <Link className="brand" href="/" aria-label="The Block home">
            <svg
              className="brand__mark"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path d="M3 3h29l13 13v29H3z" />
              <path d="M11 10h11c7 0 11 3 11 8 0 3-2 6-5 7 4 1 7 4 7 8 0 6-4 9-12 9H11zm8 7v6h4c2 0 3-1 3-3s-1-3-3-3zm0 12v7h5c2 0 4-1 4-4 0-2-2-3-4-3z" />
              <path d="M32 3v13h13z" />
            </svg>
            <span className="brand__type">
              <strong>The Block</strong>
              <span>Wholesale vehicle auction</span>
            </span>
          </Link>

          <nav className="primary-nav" aria-label="Primary navigation">
            <Link
              aria-current={isInventoryActive ? 'page' : undefined}
              className={
                isInventoryActive
                  ? 'primary-nav__link primary-nav__link--active'
                  : 'primary-nav__link'
              }
              href="/"
            >
              Inventory
            </Link>
          </nav>

          <div className="header-context" aria-label="Workspace context">
            <span className="header-context__signal" aria-hidden="true" />
            <span className="header-context__label">Buyer view</span>
            <strong>CAD</strong>
          </div>
        </div>
      </header>

      <main className="app-main" id="main-content">
        {children}
      </main>

      <footer className="app-footer">
        <span>The Block</span>
        <span aria-hidden="true">/</span>
        <span>Wholesale inventory</span>
        <span className="app-footer__market">Canada · CAD</span>
      </footer>
    </div>
  )
}
