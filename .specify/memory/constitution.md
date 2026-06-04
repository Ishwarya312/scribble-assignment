<!--
  Sync Impact Report
  ==================
  Version change: 0.0.0 (template) → 1.0.0
  Modified principles: N/A (no previous principles — this is the initial fill)
  Added sections:
    - Principle I: Spec-First Development
    - Principle II: Deterministic Game Logic
    - Principle III: Test-Before-Implement
    - Principle IV: Brownfield Respect
    - Principle V: Incremental Delivery
    - Technical Constraints section
    - Development Workflow section
    - Governance section (fully populated)
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md: ✅ Already references generic "Constitution Check" — no change needed
    - .specify/templates/spec-template.md: ✅ Generic sections, no principle-specific references
    - .specify/templates/tasks-template.md: ✅ Generic task structure, no principle-specific references
    - .opencode/commands/speckit.constitution.md: ✅ No CLAUDE-specific references found
  Follow-up TODOs: N/A — all placeholders resolved
-->

# Scribble Constitution

## Core Principles

### I. Spec-First Development

Every feature MUST begin with specification artifacts produced in this order:

1. Discovery notes — document gaps, assumptions, relevant files, missing tests,
   edge cases, and risks
2. Specification — define user scenarios, acceptance criteria, requirements,
   and success criteria
3. Plan — model the state changes, data flow, and file-level changes
4. Tasks — decompose the plan into ordered, testable work

No implementation MAY begin until all preceding artifacts are committed and
reviewed. A feature is not complete until its acceptance criteria pass.

**Rationale**: The lab evaluates artifact consistency and traceability to
implementation. Skipping steps creates drift between spec, plan, tasks, and
code that the rubric penalizes.

### II. Deterministic Game Logic

All game mechanics MUST be deterministic:

- Drawer assignment MUST use a repeatable rule (e.g., first participant in the
  participant list or host-first) — NOT random selection.
- Secret word selection MUST use a deterministic formula (e.g., round index
  modulo word list length) — NOT random selection.
- Scoring MUST be fixed: 100 points per correct guess, 0 for incorrect, no
  speed bonuses or penalties.
- Guess comparison MUST be case-insensitive after trimming whitespace.

**Rationale**: Deterministic rules enable reproducible testing, consistent
multiplayer behavior across clients, and clear acceptance criteria. Randomness
makes bugs non-deterministic and validation impossible.

### III. Test-Before-Implement (NON-NEGOTIABLE)

Tests MUST be written and observed to FAIL before the implementation code is
written. The test-implement cycle:

1. Write the test against the acceptance criteria
2. Run the test and confirm it fails (red)
3. Implement the minimal code to pass the test
4. Run the test and confirm it passes (green)
5. Commit before moving to the next test

Coverage requirements:

- Every backend route MUST have at minimum one integration-level test
- Every Zod schema MUST have validation tests (valid input, invalid input,
  edge cases)
- Every frontend store mutation MUST have a unit test
- Every polling lifecycle (start, tick, cleanup) MUST be tested
- Multi-room isolation MUST be verified by at least one test

### IV. Brownfield Respect

All implementation MUST work within the existing starter codebase:

- DO NOT rewrite existing files from scratch — extend, refactor minimally
- DO NOT add new top-level dependencies unless justified in the plan
  and reviewed
- DO NOT restructure the project directory layout
- DO NOT replace existing routing, state management, or styling approaches
- If a change requires touching a file outside the intended feature scope,
  document the deviation in the plan and commit separately

**Rationale**: The project is a brownfield enhancement exercise. The evaluation
assesses the ability to work within constraints, not to rebuild from scratch.

### V. Incremental Delivery

Implement and validate features in small, independent, testable slices:

- Each commit MUST represent one logical, working change
- Each feature group (lobby, game start, gameplay, result) MUST be completable
  and testable in isolation
- No commit MAY leave the application in a broken state (build must pass,
  existing behavior must not regress)
- Commit messages MUST be descriptive and reference the spec or task ID
  (e.g., "feat: add host tracking to room model (FR-005)")

**Rationale**: Granular commits are explicitly encouraged in the README and
are what reviewers assess. Incremental delivery ensures each slice is
validatable before the next begins.

## Technical Constraints

The following constraints are strictly enforced. Violations MUST be rejected
during review:

- **No WebSockets**: All client-server sync MUST use HTTP polling. Do not use
  Socket.io, WebSocket API, Server-Sent Events, or any real-time push protocol.
- **No Databases**: All data MUST be stored in-memory only. Do not use SQLite,
  PostgreSQL, Redis, file-based storage, or any persistence layer.
- **No Authentication**: Do not add user accounts, sessions, JWT, OAuth2,
  API keys, or any authentication/authorization mechanism.
- **No New State Libraries**: Use only React Context + useSyncExternalStore
  (the starter pattern). Do not add Zustand, Redux, MobX, or other state
  management libraries.
- **No Multi-Round Features**: Do not implement drawer rotation, round
  timers, countdowns, speed bonuses, or multiple rounds. Each game is one
  round from lobby through result.

These boundaries keep the lab at a focused, medium difficulty level.
Out-of-scope work creates drift between spec, plan, tasks, and code.

## Development Workflow

1. **Discovery**: Read the relevant starter files; document gaps, assumptions,
   relevant files, missing tests, edge cases, and risks in discovery notes.
2. **Specify**: Update the specification with acceptance criteria for the
   feature group. Produce or update the spec markdown.
3. **Clarify**: Resolve ambiguity in the specification before planning.
4. **Plan**: Update the implementation plan — state model, data flow,
   file-level changes, testing strategy, risks.
5. **Tasks**: Decompose the plan into ordered, testable work items.
6. **Implement**: Complete one meaningful slice at a time. Test-before-implement
   (Principle III). Commit after each slice.
7. **Validate**: Verify acceptance criteria using two browser tabs for
   multiplayer flows.
8. **Move forward** only after the current scenario passes.

Each feature group follows this loop in order. Do not skip phases.

## Governance

- **Supremacy**: This constitution supersedes all plans, tasks, and ad-hoc
  instructions. Any conflict MUST be resolved by amending the constitution,
  not by overriding it in a plan or task.
- **Amendment procedure**: To amend, open a PR against this file. The PR must
  document: (a) what changed, (b) why it changed, (c) version bump rationale,
  and (d) impact on dependent templates. Amendments require review and
  explicit approval.
- **Versioning**: Follow semantic versioning:
  - MAJOR: Backward-incompatible governance or principle removals/redefinitions
  - MINOR: New principle or section added, or materially expanded guidance
  - PATCH: Clarifications, wording fixes, non-semantic refinements
- **Compliance review**: Every PR MUST verify that implementation matches
  this constitution. Reviewers MUST check:
  - No forbidden technologies (WebSockets, DB, auth, etc.)
  - Spec-first artifacts are present and up to date
  - Tests exist and fail before implementation
  - Implementation is incremental (one commit = one logical slice)
  - Brownfield constraints respected (no rewrites, no new deps)
- **Complexity justification**: If a principle must be relaxed for a specific
  feature, the plan MUST include a Complexity Tracking table documenting the
  violation, why it is needed, and what simpler alternative was rejected.

**Version**: 1.0.0 | **Ratified**: 2026-06-04 | **Last Amended**: 2026-06-04
