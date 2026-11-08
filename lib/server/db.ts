import { Pool, type PoolClient } from "pg";
export function createTestPool(url: string) {
  if (process.env.NODE_ENV === "production")
    throw new Error("TEST_ENGINE_ONLY");
  const parsed = new URL(url);
  if (!parsed.pathname.endsWith("_test"))
    throw new Error("TEST_DATABASE_REQUIRED");
  return new Pool({
    connectionString: url,
    max: 8,
    statement_timeout: 10000,
    connectionTimeoutMillis: 5000,
  });
}
export async function transaction<T>(
  pool: Pool,
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
