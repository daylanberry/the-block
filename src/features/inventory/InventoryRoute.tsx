const workflow = [
  {
    index: '01',
    label: 'Discover',
    title: 'Find the right lot',
    description: 'Search the full wholesale inventory without losing context.',
  },
  {
    index: '02',
    label: 'Inspect',
    title: 'Read the risk',
    description: 'Condition, title, and damage stay visible beside the price.',
  },
  {
    index: '03',
    label: 'Bid',
    title: 'Act with clarity',
    description: 'Review the next valid amount before committing a bid.',
  },
] as const

export function InventoryRoute() {
  return (
    <>
      <section className="inventory-intro" aria-labelledby="inventory-title">
        <div className="inventory-intro__copy">
          <p className="eyebrow">Buyer workspace / Canada</p>
          <h1 id="inventory-title">Wholesale inventory</h1>
          <p className="inventory-intro__lede">
            Inspect condition, title risk, and bid position before you act.
          </p>
        </div>

        <aside className="market-docket" aria-label="Auction workspace details">
          <div className="market-docket__heading">
            <span>Buyer docket</span>
            <strong>01</strong>
          </div>
          <dl>
            <div>
              <dt>Market</dt>
              <dd>Canada</dd>
            </div>
            <div>
              <dt>Currency</dt>
              <dd>CAD</dd>
            </div>
            <div>
              <dt>View</dt>
              <dd>Buyer</dd>
            </div>
          </dl>
          <p className="market-docket__status">
            <span aria-hidden="true" />
            Auction workspace ready
          </p>
        </aside>
      </section>

      <section className="workflow-board" aria-labelledby="workflow-title">
        <header className="workflow-board__header">
          <div>
            <p className="eyebrow">Core workflow</p>
            <h2 id="workflow-title">Inspect before you bid</h2>
          </div>
          <p>
            Searchable inventory and live bid state will share one focused
            workspace.
          </p>
        </header>

        <div className="workflow-grid">
          {workflow.map((step) => (
            <article className="workflow-step" key={step.index}>
              <div className="workflow-step__meta">
                <span>{step.index}</span>
                <span>{step.label}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
