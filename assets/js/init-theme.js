(function () {
  try {
    var pref = localStorage.getItem("theme"); // 'light' | 'dark' | 'auto' | null
    if (!pref) {
      pref = "dark";
      localStorage.setItem("theme", pref);
    }
    var mql = window.matchMedia("(prefers-color-scheme: dark)");
    var effective = pref === "auto" ? (mql.matches ? "dark" : "light") : pref;
    if (effective === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    if (pref === "auto") {
      try {
        mql.addEventListener("change", function (e) {
          var eff = e.matches ? "dark" : "light";
          if (eff === "dark") document.documentElement.classList.add("dark");
          else document.documentElement.classList.remove("dark");
        });
      } catch (e) {}
    }
  } catch (e) {
    document.documentElement.classList.add("dark");
  }
})();
