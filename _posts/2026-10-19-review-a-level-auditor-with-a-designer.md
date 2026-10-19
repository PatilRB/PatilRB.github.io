---
layout: post
title: "Review an agent-written level tool with a designer before it touches a real project"
description: "A read-only marker auditor, a small sample level, and a concrete division between designer acceptance and engineering review."
date: 2026-10-19 09:00:00 +0400
---

A designer can judge whether a level report describes the intended room without being able to audit every line of JavaScript. An engineer can inspect the script without knowing whether the enemy marker belongs near the exit. A useful review needs both kinds of judgment.

This AI game development workflow starts with a deliberately limited tool: read a sample level, report marker problems, and leave the input unchanged. The script and sample below were prepared with AI assistance. They are synthetic examples, not exports from a production game. No qualified human engineer has signed off on this draft.

## Write the contract before running the script

The proposed tool accepts a JSON room with positive integer dimensions and a list of named markers. Coordinates start at zero. For a room four cells wide, valid x values are 0 through 3. The tool reports out-of-bounds coordinates and duplicate marker IDs.

It does not repair the level, write an output level, decide where enemies belong, or inspect an engine project. These limits give the designer something specific to review and keep the first execution away from valuable assets.

Use a copied sample folder. Do not begin by pointing an unfamiliar agent-written script at the team's content directory. The sample has only two files: `room.json` and `audit-level.mjs`.

## Give the designer a room they can check by eye

Put this in `room.json`:

```json
{
  "width": 4,
  "height": 3,
  "markers": [
    {"id": "spawn", "x": 0, "y": 0},
    {"id": "exit", "x": 3, "y": 2},
    {"id": "enemy-2", "x": 4, "y": 1}
  ]
}
```

The spawn and exit occupy valid corner cells. The enemy's x coordinate is just outside the room. That boundary is intentional: testing a coordinate equal to the width catches an off-by-one mistake that an obviously distant coordinate might not reveal.

Before running anything, ask the designer to predict the report. This makes the acceptance rule independent of whatever the script happens to print.

## Keep the implementation small enough to inspect

Save the following as `audit-level.mjs` and run it with a maintained Node.js installation:

```js
import { readFile } from "node:fs/promises";

function auditLevel(level) {
  if (!level || !Number.isInteger(level.width) || level.width < 1 ||
      !Number.isInteger(level.height) || level.height < 1 ||
      !Array.isArray(level.markers)) {
    throw new Error("Expected positive dimensions and a markers array");
  }
  const issues = [], seen = new Set();
  for (const marker of level.markers) {
    if (!marker || typeof marker.id !== "string" || !marker.id.trim() ||
        !Number.isInteger(marker.x) || !Number.isInteger(marker.y)) {
      throw new Error("Each marker needs an id and integer x/y");
    }
    if (seen.has(marker.id)) issues.push(`ERROR ${marker.id}: duplicate id`);
    seen.add(marker.id);
    if (marker.x < 0 || marker.x >= level.width ||
        marker.y < 0 || marker.y >= level.height) {
      issues.push(`ERROR ${marker.id}: (${marker.x},${marker.y}) outside ${level.width}x${level.height}`);
    }
  }
  return issues.sort();
}

try {
  const level = JSON.parse(await readFile(process.argv[2], "utf8"));
  const issues = auditLevel(level);
  console.log(issues.length ? issues.join("\n") : "OK: no marker issues");
  process.exitCode = issues.length ? 2 : 0;
} catch (error) {
  console.error(`INPUT ERROR: ${error.message}`);
  process.exitCode = 1;
}
```

Run:

```sh
node audit-level.mjs room.json
```

Expected output:

```text
ERROR enemy-2: (4,1) outside 4x3
```

The expected exit code is 2 because the input was understood and a marker issue was found. Exit code 1 means the input could not be read or validated. Exit code 0 means this small audit found no marker issues; it does not mean the level is playable.

## Separate designer acceptance from code review

The designer checks the coordinate convention, the sample's expected result, and whether the report uses recognizable marker IDs. They should also decide whether duplicate IDs are invalid in the actual project. A tool cannot infer that rule from a field name.

A qualified engineer reviews the file-reading path, validation, bounds comparison, output ordering, exit behavior, and absence of writes. The supplied implementation imports `readFile` and contains no write or delete operation. That is a concrete property of this version, not permission to trust every later revision.

The engineer should also inspect any dependency or process execution added by a future change. A report-only tool that quietly grows an automatic repair mode has crossed its original review boundary.

The agent or developer executes with their own authorized tools. QA prepares the sample and expected results. The engineer judges code correctness, and the designer judges the content rule. For a broader discussion of those roles, see [Wagglet's article on meaningful work with human–AI pairs](https://wagglet.com/blog/meaningful-work-with-human-ai-pairs).

## Use neighboring cases to expose common mistakes

The local fixture checked valid corner cells, coordinates equal to width or height, duplicate IDs, invalid dimensions, and a fractional coordinate. Its command-line run produced the expected error and exit code. A SHA-256 comparison confirmed that the sample input did not change during that run.

Those checks address several common failures: treating the upper bound as inclusive, accepting malformed values through coercion, hiding duplicate identities, and confusing an error report with a repaired level.

They do not establish compatibility with a game's importer, coordinate transforms, filesystem layout, or asset references. The article's standalone listing uses the same audit logic as the tested fixture; the companion source separates the function from the command-line entry point so it can be tested directly.

## Require a qualified review before expanding scope

The next useful step is a named engineer's review against the actual project's schema, followed by a designer-led check on copied project data. That review remains pending here. Do not describe this synthetic example as an approved production tool.

If the team later needs automatic repair, write a new contract for proposed changes, preview output, rollback, and acceptance. Keep the first report-only version small until both reviewers can explain what it promises and what it leaves unresolved.

*Disclosure: Prepared with AI assistance. Local checks establish the stated sample behavior; qualified human code review and production integration remain unverified.*
