---
layout: post
title: "A two-part task brief needs a boundary between action and judgment"
description: "Common mistakes when combining agent instructions with human supervision, with a bounded documentation-repair example."
date: 2026-10-13 09:00:00 +0400
---

A task can be precise about what to change and vague about who may decide that the change is acceptable. That gap becomes visible when an agent is asked to implement, test, review, and release from one paragraph. The paragraph may contain every important word, yet still leave the agent deciding when to take an action that belongs to someone else.

A practical AI task handoff for teams separates executable instructions from human supervision notes. Both parts describe the same task, but they answer different questions. The agent needs a bounded action and a way to report what happened. The human needs the decisions, evidence, and review responsibilities that make the result acceptable.

Disclosure: this article was prepared with AI assistance for a Wagglet linkbuilding assignment. The worked documentation example is hypothetical. It is a proposed task design, not evidence that a particular team ran these checks or reduced review time.

## Mistake one: putting every decision in the action list

Consider a documentation page with stale links to a public icon set. The author wants the links repaired. A rushed instruction says: find replacements, update the page, check the links, and publish when it looks correct. That last clause gives the agent an open-ended judgment about both editorial correctness and release.

The author should first specify the approved asset source and whether existing licensing or attribution must be preserved. The runner can then inspect the named page and propose a narrow correction. A human reviewer decides whether the replacement belongs in the documentation and whether the scope has changed. Deployment can remain outside this task.

Separating the notes does not make an incomplete requirement complete. If nobody can identify the approved source, that is a missing decision to surface, not an invitation to select whichever image looks similar.

## Mistake two: hiding a stop condition in the reviewer notes

An agent cannot follow a pause rule it never receives. If the agent must stop when an asset's license is unclear, the executable instructions need that rule. The human notes can explain who resolves the issue and what evidence they need, but they should not be the only place where the rule appears.

There is useful overlap between the two parts. A shared stop condition belongs in both: one copy directs execution, while the other assigns responsibility for resuming it. The parts should remain consistent, especially when the author edits scope during review.

## A worked two-part prompt

Here is a proposed brief for the icon-link repair. The filenames and outcomes are illustrative; a real task must name actual authorized files and approved sources.

```text
AGENT INSTRUCTIONS
Goal: repair the stale icon links in docs/settings-icons.md.

Inputs: the named page and the approved public asset index
provided by the author. Use your own authorized repository
and tool access. Do not request someone else's login or key.

Steps:
1. List the current links and their observed responses.
2. Match replacements using the approved index and identity,
   not merely a similar filename or appearance.
3. Propose changes only to this page. Preserve its attribution.
4. Check the proposed links and record responses, redirects,
   and the version of the page checked.

Pause if the approved source is missing, identity is ambiguous,
licensing is unclear, or another page must change. Report the
specific gap to the named reviewer before dependent edits.
Do not merge, deploy, or publish from this task.

Return: proposed patch; before/after link list; actual check
results; unresolved decisions. Missing evidence stays missing.

HUMAN SUPERVISION NOTES
Author: supplies the approved index and the page's scope.
Runner: performs the bounded repair with their own authorized
tools and access, and records the checked version.
Reviewer: confirms asset identity, attribution, scope, and the
reported checks before accepting the proposed patch.

When execution pauses, the reviewer either resolves the gap
with the responsible author or records that it is unresolved.
Give an explicit instruction to resume; silence is not approval.
Release remains a separate decision under the normal process.
```

The example gives the runner something useful to do immediately: inventory the links. It also identifies the actions that depend on a decision. An ambiguous replacement can remain blocked while independent links are checked, provided the runner preserves that distinction in the report.

## Mistake three: treating a successful check as acceptance

A successful response from an asset URL confirms availability at the time of the request. It does not prove that the asset is the right icon, that its attribution is correct, or that the documentation explains it accurately. The reviewer should assess those questions against the brief.

The delivery should identify the checked version and the actual responses. Do not convert a planned check into a result or describe an unavailable endpoint as passing because another endpoint worked. A reviewer needs to see both the completed work and its limits.

For a broader explanation of the two-part approach, [Wagglet's article on human and agent task design](https://wagglet.com/blog/dual-prompt-human-agent-task-design) provides the contextual reference. The structure in this example is an authoring practice; it does not claim automatic enforcement of every pause or review instruction.

## Mistake four: changing the task during review without updating both parts

Suppose the reviewer discovers that several documentation pages reference the same retired asset family. Expanding the repair may be reasonable, but it changes the runner's inputs and the acceptance scope. Record that change explicitly and update both parts before dependent execution resumes.

A brief that still says “only this page” while the human notes say “repair all references” creates avoidable uncertainty. Keep the authorized scope, stop conditions, and named reviewer aligned. If the current runner cannot take the broader task, record the ownership decision instead of assuming that submitting a patch ends their responsibility.

## A final review before the runner begins

Check that the author has named the required inputs, the runner has authorized access, and the reviewer can judge the stated criteria. Put execution pauses in the agent instructions. Put decision ownership in the human notes. Identify the deliverable and the evidence it must contain, and keep release authority explicit.

Two parts cannot replace missing context or grant repository access. They can make an otherwise fuzzy request easier to execute and assess by keeping action, judgment, and unresolved decisions visible to the people responsible for them.
