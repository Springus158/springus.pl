# Szablony klientów (Springus)

Gotowe do skopiowania strony dla klientów — czysty HTML/CSS/JS + Worker (formularz przez
Resend), deploy na Cloudflare. Każdy szablon jest samodzielny: kopiuj → podmień treści →
wdroź.

| Szablon | Dla kogo | Styl |
| --- | --- | --- |
| [`landing-uslugi`](landing-uslugi/) | firmy usługowe, eksperci, doradcy | edytorski: serif Fraunces, głęboka zieleń, duże liczby |
| `wizytowka-lokalna` | rzemieślnicy, lokalne firmy, budowlanka | ciepłe rzemiosło: tynk/glina, galeria, telefon-first |

Podglądy na żywo (wersje demo generowane z tych szablonów, `noindex`):
- https://springus.pl/szablony/landing-uslugi/
- https://springus.pl/szablony/wizytowka-lokalna/

## Nowy projekt klienta

```bash
npm run new:client nazwa-klienta -- --template landing-uslugi \
  --firma "Jan Kowalski" --telefon "+48 600 100 200" \
  --email "kontakt@firma.pl" --miasto "Przeworsk" \
  --adres "ul. Przykładowa 1, 37-200 Przeworsk" \
  --nip "NIP 000 000 00 00" --domena "firma.pl" --kolor "#1e3a8a"
```

Skrypt utworzy `~/www/nazwa-klienta`, podmieni placeholdery (`{{FIRMA}}`, `{{TELEFON}}`,
`{{EMAIL}}`, `{{MIASTO}}`, `{{ADRES}}`, `{{NIP}}`, `{{DOMENA}}`, `{{KOLOR}}`, `{{NAZWA}}`),
zainicjuje repo git i zrobi pierwszy commit.

## Zasady

- Każdy szablon jest samodzielny (własny `package.json`, `wrangler.toml`, README).
- Walidacja szablonów działa w CI repo głównego (`npm test`).
- Formularz: ten sam wzorzec co springus.pl (Resend + honeypot + opcjonalny Turnstile).
- Zero build-stepu — pliki z `public/` idą na Cloudflare tak, jak są.
