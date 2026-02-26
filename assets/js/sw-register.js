/**
 * Service Worker unregister snippet.
 * Removes any previously registered SW and clears caches.
 * Safe to delete after 4 weeks (~ 2026-03-26).
 * Tracking: https://github.com/DeiAsPie/DeiAsPie.github.io/issues/23
 */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    registrations.forEach(function (reg) {
      reg.unregister();
    });
  }).catch(function () {});
  caches.keys().then(function (names) {
    names.forEach(function (name) {
      caches.delete(name);
    });
  }).catch(function () {});
}
