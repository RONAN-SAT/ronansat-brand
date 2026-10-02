# RONAN SAT shared brand

This repository owns the favicon controller, canonical artwork, generated public assets, and the ronansat-brand Cloudflare Worker. Consumers pin it as a `brand/` Git submodule. There is one maintained behavior implementation: `public/favicon.js`.

Run `bun install`, `bun run build`, `bun run lint`, `bun run typecheck`, and `bun test`. Raster regeneration requires librsvg and ImageMagick (`rsvg-convert` and `magick` or `convert`). Generated public assets and the payment import `assets.json` are committed here so consumers need neither raster tools nor a brand build.

Formatting is pinned in `.prettierrc.json` so a consumer checkout and standalone CI use the same rules.

Consumers load `/brand/favicon.js` once in their document head. Local public paths are relative symlinks into `brand/public`; payments imports `brand/assets.json`. Their normal development/build commands initialize the pinned submodule. There is no sibling checkout dependency and no copy-and-sync script.

Production routes serve standard icons and `/brand/favicon.{svg,js}` across the apex and subdomains with five-minute caching. Exact known-host routes coexist with host catch-all routes; add exact icon routes for any new host using a more-specific catch-all. The controller handles theme changes and route metadata replacements without reading cookies, storage, or application state. It updates existing icon links in place and never removes framework-owned head elements; removing React metadata links crashes hydration and navigation. It creates a fallback link only when the document has no icons. Payments retains same-origin URLs and its existing CSP.

Brand CI alone deploys the Worker. Updating and deploying this repository changes production favicon behavior for all apps without redeploying them. Update consumer submodule pointers to receive the same version locally. Never place credentials or private app data in this repository.
