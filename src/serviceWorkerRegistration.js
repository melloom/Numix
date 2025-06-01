// Basic service worker registration for Vite PWA
export function register() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js", { scope: '/' })
        .then(registration => {
          console.log('Service worker registered successfully:', registration.scope);
        })
        .catch((error) => {
          console.error("Service worker registration failed:", error);
        });
    });
  }
}
