import { mkdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "public");
mkdirSync(out, { recursive: true });
// Ubuntu supplies ImageMagick 6 as convert; macOS also supports ImageMagick 7.
const imageMagick =
  spawnSync("magick", ["-version"]).status === 0 ? "magick" : "convert";
const logo = readFileSync(path.join(root, "assets/logo.svg"), "utf8");
const adaptive = logo
  .replace(/fill="#181818"/g, 'class="ink" fill="#181818"')
  .replace(
    /<svg([^>]*)>/,
    "<svg$1><style>.ink{fill:#181818}@media(prefers-color-scheme:dark){.ink{fill:#E7E7E7}}</style>",
  );
writeFileSync(path.join(out, "favicon.svg"), adaptive);
for (const [variant, svg] of [
  ["", logo],
  ["-white", logo.replaceAll("#181818", "#E7E7E7")],
]) {
  const source = path.join(out, `mark${variant}.svg`);
  writeFileSync(source, svg);
  for (const size of [512, 180, 256]) {
    const png = path.join(out, `mark${variant}-${size}.png`);
    execFileSync("rsvg-convert", [
      "-w",
      String(Math.round(size * 0.95)),
      "-h",
      String(Math.round(size * 0.95)),
      source,
      "-o",
      png,
    ]);
    const target = path.join(
      out,
      size === 512
        ? `icon${variant}.png`
        : size === 180
          ? `apple-icon${variant}.png`
          : `favicon${variant}.ico`,
    );
    const args = [
      png,
      "-background",
      "none",
      "-gravity",
      "center",
      "-extent",
      `${size}x${size}`,
    ];
    if (size === 256)
      args.push("-define", "icon:auto-resize=256,128,64,48,32,16");
    execFileSync(imageMagick, [...args, target]);
  }
}
writeFileSync(
  path.join(root, "assets.json"),
  JSON.stringify(
    {
      svg: adaptive,
      script: readFileSync(path.join(out, "favicon.js"), "utf8"),
    },
    null,
    2,
  ) + "\n",
);
for (const variant of ["", "-white"]) {
  unlinkSync(path.join(out, `mark${variant}.svg`));
  for (const size of [512, 180, 256])
    unlinkSync(path.join(out, `mark${variant}-${size}.png`));
}
console.log("Shared favicon artwork and theme variants generated.");
