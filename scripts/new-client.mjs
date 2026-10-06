#!/usr/bin/env node
/**
 * Tworzy nowy projekt klienta z szablonu.
 *
 * Użycie:
 *   npm run new:client nazwa-klienta -- --template landing-uslugi \
 *     --firma "Jan Kowalski" --telefon "+48 600 100 200" \
 *     --email "kontakt@firma.pl" --miasto "Przeworsk" \
 *     --adres "ul. Przykładowa 1, 37-200 Przeworsk" \
 *     --nip "NIP 000 000 00 00" --domena "firma.pl" --kolor "#1e3a8a"
 *
 * Opcje:
 *   --template <nazwa>   (wymagane) katalog z templates/
 *   --dir <ścieżka>      gdzie utworzyć projekt (domyślnie ../<nazwa>, czyli ~/www/<nazwa>)
 *   --firma, --telefon, --email, --miasto, --adres, --nip, --domena, --kolor
 */

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATES_DIR = join(ROOT, "templates");

const args = process.argv.slice(2);
const positional = args.filter((arg) => !arg.startsWith("--"));

function option(name, fallback) {
  const index = args.indexOf(`--${name}`);
  if (index === -1 || index === args.length - 1) {
    return fallback;
  }
  return args[index + 1];
}

const name = positional[0];
const template = option("template");

if (!name || !template) {
  console.error("Użycie: npm run new:client <nazwa> -- --template <szablon> [--firma ...] [--telefon ...] ...");
  process.exit(1);
}

const templateDir = join(TEMPLATES_DIR, template);
if (!existsSync(templateDir) || !statSync(templateDir).isDirectory()) {
  const available = readdirSync(TEMPLATES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .join(", ");
  console.error(`Nie ma szablonu "${template}". Dostępne: ${available}`);
  process.exit(1);
}

const domena = option("domena", `${name}.pl`);
const kolor = option("kolor", "#c2410c");
const firma = option("firma", name);
const telefon = option("telefon", "+48 000 000 000");
const email = option("email", `kontakt@${domena}`);
const miasto = option("miasto", "[miasto]");
const adres = option("adres", "[adres]");
const nip = option("nip", "NIP [uzupełnij]");

const target = resolve(option("dir", join(ROOT, "..", name)));

if (existsSync(target)) {
  console.error(`Katalog docelowy już istnieje: ${target}`);
  process.exit(1);
}

const replacements = {
  "{{NAZWA}}": name,
  "{{FIRMA}}": firma,
  "{{TELEFON}}": telefon,
  "{{TELEFON_HREF}}": telefon.replace(/[^\d+]/g, ""),
  "{{EMAIL}}": email,
  "{{MIASTO}}": miasto,
  "{{ADRES}}": adres,
  "{{NIP}}": nip,
  "{{DOMENA}}": domena,
  "{{KOLOR}}": kolor,
};

const TEXT_FILE = /\.(html|css|js|json|txt|xml|toml|example|md|svg)$/;

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") {
        continue;
      }
      files.push(...walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

mkdirSync(target, { recursive: true });
cpSync(templateDir, target, {
  recursive: true,
  filter: (src) => !src.includes("node_modules") && !src.includes(".wrangler"),
});

let replaced = 0;
for (const file of walk(target)) {
  const base = file.split("/").pop();
  if (!TEXT_FILE.test(base) && base !== ".gitignore" && base !== ".dev.vars.example") {
    continue;
  }
  const original = readFileSync(file, "utf8");
  let updated = original;
  for (const [placeholder, value] of Object.entries(replacements)) {
    updated = updated.replaceAll(placeholder, value);
  }
  if (updated !== original) {
    writeFileSync(file, updated);
    replaced += 1;
  }
}

console.log(`\nProjekt utworzony: ${target}`);
console.log(`Szablon: ${template} · plików z podmianami: ${replaced}\n`);

/* Git: init + pierwszy commit */
try {
  execFileSync("git", ["init", "-b", "main"], { cwd: target, stdio: "ignore" });
  execFileSync("git", ["config", "user.name", "Kacper"], { cwd: target });
  execFileSync("git", ["config", "user.email", "springusbiznes10@gmail.com"], { cwd: target });
  execFileSync("git", ["add", "-A"], { cwd: target });
  execFileSync("git", ["commit", "-m", `chore: start projektu z szablonu ${template}`], {
    cwd: target,
    stdio: "ignore",
  });
  console.log("Git: zainicjowany (main) i pierwszy commit utworzony.");
} catch {
  console.log("Git: pominięto (sprawdź konfigurację git w katalogu).");
}

console.log(`
Następne kroki:
  cd ${target}
  npm install
  npm run dev      # podgląd: http://localhost:8787
  npm run deploy   # wdrożenie na Cloudflare

Do uzupełnienia przed publikacją:
  - treści w [nawiasach] (hero, usługi, proces, o mnie, opinie, FAQ)
  - dane: ${telefon === "+48 000 000 000" ? "TELEFON (placeholder!)" : "telefon ✓"}, ${miasto === "[miasto]" ? "MIASTO (placeholder!)" : "miasto ✓"}, ${adres === "[adres]" ? "ADRES (placeholder!)" : "adres ✓"}, ${nip}
  - zdjęcia w public/assets/img/
  - checklista w README.md szablonu
`);
