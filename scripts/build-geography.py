"""Build local vector geography; requires shapely only for this offline build.
Inputs: Natural Earth ne_10m_land.geojson and OSM API map XML, fetched separately.
Natural Earth public domain; local OpenStreetMap coast © contributors, ODbL.
"""
import json,sys,xml.etree.ElementTree as ET
from pathlib import Path
from shapely.geometry import shape,box,LineString,Polygon
from shapely.ops import unary_union,polygonize,transform,triangulate
ne=json.load(open(sys.argv[1]));parts=[]
for f in ne['features']:
    geom=shape(f['geometry'])
    for bounds,shift in [((155,50,180,66),0),((-180,50,-155,66),360)]:
        p=geom.intersection(box(*bounds))
        if not p.is_empty:parts.append(transform(lambda x,y,z=None:(x+shift,y),p))
regional=unary_union(parts)
r=ET.parse(sys.argv[2]).getroot();nodes={n.attrib['id']:(float(n.attrib['lon'])+360,float(n.attrib['lat'])) for n in r.findall('node')}
lines=[];segments=[]
for w in r.findall('way'):
    if not any(t.attrib=={'k':'natural','v':'coastline'} for t in w.findall('tag')):continue
    pts=[nodes[n.attrib['ref']] for n in w.findall('nd')];lines.append(LineString(pts));segments.extend(zip(pts,pts[1:]))
localbox=box(193.42,53.86,193.52,53.97)
def left_of_coast(p):
    x,y=p.x,p.y;best=(1e9,False)
    for (a,b),(c,d) in segments:
        dx,dy=(c-a)*.59,d-b;px,py=(x-a)*.59,y-b;t=max(0,min(1,(px*dx+py*dy)/(dx*dx+dy*dy or 1)))
        dist=(px-dx*t)**2+(py-dy*t)**2
        if dist<best[0]:best=(dist,dx*py-dy*px>0)
    return best[1]
local=unary_union([p for p in polygonize(unary_union([*[l.intersection(localbox) for l in lines],localbox.boundary])) if left_of_coast(p.representative_point())])
land=unary_union([regional.difference(localbox),local]).buffer(0)
# Retain local detail; simplify regional coast to ~100 m.
regional=regional.difference(localbox).simplify(.001,preserve_topology=True)
land=unary_union([regional,local.simplify(.00003,preserve_topology=True)]).buffer(0)
polys=list(land.geoms) if land.geom_type=='MultiPolygon' else [land]
# Store rings including holes. Coast/terrain/collision consume the same geometry.
def ring(r):return [[round(x-360 if x>180 else x,6),round(y,6)] for x,y in r.coords]
data=[{'outer':ring(p.exterior),'holes':[ring(r) for r in p.interiors]} for p in polys if p.area>.00000003]
root=Path(__file__).resolve().parents[1]
(root/'coast-data.mjs').write_text('// Natural Earth (public domain) + local OSM coastline (ODbL), see docs/geography.md.\nexport const COAST_DATA='+json.dumps(data,separators=(',',':'))+';\n')
print('polygons',len(data),'vertices',sum(len(p['outer'])+sum(map(len,p['holes'])) for p in data))
for lon,lat in [(-166.5265,53.9034),(-166.524,53.9034),(-166.523,53.905),(-166.52,53.91)]:print(lon,lat,'land',land.contains(__import__('shapely').geometry.Point(lon+360,lat)))
from shapely import constrained_delaunay_triangles
from shapely.geometry import Point
# A regular coastal grid prevents long coastline triangles from forming spikes.
# Heights are smooth illustrative relief, not survey data.
import math
terrain=[]
focus=box(193.30,53.80,193.66,54.05)
cache={}
def vertex(q):
    key=(round(q[0],9),round(q[1],9))
    if key not in cache:
        distance=land.boundary.distance(Point(q))*85000
        relief=.7+.15*math.sin((q[0]-193.4)*90)+.15*math.cos((q[1]-53.9)*110)
        h=6+min(4,distance*.008)+min(750,max(0,distance-250)*.18)*relief
        cache[key]=[round(q[0]-360 if q[0]>180 else q[0],6),round(q[1],6),round(h,2)]
    return cache[key]
# Distant terrain retains the coastline, with low relief to avoid giant fans.
for p in polys:
    remainder=p.difference(focus)
    pieces=list(remainder.geoms) if hasattr(remainder,'geoms') else [remainder]
    for piece in pieces:
        if piece.is_empty or piece.geom_type!='Polygon':continue
        for tri in constrained_delaunay_triangles(piece).geoms:
            terrain.append([[round(x-360 if x>180 else x,6),round(y,6),6] for x,y in list(tri.exterior.coords)[:3]])
# ~110 m cells near Dutch Harbor; all shared vertices use the same height.
for ix in range(240):
    x=193.30+ix*.0015
    for iy in range(250):
        y=53.80+iy*.001
        cell=land.intersection(box(x,y,x+.0015,y+.001))
        if cell.is_empty:continue
        pieces=list(cell.geoms) if hasattr(cell,'geoms') else [cell]
        for piece in pieces:
            if piece.geom_type!='Polygon':continue
            for tri in constrained_delaunay_triangles(piece).geoms:
                terrain.append([vertex(q) for q in list(tri.exterior.coords)[:3]])
import math
flat=[]
for tri in terrain:
    for lon,lat,h in tri:
        delta=((lon+166.524+540)%360)-180
        flat.extend([round(delta*111319.490793*math.cos(math.radians(53.9034)),2),round((53.9034-lat)*111319.490793,2),h])
(root/'terrain-data.mjs').write_text('// Derived terrain heights are illustrative, not surveyed elevation. See docs/geography.md.\nexport const TERRAIN_DATA=new Float32Array('+json.dumps(flat,separators=(',',':'))+');\n')
city=[];roads=[];piers=[]
for w in r.findall('way'):
    tags={t.attrib['k']:t.attrib['v'] for t in w.findall('tag')};pts=[nodes[n.attrib['ref']] for n in w.findall('nd') if n.attrib['ref'] in nodes]
    if len(pts)<2:continue
    coords=[[round(x-360,7),round(y,7)] for x,y in pts]
    if tags.get('building') and len(pts)>3 and pts[0]==pts[-1]:
        try:h=min(45,max(3,float(tags.get('height',float(tags.get('building:levels',2))*3))))
        except ValueError:h=6
        city.append({'ring':coords,'height':h})
    if tags.get('highway') in ['primary','secondary','tertiary','residential','service','unclassified']:roads.append(coords)
    if tags.get('man_made')=='pier':piers.append(coords)
(root/'port-data.mjs').write_text('// © OpenStreetMap contributors, ODbL. Local port structure footprints, see docs/geography.md.\nexport const PORT_BUILDINGS='+json.dumps(city,separators=(',',':'))+';\nexport const PORT_ROADS='+json.dumps(roads,separators=(',',':'))+';\nexport const PORT_PIERS='+json.dumps(piers,separators=(',',':'))+';\n')
print('terrain triangles',len(terrain),'buildings',len(city),'roads',len(roads),'piers',len(piers))
