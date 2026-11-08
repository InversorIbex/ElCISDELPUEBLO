import { communities, provinces, municipalities, searchMunicipalities, catalogInfo } from '../../../lib/territories.ts';
export function GET(request:Request){
 const params=new URL(request.url).searchParams;
 const q=params.get('q')?.trim()??'';const province=params.get('province')??'';const community=params.get('community')??'';
 if(q.length>100 || (province&&!provinces.some(p=>p.code===province)) || (community&&!communities.some(c=>c.code===community)) || (province&&community&&!provinces.some(p=>p.code===province&&p.communityCode===community))){return Response.json({error:'Filtros territoriales no válidos.'},{status:400})}
 const common={headers:{'Cache-Control':'public, max-age=3600'}};
 if(q)return Response.json({municipalities:searchMunicipalities(q,{province,community}),version:catalogInfo.version},common);
 if(province)return Response.json({municipalities:municipalities.filter(m=>m.provinceCode===province),version:catalogInfo.version},common);
 return Response.json({communities,provinces:community?provinces.filter(p=>p.communityCode===community):provinces,version:catalogInfo.version},common);
}
