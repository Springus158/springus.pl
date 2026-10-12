/* springus.pl — skrypty strony */
(function () {
  "use strict";

  var track = window.springusTrack || function () {};

  document.documentElement.classList.add("has-js");

  /* Animacje przy przewijaniu ------------------------------------ */
  var revealTargets = document.querySelectorAll(
    ".section-head, .services-grid, .steps, .pricing-grid, .pricing-extras, .faq, .contact-grid"
  );

  if (revealTargets.length > 0 && "IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );

    revealTargets.forEach(function (el) {
      el.setAttribute("data-reveal", "");
      revealObserver.observe(el);
    });
  }

  /* Karty portfolio na wysokość czatu + wyrównanie slidera */
  var chatCard = document.querySelector(".stage-chat");
  var pfCardsAll = document.querySelectorAll(".stage-portfolio .portfolio-card");
  var pfSlider = document.querySelector(".stage-portfolio .pf-slider");
  var stageWrap = document.querySelector(".stage-wrap");

  if (stageWrap && pfCardsAll.length > 1) {
    stageWrap.classList.add("stage-wrap--tall");
  }

  if (chatCard && pfCardsAll.length > 0) {
    var syncCards = function () {
      if (window.matchMedia("(min-width: 901px)").matches) {
        pfCardsAll.forEach(function (card) {
          card.style.height = chatCard.offsetHeight + "px";
        });
        if (pfSlider) {
          pfSlider.style.setProperty("--pf-shift", "0px");
          var chatRect = chatCard.getBoundingClientRect();
          var sliderRect = pfSlider.getBoundingClientRect();
          var delta = Math.round(chatRect.bottom - sliderRect.bottom);
          pfSlider.style.setProperty("--pf-shift", delta + "px");
        }
      } else {
        pfCardsAll.forEach(function (card) {
          card.style.height = "";
        });
        if (pfSlider) {
          pfSlider.style.removeProperty("--pf-shift");
        }
      }
    };

    syncCards();

    if (typeof ResizeObserver === "function") {
      new ResizeObserver(syncCards).observe(chatCard);
    } else {
      window.addEventListener("resize", syncCards);
    }
    window.addEventListener("load", syncCards);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(syncCards);
    }
  }

  /* Strzałki portfolio ------------------------------------------- */
  var pfTrack = document.querySelector("[data-pf-track]");
  var pfPrev = document.querySelector("[data-pf-prev]");
  var pfNext = document.querySelector("[data-pf-next]");

  if (pfTrack && pfPrev && pfNext) {
    var updateArrows = function () {
      var max = pfTrack.scrollWidth - pfTrack.clientWidth;
      var single = max < 10;
      pfPrev.hidden = single;
      pfNext.hidden = single;
      if (!single) {
        pfPrev.disabled = pfTrack.scrollLeft <= 2;
        pfNext.disabled = pfTrack.scrollLeft >= max - 2;
      }
    };

    var slide = function (dir) {
      pfTrack.scrollBy({ left: dir * pfTrack.clientWidth, behavior: "smooth" });
    };

    pfPrev.addEventListener("click", function () {
      slide(-1);
    });
    pfNext.addEventListener("click", function () {
      slide(1);
    });
    pfTrack.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    if (typeof ResizeObserver === "function") {
      new ResizeObserver(updateArrows).observe(pfTrack);
    }

    updateArrows();
  }

  /* Źródło zapytania (UTM / referrer) ---------------------------- */
  var SOURCE_KEY = "springus-source";
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

  function loadSource() {
    try {
      var raw = sessionStorage.getItem(SOURCE_KEY);
      return raw ? JSON.parse(raw) || {} : {};
    } catch (error) {
      return {};
    }
  }

  function saveSource(source) {
    try {
      sessionStorage.setItem(SOURCE_KEY, JSON.stringify(source));
    } catch (error) {
      /* brak sessionStorage — trudno, źródło nie zostanie zapamiętane */
    }
  }

  (function captureSource() {
    var source = loadSource();
    var params = new URLSearchParams(window.location.search);

    UTM_KEYS.forEach(function (key) {
      var value = params.get(key);
      if (value) {
        source[key] = value.slice(0, 120);
      }
    });

    if (!source.landing) {
      source.landing = window.location.pathname;
    }
    if (!source.referrer && document.referrer) {
      source.referrer = document.referrer.slice(0, 300);
    }

    saveSource(source);
  })();

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

      var source = loadSource();
      payload.page = String(source.landing || window.location.pathname).slice(0, 300);
      payload.referrer = String(source.referrer || "").slice(0, 300);
      UTM_KEYS.forEach(function (key) {
        if (source[key]) {
          payload[key] = String(source[key]).slice(0, 120);
        }
      });

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
