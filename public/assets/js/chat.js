/* springus.pl — asystent AI na stronie głównej */
(function () {
  "use strict";

  var root = document.querySelector("[data-hero-chat]");
  if (!root) {
    return;
  }

  var logEl = root.querySelector("[data-hero-log]");
  var form = root.querySelector("[data-hero-form]");
  var input = root.querySelector("[data-hero-input]");
  var sendBtn = root.querySelector("[data-hero-send]");
  var newBtn = document.querySelector("[data-hero-new]");

  var STORAGE_KEY = "springus-chat-history";
  var MAX_SENT = 12;
  var MAX_CHARS = 500;

  var history = loadHistory();
  var busy = false;
  var started = false;

  function loadHistory() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveHistory() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-40)));
    } catch {
      /* brak sessionStorage — działamy dalej bez zapisu */
    }
  }

  function scrollToEnd() {
    if (logEl) {
      logEl.scrollTop = logEl.scrollHeight;
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatInline(text) {
    return text
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/__([^_]+)__/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener">$1</a>'
      )
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/(^|[\s(])((?:https?:\/\/|mailto:)[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
  }

  function formatBotText(text) {
    var lines = escapeHtml(text).split(/\r?\n/);
    var html = "";
    var inList = false;

    function closeList() {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
    }

    lines.forEach(function (line) {
      var trimmed = line.trim();
      var isItem = /^([-*•]|\d+[.)])\s+/.test(trimmed);

      if (isItem) {
        if (!inList) {
          html += "<ul>";
          inList = true;
        }
        html += "<li>" + formatInline(trimmed.replace(/^([-*•]|\d+[.)])\s+/, "")) + "</li>";
        return;
      }

      closeList();
      if (trimmed.length > 0) {
        html += "<p>" + formatInline(trimmed) + "</p>";
      }
    });

    closeList();
    return html;
  }

  var PORTFOLIO = {
    orzechowo: {
      img: "assets/img/portfolio/orzechowo.webp",
      title: "Orzechowo.pl — sklep z bakaliami",
      desc: "Demo sklepu online: katalog z filtrami, koszyk, checkout i blog.",
      href: "https://orzechowo-demo.kacpermroszczyk10.workers.dev/",
    },
  };

  function portfolioCard(slug) {
    var item = PORTFOLIO[slug];
    if (!item) {
      return "";
    }
    return (
      '<figure class="chat-card">' +
      '<a href="' + item.href + '" target="_blank" rel="noopener">' +
      '<img src="' + item.img + '" alt="' + item.title + '" width="1200" height="860" loading="lazy">' +
      "</a>" +
      '<figcaption class="chat-card__body">' +
      '<a class="chat-card__title" href="' + item.href + '" target="_blank" rel="noopener">' + item.title + "</a>" +
      '<p class="chat-card__desc">' + item.desc + "</p>" +
      '<a class="chat-card__link" href="' + item.href + '" target="_blank" rel="noopener">Zobacz demo ↗</a>' +
      "</figcaption></figure>"
    );
  }

  function withPortfolioCards(html) {
    return html
      .replace(/<p>\[\[portfolio:([a-z-]+)\]\]<\/p>/g, function (match, slug) {
        return portfolioCard(slug);
      })
      .replace(/\[\[portfolio:([a-z-]+)\]\]/g, function (match, slug) {
        return portfolioCard(slug);
      });
  }

  function addBubble(role, text) {
    var bubble = document.createElement("div");
    bubble.className = "bubble bubble--" + role;
    if (role === "bot") {
      bubble.innerHTML = withPortfolioCards(formatBotText(text));
    } else {
      bubble.textContent = text;
    }
    logEl.appendChild(bubble);
    scrollToEnd();
    return bubble;
  }

  function setConversing(conversing) {
    document.body.classList.toggle("chatting", conversing);
    if (newBtn) {
      newBtn.hidden = !conversing;
    }
  }

  function render() {
    if (!logEl) {
      return;
    }
    logEl.textContent = "";
    history.forEach(function (message) {
      addBubble(message.role === "user" ? "user" : "bot", message.content);
    });
    setConversing(history.length > 0);
  }

  function showTyping() {
    var typing = document.createElement("div");
    typing.className = "bubble bubble--bot typing";
    typing.setAttribute("aria-label", "Konsultant pisze");
    typing.innerHTML =
      '<span class="typing__dot"></span><span class="typing__dot"></span><span class="typing__dot"></span>';
    logEl.appendChild(typing);
    scrollToEnd();
    return typing;
  }

  function syncSendState() {
    if (sendBtn && input) {
      sendBtn.disabled = busy || input.value.trim().length === 0;
    }
  }

  function setBusy(state) {
    busy = state;
    if (input) {
      input.disabled = state;
    }
    syncSendState();
  }

  function localThemeCommand(text) {
    var value = String(text || "").toLowerCase();
    if (/(zgaś|zgas|wyłącz|wylacz)\s+(światło|swiatlo)|tryb\s+nocny|ciemny\s+tryb/.test(value)) {
      return "dark";
    }
    if (/(zapal|włącz|wlacz)\s+(światło|swiatlo)|tryb\s+dzienny|jasny\s+tryb/.test(value)) {
      return "light";
    }
    return null;
  }

  function send(text) {
    var content = String(text || "").trim().slice(0, MAX_CHARS);
    if (!content || busy || !logEl) {
      return;
    }

    var themeCommand = localThemeCommand(content);
    if (themeCommand && window.springusTheme) {
      if (input) {
        input.value = "";
      }
      setConversing(true);
      addBubble("user", content);
      history.push({ role: "user", content: content });
      window.springusTheme.set(themeCommand);
      var themeReply =
        themeCommand === "dark"
          ? "Zgaszone — oczy odpoczną. Wróć do mnie, gdy najdzie Cię ochota."
          : "Zapalone. Wracamy do światła.";
      addBubble("bot", themeReply);
      history.push({ role: "assistant", content: themeReply });
      saveHistory();
      syncSendState();
      return;
    }

    setBusy(true);
    if (input) {
      input.value = "";
    }

    setConversing(true);
    if (!started) {
      started = true;
      var track = window.springusTrack || function () {};
      track("chat_started");
    }
    addBubble("user", content);
    history.push({ role: "user", content: content });
    saveHistory();

    var typing = showTyping();

    fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ messages: history.slice(-MAX_SENT) }),
    })
      .then(function (response) {
        return response.json().catch(function () {
          return {};
        });
      })
      .then(function (data) {
        typing.remove();
        var reply =
          data && data.reply
            ? data.reply
            : "Nie udało się pobrać odpowiedzi. Napisz proszę na kontakt@springus.pl.";
        addBubble("bot", reply);
        history.push({ role: "assistant", content: reply });
        saveHistory();
      })
      .catch(function () {
        typing.remove();
        addBubble(
          "bot",
          "Brak połączenia z asystentem. Spróbuj ponownie za chwilę albo napisz na kontakt@springus.pl."
        );
      })
      .finally(function () {
        setBusy(false);
        if (input) {
          input.focus({ preventScroll: true });
        }
      });
  }

  function reset() {
    history = [];
    saveHistory();
    render();
    if (input) {
      input.focus({ preventScroll: true });
    }
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      send(input ? input.value : "");
    });
  }

  if (input) {
    input.addEventListener("input", syncSendState);
  }

  if (newBtn) {
    newBtn.addEventListener("click", reset);
  }

  root.querySelectorAll("[data-hero-suggestion]").forEach(function (button) {
    button.addEventListener("click", function () {
      send(button.getAttribute("data-hero-suggestion"));
    });
  });

  render();
  syncSendState();
})();
