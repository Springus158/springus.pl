/* springus.pl — skrypty strony */
(function () {
  "use strict";

  var track = window.springusTrack || function () {};

  /* Zdarzenia kontaktowe (telefon, e-mail) ----------------------- */
  document.addEventListener("click", function (event) {
    var target = event.target;
    var link = target && target.closest ? target.closest("a[href]") : null;
    if (!link) {
      return;
    }
    var href = link.getAttribute("href") || "";
    if (href.indexOf("tel:") === 0) {
      track("tel_click", { link_url: href });
    } else if (href.indexOf("mailto:") === 0) {
      track("email_click", { link_url: href });
    }
  });

  /* Rok w stopce ------------------------------------------------ */
  var yearEls = document.querySelectorAll("[data-year]");
  var year = String(new Date().getFullYear());
  yearEls.forEach(function (el) {
    el.textContent = year;
  });

  /* Menu mobilne ------------------------------------------------- */
  var header = document.querySelector("[data-header]");
  var navToggle = document.querySelector("[data-nav-toggle]");

  if (header && navToggle) {
    var closeNav = function () {
      header.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Otwórz menu");
    };

    navToggle.addEventListener("click", function () {
      var isOpen = header.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      navToggle.setAttribute("aria-label", isOpen ? "Zamknij menu" : "Otwórz menu");
    });

    header.querySelectorAll(".site-nav a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeNav();
      }
    });
  }

  /* Cień nagłówka przy przewijaniu ------------------------------- */
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Formularz kontaktowy ----------------------------------------- */
  var form = document.querySelector("[data-contact-form]");

  if (form) {
    var statusEl = form.querySelector("[data-form-status]");
    var submitBtn = form.querySelector('button[type="submit"]');

    var setStatus = function (message, state) {
      if (!statusEl) {
        return;
      }
      statusEl.textContent = message;
      statusEl.classList.remove("is-success", "is-error");
      if (state) {
        statusEl.classList.add(state);
      }
    };

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!form.reportValidity()) {
        return;
      }

      var val = function (name) {
        var field = form.elements.namedItem(name);
        return field ? String(field.value || "").trim() : "";
      };

      var payload = {
        name: val("name"),
        email: val("email"),
        phone: val("phone"),
        service: val("service"),
        message: val("message"),
        company: val("company"),
        consent: form.elements.namedItem("consent").checked ? "yes" : "",
      };

      if (submitBtn) {
        submitBtn.disabled = true;
      }
      setStatus("Wysyłam wiadomość…", null);

      fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      })
        .then(function (response) {
          return response
            .json()
            .catch(function () {
              return {};
            })
            .then(function (data) {
              return { ok: response.ok, data: data };
            });
        })
        .then(function (result) {
          if (result.ok) {
            form.reset();
            track("generate_lead", { form: "contact", service: payload.service });
            setStatus(
              "Dziękuję! Wiadomość wysłana — odpowiem w ciągu 24 h w dni robocze.",
              "is-success"
            );
          } else {
            setStatus(
              result.data.error ||
                "Nie udało się wysłać wiadomości. Spróbuj ponownie lub napisz na kontakt@springus.pl.",
              "is-error"
            );
          }
        })
        .catch(function () {
          setStatus(
            "Brak połączenia. Spróbuj ponownie lub napisz na kontakt@springus.pl.",
            "is-error"
          );
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
          }
        });
    });
  }
})();
