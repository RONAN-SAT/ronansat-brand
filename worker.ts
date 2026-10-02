const PATHS = new Map([
  ["/favicon.ico", "/favicon.ico"],
  ["/favicon-white.ico", "/favicon-white.ico"],
  ["/favicon.svg", "/favicon.svg"],
  ["/icon.png", "/icon.png"],
  ["/apple-icon.png", "/apple-icon.png"],
  ["/brand/icon-white.png", "/icon-white.png"],
  ["/brand/favicon.svg", "/favicon.svg"],
  ["/brand/favicon.js", "/favicon.js"],
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const asset = PATHS.get(url.pathname);
    if (!asset) return fetch(request);
    if (request.method !== "GET" && request.method !== "HEAD")
      return new Response("Method not allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    const theme = url.searchParams.get("theme");
    url.pathname = asset;
    url.search = "";
    const response = await env.ASSETS.fetch(
      new Request(url, { method: request.method }),
    );
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "public, max-age=300, must-revalidate");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-RonanSat-Brand", "shared");
    headers.delete("set-cookie");
    if (
      asset === "/favicon.svg" &&
      request.method === "GET" &&
      (theme === "light" || theme === "dark")
    ) {
      const svg = (await response.text()).replace(
        /<style>[\s\S]*?<\/style>/,
        `<style>.ink{fill:${theme === "dark" ? "#E7E7E7" : "#181818"}}</style>`,
      );
      headers.delete("content-length");
      headers.delete("etag");
      return new Response(svg, { status: response.status, headers });
    }
    return new Response(response.body, { status: response.status, headers });
  },
} satisfies ExportedHandler<BrandEnv>;
