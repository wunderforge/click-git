# Playbooks

Use these playbooks for repeated Click Git workflows. Keep them tied to real files, commands, and evidence.

## Playbook: New Git Command

Use when:

- adding or changing a folder-scoped command such as stage, unstage, commit, restore, status, or diff.

Steps:

1. Read `docs/PRD.md`, `docs/harness/quality-gates.md`, and relevant gotchas.
2. Write a task contract using `docs/harness/task-contract.md`.
3. Add a failing fixture test using a disposable Git repository.
4. Implement command logic with array arguments and `--` pathspec separator.
5. Run the focused test.
6. Run `.\scripts\check.ps1`.
7. Record any reusable failure in `docs/harness/learnings.md`.

Do not:

- use shell interpolation for Git pathspecs;
- claim success from mocked Git calls only;
- skip unrelated staged-file tests for commit behavior.

## Playbook: Pull Or Nested Pull

Use when:

- changing owning-repo pull or nested-repo pull behavior.

Steps:

1. State the repository boundary: pull is repo-scoped, not path-scoped.
2. Add or update local bare-remote fixtures.
3. Cover clean fast-forward, dirty skip, missing upstream, and non-fast-forward failure.
4. Keep pulls sequential unless a tested concurrency limit exists.
5. Summarize succeeded, skipped, and failed repos separately.
6. Run focused pull tests and `.\scripts\check.ps1`.

Do not:

- call `git pull <folder>`;
- auto-merge dirty nested repos by default;
- use network remotes in tests when local bare remotes can prove behavior.

## Playbook: VS Code Command Wiring

Use when:

- changing `package.json` contributions, command registration, context menu visibility, or output channel behavior.

Steps:

1. Define expected command ID, title, and Explorer visibility.
2. Add a VS Code extension test that invokes the command.
3. Use temp workspace fixtures rather than the developer's real repo.
4. Verify the output channel or user-facing error path when command fails.
5. For release candidates, run a computer-use or Extension Development Host smoke test.

Do not:

- rely only on visual inspection of `package.json`;
- run destructive commands against the working repository.

## Playbook: Multi-Agent Feature Slice

Use when:

- a feature has separable spec, test, implementation, and verification work.

Steps:

1. Control-plane agent writes a compact task contract.
2. Spec Agent reviews command semantics and non-goals.
3. Test Agent owns failing tests and fixtures.
4. Implementation Agent owns source files for the feature slice.
5. Verification Agent runs gates and classifies failures.
6. Control-plane agent integrates, reviews changed files, and records evidence.

Do not:

- let multiple agents edit the same files in parallel;
- let implementation begin before acceptance criteria and at least one focused test are clear;
- accept a worker's "tests passed" without exact command evidence.

## Playbook: Gate Failure Loop Repair

Use when:

- a check fails, hangs, flakes, or reveals missing acceptance criteria.

Steps:

1. Stop broad implementation.
2. Classify the failure: implementation, spec, missing test, environment, or harness.
3. Fix the smallest responsible thing.
4. Rerun the failed gate.
5. If the class is reusable, update a gotcha, playbook, fixture, or `scripts/check.ps1`.
6. Append a short learning when the failure changed future behavior.

Do not:

- retry the same command repeatedly without a hypothesis;
- broaden implementation while the gate is red;
- mark blocked until the same blocker is genuinely outside the repo or environment.

## Playbook: Release Candidate Verification

Use when:

- preparing a build that might be called deliverable.

Steps:

1. Run `.\scripts\check.ps1`.
2. Run the package command once the scaffold exists, such as `vsce package` or `npm run package`.
3. Install or launch the extension in an Extension Development Host.
4. Use a disposable workspace with a temp Git repo.
5. Trigger at least one Explorer context-menu command through UI or VS Code command invocation.
6. Verify output channel, notification behavior, and repo state.
7. Record any manual/computer-use evidence as supporting evidence only.

Do not:

- call a release deliverable when VS Code command wiring has only been reviewed statically;
- skip failure-path tests for missing Git, missing upstream, non-fast-forward pull, dirty repo skip, canceled restore, or empty commit message.
