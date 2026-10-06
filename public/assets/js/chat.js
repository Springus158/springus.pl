/* springus.pl — asystent AI w hero strony głównej */
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
  var newBtn = root.querySelector("[data-hero-new]");

  var STORAGE_KEY = "springus-chat-history";
  var MAX_SENT = 12;
  var MAX_CHARS = 500;

  var history = loadHistory();
  var busy = false;

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

  function addBubble(role, text) {
    var bubble = document.createElement("div");
    bubble.className = "hero-chat__bubble hero-chat__bubble--" + role;
    bubble.textContent = text;
    logEl.appendChild(bubble);
    scrollToEnd();
    return bubble;
  }

  function setConversing(conversing) {
    root.classList.toggle("is-conversing", conversing);
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
    typing.className = "hero-chat__bubble hero-chat__bubble--bot hero-chat__typing";
    typing.setAttribute("aria-label", "Asystent pisze");
    typing.innerHTML =
      '<span class="hero-chat__dot"></span><span class="hero-chat__dot"></span><span class="hero-chat__dot"></span>';
    logEl.appendChild(typing);
    scrollToEnd();
    return typing;
  }

  function setBusy(state) {
    busy = state;
    if (input) {
      input.disabled = state;
    }
    if (sendBtn) {
      sendBtn.disabled = state;
    }
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

  if (newBtn) {
    newBtn.addEventListener("click", reset);
  }

  root.querySelectorAll("[data-hero-suggestion]").forEach(function (button) {
    button.addEventListener("click", function () {
      send(button.getAttribute("data-hero-suggestion"));
    });
  });

  render();
})();
