(function () {
  try {
    var pref = localStorage.getItem("theme"); // 'light' | 'dark' | 'auto' | null
    if (!pref) {
      pref = "auto";
      localStorage.setItem("theme", pref);
    }
    var mql = window.matchMedia("(prefers-color-scheme: dark)");
    var effective = pref === "auto" ? (mql.matches ? "dark" : "light") : pref;
    if (effective === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // Reacting to a later OS theme change is not a first-paint concern:
    // init-ui.js owns that listener and also syncs the toggle button's
    // accessible state, which this script cannot do.
  } catch (_e) {
    document.documentElement.classList.add("dark");
  }
})();
