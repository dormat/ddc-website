(function () {
  var root = document.getElementById("lt22-assistant");
  if (!root) return;

  var start = document.getElementById("lt22-start");
  var chat = document.getElementById("lt22-chat");
  var log = document.getElementById("lt22-log");
  var suggestions = document.getElementById("lt22-suggestions");
  var composer = document.getElementById("lt22-composer");
  var input = document.getElementById("lt22-input");
  var sendButton = composer.querySelector(".lt22-send");
  var restartInline = document.getElementById("lt22-restart-inline");
  var closeButton = document.getElementById("lt22-close");
  var fileInput = document.getElementById("lt22-photo");
  var photoButton = document.getElementById("lt22-photo-button");
  var photoName = document.getElementById("lt22-photo-name");
  var errorBox = document.getElementById("lt22-error");
  var authGate = document.getElementById("lt22-auth");
  var authSigned = document.getElementById("lt22-auth-signed");
  var authAccount = document.getElementById("lt22-auth-account");
  var googleSignInButton = document.getElementById("lt22-google-signin");
  var googleSignOutButton = document.getElementById("lt22-google-signout");
  var startButton = document.getElementById("lt22-start-button");
  var session = null;
  var visitor = { name: "", phone: "", email: "", device: null };
  var pendingPhoto = null;
  var sending = false;
  var pendingAsk = null;
  var topicsOpened = false;
  var intakeDoneOnce = false;
  var authUser = null;
  var authReady = false;

  var devices = {
    lt22: {
      id: "lt22",
      label: "LT22",
      subtitle: "מונה אנרגיה ELNet",
      icon: "📟",
      facts: [
        ["סוג", "מונה אנרגיה"],
        ["ממשק", "מסך ומקשים"],
        ["תקשורת", "ModBus / BACnet"],
      ],
    },
    mc8: {
      id: "mc8",
      label: "MC8",
      subtitle: "שמונה מדי אנרגיה תלת-פאזיים",
      icon: "📟",
      facts: [
        ["סוג", "8 מוני אנרגיה"],
        ["ממשק", "מסך צבע ומקשים"],
        ["תקשורת", "RS-485 / Ethernet"],
      ],
    },
    pfc: {
      id: "pfc",
      label: "PFC",
      subtitle: "בקר מקדם הספק",
      icon: "⚡",
      facts: [
        ["סוג", "בקר מקדם הספק"],
        ["דרגות", "עד 6 קבלים"],
        ["ממשק", "מסך צבע ומקשים"],
      ],
    },
    pfc10: {
      id: "pfc10",
      label: "PFC10",
      subtitle: "בקר מקדם הספק ומד אנרגיה",
      icon: "⚡",
      facts: [
        ["סוג", "בקר + מד אנרגיה"],
        ["דרגות", "עד 10 קבלים"],
        ["ממשק", "מסך צבע ומקשים"],
      ],
    },
    OTHER: {
      id: "OTHER",
      label: "אחר",
      subtitle: "מכשיר שלא ברשימה",
      icon: "❔",
      facts: [],
    },
  };

  var supportedDeviceIds = ["lt22", "mc8", "pfc", "pfc10"];

  var topicChips = [
    { label: "המכשיר לא נדלק", icon: "🔋", value: "המסך של המכשיר לא נדלק או כבה. מה אפשר לבדוק?" },
    { label: "קריאה שגויה / אין קריאה", icon: "📟", value: "הקריאות על המסך נראות שגויות או שאין קריאה. מה אפשר לבדוק?" },
    { label: "מדידת זרם לא עובדת", icon: "⚡", value: "מדידת הזרם לא עובדת או לא בקנה מידה. איך בודקים ומגדירים משנה זרם?" },
    { label: "מסכים ותפריטים", icon: "📊", value: "מה מוצג במסכים העיקריים ומה עושים המקשים?" },
    { label: "כניסה להגדרות", icon: "⚙️", value: "איך נכנסים להגדרות המערכת?" },
    { label: "תקשורת", icon: "🔗", value: "איך מפעילים או בודקים תקשורת במכשיר?" },
    { label: "בדיקת מעבדה", icon: "🧪", value: "__lab__" },
    { label: "קריאת שירות", icon: "🛠️", value: "__lab__" },
    { label: "תמונת מסך", icon: "🖼️", value: "__photo__" },
    { label: "אחריות ושירות", icon: "🛡️", value: "__service__" },
    { label: "אחר", icon: "💬", value: "__other__" },
    { label: "סיימתי, תודה", icon: "✅", value: "__done__" },
  ];

  var LAB_PDF = "/assets/forms/lab-intake-he.pdf";
  var SERVICE_HELP = "service@ddc.co.il או 03-6474998 שלוחת שירות";
  var OTHER_PRODUCT = "אחר";
  var COUNTRY_OPTIONS = [
    { value: "ישראל", label: "ישראל" },
    { value: "ארצות הברית", label: "ארצות הברית" },
    { value: "קנדה", label: "קנדה" },
    { value: "בריטניה", label: "בריטניה" },
    { value: "גרמניה", label: "גרמניה" },
    { value: "צרפת", label: "צרפת" },
    { value: "איטליה", label: "איטליה" },
    { value: "ספרד", label: "ספרד" },
    { value: "הולנד", label: "הולנד" },
    { value: "בלגיה", label: "בלגיה" },
    { value: "שוויץ", label: "שוויץ" },
    { value: "אוסטריה", label: "אוסטריה" },
    { value: "יוון", label: "יוון" },
    { value: "קפריסין", label: "קפריסין" },
    { value: "טורקיה", label: "טורקיה" },
    { value: "מצרים", label: "מצרים" },
    { value: "ירדן", label: "ירדן" },
    { value: "איחוד האמירויות", label: "איחוד האמירויות" },
    { value: "ערב הסעודית", label: "ערב הסעודית" },
    { value: "הודו", label: "הודו" },
    { value: "סין", label: "סין" },
    { value: "יפן", label: "יפן" },
    { value: "אוסטרליה", label: "אוסטרליה" },
    { value: "ברזיל", label: "ברזיל" },
    { value: "אחר", label: "אחר" },
  ];

  function productCatalog() {
    var data = window.LT22_ASSISTANT_PRODUCTS || {};
    return {
      categories: Array.isArray(data.categories) ? data.categories : [],
      otherLabel: data.otherLabel || OTHER_PRODUCT,
    };
  }

  function setFullscreen(active) {
    var on = Boolean(active);
    root.classList.toggle("is-active", on);
    document.body.classList.toggle("lt22-assistant-open", on);
    if (closeButton) closeButton.hidden = !on;
  }

  function closeAssistant() {
    pendingAsk = null;
    sending = false;
    setFullscreen(false);
    chat.hidden = true;
    start.hidden = false;
    log.innerHTML = "";
    clearChips();
    showError("");
    composer.hidden = false;
    setComposer(false, "בחרו אפשרות למעלה", false);
    session = null;
    topicsOpened = false;
    intakeDoneOnce = false;
    pendingPhoto = null;
    if (fileInput) fileInput.value = "";
    if (photoName) photoName.hidden = true;
  }

  function apiBase() {
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
      return "http://127.0.0.1:8081";
    }
    return "";
  }

  function showError(message) {
    errorBox.hidden = !message;
    errorBox.textContent = message || "";
  }

  function firebaseAuth() {
    if (typeof firebase === "undefined" || !window.LT22_FIREBASE_CONFIG) return null;
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(window.LT22_FIREBASE_CONFIG);
      }
      return firebase.auth();
    } catch (err) {
      return null;
    }
  }

  async function getIdToken(forceRefresh) {
    var auth = firebaseAuth();
    if (!auth || !auth.currentUser) return "";
    try {
      return await auth.currentUser.getIdToken(!!forceRefresh);
    } catch (err) {
      return "";
    }
  }

  async function authHeaders(extra) {
    var headers = Object.assign({ "Content-Type": "application/json" }, extra || {});
    var token = await getIdToken(false);
    if (!token) token = await getIdToken(true);
    if (token) headers.Authorization = "Bearer " + token;
    return headers;
  }

  function applyGoogleProfile(user) {
    if (!user) return;
    var display = String(user.displayName || "").trim();
    var email = String(user.email || "").trim().toLowerCase();
    if (display && (!visitor.name || visitor.name === "מבקר/ת")) {
      visitor.name = display.replace(/\s+/g, " ").slice(0, 80);
    }
    if (email && validEmail(email)) {
      visitor.email = email;
    }
  }

  function renderAuthUi() {
    if (!authGate || !authSigned || !startButton) return;
    if (authUser) {
      authGate.hidden = true;
      authSigned.hidden = false;
      if (authAccount) {
        var label = authUser.email || authUser.displayName || "חשבון Google";
        authAccount.textContent = "מחוברים כ־" + label;
      }
      startButton.disabled = false;
    } else {
      authGate.hidden = false;
      authSigned.hidden = true;
      if (authAccount) authAccount.textContent = "";
      startButton.disabled = true;
    }
  }

  async function signInWithGoogle() {
    var auth = firebaseAuth();
    if (!auth) {
      showError("התחברות Google לא זמינה כרגע. רעננו את העמוד ונסו שוב.");
      return;
    }
    showError("");
    if (googleSignInButton) googleSignInButton.disabled = true;
    try {
      var provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      var result = await auth.signInWithPopup(provider);
      authUser = result.user || auth.currentUser;
      applyGoogleProfile(authUser);
      renderAuthUi();
    } catch (err) {
      var code = (err && err.code) || "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        showError("");
      } else if (code === "auth/unauthorized-domain") {
        showError("הדומיין לא מורשה להתחברות Google. פנו למנהל האתר.");
      } else if (code === "auth/operation-not-allowed") {
        showError("התחברות Google עדיין לא הופעלה בפרויקט. פנו למנהל האתר.");
      } else {
        showError("לא הצלחנו להתחבר עם Google. נסו שוב.");
      }
    } finally {
      if (googleSignInButton) googleSignInButton.disabled = false;
    }
  }

  async function signOutGoogle() {
    var auth = firebaseAuth();
    showError("");
    try {
      if (auth) await auth.signOut();
    } catch (err) {
      /* ignore */
    }
    authUser = null;
    session = null;
    renderAuthUi();
    if (!chat.hidden) {
      setFullscreen(false);
      chat.hidden = true;
      start.hidden = false;
      log.innerHTML = "";
      clearChips();
      composer.hidden = false;
      setComposer(false, "בחרו אפשרות למעלה", false);
    }
  }

  function watchAuth() {
    var auth = firebaseAuth();
    if (!auth) {
      authReady = true;
      renderAuthUi();
      showError("התחברות Google לא נטענה. רעננו את העמוד.");
      return;
    }
    auth.onAuthStateChanged(function (user) {
      authUser = user || null;
      authReady = true;
      if (authUser) applyGoogleProfile(authUser);
      renderAuthUi();
    });
  }

  function scrollLog() {
    window.requestAnimationFrame(function () {
      log.scrollTop = log.scrollHeight;
    });
  }

  function firstName(name) {
    return String(name || "").trim().split(/\s+/)[0] || "";
  }

  function sleep(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function appendInline(parent, text) {
    var pattern = /\*\*([^*]+)\*\*/g;
    var last = 0;
    var match;
    while ((match = pattern.exec(text))) {
      if (match.index > last) {
        parent.appendChild(document.createTextNode(text.slice(last, match.index)));
      }
      var strong = document.createElement("strong");
      strong.textContent = match[1];
      parent.appendChild(strong);
      last = match.index + match[0].length;
    }
    if (last < text.length) {
      parent.appendChild(document.createTextNode(text.slice(last)));
    }
  }

  function appendFormatted(parent, text) {
    var list = null;
    function finishList() {
      if (list) {
        parent.appendChild(list);
        list = null;
      }
    }
    String(text || "").split("\n").forEach(function (line) {
      var bullet = line.match(/^\s*(?:[-*]|\d+\.)\s+(.*)$/);
      if (bullet) {
        if (!list) {
          list = document.createElement("ul");
          list.className = "lt22-list";
        }
        var item = document.createElement("li");
        appendInline(item, bullet[1]);
        list.appendChild(item);
        return;
      }
      finishList();
      if (!line.trim()) return;
      var paragraph = document.createElement("p");
      appendInline(paragraph, line);
      parent.appendChild(paragraph);
    });
    finishList();
  }

  function figureLabel(figure) {
    var title = figure.title || "";
    if (figure.id) return title ? "איור " + figure.id + " – " + title : "איור " + figure.id;
    return title || "מסך מהמדריך";
  }

  function makeAvatar() {
    var avatar = document.createElement("div");
    avatar.className = "lt22-avatar lt22-avatar-sm";
    avatar.setAttribute("aria-hidden", "true");
    return avatar;
  }

  function clearChips() {
    suggestions.hidden = true;
    suggestions.innerHTML = "";
  }

  function setComposer(enabled, placeholder, allowPhoto) {
    composer.hidden = false;
    input.disabled = !enabled;
    sendButton.disabled = !enabled;
    composer.classList.toggle("is-disabled", !enabled);
    if (enabled) {
      input.placeholder = placeholder || "כתבו שאלה…";
    } else if (placeholder === "") {
      input.placeholder = "";
    } else {
      input.placeholder = placeholder || "בחרו אפשרות למעלה";
    }
    photoButton.hidden = !allowPhoto;
    if (!allowPhoto) {
      pendingPhoto = null;
      fileInput.value = "";
      photoName.hidden = true;
    }
    if (enabled) input.focus();
  }

  function showRestart() {
    setComposer(false, "בחרו אפשרות למעלה", false);
    composer.hidden = true;
    clearChips();
    var button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-submit lt22-restart";
    button.textContent = "התחלת שיחה חדשה";
    button.addEventListener("click", function () {
      if (sending) return;
      log.innerHTML = "";
      clearChips();
      composer.hidden = false;
      session = null;
      topicsOpened = false;
      runIntake();
    });
    suggestions.appendChild(button);
    suggestions.hidden = false;
    session = null;
    topicsOpened = false;
    scrollLog();
  }

  function hasVisitorName() {
    return Boolean(visitor.name && String(visitor.name).trim().length >= 2);
  }

  function hasVisitorDetails() {
    return Boolean(hasVisitorName() && visitor.phone && visitor.email && visitor.device);
  }

  async function startOver() {
    if (sending) return;
    Array.prototype.forEach.call(log.querySelectorAll(".lt22-form"), function (form) {
      var row = form.closest(".lt22-row");
      if (row) row.remove();
    });
    clearChips();
    showError("");
    session = null;
    topicsOpened = false;
    composer.hidden = false;
    setComposer(false, "בחרו אפשרות למעלה", false);
    // No preamble — runIntake shows a single intent message + chips.
    await runIntake({ restart: true });
  }

  async function ensureServiceDetails() {
    if (!hasVisitorName()) {
      await botSay("כדי שנוכל לשמור את הפנייה ולחזור אליכם אם צריך, מה שמכם המלא?");
      for (;;) {
        var name = (await askText("שם פרטי ושם משפחה")).trim().replace(/\s+/g, " ");
        if (name.length >= 2) {
          visitor.name = name;
          break;
        }
        await botSay("אשמח לשם מלא כדי להמשיך.");
      }
    }
    // Phone is collected on purchase / lab forms only — Google login already gives email.
    if (!visitor.email) {
      await botSay(
        (hasVisitorName() ? "נעים מאוד, " + firstName(visitor.name) + ". " : "") +
          "ומה כתובת הדואר האלקטרוני שלכם?",
      );
      for (;;) {
        var emailRaw = (await askText("name@example.com")).trim();
        if (validEmail(emailRaw)) {
          visitor.email = emailRaw.toLowerCase();
          break;
        }
        await botSay("נראה שהכתובת לא תקינה. אפשר כמו name@example.com.");
      }
    }
    if (!visitor.device) {
      await botSay("מצוין. על איזה מכשיר מדובר? בחרו מהרשימה.");
      var deviceOptions = supportedDeviceIds.concat(["OTHER"]).map(function (id) {
        return {
          label: devices[id].label,
          value: id,
          sub: devices[id].subtitle,
          icon: devices[id].icon,
        };
      });
      var picked = await askChips(deviceOptions, false, "בחרו אפשרות למעלה");
      visitor.device = devices[picked.value] || devices.OTHER;
      if (visitor.device.id !== "OTHER") {
        await botSay("זיהיתי את המכשיר:", deviceCard(visitor.device));
      }
    }
  }

  async function openSessionAndChat(greetTopics) {
    showError("");
    start.hidden = true;
    chat.hidden = false;
    setFullscreen(true);
    setComposer(false, "בחרו אפשרות למעלה", false);
    try {
      if (session && session.conversationId && session.token) {
        await syncSessionProfile();
      } else {
        session = await post("/api/assistant/session", {
          name: visitor.name,
          contact: visitor.phone,
          email: visitor.email || "",
          device: visitor.device.id,
        });
      }
    } catch (err) {
      await botSay(
        err.message ||
          "לא הצלחתי לפתוח שיחה עכשיו. נסו שוב בעוד רגע, או השאירו פרטים בטופס בהמשך העמוד.",
      );
      showRestart();
      return;
    }
    if (visitor.device.id === "OTHER") {
      await botSay(
        "כרגע השיחה כאן עוזרת עם LT22, MC8, PFC ו-PFC10. למכשיר אחר, מלאו את הטופס שבהמשך העמוד ונחזור אליכם.\nאם המכשיר שלכם ברשימה — בחרו אותו והמשיכו.",
      );
      setComposer(false, "בחרו אפשרות למעלה", false);
      clearChips();
      supportedDeviceIds.forEach(function (id, index) {
        var device = devices[id];
        suggestions.appendChild(
          makeChipButton(
            { label: device.label, icon: device.icon, value: id, sub: device.subtitle },
            index,
            function () {
              visitor.device = device;
              openSessionAndChat(true);
            },
          ),
        );
      });
      suggestions.appendChild(
        makeChipButton(
          { label: "סיימתי, תודה", icon: "✅", value: "__done__" },
          supportedDeviceIds.length,
          function () {
            handleSpecialChip({ label: "סיימתי, תודה", icon: "✅", value: "__done__" });
          },
        ),
      );
      suggestions.hidden = false;
      return;
    }
    await showTopicMenu(greetTopics !== false);
  }

  function addBubble(role, text, figures, card, opts) {
    opts = opts || {};
    var row = document.createElement("div");
    row.className = "lt22-row lt22-row-" + role;
    if (role === "assistant") row.appendChild(makeAvatar());
    var item = document.createElement("div");
    item.className = "lt22-bubble lt22-bubble-" + role;
    var body = document.createElement("div");
    body.className = "lt22-bubble-body";
    if (role === "assistant") appendFormatted(body, text);
    else {
      var paragraph = document.createElement("p");
      paragraph.textContent = text;
      body.appendChild(paragraph);
    }
    item.appendChild(body);
    if (card) item.appendChild(card);
    (figures || []).forEach(function (figure) {
      var frame = document.createElement("figure");
      frame.className = "lt22-figure";
      var image = document.createElement("img");
      var label = figureLabel(figure);
      image.src = figure.src;
      image.alt = label;
      var caption = document.createElement("figcaption");
      caption.textContent = label;
      frame.appendChild(image);
      frame.appendChild(caption);
      item.appendChild(frame);
    });
    row.appendChild(item);
    log.appendChild(row);
    scrollLog();
    if (opts.persist !== false) {
      var logText = String(text || "").trim();
      if (card && visitor.device && visitor.device.label) {
        logText = (logText ? logText + "\n" : "") + "[מכשיר: " + visitor.device.label + "]";
      }
      if (figures && figures.length) {
        logText =
          (logText ? logText + "\n" : "") +
          "[תמונות: " +
          figures
            .map(function (figure) {
              return figureLabel(figure);
            })
            .join(", ") +
          "]";
      }
      persistTranscript(role, logText, { kind: opts.kind || "ui" });
    }
    return item;
  }

  async function ensureTranscriptSession() {
    if (session && session.conversationId && session.token) return session;
    try {
      session = await post("/api/assistant/session", {
        provisional: true,
        name: visitor.name || "מבקר/ת",
        contact: visitor.phone || "",
        email: visitor.email || "",
        device: visitor.device && visitor.device.id ? visitor.device.id : "",
      });
    } catch (err) {
      session = null;
    }
    return session;
  }

  async function syncSessionProfile() {
    if (!session || !session.conversationId || !session.token) return;
    try {
      await post("/api/assistant/session/update", {
        conversationId: session.conversationId,
        token: session.token,
        name: visitor.name || "",
        contact: visitor.phone || "",
        email: visitor.email || "",
        device: visitor.device && visitor.device.id ? visitor.device.id : "",
      });
    } catch (err) {
      /* ignore profile sync failures */
    }
  }

  function persistTranscript(role, text, opts) {
    opts = opts || {};
    var cleaned = String(text || "").trim();
    if (!cleaned || !session || !session.conversationId || !session.token) return;
    post("/api/assistant/log", {
      conversationId: session.conversationId,
      token: session.token,
      messages: [{ role: role, text: cleaned.slice(0, 4000), kind: opts.kind || "ui" }],
    }).catch(function () {
      /* ignore transcript failures */
    });
  }

  function deviceCard(device) {
    var card = document.createElement("div");
    card.className = "lt22-card";
    var title = document.createElement("b");
    title.textContent = device.label;
    card.appendChild(title);
    device.facts.forEach(function (pair) {
      var row = document.createElement("div");
      var left = document.createElement("span");
      left.textContent = pair[0];
      var right = document.createElement("span");
      right.textContent = pair[1];
      row.appendChild(left);
      row.appendChild(right);
      card.appendChild(row);
    });
    return card;
  }

  function askChips(chips, freeText, placeholder) {
    return new Promise(function (resolve) {
      clearChips();
      setComposer(
        !!freeText,
        freeText
          ? placeholder || "או כתבו לי במילים שלכם…"
          : placeholder || "בחרו אפשרות למעלה",
        false,
      );
      function finish(choice) {
        clearChips();
        setComposer(false, "בחרו אפשרות למעלה", false);
        pendingAsk = null;
        if (choice.label) addBubble("user", choice.label, []);
        resolve(choice);
      }
      chips.forEach(function (chip, index) {
        suggestions.appendChild(
          makeChipButton(chip, index, function () {
            finish({ value: chip.value, label: chipLabel(chip) });
          }),
        );
      });
      suggestions.hidden = !chips.length;
      pendingAsk = freeText
        ? function (text) {
            finish({ value: text, label: text, typed: true });
          }
        : null;
    });
  }

  function askText(placeholder) {
    return askChips([], true, placeholder).then(function (choice) {
      return choice.label;
    });
  }

  var softFails = [
    "משהו השתבש לי עכשיו. נסו שוב בעוד רגע, ואם זה ממשיך — " + SERVICE_HELP + ".",
    "לא הצלחתי לענות על זה כרגע. נסו לשלוח שוב, או פנו ב־" + SERVICE_HELP + ".",
    "רגע, נתקעתי. נסו שוב, ואם צריך עזרה אנושית — " + SERVICE_HELP + ".",
  ];
  var softFailIndex = 0;

  function nextSoftFail() {
    var text = softFails[softFailIndex % softFails.length];
    softFailIndex += 1;
    return text;
  }

  function parseJson(text) {
    try {
      return JSON.parse(text);
    } catch (err) {
      return {};
    }
  }

  async function post(path, payload) {
    if (!authUser) {
      throw new Error("יש להתחבר עם Google כדי להשתמש בעוזר.");
    }
    var response = await fetch(apiBase() + path, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    });
    var data = parseJson(await response.text());
    if (response.status === 401) {
      throw new Error(data.error || "ההתחברות פגה. התחברו שוב עם Google.");
    }
    if (!response.ok) {
      throw new Error(data.error || nextSoftFail());
    }
    return data;
  }

  function usableAnswer(text) {
    var trimmed = String(text || "").trim();
    if (!trimmed) return false;
    return !(trimmed.charAt(0) === "{" && /"answer"\s*:/.test(trimmed));
  }

  async function postMessage(payload, onRetry) {
    if (!authUser) {
      throw new Error("יש להתחבר עם Google כדי להשתמש בעוזר.");
    }
    var response = await fetch(apiBase() + "/api/assistant/message", {
      method: "POST",
      headers: await authHeaders({ Accept: "application/x-ndjson" }),
      body: JSON.stringify(payload),
    });
    if (!response.ok || !response.body) {
      var failed = parseJson(await response.text());
      if (response.status === 401) {
        throw new Error(failed.error || "ההתחברות פגה. התחברו שוב עם Google.");
      }
      throw new Error(failed.error || nextSoftFail());
    }
    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var buffer = "";
    var answer = null;
    while (true) {
      var chunk = await reader.read();
      buffer += decoder.decode(chunk.value || new Uint8Array(), { stream: !chunk.done });
      var lines = buffer.split("\n");
      buffer = lines.pop();
      var sawRetry = false;
      lines.forEach(function (line) {
        var trimmed = line.trim();
        if (!trimmed) return;
        var event = parseJson(trimmed);
        if (event.status === "retrying") sawRetry = true;
        if (event.error) answer = { error: event.error };
        if (event.answer) answer = event;
      });
      if (sawRetry && (!answer || answer.error)) onRetry();
      if (chunk.done) break;
    }
    if (buffer.trim()) {
      var last = parseJson(buffer.trim());
      if (last.error) answer = { error: last.error };
      if (last.answer) answer = last;
    }
    if (!answer || answer.error || !usableAnswer(answer.answer)) {
      throw new Error((answer && answer.error) || nextSoftFail());
    }
    return answer;
  }

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var result = String(reader.result || "");
        var comma = result.indexOf(",");
        resolve({
          photoBase64: comma >= 0 ? result.slice(comma + 1) : result,
          photoMime: file.type || "image/jpeg",
        });
      };
      reader.onerror = function () {
        reject(new Error("לא הצלחנו לקרוא את התמונה."));
      };
      reader.readAsDataURL(file);
    });
  }

  function normalizePhone(value) {
    var digits = String(value || "").replace(/\D/g, "");
    if (digits.indexOf("972") === 0) digits = "0" + digits.slice(3);
    return digits;
  }

  function validPhone(value) {
    var digits = normalizePhone(value);
    return /^0\d{8,9}$/.test(digits) || /^[+\d][\d\s\-()]{7,}$/.test(String(value || "").trim());
  }

  function validEmail(value) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(value || "").trim());
  }

  function chipLabel(chip) {
    return (chip.icon ? chip.icon + " " : "") + chip.label;
  }

  function makeChipButton(chip, index, onClick) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "lt22-chip";
    button.style.animationDelay = index * 40 + "ms";
    if (chip.icon) {
      var icon = document.createElement("span");
      icon.className = "lt22-chip-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = chip.icon;
      button.appendChild(icon);
    }
    var copy = document.createElement("span");
    copy.className = "lt22-chip-copy";
    var label = document.createElement("span");
    label.className = "lt22-chip-label";
    label.textContent = chip.label;
    copy.appendChild(label);
    if (chip.sub) {
      var sub = document.createElement("small");
      sub.textContent = chip.sub;
      copy.appendChild(sub);
    }
    button.appendChild(copy);
    button.addEventListener("click", onClick);
    return button;
  }

  async function botSay(text, card) {
    await sleep(280);
    addBubble("assistant", text, [], card || null);
  }

  function looksLikeLabRequest(text) {
    return /מעבדה|קריאת שירות|קריאת.?שירות|service\s*call|טופס.?מעבדה|תיקון במעבדה|בדיקת מוצר/i.test(
      String(text || ""),
    );
  }

  function fieldRow(form, opts) {
    var wrap = document.createElement("label");
    wrap.className = "lt22-form-field" + (opts.full ? " lt22-form-field-full" : "");
    var title = document.createElement("span");
    title.textContent = opts.label + (opts.required ? " *" : "");
    wrap.appendChild(title);
    if (opts.type === "display") {
      var display = document.createElement("div");
      display.className = "lt22-form-display";
      display.textContent = opts.displayValue || opts.value || "";
      wrap.appendChild(display);
      if (opts.name) {
        var hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = opts.name;
        hidden.value = opts.value || "";
        wrap.appendChild(hidden);
      }
      form.appendChild(wrap);
      return display;
    }
    if (opts.type === "product") {
      wrap.classList.add("lt22-form-field-full");
      form.appendChild(wrap);
      return mountProductPicker(wrap, {
        name: opts.name,
        required: opts.required,
        value: opts.value || "",
        placeholder: opts.placeholder || "חפשו או בחרו מוצר…",
      });
    }
    var inputEl;
    if (opts.type === "textarea") {
      inputEl = document.createElement("textarea");
      inputEl.rows = opts.rows || 2;
      wrap.classList.add("lt22-form-field-full");
    } else if (opts.type === "select") {
      inputEl = document.createElement("select");
      (opts.options || []).forEach(function (option) {
        var opt = document.createElement("option");
        opt.value = option.value;
        opt.textContent = option.label;
        inputEl.appendChild(opt);
      });
    } else {
      inputEl = document.createElement("input");
      inputEl.type = opts.type || "text";
    }
    inputEl.name = opts.name;
    if (opts.placeholder) inputEl.placeholder = opts.placeholder;
    if (opts.required) inputEl.required = true;
    if (opts.readonly) {
      inputEl.readOnly = true;
      inputEl.setAttribute("aria-readonly", "true");
    }
    if (opts.value) inputEl.value = opts.value;
    wrap.appendChild(inputEl);
    form.appendChild(wrap);
    return inputEl;
  }

  function mountProductPicker(wrap, opts) {
    var catalog = productCatalog();
    var picker = document.createElement("div");
    picker.className = "lt22-product-picker";
    var hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.name = opts.name;
    hidden.value = opts.value || "";
    if (opts.required) hidden.required = true;
    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "lt22-product-trigger";
    var triggerLabel = document.createElement("span");
    triggerLabel.textContent = opts.value || opts.placeholder || "בחרו מוצר…";
    trigger.appendChild(triggerLabel);
    var panel = document.createElement("div");
    panel.className = "lt22-product-panel";
    panel.hidden = true;
    var search = document.createElement("input");
    search.type = "search";
    search.className = "lt22-product-search";
    search.placeholder = "חיפוש מוצר…";
    search.setAttribute("autocomplete", "off");
    var list = document.createElement("div");
    list.className = "lt22-product-list";
    panel.appendChild(search);
    panel.appendChild(list);
    picker.appendChild(hidden);
    picker.appendChild(trigger);
    picker.appendChild(panel);
    wrap.appendChild(picker);

    function setValue(value, label) {
      hidden.value = value;
      triggerLabel.textContent = label || value || opts.placeholder || "בחרו מוצר…";
      panel.hidden = true;
      search.value = "";
    }

    function matches(query, title) {
      if (!query) return true;
      return String(title || "")
        .toLowerCase()
        .indexOf(query) !== -1;
    }

    function renderList(query) {
      list.innerHTML = "";
      var q = String(query || "")
        .trim()
        .toLowerCase();
      var shown = 0;
      catalog.categories.forEach(function (group) {
        var products = (group.products || []).filter(function (product) {
          return matches(q, product.title);
        });
        if (!products.length) return;
        var groupLabel = document.createElement("div");
        groupLabel.className = "lt22-product-group-label";
        groupLabel.textContent = group.category;
        list.appendChild(groupLabel);
        products.forEach(function (product) {
          var button = document.createElement("button");
          button.type = "button";
          button.className = "lt22-product-option";
          if (hidden.value === product.title) button.classList.add("is-active");
          button.textContent = product.title;
          button.addEventListener("click", function () {
            setValue(product.title, product.title);
          });
          list.appendChild(button);
          shown += 1;
        });
      });
      if (!q || matches(q, catalog.otherLabel)) {
        var otherGroup = document.createElement("div");
        otherGroup.className = "lt22-product-group-label";
        otherGroup.textContent = "נוסף";
        list.appendChild(otherGroup);
        var otherBtn = document.createElement("button");
        otherBtn.type = "button";
        otherBtn.className = "lt22-product-option";
        if (hidden.value === catalog.otherLabel) otherBtn.classList.add("is-active");
        otherBtn.textContent = catalog.otherLabel + " / לא ברשימה";
        otherBtn.addEventListener("click", function () {
          setValue(catalog.otherLabel, catalog.otherLabel + " / לא ברשימה");
        });
        list.appendChild(otherBtn);
        shown += 1;
      }
      if (!shown) {
        var empty = document.createElement("p");
        empty.className = "lt22-product-empty";
        empty.textContent = "לא נמצאו מוצרים תואמים.";
        list.appendChild(empty);
      }
    }

    trigger.addEventListener("click", function () {
      panel.hidden = !panel.hidden;
      if (!panel.hidden) {
        renderList(search.value);
        search.focus();
      }
    });
    search.addEventListener("input", function () {
      renderList(search.value);
    });
    document.addEventListener("click", function (event) {
      if (!picker.contains(event.target)) panel.hidden = true;
    });
    if (opts.value) setValue(opts.value, opts.value);
    return hidden;
  }

  function collectProductRows(form) {
    var products = [];
    Array.prototype.forEach.call(form.querySelectorAll(".lt22-product-row"), function (row) {
      var productEl = row.querySelector("[data-role='product']");
      var qtyEl = row.querySelector("[data-role='quantity']");
      var product = productEl ? String(productEl.value || "").trim() : "";
      var quantity = qtyEl ? String(qtyEl.value || "").trim() : "";
      if (!product) return;
      products.push({ product: product, quantity: quantity || "1" });
    });
    return products;
  }

  function collectForm(form) {
    var data = {};
    var skipNames = {};
    var productRows = form.querySelectorAll(".lt22-product-row");
    if (productRows.length) {
      var products = collectProductRows(form);
      data.products = products;
      if (products.length) {
        data.product = products[0].product;
        data.quantity = products[0].quantity;
      }
      Array.prototype.forEach.call(productRows, function (row) {
        Array.prototype.forEach.call(row.querySelectorAll("[name]"), function (el) {
          if (el.name) skipNames[el.name] = true;
        });
      });
    }
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.disabled || skipNames[el.name]) return;
      if (el.type === "checkbox") {
        data[el.name] = el.checked ? String(el.value || "כן").trim() || "כן" : "לא";
        return;
      }
      if (el.type === "radio" && !el.checked) return;
      data[el.name] = String(el.value || "").trim();
    });
    return data;
  }

  function mountPurchaseProductRows(form) {
    var wrap = document.createElement("div");
    wrap.className = "lt22-product-rows lt22-form-field-full";
    var list = document.createElement("div");
    list.className = "lt22-product-rows-list";
    wrap.appendChild(list);

    function addRow() {
      var row = document.createElement("div");
      row.className = "lt22-product-row";
      var productWrap = document.createElement("label");
      productWrap.className = "lt22-form-field lt22-product-row-product";
      var productTitle = document.createElement("span");
      productTitle.textContent = "מוצר *";
      productWrap.appendChild(productTitle);
      var qtyWrap = document.createElement("label");
      qtyWrap.className = "lt22-form-field lt22-product-row-qty";
      var qtyTitle = document.createElement("span");
      qtyTitle.textContent = "כמות *";
      qtyWrap.appendChild(qtyTitle);
      var qtyInput = document.createElement("input");
      qtyInput.type = "number";
      qtyInput.name = "quantityRow";
      qtyInput.setAttribute("data-role", "quantity");
      qtyInput.required = true;
      qtyInput.min = "1";
      qtyInput.value = "1";
      qtyWrap.appendChild(qtyInput);
      var removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "lt22-product-row-remove";
      removeBtn.setAttribute("aria-label", "הסרת מוצר");
      removeBtn.title = "הסרת מוצר";
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", function () {
        if (list.querySelectorAll(".lt22-product-row").length <= 1) return;
        row.remove();
        syncRemoveButtons();
      });
      row.appendChild(productWrap);
      row.appendChild(qtyWrap);
      row.appendChild(removeBtn);
      list.appendChild(row);
      var hidden = mountProductPicker(productWrap, {
        name: "productRow",
        required: true,
        placeholder: "חפשו או בחרו מוצר…",
      });
      if (hidden) hidden.setAttribute("data-role", "product");
      syncRemoveButtons();
      return row;
    }

    function syncRemoveButtons() {
      var rows = list.querySelectorAll(".lt22-product-row");
      Array.prototype.forEach.call(rows, function (row) {
        var btn = row.querySelector(".lt22-product-row-remove");
        if (btn) btn.hidden = rows.length <= 1;
      });
    }

    var addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "lt22-add-product";
    addBtn.textContent = "הוספת מוצר";
    addBtn.addEventListener("click", function () {
      addRow();
    });
    wrap.appendChild(addBtn);
    form.appendChild(wrap);
    addRow();
    return wrap;
  }

  var LAB_TERMS = [
    {
      name: "paymentTermsAccepted",
      label: "התחייבות לתשלום החשבונית",
      info: "אבקש לקבל שירות למערכת בקרת המבנה. בחתימה על הבקשה אני מאשר/ת התחייבות לתשלום חשבונית עבור השירות ו/או החלקים לפי המחירון. תנאי תשלום: שוטף+30. המחירים אינם כוללים מע\"מ. השירות יינתן על בסיס טכנאי פנוי.",
    },
    {
      name: "overtimeTermsAccepted",
      label: "חיוב שעות חריגות",
      info: "שעות הפעילות הן א'–ה' בין 08:00 ל-17:00. מעבר לכך, השעתיים הראשונות מחויבות בתוספת 25%, ולאחר מכן בתוספת 50%.",
    },
    {
      name: "repeatCallTermsAccepted",
      label: "חיוב מלא גם בקריאה חוזרת",
      info: "הזמנת טכנאי לפי שעות מחויבת עבור כל שעות העבודה, גם אם מתברר שנדרשת קריאת שירות חוזרת לאותה תקלה.",
    },
    {
      name: "travelParkingTermsAccepted",
      label: "נסיעות וחניה",
      info: "שעות נסיעה מחושבות לפי תעריף שעת טכנאי, והכמות לפי הערכת WAZE. באחריות המזמין לדאוג למקום חניה לטכנאי, או לכסות את עלות החניה.",
    },
  ];

  function formCols(form, count) {
    var row = document.createElement("div");
    row.className = "lt22-form-cols lt22-form-cols-" + count;
    form.appendChild(row);
    return row;
  }

  function labTerms(form) {
    var section = document.createElement("fieldset");
    section.className = "lt22-terms";
    var legend = document.createElement("legend");
    legend.textContent = "תנאי השירות";
    section.appendChild(legend);
    var hint = document.createElement("p");
    hint.className = "lt22-terms-hint";
    hint.textContent = "יש לאשר כל סעיף. לחצו על i לפירוט.";
    section.appendChild(hint);
    LAB_TERMS.forEach(function (term) {
      var item = document.createElement("div");
      item.className = "lt22-term";
      var label = document.createElement("label");
      label.className = "lt22-form-check";
      var input = document.createElement("input");
      input.type = "checkbox";
      input.name = term.name;
      input.value = "כן";
      input.required = true;
      var text = document.createElement("span");
      text.textContent = term.label;
      label.appendChild(input);
      label.appendChild(text);
      var infoBtn = document.createElement("button");
      infoBtn.type = "button";
      infoBtn.className = "lt22-info-btn";
      infoBtn.setAttribute("aria-label", "פירוט: " + term.label);
      infoBtn.setAttribute("aria-expanded", "false");
      infoBtn.textContent = "i";
      var bubble = document.createElement("p");
      bubble.className = "lt22-info-bubble";
      bubble.hidden = true;
      bubble.textContent = term.info;
      infoBtn.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        var willOpen = bubble.hidden;
        Array.prototype.forEach.call(section.querySelectorAll(".lt22-info-bubble"), function (node) {
          node.hidden = true;
        });
        Array.prototype.forEach.call(section.querySelectorAll(".lt22-info-btn"), function (node) {
          node.setAttribute("aria-expanded", "false");
        });
        if (willOpen) {
          bubble.hidden = false;
          infoBtn.setAttribute("aria-expanded", "true");
        }
      });
      item.appendChild(label);
      item.appendChild(infoBtn);
      item.appendChild(bubble);
      section.appendChild(item);
    });
    form.appendChild(section);
  }

  function marketingConsentRow(form) {
    var wrap = document.createElement("label");
    wrap.className = "lt22-form-field lt22-form-field-full lt22-form-check";
    var input = document.createElement("input");
    input.type = "checkbox";
    input.name = "marketingConsent";
    input.value = "כן";
    var title = document.createElement("span");
    title.textContent = "אני מאשר/ת קבלת עדכונים שיווקיים מישומי בקרה (אופציונלי)";
    wrap.appendChild(input);
    wrap.appendChild(title);
    form.appendChild(wrap);
    return input;
  }

  async function submitRequest(kind, fields) {
    return post("/api/assistant/request", {
      kind: kind,
      fields: fields,
      conversationId: session && session.conversationId ? session.conversationId : "",
      token: session && session.token ? session.token : "",
    });
  }

  function askForm(kind, buildFields) {
    return new Promise(function (resolve) {
      clearChips();
      setComposer(false, "בחרו אפשרות למעלה", false);
      var row = document.createElement("div");
      row.className = "lt22-row lt22-row-assistant";
      row.appendChild(makeAvatar());
      var bubble = document.createElement("div");
      bubble.className = "lt22-bubble lt22-bubble-assistant";
      var body = document.createElement("div");
      body.className = "lt22-bubble-body";
      var intro = document.createElement("p");
      intro.textContent =
        kind === "purchase"
          ? "טופס רכישה - מלאו את הפרטים ונחזור אליכם."
          : "טופס קריאת שירות — מלאו את הפרטים כאן ונפתח קריאה לטכנאי.";
      body.appendChild(intro);
      var form = document.createElement("form");
      form.className = "lt22-form";
      buildFields(form);
      var actions = document.createElement("div");
      actions.className = "lt22-form-actions";
      var submit = document.createElement("button");
      submit.type = "submit";
      submit.className = "btn btn-submit";
      submit.textContent = "שליחת הבקשה";
      var cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "btn";
      cancel.textContent = "ביטול";
      actions.appendChild(submit);
      actions.appendChild(cancel);
      form.appendChild(actions);
      var err = document.createElement("p");
      err.className = "lt22-form-error";
      err.hidden = true;
      form.appendChild(err);
      body.appendChild(form);
      if (kind === "lab") {
        var labPdf = document.createElement("div");
        labPdf.className = "lt22-lab-pdf";
        var labTitle = document.createElement("strong");
        labTitle.textContent = "טופס מעבדה";
        var labCopy = document.createElement("p");
        labCopy.textContent = "רוצים למלא טופס מעבדה ריק ולהחזיר אותו? הורידו את ה-PDF למטה.";
        var a = document.createElement("a");
        a.href = LAB_PDF;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "הורדת טופס מעבדה (PDF)";
        labPdf.appendChild(labTitle);
        labPdf.appendChild(labCopy);
        labPdf.appendChild(a);
        body.appendChild(labPdf);
      }
      bubble.appendChild(body);
      row.appendChild(bubble);
      log.appendChild(row);
      scrollLog();
      persistTranscript(
        "assistant",
        kind === "purchase" ? "הוצג טופס רכישה / הצעת מחיר" : "הוצג טופס קריאת שירות",
        { kind: "ui" },
      );

      cancel.addEventListener("click", function () {
        row.remove();
        persistTranscript("user", "ביטול הטופס", { kind: "ui" });
        resolve(null);
      });
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        err.hidden = true;
        var fields = collectForm(form);
        submit.disabled = true;
        cancel.disabled = true;
        submit.classList.add("is-loading");
        submit.setAttribute("aria-busy", "true");
        var prevLabel = submit.textContent;
        submit.innerHTML =
          '<span class="lt22-spinner" aria-hidden="true"></span><span>שולחים…</span>';
        submitRequest(kind, fields)
          .then(function (res) {
            row.remove();
            if (res && res.serialNumber) fields.serialNumber = String(res.serialNumber);
            if (res && res.requestId) fields.requestId = String(res.requestId);
            persistTranscript("user", "נשלח הטופס", { kind: "ui" });
            resolve(fields);
          })
          .catch(function (ex) {
            err.hidden = false;
            err.textContent = ex.message || "לא הצלחנו לשלוח. נסו שוב.";
            submit.disabled = false;
            cancel.disabled = false;
            submit.classList.remove("is-loading");
            submit.removeAttribute("aria-busy");
            submit.textContent = prevLabel || "שליחת הבקשה";
          });
      });
    });
  }

  async function askAnythingElse() {
    clearChips();
    setComposer(false, "בחרו אפשרות למעלה", false);
    await botSay("יש עוד משהו שאוכל לעזור בו?");
    var choice = await askChips(
      [
        { label: "סיימתי, תודה", icon: "✅", value: "done" },
        { label: "אני צריך משהו נוסף", icon: "💬", value: "more" },
      ],
      false,
      "בחרו אפשרות למעלה",
    );
    if (choice.value === "done" || /סיימתי|תודה|done/i.test(choice.label || "")) {
      await botSay("תודה שפניתם לישומי בקרה. אפשר לסגור את החלון, או להתחיל שיחה חדשה.");
      showRestart();
      return;
    }
    await askIntent({
      message: "במה תרצו שנעזור?\nמכירות והצעות מחיר, תמיכה טכנית, או פתיחת קריאת שירות.",
    });
  }

  async function runPurchaseFlow() {
    await botSay("מעולה. מלאו את טופס הרכישה ואעביר את הבקשה לשירות.");
    var fields = await askForm("purchase", function (form) {
      fieldRow(form, {
        name: "fullName",
        label: "שם מלא",
        required: true,
        placeholder: "שם פרטי ושם משפחה",
        value: visitor.name || "",
      });
      fieldRow(form, { name: "companyName", label: "שם חברה", required: true });
      fieldRow(form, {
        name: "companyId",
        label: "ח.פ. / תעודת זהות",
        required: true,
        placeholder: "מספר ח.פ. או ת.ז.",
        full: true,
      });
      fieldRow(form, {
        name: "email",
        label: "דואר אלקטרוני",
        type: "email",
        required: true,
        value: visitor.email || "",
      });
      fieldRow(form, {
        name: "phone",
        label: "טלפון (אופציונלי)",
        type: "tel",
        placeholder: "050-1234567",
        value: visitor.phone || "",
      });
      fieldRow(form, {
        name: "country",
        label: "מדינה",
        type: "select",
        required: true,
        value: "ישראל",
        options: COUNTRY_OPTIONS,
      });
      mountPurchaseProductRows(form);
      fieldRow(form, { name: "notes", label: "הערות (אופציונלי)", type: "textarea", rows: 2 });
      marketingConsentRow(form);
    });
    if (!fields) {
      await botSay("ביטלתם את הטופס. אפשר לבחור שוב איך להמשיך.");
      await askIntent();
      return;
    }
    if (fields.fullName) visitor.name = fields.fullName;
    if (fields.phone) visitor.phone = fields.phone;
    if (fields.email) visitor.email = fields.email;
    await syncSessionProfile();
    await botSay(
      "תודה! קיבלנו את בקשת הרכישה. נציג יחזור אליכם במייל.\nלשאלות: " + SERVICE_HELP,
    );
    await askAnythingElse();
  }

  async function runLabFlow() {
    await botSay("לפתיחת קריאת שירות לטכנאי, מלאו את הטופס למטה. בתחתית יש גם קישור להורדת טופס מעבדה.");
    var opened = new Date();
    var openedAtIso = opened.toISOString().slice(0, 10);
    var openedAtHe = opened.toLocaleDateString("he-IL");
    var fields = await askForm("lab", function (form) {
      var when = formCols(form, 2);
      fieldRow(when, {
        name: "openedAt",
        label: "תאריך",
        type: "display",
        displayValue: openedAtHe,
        value: openedAtIso,
      });
      fieldRow(when, { name: "siteName", label: "שם האתר", placeholder: "אופציונלי" });
      var invoice = formCols(form, 2);
      fieldRow(invoice, { name: "companyName", label: "שם לחשבונית", required: true });
      fieldRow(invoice, {
        name: "companyId",
        label: "ח.פ. / ת.ז.",
        required: true,
        placeholder: "מספר ח.פ. או ת.ז.",
      });
      var who = formCols(form, 3);
      fieldRow(who, {
        name: "contactName",
        label: "שם המבקש",
        required: true,
        value: visitor.name || "",
      });
      fieldRow(who, {
        name: "phone",
        label: "טלפון / נייד",
        type: "tel",
        required: true,
        value: visitor.phone || "",
      });
      fieldRow(who, {
        name: "email",
        label: "מייל",
        type: "email",
        required: true,
        value: visitor.email || "",
      });
      var meta = formCols(form, 3);
      fieldRow(meta, {
        name: "country",
        label: "מדינה",
        type: "select",
        required: true,
        value: "ישראל",
        options: COUNTRY_OPTIONS,
      });
      fieldRow(meta, {
        name: "serviceAgreement",
        label: "בהסכם שירות",
        type: "select",
        required: true,
        options: [
          { value: "", label: "בחרו…" },
          { value: "כן", label: "כן" },
          { value: "לא", label: "לא" },
        ],
      });
      fieldRow(meta, { name: "quantity", label: "כמות", type: "number", value: "1", required: true });
      fieldRow(form, {
        name: "equipmentType",
        label: "סוג הציוד / דגם",
        type: "product",
        required: true,
        value: visitor.device && visitor.device.label ? visitor.device.label : "",
        placeholder: "חפשו או בחרו ציוד…",
      });
      fieldRow(form, {
        name: "faultDescription",
        label: "תיאור התקלות",
        type: "textarea",
        rows: 3,
        required: true,
      });
      fieldRow(form, {
        name: "signerName",
        label: "חותמת + שם מפורט",
        required: true,
        placeholder: "שם מלא ותפקיד",
        full: true,
      });
      labTerms(form);
      marketingConsentRow(form);
    });
    if (!fields) {
      await botSay("ביטלתם את טופס קריאת השירות. אפשר להמשיך בשאלות, או לפנות ב־" + SERVICE_HELP + ".");
      if (session) await showTopicMenu(false);
      else await askIntent();
      return;
    }
    if (fields.contactName) visitor.name = fields.contactName;
    if (fields.phone) visitor.phone = fields.phone;
    if (fields.email) visitor.email = fields.email;
    if (visitor.device && visitor.device.id) fields.device = visitor.device.label || visitor.device.id;
    await syncSessionProfile();
    var serialLine = fields.serialNumber ? "\nמספר קריאה: " + fields.serialNumber : "";
    await botSay(
      "תודה! קיבלנו את קריאת השירות." + serialLine + "\nנציג יחזור אליכם.\nלשאלות: " + SERVICE_HELP,
    );
    await askAnythingElse();
  }

  async function askIntent(opts) {
    opts = opts || {};
    clearChips();
    setComposer(false, "בחרו אפשרות למעלה", false);
    var message =
      opts.message !== undefined
        ? opts.message
        : "במה תרצו שנעזור?\nמכירות והצעות מחיר, תמיכה טכנית, או פתיחת קריאת שירות.";
    if (message) await botSay(message);
    var choice = await askChips(
      [
        { label: "מכירות והצעות מחיר", icon: "🛒", value: "purchase" },
        { label: "תמיכה טכנית", icon: "💬", value: "service" },
        { label: "פתיחת קריאת שירות", icon: "🛠️", value: "lab" },
      ],
      false,
      "בחרו אפשרות למעלה",
    );
    if (choice.value === "purchase") {
      await runPurchaseFlow();
      return "purchase";
    }
    if (choice.value === "lab") {
      await runLabFlow();
      return "lab";
    }
    await botSay(
      "תמיכה טכנית — אפשר לשאול כאן על מסכים, מקשים והגדרות.\nלפניות ישירות לשירות: " + SERVICE_HELP + ".",
    );
    return "service";
  }

  async function handleSpecialChip(chip) {
    if (chip.value === "__lab__") {
      addBubble("user", chipLabel(chip), []);
      clearChips();
      await runLabFlow();
      return true;
    }
    if (chip.value === "__photo__") {
      addBubble("user", chipLabel(chip), []);
      clearChips();
      fileInput.click();
      setComposer(true, "צרפו תמונה וכתבו שאלה…", true);
      return true;
    }
    if (chip.value === "__service__") {
      addBubble("user", chipLabel(chip), []);
      clearChips();
      await botSay(
        "לשירות ואחריות אפשר לפתוח קריאת שירות כאן, או לפנות ישירות:\n" + SERVICE_HELP + ".",
      );
      await showTopicMenu(false);
      return true;
    }
    if (chip.value === "__other__") {
      addBubble("user", chipLabel(chip), []);
      clearChips();
      await botSay("בסדר. כתבו את השאלה במילים שלכם, או מלאו את הטופס שבהמשך העמוד.");
      setComposer(true, "תארו את השאלה…", true);
      return true;
    }
    if (chip.value === "__done__") {
      addBubble("user", chipLabel(chip), []);
      clearChips();
      await askRating();
      return true;
    }
    return false;
  }

  function renderStars(container, onPick) {
    var stars = document.createElement("div");
    stars.className = "lt22-stars";
    stars.setAttribute("role", "radiogroup");
    stars.setAttribute("aria-label", "דירוג השירות");
    var buttons = [];
    for (var i = 1; i <= 5; i += 1) {
      (function (score) {
        var star = document.createElement("button");
        star.type = "button";
        star.className = "lt22-star";
        star.setAttribute("aria-label", score + " כוכבים");
        star.textContent = "★";
        star.addEventListener("mouseenter", function () {
          buttons.forEach(function (btn, index) {
            btn.classList.toggle("lt22-star-hover", index < score);
          });
        });
        star.addEventListener("mouseleave", function () {
          buttons.forEach(function (btn) {
            btn.classList.remove("lt22-star-hover");
          });
        });
        star.addEventListener("click", function () {
          buttons.forEach(function (btn, index) {
            btn.classList.toggle("lt22-star-on", index < score);
            btn.disabled = true;
          });
          onPick(score);
        });
        buttons.push(star);
        stars.appendChild(star);
      })(i);
    }
    container.appendChild(stars);
  }

  async function saveRating(score) {
    if (!session) return;
    try {
      await post("/api/assistant/rating", {
        conversationId: session.conversationId,
        token: session.token,
        rating: score,
      });
    } catch (err) {
      showError(err.message);
    }
  }

  async function askRating() {
    clearChips();
    setComposer(false, "בחרו אפשרות למעלה", false);
    composer.hidden = true;
    await sleep(200);
    var bubble = addBubble("assistant", "איך היה השירות? דרגו אותי, זה עוזר לנו להשתפר.", []);
    var picked = false;
    await new Promise(function (resolve) {
      renderStars(bubble, function (score) {
        if (picked) return;
        picked = true;
        clearChips();
        saveRating(score).then(function () {
          addBubble("user", "דירוג: " + score + " ★", []);
          var thanks =
            score >= 4
              ? "תודה רבה על הדירוג! שמח שיכולתי לעזור."
              : "תודה על הכנות. נשתדל להשתפר.";
          botSay(thanks).then(resolve);
        });
      });
      suggestions.appendChild(
        makeChipButton({ label: "דלג", icon: "⏭️", value: "skip" }, 0, function () {
          if (picked) return;
          picked = true;
          clearChips();
          addBubble("user", "⏭️ דלג", []);
          botSay("בסדר. תודה שפניתם לישומי בקרה.").then(resolve);
        }),
      );
      suggestions.hidden = false;
      scrollLog();
    });
    showRestart();
  }

  async function askFollowUp() {
    clearChips();
    setComposer(true, "כתבו שאלת המשך…", true);
    await botSay("אם יש שאלת המשך — אשמח לעזור. ואם סיימתם, אפשר לסיים.");
    var choice = await askChips(
      [
        { label: "כן, זה עזר", icon: "👍", value: "helped" },
        { label: "יש לי עוד שאלה", icon: "💬", value: "more" },
        { label: "סיימתי, תודה", icon: "✅", value: "done" },
      ],
      true,
      "כתבו שאלת המשך…",
    );
    if (choice.value === "done" || /סיימתי|אין לי עוד|זה הכל|done|bye/i.test(choice.label || "")) {
      await askRating();
      return;
    }
    if (choice.value === "helped") {
      await botSay("שמח לשמוע. יש עוד משהו שאוכל לעזור בו?");
      var next = await askChips(
        [
          { label: "יש לי עוד שאלה", icon: "💬", value: "more" },
          { label: "סיימתי, תודה", icon: "✅", value: "done" },
        ],
        true,
        "כתבו שאלת המשך…",
      );
      if (next.value === "done" || /סיימתי|אין לי עוד|זה הכל|done|bye/i.test(next.label || "")) {
        await askRating();
        return;
      }
      if (next.typed) {
        input.value = next.label;
        await sendQuestion({ skipUserBubble: true });
        return;
      }
      await showTopicMenu(false);
      return;
    }
    if (choice.typed) {
      input.value = choice.label;
      await sendQuestion({ skipUserBubble: true });
      return;
    }
    await showTopicMenu(false);
  }

  async function showTopicMenu(greet) {
    if (greet !== false && !topicsOpened) {
      var name = firstName(visitor.name);
      await botSay(
        (name ? name + ", " : "") +
          "איך אפשר לעזור היום?\nבחרו נושא, כתבו שאלה, או צרפו תמונה של מסך המכשיר.",
      );
      await botSay(
        "חשוב: כל עבודה חשמלית, חיווט, התקנה או חיבור ללוח מיועדת לחשמלאי מוסמך בלבד. כאן נעזור להבין מסכים והגדרות — בלי להנחות עבודה חיה על החשמל.",
      );
      await botSay("לתמיכה טכנית ישירה: " + SERVICE_HELP + ".");
      topicsOpened = true;
    } else if (greet !== false) {
      await botSay("במה עוד אפשר לעזור? בחרו נושא או כתבו שאלה.");
    }
    setComposer(true, "כתבו שאלה על המכשיר…", true);
    clearChips();
    topicChips.forEach(function (chip, index) {
      suggestions.appendChild(
        makeChipButton(chip, index, function () {
          if (sending) return;
          handleSpecialChip(chip).then(function (handled) {
            if (handled) return;
            input.value = chip.value;
            sendQuestion();
          });
        }),
      );
    });
    suggestions.hidden = false;
  }

  async function runIntake(opts) {
    opts = opts || {};
    showError("");
    if (!authUser) {
      renderAuthUi();
      showError("התחברו עם Google כדי להתחיל.");
      return;
    }
    applyGoogleProfile(authUser);
    start.hidden = true;
    chat.hidden = false;
    setFullscreen(true);
    setComposer(false, "בחרו אפשרות למעלה", false);
    await ensureTranscriptSession();

    // Google login fills the name early — do not use that to pick the greeting.
    // First open: welcome. Restart / try-again: single intent prompt only.
    var isRestart = Boolean(opts.restart || intakeDoneOnce);
    var greeting = isRestart
      ? "במה תרצו שנעזור?\nמכירות והצעות מחיר, תמיכה טכנית, או פתיחת קריאת שירות."
      : "שלום, אני העוזר של ישומי בקרה. במה אוכל לעזור היום?";
    intakeDoneOnce = true;
    var intent = await askIntent({ message: greeting });
    if (intent !== "service") return;

    await ensureServiceDetails();
    await openSessionAndChat(!isRestart);
  }

  async function sendQuestion(opts) {
    opts = opts || {};
    if (!session || sending) return;
    var message = input.value.trim();
    if (!message && !pendingPhoto) {
      showError("כתבו שאלה לפני השליחה.");
      return;
    }
    if (!message && pendingPhoto) message = "מה מוצג במסך הזה?";
    if (looksLikeLabRequest(message)) {
      addBubble("user", message, []);
      input.value = "";
      clearChips();
      await runLabFlow();
      return;
    }
    showError("");
    var photoPayload = null;
    if (pendingPhoto) {
      if (pendingPhoto.size > 4 * 1024 * 1024) {
        showError("אפשר לצרף תמונת מסך עד 4MB.");
        return;
      }
      try {
        photoPayload = await readFile(pendingPhoto);
      } catch (err) {
        showError(err.message);
        return;
      }
    }
    clearChips();
    if (!opts.skipUserBubble) addBubble("user", message, [], null, { persist: false });
    input.value = "";
    var file = pendingPhoto;
    pendingPhoto = null;
    fileInput.value = "";
    photoName.hidden = true;
    sending = true;
    setComposer(false, "בחרו אפשרות למעלה", false);
    var waitingRow = document.createElement("div");
    waitingRow.className = "lt22-row lt22-row-assistant lt22-row-waiting";
    waitingRow.appendChild(makeAvatar());
    var waiting = document.createElement("div");
    waiting.className = "lt22-waiting";
    waiting.setAttribute("role", "status");
    var spinner = document.createElement("span");
    spinner.className = "lt22-spinner";
    spinner.setAttribute("aria-hidden", "true");
    var label = document.createElement("span");
    label.textContent = "מחכה לתשובה";
    waiting.appendChild(spinner);
    waiting.appendChild(label);
    waitingRow.appendChild(waiting);
    log.appendChild(waitingRow);
    scrollLog();
    var slowTimer = window.setTimeout(function () {
      label.textContent = "זה לוקח יותר זמן מהמצופה, מיד תקבלו תשובה";
      scrollLog();
    }, 10000);
    try {
      var payload = {
        conversationId: session.conversationId,
        token: session.token,
        message: message,
      };
      if (photoPayload) {
        payload.photoBase64 = photoPayload.photoBase64;
        payload.photoMime = photoPayload.photoMime;
      }
      var data = await postMessage(payload, function () {
        window.clearTimeout(slowTimer);
        label.textContent = "זה לוקח יותר זמן מהמצופה, מיד תקבלו תשובה";
        scrollLog();
      });
      waitingRow.remove();
      addBubble("assistant", data.answer, data.figures, null, { persist: false });
      window.clearTimeout(slowTimer);
      sending = false;
      if (data.needsMore) {
        clearChips();
        setComposer(true, "הוסיפו פרטים או שאלה…", true);
        return;
      }
      await askFollowUp();
      return;
    } catch (err) {
      waitingRow.remove();
      if (file) {
        pendingPhoto = file;
        photoName.hidden = false;
        photoName.textContent = file.name;
      }
      window.clearTimeout(slowTimer);
      sending = false;
      await botSay(err.message || nextSoftFail());
      await showTopicMenu(false);
    } finally {
      window.clearTimeout(slowTimer);
    }
  }

  if (startButton) {
    startButton.addEventListener("click", function () {
      runIntake();
    });
  }
  if (googleSignInButton) {
    googleSignInButton.addEventListener("click", function () {
      signInWithGoogle();
    });
  }
  if (googleSignOutButton) {
    googleSignOutButton.addEventListener("click", function () {
      signOutGoogle();
    });
  }
  watchAuth();

  fileInput.addEventListener("change", function () {
    var file = fileInput.files && fileInput.files[0];
    pendingPhoto = file || null;
    photoName.hidden = !file;
    photoName.textContent = file ? file.name : "";
    if (file && session && !sending) {
      input.focus();
    }
  });

  photoButton.addEventListener("click", function () {
    fileInput.click();
  });

  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      composer.requestSubmit();
    }
  });

  composer.addEventListener("submit", function (event) {
    event.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    if (pendingAsk) {
      input.value = "";
      pendingAsk(text);
      return;
    }
    if (session) sendQuestion();
  });

  if (restartInline) {
    restartInline.addEventListener("click", function () {
      startOver();
    });
  }

  if (closeButton) {
    closeButton.addEventListener("click", function () {
      closeAssistant();
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && root.classList.contains("is-active")) {
      event.preventDefault();
      closeAssistant();
    }
  });
})();
