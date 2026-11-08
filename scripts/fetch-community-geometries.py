#!/usr/bin/env python3
"""Descarga offline por comunidad. Nunca lo ejecuta el navegador de un visitante."""
import argparse,concurrent.futures,json,pathlib,urllib.request,urllib.parse
parser=argparse.ArgumentParser();parser.add_argument('--destination',type=pathlib.Path,required=True);args=parser.parse_args();args.destination.mkdir(parents=True,exist_ok=True)
catalog=json.loads(pathlib.Path('data/territories/ine-2026.json').read_text())
base='https://www.ign.es/wfs-inspire/unidades-administrativas'
def fetch(c):
    code='34'+c['code']+'0000000';path=args.destination/(code+'.json')
    params={'service':'WFS','version':'2.0.0','request':'GetFeature','typeNames':'au:AdministrativeUnit','resourceID':'AU_ADMINISTRATIVEUNIT_'+code,'outputFormat':'application/geo+json','srsName':'CRS:84'}
    if path.exists():raw=path.read_bytes()
    else:
        with urllib.request.urlopen(base+'?'+urllib.parse.urlencode(params),timeout=60) as response:raw=response.read(60_000_001)
        if len(raw)>60_000_000:raise ValueError('Geometría excede presupuesto offline')
    d=json.loads(raw)
    if len(d.get('features',[]))!=1 or d['features'][0]['properties']['nationalCode']!=code:raise ValueError('Geometría no corresponde a código '+code)
    path.write_bytes(raw);print(c['code'],c['name'],len(raw),'bytes',flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:list(executor.map(fetch,catalog['communities']))
