# springus.pl

Strona i oferta freelancera **Springus** — tworzenie stron internetowych dla firm:
landing page, strony wizytówki i firmowe, aplikacje webowe, SEO lokalne i opieka techniczna.

- **Baza:** Świętoniowa / gmina Przeworsk · Podkarpacie
- **Obsługa:** lokalnie (Przeworsk, Jarosław, Łańcut, Rzeszów) i zdalnie w całej Polsce
- **Hosting:** Cloudflare Pages (statyczne HTML/CSS/JS + Pages Functions dla API)

## Stack

| Warstwa | Technologia |
| --- | --- |
| Frontend | czysty HTML + CSS + vanilla JS (bez frameworka) |
| API (formularz, chatbot) | Cloudflare Pages Functions (`functions/`) |
| E-mail | Resend API |
| Chatbot | Cloudflare Workers AI |
| CI | GitHub Actions (`html-validate` + link checker) |
| Deploy | Cloudflare Pages |

## Struktura

```
.
├── public/                   # artefakt wdrożeniowy (pages_build_output_dir)
│   ├── index.html
│   └── assets/
│       ├── css/style.css
│       └── js/main.js
├── functions/                # Cloudflare Pages Functions (endpointy API)
├── scripts/                  # skrypty pomocnicze (CI)
├── package.json
└── wrangler.toml
```

## Praca lokalna

```bash
npm install
npm run dev        # wrangler pages dev public — z pełnym wsparciem functions/
npm run preview    # szybki podgląd statyki: python3 -m http.server 4173 --directory public
npm run validate   # walidacja HTML
```

## Formularz kontaktowy (`/api/contact`)

`functions/api/contact.js` przyjmuje POST z formularza, waliduje dane (w tym honeypot
i opcjonalny Turnstile) i wysyła e-mail przez **Resend**.

Zmienne środowiskowe (lokalnie: `.dev.vars` na podstawie `.dev.vars.example`;
produkcja: Cloudflare Pages → Settings → Environment variables):

| Zmienna | Wymagana | Opis |
| --- | --- | --- |
| `RESEND_API_KEY` | tak | klucz API z resend.com; bez niego endpoint zwraca 503 |
| `CONTACT_TO` | nie | odbiorca zapytań (domyślnie `kontakt@springus.pl`) |
| `CONTACT_FROM` | nie | zweryfikowany nadawca w Resend (domyślnie `formularz@springus.pl`) |
| `TURNSTILE_SECRET_KEY` | nie | włącza weryfikację tokenu Cloudflare Turnstile |

Test lokalny: `npm run dev` → http://localhost:8788 → formularz w sekcji Kontakt.
Zalecane: reguła rate limiting dla `/api/contact` w panelu Cloudflare.

## Chatbot (`/api/chat`)

`functions/api/chat.js` — asystent AI (widget w prawym dolnym rogu strony głównej).
Korzysta z **Cloudflare Workers AI** (model `@cf/meta/llama-3.1-8b-instruct`, binding `AI`
w `wrangler.toml`). System prompt zawiera usługi, ceny i obszar działania — asystent nie
wymyśla informacji spoza zakresu i kieruje do formularza/e-maila.

- Bez bindingu AI (lub przy błędzie modelu) endpoint zwraca życzliwy komunikat zastępczy —
  widget nigdy nie „wisi".
- Walidacja: maks. 16 wiadomości, 1000 znaków na wiadomość, ostatnia musi być od użytkownika.
- Historia rozmowy trzymana w `sessionStorage` (czyszczona po zamknięciu karty).
- Binding AI włącza się w panelu Pages (Settings → Functions → AI bindings) lub przez
  `wrangler.toml` (`[ai] binding = "AI"`).

> **Lokalny dev z bindingiem AI:** Workers AI działa zdalnie, więc przed `npm run dev`
> wykonaj raz `npx wrangler login` (darmowe konto Cloudflare). Bez logowania użyj
> `npm run preview` (tylko statyka) albo tymczasowo usuń sekcję `[ai]` z `wrangler.toml` —
> endpoint czatu zadziała wtedy na ścieżce zastępczej (200 + komunikat).

## SEO

- Meta/OG/Twitter + canonical + favicon w `index.html`, `og-image.png` 1200×630 (generowany branding)
- Structured data: **ProfessionalService** (usługi, ceny, obszar: Przeworsk/Jarosław/Łańcut/Rzeszów) i **FAQPage**
- `robots.txt`, `sitemap.xml`, `_headers` (CSP, X-Frame-Options, Permissions-Policy, cache statyków)
- **Cloudflare Web Analytics** (bez cookies) — włącz w panelu Cloudflare (Pages → Analytics); beacon
  jest wstrzykiwany automatycznie, a CSP w `_headers` już dopuszcza `cloudflareinsights.com`

## Deploy

Produkcja: **Cloudflare Pages** (projekt `springus-pl`, build output `public/`).

- Panel: połącz repo GitHub → ustaw *Build output directory* na `public`, brak komendy build
  (statyka + `functions/` wdrażane automatycznie).
- CLI: `npx wrangler pages deploy` (po `npx wrangler login`).

Sekrety (Resend, Turnstile, Workers AI) ustawiane są w panelu Cloudflare / `.dev.vars` lokalnie —
szczegóły w kolejnych PR-ach.

## Roadmapa (osobne PR-y)

- [x] **PR1 — scaffold:** repozytorium, narzędzia, bazowy layout i design system
- [ ] **PR2 — landing:** pełne sekcje strony głównej (usługi, cennik, portfolio, FAQ)
- [x] **PR3 — formularz kontaktowy:** Pages Function + Resend + Turnstile/honeypot
- [x] **PR4 — chatbot:** Pages Function + Workers AI + widget na stronie
- [x] **PR5 — SEO:** meta/OG, JSON-LD, `robots.txt`, `sitemap.xml`, `_headers`, favicon
- [ ] **PR6 — podstrony miejskie:** Przeworsk, Jarosław, Łańcut, Rzeszów
- [ ] **PR7 — CI i deploy:** GitHub Actions (walidacja + link checker) i dokumentacja

## Do uzupełnienia przed publikacją

- [ ] Telefon kontaktowy (obecnie placeholder w treści)
- [ ] Profil Google Business (po zakupie domeny)
- [ ] Zgody klientów na publikację realizacji w portfolio
- [ ] Treści o mnie (zdjęcie, opis doświadczenia)
- [ ] Zakup domeny `springus.pl` i podpięcie do Cloudflare Pages
