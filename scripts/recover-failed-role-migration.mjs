import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const migrationName = "20260311071509_init";
const prismaExecutable = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "node_modules",
  ".bin",
  process.platform === "win32" ? "prisma.cmd" : "prisma"
);

function runPrisma(args) {
  const result = spawnSync(prismaExecutable, args, { encoding: "utf8" });

  if (result.error) {
    throw result.error;
  }

  return result;
}

function printResult(result) {
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
}

function failWith(result) {
  printResult(result);
  process.exit(result.status ?? 1);
}

const deployment = runPrisma(["migrate", "deploy"]);

if (deployment.status === 0) {
  printResult(deployment);
} else {
  const output = `${deployment.stdout ?? ""}\n${deployment.stderr ?? ""}`;
  const isKnownFailedMigration =
    output.includes("P3009") && output.includes(migrationName);

  if (!isKnownFailedMigration) {
    failWith(deployment);
  }

  console.log(`Recovering failed Prisma migration ${migrationName}...`);
  const resolution = runPrisma([
    "migrate",
    "resolve",
    "--rolled-back",
    migrationName,
  ]);

  // Another concurrent deployment may have resolved it first. In either case,
  // retry deploy and let that authoritative command determine success.
  if (resolution.status === 0) {
    printResult(resolution);
  }

  const retry = runPrisma(["migrate", "deploy"]);
  if (retry.status !== 0) {
    failWith(retry);
  }
  printResult(retry);
}
