import { useEffect, useRef, type ReactNode } from "react";
import { Link, useLocation } from "wouter";

import { useAppSelector } from "../app/hooks";
import { selectUserBidVehicleCount } from "../features/bidding/bidSessionSlice";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [location] = useLocation();
  const userBidVehicleCount = useAppSelector(selectUserBidVehicleCount);
  const mainRef = useRef<HTMLElement>(null);
  const previousLocationRef = useRef(location);
  const isInventoryActive = location === "/";
  const isMyBidsActive = location === "/bids";
  const bidVehicleLabel =
    userBidVehicleCount === 1 ? "vehicle" : "vehicles";

  useEffect(() => {
    if (previousLocationRef.current === location) {
      return;
    }

    previousLocationRef.current = location;
    mainRef.current?.querySelector<HTMLHeadingElement>("h1")?.focus();
  }, [location]);

  return (
    <div className="app-frame">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="app-header">
        <div className="app-header__inner">
          <Link className="brand" href="/" aria-label="The Block home">
            <svg className="brand__mark" viewBox="0 0 48 48" aria-hidden="true">
              <path
                className="brand__ring-light"
                d="M13.4 13.4A15 15 0 1 1 13.4 34.6"
              />
              <path
                className="brand__ring-dark"
                d="M11.7 32.6A15 15 0 0 1 11.7 15.4"
              />
            </svg>
            <span className="brand__type">
              <strong>The Block</strong>
              <span>Wholesale vehicle auction</span>
            </span>
          </Link>

          <nav className="primary-nav" aria-label="Primary navigation">
            <Link
              aria-current={isInventoryActive ? "page" : undefined}
              className={
                isInventoryActive
                  ? "primary-nav__link primary-nav__link--active"
                  : "primary-nav__link"
              }
              href="/"
            >
              Inventory
            </Link>
            <Link
              aria-current={isMyBidsActive ? "page" : undefined}
              className={
                isMyBidsActive
                  ? "primary-nav__link primary-nav__link--active"
                  : "primary-nav__link"
              }
              href="/bids"
            >
              <span>My bids</span>
              <span className="primary-nav__count" aria-hidden="true">
                {userBidVehicleCount}
              </span>
              <span className="visually-hidden">
                {userBidVehicleCount} {bidVehicleLabel} with bids this session
              </span>
            </Link>
          </nav>

          <div className="header-context">
            <span className="header-context__signal" aria-hidden="true" />
            <span className="header-context__label">Buyer view</span>
            <strong>CAD</strong>
          </div>
        </div>
      </header>

      <main
        ref={mainRef}
        className="app-main"
        id="main-content"
        tabIndex={-1}
      >
        {children}
      </main>

      <footer className="app-footer">
        <span>The Block</span>
        <span aria-hidden="true">/</span>
        <span>Wholesale inventory</span>
        <span className="app-footer__market">Canada · CAD</span>
      </footer>
    </div>
  );
}
