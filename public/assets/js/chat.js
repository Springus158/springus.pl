/* springus.pl — widget czatu (asystent AI) */
(function () {
  "use strict";

  var root = document.querySelector("[data-chat]");
  if (!root) {
    return;
  }

  var toggle = root.querySelector("[data-chat-toggle]");
  var panel = root.querySelector("[data-chat-panel]");
  var closeBtn = root.querySelector("[data-chat-close]");
  var messagesEl = root.querySelector("[data-chat-messages]");
  var form = root.querySelector("[data-chat-form]");
  var input = root.querySelector("[data-chat-input]");
  var quick = root.querySelector("[data-chat-quick]");

  var STORAGE_KEY = "springus-chat-history";
  var MAX_SENT = 12;
  var MAX_CHARS = 500;

  var GREETING =
    "Cześć! Tu asystent Springus. Opisz krótko, czego potrzebujesz — odpowiem od razu. W sprawach pilnych napisz na springusbiznes10@gmail.com.";

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

  function addBubble(role, text) {
    var bubble = document.createElement("div");
    bubble.className = "chat-bubble chat-bubble--" + role;
    bubble.textContent = text;
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  function renderHistory() {
    messagesEl.textContent = "";
    if (history.length === 0) {
      addBubble("bot", GREETING);
      return;
    }
    history.forEach(function (message) {
      addBubble(message.role === "user" ? "user" : "bot", message.content);
    });
  }

  function setOpen(open) {
    root.classList.toggle("is-open", open);
    if (toggle) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }
    if (open) {
      renderHistory();
      if (input) {
        input.focus();
      }
    }
  }

  function showTyping() {
    var typing = document.createElement("div");
    typing.className = "chat-bubble chat-bubble--bot chat-typing";
    typing.setAttribute("aria-label", "Asystent pisze");
    typing.innerHTML =
      '<span class="chat-typing-dot"></span><span class="chat-typing-dot"></span><span class="chat-typing-dot"></span>';
    messagesEl.appendChild(typing);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return typing;
  }

  function send(text) {
    var content = String(text || "").trim().slice(0, MAX_CHARS);
    if (!content || busy) {
      return;
    }

    busy = true;
    if (input) {
      input.value = "";
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
        var reply =
          "Brak połączenia z asystentem. Spróbuj ponownie za chwilę albo napisz na springusbiznes10@gmail.com.";
        addBubble("bot", reply);
      })
      .finally(function () {
        busy = false;
      });
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      setOpen(!root.classList.contains("is-open"));
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      setOpen(false);
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && root.classList.contains("is-open")) {
      setOpen(false);
    }
  });

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      send(input ? input.value : "");
    });
  }

  if (quick) {
    quick.querySelectorAll("[data-chat-suggestion]").forEach(function (button) {
      button.addEventListener("click", function () {
        send(button.getAttribute("data-chat-suggestion"));
      });
    });
  }

  renderHistory();
})();
