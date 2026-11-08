import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
const html=await readFile('.next/server/app/mapa.html','utf8');
for(const expected of ['role="combobox"','Comunidad o ciudad autónoma','Provincia / ciudad autónoma','Municipio','8.132','/comunidad/galicia','/comunidad/ceuta','/comunidad/melilla'])assert.ok(html.includes(expected),expected);
const home=await readFile('.next/server/app/index.html','utf8');
assert.ok(home.includes('SONDEO ABIERTO DE INTERNAUTAS'));
async function scan(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name);if(entry.isDirectory())await scan(path);else if(entry.name.endsWith('.js')){const content=await readFile(path,'utf8');assert.ok(!content.includes('Agurain/Salvatierra'),'El catálogo municipal completo no debe estar en el JS cliente')}}}
await scan('.next/static/chunks');
console.log('HTML prerenderizado y separación del catálogo del JavaScript cliente: correctos. No sustituye pruebas en navegador.');
