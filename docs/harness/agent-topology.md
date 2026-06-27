# Multi-Agent Execution Harness

Use multi-agent mode for implementation work that has separable ownership or benefits from independent review. The control-plane agent remains accountable for scope, integration, gate selection, and final evidence.

## Roles

### Control-Plane Agent

Owns:

- task contract and acceptance criteria;
- PRD and harness alignment;
- work decomposition;
- branch, commit, and final handoff;
- final quality gate decision.

Rules:

- Do not delegate the same file ownership to multiple workers.
- Do not accept sub-agent claims without checking changed files or evidence.
- Convert repeated sub-agent confusion into harness updates.

### Spec Agent

Owns:

- PRD deltas;
- command semantics;
- edge cases and non-goals;
- acceptance criteria.

Use when:

- behavior scope is ambiguous;
- a feature might imply impossible path-scoped pull/push semantics;
- destructive behavior needs explicit user-facing rules.

### Test Agent

Owns:

- failing tests;
- Git fixture design;
- VS Code test-host coverage;
- quality gate additions.

Use when:

- a feature touches Git state;
- a bug needs a regression test;
- the implementation agent should not write its own only proof.

### Implementation Agent

Owns:

- source files for one feature slice;
- minimal code to pass focused tests;
- no broad refactors without control-plane approval.

Use when:

- tests and spec are already clear;
- file ownership can be bounded.

### Verification Agent

Owns:

- running gates in a clean state;
- classifying failures;
- verifying release evidence;
- trying UI smoke with computer-use when needed.

Use when:

- implementation and test work are complete enough to validate;
- the control-plane agent needs independent failure classification.

## Parallel Strategy

Run in parallel only when write sets and questions are independent:

- Spec Agent and Test Agent may run in parallel after PRD read.
- Implementation Agent may start only after the relevant failing test or explicit task contract exists.
- Verification Agent may run focused gates while another agent works on a disjoint feature.
- Two Implementation Agents may run in parallel only with disjoint file ownership.

Prefer serial execution for:

- command semantics;
- destructive restore behavior;
- commit safety;
- repository discovery primitives used by multiple features.

## Retry Strategy

On gate failure:

1. Stop adding feature scope.
2. Classify failure as implementation defect, spec gap, missing test, environment issue, or harness gap.
3. Retry once with the smallest fix by the owning agent.
4. On second failure of the same class, involve a Verification Agent or Spec Agent.
5. On third failure of the same class, update harness gotchas/checks before continuing.

Retry limits:

- max 2 implementation retries before independent review;
- max 1 blind dependency reinstall before environment classification;
- max 0 destructive Git cleanup attempts without explicit control-plane approval.

## Fallback Strategy

- If VS Code Git API is unavailable, use Git CLI with array arguments.
- If Extension Development Host tests are unavailable, run temp-repo CLI integration tests and mark VS Code UI gate degraded.
- If computer-use UI smoke cannot run, provide command-level evidence and mark release confidence below Deliverable.
- If network remotes are unavailable, use local bare repositories for pull tests.
- If nested-repo discovery is slow, lower fixture depth first, then add performance follow-up.
- If package tooling is missing, report scaffold incompleteness and keep release confidence below Candidate.
- If workspace trust cannot be simulated in automated tests, require a documented Extension Development Host or computer-use smoke before release.

## Exit Strategy

A feature slice may exit only when:

- acceptance criteria are met or explicitly narrowed;
- focused tests pass;
- full harness passes or degraded gates are named;
- changed files are reviewed by the control-plane agent;
- evidence is recorded in the handoff.

A release candidate may exit only when:

- all MVP acceptance criteria in `docs/PRD.md` have behavior-level evidence;
- no operation can affect paths outside the selected folder without an explicit test proving the exception;
- UI command wiring is verified in VS Code test host or computer-use smoke;
- `docs/harness/learnings.md` contains any loop repairs discovered during the work.
