/**
 * Sprawdza, czy wszystkie wewnętrzne odnośniki (href/src) we wszystkich stronach
 * HTML z katalogu public prowadzą do istniejących plików. Linki zewnętrzne,
 * mailto:, tel: i czyste kotwice (#...) są pomijane — kotwice weryfikuje html-validate.
 *
 * Użycie: node scripts/check-links.mjs
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROOTS = [join(ROOT, "public")].filter((dir) => existsSync(dir));
const PUBLIC_DIR = join(ROOT, "public");

const EXTERNAL = /^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/;

function walkHtml(dir) {
  const results = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkHtml(full));
    } else if (entry.name.endsWith(".html")) {
      results.push(full);
    }
  }

  return results;
}

function targetExists(target) {
  if (!existsSync(target)) {
    return false;
  }
  if (statSync(target).isDirectory()) {
    return existsSync(join(target, "index.html"));
  }
  return true;
}

const errors = [];
const pages = ROOTS.flatMap((dir) => walkHtml(dir));

for (const page of pages) {
  const html = readFileSync(page, "utf8").replace(/<!--[\s\S]*?-->/g, "");
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);

  for (const ref of refs) {
    if (EXTERNAL.test(ref)) {
      continue;
    }

    const pathPart = ref.split("#")[0].split("?")[0];
    if (!pathPart) {
      continue;
    }

    const candidates = [];
    if (pathPart.startsWith("/")) {
      candidates.push(join(PUBLIC_DIR, pathPart));
    } else {
      candidates.push(resolve(dirname(page), pathPart));
    }

    const base = candidates[0];
    candidates.push(`${base}.html`, join(base, "index.html"));

    if (!candidates.some(targetExists)) {
      errors.push(`${page.replace(`${ROOT}/`, "")} -> ${ref}`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Znaleziono ${errors.length} nieprawidłowych odnośników:\n`);
  errors.forEach((error) => console.error(`  ${error}`));
  process.exit(1);
}

console.log(`OK — ${pages.length} stron, wszystkie wewnętrzne odnośniki istnieją.`);
