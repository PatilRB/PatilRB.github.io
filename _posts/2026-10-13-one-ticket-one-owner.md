---
layout: post
title: "Two agents can read a ticket. Only one should own the attempt."
description: "A practical claim, handoff, and review contract for teams using coding agents without duplicating the same work."
date: 2026-10-13
---

The easiest way to duplicate an AI task is to confuse seeing it with owning it. Two teammates open the backlog, notice the same small fix, and each starts a coding agent. By the time they compare notes, both have spent time collecting context and changed the same files.

More detailed instructions alone do not solve that problem. The team also needs a visible answer to three questions: who owns the current attempt, what ends that ownership, and who decides whether the result is acceptable. I want those answers recorded before a runner opens the editor.

Disclosure: This article was prepared with AI assistance for a Wagglet marketing assignment. The example below is a proposed operating contract, not a report of measured savings or a claim that every tool implements these states automatically.

## Separate readiness from ownership

A prepared ticket should describe the outcome, relevant context, permitted tools, and acceptance evidence. That preparation belongs to the requester or task author. It does not mean that the author must execute the work, or that every teammate who reads the ticket is permitted to begin.

The runner needs their own authorized access to the repository and coding tools. To **delegate AI task without sharing account**, move the instructions and responsibility to that runner; do not move a login, API key, or subscription credential. Access to the work and authority to claim it remain separate checks.

Before starting, the runner should be able to see the claim result in the shared system. A local note saying “I took this” is weak evidence if the other runner cannot see it. A claim that fails or remains uncertain should mean wait, not start speculatively.

## Give every attempt a single owner

Here is the state diagram I would put beside the team's handoff checklist. These are operating states for the example, rather than promised names of product status values.

```text
PREPARED — ready to claim, no runner owns execution
    |
    | claim confirmed; record runner and attempt
    v
OWNED — one runner executes with their own authorized tools
    |                               |
    | delivery + evidence           | explicit release / reassignment
    v                               v
REVIEW — acceptance reviewer      PREPARED — next claim may begin
    |
    +-- changes requested --> OWNED — same attempt owner
    |
    +-- accepted -----------> ACCEPTED

ACCEPTED --> separately authorized merge --> separately authorized deploy
```

The important boundary is between claiming and beginning execution. If the system supports an atomic claim, use that result as the ownership decision. If it does not, appoint a dispatcher who confirms one owner before either runner starts. A diagram or a spreadsheet cannot manufacture atomicity.

Ownership should identify an attempt as well as a person. If a ticket changes hands, the old delivery should not silently count as evidence for the new attempt. Record which work was retained, which instructions changed, and whether the earlier branch is still useful.

## Walk through a collision before it happens

Imagine a ticket to fix a settings dialog that loses its selected project after saving. Its acceptance check is specific: choose a project, save, reopen the dialog, and confirm the same selection remains. The author supplies a reproduction and the relevant page; an acceptance reviewer is named in advance.

Mariam and David both see the prepared ticket. Mariam's claim is confirmed. David sees that the attempt is owned and picks another item. This is where duplicate work is avoided. It happens before either person treats an agent's running session as proof of ownership.

Mariam executes using her own authorized environment. She delivers a change and records the reproduction result, the checks run, and any remaining limitation. The reviewer discovers that the selection survives reopening but not a page refresh. They request a correction on the same attempt, with the missing case made explicit.

The ticket stays associated with Mariam while that correction is underway. David does not interpret the review comment as an invitation to launch a second implementation. If Mariam cannot continue, the team explicitly releases or reassigns ownership and records the unfinished work before David starts.

## Treat silence as a question, not a release

An owner becoming quiet is not evidence that their work can be replaced safely. They may have a local change, a running test, or a result that has not yet been attached. A timeout policy can help, but it must state who may release ownership and how the old runner is informed.

For a stalled attempt, I would record the last known checkpoint, the reason for reassignment, and the disposition of existing artifacts. If two implementations already exist, choose one accountable owner to reconcile them. Do not accept whichever appears first without reviewing both the result and the overlap.

The [Wagglet workflow guide](https://wagglet.com/blog/wagglet-workflow-request-draft-ticket-delivery) provides the broader request-to-delivery context. The collision example adds a narrow team contract: preparation makes work understandable, a confirmed claim makes execution attributable, and review decides acceptance.

## Keep acceptance and release decisions distinct

A delivery says the runner has supplied work for judgment. Acceptance says the named reviewer has checked it against the agreed result. Neither should automatically mean a repository merge or production deployment has been authorized.

Before using this contract, check that everyone can answer the following:

- Who prepares the ticket and confirms it is ready?
- Where can another runner see the current owner and attempt?
- What authoritative result confirms a successful claim?
- Who can release or reassign ownership?
- What evidence does the acceptance reviewer require?
- Who has the separate authority to merge and deploy?

A shared backlog is useful only if its ownership signals mean the same thing to everyone. Make the claim visible, keep corrections attached to the current attempt, and require an explicit handoff when ownership changes. That gives a second agent a clear reason to move on without asking them to guess what the first one is doing.
