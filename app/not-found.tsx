import Link from 'next/link';
export default function NotFound(){return <section className="page-section"><div className="eyebrow">404 / NO ENCONTRADO</div><h1>Este lugar no aparece<br/>en el camino.</h1><p className="lead">La dirección no corresponde a una página o a un código territorial válido.</p><Link className="button" href="/mapa">Buscar un municipio ↗</Link></section>}
