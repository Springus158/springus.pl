/* springus.pl — motyw jasny/ciemny + wisząca lampka ze sznurkiem */
(function () {
  "use strict";

  var KEY = "springus-theme";
  var root = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');

  function stored() {
    try {
      return localStorage.getItem(KEY);
    } catch (error) {
      return null;
    }
  }

  function store(value) {
    try {
      localStorage.setItem(KEY, value);
    } catch (error) {
      /* brak localStorage — trudno */
    }
  }

  function system() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function current() {
    return root.dataset.theme === "dark" ? "dark" : "light";
  }

  function paintMeta() {
    if (meta) {
      meta.setAttribute("content", current() === "dark" ? "#1d1915" : "#faf6ef");
    }
  }

  function syncButtons() {
    var dark = current() === "dark";
    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      button.classList.toggle("is-dark", dark);
      button.setAttribute("aria-pressed", dark ? "true" : "false");
      button.setAttribute("aria-label", dark ? "Włącz tryb dzienny" : "Włącz tryb nocny");
    });
  }

  function apply(next, originX, originY) {
    var reduced =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var swap = function () {
      root.dataset.theme = next;
      store(next);
      paintMeta();
      syncButtons();
    };

    if (!reduced && typeof document.startViewTransition === "function") {
      root.style.setProperty("--vt-x", (originX || window.innerWidth) + "px");
      root.style.setProperty("--vt-y", (originY || 0) + "px");
      document.startViewTransition(swap);
    } else {
      swap();
    }
  }

  window.springusTheme = {
    get: current,
    set: function (next) {
      apply(next === "dark" ? "dark" : "light");
    },
    toggle: function (originEl) {
      var x = null;
      var y = null;
      if (originEl && originEl.getBoundingClientRect) {
        var rect = originEl.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height * 0.35;
      }
      apply(current() === "dark" ? "light" : "dark", x, y);
    },
  };

  /* Motyw od razu — przed pierwszym renderem */
  root.dataset.theme = stored() === "dark" || stored() === "light" ? stored() : system();

  /* Lampka: sznurek się rozciąga (bez urywania) ----------------------------- */

  var MAX_PULL = 66;
  var THRESHOLD = 18;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function wireLamps() {
    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      if (button.dataset.lampReady === "1") {
        return;
      }
      button.dataset.lampReady = "1";

      var string = button.querySelector("[data-lamp-string]");
      var knob = button.querySelector("[data-lamp-knob]");
      if (!string || !knob) {
        return;
      }

      var baseY2 = parseFloat(string.getAttribute("y2"));
      var baseCy = parseFloat(knob.getAttribute("cy"));
      var raf = null;
      var dragging = false;
      var moved = false;
      var startY = 0;
      var pull = 0;
      var setPull = function (value) {
        var v = Math.max(0, Math.min(MAX_PULL, value));
        string.setAttribute("y2", String(baseY2 + v));
        knob.setAttribute("cy", String(baseCy + v));
      };

      var stopAnim = function () {
        if (raf) {
          cancelAnimationFrame(raf);
          raf = null;
        }
      };

      var animateTo = function (from, to, duration, done) {
        stopAnim();
        var start = performance.now();
        var frame = function (now) {
          var t = Math.min(1, (now - start) / duration);
          var eased = easeOutCubic(t);
          setPull(from + (to - from) * eased);
          if (t < 1) {
            raf = requestAnimationFrame(frame);
          } else {
            raf = null;
            if (done) {
              done();
            }
          }
        };
        raf = requestAnimationFrame(frame);
      };

      var release = function () {
        button.classList.remove("is-pulling");
        button.classList.add("is-snapping");
        window.setTimeout(function () {
          button.classList.remove("is-snapping");
        }, 600);
        animateTo(pull, 0, 520);
      };

      button.addEventListener("pointerdown", function (event) {
        if (event.pointerType === "mouse" && event.button !== 0) {
          return;
        }
        stopAnim();
        dragging = true;
        moved = false;
        pull = 0;
        startY = event.clientY;
        button.classList.add("is-pulling");
        if (button.setPointerCapture) {
          button.setPointerCapture(event.pointerId);
        }
        event.preventDefault();
      });

      button.addEventListener("pointermove", function (event) {
        if (!dragging) {
          return;
        }
        pull = Math.max(0, Math.min(MAX_PULL, event.clientY - startY));
        if (pull > 3) {
          moved = true;
        }
        setPull(pull);
      });

      var finish = function () {
        if (!dragging) {
          return;
        }
        dragging = false;
        if (moved) {
          if (pull >= THRESHOLD) {
            window.springusTheme.toggle(button);
          }
          release();
        } else {
          button.classList.remove("is-pulling");
          setPull(0);
        }
        pull = 0;
      };

      button.addEventListener("pointerup", finish);
      button.addEventListener("pointercancel", finish);

      button.addEventListener("click", function (event) {
        if (moved) {
          moved = false;
          event.preventDefault();
          return;
        }
        /* Klik / klawiatura: szybkie szarpnięcie + przełączenie */
        button.classList.add("is-snapping");
        window.setTimeout(function () {
          button.classList.remove("is-snapping");
        }, 600);
        animateTo(0, 26, 140, function () {
          animateTo(26, 0, 420);
        });
        window.springusTheme.toggle(button);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    paintMeta();
    syncButtons();
    wireLamps();
  });

  if (document.readyState !== "loading") {
    paintMeta();
    syncButtons();
    wireLamps();
  }
})();
