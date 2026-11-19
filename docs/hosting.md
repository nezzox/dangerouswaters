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
