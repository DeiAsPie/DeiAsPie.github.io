/**
 * Accessibility utilities
 * Provides focus trap and keyboard navigation helpers
 */

/**
 * Focus trap for modal/mobile menu
 * @param {HTMLElement} container - Container element to trap focus within
 * @returns {Function} Cleanup function to remove listeners
 */
export function createFocusTrap(container) {
  const focusableSelectors =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const getFocusableElements = () => {
    return Array.from(container.querySelectorAll(focusableSelectors)).filter(
      (el) => {
        return (
          el.offsetParent !== null && // visible
          !el.hasAttribute("inert") &&
          window.getComputedStyle(el).display !== "none"
        );
      }
    );
  };

  const handleKeyDown = (e) => {
    if (e.key !== "Tab") return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };

  container.addEventListener("keydown", handleKeyDown);

  // Focus first element
  const focusableElements = getFocusableElements();
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }

  return () => {
    container.removeEventListener("keydown", handleKeyDown);
  };
}

/**
 * Announce to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export function announceToScreenReader(message, priority = "polite") {
  const announcer =
    document.getElementById("sr-announcer") || createAnnouncer();
  announcer.setAttribute("aria-live", priority);
  announcer.textContent = message;
}

function createAnnouncer() {
  const announcer = document.createElement("div");
  announcer.id = "sr-announcer";
  announcer.className = "sr-only";
  announcer.setAttribute("aria-live", "polite");
  announcer.setAttribute("aria-atomic", "true");
  document.body.appendChild(announcer);
  return announcer;
}
