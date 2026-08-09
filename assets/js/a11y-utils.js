/**
 * Accessibility utilities
 * Provides focus trap and keyboard navigation helpers
 * Attaches to window.SiteA11y namespace for use by init-ui.js
 */
;(function () {
  function createAnnouncer() {
    var announcer = document.createElement("div");
    announcer.id = "sr-announcer";
    announcer.className = "sr-only";
    announcer.setAttribute("aria-live", "polite");
    announcer.setAttribute("aria-atomic", "true");
    document.body.appendChild(announcer);
    return announcer;
  }

  window.SiteA11y = {
    /**
     * Announce to screen readers
     * @param {string} message - Message to announce
     * @param {string} priority - 'polite' or 'assertive'
     */
    announceToScreenReader: function (message, priority) {
      priority = priority || "polite";
      var announcer =
        document.getElementById("sr-announcer") || createAnnouncer();
      announcer.setAttribute("aria-live", priority);
      announcer.textContent = message;
    },
  };
})();
