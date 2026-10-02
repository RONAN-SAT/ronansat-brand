import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import worker from "./worker";

test("shared controller preserves framework icon nodes through theme and route changes", () => {
  let observe;
  let themeChange;
  let links = [
    {
      href: "/icon.png",
      isConnected: true,
      remove() {
        throw new Error("Must not detach a framework-owned icon");
      },
    },
  ];
  const initialIcon = links[0];
  const queued = [];
  const theme = {
    matches: false,
    addEventListener(_, fn) {
      themeChange = fn;
    },
  };
  const document = {
    title: "Owner console",
    get cookie() {
      throw new Error("Favicon must not read cookies");
    },
    head: {
      append(icon) {
        icon.isConnected = true;
        links.push(icon);
        observe?.();
      },
    },
    querySelectorAll() {
      return links;
    },
    createElement() {
      return { dataset: {}, isConnected: false };
    },
  };
  const window = { matchMedia: () => theme };
  runInNewContext(
    readFileSync(new URL("./public/favicon.js", import.meta.url), "utf8"),
    {
      window,
      document,
      location: { origin: "https://pay.ronansat.com" },
      MutationObserver: class {
        constructor(fn) {
          observe = fn;
        }
        observe() {}
      },
      queueMicrotask: (fn) => queued.push(fn),
    },
  );
  expect(links).toHaveLength(1);
  expect(links[0]).toBe(initialIcon);
  expect(links[0].type).toBe("image/svg+xml");
  expect(links[0].href).toBe(
    "https://pay.ronansat.com/brand/favicon.svg?theme=light",
  );
  theme.matches = true;
  themeChange();
  expect(links[0].href).toEndWith("theme=dark");
  const routeIcon = {
    href: "/route-icon.png",
    isConnected: true,
    remove() {
      throw new Error("Must not detach a framework-owned route icon");
    },
  };
  links.push(routeIcon);
  observe();
  let steps = 0;
  while (queued.length && steps++ < 10) queued.shift()();
  expect(queued).toHaveLength(0);
  expect(links).toHaveLength(2);
  expect(links[0]).toBe(initialIcon);
  expect(links[1]).toBe(routeIcon);
  expect(routeIcon.href).toEndWith("theme=dark");
  expect(routeIcon.type).toBe("image/svg+xml");

  // The framework can remove its own resources safely. An empty head gets
  // one fallback, reused on later refreshes instead of accumulating links.
  links = [];
  observe();
  while (queued.length && steps++ < 10) queued.shift()();
  expect(links).toHaveLength(1);
  const fallback = links[0];
  theme.matches = false;
  themeChange();
  window.ronanSatFavicon.refresh();
  expect(links).toHaveLength(1);
  expect(links[0]).toBe(fallback);
  expect(fallback.href).toEndWith("theme=light");
  expect(document.title).toBe("Owner console");
});

test("public assets reject writes and select dark SVG without auth cookies", async () => {
  const env = {
    ASSETS: {
      fetch: async () =>
        new Response('<svg><style>old</style><path class="ink" /></svg>', {
          headers: {
            "content-type": "image/svg+xml",
            "set-cookie": "private=bad",
          },
        }),
    },
  };
  const dark = await worker.fetch(
    new Request("https://pay.ronansat.com/brand/favicon.svg?theme=dark"),
    env,
  );
  expect(await dark.text()).toContain("#E7E7E7");
  expect(dark.headers.get("set-cookie")).toBeNull();
  expect(dark.headers.get("x-ronansat-brand")).toBe("shared");
  const write = await worker.fetch(
    new Request("https://admin.ronansat.com/favicon.ico", { method: "POST" }),
    env,
  );
  expect(write.status).toBe(405);
});
