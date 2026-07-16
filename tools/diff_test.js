// Measure how localized the difference is between a base scene and a generated
// variant. Resizes both to the in-game panel size, then reports per-cell diff.
const fs = require("fs");
const { PNG } = require("pngjs");

function load(p) {
  return PNG.sync.read(fs.readFileSync(p));
}
// nearest-neighbour resize to w x h, returns Uint8 RGBA
function resize(img, w, h) {
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const sy = Math.min(img.height - 1, (y / h * img.height) | 0);
    for (let x = 0; x < w; x++) {
      const sx = Math.min(img.width - 1, (x / w * img.width) | 0);
      const si = (sy * img.width + sx) * 4;
      const di = (y * w + x) * 4;
      out[di] = img.data[si];
      out[di + 1] = img.data[si + 1];
      out[di + 2] = img.data[si + 2];
      out[di + 3] = 255;
    }
  }
  return out;
}

const base = load(process.argv[2]);
const varimg = load(process.argv[3]);
const W = 480,
  H = 250;
const a = resize(base, W, H);
const b = resize(varimg, W, H);

// per-cell mean abs diff
const gx = 24,
  gy = 12,
  cw = W / gx,
  ch = H / gy;
const cells = [];
let total = 0,
  n = 0;
for (let cy = 0; cy < gy; cy++) {
  let row = "";
  for (let cx = 0; cx < gx; cx++) {
    let s = 0,
      c = 0;
    for (let yy = 0; yy < ch; yy++)
      for (let xx = 0; xx < cw; xx++) {
        const px = (cx * cw + xx) | 0,
          py = (cy * ch + yy) | 0;
        const k = (py * W + px) * 4;
        s += Math.abs(a[k] - b[k]) + Math.abs(a[k + 1] - b[k + 1]) + Math.abs(a[k + 2] - b[k + 2]);
        c++;
      }
    const m = s / c / 3;
    cells.push({ cx, cy, m });
    total += m;
    n++;
    row += m > 60 ? "#" : m > 30 ? "+" : m > 15 ? "." : " ";
  }
  console.log(row);
}
const avg = total / n;
const strong = cells.filter((c) => c.m > 60).length;
const mid = cells.filter((c) => c.m > 30).length;
console.log("---");
console.log("avg cell diff:", avg.toFixed(1), "| strong(>60):", strong, "| mid(>30):", mid, "of", n, "cells");
