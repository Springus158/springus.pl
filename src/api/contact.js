/**
 * POST /api/contact — przyjmuje zapytanie z formularza i wysyła e-mail przez Resend.
 *
 * Zmienne środowiskowe (Cloudflare dashboard → Worker → Settings → Variables and Secrets):
 *   RESEND_API_KEY       – klucz API Resend (wymagany, bez niego endpoint zwraca 503)
 *   CONTACT_TO           – adres odbiorcy (domyślnie springusbiznes10@gmail.com)
 *   CONTACT_FROM         – nadawca (domyślnie onboarding@resend.dev — działa bez weryfikacji
 *                          domeny w Resend; po weryfikacji springus.pl ustaw np. formularz@springus.pl)
 *   TURNSTILE_SECRET_KEY – opcjonalny sekret Cloudflare Turnstile (włącza weryfikację tokenu)
 */

const MAX = {
  name: 120,
  email: 160,
  phone: 40,
  service: 80,
  message: 5000,
};

const SERVICES = {
  landing: "Landing page",
  wizytowka: "Strona wizytówka",
  firmowa: "Strona firmowa",
  aplikacja: "Aplikacja webowa / PWA",
  seo: "SEO lokalne / Google Maps",
  opieka: "Opieka nad stroną",
  inne: "Inne / do ustalenia",
};

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function clean(value) {
  return String(value == null ? "" : value).trim();
}

function escapeHtml(value) {
  return clean(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function readPayload(request) {
  const type = request.headers.get("Content-Type") || "";

  if (type.includes("application/json")) {
    return { data: await request.json(), html: false };
  }

  const form = await request.formData();
  const data = {};
  for (const [key, value] of form.entries()) {
    data[key] = typeof value === "string" ? value : "";
  }
  return { data, html: true };
}

async function verifyTurnstile(env, request, token) {
  if (!env.TURNSTILE_SECRET_KEY) {
    return true;
  }
  if (!token) {
    return false;
  }

  const body = new FormData();
  body.append("secret", env.TURNSTILE_SECRET_KEY);
  body.append("response", token);
  body.append("remoteip", request.headers.get("CF-Connecting-IP") || "");

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    const outcome = await res.json();
    return outcome.success === true;
  } catch {
    return false;
  }
}

function validate(data) {
  const errors = [];

  if (clean(data.name).length < 2 || clean(data.name).length > MAX.name) {
    errors.push("Podaj imię i nazwisko.");
  }

  const email = clean(data.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > MAX.email) {
    errors.push("Podaj poprawny adres e-mail.");
  }

  if (clean(data.phone).length > MAX.phone) {
    errors.push("Numer telefonu jest za długi.");
  }

  const message = clean(data.message);
  if (message.length < 10 || message.length > MAX.message) {
    errors.push("Wiadomość powinna mieć od 10 do 5000 znaków.");
  }

  if (clean(data.consent).toLowerCase() !== "yes") {
    errors.push("Zgoda na przetwarzanie danych jest wymagana.");
  }

  return errors;
}

function buildEmail(data) {
  const serviceKey = clean(data.service) || "inne";
  const serviceLabel = SERVICES[serviceKey] || SERVICES.inne;

  const lines = [
    "Nowe zapytanie ze strony springus.pl",
    "",
    `Imię i nazwisko: ${clean(data.name)}`,
    `E-mail: ${clean(data.email)}`,
    `Telefon: ${clean(data.phone) || "—"}`,
    `Temat: ${serviceLabel}`,
    "",
    "Wiadomość:",
    clean(data.message),
  ];

  return {
    subject: `Nowe zapytanie: ${serviceLabel} — ${clean(data.name)}`,
    text: lines.join("\n"),
    replyTo: clean(data.email),
  };
}

export async function handleContact(request, env) {
  let payload;
  try {
    payload = await readPayload(request);
  } catch {
    return json({ ok: false, error: "Nieprawidłowe dane formularza." }, 400);
  }

  const { data, html } = payload;
  const wantHtml = html && (request.headers.get("Accept") || "").includes("text/html");

  const fail = (status, error) =>
    wantHtml
      ? new Response(
          `<!DOCTYPE html><html lang="pl"><meta charset="utf-8"><title>Błąd formularza</title><body style="font-family:sans-serif;max-width:36rem;margin:4rem auto;padding:0 1rem"><h1>Nie udało się wysłać zapytania</h1><p>${escapeHtml(
            error,
          )}</p><p>Napisz bezpośrednio na <a href="mailto:springusbiznes10@gmail.com">springusbiznes10@gmail.com</a>.</p></body></html>`,
          { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
        )
      : json({ ok: false, error }, status);

  // Honeypot: pole "company" musi zostać puste — botom udajemy sukces.
  if (clean(data.company)) {
    return wantHtml ? Response.redirect(new URL("/#kontakt", request.url), 303) : json({ ok: true });
  }

  const errors = validate(data);
  if (errors.length > 0) {
    return fail(400, errors[0]);
  }

  const turnstileOk = await verifyTurnstile(env, request, data.turnstileToken);
  if (!turnstileOk) {
    return fail(400, "Weryfikacja antybotowa nie powiodła się. Odśwież stronę i spróbuj ponownie.");
  }

  if (!env.RESEND_API_KEY) {
    console.error("Brak RESEND_API_KEY — formularz nie może wysłać wiadomości.");
    return fail(503, "Formularz jest chwilowo niedostępny.");
  }

  const mail = buildEmail(data);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM || "Formularz Springus <onboarding@resend.dev>",
        to: [env.CONTACT_TO || "springusbiznes10@gmail.com"],
        reply_to: mail.replyTo,
        subject: mail.subject,
        text: mail.text,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("Resend odrzucił wiadomość:", res.status, detail);
      return fail(502, "Nie udało się wysłać wiadomości.");
    }
  } catch (error) {
    console.error("Błąd połączenia z Resend:", error);
    return fail(502, "Nie udało się wysłać wiadomości.");
  }

  if (wantHtml) {
    return Response.redirect(new URL("/#kontakt", request.url), 303);
  }

  return json({ ok: true });
}
