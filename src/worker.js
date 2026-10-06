/**
 * Worker springus.pl — router API + serwowanie statyków z ./public.
 *
 * - /api/contact → formularz kontaktowy (Resend)
 * - /api/chat    → asystent AI (Workers AI)
 * - pozostałe    → statyczne assety (binding ASSETS, katalog ./public)
 */

import { handleContact } from "./api/contact.js";
import { handleChat } from "./api/chat.js";

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

    if (pathname === "/api/chat") {
      if (request.method !== "POST") {
        return json({ error: "Metoda niedozwolona." }, 405);
      }
      return handleChat(request, env);
    }

    if (pathname.startsWith("/api/")) {
      return json({ ok: false, error: "Nie znaleziono." }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};
