(function () {
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
    var isOpen = false;
    var focusTrapCleanup = null;

    function open() {
      isOpen = true;
      menu.classList.remove("hidden");
      toggle.setAttribute("aria-expanded", "true");
      menu.setAttribute("aria-hidden", "false");

      // Setup focus trap via SiteA11y namespace
      if (window.SiteA11y) {
        focusTrapCleanup = window.SiteA11y.createFocusTrap(menu);
        window.SiteA11y.announceToScreenReader('Menu opened');
      } else {
        console.warn('SiteA11y not loaded — a11y features disabled');
        // Fallback: just focus first link
        var firstLink = menu.querySelector('a');
        if (firstLink instanceof HTMLElement) {
          firstLink.focus();
        }
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
      if (window.SiteA11y) {
        window.SiteA11y.announceToScreenReader('Menu closed');
      }
    }

    // Attach event listeners
    toggle.addEventListener("click", function () {
      if (isOpen) {
        close();
      } else {
        open();
      }
    });

    // Close menu when clicking outside
    document.addEventListener("click", function (event) {
      if (isOpen && !menu.contains(event.target) && !toggle.contains(event.target)) {
        close();
      }
    });

    // Close menu on Escape key
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen) {
        close();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUI);
  } else {
    initUI();
  }
})();
