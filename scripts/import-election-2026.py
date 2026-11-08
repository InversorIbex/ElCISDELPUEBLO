#!/usr/bin/env python3
"""Extrae el reparto de escaños del HTML oficial del RD 806/2026. No importa candidaturas."""
import argparse,datetime,hashlib,json,pathlib,re,unicodedata
from html.parser import HTMLParser
class Table(HTMLParser):
    def __init__(self):super().__init__();self.rows=[];self.row=[];self.cell='';self.inside=False
    def handle_starttag(self,t,a):
        if t=='tr':self.row=[]
        if t in ('td','th'):self.inside=True;self.cell=''
    def handle_data(self,d):
        if self.inside:self.cell+=d
    def handle_endtag(self,t):
        if t in ('td','th'):self.row.append(' '.join(self.cell.split()));self.inside=False
        if t=='tr' and self.row:self.rows.append(self.row)
def normalize(s):return ' '.join(sorted(re.sub(r'[^a-z0-9]+',' ',''.join(c for c in unicodedata.normalize('NFD',s.lower()) if not unicodedata.combining(c))).split()))
parser=argparse.ArgumentParser();parser.add_argument('--source',type=pathlib.Path,required=True);args=parser.parse_args()
raw=args.source.read_bytes();text=raw.decode('utf-8')
if 'Real Decreto 806/2026' not in text or not re.search(r'29\s+de\s+noviembre\s+de\s+2026',text.replace('\xa0',' ')):raise ValueError('Convocatoria inesperada')
table=Table();table.feed(text)
catalog=json.loads(pathlib.Path('data/territories/ine-2026.json').read_text())
provinces={normalize(p['name']):p for p in catalog['provinces']}
number={'uno':1,'dos':2,'tres':3,'cuatro':4,'cinco':5,'seis':6,'siete':7,'ocho':8,'diez':10,'once':11,'doce':12,'dieciseis':16,'dos treinta y':32,'ocho treinta y':38}
rows=[]
for row in table.rows:
    if len(row)!=2 or normalize(row[0]) not in provinces:continue
    p=provinces[normalize(row[0])];seats=number.get(normalize(row[1]))
    if seats is None:raise ValueError('Número de escaños no reconocido: '+row[1])
    rows.append({'provinceCode':p['code'],'name':p['name'],'seats':seats,'system':'plurality' if p['code'] in ('51','52') else 'dhondt'})
if len(rows)!=52 or len({r['provinceCode'] for r in rows})!=52 or sum(r['seats'] for r in rows)!=350:raise ValueError('Anexo incompleto o total distinto de 350')
result={'electionDate':'2026-11-29','title':'Elecciones al Congreso de los Diputados de 2026','source':{'url':'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-20742','sha256':hashlib.sha256(raw).hexdigest(),'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()},'legalRulesSource':'https://www.boe.es/buscar/act.php?id=BOE-A-1985-11672#acientosesentaytres','candidaciesVerified':False,'constituencies':sorted(rows,key=lambda x:x['provinceCode'])}
pathlib.Path('data/elections/congress-2026.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print('Convocatoria verificada: 52 circunscripciones, 350 diputados. Candidaturas pendientes.')
