import Link from 'next/link';
import {notFound} from 'next/navigation';
import {TerritoryPage} from '@/components/TerritoryPage';
import {communities,provinces,municipalities,communityPath,provincePath,slugify,displayName} from '@/lib/territories';
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props){const {slug}=await params;const c=communities.find(c=>slugify(c.name)===slug);return {title:c?displayName(c.name):'Comunidad no encontrada'}}
export default async function Page({params}:Props){const {slug}=await params;const c=communities.find(c=>slugify(c.name)===slug);if(!c)notFound();const list=provinces.filter(p=>p.communityCode===c.code);return <TerritoryPage name={c.name} kind={['18','19'].includes(c.code)?'CIUDAD AUTÓNOMA':'COMUNIDAD AUTÓNOMA'} code={c.code} municipalityCount={municipalities.filter(m=>m.communityCode===c.code).length} breadcrumbs={[{name:c.name,href:communityPath(c)}]}><h2>Explora sus territorios</h2><div className="province-cards">{list.map(p=><Link key={p.code} href={provincePath(p)}><span className="eyebrow">{['51','52'].includes(p.code)?'CIUDAD AUTÓNOMA':'PROVINCIA'} · {p.code}</span><h3>{displayName(p.name)}</h3><p>{municipalities.filter(m=>m.provinceCode===p.code).length} municipios <span>↗</span></p></Link>)}</div></TerritoryPage>}
