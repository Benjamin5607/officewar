// Render detected hotspots as circles over the variant, for visual QA.
// Usage: node tools/debug_hotspots.js sdv_office_1
const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const IMG_DIR = path.join(__dirname, "..", "games", "puzzle", "img");
const key = process.argv[2];
const data = JSON.parse(fs.readFileSync(path.join(IMG_DIR, "hotspots.json")));
const rec = data[key];
if (!rec) { console.log("no key " + key); process.exit(1); }

const png = PNG.sync.read(fs.readFileSync(path.join(IMG_DIR, rec.variant)));
const { width: w, height: h } = png;

function ring(cx, cy, r) {
  for (let t = 0; t < 360; t += 1) {
    for (let rr = r - 2; rr <= r + 2; rr++) {
      const x = Math.round(cx + rr * Math.cos((t * Math.PI) / 180));
      const y = Math.round(cy + rr * Math.sin((t * Math.PI) / 180));
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const i = (y * w + x) * 4;
      png.data[i] = 255; png.data[i + 1] = 40; png.data[i + 2] = 40; png.data[i + 3] = 255;
    }
  }
}
rec.spots.forEach((s) => ring(s.x * w, s.y * h, s.r * w));
const out = path.join(IMG_DIR, "_dbg_" + key + ".png");
fs.writeFileSync(out, PNG.sync.write(png));
console.log("wrote " + out + " (" + rec.spots.length + " spots)");
