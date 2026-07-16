// Spot-the-difference hotspot generator.
//
// For every variant image (sdv_<scene>_<n>.png) it finds the matching base
// scene (sd_<scene>.png), diffs them, and auto-detects the changed regions.
// Those regions become the "differences" the player must find, so the hotspots
// ALWAYS match the actual art (no hand-placed coordinates).
//
// Usage: node tools/gen_hotspots.js [srcDir]
//   srcDir = folder that contains freshly generated sdv_*.png (default: the
//            Cursor assets folder). Variants are copied into games/puzzle/img.
//
// Output: games/puzzle/img/hotspots.json

const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const IMG_DIR = path.join(__dirname, "..", "games", "puzzle", "img");
const OUT = path.join(IMG_DIR, "hotspots.json");

// detection resolution (aspect close to the scenes' 3:2)
const W = 480;
const H = 320;

// tuning
const BLUR_R = 5;        // box-blur radius (px) to merge nearby changed pixels
const THRESH = 18;       // blurred mean-abs-diff threshold for "changed"
const MIN_AREA = 80;     // min blob area in px (at WxH) to count as a difference
const MAX_HOTSPOTS = 5;  // cap per pair
const MIN_SEP = 42;      // min centroid separation (px) between kept blobs
const PEAK_MIN = 30;     // blob must contain a strongly-changed pixel (drops relight haze)
const MAX_AREA_FRAC = 0.09; // reject blobs bigger than this frac of image (global recolors)

function load(p) {
  return PNG.sync.read(fs.readFileSync(p));
}

// nearest-neighbour resize -> Float32 grayscale-ish RGB kept as 3 arrays
function resizeRGB(img, w, h) {
  const out = new Uint8ClampedArray(w * h * 3);
  for (let y = 0; y < h; y++) {
    const sy = Math.min(img.height - 1, ((y / h) * img.height) | 0);
    for (let x = 0; x < w; x++) {
      const sx = Math.min(img.width - 1, ((x / w) * img.width) | 0);
      const si = (sy * img.width + sx) * 4;
      const di = (y * w + x) * 3;
      out[di] = img.data[si];
      out[di + 1] = img.data[si + 1];
      out[di + 2] = img.data[si + 2];
    }
  }
  return out;
}

function boxBlur(src, w, h, r) {
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  // horizontal
  for (let y = 0; y < h; y++) {
    let sum = 0;
    for (let x = -r; x <= r; x++) sum += src[y * w + Math.max(0, Math.min(w - 1, x))];
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = sum / (2 * r + 1);
      const add = src[y * w + Math.min(w - 1, x + r + 1)];
      const sub = src[y * w + Math.max(0, x - r)];
      sum += add - sub;
    }
  }
  // vertical
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = -r; y <= r; y++) sum += tmp[Math.max(0, Math.min(h - 1, y)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = sum / (2 * r + 1);
      const add = tmp[Math.min(h - 1, y + r + 1) * w + x];
      const sub = tmp[Math.max(0, y - r) * w + x];
      sum += add - sub;
    }
  }
  return out;
}

// connected components (8-connectivity) on a boolean mask
function components(mask, w, h) {
  const label = new Int32Array(w * h).fill(0);
  const blobs = [];
  const stack = [];
  let cur = 0;
  for (let i = 0; i < w * h; i++) {
    if (!mask[i] || label[i]) continue;
    cur++;
    let minx = w, miny = h, maxx = 0, maxy = 0, area = 0, sx = 0, sy = 0;
    stack.push(i);
    label[i] = cur;
    while (stack.length) {
      const p = stack.pop();
      const px = p % w, py = (p / w) | 0;
      area++; sx += px; sy += py;
      if (px < minx) minx = px; if (px > maxx) maxx = px;
      if (py < miny) miny = py; if (py > maxy) maxy = py;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = px + dx, ny = py + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const np = ny * w + nx;
          if (mask[np] && !label[np]) { label[np] = cur; stack.push(np); }
        }
    }
    blobs.push({ minx, miny, maxx, maxy, area, cx: sx / area, cy: sy / area });
  }
  return blobs;
}

function detect(baseImg, varImg) {
  const a = resizeRGB(baseImg, W, H);
  const b = resizeRGB(varImg, W, H);
  const diff = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const k = i * 3;
    diff[i] = (Math.abs(a[k] - b[k]) + Math.abs(a[k + 1] - b[k + 1]) + Math.abs(a[k + 2] - b[k + 2])) / 3;
  }
  const blur = boxBlur(diff, W, H, BLUR_R);
  const mask = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) mask[i] = blur[i] > THRESH ? 1 : 0;

  const maxArea = MAX_AREA_FRAC * W * H;
  let blobs = components(mask, W, H).filter(
    (bl) => bl.area >= MIN_AREA && bl.area <= maxArea
  );
  // score by peak diff * area
  blobs.forEach((bl) => {
    let peak = 0;
    for (let y = bl.miny; y <= bl.maxy; y++)
      for (let x = bl.minx; x <= bl.maxx; x++) {
        const v = blur[y * W + x];
        if (v > peak) peak = v;
      }
    bl.score = bl.area * peak;
    bl.peak = peak;
  });
  // require a genuinely strong change (removes diffuse relight/gradient noise)
  blobs = blobs.filter((bl) => bl.peak >= PEAK_MIN);
  blobs.sort((p, q) => q.score - p.score);

  // greedily keep well-separated blobs
  const kept = [];
  for (const bl of blobs) {
    if (kept.some((k) => Math.hypot(k.cx - bl.cx, k.cy - bl.cy) < MIN_SEP)) continue;
    kept.push(bl);
    if (kept.length >= MAX_HOTSPOTS) break;
  }

  // normalized circle hotspots (radius clamped so nothing is huge/tiny)
  const RMIN = 0.035, RMAX = 0.075; // fraction of width
  return kept.map((bl) => {
    const bw = bl.maxx - bl.minx, bh = bl.maxy - bl.miny;
    let r = (Math.max(bw, bh) / 2 + 6) / W;
    r = Math.max(RMIN, Math.min(RMAX, r));
    return {
      x: +((bl.minx + bw / 2) / W).toFixed(4),
      y: +((bl.miny + bh / 2) / H).toFixed(4),
      r: +r.toFixed(4),
    };
  });
}

function main() {
  const srcDir =
    process.argv[2] ||
    path.join(
      require("os").homedir(),
      ".cursor",
      "projects",
      "c-Users-wonbi-office-war-series",
      "assets"
    );
  let srcFiles = [];
  try {
    srcFiles = fs.readdirSync(srcDir).filter((f) => /^sdv_.*\.png$/i.test(f));
  } catch (e) {
    console.log("(no src dir " + srcDir + ")");
  }
  // copy fresh variants into img dir
  for (const f of srcFiles) {
    fs.copyFileSync(path.join(srcDir, f), path.join(IMG_DIR, f));
  }
  // now enumerate all variants present in img dir
  const variants = fs.readdirSync(IMG_DIR).filter((f) => /^sdv_.*\.png$/i.test(f));
  const bases = {};
  const result = {};
  let count = 0;
  for (const vf of variants) {
    const m = vf.match(/^sdv_([a-z]+)_(\d+)\.png$/i);
    if (!m) continue;
    const scene = m[1];
    const basePath = path.join(IMG_DIR, "sd_" + scene + ".png");
    if (!fs.existsSync(basePath)) {
      console.log("!! no base for " + vf);
      continue;
    }
    if (!bases[scene]) bases[scene] = load(basePath);
    const hs = detect(bases[scene], load(path.join(IMG_DIR, vf)));
    const key = vf.replace(/\.png$/i, "");
    result[key] = { base: "sd_" + scene + ".png", variant: vf, scene, spots: hs };
    console.log(vf + " -> " + hs.length + " hotspots");
    count++;
  }
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
  // Also emit a plain-JS version so the game can load it via a <script> tag —
  // fetch() of a local JSON fails over file:// (and without a running server),
  // but a script global works everywhere.
  const jsPath = path.join(IMG_DIR, "hotspots.js");
  fs.writeFileSync(jsPath, "window.DIFF_HOTSPOTS = " + JSON.stringify(result) + ";\n");
  console.log(
    "copied " + srcFiles.length + " new variants; wrote " + count + " pairs to " + OUT + " and " + jsPath
  );
}

main();
