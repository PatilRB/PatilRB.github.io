---
layout: post
title: "A one-shot crate explosion in the NixieFX Three.js runtime"
description: "A procedural burst recipe, export-loading example and integration checklist for a Three.js crate-hit effect."
date: 2026-10-13 00:00:00 +0400
---

Disclosure: This guide was prepared with AI assistance for a NixieFX marketing assignment. The values are explicit prototype choices. The implementation steps below describe a procedural Three.js effect; they are not a claim of measured performance, a physical explosion simulation or footage from a shipped game.

An explosion burst needs a readable beginning and a definite end. If particles keep arriving after the impact, a single hit starts to resemble an engine exhaust. For a small Three.js game, I would first build one outward burst, keep it independent of damage calculation, and review it against the camera used by the game.

## Define the visual contract

The worked example is an orange burst at a crate's hit point. It uses one spherical emitter, 64 camera-facing particles, a 0.7-second lifetime and no continuous emission. The effect loops neither its timeline nor its emitter. A fixed seed makes repeated reviews easier to compare.

Searching for a three js particle editor is only part of this workflow. The authored settings must also work in the selected runtime. The [NixieFX Three.js runtime guide](https://nixiefx.com/threejs-runtime/) explains the adapter, export loading and support reports used for this integration.

The game still decides whether a hit happened, where it happened and whether the crate should disappear. The VFX instance receives a position after that decision. It does not calculate damage or establish that a collision occurred.

## Author a one-shot instead of a stream

Use the Three.js world 3D target profile. Set continuous emission to zero and create a burst of 64 particles at time zero. Give the emitter a short emission duration, disable looping and allow the spawned particles to complete their lifetimes.

For this prototype, use a sphere with a small radius of 0.06 world units. Choose shape-direction initial velocity so the particles travel away from the source, with a speed of 2.4 units per second. Start with a billboard size of 0.08 and a warm orange color. Enable color over lifetime and fade alpha to zero by the end.

Use unlit additive rendering for this first pass. It helps the sparks remain visible against a dark scene, but it can wash out against bright backgrounds. This recipe deliberately avoids textures, mesh particles, custom material graphs, trails and collision modules. Depth testing can be enabled later when the scene needs correct occlusion; inspect that result against walls and foreground objects.

## Export and check the backend

Validate the authoring project and export its runtime bundle. Deploy the export under `/vfx`, including `manifest.json` and the compiled effect file. Use the effect ID `crate-explosion`. The authoring project is the editable source; the game consumes the export.

Check the Three.js support report before wiring up the event. If it reports partial support, inspect the warnings and decide whether the approximation is acceptable. A blocked report needs a change to the effect or integration. Do not present unsupported settings as working merely because some particles appear.

The following example assumes a Three.js host already owns `scene`, `camera` and `renderer`, and that the exported effect contains no external file assets. Install `nixie-fx` and `three` in that application's build environment. Keep the version fixed while investigating any change in appearance.

## Load once, then trigger at the hit point

```js
import { loadVfxExportBundle } from 'nixie-fx/export';
import { ThreeVfxRenderer } from 'nixie-fx/three';

async function readJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}`);
  return response.json();
}

const manifest = await readJson('/vfx/manifest.json');
const effectsByPath = Object.fromEntries(await Promise.all(
  manifest.effects.map(async entry => [
    entry.path, await readJson(`/vfx/${entry.path}`)
  ])
));
const bundle = loadVfxExportBundle(
  { manifest, effectsByPath },
  { requiredBackend: 'three3d', requiredEffectIds: ['crate-explosion'] }
);
const definition = bundle.effectsById.get('crate-explosion');
if (definition.assets.length) throw new Error('Add the required asset providers.');
const vfx = new ThreeVfxRenderer({ scene, camera });
const support = vfx.getSupport(definition);
if (support.status !== 'supported') throw new Error('Review the support report.');
const burst = vfx.createEffect(definition, { autoStart: false, seed: 17 });

export function showCrateExplosion(hitPoint) {
  burst.setTransform({ position: [hitPoint.x, hitPoint.y, hitPoint.z] });
  burst.restart();
}

// In the host's existing animation loop, once per frame:
// vfx.update(deltaSeconds);
// renderer.render(scene, camera);
// On scene teardown: vfx.destroy();
```

Advance the VFX renderer once per host frame using seconds. If the host provides milliseconds, divide by 1000. Avoid also updating the instance directly, because two updates would advance the same effect twice.

This example reuses one instance. Restarting it replaces the preceding burst, which is appropriate only when that replacement is intended. For simultaneous crate hits, create or pool separate instances and manage their lifetimes. Do not imply that one reusable handle preserves overlapping explosions.

## Review the burst before adding layers

Trigger at the crate center and again near an edge. Hold review frames at approximately 0.1 and 0.5 seconds using `seek(time)` followed by `pause()`. Confirm that the origin matches the supplied world position, the later frame has expanded, and the particles disappear after their lifetime. Use `restart()` to resume a fresh one-shot.

Check these points in the actual host scene:

- One hit causes one burst, with no unintended continuous emission.
- The effect remains readable against both dark and bright backgrounds.
- The game loop advances the renderer once, in seconds.
- Repeated hits either intentionally replace the burst or use separate instances.
- Reduced-motion behavior offers an appropriate static or simplified cue.
- Teardown destroys the VFX renderer when its scene is released.

## Keep the limits visible

The result is a stylized visual cue. It contains no smoke texture, lighting contribution, bloom pass, debris physics or tested mobile performance claim. Camera-facing particles also do not become solid debris when the camera moves.

Once the single burst behaves correctly, add a second visual layer only when it serves a clear purpose. Recheck validation, assets and backend support for each change. A short effect with an explicit trigger and cleanup path is easier to integrate than a convincing preview whose runtime requirements remain uncertain.
