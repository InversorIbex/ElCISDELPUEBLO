#!/usr/bin/env python3
"""Importa SOLO candidaturas del Congreso proclamadas en BOE 23103 + corrección 23383.
No importa nombres personales ni convierte el Senado en opciones del Congreso.
"""
import argparse,collections,datetime,hashlib,json,pathlib,re,unicodedata,uuid,os,tempfile
from html.parser import HTMLParser
class Paragraphs(HTMLParser):
    def __init__(self):super().__init__();self.active=False;self.depth=0;self.inside=False;self.text='';self.cls='';self.rows=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='div' and a.get('id')=='textoxslt':self.active=True;self.depth=1;return
        if self.active and tag=='div':self.depth+=1
        if self.active and tag=='p':self.inside=True;self.text='';self.cls=a.get('class','')
    def handle_data(self,text):
        if self.inside:self.text+=text
    def handle_endtag(self,tag):
        if tag=='p' and self.inside:self.rows.append((self.cls,' '.join(self.text.split())));self.inside=False
        if tag=='div' and self.active:
            self.depth-=1
            if self.depth==0:self.active=False
def normalize(s):return re.sub(r'[^a-z0-9]+',' ',''.join(c for c in unicodedata.normalize('NFD',s.lower()) if not unicodedata.combining(c))).strip()
def paragraphs(path):p=Paragraphs();p.feed(path.read_text());return p.rows
NAMESPACE=uuid.uuid5(uuid.NAMESPACE_URL,'https://github.com/InversorIbex/ElCISDELPUEBLO/congress-2026')
SOURCE='https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-23103'
CORRECTION='https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-23383'
# Solo estas dos correcciones afectan a la denominación de las opciones del Congreso.
RENAMES=[('31',1,'EUSKAL HERRIA BILDU-ESQUERRA REPUBLICANA DE CATALUNYA (EH BILDU-ERC)','EUSKAL HERRIA BILDU (EH BILDU)'),('31',11,'Frente Amplio-Fronte Zabala (FRENTE AMPLIO-FRONTE ZABALA)','FRENTE AMPLIO-FRONTE ZABALA (FRENTE AMPLIO-FRONTE ZABALA)')]
def import_registry(source_dir,output):
    catalog=json.loads(pathlib.Path('data/territories/ine-2026.json').read_text())
    province_by_name={}
    for p in catalog['provinces']:
        names=[p['name'],*p['name'].split('/')]
        if ', ' in p['name']:a,b=p['name'].split(', ');names.append(b+' '+a)
        for name in names:province_by_name[normalize(name)]=p['code']
    province_by_name.update({normalize('Álava'):'01',normalize('Alicante'):'03',normalize('Castellón'):'12',normalize('Illes Balears'):'07',normalize('La Rioja'):'26'})
    raw=(source_dir/'proclaimed.html').read_text()
    if 'BOE-A-2026-23103' not in raw or 'Real Decreto 806/2026' not in raw:raise ValueError('Publicación incorrecta')
    entries=[];province=None;house=None;current=None
    for index,(cls,text) in enumerate(paragraphs(source_dir/'proclaimed.html')):
        if text.startswith('JUNTA ELECTORAL'):
            board=re.sub(r'^JUNTA ELECTORAL(?: PROVINCIAL)? DE ','',text);province=province_by_name.get(normalize(board))
            if not province:raise ValueError('Junta provincial desconocida: '+text)
            house=None;current=None
        elif cls=='centro_cursiva' and ('CONGRESO' in text or 'SENADO' in text):house='congress' if 'CONGRESO' in text else 'senate';current=None
        elif house=='congress' and cls=='centro_redonda':
            m=re.fullmatch(r'(\d+)\.\s*(.+)',text)
            if not province or not m:raise ValueError('Cabecera de candidatura no reconocida: '+text)
            current={'id':str(uuid.uuid5(NAMESPACE,f'{province}/{m[1]}')),'provinceCode':province,'order':int(m[1]),'officialName':m[2],'status':'proclaimed','sourceParagraphIndex':index,'sourceUrl':SOURCE,'correctionApplied':False};entries.append(current)
        elif house=='congress' and current and any(word in text.lower() for word in ['no proclamad','inadmitida','retirada']):current['status']='not_proclaimed'
    corrections=' '.join(text for cls,text in paragraphs(source_dir/'corrections.html'))
    if 'Real Decreto 806/2026' not in corrections:raise ValueError('Corrección incorrecta')
    for code,order,old,new in RENAMES:
        if old not in corrections or new not in corrections:raise ValueError('Falta corrección esperada')
        found=[e for e in entries if e['provinceCode']==code and e['order']==order]
        if len(found)!=1 or found[0]['officialName']!=old:raise ValueError('Corrección no coincide con la proclamación')
        found[0].update(officialName=new,correctionApplied=True,sourceUrl=CORRECTION)
    valid=[e for e in entries if e['status']=='proclaimed'];excluded=[e for e in entries if e['status']=='not_proclaimed']
    if len(entries)!=555 or len(valid)!=534 or len(excluded)!=21:raise ValueError('Recuentos distintos a la publicación revisada; revisar antes de importar')
    if len({(e['provinceCode'],e['order']) for e in entries})!=len(entries):raise ValueError('Número repetido en una circunscripción')
    counts=collections.Counter(e['provinceCode'] for e in valid)
    if set(counts)!={p['code'] for p in catalog['provinces']}:raise ValueError('Cobertura incompleta de las 52 circunscripciones')
    sources=[{'url':url,'sha256':hashlib.sha256((source_dir/file).read_bytes()).hexdigest()} for url,file in [(SOURCE,'proclaimed.html'),(CORRECTION,'corrections.html')]]
    result={'electionId':'congress-2026','electionDate':'2026-11-29','asOf':'2026-11-08','retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sources':sources,'totalProclaimed':len(valid),'totalNotProclaimed':len(excluded),'candidacies':sorted(valid,key=lambda e:(e['provinceCode'],e['order'])),'excluded':excluded,'provinceCounts':dict(sorted(counts.items())),'notice':'Instantánea de proclamación y correcciones revisadas a 8/11/2026; revisar resoluciones posteriores antes de abrir una campaña.'}
    output.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.NamedTemporaryFile('w',encoding='utf-8',dir=output.parent,delete=False) as f:json.dump(result,f,ensure_ascii=False,indent=2);f.write('\n');temporary=f.name
    os.replace(temporary,output);print(f'Validado: {len(valid)} candidaturas del Congreso, 52 circunscripciones; {len(excluded)} no proclamadas excluidas. Dos denominaciones corregidas.')
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--source-dir',type=pathlib.Path,required=True);parser.add_argument('--output',type=pathlib.Path,default=pathlib.Path('data/candidacies/congress-2026.json'));a=parser.parse_args();import_registry(a.source_dir,a.output)
