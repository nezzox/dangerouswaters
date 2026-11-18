# Dangerous Waters

Keep the game local and dependency-free. Start with `./start.sh`; test with `node --test tests/*.test.mjs` (or `uv tool run --from nodejs-wheel node --test tests/*.test.mjs`).

Game direction: serious, challenging northern crab fishing. An overhead vessel, harsh but varied weather, finding crab grounds, setting and hauling pots, selling catch and upgrading the vessel. Avoid cartoon visuals. Prioritize boat handling, readable navigation and meaningful risk.

Keep simulation rules in `simulation.mjs` independently testable. The primary renderer is dependency-free WebGL 2 in scene.mjs. Preserve the legacy WebGPU ocean and automatic Canvas fallback. Keep buoyancy and ocean wave heights consistent. No external assets, CDN requests or AI API calls. Clearly document provisional systems; do not claim physical realism for approximations.

Verify gameplay in the browser, check console errors, and run the simulation tests. Preserve user saves; changing the save format requires an explicit migration or a new version key.
