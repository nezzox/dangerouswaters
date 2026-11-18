# Dangerous Waters

Play: https://nezzox.github.io/dangerouswaters/

Version 0.13 adds a Ballyhoo Road-inspired industrial waterfront and a louder, weather-driven ambient soundscape. Version 0.12 adds geographic coastlines around the Bering Sea and Dutch Harbor, smoother local coastal relief, hull-clipped ocean water with thin deck wash, previews rendered from all 100 vessel models, and a black Ko-fi support button. Harbor services provide fuel and repairs; equipment purchases belong in the shop. Terrain elevations remain illustrative.

A local crab fishing game on the Bering Sea. Version 0.10 replaces the inflated patchwork water with compressed directional swell, filtered irregular wind ripples, thinner moving crest foam, and corrected overcast reflections. Boat buoyancy and suspended fenders now have damped motion, and the fender ropes are slender curved lines. Setting and hauling both work while moving below 5 knots. Three separate time buttons select ×1, ×5 or ×15, Center Vessel enables continuous chart following, full-hull harbor clearance prevents pier penetration, and animated dock staff receive crates and push a trolley.

## Run

```bash
cd ~/Spel/Dangerous-Waters
./start.sh
```

Open http://127.0.0.1:8780. Python 3 is sufficient; no packages, API keys, external assets or build step are required. The server only listens locally. Reload after changing source files.

## Controls and fishing

- **W/S** or the speed slider selects target speed in knots; acceleration and stopping take time. **A/D** controls the rudder and disengages autopilot. Space and WASD remain available after using the slider or chart.
- Find the marked fishing grounds. Below 5 knots, **Space** sets a pot over 14 seconds. The vessel keeps its selected speed and the pot drops at its actual release position. Bait costs 150 kr.
- Leave the 80 m ring to set another pot. Soak for 2–3 game hours. A game hour normally takes 45 seconds; the **×1 / ×5 / ×15** buttons speed up the entire simulation: travel, turning, fuel use, weather, soaking, work, waves, crew and spray. Inputs and UI remain responsive in real time. Pause freezes the same shared simulation clock.
- Approach a buoy within 80 m on the **starboard side**, beside the hauler. **Space** starts a 32-second hook, retrieval, lift and sorting sequence. Catch is visible in the cage and falls through the open hold hatch. The vessel keeps its selected speed and steerage while hauling and sorting. The governor caps deck work at 4.9 knots if a higher speed is selected. Catch and equipment are credited once the sequence finishes.
- Below 2 knots inside the harbor service area, **E** or **Harbor & Upgrades → Dock & Unload** starts docking. The pilot first moves clear of nearby piers, turns in open water and backs into the berth with the hull parallel to the pier. The conservative hull and fender envelope is checked against piers during normal navigation as well. The maneuver takes time; the simulation-speed buttons also accelerate docking. Then the harbor crane moves baskets from the open hold to the receiving bin. Revenue at 65 kr/kg is credited after the sequence completes. Service and other deck jobs are locked during this operation.
- Buy engine, hold and pot upgrades; refuel and repair in harbor. A tow costs up to 12,000 kr.
- Mouse wheel over the sea zooms the 3D view. The camera button switches between angled and overhead views. **Esc** or the pause button pauses. Losing window focus also pauses.
- Work lights, synthesized engine/wind sound, weather previews and time acceleration have individual controls.

The season and active fishing/docking operations are saved locally under the existing `dangerous-waters-v1` key. Use the same browser and URL to continue. Existing saves remain supported. **Harbor → Start over** replaces the saved season.

## Chart

Scroll to zoom around the cursor, left-drag to pan, and right-click to set an autopilot destination. Center Vessel locks the chart center to the moving vessel until you manually pan. Zooming retains follow mode. Autopilot uses the selected speed (6 knots if stopped), slows for turns and stops near the destination. A/D or Cancel AP disengages it. Keyboard chart controls are arrows, +/−, Home and Enter; WASD and Space continue to operate the vessel. Autopilot follows a point and does not plan around obstacles. The harbor docking sequence has a separate prescribed approach with clearance for the bow and stern during turns.

## Rendering and approximations

The primary renderer is native WebGL 2: procedural vessel, harbor, articulated crew, depth-map shadows, displaced ocean, sky reflections, spray, historical wake trails and directional lights. Crew route around cage stacks, the hatch and sorting table, crane base, hauler and deck fittings. They yield and replan around one another. Different workwear, helmet and skin palettes identify individuals. On a long transit, up to two take staggered breaks inside the cabin while someone remains on deck. The door opens for passage; work calls them back outside. Sustained rough seas can occasionally send a deckhand to the rail for a brief seasickness animation, with several minutes between occurrences. These are cosmetic routines, not a fatigue or health economy. Hull outlines use interpolated cross sections; faces and clothing use smooth ellipsoid normals. Rounded cabin edges and cylindrical fittings use smooth surface normals. The camera starts closer and supports a closer inspection zoom.

Material lighting uses a GGX microfacet approximation, linearized color, environment reflections, contact shading and a 2048-pixel shadow map. A separate reflection camera renders the vessel, crew, deck equipment and harbor into a mipmapped color/depth target, capped at 1536 pixels wide. This is a planar reflection around mean sea level, with normal-based distortion and roughness filtering; it does not trace individual curved-wave reflections. The reflection pass adds GPU work, especially when zoomed out in harbor.

`sea-spectrum.mjs` provides a shared eight-component Gerstner-style swell. It inverts horizontal compression to sample the same choppy height field for CPU buoyancy and GPU water. A spring-and-damper response smooths vessel heave, pitch and roll instead of rigidly copying every short crest. The ocean grid concentrates vertices close to the vessel and becomes coarser at distance. Filtered, spatially modulated wind ripples and gravity-driven spray supplement that displacement.

Wake stamps remain in world coordinates through turns and fade over 42 seconds. Fine turbulent foam breaks up sharper wave crests. Thin raised foam strands travel with the dominant wave crests; the former fixed grid of tall patches is removed. Wake foam spreads from historical positions. Fenders are suspended outside the sampled hull width, respond as damped pendulums and stop at contact limits. Their thin matte ropes have a changing curve, with their endpoints attached to the rail and moving eyelet. These are approximate animations rather than rigid-body or fluid physics. Wind-driven rain has several depth layers, with intermittent sleet/snow mixed in. These effects, the deterministic weather fronts, volumetric light beams and simplified light occlusion are artistic real-time approximations. They are not physical fluid, atmospheric or ray-tracing simulations. The graphics remain a prototype rather than photorealism.

The legacy WebGPU ocean and Canvas fallback remain available if WebGL 2 cannot run. Detailed harbor crane and crew visuals require the 3D renderer; gameplay and delayed unloading settlement still work in fallback. Prices are fixed, and detailed quotas, icing, seabed mapping and crew management remain future work.

## Source and verification

- `simulation.mjs`: navigation, fishing, docking, weather and economy.
- `scene.mjs`, `scene-shaders.mjs`, `geometry.mjs`, `math3d.mjs`: procedural 3D graphics and lighting.
- `crew.mjs`, `deck-layout.mjs`: crew routines, clearance tests and deck pathfinding.
- `deck-work.mjs`, `wake.mjs`, `foam.mjs`, `fenders.mjs`: fishing animations, wake history, raised foam and hanging fittings.
- `voyage.mjs`: shared scaled clock with bounded simulation steps.
- `buoyancy.mjs`, `harbor.mjs`: damped vessel motion, conservative hull collision tests and docking route poses.
- `tests/visual.html`: isolated visual fixture for cabin breaks, seasickness, water, moving pot work and dock staff; never reads or writes season saves.
- `chart.mjs`, `game.mjs`, `index.html`, `style.css`: chart, input, UI, sound and saves.
- `ocean.mjs`: legacy ocean renderer.

Run with Node.js 22 or later:

```bash
node --test tests/*.test.mjs
```

On this computer:

```bash
uv tool run --from nodejs-wheel node --test tests/*.test.mjs
```

Tests cover navigation, pot operations, geometry, crew routing, chart coordinates, wake persistence, and docking settlement including pause and save/resume. Browser checks verify WebGL startup, English UI, instrument focus and the harbor sequence.


## Career expansion (0.10)

Harbor-only searchable shop: 100 skill ranks, 100 part grades and 100 vessel configurations. Automatic setting/hauling, salmon nets on capable hulls, 50 occasional incidents with timed crew repairs, fixed-fee loans with landing deductions, and hired-captain vessels with separately colored chart boats/pots and explicit spending requests. Parts stay with the hull; skills stay with the company. Legacy v1 seasons migrate without reset. See [career specification](docs/career.md) and [hosting and gameplay details](docs/hosting.md).

Build an upload-ready static archive with `python3 package-web.py` (or `npm run package:web`). Upload the archive contents to any static webserver; no backend is required. Finance & Saves offers local JSON export/import for moving a season to another domain. The isolated manual QA page at `/tests/career.html` has test funds and never accesses the real save; it is excluded from the web package.


## Docking and language (0.11)

Docking now takes a direct route when aligned and secures the vessel after unloading; set target speed to cast off. Moorings and in-progress unloads survive reloads. English/USD and Swedish/SEK can be selected on the welcome screen, footer and shop. A fixed 10 SEK/USD game conversion preserves existing balances and loan values. UI, catalog and incident text is translated at presentation time; simulation/save economy stays unchanged. Currency-aware loan inputs use the displayed currency.

Validation: 71 tests, including direct docking, mooring hold/restart, zero-length redocking, catalog/incident translation and currency consistency. Browser checks verified zero horizontal/heading drift for 15 simulation seconds, completed the existing saved harbor approach, switched both currencies, purchased a skill and took a $1,000 loan in an isolated fixture, and preserved Swedish/SEK and mooring after reload. The final main-page console was clean.


## Geographic world, storm deck water and shop previews (0.12)

Bering Sea coastlines and real coordinates now replace the fictional rectangular coast. The chart zooms from Dutch Harbor through the Aleutians to the regional sea. Locally bundled Natural Earth and OpenStreetMap data drive coast/terrain/land collision, Dutch Harbor building/road/pier footprints and sea-route planning. Old seasons migrate without losing inventory or balance. The service facility, relief and bathymetry remain interpreted gameplay scenery, not a surveyed replica: see [sources and geographic limits](docs/geography.md).

Ocean/foam no longer intersects the hull interior; rail overtopping creates a thin draining deck sheet. All 100 vessel configurations have actual 3D-model previews in the catalog and exchange review. Paused frames are retained while menus are open so preview generation does not compete with continuous ocean rendering.
