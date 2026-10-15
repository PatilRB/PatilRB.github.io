---
layout: post
title: "Before repairing CI, reproduce its working directory"
description: "A two-directory Node fixture turns a file-lookup failure into a bounded coding-agent repair and a clear acceptance check."
date: 2026-10-15 12:00:00 +0400
canonical_url: https://patilrb.github.io/2026/10/15/reproduce-the-ci-working-directory.html
---

A test can pass from a project's root and fail when another command launches it from a different directory. The code did not change. Its assumption about where to find a file did.

Before asking a coding agent to repair that failure, capture the invocation that makes the difference. A precise working-directory reproduction gives the runner a small problem to execute and the reviewer a clear boundary to accept.

Disclosure: this article was prepared with AI assistance for a Wagglet marketing assignment. The example and results come from an original local fixture. They do not describe a production incident or a hosted CI run.

## Make the hidden dependency visible

Suppose a module reads a receipt stored beside its source file:

```js
import { readFileSync } from 'node:fs';
export function readReceipt() {
  return JSON.parse(readFileSync('ci-receipt.json', 'utf8'));
}
```

The receipt contains `{"suite":"artifact-check","passed":3}`. From the fixture directory, this reader returns the expected object. From an empty temporary directory, it throws an `ENOENT` error because the relative filename is resolved against the process's working directory.

The number three is test data inside the receipt, not a claim that a real CI suite passed three checks. Keeping that distinction visible prevents a demonstration artifact from turning into invented delivery evidence.

<p><a download="W-411-working-directory-source.zip" href="data:application/zip;base64,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">Download the complete working-directory example (ZIP)</a></p>

Unzip the source into an empty folder. It contains the broken reader, corrected reader, receipt, complete test file, and a short README. With Node.js 22 available, run the original:

```sh
node --test receipt-path.test.mjs
```

The two tests launch a child Node process with the same absolute module URL. One uses the fixture directory as its working directory; the other uses a newly created empty temporary directory. The test removes its own temporary directory afterward. No package installation or CI account is required.

## Preserve the useful failure log

The local run used Node.js 22.23.2 on a Mac. The original returned exit code 1 with this outcome:

```text
ok 1 - receipt loads from its own directory
not ok 2 - receipt loads from a different working directory
# tests 2
# pass 1
# fail 1
```

The failed child process reported an `ENOENT` error opening `ci-receipt.json`. The log identifies a file lookup problem. It does not justify reinstalling dependencies, relaxing assertions, or editing the CI workflow before checking the reader's path contract.

For an actual job, attach the exact command and working directory alongside the relevant error excerpt. Include the runtime version and the location where the receipt is supposed to exist. Remove credentials and unrelated job output before handing over the evidence.

## Decide which location is the contract

The fixture's contract says the receipt belongs beside the reader module. That decision matters. Some applications intentionally read a file relative to the caller's directory; others receive its path as an argument. A coding agent should not choose between those designs simply because one change makes the current test green.

The human preparer confirms the intended location and records these limits:

- Keep the receipt's contents and both tests unchanged.
- Change only the reader's path resolution.
- Preserve errors for a genuinely missing or malformed receipt.
- Avoid workflow, dependency, deployment, or access changes.

The agent then executes through the tools and workspace already authorized for it. The preparer supplies context; a named maintainer judges the resulting patch and acceptance evidence.

## Give the agent an executable repair brief

```text
Observed: the original reader passes in its own directory and
fails from an empty temporary directory with ENOENT.

Required: read the receipt beside the module, independently
of the calling process's working directory.

Allowed change: reader implementation only. Preserve the
receipt and both assertions. No workflow or dependency edits.

Deliver: exact commands, exit codes, two-test summaries,
changed files, and the checks that remain outside this fixture.

Stop: if the real project expects a caller-selected path or
generates the receipt elsewhere, return that contract question.
```

This is the useful unit of **coding agent task management**: a reproducible observation, an agreed contract, and evidence another person can inspect. The [Wagglet engineering teams guide](https://wagglet.com/for/engineering-teams) is relevant when a team wants those instructions and the human review role to travel together. The local example still needs its own command, constraints, and reviewer.

## Verify the smallest correction

For the stated contract, the corrected reader resolves the receipt relative to the module:

```js
import { readFileSync } from 'node:fs';
export function readReceipt() {
  return JSON.parse(readFileSync(
    new URL('./ci-receipt.json', import.meta.url), 'utf8'
  ));
}
```

Run the same tests against the candidate:

```sh
CANDIDATE=./reader-fixed.mjs node --test receipt-path.test.mjs
```

This local candidate returned exit code 0: two tests passed and zero failed. Both child processes printed the same receipt fields. The correction does not copy files into the working directory or catch the error and substitute a successful result.

## Close the handoff with an acceptance decision

The maintainer should inspect the path change, rerun both candidate tests, and confirm the baseline still demonstrates the failure. The human runner records that evidence with the changed filename and the agreed contract.

A real CI repair has another step: confirm the job actually imports this reader and rerun that job through an authorized account. These local checks establish path independence for this fixture. They do not test artifact upload, a generated receipt's location, packaging, another operating system, or a deployment.

Accept the bounded change when its evidence matches the contract. If the real job writes the receipt somewhere else, return the task with that specific observation instead of widening the patch until an unrelated command turns green.
