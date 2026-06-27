# Agent Routing

Mission-critical rule: Click Git work is complete only when the changed behavior is proven with mechanically checkable evidence. Build output, prose, and screenshots are supporting evidence; they do not replace tests that exercise real Git repositories and VS Code command flows.

## Start Here

- Product scope lives in `docs/PRD.md`.
- Quality gates live in `docs/harness/quality-gates.md`.
- Multi-agent execution rules live in `docs/harness/agent-topology.md`.
- Repeated workflow playbooks live in `docs/harness/playbooks.md`.
- Project-specific traps live in `docs/harness/gotchas.md`.
- Record meaningful failures or loop repairs in `docs/harness/learnings.md`.
- Run `.\scripts\check.ps1` before handoff whenever code, tests, package metadata, or harness checks change.

## Product Boundary

MVP means Explorer-first, folder-scoped Git commands:

- stage, unstage, commit, restore, status, and diff using explicit Git pathspecs;
- pull the owning repository;
- discover and pull nested repositories under a selected folder.

MVP does not mean true subfolder-only pull or push inside one repository. Git pull and push are repository/ref scoped. Do not imply path-scoped pull or push unless the implementation uses a real Git feature such as subtree and the PRD has been updated.

MVP also does not enforce folder isolation outside commands that Click Git itself runs. Do not claim protection against terminal Git commands, VS Code SCM actions, other extensions, Git aliases, hooks, or external Git clients.

## Standard Loop

1. Scout read-only: inspect `docs/PRD.md`, this harness, package scripts, tests, and relevant source.
2. Write or update the spec first when behavior changes: command contract, acceptance criteria, and failure modes.
3. Write a failing test or fixture before implementation when code exists.
4. Implement the smallest change that can satisfy the focused test.
5. Run the focused gate, then the full harness gate.
6. If a gate fails, stop broad implementation, classify the failure, fix the smallest responsible thing, and rerun.
7. If the same failure class can recur, update `docs/harness/gotchas.md`, `docs/harness/playbooks.md`, or `scripts/check.ps1`.
8. Handoff with exact evidence, residual risks, and any degraded gates.

## Gate Outcomes

- Pass: exact command or artifact proves the acceptance criteria.
- Fail: implementation, spec, test, environment, or harness must change before expansion.
- Blocked: state the missing dependency, credential, workspace trust, VS Code runtime, or user decision.
- Degraded: state the skipped behavior-level proof and do not claim production readiness.

## Key Commands

- Full harness: `.\scripts\check.ps1`
- After a Node extension scaffold exists, this script must run install checks, typecheck, lint, unit tests, extension integration tests, and fixture Git behavior tests.
- Behavior evidence must include real temporary Git repositories, not mocked command strings only.
- Packaging evidence is required for release candidates once the extension scaffold exists: run the project package command, such as `vsce package` or `npm run package`.

## Project Map

- `docs/PRD.md`: product scope and MVP acceptance.
- `docs/harness/quality-gates.md`: required test strategy and release gates.
- `docs/harness/agent-topology.md`: control-plane and worker-agent coordination rules.
- `docs/harness/playbooks.md`: repeatable loops for implementation, tests, and release verification.
- `docs/harness/gotchas.md`: project-specific failure modes.
- `docs/harness/learnings.md`: loop repair log.
- `scripts/check.ps1`: local aggregate quality gate.
- Future extension scaffold: must include package scripts for typecheck, lint, unit tests, Git fixture tests, VS Code extension tests, and package verification.

## Evidence Standard

For a deliverable implementation, prefer evidence in this order:

1. Automated tests using temp Git repositories and real `git` commands.
2. VS Code extension integration tests invoking registered commands.
3. Sandbox/manual UI proof through VS Code or computer-use only after automated command-level gates pass.
4. Build, lint, and typecheck.
5. Screenshots or prose summaries only as supporting context.
