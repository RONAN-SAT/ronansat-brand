// Shared favicon controller. No account data, storage, network calls or tracking.
(() => {
  if (window.ronanSatFavicon) return;
  const theme = window.matchMedia("(prefers-color-scheme: dark)");
  let icon;
  let pending = false;
  const render = () => {
    pending = false;
    const icons = [...document.querySelectorAll('link[rel~="icon"]')];
    if (!icon?.isConnected) {
      icon = document.createElement("link");
      icon.rel = "icon";
      icon.type = "image/svg+xml";
      icon.dataset.ronansatFavicon = "shared";
    }
    // Routers may reinsert file-convention icons on navigation. One controller
    // owns the favicon so a page cannot accidentally undo the shared behavior.
    for (const other of icons) if (other !== icon) other.remove();
    const next = `${location.origin}/brand/favicon.svg?theme=${theme.matches ? "dark" : "light"}`;
    if (icon.href !== next) icon.href = next;
    if (!icon.isConnected) document.head.append(icon);
  };
  const observer = new MutationObserver(() => {
    if (!pending) {
      pending = true;
      queueMicrotask(render);
    }
  });
  render();
  observer.observe(document.head, { childList: true });
  theme.addEventListener("change", render);
  window.ronanSatFavicon = Object.freeze({ refresh: render });
})();
