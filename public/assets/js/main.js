/* springus.pl — skrypty strony */
(function () {
  "use strict";

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
})();
