// Hearth & Ledger — hand-in program (make.fun bounty
// best-household-budget-site-20261126-1457).
//
// Copies app/ and screenshots/ from this repository into the output
// directory and writes /output/dossier.json with buildDossier from
// ./vendor/makefun-frontend.ts. Node 22+, standard library only.
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Without MAKEFUN_OUTPUT_DIR the output directory is /output. The output
// directory itself is never removed — only its contents are — so this
// program still works when the repository is mounted read-only and the
// output directory is a separate writable mount. Two runs write
// byte-identical output.

import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const REPO_ROOT = dirname(fileURLToPath(import.meta.url));

function outputDir(): string {
  const env = process.env.MAKEFUN_OUTPUT_DIR;
  if (env && env.trim() !== '') {
    return isAbsolute(env) ? env : resolve(process.cwd(), env);
  }
  return '/output';
}

function clearContents(dir: string): void {
  mkdirSync(dir, { recursive: true });
  for (const entry of readdirSync(dir)) {
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

const out = outputDir();
clearContents(out);
cpSync(join(REPO_ROOT, 'app'), join(out, 'app'), { recursive: true });
cpSync(join(REPO_ROOT, 'screenshots'), join(out, 'screenshots'), { recursive: true });
writeFileSync(join(out, 'dossier.json'), buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
  app_path_max_bytes: 1000,
}));
