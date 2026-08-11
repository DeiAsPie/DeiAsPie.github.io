(function () {
  function createAnnouncer() {
    var announcer = document.createElement("div");
    announcer.id = "sr-announcer";
    announcer.className = "sr-only";
    announcer.setAttribute("aria-live", "polite");
    announcer.setAttribute("aria-atomic", "true");
    document.body.appendChild(announcer);
    return announcer;
  }

  function announceToScreenReader(message, priority) {
    priority = priority || "polite";
    var announcer =
      document.getElementById("sr-announcer") || createAnnouncer();
    announcer.setAttribute("aria-live", priority);
    announcer.textContent = message;
  }

  function initUI() {
    var themeToggle = document.getElementById("theme-toggle");
    if (themeToggle instanceof HTMLButtonElement) {
      setupThemeToggle(themeToggle);
    }

    var mobileToggle = document.getElementById("mobile-menu-toggle");
    var mobileMenu = document.getElementById("mobile-menu");
    if (
      mobileToggle instanceof HTMLButtonElement &&
      mobileMenu instanceof HTMLElement
    ) {
      setupMobileMenu(mobileToggle, mobileMenu);
    }

    document.documentElement.classList.add("ui-ready");
  }

  /**
   * @param {HTMLButtonElement} btn
   */
  function setupThemeToggle(btn) {
    /**
     * @returns {"light"|"dark"|"auto"}
     */
    function getPref() {
      try {
        var stored = localStorage.getItem("theme");
        if (stored === "light" || stored === "dark" || stored === "auto") {
          return stored;
        }
        return "auto";
      } catch (_e) {
        return "auto";
      }
    }

    /**
     * @param {"light"|"dark"|"auto"} value
     */
    function setPref(value) {
      try {
        localStorage.setItem("theme", value);
      } catch (_e) {}
    }

    /**
     * @param {"light"|"dark"|"auto"} pref
     */
    function applyEffectiveTheme(pref) {
      var mql = window.matchMedia("(prefers-color-scheme: dark)");
      var eff = pref === "auto" ? (mql.matches ? "dark" : "light") : pref;
      if (eff === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }

    /**
     * @param {"light"|"dark"|"auto"} pref
     */
    /**
     * @param {"light"|"dark"|"auto"} pref
     * @returns {string}
     */
    function label(pref) {
      return pref === "auto"
        ? "Theme: Auto"
        : pref === "dark"
          ? "Theme: Dark"
          : "Theme: Light";
    }

    function syncState() {
      var pref = getPref();
      var isDark = document.documentElement.classList.contains("dark");
      var labelText = label(pref);
      btn.setAttribute("aria-pressed", isDark ? "true" : "false");
      btn.setAttribute("title", labelText);
      btn.setAttribute("aria-label", labelText);
    }

    var mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", function () {
      if (getPref() === "auto") {
        applyEffectiveTheme("auto");
        syncState();
      }
    });

    syncState();

    btn.addEventListener("click", function () {
      var order = /** @type {const} */ (["light", "dark", "auto"]);
      var cur = getPref();
      var idx = order.indexOf(cur);
      if (idx === -1) idx = 0;
      var next = order[(idx + 1) % order.length];
      setPref(next);
      applyEffectiveTheme(next);
      syncState();
    });
  }

  /**
   * @param {HTMLButtonElement} toggle
   * @param {HTMLElement} menu
   */
  function setupMobileMenu(toggle, menu) {
    // Type guard: menu must be a dialog for showModal/close
    if (!(menu instanceof HTMLDialogElement)) {
      console.warn("Mobile menu is not a <dialog> element");
      return;
    }

    function handleClose() {
      toggle.setAttribute("aria-expanded", "false");

      // Return focus to toggle button
      toggle.focus();

      // Announce to screen readers
      announceToScreenReader("Menu closed");
    }

    function open() {
      // showModal() lifts the dialog into the top layer, so it no longer sits
      // under the header in normal flow. Anchor it to the header's measured
      // bottom edge to keep the dropdown where it has always appeared.
      var header = toggle.closest("header");
      if (header) {
        menu.style.top = `${header.getBoundingClientRect().bottom}px`;
      }

      menu.showModal();
      toggle.setAttribute("aria-expanded", "true");

      // showModal() alone leaves focus on the dialog in some engines; the
      // previous focus trap always moved it to the first menu item.
      var firstLink = menu.querySelector("a");
      if (firstLink instanceof HTMLElement) {
        firstLink.focus();
      }

      announceToScreenReader("Menu opened");
    }

    function close() {
      if (menu.open) {
        menu.close();
      }
    }

    // Attach event listeners
    toggle.addEventListener("click", function () {
      if (menu.open) {
        close();
      } else {
        open();
      }
    });

    // Listen for native close event (triggered by Escape or programmatic close())
    menu.addEventListener("close", handleClose);

    // Close menu when clicking on the backdrop (outside click dismissal)
    // This fires when event.target is the dialog element itself (the backdrop)
    menu.addEventListener("click", function (event) {
      if (event.target === menu) {
        close();
      }
    });

    // Native Escape key handling is automatic via showModal()
    // Native focus trapping is automatic via showModal()
    // Native background inertness is automatic via showModal()
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUI);
  } else {
    initUI();
  }
})();
