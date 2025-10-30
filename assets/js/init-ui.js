(function () {
  function initUI() {
    try {
      console.log("initUI: running", { readyState: document.readyState });
    } catch (e) {}

    var themeToggle = document.getElementById("theme-toggle");
    if (themeToggle instanceof HTMLButtonElement) {
      setupThemeToggle(themeToggle);
    } else {
      try {
        console.log("initUI: theme-toggle button not found");
      } catch (e) {}
    }

    var mobileToggle = document.getElementById("mobile-menu-toggle");
    var mobileMenu = document.getElementById("mobile-menu");
    if (
      mobileToggle instanceof HTMLButtonElement &&
      mobileMenu instanceof HTMLElement
    ) {
      setupMobileMenu(mobileToggle, mobileMenu);
    } else {
      try {
        console.log("initUI: mobile menu toggle or menu not found", {
          toggle: mobileToggle instanceof HTMLButtonElement,
          menu: mobileMenu instanceof HTMLElement,
        });
      } catch (e) {}
    }

    try {
      document.documentElement.classList.add("ui-ready");
    } catch (e) {}
  }

  /**
   * @param {HTMLButtonElement} btn
   */
  function setupThemeToggle(btn) {
    try {
      console.log("initUI: found theme-toggle button");
    } catch (e) {}

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
      } catch (e) {
        return "auto";
      }
    }

    /**
     * @param {"light"|"dark"|"auto"} value
     */
    function setPref(value) {
      try {
        localStorage.setItem("theme", value);
      } catch (e) {}
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

    try {
      var mql = window.matchMedia("(prefers-color-scheme: dark)");
      mql.addEventListener("change", function () {
        if (getPref() === "auto") {
          applyEffectiveTheme("auto");
          syncState();
        }
      });
    } catch (e) {}

    syncState();

    btn.addEventListener("click", function () {
      try {
        console.log("theme-toggle: click - before", {
          htmlClass: document.documentElement.className,
          ariaPressed: btn.getAttribute("aria-pressed"),
        });
      } catch (e) {}
  var order = /** @type {const} */ (["light", "dark", "auto"]);
      var cur = getPref();
      var idx = order.indexOf(cur);
      if (idx === -1) idx = 0;
  var next = order[(idx + 1) % order.length];
      setPref(next);
      applyEffectiveTheme(next);
      syncState();
      try {
        console.log("theme-toggle: click - after", {
          htmlClass: document.documentElement.className,
          ariaPressed: btn.getAttribute("aria-pressed"),
        });
      } catch (e) {}
    });
  }

  /**
   * @param {HTMLButtonElement} toggle
   * @param {HTMLElement} menu
   */
  function setupMobileMenu(toggle, menu) {
    var isOpen = false;
    var focusTrapCleanup = null;

    function open() {
      isOpen = true;
      menu.classList.remove("hidden");
      toggle.setAttribute("aria-expanded", "true");
      menu.setAttribute("aria-hidden", "false");

      // Import and setup focus trap
      if (typeof createFocusTrap === 'function') {
        focusTrapCleanup = createFocusTrap(menu);
      } else {
        // Fallback: just focus first link
        const firstLink = menu.querySelector('a');
        if (firstLink instanceof HTMLElement) {
          firstLink.focus();
        }
      }

      // Announce to screen readers
      if (typeof announceToScreenReader === 'function') {
        announceToScreenReader('Menu opened');
      }
    }

    function close() {
      isOpen = false;
      menu.classList.add("hidden");
      toggle.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-hidden", "true");

      // Cleanup focus trap
      if (focusTrapCleanup) {
        focusTrapCleanup();
        focusTrapCleanup = null;
      }

      // Return focus to toggle button
      toggle.focus();

      // Announce to screen readers
      if (typeof announceToScreenReader === 'function') {
        announceToScreenReader('Menu closed');
      }
    }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUI);
  } else {
    initUI();
  }
})();
