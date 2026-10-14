---
layout: post
title: "A PixiJS pickup pulse should remember where the pickup happened"
description: "Build a short NixieFX pickup pulse with explicit screen coordinates, repeatable inspection, and scene teardown."
date: 2026-10-14 12:00:00 +0400
---

A pickup effect has a specific job: acknowledge an event at the place where it happened. If it follows an object that has already moved or disappeared, the feedback can become difficult to read even when the particle simulation itself is working.

This recipe builds a small gold pickup pulse in PixiJS 8. It uses NixieFX 0.1.20 for the particles and a plain PixiJS circle as a stand-in pickup. The button triggers visual feedback; it does not grant inventory, validate a reward, or implement collection gameplay.

This is an AI-assisted, hand-authored runtime example. The local Chrome check observed 24 live particles at the inspection frame and zero after normal playback completed. It is not a device benchmark or an editor-exported asset.

## Give the event a position before adding polish

The important input is the position captured when the pickup event occurs. In this fixture that is the marker's current x and y. The effect receives those coordinates when it resets, rather than looking up the marker's position every frame.

That distinction is easy to inspect. Trigger a pulse, pause it, and move the marker. The old particles should remain where they were triggered. The next pulse should begin at the marker's new position. A moving pickup and an already completed pickup event are different things to animate.

The example uses downward screen Y and one pixel per effect unit. That makes the coordinate contract explicit. The default axis conventions of a VFX system should not decide where a 2D HUD event appears.

## Build the runnable fixture

Use Node 22, npm, and Python 3 in an empty directory. Install pinned packages and build the browser entrypoint:

```sh
npm init -y
npm install --save-exact pixi.js@8.22.0 nixie-fx@0.1.20
npm install --save-dev --save-exact esbuild@0.28.2
npx esbuild main.js --bundle --format=esm --outfile=bundle.js
python3 -m http.server 8000 --bind 127.0.0.1
```

Create main.js from the complete example below before running the build command. Create index.html with these controls and the canvas container:

```html
<!doctype html><html lang="en"><meta charset="utf-8">
<title>Pickup pulse</title>
<button id="pickup">Collect pickup</button>
<button id="inspect">Inspect at 0.12 s</button>
<button id="move">Move pickup</button>
<p id="status">Loading...</p><div id="view"></div>
<script type="module" src="bundle.js"></script></html>
```

Open the local server in a WebGL-capable browser. The main.js entrypoint is:

```js
import { Application, Graphics } from 'pixi.js';
import { createDefaultParticleEffect, createConstantParticleScalar } from 'nixie-fx';
import { PixiVfxRenderer, createPixiVfx2dProjection } from 'nixie-fx/pixi';

const app = new Application();
await app.init({ width: 640, height: 360, background: '#102333',
  preference: 'webgl', antialias: true, preserveDrawingBuffer: true });
document.querySelector('#view').appendChild(app.canvas);
const marker = new Graphics().circle(0, 0, 14).fill(0xffd578);
marker.position.set(320, 180);
app.stage.addChild(marker);

const definition = createDefaultParticleEffect();
definition.id = 'pickup-pulse';
definition.targetProfile = 'pixi-ui-2d';
definition.timeline.duration = 0.6;
definition.timeline.loop.enabled = false;
const e = definition.emitters[0];
e.id = 'pulse'; e.maxParticles = 24; e.duration = 0.05; e.loop = false;
e.spawn.rate = 0; e.spawn.rateValue = createConstantParticleScalar(0);
e.spawn.bursts = [{time:0,count:24,cycles:1,interval:0,probability:1}];
e.spawn.shape = 'circle'; e.spawn.radius = 22;
e.spawn.radiusValue = createConstantParticleScalar(22);
e.spawn.rotation = [90, 0, 0];
e.initializeParticle.lifetime = createConstantParticleScalar(0.45);
e.initializeParticle.size = createConstantParticleScalar(10);
e.initializeParticle.velocity.speed = createConstantParticleScalar(45);
e.initializeParticle.color.color = [1, 0.75, 0.2, 1];
e.render.shading = 'unlit'; e.render.blend = 'additive';
e.render.depthTest = false; e.render.depthWrite = false; e.render.depthInk = false;
e.modules.color = true;
e.color.gradient.colorStops = [{position:0,color:[1,0.75,0.2]}, {position:1,color:[1,0.75,0.2]}];
e.color.gradient.alphaStops = [{position:0,alpha:1}, {position:1,alpha:0}];
const vfx = new PixiVfxRenderer({parent:app.stage,
  projection:createPixiVfx2dProjection({yAxis:'down',pixelsPerUnit:1})});
const pulse = vfx.createEffect(definition, {seed:226,autoStart:false});
let paused = false;
function trigger(inspect = false) {
  paused = false;
  pulse.reset({position:[marker.x,marker.y,0],seed:226,timeSeconds:0});
  if (inspect) {for(let i=0;i<12;i++)vfx.update(0.01);paused=true;app.render();}
}
document.querySelector('#pickup').onclick = () => trigger();
document.querySelector('#inspect').onclick = () => trigger(true);
document.querySelector('#move').onclick = () => {marker.x=marker.x===320?460:320;};
app.ticker.add(ticker => {
  if (!paused) vfx.update(ticker.deltaMS/1000);
  document.querySelector('#status').textContent =
    `${pulse.stats.activeParticles} live / 24 cap · ${paused?'paused at 0.12 s':'playing'} · marker x=${marker.x}`;
});
addEventListener('pagehide',()=>{vfx.destroy();app.destroy(true);},{once:true});
```

## Read the settings as a small contract

The emitter schedules one burst of 24 particles. Continuous emission is zero, looping is disabled, and each particle lives for 0.45 seconds. A fixed seed makes inspection repeatable. The configured color gradient reduces opacity over particle lifetime.

The circle spawn shape is rotated into the screen plane. Random particle placement makes this a short scatter around the pickup, not an evenly spaced geometric ring. The marker is a stand-in, so a real game should supply its own asset and event position.

For a visual authoring workflow, a [pixi js particle editor guide](https://nixiefx.com/pixijs-particle-effects/) explains how NixieFX effects connect to PixiJS. This recipe creates the effect definition directly in code so every setting used by the fixture is visible. It does not claim that the code came from an editor session.

## Keep replay and frame updates separate

Reset starts the next pulse with a fresh event position, seed, and effect clock. Repeated pickup clicks replace this one instance's current pulse. They do not create an unlimited list of simultaneous effects.

The ticker advances the VFX renderer once per frame, with milliseconds converted to seconds. The inspection control uses twelve 0.01-second updates to reach 0.12 seconds, then holds simulation. Stepping through the brief emission window keeps the inspect action consistent with playback; jumping over the entire window is a poor way to inspect a scheduled burst.

preserveDrawingBuffer is enabled here to support local visual inspection. Treat that as a fixture choice and measure any equivalent option in a production renderer. It is not a performance recommendation.

## Verify placement, replay, and completion

The local Chrome check showed the gold pulse and a 24-particle counter at 0.12 seconds. Moving the marker while paused left the existing pulse at its previous event position. A subsequent trigger used the new marker position, and normal playback returned the live counter to zero.

For your integration, check:

- Trigger once and confirm the feedback is centered on the event position.
- Move the pickup after a trigger and confirm the old pulse stays put.
- Trigger again and confirm the new position is used.
- Click repeatedly and verify the single-instance replacement policy is acceptable.
- Let the effect finish and check that no particles remain active.
- Leave the owning scene and remove its ticker callback and VFX resources.

The pagehide cleanup releases this standalone application's renderer and application. A game with multiple scenes should instead attach equivalent cleanup to the scene's lifecycle while preserving the shared application.

## Limits to carry into the game

This is a fixed-size, screen-space fixture with unlit billboards. It has no collisions, inventory updates, server acknowledgement, texture loading, trails, or dynamic scene lighting. It does not establish Three.js appearance or mobile frame time. Pixi's lighting and depth behavior must not be assumed to match a 3D renderer.

Connect the pulse to the point where your game actually accepts a pickup. Then measure it with the rest of the scene and the devices you support. Position correctness, event timing, and bounded lifetime should be established before increasing particle count or adding more layers.
