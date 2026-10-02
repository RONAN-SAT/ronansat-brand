// Shared favicon controller. No account data, storage, network calls or tracking.
(() => {
  if (window.ronanSatFavicon) return;
  const theme = window.matchMedia("(prefers-color-scheme: dark)");
  let fallbackIcon;
  let pending = false;
  const render = () => {
    pending = false;
    const icons = [...document.querySelectorAll('link[rel~="icon"]')];
    // React owns the links rendered by app metadata. Removing one outside
    // React leaves its resource fiber pointing at a detached node and crashes
    // hydration/navigation when React later tries to remove it. Theme every
    // existing icon in place; only create our own when the head has none.
    if (icons.length === 0) {
      fallbackIcon ??= document.createElement("link");
      fallbackIcon.rel = "icon";
      fallbackIcon.dataset.ronansatFavicon = "shared";
      icons.push(fallbackIcon);
    }
    const next = `${location.origin}/brand/favicon.svg?theme=${theme.matches ? "dark" : "light"}`;
    for (const icon of icons) {
      icon.type = "image/svg+xml";
      if (icon.href !== next) icon.href = next;
      if (!icon.isConnected) document.head.append(icon);
    }
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
