---
layout: post
title: "Give a failing CI job a repair brief, not a blank cheque"
description: "A reproducible Node import failure, a narrow repair brief, and the human checks that make an agent-assisted CI repair reviewable."
date: 2026-10-14 09:00:00 +0400
---

A red CI job gives a team a symptom. It does not automatically give a coding agent a useful assignment. The first job is to identify which command failed, which environment ran it, and what evidence would distinguish a repair from a workaround.

Consider a small checkout module whose test fails before its assertion runs. The useful task is not “make CI green.” It is to restore the documented test command while preserving the behavior that the test is supposed to check.

This is an AI-assisted worked example built for this article. The failure and repair were reproduced locally with Node 22.23.2. It is not a report of a production outage, and the local result does not establish that a hosted workflow has passed.

## Capture the command and the first actionable error

Start with the failing job's revision, runtime version, installation command, and test command. Retain the first relevant error as well as the job's final status. A summary such as “tests failed” loses the difference between a broken assertion and a test file that could not load.

Here is the entire fixture. Create these files in an empty directory:

```json
{"type":"module","scripts":{"test":"node --test"}}
```

```js
// src/total.js
export function total(prices) {
  return prices.reduce((sum, price) => sum + price, 0);
}

// src/checkout.js
import { total } from './total';
export function checkout(prices) { return total(prices); }

// test/checkout.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkout } from '../src/checkout.js';
test('checkout totals prices', () => {
  assert.equal(checkout([2, 3]), 5);
});
```

Run `node --version` and `npm test`. No third-party packages are required. The observed failure included the following lines; the absolute fixture path is shortened here:

```text
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '…/src/total'
imported from …/src/checkout.js
Node.js v22.23.2
not ok 1 - test/checkout.test.js
# pass 0
# fail 1
```

The assertion is not the failure. Node cannot resolve the relative ES-module import because it omits the file extension. That diagnosis is specific to this fixture. A superficially similar CI error could instead involve an absent build artifact, a wrong path, or a dependency problem.

## Turn the diagnosis into a narrow repair brief

The person preparing the task should put the reproduction and the boundary together. The runner should not have to infer whether changing the test command, removing an assertion, or replacing the module system is acceptable.

```text
Outcome: npm test loads the checkout test and passes its existing assertion.
Reproduction: Node 22.23.2; npm test; ERR_MODULE_NOT_FOUND above.
Likely cause: extensionless relative ESM import in src/checkout.js.
Scope: correct that import; preserve checkout behavior and test coverage.
Do not: skip tests, relax assertions, change runtime, or add a loader.
Evidence: before/after command output and the small reviewed diff.
Escalate: if this fix does not reproduce the hosted job's failure or repair.
Acceptance: a reviewer checks the diff and the relevant hosted CI rerun.
```

In a real repository, add the failing commit and the exact installation step. If CI uses a lockfile, reproduce its installation procedure rather than silently regenerating the lockfile. If the logs contain credentials or private customer data, prepare a suitable excerpt instead of copying them into an unrelated tool.

## Assign execution and acceptance separately

An engineer familiar with the module prepares the brief. A teammate with authorized repository access executes it using their own coding agent and tools. A reviewer who understands the intended behavior judges acceptance.

Those responsibilities can overlap in a small team, but they still need names. Someone being available with an AI tool does not establish that they can access the failing environment or interpret the result. The runner should first confirm that the same failure occurs at the assigned revision.

For this fixture, the bounded change is:

```diff
-import { total } from './total';
+import { total } from './total.js';
```

After that change, the local run reported one passing test and zero failures. The unchanged assertion still checks that the checkout totals two prices. The repair did not add a resolver flag or suppress the test.

For project management for coding agents, attaching the reproduction, execution context, delivery evidence, and review to the same assignment makes the handoff easier to inspect. [Wagglet's engineering-team workflow](https://wagglet.com/for/engineering-teams) describes that arrangement for teams working with coding agents.

## Verify the repair in the environment that failed

The delivery should make the review possible without relying on “it works now.” Use this checklist:

- The runner reproduced the original error at the assigned revision.
- The changed import points to the existing file.
- The original assertion remains enabled and unchanged.
- The original test command succeeds after the change.
- The diff contains no unrelated dependency, runtime, or workflow changes.
- The hosted job reruns against the repaired revision.
- The reviewer checks both the code and the hosted result before acceptance.

A local pass is useful evidence, but it cannot substitute for the failing CI environment. The complete project may have other tests, generated files, or platform constraints that this small fixture does not model. Run its required checks and record any remaining failure explicitly.

The value of the repair brief is its stopping condition. If adding the extension leaves CI red, the runner should return the new evidence and reopen the diagnosis. A green badge obtained by disabling the check does not satisfy the original assignment.
