#!/usr/bin/env python3
"""Extrae resultados de escaños del BOE de 2023, sin inferir grupos parlamentarios actuales."""
import argparse,json,pathlib,hashlib,datetime,re,unicodedata
from html.parser import HTMLParser
class Tables(HTMLParser):
 def __init__(self):super().__init__();self.tables=[];self.rows=[];self.row=[];self.cell='';self.inside=False;self.table=False
 def handle_starttag(self,t,a):
  if t=='table':self.rows=[];self.table=True
  if t=='tr':self.row=[]
  if t in ('td','th'):self.inside=True;self.cell=''
 def handle_data(self,d):
  if self.inside:self.cell+=d
 def handle_endtag(self,t):
  if t in ('td','th'):self.row.append(' '.join(self.cell.split()));self.inside=False
  if t=='tr' and self.table and self.row:self.rows.append(self.row)
  if t=='table':self.tables.append(self.rows);self.table=False
def norm(s):return ' '.join(sorted(re.sub('[^a-z0-9]+',' ',''.join(c for c in unicodedata.normalize('NFD',s.lower()) if not unicodedata.combining(c))).split()))
parser=argparse.ArgumentParser();parser.add_argument('--source',type=pathlib.Path,required=True);a=parser.parse_args();raw=a.source.read_bytes();p=Tables();p.feed(raw.decode());catalog=json.loads(pathlib.Path('data/territories/ine-2026.json').read_text());lookup={norm(v['name']):v['code'] for v in catalog['provinces']};parties=[];districts={}
# Solo las tres primeras tablas del Congreso contienen candidaturas con escaños.
for table in p.tables[:3]:
 if table[0][1]!='Total escaños' or table[-1][0]!='Total estatal.':raise ValueError('Estructura de resultados inesperada')
 names=table[0][2:];totals=table[-1]
 for i,name in enumerate(names):parties.append({'id':'result-2023-'+str(len(parties)+1),'name':name,'seats':int(totals[3+2*i])})
 start=len(parties)-len(names)
 for row in table[2:-1]:
  code=lookup.get(norm(row[0]))
  if not code:raise ValueError('Provincia no reconocida: '+row[0])
  d=districts.setdefault(code,{'provinceCode':code,'totalSeats':int(row[1]),'seats':{}})
  if d['totalSeats']!=int(row[1]):raise ValueError('Escaños provinciales incoherentes')
  for i,name in enumerate(names):d['seats'][parties[start+i]['id']]=int(row[3+2*i]) if row[3+2*i] else 0
if len(districts)!=52 or sum(p['seats'] for p in parties)!=350:raise ValueError('Cobertura nacional incorrecta')
for d in districts.values():
 if sum(d['seats'].values())!=d['totalSeats']:raise ValueError('Reparto provincial incompleto')
result={'electionDate':'2023-07-23','kind':'official_election_result','source':{'url':'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2023-18907','sha256':hashlib.sha256(raw).hexdigest(),'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()},'parties':parties,'constituencies':sorted(districts.values(),key=lambda x:x['provinceCode']),'notice':'Resultados electorales de 2023 por candidaturas. PSOE y PSC se conservan separados como en el BOE. No representa los grupos parlamentarios al final de la legislatura.'}
pathlib.Path('data/elections/congress-2023-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print('Resultados 2023: 52 circunscripciones, 350 escaños, 12 denominaciones con escaños (PSOE y PSC separados).')
