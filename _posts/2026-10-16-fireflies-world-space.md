---
layout: post
title: "Ambient fireflies should stay in the room when the camera moves"
description: "A bounded Three.js firefly recipe with world-space simulation, a cleanup check, and explicit rendering limits."
date: 2026-10-16 09:00:00 +0400
---

A firefly effect can look convincing in a still frame and fail as soon as the camera moves. If the particles follow the camera like an overlay, the room appears to move with them. If every particle is bright and large, the effect can cover the scene instead of suggesting depth.

This recipe treats ambient fireflies as a small, world-space detail. It uses a bounded emitter and a repeatable seed so that placement and lifecycle can be inspected separately from art direction. The companion fixture uses NixieFX 0.1.20 and Three.js 0.185.1. It is a synthetic scene, not a performance claim about a game or device.

## Specify the space before the glow

Place the effect near a landmark that stays fixed in the world. A box, doorway, or column gives the eye something to compare against when the camera moves. The particles should remain associated with that region rather than sliding across the screen at a constant pixel offset.

Use a modest box-shaped spawn volume. For this fixture, the intended volume is four units wide, two high, and three deep. These are scene units; their physical meaning depends on the game. Set the particles to world simulation space and use a low initial speed. The point is a restrained ambient cue, not a swarm navigating around obstacles.

A three js particle editor helps author the effect, but the integration still needs a defined coordinate system. The [NixieFX Three.js runtime guide](https://nixiefx.com/threejs-runtime/) is the reference for the adapter used here.

## Build a bounded recipe

The companion source constructs a simple effect, compiles it, and validates it for the Three backend before returning the exported definition. The relevant authoring choices are:

```text
Target: three-world-3d
Spawn: box, 4 x 2 x 3 scene units
Simulation: world space
Emission: 8 particles per second
Lifetime: 3 seconds
Capacity: 48 particles
Initial speed: 0.025 scene units per second
Rendering: unlit alpha billboards; depth test on; depth write off
Opacity: fade in, hold, fade out
```

At a steady eight particles per second with three-second lifetimes, the nominal occupancy is about 24 live particles. That arithmetic is a planning estimate. The configured hard cap remains important during warmup, timing changes, and future edits. Check the real occupancy rather than relying on the estimate.

The small fixture's simulation check advances the adapter for 20 seconds, records peak occupancy, and verifies that the selected effect reports no unsupported features. It then stops further emission and advances long enough for the existing particles to expire. Those are lifecycle checks; they do not measure GPU frame time.

## Companion recipe module

Save the following as `effects.mjs` in a project with the stated dependencies. It is source for the fixture described above.

```js
import {createDefaultParticleEffect,createConstantParticleScalar as s} from 'nixie-fx';
import {compileVfxExport,loadVfxExportBundle} from 'nixie-fx/export';
export function effect(id){
 const p=createDefaultParticleEffect(id,id),e=p.emitters[0];
 const pixi=id==='portrait';p.targetProfile=pixi?'pixi-ui-2d':'three-world-3d';
 p.timeline.duration=id==='rain'?.6:4;p.timeline.loop.enabled=id!=='rain';
 e.id='particles';e.duration=p.timeline.duration;e.loop=id!=='rain';e.maxParticles=id==='rain'?12:48;
 e.spawn.shape=pixi?'circle':'box';e.spawn.radius=pixi?70:1;e.spawn.radiusValue=s(e.spawn.radius);
 e.spawn.boxSize=pixi?[140,180,0]:id==='fog'?[3,2,8]:[4,2,3];
 e.spawn.simulationSpace='world';e.spawn.rate=id==='rain'?0:8;e.spawn.rateValue=s(e.spawn.rate);
 e.spawn.bursts=id==='rain'?[{time:0,count:12,cycles:1,interval:0,probability:1}]:[];
 e.initializeParticle.lifetime=s(id==='rain'?.35:3);e.initializeParticle.velocity.speed=s(pixi?4:.025);
 e.initializeParticle.size=s(pixi?2:.04);e.billboard.sizeStart=pixi?2:.04;e.billboard.sizeEnd=e.billboard.sizeStart;e.billboard.sizeValue=s(e.billboard.sizeStart);
 e.render.blend='alpha';e.render.shading='unlit';e.render.depthTest=!pixi;e.render.depthWrite=false;
 e.initializeParticle.color.color=pixi?[.4,.7,1,.35]:id==='fireflies'?[.8,1,.3,.65]:[.6,.8,1,.25];
 e.modules.color=true;e.color.gradient.colorStops=[{position:0,color:pixi?[.4,.7,1]:[.8,1,.6]},{position:1,color:pixi?[.4,.7,1]:[.8,1,.6]}];
 e.color.gradient.alphaStops=[{position:0,alpha:0},{position:.25,alpha:pixi?.3:.45},{position:.75,alpha:pixi?.3:.45},{position:1,alpha:0}];
 if(id==='rain'){e.spawn.shape='point';e.spawn.rotation=[90,0,0];e.initializeParticle.velocity.speed=s(.3);}
 const c=compileVfxExport([{effect:p,effectPath:`effects/${id}.json`}]);
 return loadVfxExportBundle({manifest:c.manifest,effectsByPath:Object.fromEntries(c.effects.map(v=>[v.path,v.effect])),assetPaths:[]},{requiredBackend:pixi?'pixi2d':'three3d',requireEveryAsset:true}).effectsById.get(id);
}
```

## Keep the host loop easy to inspect

Once the fixture's compiled definition is available, the host integration is short:

```js
import { ThreeVfxRenderer } from 'nixie-fx/three';
import { effect } from './effects.mjs';

const vfx = new ThreeVfxRenderer({ scene, camera });
const fireflies = vfx.createEffect(effect('fireflies'), {
  position: [0, 1, -2],
  seed: 242
});

// Called by the existing host frame loop; dt is in seconds.
function updateAmbient(dt) {
  vfx.update(Math.min(dt, 0.05));
}

function leaveRoom() {
  fireflies.allowCompletion();
}

function destroyScene() {
  vfx.destroy();
}
```

`effects.mjs` is part of the companion fixture, not a package export. In a deployed game, load the validated exported bundle instead of constructing authoring data in the frame loop. Keep one owner for simulation updates and a clear teardown path when the scene is released.

Clamping the elapsed time here intentionally slows simulation after a long stall. It is a presentation policy for this ambient demo, not a universal simulation strategy. A game requiring strict replay timing should choose its own fixed-step policy and document it.

## Inspect the camera and shutdown separately

First, keep the camera still and let the effect reach a steady state. Then move the camera sideways while the landmark remains visible. Look for particles becoming hidden behind opaque geometry and for perspective changes between near and far particles.

Next, stop emission without moving the camera. The existing particles should fade out; they should not be replenished indefinitely. Finally, destroy the scene and check that the effect is no longer mounted or updated.

Repeat with the same seed when comparing two recipe revisions. Changing the seed at the same time as opacity or size makes a visual comparison harder to interpret.

## Know what the example leaves out

These billboards do not navigate, collide with the walls, illuminate the room, or provide volumetric fog. Their glow is an opacity and color treatment. The fixture does not add a bloom pass, and it does not establish mobile performance. Transparent objects can require additional sorting decisions even when opaque depth occlusion works.

Before using the effect in a level, inspect it against bright and dark backgrounds, at the intended camera distance, and with the game's real postprocessing. For reduced motion, offer a static ambient treatment or disable the effect while retaining the scene's visual landmarks.

*Disclosure: Prepared with AI assistance for a NixieFX-related content task. The example uses procedural assets and makes no claim about production footage or device performance.*
