/* Knock out the near-uniform background of generated sprites to true alpha.
   Edge flood-fill: only removes background-colored pixels reachable from the
   image border, so interior whites (shirts, mugs) enclosed by the character's
   dark outline are preserved. Outputs RGBA PNGs in place.
   Usage: node tools/alpha_key.js games/fighting/img/fb_*.png            */
const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

function process(file, opts) {
  const buf = fs.readFileSync(file);
  const png = PNG.sync.read(buf);
  const { width: w, height: h, data } = png; // RGBA already after sync.read
  const idx = (x, y) => (y * w + x) * 4;

  // sample background color from the four corners (median-ish average)
  const corners = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
    [(w / 2) | 0, 0],
    [(w / 2) | 0, h - 1],
  ];
  let br = 0,
    bg = 0,
    bb = 0;
  for (const [x, y] of corners) {
    const i = idx(x, y);
    br += data[i];
    bg += data[i + 1];
    bb += data[i + 2];
  }
  br /= corners.length;
  bg /= corners.length;
  bb /= corners.length;

  const tol = opts.tol; // color distance tolerance
  const near = (i) => {
    const dr = data[i] - br,
      dg = data[i + 1] - bg,
      db = data[i + 2] - bb;
    if (dr * dr + dg * dg + db * db <= tol * tol) return true;
    // also treat very light, low-saturation pixels as bg (flattened checker)
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    const mx = Math.max(r, g, b),
      mn = Math.min(r, g, b);
    return mn >= 232 && mx - mn <= 16;
  };

  const visited = new Uint8Array(w * h);
  const stack = [];
  const pushEdge = (x, y) => {
    const p = y * w + x;
    if (!visited[p]) {
      visited[p] = 1;
      stack.push(p);
    }
  };
  for (let x = 0; x < w; x++) {
    pushEdge(x, 0);
    pushEdge(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    pushEdge(0, y);
    pushEdge(w - 1, y);
  }

  let removed = 0;
  const clear = new Uint8Array(w * h); // pixels to make transparent
  while (stack.length) {
    const p = stack.pop();
    const i = p * 4;
    if (!near(i)) continue; // boundary: character pixel, stop
    clear[p] = 1;
    removed++;
    const x = p % w,
      y = (p / w) | 0;
    if (x > 0 && !visited[p - 1]) {
      visited[p - 1] = 1;
      stack.push(p - 1);
    }
    if (x < w - 1 && !visited[p + 1]) {
      visited[p + 1] = 1;
      stack.push(p + 1);
    }
    if (y > 0 && !visited[p - w]) {
      visited[p - w] = 1;
      stack.push(p - w);
    }
    if (y < h - 1 && !visited[p + w]) {
      visited[p + w] = 1;
      stack.push(p + w);
    }
  }

  // apply alpha
  for (let p = 0; p < w * h; p++) if (clear[p]) data[p * 4 + 3] = 0;

  // 1px alpha feather on the character boundary to soften white fringing
  const out = Buffer.from(data);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (data[p * 4 + 3] === 0) continue; // already transparent
      // if this opaque pixel is adjacent to a cleared pixel and is light, dim it
      let edge = false;
      if (x > 0 && clear[p - 1]) edge = true;
      else if (x < w - 1 && clear[p + 1]) edge = true;
      else if (y > 0 && clear[p - w]) edge = true;
      else if (y < h - 1 && clear[p + w]) edge = true;
      if (edge) {
        const i = p * 4;
        const mn = Math.min(out[i], out[i + 1], out[i + 2]);
        if (mn >= 210) out[i + 3] = 90; // fade only near-white fringe
      }
    }
  }
  png.data = out;
  fs.writeFileSync(file, PNG.sync.write(png));
  console.log(path.basename(file), `bg≈(${br | 0},${bg | 0},${bb | 0})`, "removed", removed, "px", `${((removed / (w * h)) * 100).toFixed(1)}%`);
}

const groups = [
  { dir: "games/fighting/img", prefixes: ["fb_", "fa_"] },
  { dir: "games/horror/img", prefixes: ["hz_"] },
  { dir: "games/rpg/img", prefixes: ["rp_"] },
];
const tol = 42;
let total = 0;
for (const g of groups) {
  const files = fs
    .readdirSync(g.dir)
    .filter((f) => f.endsWith(".png") && g.prefixes.some((p) => f.startsWith(p)))
    .map((f) => path.join(g.dir, f));
  for (const f of files) process(f, { tol });
  total += files.length;
}
console.log("done:", total, "files");
