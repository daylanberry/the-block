# AGENTS.md

## Sources of Truth

Before changing the project, read:

1. `PLAN.md` for scope, phase ownership, acceptance criteria, and the execution log.
2. `DESIGN.md` for the product thesis, interaction contract, and visual system.
3. `README.md`, `SUBMISSION.md`, and `WALKTHROUGH.md` for the original challenge requirements. After Phase 6, the original `README.md` lives at `docs/CHALLENGE.md`.

If these documents conflict, preserve the challenge requirements first, then ask the project owner before changing product scope.

## Toolchain and Commands

Phase 0 must establish this contract:

- Application location: repository root; do not create a nested `app/` or `client/` project.
- Package manager: npm with one committed `package-lock.json`.
- Runtime: Node 24 LTS via `.nvmrc`; `package.json` may also accept supported Node 22 releases from `22.12.0` onward.

After Phase 0, use these commands:

- `npm run dev` — start the Vite development server.
- `npm test` — run the Vitest suite once.
- `npm run test:watch` — run Vitest in watch mode.
- `npm run typecheck` — run TypeScript without emitting output.
- `npm run lint` — run ESLint.
- `npm run build` — type-check and create the production build.
- `npm run preview` — serve the production build locally for final smoke testing.

These commands are a scaffold requirement, not available commands until Phase 0 creates `package.json`.

## Working Agreement

- Start by checking `git status` and the latest commits. Never overwrite another assistant's uncommitted work.
- Work only on the phase or bounded task assigned by the project owner.
- Optimize for one obvious buyer journey: find a vehicle, assess its risk, and place a bid.
- Prefer the simplest real user action. If a flow requires explanatory copy to be usable, simplify the flow.
- Keep business rules in the domain layer instead of duplicating them inside components.
- Treat `data/vehicles.json` as source data. Normalize values in application code rather than editing the dataset.
- Do not add backend, authentication, payment, seller, admin, or realtime scope unless the project owner explicitly changes the plan.
- Do not expose exact reserve prices or create nonfunctional actions such as a dead Buy Now button.
- Preserve responsive behavior, keyboard access, visible focus, semantic HTML, and reduced-motion support.
- After editing, remove abandoned components, styles, copy, and dependencies from previous attempts.
- Run the checks appropriate to the phase and report both what passed and what was not run.
- Update the relevant checklist and execution-log row in `PLAN.md` at the end of a completed phase.
- Do not push, open a pull request, or begin another phase without direction from the project owner.

## Collaboration

- Codex and Claude work sequentially on shared files, never concurrently.
- A handoff must state the current phase, changed files, verification performed, remaining risks, and working-tree state.
- Review-only requests do not authorize code changes.
- Suggestions from either assistant do not silently expand the agreed scope.
