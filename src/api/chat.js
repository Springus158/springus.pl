/**
 * POST /api/chat — asystent AI na stronie (Cloudflare Workers AI).
 *
 * Binding: [ai] binding = "AI" w wrangler.toml.
 * Bez bindingu endpoint zwraca życzliwy komunikat zastępczy (200), więc widget działa zawsze.
 *
 * Body: { "messages": [{ "role": "user"|"assistant", "content": "..." }, ...] }
 * Odpowiedź: { "reply": "..." }
 */

const MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8";
const MAX_MESSAGES = 16;
const MAX_CONTENT = 1000;

const SYSTEM_PROMPT = `Jesteś asystentem na stronie springus.pl — strony ofertowej Kacpra (marka Springus), który tworzy strony internetowe dla firm.

Najważniejsze informacje:
- Usługi: landing page, strona wizytówka, strona firmowa, aplikacje webowe/PWA, SEO lokalne i Google Maps, opieka i hosting.
- Ceny (netto): landing page od 1200 zł, strona wizytówka od 1500 zł, strona firmowa od 3000 zł. SEO lokalne od 600 zł jednorazowo, opieka od 100 zł/mies. Domena ok. 60–100 zł/rok, rejestrowana na klienta. Hosting na Cloudflare w cenie wdrożenia.
- Płatność: zaliczka 30–50%, reszta przy odbiorze. Wystawiane są faktury.
- Czas realizacji: landing 3–7 dni, wizytówka 1–2 tygodnie, strona firmowa 2–4 tygodnie.
- Proces: rozmowa i bezpłatna wycena (odpowiedź w 24 h) → oferta i zaliczka → realizacja z 2 rundami poprawek → wdrożenie i 30 dni wsparcia.
- Kontakt: springusbiznes10@gmail.com, formularz w sekcji Kontakt. Obszar: Świętoniowa, gmina Przeworsk, Podkarpacie (Przeworsk, Jarosław, Łańcut, Rzeszów) oraz zdalnie cała Polska.
- Realizacja: ŁączyNas.pl — platforma portali dla lokalnych społeczności zbudowana od zera (newsy, wydarzenia, ogłoszenia, PWA z powiadomieniami).

Zasady:
- Odpowiadaj krótko (2–4 zdania), po polsku, rzeczowo i przyjaźnie, bez emoji.
- Nie wymyślaj cen ani terminów spoza powyższych. Jeśli pytanie wykracza poza zakres — zachęć do napisania na springusbiznes10@gmail.com lub zostawienia zapytania w formularzu.
- Przy pytaniach o wycenę konkretnego projektu dopytaj o branżę i zakres, a potem zaproponuj formularz kontaktowy.
- Nie obiecuj terminów i funkcji, których nie ma na liście. Nie udawaj człowieka — jesteś asystentem AI.
- Mów w pierwszej osobie liczby pojedynczej w imieniu Kacpra („zbudowałem", nie „zbudowaliśmy" / „nasza firma").`;

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function sanitizeMessages(input) {
  if (!Array.isArray(input)) {
    return null;
  }

  const messages = input
    .filter((message) => message && (message.role === "user" || message.role === "assistant"))
    .map((message) => ({
      role: message.role,
      content: String(message.content == null ? "" : message.content).trim(),
    }))
    .filter((message) => message.content.length > 0 && message.content.length <= MAX_CONTENT)
    .slice(-MAX_MESSAGES);

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return null;
  }

  return messages;
}

const FALLBACK_REPLY =
  "Asystent jest chwilowo niedostępny. Napisz proszę na springusbiznes10@gmail.com albo zostaw zapytanie w formularzu kontaktowym — odpowiem w ciągu 24 godzin w dni robocze.";

export async function handleChat(request, env) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Nieprawidłowe dane wejściowe." }, 400);
  }

  const messages = sanitizeMessages(payload && payload.messages);
  if (!messages) {
    return json({ error: "Brak wiadomości do przetworzenia." }, 400);
  }

  if (!env.AI) {
    console.warn("Brak bindingu AI — zwracam komunikat zastępczy.");
    return json({ reply: FALLBACK_REPLY });
  }

  try {
    const result = await env.AI.run(MODEL, {
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 400,
      temperature: 0.4,
    });

    const reply = String((result && result.response) || "").trim();
    if (!reply) {
      return json({ reply: FALLBACK_REPLY });
    }

    return json({ reply });
  } catch (error) {
    console.error("Błąd Workers AI:", error);
    return json({ reply: FALLBACK_REPLY });
  }
}
