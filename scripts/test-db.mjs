import { spawnSync } from "node:child_process";
if (!process.env.TEST_DATABASE_URL)
  throw new Error(
    "Define TEST_DATABASE_URL apuntando a una base desechable terminada en _test. Nunca usar producción.",
  );
const result = spawnSync(
  process.execPath,
  [
    "--experimental-strip-types",
    "--test",
    "--test-concurrency=1",
    "tests/integration/database.test.ts",
  ],
  { stdio: "inherit", env: process.env },
);
process.exitCode = result.status ?? 1;
