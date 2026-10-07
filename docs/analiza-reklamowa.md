# Springus.pl — analiza reklamowa i plan wdrożenia

Data: 2026-10-07 · Cel: przygotować stronę do skutecznej reklamy w Google Search (lokalnie).

## Decyzje

| Temat | Decyzja |
| --- | --- |
| Kanał startowy | Google Search lokalny (Przeworsk, Jarosław, Łańcut, Rzeszów + zdalnie Polska) |
| Forma działalności | Działalność nierejestrowana (bez NIP, bez VAT) |
| Portfolio | Do zdobycia — start: ŁączyNas.pl + własne realizacje (szablony usunięte 2026-10-07) |
| Model oferty | Bez miesięcznych opłat za utrzymanie strony (hosting Cloudflare w cenie) |
| Cennik | Landing od 500 zł, wizytówka od 800 zł, firmowa od 1200 zł (od 2026-10-07) |
| Reklamy | Sprzedajemy konfigurację i prowadzenie kampanii Google/Meta: od 800 zł + 400 zł/mies. (budżet klienta opłacany w Google/Meta) |
| Obsługa leada | Auto-potwierdzenie do klienta + UTM/referrer w powiadomieniu (od 2026-10-07) |
| Opinie | Świadomie bez opinii/recenzji na stronie (od 2026-10-07) |

## Stan wyjściowy (2026-10-06)

- Statyka na Cloudflare Workers + Worker API (formularz Resend, czat Workers AI); 6 URL-i.
- Brak jakiegokolwiek pomiaru (GA4/Ads/Pixel), brak zgód cookies, CSP blokowałoby Google.
- Brak realizacji i opinii; dema szablonów na `*.workers.dev`; e-mail gmail; brak NIP.
- Ceny „netto” przy braku VAT — do poprawy; „Wystawiam faktury” — do doprecyzowania.

## Konkurencja (skrót z SERP, 2026-10-07)

| Grupa | Przykłady | Mocne strony | Luka Springusa |
| --- | --- | --- | --- |
| SEO-farmy pod miasta | it-agencja.pl, stroneria.pl, devise.pl, softi.pl, advant-digital.pl | setki podstron miejskich, budżet organic + Ads | brak treści lokalnych E-E-A-T |
| Lokalne agencje | icommedia.pl, Studio Feniks, KB Projects, Mixture, Montownia Stron, ABM Studio | portfolio, opinie, pakiety (SEO/social/logo), abonament od 100 zł/mies., GA4+Pixel, GBP; ceny 999–2000 zł netto | brak portfolio, opinii, pomiaru, pakietów |
| Lokalni freelancerzy | ContentWave (Przeworsk), zarkowski.dev, Karol Lasek, Gabriel Lichacz | NIP, blog/SEO, portfolio, zgody cookies, Oferteo | brak tych elementów |
| Marketplace/DIY | Oferteo (150 firm w Przeworsku), Fixly, Wix/WebWave | lead od razu; średnia rynkowa PL 6,6–13,7 tys. zł netto | brak profilu, brak obsługi obiekcji „nie Wix” |

Wnioski: cena 500–1200 zł jest wyraźnie poniżej rynku (dobre pod Ads), ale bez dowodów wygląda
„tanio i anonimowo”. USP „bez miesięcznych opłat” wymaga uzasadnienia w treści.

## Ryzyka działalności nierejestrowanej

- Limit przychodu: 75% minimalnego wynagrodzenia miesięcznie (zweryfikować aktualną kwotę
  z księgową). Oferta landing/wizytówka mieści się w modelu; duże projekty mogą wymusić rejestrację.
- Dokumenty: można wystawiać rachunki oraz faktury bez VAT (nie będąc podatnikiem VAT).
  Na stronie komunikujemy: „faktura lub rachunek bez VAT”.
- Brak NIP: część firm B2B oczekuje faktury z NIP — obsłużone w treści (uczciwie).
- Google Ads: weryfikacja tożsamości osoby fizycznej + płatność kartą.

## Plan

- [x] Faza 0 — dokument analizy w repo.
- [x] Faza 1 — pomiar i zgody: GA4 + Ads tag (consent-gated), Consent Mode v2, CSP,
      eventy `generate_lead` / `tel_click` / `email_click` / `chat_started`, aktualizacja
      polityki prywatności, poprawa cen (netto → brutto bez VAT).
- [ ] Faza 2 — `/realizacje/` + case study ŁączyNas.pl; oferta startowa dla pierwszych
      klientów w zamian za zgodę na pokazanie realizacji (bez opinii — świadoma decyzja).
- [ ] Faza 3 — landing `/wycena/` + sticky CTA mobilny.
- [ ] Faza 4 — kampanie Google Search (struktura niżej).

## Instrukcja: konta i konfiguracja (manualnie)

1. **Google Analytics 4** — analytics.google.com → utwórz usługę `springus.pl` → skopiuj
   identyfikator `G-…` i wpisz w `public/assets/js/analytics.js` (`CONFIG.ga4`).
2. **Google Ads** — ads.google.com → konto (tryb „Ekspert”, cel: witryna) → w ustawieniach
   danymi firmy podaj dane osoby fizycznej; skopiuj identyfikator `AW-…` do `CONFIG.googleAds`.
3. **Konwersje** — Google Ads → Cele → Konwersje → nowa konwersja „Witryna” → ręcznie →
   zdarzenie `generate_lead`; etykietę konwersji wpisz w `CONFIG.adsLeadLabel`.
   Drugą konwersją (pomocniczą) może być `tel_click` — bez wpływu na optymalizację.
4. **Połączenie GA4 ↔ Ads** — Google Ads → Administracja → Połączone konta → Google Analytics.
5. **Search Console** — search.google.com/search-console → dodaj domenę `springus.pl`
   (weryfikacja DNS w Cloudflare) → zgłoś `https://springus.pl/sitemap.xml`.
6. **Wizytówka Google** — business.google.com → kategoria „Projektant stron internetowych”,
   obszar obsługi: Przeworsk, Jarosław, Łańcut, Rzeszów; dodaj usługi, opis, zdjęcia,
   link do strony.
7. **E-mail na domenie** — Cloudflare → Email Routing → `kontakt@springus.pl` → przekieruj
   na gmail. Po weryfikacji domeny w Resend ustaw nadawcę `formularz@springus.pl`.
   Dopiero wtedy podmienić adresy e-mail na stronie.

## Kampanie (Faza 4 — zarys)

- Kampania A: Search „Podkarpacie” — grupy: Przeworsk + powiat, Jarosław, Łańcut, Rzeszów;
  landingi: podstrony miejskie. Kampania B: Search „Polska (zdalnie)” → `/wycena/`.
- Frazy: „tworzenie stron internetowych + miasto”, „strona internetowa dla firmy”,
  „landing page cena”; negatywy: darmowe, kurs, praca, wix, webwave, szablon, sklep.
- Rozszerzenia: połączenie, lokalizacja, sitelinki, snippet usług.
- Budżet startowy: 20–30 zł/dzień; strategia: Maksymalizacja kliknięć → po ~20 konwersjach
  Maksymalizacja konwersji. KPI: koszt leada (formularz), liczba kliknięć w telefon.

## Pomiar i wskaźniki

- Konwersje główne: `generate_lead` (formularz), kliknięcia `tel:` (mikrokonwersja).
- Wsparcie: `chat_started`, `email_click`. Zgody: `localStorage["springus-consent"]` (v1).
- Miesięczny przegląd: GSC (zapytania), GA4 (ruchy), Ads (koszt/lead), GBP (wyświetlenia, kliknięcia telefonu).

## Ryzyko zgód

Odrzucenie zgody (~20–40% użytkowników) ogranicza dane; Consent Mode v2 modeluje część
konwersji. To normalne — nie wpływa na działanie strony.
