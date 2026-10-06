# Szablon: wizytowka-lokalna

Jednostronicowa strona dla rzemieślnika / lokalnej firmy (wzór: stiukwenecki.pl).
Duże zdjęcia, galeria realizacji, kontakt telefon-first. Czysty HTML/CSS/JS + Worker
(formularz przez Resend). Deploy na Cloudflare.

## Jak zacząć (nowy klient)

Z katalogu repo `springus.pl`:

```bash
npm run new:client nazwa-klienta -- --template wizytowka-lokalna \
  --firma "RK Stiuk Wenecki" --telefon "+48 789 317 703" \
  --email "kontakt@firma.pl" --miasto "Przeworsk" \
  --adres "ul. Przykładowa 1, 37-200 Przeworsk" \
  --nip "NIP 000 000 00 00" --domena "firma.pl" --kolor "#b45309"
```

Skrypt utworzy `~/www/nazwa-klienta`, podmieni placeholdery, zrobi `git init` i pierwszy commit.
Potem w katalogu klienta:

```bash
npm install
npm run dev      # podgląd: http://localhost:8787 (formularz działa)
npm run deploy   # wdrożenie na Cloudflare (po `npx wrangler login`)
```

## Checklista podmian (przed publikacją)

- [ ] **Teksty w `[nawiasach]`** — hero, „Poznaj" + mini-FAQ (zaktualizuj też FAQ w JSON-LD
      wyżej w `<head>`), wyróżniki, podpisy realizacji, „O nas"
- [ ] **Dane firmy** — `{{FIRMA}}`, `{{TELEFON}}`, `{{EMAIL}}`, `{{ADRES}}`, `{{NIP}}`, `{{MIASTO}}`
      (sprawdź `grep -rn "{{" public src` — nie może nic zostać)
- [ ] **Kolor marki** — `public/assets/css/style.css`, zmienna `--brand`
      (presety: bursztyn `#b45309` · zieleń `#166534` · bordo `#7f1d1d`)
- [ ] **Zdjęcia** — `assets/img/hero.svg` (min. 1600×1000) → prawdziwe zdjęcie;
      `realizacja.svg` ×6 → zdjęcia prac (min. 1200×900) + podpisy w `figcaption`;
      `o-nas.svg` → zdjęcie przy pracy (min. 800×1000)
- [ ] **Pasek haseł** (marquee) — podmień listę na swoje usługi/materiały
- [ ] **Og image** — `og-image.svg` → eksport do JPG 1200×630 i podmiana w `<head>`
- [ ] **Favicon** — `favicon.svg` (+ `apple-touch-icon.svg`)
- [ ] **Polityka prywatności** — uzupełnij datę i treść (`public/polityka-prywatnosci/`)
- [ ] **Domena** — kup, dodaj do Cloudflare, ustaw Custom Domain w Workerze

## Formularz kontaktowy (Resend)

1. Załóż konto na [resend.com](https://resend.com) (na mail klienta)
2. Skopiuj `.dev.vars.example` → `.dev.vars` i uzupełnij `RESEND_API_KEY` (lokalnie)
3. W Cloudflare: Worker → Settings → Variables and Secrets → dodaj `RESEND_API_KEY`
   oraz `CONTACT_TO` (mail klienta). Domyślnie wysyłka idzie z `onboarding@resend.dev` —
   po weryfikacji domeny klienta ustaw `CONTACT_FROM`.
4. Test: `npm run dev` → wyślij formularz → sprawdź skrzynkę

## Struktura

```
public/            # statyki (index, css, js, img, robots, sitemap, _headers)
src/worker.js      # router: /api/contact + statyki
src/api/contact.js # formularz (Resend, honeypot, opcjonalny Turnstile)
wrangler.toml      # nazwa workera + binding ASSETS
```

## Wskazówki

- Galeria to zwykłe `figure` w siatce 3 kolumny (2 na tabletach, 1 na telefonie) —
  dodawaj/usuń `figure`, siatka sama się ułoży
- Zdjęcia trzymaj w `assets/img/` i podawaj `width`/`height` w `<img>` (CLS)
- Marquee (pasek haseł) respektuje `prefers-reduced-motion`
- Formularz ma honeypot; Turnstile włączysz, dodając `TURNSTILE_SECRET_KEY`
