import { Pool, type PoolConfig } from "pg";
import { SUPABASE_ROOT_CA } from "./supabase-ca.ts";

/**
 * Conexión de servidor a la base de votos (Supabase, región UE).
 * TLS siempre verificado: CA de Supabase (o VOTE_DATABASE_CA_CERT si se
 * define). `sslmode` se elimina de la URL porque en `pg` sustituiría esta
 * configuración. Nunca rejectUnauthorized=false.
 */
export function voteDbConfig(url: string, env: Record<string, string | undefined> = process.env): PoolConfig {
  const u = new URL(url);
  const local = ["localhost", "127.0.0.1", "::1"].includes(u.hostname);
  for (const k of ["sslmode", "sslrootcert", "sslcert", "sslkey", "uselibpqcompat"]) u.searchParams.delete(k);
  return {
    connectionString: u.toString(),
    ssl: local ? false : { rejectUnauthorized: true, ca: env.VOTE_DATABASE_CA_CERT || SUPABASE_ROOT_CA },
    max: 4,
    connectionTimeoutMillis: 5000,
    statement_timeout: 10000,
    idleTimeoutMillis: 10000,
  };
}

const g = globalThis as typeof globalThis & { __votePool?: Pool };
export function getVotePool(): Pool {
  const url = process.env.VOTE_DATABASE_URL;
  if (!url || !/^postgres(?:ql)?:\/\//.test(url)) throw new Error("NO_VOTE_DATABASE");
  g.__votePool ??= new Pool(voteDbConfig(url));
  return g.__votePool;
}
