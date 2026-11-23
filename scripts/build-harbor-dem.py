#!/usr/bin/env python3
"""Resample a USGS 3DEP EPSG:4326 GeoTIFF for the static harbor renderer."""
import argparse
import base64
from pathlib import Path
import rasterio
from rasterio.enums import Resampling

parser = argparse.ArgumentParser()
parser.add_argument('geotiff')
args = parser.parse_args()
width, height = 240, 432
with rasterio.open(args.geotiff) as dem:
    if dem.crs.to_epsg() != 4326:
        raise ValueError('Expected a WGS84 export')
    west, south, east, north = dem.bounds
    heights = dem.read(1, out_shape=(height,width), resampling=Resampling.bilinear, masked=True)
    heights = (heights.filled(0).clip(0,1000)*4).round().astype('<u2')
encoded = base64.b64encode(heights.tobytes()).decode()
output = Path(__file__).resolve().parents[1] / 'harbor-dem-data.mjs'
output.write_text('// USGS 3DEP bare-earth elevations. See docs/geography.md.\n'
    f'export const DEM={{width:{width},height:{height},west:{west},south:{south},east:{east},north:{north},\n'
    f'data:"{encoded}"}};\n')
