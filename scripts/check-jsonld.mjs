/**
 * Sprawdza, czy każdy blok <script type="application/ld+json"> na stronach
 * z katalogu public zawiera poprawny JSON. Użycie: node scripts/check-jsonld.mjs
 */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = join(ROOT, "public");

function walk(dir, extension) {
  const results = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full, extension));
    } else if (entry.name.endsWith(extension)) {
      results.push(full);
    }
  }

  return results;
}

const errors = [];
const pages = walk(PUBLIC_DIR, ".html");
let blocks = 0;

for (const page of pages) {
  const html = readFileSync(page, "utf8");
  const matches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];

  matches.forEach((match, index) => {
    blocks += 1;
    try {
      JSON.parse(match[1]);
    } catch (error) {
      errors.push(`${page.replace(`${ROOT}/`, "")} (blok ${index + 1}): ${error.message}`);
    }
  });
}

if (errors.length > 0) {
  console.error("Niepoprawne bloki JSON-LD:\n");
  errors.forEach((error) => console.error(`  ${error}`));
  process.exit(1);
}

console.log(`OK — ${blocks} bloków JSON-LD w ${pages.length} stronach.`);
