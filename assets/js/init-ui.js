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
    try {
      console.log("initUI: found mobile menu toggle and menu");
    } catch (e) {}

    /**
     * @param {HTMLElement} container
     */
    /**
     * @param {HTMLElement} container
     * @returns {NodeListOf<HTMLElement>}
     */
    function getFocusable(container) {
      return /** @type {NodeListOf<HTMLElement>} */ (
        container.querySelectorAll(
          'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
      );
    }

    /**
     * @param {KeyboardEvent} event
     */
    function trapFocus(event) {
      /** @type {HTMLElement[]} */
      var focusable = Array.from(getFocusable(menu));
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.key === "Tab") {
        if (event.shiftKey && document.activeElement === first) {
          last.focus();
          event.preventDefault();
        } else if (!event.shiftKey && document.activeElement === last) {
          first.focus();
          event.preventDefault();
        }
      } else if (event.key === "Escape") {
        menu.classList.add("hidden");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    }

    toggle.addEventListener("click", function () {
      try {
        console.log("mobile-toggle: click - before", {
          menuClass: menu.className,
          ariaExpanded: toggle.getAttribute("aria-expanded"),
        });
      } catch (e) {}
      var isHidden = menu.classList.toggle("hidden");
      toggle.setAttribute("aria-expanded", isHidden ? "false" : "true");
      if (!isHidden) {
        var focusTargets = Array.from(getFocusable(menu));
        if (focusTargets.length) {
          focusTargets[0].focus();
        }
        document.addEventListener("keydown", trapFocus);
      } else {
        document.removeEventListener("keydown", trapFocus);
      }
      try {
        console.log("mobile-toggle: click - after", {
          menuClass: menu.className,
          ariaExpanded: toggle.getAttribute("aria-expanded"),
        });
      } catch (e) {}
    });

    function handleResize() {
      if (window.innerWidth >= 768) {
        menu.classList.add("hidden");
        toggle.setAttribute("aria-expanded", "false");
        document.removeEventListener("keydown", trapFocus);
      }
    }

    window.addEventListener("resize", handleResize);
    handleResize();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUI);
  } else {
    initUI();
  }
})();
