(function () {
  var __DEV__ = "false" === "true";
  if (!__DEV__) {
    try {
      console.log = function () {};
    } catch (e) {}
  }
  function initUI() {
    try {
      console.log("initUI: running", { readyState: document.readyState });
    } catch (e) {}

    var btn = document.getElementById("theme-toggle");
    if (btn) {
      try {
        console.log("initUI: found theme-toggle button");
      } catch (e) {}

      function getPref() {
        try {
          return localStorage.getItem("theme") || "dark";
        } catch (e) {
          return "dark";
        }
      }
      function setPref(v) {
        try {
          localStorage.setItem("theme", v);
        } catch (e) {}
      }
      function applyEffectiveTheme(pref) {
        var mql = window.matchMedia("(prefers-color-scheme: dark)");
        var eff = pref === "auto" ? (mql.matches ? "dark" : "light") : pref;
        if (eff === "dark") document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
      }
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
        btn.setAttribute("aria-pressed", isDark ? "true" : "false");
        btn.setAttribute("title", label(pref));
        btn.setAttribute("aria-label", label(pref));
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
        var order = ["light", "dark", "auto"];
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
    } else {
      try {
        console.log("initUI: theme-toggle button not found");
      } catch (e) {}
    }

    var toggle = document.getElementById("mobile-menu-toggle");
    var menu = document.getElementById("mobile-menu");
    if (toggle && menu) {
      try {
        console.log("initUI: found mobile menu toggle and menu");
      } catch (e) {}

      function getFocusable(container) {
        return container.querySelectorAll(
          'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
      }
      function trapFocus(e) {
        var focusable = getFocusable(menu);
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.key === "Tab") {
          if (e.shiftKey && document.activeElement === first) {
            last.focus();
            e.preventDefault();
          } else if (!e.shiftKey && document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        } else if (e.key === "Escape") {
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
          var f = getFocusable(menu);
          if (f.length) {
            f[0].focus();
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
    } else {
      try {
        console.log("initUI: mobile menu toggle or menu not found", {
          toggle: !!toggle,
          menu: !!menu,
        });
      } catch (e) {}
    }

    try {
      document.documentElement.classList.add("ui-ready");
    } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUI);
  } else {
    initUI();
  }
})();
