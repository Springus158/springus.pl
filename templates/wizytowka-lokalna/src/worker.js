/**
 * Worker szablonu — router API + statyki z ./public.
 *
 * - /api/contact → formularz kontaktowy (Resend)
 * - pozostałe    → statyczne assety (binding ASSETS)
 */

import { handleContact } from "./api/contact.js";

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/contact") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "Metoda niedozwolona." }, 405);
      }
      return handleContact(request, env);
    }

    if (pathname.startsWith("/api/")) {
      return json({ ok: false, error: "Nie znaleziono." }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};
