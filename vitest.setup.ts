import "@testing-library/jest-dom/vitest";

import { execSync } from "child_process";
import { existsSync, rmSync } from "fs";
import path from "path";

const projectRoot = path.resolve(__dirname);
const prismaDirectory = path.join(projectRoot, "prisma");
const testDatabaseFile = path.join(prismaDirectory, "test.db");

const testDatabaseUrl = "file:./test.db";
process.env.DATABASE_URL = testDatabaseUrl;

if (existsSync(testDatabaseFile)) {
  rmSync(testDatabaseFile);
}

const commandOptions = {
  cwd: projectRoot,
  env: {
    ...process.env,
    DATABASE_URL: testDatabaseUrl,
  },
  stdio: "inherit" as const,
};

execSync("npx prisma migrate deploy", commandOptions);
execSync("npx prisma db seed", commandOptions);
