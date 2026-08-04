import { Link } from 'wouter'

export function NotFoundRoute() {
  return (
    <section className="route-message" aria-labelledby="not-found-title">
      <p className="eyebrow">404 / Off the block</p>
      <h1 id="not-found-title">That lot is not in this lane.</h1>
      <p>
        The page may have moved, or the vehicle is no longer part of this
        auction view.
      </p>
      <Link className="text-link" href="/">
        <span aria-hidden="true">←</span> Return to inventory
      </Link>
    </section>
  )
}
