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
     * Focus trap for modal/mobile menu
     * @param {HTMLElement} container - Container element to trap focus within
     * @returns {Function} Cleanup function to remove listeners
     */
    createFocusTrap: function (container) {
      var focusableSelectors =
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

      var getFocusableElements = function () {
        return Array.from(
          container.querySelectorAll(focusableSelectors)
        ).filter(function (el) {
          return (
            el.offsetParent !== null &&
            !el.hasAttribute("inert") &&
            window.getComputedStyle(el).display !== "none"
          );
        });
      };

      var handleKeyDown = function (e) {
        if (e.key !== "Tab") return;

        var focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        var firstElement = focusableElements[0];
        var lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      };

      container.addEventListener("keydown", handleKeyDown);

      var focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }

      return function () {
        container.removeEventListener("keydown", handleKeyDown);
      };
    },

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
