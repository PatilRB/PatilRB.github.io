---
layout: post
title: "Why the Same Particle Effect Glows Differently in PixiJS and Three.js"
description: "A practical comparison protocol for separating NixieFX simulation, backend support, preview bloom, exposure, and the host game's post-processing pipeline."
date: 2026-10-20 11:00:00 +0400
---

A particle effect can use the same seed, lifetime, velocity, and color curve in two previews and still produce different final pixels. That does not automatically mean one backend is broken.

The useful question is not “Why are the screenshots identical or different?” It is “Which part of the image came from the shared simulation, which part came from the renderer, and which part came from the host's bloom and exposure pipeline?”

That distinction prevents a common debugging mistake: compensating for a post-processing difference by changing the particle effect itself.

## Start with what is shared

NixieFX uses one deterministic simulation core for its PixiJS and Three.js adapters. With the same exported effect, seed, and sequence of `update(deltaSeconds)` calls, particle birth, lifetime, motion, curves, and gradients are intended to follow the same simulation.

Rendering is not shared in the same way. PixiJS targets 2D scenes, HUD effects, and screen-space quads. Three.js targets 3D world effects with camera-facing quads, GPU depth behavior, and an instanced path for eligible emitters.

That means “the same effect” has two layers:

1. The authored and simulated behavior that should remain comparable.
2. The backend and host-pipeline behavior that may legitimately look different.

The current [NixieFX documentation](https://nixiefx.com/vfx-runtime-docs/) makes this boundary explicit through per-backend support reports and a capability matrix.

## Preview bloom is not an exported promise

The editor includes HDR-style preview bloom controls such as threshold, intensity, exposure, scatter, quality, and downscale. Those values help an artist inspect an effect, but the preview-bloom configuration is not serialized into the exported effect bundle.

Authored HDR emissive intensity is different. It is preserved linearly so the game can feed it into its own tone mapping and bloom pipeline.

The practical consequence is simple: copying an editor exposure value into a bug report does not describe the shipped game. The report must also name the host renderer, tone mapping, bloom pass, threshold, output color space, background, and camera conditions.

For a Three.js game with its own HDR post-processing, do not stack a preview-grade bloom path on top of the real bloom pass. Leave preview bloom off, pass the authored over-range color into the game pipeline, and let that pipeline choose the threshold and exposure.

## PixiJS and Three.js solve different rendering problems

The shared simulation does not erase backend differences.

| Area | PixiJS backend | Three.js backend |
|---|---|---|
| Primary space | 2D scenes, HUD, UI | 3D world effects |
| Billboards | Screen-space quads in batched containers | Camera-facing world quads, with an instanced fast path when eligible |
| Materials | Baked textures plus per-particle channels | Compiled shaders for dynamic per-pixel material features |
| Lighting | Lit shading is not supported | Lit shading is supported for world/mesh particles |
| Depth | Deterministic 2.5D ordering and depth ink | GPU depth test and depth write |
| Mesh-surface emission | Falls back to point and is reported | Supported |

An additive spark can therefore be simulated identically while looking different against a 2D UI background and a tone-mapped 3D scene. A lit particle cannot be treated as portable just because it renders in the Three.js preview. A depth-related difference cannot be fixed responsibly by raising emissive intensity.

## A reproducible comparison protocol

Use one exported bundle and separate simulation checks from image checks.

### 1. Pin the inputs

Record the effect hash or commit, NixieFX version, backend version, seed, fixed update step, and capture time. A comparison using different seeds or variable frame histories is not a controlled comparison.

### 2. Read both support reports

Inspect `support.backends.pixi2d` and `support.backends.three3d`. Stop if either backend is `blocked`. If one is `partial`, list every approximation before discussing visual differences.

### 3. Disable optional post-processing

Capture a baseline without preview bloom or a host bloom pass. Use a fixed solid background. In Three.js, pin the camera and tone-mapping settings. In PixiJS, pin resolution and the screen-space scale.

### 4. Compare behavior before pixels

Check particle counts, spawn times, lifetime, motion, and event timing. If those diverge with the same seed and fixed steps, investigate the simulation or integration. Do not reach for exposure first.

### 5. Add the intended host pipeline

Turn on only the bloom and tone mapping the shipped host will use. Record the settings next to the capture. Compare the result against the baseline rather than against an editor screenshot with unknown preview controls.

### 6. Judge backend-specific features separately

If an effect uses lit shading, GPU depth, a dynamic material graph, or mesh-surface emission, evaluate that feature only on a backend that supports it. A portability check should use the exported warnings as evidence, not visual optimism.

## Worked example: a blue additive spark

Consider a one-second spark burst with a blue-to-transparent gradient and authored HDR intensity. The motion uses a fixed seed and a 1/60-second update step.

The comparison record could look like this:

```yaml
effect: blue-spark-burst
seed: 42012
step_seconds: 0.0166667
capture_at_seconds: 0.25

pixi:
  backend: pixi2d
  support: supported
  background: "#10141c"
  resolution: "1280x720"
  host_bloom: none

three:
  backend: three3d
  support: supported
  background: "#10141c"
  camera: "fixed, perspective"
  tone_mapping: none
  host_bloom: none

compare_first:
  - active particle count
  - particle positions
  - alpha over lifetime
  - unsupported feature list
```

If those behavioral checks agree, add the real Three.js bloom pass and record its threshold and exposure. The new glow is then evidence about the host pipeline, not a claim that the PixiJS adapter lost particles.

This example is a test design, not a measured benchmark. It deliberately avoids invented screenshots or performance numbers.

## Common mistakes and better fixes

**Mistake: matching screenshots by eye.** Two captures may use different backgrounds, cameras, device pixel ratios, or tone mapping. Fix the capture conditions before changing the effect.

**Mistake: serializing preview expectations.** Preview bloom settings are inspection controls, not part of the effect export. Record the game's real pipeline separately.

**Mistake: forcing identical pixels.** The backends have different depth, lighting, and material capabilities. Aim for the same artistic intent and verified simulation where the feature is portable.

**Mistake: ignoring `partial`.** An effect that renders with an approximation is not fully supported. Keep the warning in the review evidence.

**Mistake: brightening to hide a depth issue.** Inspect sorting, depth test, depth write, blend mode, and camera space before changing emissive intensity.

## The review rule

Accept a cross-backend effect only when the record distinguishes three things:

- what the shared simulation produced;
- what each backend supports or approximates;
- what the host's bloom, exposure, tone mapping, and background added.

Once those layers are named, “the glow looks different” becomes a bounded engineering question instead of an invitation to tweak values until two screenshots happen to resemble each other.
