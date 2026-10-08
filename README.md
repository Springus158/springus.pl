# springus.pl

![CI](https://github.com/Springus158/springus.pl/actions/workflows/ci.yml/badge.svg)

Strona i oferta freelancera **Springus** — tworzenie stron internetowych dla firm:
landing page, strony wizytówki i firmowe, aplikacje webowe oraz kampanie Google i Meta.

- **Baza:** Świętoniowa / gmina Przeworsk · Podkarpacie
- **Obsługa:** lokalnie (Przeworsk, Jarosław, Łańcut, Rzeszów) i zdalnie w całej Polsce
- **Hosting:** Cloudflare Workers (statyczne HTML/CSS/JS z `public/` + Worker API w `src/`)

## Stack

| Warstwa | Technologia |
| --- | --- |
| Frontend | czysty HTML + CSS + vanilla JS (bez frameworka) |
| API (formularz, chatbot) | Cloudflare Worker (`src/`, static assets binding `ASSETS`) |
| E-mail | Resend API |
| Chatbot | Cloudflare Workers AI |
| CI | GitHub Actions (`html-validate` + link checker + JSON-LD + syntax check) |
| Deploy | Cloudflare Workers Builds (auto z Git) lub `wrangler deploy` |

## Struktura

```
.
├── public/                   # statyczne assety (assets.directory → ./public)
│   ├── index.html
│   └── assets/
│       ├── css/style.css
│       └── js/main.js
├── src/                      # Worker: router API
│   ├── worker.js
│   └── api/
│       ├── contact.js        # /api/contact (Resend)
│       └── chat.js           # /api/chat (Workers AI)
├── scripts/                  # skrypty pomocnicze (CI)
├── package.json
└── wrangler.toml
```

## Jakość i CI

```bash
npm test   # validate + check:links + check:jsonld + check:worker
```

- `npm run validate` — `html-validate` na wszystkich stronach
- `npm run check:links` — skanuje `href`/`src` i pilnuje, żeby żaden wewnętrzny odnośnik nie prowadził w pustkę
- `npm run check:jsonld` — parsuje każdy blok JSON-LD
- `npm run check:worker` — `node --check` na plikach Workera

GitHub Actions (`.github/workflows/ci.yml`) uruchamia to samo przy każdym pushu na `main` i w każdym PR.

## Praca z PR-ami (stack)

Kolejne PR-y są zestackowane jeden na drugim (PR2 → PR1, PR3 → PR2 itd.).
Merge od dołu do góry — GitHub sam przekieruje kolejne PR-y na `main`.

## Praca lokalna

```bash
npm install
npm run dev        # wrangler dev — Worker + statyki, z bindingiem AI i API
npm run preview    # szybki podgląd samej statyki: python3 -m http.server 4173 --directory public
npm run validate   # walidacja HTML
```

## Formularz kontaktowy (`/api/contact`)

`src/api/contact.js` przyjmuje POST z formularza, waliduje dane (w tym honeypot
i opcjonalny Turnstile) i wysyła e-mail przez **Resend**.

- Po zapytaniu klient dostaje **automatyczne potwierdzenie** („odpowiem w 24 h”); `reply_to`
  auto-odpowiedzi to `CONTACT_TO`, więc odpowiedź klienta wraca do skrzynki.
- Powiadomienie do Ciebie zawiera **źródło zapytania**: stronę wejścia, referrer i parametry
  UTM (zbierane w `main.js` do `sessionStorage["springus-source"]` i dołączane do payloadu).

Zmienne środowiskowe (lokalnie: `.dev.vars` na podstawie `.dev.vars.example`;
produkcja: Cloudflare dashboard → Worker `springus-pl` → Settings → Variables and Secrets):

| Zmienna | Wymagana | Opis |
| --- | --- | --- |
| `RESEND_API_KEY` | tak | klucz API z resend.com; bez niego endpoint zwraca 503 |
| `CONTACT_TO` | nie | odbiorca zapytań (domyślnie `springusbiznes10@gmail.com`) |
| `CONTACT_FROM` | nie | nadawca (domyślnie `onboarding@resend.dev` — działa bez weryfikacji domeny; po weryfikacji `springus.pl` ustaw np. `formularz@springus.pl`) |
| `TURNSTILE_SECRET_KEY` | nie | włącza weryfikację tokenu Cloudflare Turnstile |

Test lokalny: `npm run dev` → http://localhost:8787 → formularz w sekcji Kontakt.
Zalecane: reguła rate limiting dla `/api/contact` w panelu Cloudflare.

## Chatbot (`/api/chat`)

`src/api/chat.js` — asystent AI jako **główny element strony głównej** (na wzór sprawnicyfrowo.pl):
pełnoekranowy hero z wyśrodkowanym kompozytorem (pill + okrągły przycisk „wyślij"), chipsy z
przykładowymi pytaniami pod spodem, a po pierwszej wiadomości hero zwija się do rozmowy i pojawia
się „Nowa rozmowa". Historia rozmowy w `sessionStorage`.
Korzysta z **Cloudflare Workers AI** (model `@cf/meta/llama-3.3-70b-instruct-fp8-fast`, binding `AI`
w `wrangler.toml`). System prompt zawiera usługi, ceny i obszar działania — asystent nie
wymyśla informacji spoza zakresu i kieruje do formularza/e-maila.

- Bez bindingu AI (lub przy błędzie modelu) endpoint zwraca życzliwy komunikat zastępczy —
  widget nigdy nie „wisi”.
- Walidacja: maks. 16 wiadomości, 1000 znaków na wiadomość, ostatnia musi być od użytkownika.
- Historia rozmowy trzymana w `sessionStorage` (czyszczona po zamknięciu karty).
- Binding AI (`[ai] binding = "AI"`) jest w `wrangler.toml` i działa zarówno lokalnie,
  jak i w Workers Builds.

> **Lokalny dev z bindingiem AI:** Workers AI działa zdalnie, więc przed `npm run dev`
> wykonaj raz `npx wrangler login` (darmowe konto Cloudflare). Bez logowania użyj
> `npm run preview` (tylko statyka) albo tymczasowo usuń sekcję `[ai]` z `wrangler.toml` —
> endpoint czatu zadziała wtedy na ścieżce zastępczej (200 + komunikat).

## SEO

- Meta/OG/Twitter + canonical + favicon w `index.html`, `og-image.png` 1200×630 (generowany branding)
- Structured data: **ProfessionalService** (usługi, ceny, obszar: Przeworsk/Jarosław/Łańcut/Rzeszów) i **FAQPage**
- `robots.txt`, `sitemap.xml`, `_headers` (CSP, X-Frame-Options, Permissions-Policy, cache statyków —
  Workers static assets obsługują `_headers` w katalogu assetów)
- **Cloudflare Web Analytics** (bez cookies) — włącz w panelu Cloudflare (Workers → Analytics); beacon
  jest wstrzykiwany automatycznie, a CSP w `_headers` już dopuszcza `cloudflareinsights.com`

## Analityka i zgody (`public/assets/js/analytics.js`)

- Domyślnie **nic nie ładuje się bez zgody** — strona nie ustawia cookies poza bezcookie'owym
  Cloudflare Web Analytics. Baner zgód pokazuje się tylko, gdy w `analytics.js` są wpisane
  identyfikatory.
- Konfiguracja (góra pliku): `ga4` (np. `G-…`), `googleAds` (np. `AW-…`), `adsLeadLabel`
  (etykieta konwersji formularza). Instrukcja krok po kroku: `docs/analiza-reklamowa.md`.
- Consent Mode v2: domyślnie wszystko `denied`, po „Akceptuję” → `granted`; wybór zapisany w
  `localStorage["springus-consent"]`, a link „Ustawienia cookies” w stopce otwiera baner ponownie.
- Zdarzenia przez `window.springusTrack`: `generate_lead` (wysłany formularz → konwersja Google
  Ads), `tel_click`, `email_click`, `chat_started`.
- CSP w `_headers` dopuszcza `googletagmanager.com`, `google-analytics.com`,
  `googleadservices.com` i `doubleclick.net`.

## Deploy

Produkcja: **Cloudflare Workers** (projekt `springus-pl`, `main = src/worker.js`,
statyki z `./public` przez binding `ASSETS`).

- **Git (zalecane):** Cloudflare dashboard → Workers & Pages → projekt `springus-pl` połączony
  z repo. Workers Builds sam robi `npm clean-install` i `npx wrangler deploy` przy każdym pushu
  na `main`.
- **CLI:** `npm run deploy` (`wrangler deploy`, po `npx wrangler login`).

Sekrety (Resend, Turnstile) ustaw w dashboardzie Workera: Settings → Variables and Secrets.
Binding AI i assets są zadeklarowane w `wrangler.toml`, więc deployują się z kodem.

> Historia: projekt zaczynał jako Cloudflare Pages (PR1–PR7 istniały w formie Pages Functions);
> repo zostało przepisane na Workers static assets, żeby działał natywny build z Git
> (`wrangler deploy`). Stary projekt Pages (`springus-pl.pages.dev`) można usunąć w panelu.

## Roadmapa (osobne PR-y)

- [x] **PR1 — scaffold:** repozytorium, narzędzia, bazowy layout i design system
- [x] **PR2 — landing:** pełne sekcje strony głównej (usługi, cennik, portfolio, FAQ)
- [x] **PR3 — formularz kontaktowy:** Pages Function + Resend + Turnstile/honeypot
- [x] **PR4 — chatbot:** Pages Function + Workers AI + widget na stronie
- [x] **PR5 — SEO:** meta/OG, JSON-LD, `robots.txt`, `sitemap.xml`, `_headers`, favicon
- [x] **PR6 — podstrony miejskie:** Przeworsk, Jarosław, Łańcut, Rzeszów
- [x] **PR7 — CI i deploy:** GitHub Actions (walidacja + link checker) i dokumentacja

## Do uzupełnienia (stan 2026-10-07)

- [x] Telefon kontaktowy — +48 796 904 039
- [x] Domena `springus.pl` + custom domain
- [ ] Wpisać identyfikatory GA4 / Google Ads w `public/assets/js/analytics.js`
- [ ] Konto Google Ads + konwersja `generate_lead`, Search Console, wizytówka Google (GBP)
- [x] E-mail `kontakt@springus.pl` (Cloudflare Email Routing → gmail; adresy na stronie podmienione)
- [ ] Pełne imię i nazwisko do stopki / polityki prywatności (obecnie „Kacper — Springus”)
- [x] Portfolio: sekcja `#portfolio` na stronie głównej — Orzechowo.pl (demo: https://orzechowo-demo.kacpermroszczyk10.workers.dev); kolejne realizacje dochodzą jako karty
- [ ] Case study ŁączyNas.pl (realizacje/opinie dopiero po decyzji)
- [ ] Landing `/wycena/` pod kampanie + sticky CTA mobilny
