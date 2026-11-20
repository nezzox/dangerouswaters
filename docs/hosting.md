# Hosting Dangerous Waters 0.12

Unzip the web package into a directory on an ordinary webserver. Open its index.html URL over HTTP or HTTPS. All resources are relative, so a subdirectory such as /games/dangerous-waters/ works. No Node, Python, database, external assets or build service is needed on the server. Do not open index.html with file://.

Serve .mjs as text/javascript (or application/javascript), .css as text/css, and .html as text/html. Modern Apache/Nginx normally recognize these. For Apache, if necessary add `AddType text/javascript .mjs` to the site's configuration/.htaccess. For Nginx, add `mjs` to the existing JavaScript MIME entry. Do not replace the server's entire MIME map. Enable HTTPS for the legacy WebGPU path; the primary renderer uses WebGL2 and automatically falls back if unavailable.

Upload every file together on an update. The entry module, stylesheet and module imports have a version query to avoid mixing older cached code. Preserve query strings when serving static files. Rebuild packages with `python3 package-web.py`; bump the asset query revision when changing a published build.

## Saved seasons

The game stores one season in browser localStorage under dangerous-waters-v1. Old 0.9 seasons migrate automatically. Current saves retain debt, skills, hull equipment, nets, incidents and captain requests. Seasons are per browser profile and origin (protocol + host + port). Localhost saves are not automatically available on a public domain. Use Fleet & Finance > Finance & Saves > Export Saved Season before moving, then choose the JSON file and explicitly Replace on the destination. Keep a backup. No account or server-side sync is provided.

The game never sends saves to a server. Export/import uses local JSON files. Site storage must be allowed. Fleet simulation runs only while the game is active and unpaused; there is no offline income or multiplayer economy. A background/inactive tab may be throttled by the browser.

## Career mechanics

The shop button appears only within 230 m of Dutch Harbor; stop below 2 knots and finish operations/repairs to purchase. There are 100 skill purchases (20 disciplines × 5 cumulative ranks), 100 installed part purchases (20 systems × 5 grades), and 100 vessel configurations (10 procedural designs × 10 sizes). They have working gameplay effects. Hull visuals share a procedural family with different dimensions, paint, hauler layouts and salmon equipment; these are not 100 hand-authored ship models. The visible deck watch has three characters; larger crew complements increase the work rate.

Automatic pot setting needs its purchased skill and toggle, movement below 5 kn, bait, spare pots, and clear spacing. Rank I uses 160 m; rank V 120 m. Auto haul needs the corresponding skill/toggle, a buoy in the working-side 80 m range, a minimum soak of 2 h at rank I (1.2 h at rank V), available hold space and speed below 5 kn. Both respect equipment failures. Port/starboard/both/stern working areas depend on the hull. Auto haul does not steer the vessel; use the chart or manual helm.

Select Salmon Nets on a capable hull. Space sets a net, then retrieves it within 120 m after soaking, below 5 kn. One net per vessel; catch improves over the first hours and degrades after prolonged soaking. Crab and salmon share the hold and unload together at baseline $6.50/$4.20 per kg (65/42 kr in Swedish), modified by training/refrigeration.

All incidents are occasional gameplay approximations, not real maritime emergency guidance. Fifty named incidents span ten systems. The initial timer is 8 h at sea; later intervals are randomized 6–14 h, adjusted by safety upgrades and severe weather. Crew repair automatically. Some failures stop propulsion, deck work, nets or steering; others lose fuel/catch or damage the hull. Repairs use parts and may create a negative balance. Finance remains available at sea. Loans have a fixed 10% fee, no daily compound interest; 15% of player/fleet landing receipts repays debt. The fee counts toward the credit ceiling.

When commissioning a new vessel, recover gear and unload first. Trade in the old hull for 65% of hull + installed equipment value, or pay 25,000 kr to hire its captain. Skills are company-wide; installed parts and legacy engine/hold/gear upgrades stay aboard. The new hull arrives fueled with its rated pot capacity. Up to 100 hired vessels may be operated. Each captain asks permission for the next trip's fuel, repairs and bait. Decline holds the vessel; later approval restarts it. Crew receive 30% of operating profit after trip expenses, reduced by Fleet Management. Colored chart arrows and dots show each fleet vessel and its pots. Captains use simplified offshore routes and fishing cycles, not collision-aware autonomous ship AI.


## Language, currency and mooring (0.11)

Choose English · USD or Svenska · SEK on the welcome screen, in the footer, or in the shop. The choice persists in the browser and is included in the saved season. English is the default for new players. The fixed game exchange rate is 10 SEK = 1 USD; changing language only changes presentation and loan input units, never prices, debt or purchasing power. Older seasons retain their full value. Catalogs, training descriptions, incident names, radio/status messages, menus, accessibility labels and canvas overlays are localized.

Docking shows its current maneuver and remaining time. If aligned with the berth, the pilot backs directly in without first moving offshore. Other approaches retain pier clearance. After unloading, position and heading remain secured at the berth, including across save/reload. Request nonzero target speed (W/S or the slider), or engage autopilot, to cast off. Merely steering does not turn the moored vessel. Wave heave/roll is still rendered while the mooring holds horizontal position.


## Geographic world (0.12)

The archive includes locally bundled geographic data, so it is larger than earlier prototypes. Keep every .mjs file, including *-data.mjs. No map API key or live tile server is needed. The chart has Harbor / Islands / Bering Sea presets, scroll zoom and panning. Coordinates now show real latitude/longitude. Geographic sources, licensing, world bounds, save migration and accuracy limits are documented in the included GEOGRAPHY.md. Regional coastlines are generalized; depth, elevations and the working service berth remain approximations.

## Ko-fi support
The bottom-center support button uses the owner-provided Ko-fi floating-chat widget for nezzox, with the toolbar background (#0d1b22). A ResizeObserver keeps it above the responsive toolbar. This is the one intentional external CDN request; the game and map remain self-contained. The stream-alert overlay was replaced by the donation widget because its default background obscured gameplay. Blocking Ko-fi does not affect the simulation.

## GitHub Pages
Settings → Pages uses GitHub Actions. The pages.yml workflow runs the Node test suite, packages the static game and deploys only the resulting archive contents. Pushes to main update the site after successful checks. Reverting the relevant main commit restores a prior release through the same workflow. The site URL is https://nezzox.github.io/dangerouswaters/. Browser saves are tied to the origin: export the local season under Finance & Saves and import it on Pages to continue.

## Harbor and audio (0.13)
Sound remains opt-in via SOUND ON. The new local Web Audio soundscape increases diesel and weather levels, adds layered sea/rain, and fades industrial hum with distance from harbor. Sparse synthesized gull-like calls, hull creaks and distant horns use real audio time rather than the simulation time multiplier. All sound passes through a shared mute bus and compressor; pausing or disabling sound fades the whole bus. The sounds are synthesized approximations, not field recordings.

## Voyage balance (0.14.1)
Player and captain fuel consumption, including idle use, is now 1/50 of the previous rate. Distance-based captain fuel reserves use the same factor. Passive sea wear is also 1/50; collision impacts and incident damage retain their severity. Incident initial timers and repair-to-next-incident intervals are 50 times longer. Existing saves migrate their pending schedule once, postponing imminent events without changing money, inventory or current repairs. An obsolete x=-220 western damage barrier has been removed; geographic collision remains active.

## Route planner and helm (0.15)
EXPAND on the chart opens a larger native dialog and pauses the simulation until it closes, preserving the prior pause state. The same chart canvas, pan/zoom/follow controls and coordinate mapping are reused at its actual displayed resolution. Right-click replaces the autopilot route. Shift+right-click appends a water-routed leg from the previous destination; Shift+Enter does the same from the keyboard. The chart draws the actual planned sea path and numbered user waypoints. Manual helm input cancels the route.

A/D taps change the rudder by two degrees; holding a key continues adjusting at 12 degrees per real second. Release retains the selected angle, bounded to ±35 degrees. Use X or CENTER to zero it, or use the rudder slider for precise settings. The indicator also displays autopilot rudder commands. Weather selection has been removed from the player interface; new and imported seasons use dynamic weather. Developer-only visual fixtures can still force weather to reproduce rendering issues.

0.15.1: Auto set uses the displayed 80 m interaction ring. Auto haul searches all soaked pots on the working side instead of being blocked by a nearer fresh pot. Both retain the below-5-knot, equipment, crew and cargo checks.

0.15.2: Routine player and hired-captain fuel consumption doubled from 1/50 to 1/25 of the original rate. Hull wear and incident frequency are unchanged.

0.15.3: Random incident intervals reduced from 50 to 25 times the original intervals. Version-2 incident timers are halved once when loading a save.

0.15.4: Routine diesel consumption is 1/10 of the original rate (2.5x the previous rate). Passive sea hull wear is 1/40 of original (25% more than before). Incident frequency unchanged.

0.15.5: Undock in harbor services moves a stationary vessel offshore and points it away from the quay. Giving speed or engaging autopilot while moored also invokes this assist. Clearance scales with hull size; this is a positional gameplay assist, not a thruster physics simulation. Fuel use increased 10%; incident frequency unchanged.

0.16.0: 25 fictional collector catch variants (15 crab, 10 salmon), each with a 1/10,000–1/100,000 chance per positive-yield retrieval of the appropriate gear. One categorical roll per retrieval means at most one specimen; probabilities are per variant, not the combined chance. Each gear caches its result, including no find; saved in-progress jobs retain it. Bonuses of $25,000/$60,000/$150,000/$400,000/$1,000,000 are fixed game values, paid on landing with normal loan repayment (and fleet crew shares). Special specimens are separate from kg capacity. The collection persists after sale; ships cannot be exchanged with unsold specials.
Fishing grounds expanded from 4 to 16; water-clipped shading and slow water-only migration retained. Crab grounds knowledge and Salmon reading unlock species-specific potential estimates on the chart, improving from broad to narrow ranges over ranks I–V. These fictional seasonal productivity values affect actual yield; forecasts are deliberately uncertain. Training does not improve rare-drop odds.

Bottom sounder equipment now enables a live sonar panel to the left of the minimap. Grades I–V scan ±60/100/160/240/360 m across the beam, with 12/20/28/36/48 bottom samples, ±30/23/16/10/5 signal percentage-point uncertainty and 2/1.6/1.2/0.8/0.5 simulation-second updates. Signals read the same crab/salmon habitat as the catch model. This is interpreted game information, not physical detection/identification of individual crabs. On narrow screens the panel joins the scrollable right sidebar.

0.16.1: Added a prominent Undock button directly above Harbor Services, retaining the in-dialog button and existing eligibility checks. Under Target Speed, fuel economy shows estimated liters per nautical mile at steady target speed; the colored bar indicates burn rate from low to high. Both use the same shared fuel-rate function as the simulation, with weather, upgrades and equipment limits. No fuel balancing change.

0.16.2: Undock moved into the lower-left control strip with shortcut U. Pilot-assisted departure now releases lines for two simulation seconds, eases sideways offshore without turning, then turns in clear water. Crew move to line-handling stations. Manual target speed and queued autopilot resume after departure. Pause and mid-maneuver save/restore preserve progress; all 100 hulls checked for clearance. This remains a scripted harbor assist rather than a physical thruster simulation.

0.17.0 — Live model weather
The player vessel's fictional geographic coordinates query Open-Meteo hourly forecast and marine endpoints. No GPS/location permission or API key is requested. Weather follows real UTC and the vessel location, independent of game hours and ×1/×5/×15. Requests refresh every ten real minutes or after eight km travel, never more often than once per real minute, with one in-flight pair and a 12-second timeout. Browser cache can retain data for up to two hours within 15 km; old/missing weather falls back to the game's dynamic model. Missing marine data is explicitly labeled estimated, with wind-derived wave height. Wind is requested in knots; wave height in meters, period in seconds, directions meteorological FROM bearings. Models are not individual local observations; harbour wave shelter and physical navigation accuracy are not modeled.
CPU buoyancy, WebGL ocean and geometric foam use identical rotated spectra: short waves follow wind, long swell follows marine direction and period. Visual transitions are smoothed; spray and rain follow wind. Snow comes from forecast snowfall rather than a game-clock trigger. Day and night always follow the game clock and simulation multiplier; real UTC controls weather only. The weather strip uses the next six real forecast hours when connected.
Sources: https://open-meteo.com/en/docs and https://open-meteo.com/en/docs/marine-weather-api (CC BY 4.0; attribution in the weather panel). Free service terms currently permit noncommercial tip-jar donations: https://open-meteo.com/en/terms . A future paid game, advertising or currency sales requires reviewing commercial API access; no paid service or secret key is configured here. Service limits and coverage can change. Source forecasts never enter exported season saves; only bounded separate weather cache is retained.

0.17.1: Weather panel now offers Dynamic / Real Weather. Mode persists with the season, defaulting to Real Weather for existing saves. Dynamic mode uses the original game-time weather model and makes no weather API requests. In-flight responses cannot switch a dynamic game back to live conditions. Returning to live mode reuses fresh cached forecasts. Day/night stays on the game clock in both modes.

0.17.2: Crab pots now accumulate catch at 100% of normal rate for 0–6 game hours, 75% for 6–24 h, 50% for 24–36 h, then stop filling permanently without decay. Normal rate is calibrated to the former six-hour catch. Positive production is integrated using fixed hourly habitat samples, so migration cannot subtract already accumulated crab. Player and hired-captain pots share the same calculation. Existing gear retains its set time; four-day and older pots retain their 36-hour catch. Salmon net balance is unchanged. Buoy labels show the current filling stage.

0.17.3: Renderer label in the bottom-right toolbar opens a code prompt. The user-requested developer phrase credits 50,000 USD (500,000 saved SEK units), repeatedly usable for testing. This is a local development aid; it is not a secure authorization mechanism.

0.17.4: Crab pots hold at most 90 kg, including catch bonuses. Rich habitat fills at 3.6 kg per effective soak hour; habitat abundance is squared so poor areas fill far more slowly. The 6/24/36-hour stages and permanent retained catch remain. Operation tests use explicit rich-habitat fixtures rather than relying on baseline catch outside grounds.

0.17.5: Fleet & Finance displays a high-contrast envelope badge for unread captain radio messages or pending approvals. Viewing Fleet clears unread messages; pending requests remain marked until answered. Unread flags persist with vessel saves.

0.17.6: The supplied DangerousWaters.mp4 is bundled as intro.mp4 (40 seconds, H.264/AAC, 720p, fast-start). It loads only after starting a new season, including Start over; continuing a saved season bypasses it. Skip, Escape, natural completion or a media error enter the game without running the simulation behind the film. Native video controls support pause, volume and playback retry.

0.17.7: The new/continue screen recommends a dedicated GPU. Purchased company skills and the active vessel’s installed equipment/ranks are listed below the weather panel, including legacy upgrades. Radio messages appear on a transparent feed beside the helm, newest first; they fade over the last six seconds of a 30-second real-time lifetime, independent of simulation speed.

0.17.8: Download Save and Upload Save shortcuts sit immediately before Language in the footer. Downloads use the existing JSON export. Upload validates size, JSON and season compatibility before offering explicit replacement; invalid files never replace state. Loaded games remain paused.

0.17.9: Weather transitions now retain local ocean phase while swell direction/period change, avoiding animation-time-dependent jumps in water and reflections. Wind, precipitation, fog and front intensity ease over real time; missing snow/directional values ease to defaults instead of disappearing abruptly. CPU/GPU share the phase offsets.

0.17.10: Auto Set supports Tight (80 m), Standard (160 m), and Wide (220 m). The selected clearance is checked against every deployed player pot before starting the deployment animation; manual handling and the 80 m hauling radius are unchanged. Existing saves default to Tight, and the choice persists with the career.

0.17.11: Nearby hired vessels and their deployed pot buoys now render in the 3D scene, including shadows/reflections, vessel-specific hull dimensions and wave motion. Fleet buoy colors match the chart. Meshes are cached and culled beyond 900 m; nearby pots remain visible even when their owner is far away. The Canvas fallback also renders fleet markers.

0.17.12: Hired captains greet the player within 250 m, using 1,000 combinations of greetings, crew banter and farewells. Another greeting requires leaving beyond 450 m and at least 12 game hours. These messages use the existing radio feed and unread fleet badge. Pot ownership remains isolated in the player pot list and each hired vessel’s private pot list; regression tests cover identical pot IDs across owners.

0.17.13: Vessel incident/repair announcements and fleet radio messages display as centered, queued OK dialogs. Play pauses while a message is visible and resumes its prior pause state on acknowledgement. Messages wait behind existing dialogs and normal deck chatter stays in the transparent feed. Restored active incidents also receive an alert.

0.17.14: Cargo shows effective maximum hold capacity, including installed upgrades. The most recently sorted player pot/net catch appears as a smaller +kg value next to total cargo, using the actual weight accepted into the hold. It fades over the final eight seconds of a 45-second real-time lifetime and restarts on each haul; fleet landings do not affect it.
