#!/usr/bin/env python3
"""Importación trazable INE 2026. Requiere openpyxl (ver requirements-data.txt).
Lee archivos locales, valida todo antes de reemplazar el catálogo mediante os.replace.
Uso: python scripts/import-ine.py --source-dir /ruta/a/descargas
"""
import argparse, collections, datetime, hashlib, html.parser, json, os, pathlib, re, tempfile
import openpyxl
BASE = 'https://www.ine.es/daco/daco42/codmun/'
FILES = ['26codmun.xlsx', 'cod_ccaa_provincia.htm', 'cod_num_muni_provincia_ccaa.htm']
class Tables(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(); self.rows=[]; self.row=[]; self.cell=''; self.inside=False
    def handle_starttag(self, tag, attrs):
        if tag=='tr': self.row=[]
        if tag in ('td','th'): self.inside=True; self.cell=''
    def handle_data(self, data):
        if self.inside: self.cell+=data
    def handle_endtag(self, tag):
        if tag in ('td','th'): self.row.append(' '.join(self.cell.split())); self.inside=False
        if tag=='tr' and self.row: self.rows.append(self.row)
def table(path):
    p=Tables(); p.feed(path.read_text(encoding='iso-8859-15')); return p.rows
def import_catalog(source_dir, output):
    provinces=[]; communities={}
    for row in table(source_dir/'cod_ccaa_provincia.htm'):
        if len(row)==4 and re.fullmatch(r'\d{2}',row[0]) and re.fullmatch(r'\d{2}',row[2]):
            community, name, code, province=row
            communities[community]={'code':community,'name':name}
            provinces.append({'code':code,'name':province,'communityCode':community})
    if not (len(provinces) == 52 and len(communities) == 19): raise ValueError('Jerarquía incompleta')
    province_map={p['code']:p for p in provinces}
    wb=openpyxl.load_workbook(source_dir/'26codmun.xlsx',read_only=True,data_only=True)
    municipalities=[]
    for sheet in wb:
        if not re.fullmatch(r'\d{2}',sheet.title): continue
        rows=list(sheet.values)
        if not ('1 de enero de 2026' in rows[0][0]): raise ValueError('Versión inesperada')
        if not (rows[2][:4] == ('CPRO', 'CMUN', 'DC', 'NOMBRE')): raise ValueError('Cabecera inesperada')
        for p, m, dc, name, *_ in rows[3:]:
            if p is None: continue
            p=str(p).zfill(2); m=str(m).zfill(3)
            if not (p == sheet.title and p in province_map): raise ValueError('Validación territorial fallida')
            if not (re.fullmatch('\\d{3}', m) and re.fullmatch('\\d', str(dc)) and isinstance(name, str) and name.strip()): raise ValueError('Validación territorial fallida')
            municipalities.append({'code':p+m,'name':name.strip(),'provinceCode':p,'communityCode':province_map[p]['communityCode']})
    if not (len({m['code'] for m in municipalities}) == len(municipalities)): raise ValueError('Códigos duplicados')
    counts=collections.Counter(m['provinceCode'] for m in municipalities)
    count_rows=table(source_dir/'cod_num_muni_provincia_ccaa.htm')
    expected={}
    for row in count_rows:
        if row[0].startswith('Comunidades'): break
        if len(row)==2 and row[1].replace('.','').isdigit(): expected[row[0]]=int(row[1].replace('.',''))
    if not (len(municipalities) == expected['TOTAL'] == 8132): raise ValueError('Validación territorial fallida')
    for p in provinces:
        if not (counts[p['code']] == expected[p['name']]): raise ValueError(f"Recuento incorrecto {p['name']}")
    if not (next((m for m in municipalities if m['code'] == '51001'))['name'] == 'Ceuta'): raise ValueError('Validación territorial fallida')
    if not (next((m for m in municipalities if m['code'] == '52001'))['name'] == 'Melilla'): raise ValueError('Validación territorial fallida')
    sources=[{'url':BASE+f,'sha256':hashlib.sha256((source_dir/f).read_bytes()).hexdigest()} for f in FILES]
    result={'version':'2026-01-01','retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sources':sources,'attribution':'Fuente: Instituto Nacional de Estadística (INE). Elaboración del catálogo: El CIS del Pueblo.','communities':sorted(communities.values(),key=lambda x:x['code']),'provinces':sorted(provinces,key=lambda x:x['code']),'municipalities':sorted(municipalities,key=lambda x:x['code'])}
    output.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.NamedTemporaryFile('w',encoding='utf-8',dir=output.parent,delete=False) as f:
        json.dump(result,f,ensure_ascii=False,separators=(',',':'));f.write('\n');tmp=f.name
    os.replace(tmp,output)
    print(f"Validado: {len(municipalities)} municipios; {len(provinces)} provincias/códigos; {len(communities)} comunidades/ciudades.")
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--source-dir',type=pathlib.Path,required=True);parser.add_argument('--output',type=pathlib.Path,default=pathlib.Path('data/territories/ine-2026.json'));args=parser.parse_args();import_catalog(args.source_dir,args.output)
