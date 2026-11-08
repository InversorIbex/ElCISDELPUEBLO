#!/usr/bin/env python3
"""Genera geometrías SVG nacionales simplificadas desde IGN. No recoge resultados.
Se conserva licencia, huella del origen y transformaciones. Solo vista autonómica;
la estrategia PMTiles/MapLibre multinivel sigue pendiente.
"""
import argparse,datetime,hashlib,json,pathlib,urllib.parse
from shapely.geometry import shape
from shapely.validation import explain_validity
parser=argparse.ArgumentParser();parser.add_argument('--source-dir',type=pathlib.Path,required=True);args=parser.parse_args()
catalog=json.loads(pathlib.Path('data/territories/ine-2026.json').read_text());features=[];sources=[]
base='https://www.ign.es/wfs-inspire/unidades-administrativas'
def rings(geom):
    polys=list(geom.geoms) if geom.geom_type=='MultiPolygon' else [geom]
    for p in polys:
        yield list(p.exterior.coords)
        for interior in p.interiors:yield list(interior.coords)
def natural(name):
    pieces=name.split(', ');return pieces[1]+' '+pieces[0] if len(pieces)==2 else name
def slug(name):
    import unicodedata,re
    return re.sub('[^a-z0-9]+','-',''.join(c for c in unicodedata.normalize('NFD',natural(name).lower()) if not unicodedata.combining(c))).strip('-')
for c in catalog['communities']:
    national='34'+c['code']+'0000000';path=args.source_dir/(national+'.json');raw=path.read_bytes();data=json.loads(raw)
    if len(data['features'])!=1:raise ValueError('Número de geometrías inesperado')
    f=data['features'][0]
    if f['properties']['nationalCode']!=national or not f['properties']['nationalLevel']['href'].endswith('/2ndOrder'):raise ValueError('Nivel o identificador incorrecto')
    original=shape(f['geometry'])
    if not original.is_valid:raise ValueError(c['name']+': geometría inválida: '+explain_validity(original))
    # Grados en CRS:84: solo mapa nacional orientativo. No sirve para medición.
    tolerance=0.00005 if c['code'] in ('18','19') else 0.008
    simplified=original.simplify(tolerance,preserve_topology=True)
    if simplified.is_empty or not simplified.is_valid or simplified.geom_type not in ('MultiPolygon','Polygon'):raise ValueError('Simplificación inválida')
    inset={'05':(30,550,225,100),'18':(335,550,100,100),'19':(510,550,100,100)}.get(c['code'])
    if inset:
        x,y,w,h=inset;minx,miny,maxx,maxy=simplified.bounds;s=min(w/(maxx-minx),h/(maxy-miny));cx=(minx+maxx)/2;cy=(miny+maxy)/2
        def project(lon,lat):return x+w/2+(lon-cx)*s,y+h/2-(lat-cy)*s
    else:
        def project(lon,lat):return (lon+9.7)*48+20,(44.1-lat)*61+20
    parts=[];bounds=[]
    for ring in rings(simplified):
        coords=[project(lon,lat) for lon,lat,*_ in ring];bounds.extend(coords)
        parts.append('M'+'L'.join(f'{x:.2f},{y:.2f}' for x,y in coords)+'Z')
    d=''.join(parts)
    if not all(0<=x<=760 and 0<=y<=680 for x,y in bounds):raise ValueError('Geometría fuera del marco: '+c['name'])
    features.append({'code':c['code'],'name':natural(c['name']),'href':'/comunidad/'+slug(c['name']),'path':d,'nationalCode':national,'inset':bool(inset),'valid':True,'toleranceDegrees':tolerance})
    params={'service':'WFS','version':'2.0.0','request':'GetFeature','typeNames':'au:AdministrativeUnit','resourceID':'AU_ADMINISTRATIVEUNIT_'+national,'outputFormat':'application/geo+json','srsName':'CRS:84'}
    sources.append({'code':c['code'],'url':base+'?'+urllib.parse.urlencode(params),'sha256':hashlib.sha256(raw).hexdigest(),'originalPoints':sum(len(r) for r in rings(original)),'simplifiedPoints':sum(len(r) for r in rings(simplified))})
if len(features)!=19:raise ValueError('Mapa incompleto')
result={'source':'IGN · Base de Datos de Divisiones Administrativas · WFS INSPIRE','license':'CC BY 4.0 ign.es','licenseUrl':'https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf','derivedWork':'Obra derivada: simplificación y composición SVG por El CIS del Pueblo. Recuadros con escala propia.','retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'toleranceDegrees':0.008,'cityInsetToleranceDegrees':0.00005,'viewBox':'0 0 760 680','features':features,'sources':sources}
encoded=json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n'
if len(encoded.encode())>400000:raise ValueError('Presupuesto de mapa nacional excedido')
output=pathlib.Path('data/cartography/communities-svg.json');output.parent.mkdir(exist_ok=True,parents=True);output.write_text(encoded);print('Mapa generado: 19 territorios;',len(encoded.encode()),'bytes')
