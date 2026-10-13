# Canvas 2D versus an authored NixieFX burst

This standalone demonstration accompanies N-020. It compares a small hand-coded Canvas 2D alternative with an exported NixieFX effect rendered in PixiJS. Both produce 24 procedural particles with a 1.0-second lifetime. Their random generators, rendering and positions are not interchangeable.

Run without building:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Hold 0.30 and 0.70 seconds: each panel reports 24 visible particles. Hold 1.10 seconds: both report zero. Enable Reduce motion and click Replay once to get a still frame. Dispose removes the Pixi canvas and disables controls; reload to recreate.

Rebuild only if editing sources:

```sh
npm install
node make-effect.mjs
npx esbuild source.js --bundle --format=esm --minify --outfile=main.js
cp -R public/vfx .
```

The source uses nixie-fx 0.1.20 and PixiJS 8.19.0. `authoring` contains the editable fixture; `vfx` is the compiled bundle used by the browser. `main.js` is bundled, while `source.js` and `make-effect.mjs` are readable sources.

Validation/export passed with zero errors and zero warnings. Both export backend reports are supported; only PixiJS was executed in this demonstration. No mobile-performance claim, whole-editor feature comparison, graph conversion or third-party runtime compatibility is implied. Reduced motion holds a representative frame and does not animate replay. No network service or customer data is needed; assets load from this directory.

Prepared with AI assistance for a NixieFX marketing assignment. The companion article contains the assigned contextual product-documentation backlink.
