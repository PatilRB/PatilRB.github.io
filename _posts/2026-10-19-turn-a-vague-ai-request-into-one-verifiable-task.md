---
layout: post
title: "Replace ‘make it better’ with one result someone can verify"
description: "A worked example for turning an ambiguous AI request into a bounded change, a reproducible check, and a human acceptance decision."
date: 2026-10-19 09:00:00 +0400
---

“Make the asset browser better” sounds like a task until someone tries to finish it. Better could mean faster search, clearer thumbnails, fewer clicks, or a different layout. An agent can choose an interpretation and produce a substantial change while the person who asked for it expected something else entirely.

A useful first move is to identify one observable failure and decide what evidence would resolve it. That gives the implementer a stopping point and gives the reviewer a decision they can actually make. Here is a fictional example that a technical team could adapt to its own application.

## Start with the moment that fails

Imagine a level designer searching an asset browser for `oak`. The current folder contains no matching assets. The browser displays a blank grid. The designer cannot tell whether the search finished, the folder is empty, or loading failed.

The original request is “make the asset browser better.” The narrower problem is uncertainty after a completed search returns zero matches. That is specific enough to discuss without redesigning the browser.

Before writing a task, the preparer should confirm the behavior in the real application. Record the route, the selected folder, the exact query, and the state after loading completes. If nobody can reproduce it, the next task is investigation. An assumed cause should not quietly become an implementation instruction.

For this example, suppose the behavior is confirmed and the team chooses a small empty-state improvement. Search speed, ranking, and asset loading remain separate questions. Keeping those questions visible prevents an attractive but unrelated improvement from swallowing the original request.

## Write one bounded outcome

A task can now name a result instead of a preference:

> When a completed asset search has zero matches in the selected folder, show the query and a “Clear search” action. Activating that action clears the query and restores the selected folder’s unfiltered assets. Preserve the selected folder.

The title could be “Explain zero search results and let the designer clear the query.” It names a user-visible behavior that can be checked in one short session.

The task should also distinguish adjacent states. A folder with no assets needs its existing empty-folder message. A pending request needs its loading state. A failed request needs its error state. Zero results should appear only after a successful search completes. Those boundaries matter because a component can display the new sentence correctly while showing it at the wrong time.

Keep implementation freedom where it is useful. The implementer can inspect the existing component structure and reuse the project’s established controls. The task need not prescribe a new state-management library or a specific CSS technique unless the project has a real constraint requiring it.

## Turn the outcome into a short acceptance check

Use a known fixture so the reviewer can repeat the check. Suppose the selected folder contains `pine_small` and `pine_large`, and searching for `oak` returns neither. A compact check is:

```text
Given: folder Trees contains pine_small and pine_large
When: search oak completes successfully with zero matches
Then: the grid shows the query oak and a Clear search action
When: Clear search is activated
Then: the query is empty and both pine assets are visible
And: Trees remains the selected folder
```

Add two boundary checks: searching for `pine` still shows both matches, and a loading or failed request never presents itself as a completed zero-result search. Keyboard activation of the clear action should follow the application’s existing accessible control behavior.

This is a proposed acceptance procedure, not a claim that an existing product passed it. The actual team must attach its fixture or equivalent reproducible data before execution. Screenshots can establish the message and selected folder; an interaction recording or test can establish what the action does.

## Make the three responsibilities explicit

The human preparer supplies the observed problem, the fixture, and the proposed boundary. They ask the designer whether preserving the selected folder is the desired behavior. That decision belongs before implementation because a technically correct reset could otherwise discard useful navigation context.

The implementer, whether an agent or a person, uses their own authorized tools and project access to inspect the code, make the bounded change, and run the relevant checks. Their completion note should identify changed files, checks performed, and any behavior they could not verify. If the existing API cannot distinguish a failed search from an empty response, they should report that dependency instead of inventing a success signal.

The human acceptance reviewer repeats the agreed scenario and judges whether the result resolves the designer’s uncertainty. A green test is useful evidence, but the reviewer still needs to see whether the message is understandable in context. The reviewer can accept the bounded task while opening a separate request about search performance or ranking.

For teams thinking about **work management for human and AI teams**, this separation fits the discussion in [Wagglet’s human and agent task-design article](https://wagglet.com/blog/dual-prompt-human-agent-task-design). The practical question is whether each participant knows which decision they own and which evidence they owe the next person.

## Stop when the agreed result is established

Before handing over the task, check that the request names a trigger, a visible outcome, a reset behavior, and the states it must preserve. Confirm that someone can reproduce the acceptance procedure without guessing which data to use. Assign the person who will make the final acceptance decision.

This approach does not solve every design question. It cannot establish that the entire browser is intuitive, that every folder performs well, or that the chosen wording works for every audience. It establishes one smaller result: after a successful search finds nothing, the designer can understand the state and recover without losing their place. That is a task someone can finish and someone else can verify.
