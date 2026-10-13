---
layout: post
title: "A PixiJS card reveal that puts the glow at the right moment"
description: "Author a short NixieFX glow burst, trigger it at the midpoint of a card reveal, and keep input and reduced motion predictable."
date: 2026-10-13
---

A card reveal has two jobs: show the result clearly and make the transition readable. A bright effect that starts before the card changes can do the opposite. It draws attention to the back of the card, then leaves the actual reveal feeling late.

This example separates the card animation from a short particle burst. The card narrows, changes face at the midpoint, and expands again. The glow begins when the new face appears. The timings below are starting values for a prototype, not measured improvements in engagement or performance.

Disclosure: This tutorial was prepared with AI assistance. It is part of a NixieFX marketing assignment. The code is an integration example; no device-performance or user-testing results are claimed.

## Start with a small effect

If you are choosing a **pixi js particle editor**, begin with an effect you can explain without a long list of modules. For this reveal, one emitter is enough.

Create a NixieFX authoring project and add an effect named `card-reveal` with the `pixi-ui-2d` target profile. Use billboard particles, additive blending, and unlit shading. Set continuous emission to zero and disable looping. Add one burst of 24 particles at time zero, with capacity 32 and particle lifetime around 0.55 seconds.

Place the emitter in a rectangle approximately 200 by 280 screen units, centered on its local origin. That matches the example card's dimensions. Keep the Z extent at zero. Use soft procedural circle billboards, warm gold initial color, and an alpha-over-lifetime gradient that ends at zero. Start with particle sizes around 10 screen units and modest outward motion.

This produces a scattered glow around the card area. It is not an outline shader or a postprocessing bloom pass. If you need an exact luminous border, author that separately rather than expecting particles sampled across a rectangle to trace its edges.

The [NixieFX PixiJS particle-effects guide](https://nixiefx.com/pixijs-particle-effects/) covers the authoring-to-runtime bundle workflow. Export your project and deploy the resulting bundle under `/vfx` in the application that will run the example.

## Keep the card and the particles independent

The implementation uses PixiJS 8 and the NixieFX Pixi adapter. For NixieFX 0.1.20, use a compatible PixiJS release: its published peer range is 8.19.0 or newer within version 8.

Install the packages in a Vite or equivalent JavaScript project:

```bash
npm install pixi.js@8.19.0 nixie-fx@0.1.20
```

Create a card container so its horizontal scale can animate independently of the sprite's dimensions. Put the VFX renderer on the stage, where the effect position uses the same screen coordinates as that container. With a different parent, convert the position into that parent's local coordinates first.

This example uses a flat colored sprite to keep the integration small. Replace it with your actual front and back card artwork when the behavior is correct.

```js
import { Application, Container, Sprite, Texture } from "pixi.js";
import { loadVfxExportBundle } from "nixie-fx/export";
import { PixiVfxRenderer } from "nixie-fx/pixi";

const app = new Application();
await app.init({ width: 640, height: 480, background: "#101827" });
document.body.appendChild(app.canvas);

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}`);
  return response.json();
}
const manifest = await json("/vfx/manifest.json");
const effectsByPath = Object.fromEntries(await Promise.all(
  manifest.effects.map(async entry =>
    [entry.path, await json(`/vfx/${entry.path}`)])
));
const bundle = loadVfxExportBundle(
  { manifest, effectsByPath }, { requiredBackend: "pixi2d" }
);
const effect = bundle.effectsById.get("card-reveal");
if (!effect) throw new Error("Missing card-reveal export");
if (effect.assets.length) throw new Error("This example expects no file assets");

const card = new Container();
card.position.set(320, 240);
const face = new Sprite(Texture.WHITE);
face.anchor.set(0.5);
face.width = 200; face.height = 280; face.tint = 0x334155;
card.addChild(face); app.stage.addChild(card);
const vfx = new PixiVfxRenderer({ parent: app.stage });
const glow = vfx.createEffect(effect, { autoStart: false });
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
let elapsed = 0, revealing = false, fired = false;

function reveal() {
  if (revealing || glow.isActive) return;
  if (motionPreference.matches) {
    face.tint = 0xfbbf24; card.scale.x = 1;
    return;
  }
  elapsed = 0; revealing = true; fired = false;
  face.tint = 0x334155;
}
card.eventMode = "static"; card.cursor = "pointer";
card.on("pointertap", reveal);
const button = document.createElement("button");
button.textContent = "Reveal card";
button.onclick = reveal;
document.body.appendChild(button);

app.ticker.add(ticker => {
  const dt = ticker.deltaMS / 1000;
  if (motionPreference.matches && (revealing || glow.isActive)) {
    revealing = false; glow.stop();
    face.tint = 0xfbbf24; card.scale.x = 1;
  }
  if (revealing) {
    elapsed += dt;
    const middle = 0.22, end = 0.44;
    card.scale.x = elapsed < middle
      ? 1 - 0.92 * (elapsed / middle)
      : Math.min(1, 0.08 + 0.92 * ((elapsed - middle) / middle));
    if (!fired && elapsed >= middle) {
      face.tint = 0xfbbf24;
      glow.spawn({ position: [card.x, card.y, 0], seed: 42 });
      fired = true;
    }
    if (elapsed >= end) { revealing = false; card.scale.x = 1; }
  }
  vfx.update(dt);
});

window.addEventListener("pagehide", () => {
  vfx.destroy(); button.remove(); app.destroy(true);
}, { once: true });
```

## Make the midpoint the trigger

The `fired` flag matters. Without it, a condition such as `elapsed >= middle` creates or restarts an effect every frame after the midpoint. Here it fires once per reveal. The guard in `reveal()` also rejects repeated taps while the animation or its glow is active.

The native HTML button provides keyboard access to the same action. The canvas is not treated as a complete accessible interface by itself. Reduced motion shows the result immediately and skips the particle burst; it still communicates that the card changed.

## Check the export and the result

Inspect the exported Pixi backend report before integrating the effect. Fix blockers and review partial-support warnings rather than treating the absence of a JavaScript exception as proof that every setting rendered correctly.

Keep this effect on the unlit billboard path. It does not use prepared 3D meshes, mesh-surface emission, or Three.js lighting. Pixi's depth-order behavior should not be described as a Three.js GPU depth buffer. Advanced material features may have their own support limitations; this example leaves them out.

Before using the reveal in a game, check the following:

- The burst begins when the front face appears, rather than on the initial tap.
- One tap produces one reveal, including when the frame rate changes.
- Repeated input does not accumulate overlapping effects.
- The keyboard button and reduced-motion setting produce a clear result.
- The bundle requests succeed and the scene releases its resources on exit.
- The glow stays readable against the actual card artwork and background.

Only after those checks should you tune particle count or intensity. A modest burst at the right time is easier to judge than a bright effect that hides the content it is supposed to reveal.
