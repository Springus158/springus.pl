/* springus.pl — zgody cookies + analityka (Google Analytics 4, Google Ads)
 *
 * KONFIGURACJA — po założeniu kont wypełnij poniższe pola:
 *   ga4          – identyfikator pomiaru Google Analytics 4, np. "G-ABC123XYZ"
 *   googleAds    – identyfikator Google Ads, np. "AW-123456789"
 *   adsLeadLabel – etykieta konwersji formularza z Google Ads, np. "AbC-D_efG"
 *                  (Google Ads → Cele → Konwersje → utwórz „Zgłoszenie formularza”
 *                   i przepisz etykietę z tagu zdarzenia)
 *
 * Dopóki pola są puste, strona działa bez cookies, baner się nie pokazuje,
 * a window.springusTrack jest bezpieczną atrapą.
 */
(function () {
  "use strict";

  var CONFIG = {
    ga4: "",
    googleAds: "",
    adsLeadLabel: "",
  };

  var STORAGE_KEY = "springus-consent";
  var configured = Boolean(CONFIG.ga4 || CONFIG.googleAds);

  window.springusTrack = function () {};

  var settingsLinks = document.querySelectorAll("[data-cookie-settings]");
  if (configured) {
    settingsLinks.forEach(function (el) {
      el.hidden = false;
    });
  }

  if (!configured) {
    return;
  }

  var dataLayer = (window.dataLayer = window.dataLayer || []);
  function gtag() {
    dataLayer.push(arguments);
  }
  window.gtag = gtag;

  /* Consent Mode v2 — domyślnie wszystko odrzucone */
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500,
  });
  gtag("set", "url_passthrough", true);
  gtag("set", "ads_data_redaction", true);

  function readConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : null;
      if (parsed && parsed.v === 1 && typeof parsed.granted === "boolean") {
        return parsed;
      }
    } catch (error) {
      /* brak localStorage — pytamy za każdym razem */
    }
    return null;
  }

  function writeConsent(granted) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ v: 1, granted: granted, date: new Date().toISOString() })
      );
    } catch (error) {
      /* brak localStorage — trudno, działamy dalej */
    }
  }

  function applyConsent(granted) {
    var state = granted ? "granted" : "denied";
    gtag("consent", "update", {
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
      analytics_storage: state,
    });
  }

  var stored = readConsent();
  if (stored) {
    applyConsent(stored.granted);
  }

  /* Tag Google — jeden loader, config dla każdego identyfikatora */
  var loaderId = CONFIG.ga4 || CONFIG.googleAds;
  var script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(loaderId);
  document.head.appendChild(script);

  if (CONFIG.ga4) {
    gtag("config", CONFIG.ga4, { anonymize_ip: true });
  }
  if (CONFIG.googleAds) {
    gtag("config", CONFIG.googleAds);
  }

  window.springusTrack = function (name, params) {
    gtag("event", name, params || {});
    if (name === "generate_lead" && CONFIG.googleAds && CONFIG.adsLeadLabel) {
      gtag("event", "conversion", {
        send_to: CONFIG.googleAds + "/" + CONFIG.adsLeadLabel,
      });
    }
  };

  /* Baner zgód ---------------------------------------------------- */
  var banner = null;

  function toolsLabel() {
    var tools = [];
    if (CONFIG.ga4) tools.push("Google Analytics 4");
    if (CONFIG.googleAds) tools.push("Google Ads");
    return tools.join(" i ");
  }

  function removeBanner() {
    if (banner) {
      banner.remove();
      banner = null;
    }
  }

  function decide(granted) {
    writeConsent(granted);
    applyConsent(granted);
    removeBanner();
  }

  function openBanner() {
    if (banner) {
      return;
    }

    banner = document.createElement("div");
    banner.className = "consent";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Zgoda na pliki cookies");
    banner.innerHTML =
      '<div class="consent__inner">' +
      '<p class="consent__text">Używam narzędzi ' +
      toolsLabel() +
      ", żeby wiedzieć, które treści i kampanie przynoszą zapytania. " +
      "Zgoda jest dobrowolna i możesz ją wycofać w każdej chwili — szczegóły w " +
      '<a href="/polityka-prywatnosci/">polityce prywatności</a>.</p>' +
      '<div class="consent__actions">' +
      '<button type="button" class="btn btn--primary" data-consent-accept>Akceptuję</button>' +
      '<button type="button" class="btn btn--ghost" data-consent-reject>Tylko niezbędne</button>' +
      "</div></div>";

    banner.querySelector("[data-consent-accept]").addEventListener("click", function () {
      decide(true);
    });
    banner.querySelector("[data-consent-reject]").addEventListener("click", function () {
      decide(false);
    });

    document.body.appendChild(banner);
  }

  if (!stored) {
    if (document.body) {
      openBanner();
    } else {
      document.addEventListener("DOMContentLoaded", openBanner);
    }
  }

  settingsLinks.forEach(function (el) {
    el.addEventListener("click", function (event) {
      event.preventDefault();
      openBanner();
    });
  });
})();
