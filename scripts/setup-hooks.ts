#!/usr/bin/env bun
/**
 * CLI entry point for registering opensessions hooks in Claude Code's settings.json.
 * Usage: bun run scripts/setup-hooks.ts
 */

import { join } from "path";
import { registerHooks } from "../packages/runtime/src/setup/register-hooks";

const opensessionsDir = join(import.meta.dir, "..");

const added = registerHooks(opensessionsDir);

if (added.length === 0) {
  console.log("All hooks already registered.");
} else {
  console.log(`Registered hooks for: ${added.join(", ")}`);
}
