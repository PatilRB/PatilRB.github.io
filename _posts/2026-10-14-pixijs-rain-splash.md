---
layout: post
title: "PixiJS rain splashes: five mistakes that make weather look wrong"
description: "Build a small PixiJS 8 splash, keep impact coordinates consistent, and avoid timing and cleanup mistakes."
date: 2026-10-14 10:00:00 +0400
---

Rain is easier to recognize when drops react to the surface beneath them. A falling streak establishes direction; a brief splash establishes contact. When the two disagree about position or timing, the weather looks pasted over the scene.

This walkthrough starts with a small PixiJS reference implementation. It uses ordinary sprites and a few motion values, so the behavior is easy to inspect before introducing an authored effect. The reference harness ran in Chrome with PixiJS 8.22.0. It is not a mobile performance benchmark or a tested NixieFX export.

## Mistake 1: treating a splash as more falling rain

The incoming drop and the outgoing splash need different motion. A drop approaches the ground. Splash particles start at the contact point, move outward and upward, then fade. Giving both the same downward velocity produces a thicker rain streak instead of an impact.

Start with six small particles. Use horizontal velocities of minus 65, minus 40, minus 15, 15, 40, and 65 pixels per second. Give them an initial vertical velocity of minus 90 and downward acceleration of 420 pixels per second squared. These are starting values for a compact reference scene, not recommended settings for every game.

Their upward motion reverses after roughly 0.21 seconds. A 0.45-second lifetime gives the particles time to rise and return without lingering. That relationship matters more than copying the numbers: the burst should communicate one contact event.

## Mistake 2: mixing coordinate systems

Define the contact point in the coordinate system of the container that owns the particles. A camera transform, scaled parent, or DOM canvas size can change how a position maps to the screen.

In the example below, the scene is 640 by 360 pixels, the ground is at y equals 280, and the particles belong directly to the stage. Convert pointer coordinates from the canvas rectangle into the scene's logical width. Otherwise, resizing the displayed canvas can move the splash away from the click.

For actual weather, the host game should call the same impact function when its drop crosses a surface. The snippet uses pointer input so you can inspect individual splashes without waiting for random rain.

## A complete small example

Install `pixi.js@8.22.0` in a browser project that supports npm imports, such as a Vite application. Put this in its JavaScript entry file. It creates its own canvas and uses a shared white texture, so it needs no downloaded artwork.

```js
import { Application, Sprite, Texture } from "pixi.js";

const app = new Application();
await app.init({
  width: 640, height: 360,
  background: "#101820", antialias: true
});
document.body.appendChild(app.canvas);

const groundY = 280;
const particles = [];

function dot(x, y, width, height, tint) {
  const sprite = new Sprite(Texture.WHITE);
  sprite.anchor.set(0.5);
  sprite.position.set(x, y);
  sprite.width = width;
  sprite.height = height;
  sprite.tint = tint;
  app.stage.addChild(sprite);
  return sprite;
}

dot(320, groundY + 8, 640, 16, 0x42525f);

function splashAt(x) {
  for (const vx of [-65, -40, -15, 15, 40, 65]) {
    if (particles.length >= 120) break;
    particles.push({
      sprite: dot(x, groundY, 3, 3, 0x8bd7ff),
      vx, vy: -90, age: 0
    });
  }
}

app.canvas.addEventListener("pointerdown", event => {
  const bounds = app.canvas.getBoundingClientRect();
  splashAt((event.clientX - bounds.left) * 640 / bounds.width);
});

app.ticker.add(ticker => {
  const dt = Math.min(ticker.deltaMS / 1000, 0.05);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.age += dt;
    p.vy += 420 * dt;
    p.sprite.x += p.vx * dt;
    p.sprite.y += p.vy * dt;
    p.sprite.alpha = Math.max(0, 1 - p.age / 0.45);
    if (p.age >= 0.45) {
      p.sprite.destroy();
      particles.splice(i, 1);
    }
  }
});
```

The particles deliberately look like small specks. Replace their texture after the timing and placement read correctly. An attractive texture can conceal a coordination problem during development.

## Mistake 3: advancing motion once per frame without time

Adding a fixed amount to position on every frame ties the effect's speed to the display's refresh rate. Use elapsed seconds for velocity and acceleration instead.

This example also clamps a single update to 0.05 seconds. That avoids a very large jump after a pause, but it slows simulated time when frames take longer than the cap. It is a visual-effect choice, not a general physics solution. A game that needs exact elapsed-time behavior should choose an appropriate stepping policy and test it separately.

## Mistake 4: forgetting the particles after they fade

An invisible sprite is still an object. Remove expired particles from the tracking array and destroy their display objects. Keep a maximum active count so a burst of impact events cannot grow the effect without bound.

In the browser reference harness, 100 simultaneous impact requests reached the configured cap of 120 splash sprites. The harness subsequently reported zero live splash sprites at 0.82 seconds of accumulated simulation time. That verifies this specific cap and cleanup path. It does not mean all 100 requested impacts were rendered: excess particles were intentionally omitted.

Those counts do not establish frame rate, memory use, or suitability for a particular phone. Profile a warmed scene on your target device before choosing a production budget.

## Mistake 5: assuming an editor preview is the game

Once the reference behavior is clear, a pixi js particle editor can help refine textures, color, emission, and lifetime without repeatedly editing the hand-written motion loop. The [NixieFX PixiJS integration guide](https://nixiefx.com/pixijs-particle-effects/) explains loading exported effects and attaching their renderer to a Pixi container.

If you replace this reference splash with a NixieFX effect, inspect the export's `pixi2d` support report and review the effect inside your actual scene. PixiJS renders NixieFX lit materials unlit, so Three.js scene-lighting behavior is unsupported in this 2D setup. Partial backend support can involve approximations; a blocked effect must not be presented as supported.

The code above has its own limits: a flat ground plane, simple gravity, no surface collision detection, no water simulation, and no particle pooling. It demonstrates the contact response rather than providing a complete weather system.

## Check the effect before shipping it

- Confirm that every burst starts at the visible contact point.
- Check placement after resizing the canvas and moving the camera.
- Inspect motion at different refresh rates and after a tab pause.
- Stop emission and verify that the active count returns to zero.
- Keep labels and controls clear of decorative weather.
- Respect reduced-motion preferences in the host game.

A convincing splash depends on agreement between the incoming drop, its contact point, and the outgoing particles. Establish that agreement first, then spend time on the artwork.
