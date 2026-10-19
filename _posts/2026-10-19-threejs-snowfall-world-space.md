---
layout: post
title: "Build snowfall in Three.js without attaching the weather to the camera"
description: "A tested NixieFX snowfall fixture with a bounded particle budget, world-space motion, and an explicit drain path."
date: 2026-10-19 09:00:00 +0400
---

Snowfall is a useful test of a particle integration because the effect stays on screen for a long time. Small mistakes in density, coordinate space, or shutdown become visible as the camera moves through the scene.

This example uses procedural billboard flakes in a fixed world volume. It is a small weather fixture, not a snow simulation. It does not collide with the floor or accumulate on surfaces. The purpose is to make motion and lifecycle easy to inspect before adding a more elaborate visual treatment.

If you use a three js particle editor, the editor preview is only the beginning of the check. The exported effect still needs to behave correctly in the game's Three.js scene. The [NixieFX Three.js runtime documentation](https://nixiefx.com/threejs-runtime/) describes the adapter used here.

## Start with a density budget

The fixture emits 12 flakes per second and gives each a five-second lifetime. Multiplying those values suggests about 60 live particles once emission reaches a steady state. The emitter capacity is 80, leaving some room around that estimate.

That arithmetic is a planning estimate, not a promise about an exact count on every frame. The local fixed-step test reached 61 active particles. Emission and retirement happen at discrete update boundaries, so a one-particle difference is not evidence of an uncontrolled leak.

The spawn volume is six units wide, 0.2 units high, and five units deep. Place its origin at `[0, 4, 0]`. Initial vertical speed ranges from -0.8 to -0.6 units per second; a small horizontal component prevents every flake from drawing the same vertical line.

The test fixes the seed at 254. Keep that seed when comparing recipe changes so a different random arrangement does not obscure a change in size or opacity.

## Define the effect explicitly

The companion source uses `nixie-fx@0.1.20` and `three@0.185.1`. This is the complete effect-construction function; the host receives a verified compiled effect from it:

```js
import {
  createDefaultParticleEffect,
  createConstantParticleScalar as scalar,
} from "nixie-fx";
import { compileVfxExport, loadVfxExportBundle } from "nixie-fx/export";

function makeSnowfall() {
  const p = createDefaultParticleEffect("snowfall", "World-space snowfall");
  p.targetProfile = "three-world-3d";
  p.timeline.duration = 6;
  p.timeline.loop.enabled = true;
  const e = p.emitters[0];
  e.id = "flakes";
  e.duration = 6;
  e.loop = true;
  e.maxParticles = 80;
  e.spawn.shape = "box";
  e.spawn.box = [6, 0.2, 5];
  e.spawn.simulationSpace = "world";
  e.spawn.rate = 12;
  e.spawn.rateValue = scalar(12);
  e.spawn.bursts = [];
  e.initializeParticle.lifetime = scalar(5);
  e.initializeParticle.velocity.mode = "vector";
  e.initializeParticle.velocity.min = [-0.1, -0.8, -0.1];
  e.initializeParticle.velocity.max = [0.1, -0.6, 0.1];
  e.initializeParticle.size = scalar(0.045);
  e.billboard.sizeStart = 0.045;
  e.billboard.sizeEnd = 0.045;
  e.billboard.sizeValue = scalar(0.045);
  e.render.shading = "unlit";
  e.render.blend = "alpha";
  e.render.depthTest = true;
  e.render.depthWrite = false;
  e.initializeParticle.color.color = [0.85, 0.93, 1, 0.8];
  e.modules.color = true;
  e.color.gradient.colorStops = [
    { position: 0, color: [0.85, 0.93, 1] },
    { position: 1, color: [0.85, 0.93, 1] },
  ];
  e.color.gradient.alphaStops = [
    { position: 0, alpha: 0 },
    { position: 0.1, alpha: 0.8 },
    { position: 0.8, alpha: 0.8 },
    { position: 1, alpha: 0 },
  ];
  const c = compileVfxExport([
    { effect: p, effectPath: "effects/snowfall.json" },
  ]);
  return loadVfxExportBundle({
    manifest: c.manifest,
    effectsByPath: Object.fromEntries(c.effects.map(x => [x.path, x.effect])),
    assetPaths: [],
  }, { requiredBackend: "three3d", requireEveryAsset: true })
    .effectsById.get("snowfall");
}
```

The definition references no file assets. The fixture therefore needs no texture provider. For a deployed game, precompile and serve the export bundle with the game's static assets instead of doing authoring work inside a frame loop.

## Keep the weather in world space

Mount the VFX renderer in the scene, using the same camera that renders the game. Leave its root out of the camera hierarchy. The camera can then move through the weather volume without carrying old flakes along with it.

```js
import { ThreeVfxRenderer } from "nixie-fx/three";

const vfx = new ThreeVfxRenderer({ scene, camera });
const snowfall = vfx.createEffect(makeSnowfall(), {
  position: [0, 4, 0],
  seed: 254,
});

// Call once from the existing host loop, with elapsed seconds.
function updateWeather(dt) {
  vfx.update(dt);
}

function leaveSnowArea() {
  snowfall.allowCompletion();
}

function destroyWeather() {
  vfx.destroy();
}
```

This volume stays at its authored location. An endless weather system may move the emission volume as the player travels, but old world-space particles should retain their own positions. Repositioning emission and teleporting every live flake are different operations.

## Check falling motion and shutdown separately

The adapter test creates one diagnostic flake with continuous emission disabled. After an initial update makes it visible, another half second of fixed-step updates moves it downward by about 0.325 world units. Moving the camera with zero elapsed simulation time preserves its world position.

A second check runs continuous snowfall for ten simulated seconds. It records the 61-particle peak and an empty unsupported-feature list. Calling `allowCompletion()` stops new emission; after another 5.5 seconds, the active count reaches zero. These are local adapter measurements, not GPU or mobile benchmarks.

The browser fixture adds Restart, Inspect four seconds, Stop and drain, and Orbit camera controls. Compare the flakes against a fixed landmark while orbiting. Then stop emission and watch the remaining flakes disappear without replenishment. Pausing is a separate action: frozen particles do not demonstrate that lifetime cleanup works.

## Keep the unsupported behavior visible

The selected effect's Three.js support report has no warnings or blockers. That result covers this recipe. It does not establish support for every authored setting or for a different package version.

The renderer option `clockSpace` is reserved and unused in this runtime; the fixture uses the emitter's `simulationSpace` setting. Collision and accumulation are not implemented by this recipe. Depth testing can hide a flake behind opaque geometry without making it collide with that geometry.

Before using the effect in a level, check contrast on bright backgrounds, opaque occlusion, transparent sorting, camera distance, and shutdown during scene changes. Offer a reduced-motion option that disables the weather. Measure the real scene on the intended device before making a performance claim.

*Disclosure: This original article and procedural fixture were prepared with AI assistance. The reported numbers come from the local adapter checks described above; no production footage or target-device result is claimed.*
