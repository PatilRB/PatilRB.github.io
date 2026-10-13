---
layout: post
title: "Recover an unfinished agent task without starting from zero"
description: "A recovery runbook for preserving state, evaluating evidence and handing an interrupted attempt to a new runner and reviewer."
date: 2026-10-13 12:00:00 +0400
---

An agent task can stop at an awkward point: a draft change exists, the original author is unavailable, and somebody needs an answer before the next planning meeting. Starting a fresh agent session feels quick. It can also erase the distinction between what was requested, what was attempted and what was actually verified.

Disclosure: This runbook was prepared with AI assistance for a Wagglet marketing assignment. The worked example is hypothetical. It does not describe a measured recovery outcome or promise that a tool can reconstruct missing context automatically.

The aim of an AI task handoff for teams is to leave the next person a bounded decision. Preserve the existing work, identify the evidence, and name the next action before asking another runner to continue.

## First distinguish the absent author from the absent runner

The author prepares the request and acceptance criteria. The runner owns the execution attempt and uses their own authorized tools. The reviewer judges the delivered result against the agreed criteria. These roles can belong to different people.

An unavailable author does not automatically release an active runner's claim. Before recovery, check whether the execution owner is also unavailable. If the runner is still working, ask for their current state through the team's ordinary coordination process. Avoid creating a competing implementation simply because the person who wrote the description cannot answer a question.

If the runner cannot continue, the team should record an explicit release or reassignment. Access also needs a separate check: the new runner needs their own authorized repository, environment and provider access. A saved session or credential belonging to somebody else is not the handoff package.

## Preserve the attempt before interpreting it

Record the task identifier, current owner, saved work location and current state. Preserve uncommitted changes and relevant artifacts before cleaning, resetting or switching the workspace. A branch name alone is insufficient when important changes exist only in the checkout.

Treat notes from an agent as claims until supporting evidence is available. A statement that tests passed should identify the command, result and version of the work tested. An unfinished screenshot should not be presented as proof that the intended production behavior exists.

Mark unavailable evidence as missing. Do not fill gaps with an estimate of how much work the previous runner probably completed. A useful recovery note can be short while still separating observed facts from unresolved questions.

## A worked example: interrupted invoice filtering

Suppose a startup requested an invoice list filter. Dana wrote the request, Mika owned the implementation, and Alex was assigned to review. Dana is unavailable, and Mika's attempt has also stopped. A local patch adds a filter control, but there is no recorded check for clearing the filter or for users with restricted invoice access.

The replacement runner, Noor, first preserves the patch and confirms the reassignment. Noor reads the existing acceptance criteria and inspects the change. The visible control is evidence of an attempted interface change. It does not establish that filtering works correctly or that restricted records stay hidden.

The next action is bounded: reproduce the filter and clear behavior in an authorized test environment, then check the existing access rules. Noor need not invent a new design simply because Dana cannot respond. If the criteria leave an important question unanswered, Noor records it for the responsible decision-maker rather than silently broadening the work.

## Write the recovery note in four parts

A practical note for that example could look like this:

```text
STATE
Invoice filter attempt reassigned from Mika to Noor.
Saved patch preserved; implementation is not yet accepted.

EVIDENCE
Filter control exists in the patch.
No recorded verification for clear/reset or restricted access.
Existing acceptance criteria are available on the task.

NEXT ACTION
Reproduce filter and clear behavior on the preserved version.
Check restricted access using an authorized test account.
Record commands, results and any unresolved requirement.

REVIEWER HANDOFF
Alex reviews the resulting behavior against the existing criteria.
Corrections return to Noor until ownership is explicitly changed.
Merge and deployment still require their normal authorization.
```

This format helps a reviewer understand why work resumed and what remains uncertain. It is a proposed runbook, not a claim that a particular product enforces each line. For startup teams organizing this kind of shared work, [Wagglet for startups](https://wagglet.com/for/startups) provides a contextual place to explore the workflow.

## Keep the recovery scope small enough to judge

The replacement runner should explain any changes to the preserved attempt. If they discard part of the patch, they should state why and retain enough history to make the decision reviewable. Rewriting everything can be justified, but it should follow from evidence about the work rather than from discomfort with an unfamiliar session.

Submission should identify the tested version and outstanding limitations. A reviewer should be able to distinguish newly verified behavior from inherited assumptions. If corrections are needed, they stay attached to the replacement runner's current attempt until reassignment is explicit.

Acceptance is also separate from release. A reviewer deciding that the task meets its criteria does not automatically authorize a merge or deployment. Keep those decisions visible so that recovering an interrupted attempt does not accidentally become a production change.

## Know when recovery needs another decision

Pause the dependent part of the work when the missing author is the only person authorized to resolve a material requirement. Continue independent checks where useful, but do not convert silence into approval. Likewise, an inaccessible environment or missing evidence should remain visible in the delivery.

A recovery is useful when the next runner can act on preserved state, explain the evidence and give the reviewer a clear result. The goal is continuity of responsibility, not continuity of somebody else's login or an assumption that an abandoned session must be finished at any cost.
