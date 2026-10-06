/* springus.pl — skrypty bazowe */
(function () {
  "use strict";

  var yearEls = document.querySelectorAll("[data-year]");
  var year = String(new Date().getFullYear());
  yearEls.forEach(function (el) {
    el.textContent = year;
  });
})();
