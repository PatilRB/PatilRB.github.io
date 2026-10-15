---
layout: post
title: "Leave dust behind the runner, then let it settle"
description: "A distance-gated Three.js dust trail with bounded instances, explicit completion, and a small NixieFX fixture."
date: 2026-10-15 09:00:00 +0400
---

A dust trail should describe movement. If it emits while the character stands still, it describes the update loop instead. This Three.js example creates a small one-shot puff only after the moving source has traveled far enough, then leaves that puff at its own world position.

AI assistance was used to prepare this original NixieFX-related article. The local fixture uses NixieFX 0.1.20 and Three.js 0.185.1. It is a small lifecycle demonstration, not a production performance benchmark.

## Choose distance and time gates together

A time-only emitter produces the same rhythm whether the character moves slowly or sprints. A distance-only emitter can create too many puffs during a teleport or noisy position update. Use both: at least 0.35 world units since the previous emission and at least 0.10 seconds since the previous puff.

The sample also caps concurrent instances at six. These values are design choices for the tiny scene, not recommended universal defaults. A different world scale, camera, or movement speed needs different numbers. The important property is that the controller has a clear upper bound.

For a worked example, move a source from x = -2 toward x = 2 over one second. Put the puffs at y = 0.05, slightly above the ground grid. Each puff contains at most 24 particles with a 0.45-second lifetime. Stop creating new puffs at one second and keep updating existing ones until they finish.

## Keep each puff's origin independent

Do not reuse a single instance by moving it to every new foot position if your intended result is a chain of independent puffs. Give each puff its own origin and remove it after completion. The controller below receives a verified one-shot effect and an existing `ThreeVfxRenderer`.

```js
class DustTrail {
  constructor(vfx, effect) {
    this.vfx = vfx; this.effect = effect;
    this.live = new Set(); this.last = null; this.cooldown = 0;
  }
  update(position, dt, moving = true) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    const distance = this.last
      ? Math.hypot(...position.map((v, i) => v - this.last[i]))
      : Infinity;
    if (moving && this.cooldown === 0 && distance >= 0.35
        && this.live.size < 6) {
      this.live.add(this.vfx.createEffect(this.effect, {
        position: [...position], seed: 90 + this.live.size
      }));
      this.last = [...position]; this.cooldown = 0.10;
    }
    this.vfx.update(dt);
    for (const fx of this.live) {
      if (!fx.isActive) {
        this.vfx.removeEffect(fx); this.live.delete(fx);
      }
    }
  }
}
```

Call this controller once per simulation step. It owns the call to `vfx.update(dt)` in this example; a larger game should centralize that update rather than advancing the same renderer twice. On a teleport, clear or reset the controller's last position so a discontinuity does not imply a continuous trail.

## Build an asset-free sample

For a developer evaluating a three js particle editor, the [NixieFX Three.js runtime guide](https://nixiefx.com/threejs-runtime/) supplies the adapter and export context. The sample here intentionally uses ordinary billboard puffs so the integration boundary stays visible.

Install `nixie-fx@0.1.20` and `three@0.185.1` in a disposable JavaScript project. Use the helper below to compile the small effect and verify it for the Three backend. Create a scene, camera, ground grid, and renderer through your normal Three.js setup, then call `recipe('dust', 'three3d')` once and pass the result to the controller.

```js
import {createDefaultParticleEffect,createConstantParticleScalar as s} from 'nixie-fx';
import {compileVfxExport,loadVfxExportBundle} from 'nixie-fx/export';
export function recipe(id,backend){
 const source=createDefaultParticleEffect(id,id);
 source.targetProfile=backend==='pixi2d'?'pixi-ui-2d':'three-world-3d';
 source.timeline.duration=1;source.timeline.loop.enabled=false;
 const e=source.emitters[0];e.id='particles';e.loop=false;e.duration=.05;e.maxParticles=24;
 e.spawn.rotation=[90,0,0];e.spawn.rate=0;e.spawn.rateValue=s(0);e.spawn.shape='circle';e.spawn.radius=backend==='pixi2d'?22:.12;e.spawn.radiusValue=s(e.spawn.radius);
 e.spawn.bursts=[{time:0,count:24,cycles:1,interval:0,probability:1}];
 e.initializeParticle.lifetime=s(.45);e.initializeParticle.velocity.speed=s(backend==='pixi2d'?30:.25);
 e.initializeParticle.size=s(backend==='pixi2d'?6:1);e.billboard.sizeStart=backend==='pixi2d'?4:.09;e.billboard.sizeEnd=e.billboard.sizeStart;e.billboard.sizeValue=s(e.billboard.sizeStart);
 e.render.blend='alpha';e.render.shading='unlit';e.render.depthTest=backend!=='pixi2d';e.render.depthWrite=false;
 e.initializeParticle.color.color=id==='dust'?[.6,.5,.35,.65]:[.3,.8,1,.8];
 e.modules.color=true;e.color.gradient.colorStops=[{position:0,color:id==='dust'?[.6,.5,.35]:[.3,.8,1]},{position:1,color:id==='dust'?[.6,.5,.35]:[.3,.8,1]}];e.color.gradient.alphaStops=[{position:0,alpha:.8},{position:1,alpha:0}];
 const c=compileVfxExport([{effect:source,effectPath:`effects/${id}.json`}]);
 return loadVfxExportBundle({manifest:c.manifest,effectsByPath:Object.fromEntries(c.effects.map(x=>[x.path,x.effect])),assetPaths:[]},{requiredBackend:backend,requireEveryAsset:true}).effectsById.get(id);
}
```

Drive the source along the example path in 0.01-second steps. Keep the camera fixed for the first check. Once the source stops, continue advancing the renderer so the remaining particles can finish. On scene teardown, destroy the VFX renderer and dispose the host-owned ground, character, and WebGL resources separately.

## What the local fixture showed

At a fixed simulation age of 0.65 seconds, Chrome displayed four concurrent puffs and 96 live and visible particles. The automated controller check stayed within the six-instance cap and drained to zero after movement stopped. The Three adapter reported zero unsupported features for this asset-free sample.

Those observations are deliberately narrow. They do not measure GPU time, fill rate, battery usage, or behavior on a phone. A visible-particle count is not a measurement of frame cost. Test overdraw against the real game's floor and lighting, especially when several characters move together.

The puff appearance is also a placeholder for art direction. The sample's overlapping circles communicate the lifecycle clearly, but do not establish a convincing dust material. A real texture needs an appropriate provider, successful asset loading, and a visual review at the actual camera distance.

## Give the trail a release checklist

Check that standing still produces no new puffs, small motion below the distance threshold stays quiet, and a long frame cannot produce an unbounded burst of instances. Verify stopping, teleporting, scene changes, and repeated restarts. Confirm that old puffs stay at their recorded origins rather than snapping to the latest character position.

The recipe does not implement ground collision, terrain-color sampling, wind, or soft intersections with scene depth. It does not promise the same appearance in PixiJS. If an authored material or runtime support report changes, review those limitations again. The useful result is a controlled trail whose creation and completion can be explained before adding visual complexity.
