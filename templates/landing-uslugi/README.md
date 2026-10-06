# Szablon: landing-uslugi

Jednostronicowa strona dla firmy usługowej / eksperta (wzór: jakub-socha.pl).
Czysty HTML/CSS/JS + Worker (formularz przez Resend). Deploy na Cloudflare.

## Jak zacząć (nowy klient)

Z katalogu repo `springus.pl`:

```bash
npm run new:client nazwa-klienta -- --template landing-uslugi \
  --firma "Jan Kowalski" --telefon "+48 600 100 200" \
  --email "kontakt@firma.pl" --miasto "Przeworsk" \
  --adres "ul. Przykładowa 1, 37-200 Przeworsk" \
  --nip "NIP 000 000 00 00" --domena "firma.pl" --kolor "#1e3a8a"
```

Skrypt utworzy `~/www/nazwa-klienta`, podmieni placeholdery, zrobi `git init` i pierwszy commit.
Potem w katalogu klienta:

```bash
npm install
npm run dev      # podgląd: http://localhost:8787 (formularz działa)
npm run deploy   # wdrożenie na Cloudflare (po `npx wrangler login`)
```

## Checklista podmian (przed publikacją)

- [ ] **Teksty w `[nawiasach]`** — hero, usługi (4 karty), proces, o mnie, opinie, FAQ
      (przepisz na konkret klienta; FAQ zaktualizuj też w JSON-LD wyżej w `<head>`)
- [ ] **Dane firmy** — `{{FIRMA}}`, `{{TELEFON}}`, `{{EMAIL}}`, `{{ADRES}}`, `{{NIP}}`, `{{MIASTO}}`
      (sprawdź `grep -rn "{{" public src` — nie może nic zostać)
- [ ] **Kolor marki** — `public/assets/css/style.css`, zmienna `--brand`
      (presety: terracotta `#c2410c` · zieleń `#166534` · granat `#1e3a8a`)
- [ ] **Zdjęcia** — `assets/img/hero-portret.svg`, `o-mnie.svg` → prawdziwe zdjęcia
      (min. 800×1000); `og-image.svg` → eksport do JPG 1200×630 i podmiana w `<head>`
- [ ] **Favicon** — `favicon.svg` (+ `apple-touch-icon.svg`)
- [ ] **Opinie** — prawdziwe opinie klienta + link do wizytówki Google
- [ ] **Mapa** — podmień `{{MIASTO}}` w `iframe` na adres firmy (Google Maps → Udostępnij → Umieść mapę)
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

- Zdjęcia trzymaj w `assets/img/` i podawaj `width`/`height` w `<img>` (CLS)
- Sekcje można usuwać/duplikować — klasy są współdzielone, siatki same się układają
- Formularz ma honeypot; Turnstile włączysz, dodając `TURNSTILE_SECRET_KEY`
