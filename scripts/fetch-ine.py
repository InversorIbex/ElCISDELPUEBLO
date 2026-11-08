#!/usr/bin/env python3
"""Descarga fuentes oficiales y verifica SHA-256 contra la versión del catálogo."""
import argparse, hashlib, json, pathlib, urllib.request
parser=argparse.ArgumentParser();parser.add_argument('--destination',type=pathlib.Path,required=True);args=parser.parse_args()
manifest=json.loads((pathlib.Path(__file__).resolve().parent.parent/'data/territories/ine-2026.json').read_text())
args.destination.mkdir(parents=True,exist_ok=True)
for source in manifest['sources']:
    url=source['url']
    if not url.startswith('https://www.ine.es/daco/daco42/codmun/'):raise ValueError('Origen no permitido')
    with urllib.request.urlopen(url,timeout=30) as response:data=response.read(10_000_001)
    if len(data)>10_000_000:raise ValueError('Fuente excesivamente grande')
    if hashlib.sha256(data).hexdigest()!=source['sha256']:raise ValueError(f'La fuente ha cambiado: {url}. Revisar antes de actualizar el catálogo.')
    path=args.destination/url.rsplit('/',1)[-1];path.write_bytes(data);print(f'Verificada: {path.name}')
