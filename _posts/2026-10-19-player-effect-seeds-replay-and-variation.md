---
layout: post
title: "Give repeated player effects different seeds without losing replayability"
description: "A 24-particle fixture separates repeatable simulation from visible variation, with explicit limits for cross-renderer use."
date: 2026-10-19 09:00:00 +0400
---

Repeated player effects can feel copied even when their timing is responsive. A pickup burst sprays the same particles in the same directions. Trigger it again and the pattern repeats. That may be correct deterministic behavior: the host might be starting every instance with the same seed.

A seed gives a pseudorandom simulation a reproducible starting point. To make repeated effects vary, give distinct events distinct seeds. To replay a particular event, preserve its seed alongside the other simulation inputs.

This example uses a web game VFX editor workflow with a small NixieFX burst. The [NixieFX editor and runtime reference](https://nixiefx.com/vfx-runtime-docs/) provides the export and backend context. The measurements below come from a local Three.js adapter fixture, not a cross-device or cross-renderer screenshot test.

## Keep the effect deliberately simple

The fixture emits 24 particles in a single starting burst, with no continuous emission. Each lives for 0.6 seconds. Its initial velocity samples x and y independently between -2 and 2; z stays zero. Procedural unlit billboards use a constant size of 0.055 units and fade from alpha 0.9 to zero.

The effect targets the portable profile. It uses no file textures, mesh particles, lighting, collision, or depth-buffer requirement. That keeps the comparison about seeded particle motion instead of external assets or a feature that only one backend can draw.

The sample pins `nixie-fx@0.1.20` and `three@0.185.1`. A different package version should be tested again before comparing stored numeric snapshots.

## Give each spawn an explicit seed

Assume `effect` is the verified compiled burst from the export bundle and `vfx` is the host's Three.js VFX renderer:

```js
let spawnNumber = 0;
const baseSeed = 2020;

function spawnPlayerBurst(position) {
  const seed = (baseSeed + spawnNumber++) >>> 0;
  const instance = vfx.createEffect(effect, { position, seed });
  return { instance, seed };
}
```

This counter is an example allocation policy, not an event identifier supplied by the runtime. It wraps at the unsigned 32-bit boundary. If replay depends on the seed, record the actual assigned value for the event rather than reconstructing it from a counter whose call order may later change.

Do not reseed an existing burst every frame. The seed belongs to the spawn. Continue advancing the renderer once per host frame with elapsed seconds.

For a reproduction, use the recorded value directly:

```js
const replay = vfx.createEffect(effect, {
  position: recordedPosition,
  seed: recordedSeed,
});
```

The recorded position, effect definition, update sequence, and host-driven motion matter too. The same seed cannot compensate for a different emitter path or a changed effect asset.

## Test equality before testing variety

The local check creates independent instances with seed 2020, advances each through twelve 1/60-second updates, and records the adapter's particle debug positions. That samples the burst at 0.2 seconds while all 24 particles are still alive.

The comparison sorts records by particle index so it checks matching particles. It compares numeric world positions rather than whole camera-facing transform matrices or screenshots.

A test outline looks like this:

```js
const first = sampleBurst({ seed: 2020, steps: 12, dt: 1 / 60 });
const repeat = sampleBurst({ seed: 2020, steps: 12, dt: 1 / 60 });
const varied = sampleBurst({ seed: 2021, steps: 12, dt: 1 / 60 });

assert.deepEqual(first.positions, repeat.positions);
assert.notDeepEqual(first.positions, varied.positions);
```

Here `sampleBurst` is a fixture helper, not a NixieFX API. The companion test creates the scene and adapter, reads `getParticleDebugTransforms()`, and destroys the renderer after collecting the result. Use the real helper or implement those steps; copying an undefined helper into a game is not a working integration.

## What the local test established

Both seed-2020 samples matched exactly at the sampled time. Restarting an instance and replaying the same twelve updates also reproduced its positions. Two runs that omitted the seed matched each other in this tested version, which explains why relying on an omitted seed did not create variety.

Changing the seed to 2021 changed the sampled position of all 24 corresponding particles. The adapter reported no unsupported features for this fixture. These are bounded numeric results. They do not promise that every seed pair will look meaningfully different for every authored effect.

Randomness only affects properties that actually sample it. A burst with fixed positions and fixed velocities may look identical under many seeds because its visible properties have no randomized range.

## Compare the pictures under controlled conditions

The browser fixture places two bursts side by side under one orthographic camera. Their settings, elapsed time, and update steps match. The same-seed comparison should show the same relative pattern around each origin. The different-seed comparison should show another arrangement without changing lifetime, count, or color.

Use a fixed sample time when reviewing the images. If one burst is older than the other, fading and travel can look like seed variation. The fixture's comparison controls freeze both at 0.2 seconds; a separate replay control shows the animation.

Inspect the effect at its real game size as well. A numeric difference can be technically real but visually unimportant when the whole burst occupies a few pixels.

## Keep backend limits separate from seed results

The export reports this selected effect supported for both `three3d` and `pixi2d`, with no warnings or blockers. The Pixi report still includes an informational note: depth-ink semantics concern draw ordering, not a GPU depth buffer. That note must not become a claim of identical 3D depth behavior.

Only the Three.js adapter and Chrome fixture are measured here. PixiJS rendering, screenshot equality across browsers, collision, and device performance remain outside the check. The reserved renderer `clockSpace` option is not a seed-control mechanism.

Use fixed seeds for debugging and stored event seeds for replay. Use deliberately assigned varied seeds when repeated events should look different. Then judge variation through the actual effect, camera, timing, and backend that the player will see.

*Disclosure: This article and procedural fixture were prepared with AI assistance. Numeric claims describe the local tests above; no production-game or cross-renderer visual-parity result is claimed.*
