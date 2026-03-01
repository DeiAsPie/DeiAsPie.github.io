import { SiteA11y } from "./a11y-utils.js";

function initUI() {
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle instanceof HTMLButtonElement) {
    setupThemeToggle(themeToggle);
  }

  const mobileToggle = document.getElementById("mobile-menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
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
      const stored = localStorage.getItem("theme");
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
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const eff = pref === "auto" ? (mql.matches ? "dark" : "light") : pref;
    if (eff === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

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
    const pref = getPref();
    const isDark = document.documentElement.classList.contains("dark");
    const labelText = label(pref);
    btn.setAttribute("aria-pressed", isDark ? "true" : "false");
    btn.setAttribute("title", labelText);
    btn.setAttribute("aria-label", labelText);
  }

  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  mql.addEventListener("change", function () {
    if (getPref() === "auto") {
      applyEffectiveTheme("auto");
      syncState();
    }
  });

  syncState();

  btn.addEventListener("click", function () {
    const order = /** @type {const} */ (["light", "dark", "auto"]);
    const cur = getPref();
    const idx = order.indexOf(cur);
    if (idx === -1) idx = 0;
    const next = order[(idx + 1) % order.length];
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
  let isOpen = false;
  let focusTrapCleanup = null;

  function open() {
    isOpen = true;
    menu.classList.remove("hidden");
    toggle.setAttribute("aria-expanded", "true");
    menu.setAttribute("aria-hidden", "false");

    // Setup focus trap via imported SiteA11y
    focusTrapCleanup = SiteA11y.createFocusTrap(menu);
    SiteA11y.announceToScreenReader("Menu opened");
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
    SiteA11y.announceToScreenReader("Menu closed");
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
    if (
      isOpen &&
      !menu.contains(event.target) &&
      !toggle.contains(event.target)
    ) {
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
