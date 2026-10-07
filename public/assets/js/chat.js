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

  function addBubble(role, text) {
    var bubble = document.createElement("div");
    bubble.className = "bubble bubble--" + role;
    if (role === "bot") {
      bubble.innerHTML = formatBotText(text);
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

  function send(text) {
    var content = String(text || "").trim().slice(0, MAX_CHARS);
    if (!content || busy || !logEl) {
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
            : "Nie udało się pobrać odpowiedzi. Napisz proszę na springusbiznes10@gmail.com.";
        addBubble("bot", reply);
        history.push({ role: "assistant", content: reply });
        saveHistory();
      })
      .catch(function () {
        typing.remove();
        addBubble(
          "bot",
          "Brak połączenia z asystentem. Spróbuj ponownie za chwilę albo napisz na springusbiznes10@gmail.com."
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
