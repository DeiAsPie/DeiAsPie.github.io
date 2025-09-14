(function () {
  try {
    var supports =
      "relList" in HTMLLinkElement.prototype &&
      HTMLLinkElement.prototype.relList.supports &&
      HTMLLinkElement.prototype.relList.supports("prefetch");
    if (!supports) return;
  } catch (e) {
    return;
  }
  var seen = new Set();
  function add(href) {
    if (seen.has(href) || href.indexOf("#") > -1 || href.startsWith("mailto:"))
      return;
    seen.add(href);
    var l = document.createElement("link");
    l.rel = "prefetch";
    l.href = href;
    l.as = "document";
    document.head.appendChild(l);
  }
  function bind(a) {
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) !== "/") return;
    var h = function () {
      add(href);
    };
    a.addEventListener("pointerenter", h, { once: true });
    a.addEventListener("focus", h, { once: true });
  }
  document.querySelectorAll("nav a[href]").forEach(bind);
})();
