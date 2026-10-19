---
layout: post
title: "Give a pickup burst one simulation contract and two host integrations"
description: "A small portable gold burst, explicit coordinate choices, and a review checklist for PixiJS and Three.js."
date: 2026-10-19 00:00:00 +0400
---

A pickup effect is a useful place to begin a cross-renderer experiment. The interaction is short, the trigger is clear, and the effect should end without leaving a loop running in the scene. It is also easy to overcomplicate: a rotating coin mesh, bloom, a UI flight path, and a reward counter introduce several systems before the basic burst has been checked.

This example starts with a simpler contract. Trigger one gold burst, let it expand in a plane, and let every particle expire. The visual specification is deliberately limited to untextured gold billboards. It does not claim to include a finished coin sprite or a physically rotating coin.

## Define the pickup independently of the renderer

Use a portable effect with a single emitter named `coins`. Set its maximum population to 24, continuous emission to zero, and one scheduled burst of 24 at time zero. Give each particle a 0.6-second lifetime. Randomize initial velocity between minus two and plus two on X and Y, with Z fixed at zero.

Choose unlit alpha blending, disable depth testing for this planar example, and fade alpha from one to zero over the particle lifetime. Keep the timeline non-looping. The particle size is a small world-unit value in the fixture; the host must decide how that maps to its screen.

The complete authored fixture is in `coin-contract.mjs` in the preparation pack. It uses `nixie-fx@0.1.20`, builds a compiled bundle, and requires each backend separately when loading the result. Keeping that fixture beside the article makes the configured values reviewable instead of relying on a screenshot of editor controls.

## Treat the export as a bundle

A game needs the manifest, the compiled effect JSON, and any referenced assets from the same export. Mixing a new manifest with an old effect file creates a different problem from a renderer compatibility issue.

The fixture has no external texture assets. If you replace the gold billboards with coin artwork, re-export and resolve the asset paths through the appropriate provider. Do not assume that putting a PNG beside the article makes it available to the runtime.

For teams choosing a particle editor for PixiJS and Three.js, the [NixieFX PixiJS guide](https://nixiefx.com/pixijs-particle-effects/) is relevant context. The integration still needs a declared coordinate system and a backend support check for the actual exported effect.

## Make the two host choices explicit

In a PixiJS UI, choose a container whose transform maps the fixture's small simulation units to a useful screen size. Position that container at the pickup indicator. Avoid attaching it under a parent that later receives an unrelated gameplay scale.

In Three.js, choose an orthographic camera for the first comparison, keep the burst in its XY plane, and place the camera along Z looking toward it. This reduces perspective as a source of disagreement while leaving the effect in a normal Three.js scene.

Both hosts create an instance from the exported definition with seed 270. Each host advances its adapter once per frame with a delta in seconds. If an application advances both the instance and the owning adapter, it may accidentally simulate twice. Choose one owner for that update.

The following is the intended lifecycle once the renderer and loaded effect exist:

```js
// vfx is the host's PixiVfxRenderer or ThreeVfxRenderer.
const pickup = vfx.createEffect(effect, { seed: 270 });

function updateEffect(deltaSeconds) {
  vfx.update(deltaSeconds); // one call per host frame
}

function replayPickup() {
  pickup.restart();
}

function releaseScene() {
  vfx.destroy();
}
```

This is an integration excerpt, not a complete HTML application. The fixture and its check run independently of a GPU. A public demo still needs the renderer setup, viewport, trigger control, and final draw call.

## Compare a known moment, then the full lifecycle

The included CPU check advances the loaded effect at 1/60-second steps. For this fixture, both backend-required loads produced shared-core counts of 24 active particles at 0.2 seconds and zero at 1 second. This measures population and lifetime only. It does not establish that PixiJS and Three.js rendered matching pixels.

Use that known time for a visual review. Freeze each host at 0.2 seconds, show the seed and scale, and capture the entire burst against the same background. Then replay the animation and confirm that the effect disappears, the pickup can retrigger, and scene cleanup removes its owned resources.

## Keep the limits in the published example

- Confirm both exported backend reports and retain any approximation notes.
- Record renderer versions, viewport size, projection, and container scale.
- Add actual captures from both hosts before calling the visual comparison complete.
- Check a second pickup and teardown, rather than only the first trigger.
- Do not generalize this planar alpha test to lit meshes, bloom, or depth occlusion.

The portable profile is an eligibility contract, not a promise of identical presentation. A Three.js object can participate in world depth in ways that a Pixi container does not reproduce as a GPU depth buffer. This fixture avoids that dependency rather than silently treating the two scenes as equivalent.

AI assistance was used to prepare this article and fixture. The local export and CPU check were run; the two browser renders, screenshots, and a production pickup integration remain review work.
