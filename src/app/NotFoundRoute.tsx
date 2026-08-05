import { Link } from 'wouter'

interface NotFoundRouteProps {
  eyebrow?: string
  title?: string
  description?: string
  linkLabel?: string
}

export function NotFoundRoute({
  eyebrow = '404 / Off the block',
  title = 'That lot is not in this lane.',
  description =
    'The page may have moved, or the vehicle is no longer part of this auction view.',
  linkLabel = 'Return to inventory',
}: NotFoundRouteProps) {
  return (
    <section className="route-message" aria-labelledby="not-found-title">
      <p className="eyebrow">{eyebrow}</p>
      <h1 id="not-found-title" tabIndex={-1}>
        {title}
      </h1>
      <p>{description}</p>
      <Link className="text-link" href="/">
        <span aria-hidden="true">←</span> {linkLabel}
      </Link>
    </section>
  )
}
