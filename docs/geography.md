# Geography, deck water and vessel previews — 0.12

Authorized scope: a playable geographically based Bering Sea with recognizable Dutch Harbor/Unalaska, believable heavy-sea interaction with the deck, and images of purchasable boats.

Keep the game static and dependency-free at runtime. Bundle public geographic vectors locally with source/license attribution, never Google imagery or live map tiles. Use geographic coordinates and a consistent projected world, real coastlines for chart/terrain/land collision, and marked playable boundaries. Dutch Harbor receives a detailed local coastline/port interpretation; regional data is generalized and depth/fish abundance remain game approximations, not navigation data. Preserve v1 money, gear, catches and fleet; add a geographic world marker and move invalid old positions/gear to nearby water explicitly rather than losing them.

Implementation order: hull/water exclusion and thin draining green water (unit + storm fixture); actual 3D ship previews rendered locally with shared geometry; locally bundled geographic coastlines and coordinate helpers; chart/terrain/land navigation integration and save migration; browser checks, documentation and web packaging.

Acceptance: ocean/foam cannot render through the vessel interior at any boat scale/pose. Genuine rail overtopping drives a bounded draining deck layer, no full wave plane on deck. Every shop hull has an actual-model image, including exchange details. Chart zoom covers Dutch Harbor through the whole Bering Sea; coastal land renders in 3D and cannot be sailed through. Geographic round trips/dateline, safe spawn/berth, autopilot land rejection and old-save inventory preservation are tested. Avoid claiming a surveyed port replica or hydrographic accuracy for generalized source data.


## Sources and licenses

Regional coast: [Natural Earth land, 1:10 million](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-land/), public domain. Build source: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_land.geojson . “10m” means map scale 1:10 million, not ten-meter accuracy. This is a generalized coastline.

Local Dutch Harbor/Unalaska coast, structure footprints, roads and piers: © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), [Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/). Source snapshot fetched 2026-11-18 from https://api.openstreetmap.org/api/0.6/map?bbox=-166.58,53.86,-166.48,53.97 . The distributed coast-data.mjs, port-data.mjs and terrain-data.mjs derived geographic database is available under ODbL 1.0; attribution also appears on the game chart. No Google map imagery or tiles are included.

Rebuild the derived data using `uv run --with shapely python scripts/build-geography.py /path/to/ne_10m_land.geojson /path/to/osm-map.xml`. Shapely is an offline build tool; the uploaded game has no package dependency or runtime map-service request. The generated JS files contain the usable derived coordinates/footprints. Normal web packaging includes these files and this source/license notice.

## Implemented world and limits

The playable geographic extent is 155°E–155°W across the dateline, 50°N–66°N. Coordinates use a local equirectangular projection centered at 53.9034°N, 166.524°W. World units represent meters near Dutch Harbor; this projection is not a surveyed navigation chart and distorts distances increasingly far north. Coastlines are shared by chart rendering, 3D terrain and collision; the OSM piers also obstruct navigation. Sea-route planning uses a bounded adaptive grid and preserves the harbor entrance. The local scenery contains 1,064 source building footprints, 381 road ways and 63 pier ways. Boat models/people/working cranes remain procedural.

The serviced berth and its four working piers are an interpreted gameplay facility near the real port, not an exact surveyed terminal reconstruction. Dutch Harbor and nearby Amaknak terrain sample USGS 3DEP bare-earth elevation data. Regional terrain elsewhere uses illustrative coastal relief. Depth and catch abundance remain simulation rules. Regional coast is generalized; local OpenStreetMap coast is more detailed. Weather is still global, not a regional weather model. These limitations are intentional and must remain visible in release descriptions when describing geographic accuracy.

Old v1 seasons receive worldVersion 2 on load. Balance, loans, installed equipment, cargo, pot/net IDs and soak times remain intact. Old pots/nets retain their previous ground yield for their first retrieval. Points that now lie on real land are moved to the nearest clear water; invalid docking approaches are canceled without unloading/payout. A migration message is shown when positions move. Fleet travel now follows navigable water and uses the near Unalaska shelf (long-range vessels can reach the Akutan slope); no offline income is added.

## Deck water and previews

Ocean and foam fragments are clipped against the inverse transform and curved footprint of the actual vessel, including size, heave, pitch and roll. This prevents the full ocean plane from appearing inside the hull. Rail overtopping alone fills a separate bounded 0–9 cm deck sheet, which drains after the crest passes. This is an approximate visual green-water system, not fluid dynamics or stability simulation. It preserves normal sea state/wave height rather than flattening the sea around the boat.

All 100 shop vessel configurations receive a locally rendered JPEG preview from the same buildVessel/createScene geometry used in play, including dimensions, color, pot stacks, salmon equipment and hauler layout. Images are queued and cached per vessel; no external art/image API is used. The exchange review shows the same image. Models remain ten procedural design families with ten size/equipment variations each.

Local port relief uses a low apron before the inland rise. Shore banks extend below the water and the dry terrain begins at an illustrative six meters above the mean sea plane, avoiding wave peaks cutting holes across the apron. The shoreline floor and the working aprons are gameplay approximations. Terrain uses matte earth shading; building and road materials remain separate.

## Industrial waterfront (0.13)
The waterfront interpretation follows the narrow Ballyhoo Road industrial strip visible in the user reference and a Google Maps satellite view of Port of Dutch Harbor (53.903426, -166.5287497), inspected on 2026-11-18. Asphalt aprons, quayside caps, bollards/fenders, warehouse sheds, storage tanks, container stacks, pallets, forklifts and road/light strips are built locally from primitives along the bundled coastline. Satellite imagery is only a visual reference, not included as a texture. This is an interpretation, not a building-by-building surveyed replica. Existing working piers, unloading animation, navigable collision and berth stay compatible with saved seasons.

## One quay and migrating crab habitat (0.14)
The obsolete four timber finger piers and their buildings, cranes and rectangular collision barriers have been removed. Rendering, service crew, unloading crane, pilot route and mooring share a shoreline frame near 53.904°N,166.523°W. Geographic land and mapped real piers remain collidable. Legacy moored saves move to the new berth without changing inventories; unfinished legacy landings re-plan before payout.

Crab grounds follow deterministic, water-tested migration tracks at up to 37.5 meters per game hour (up to 0.9 km/day). This is a game balance approximation, not a biological movement-rate claim. Tracks reverse through safe water instead of crossing islands. Habitat marks are clipped to water on the chart and fallback renderer; land has zero abundance and cannot yield a catch. Pot yields sample habitat across soak time. Legacy gear keeps its preserved abundance. Captains choose the current ground once per sortie, avoiding repeated route searches for every tiny movement.

The local elevation raster comes from the [USGS 3DEP ImageServer](https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer). Its WGS84 extent is encoded in `harbor-dem-data.mjs`. Use `uv run --with rasterio python scripts/build-harbor-dem.py input.tif` to rebuild the bundled raster from an EPSG:4326 float export. The bundled grid samples the source at roughly 27 × 30 m.
