const D = 3.8;
const FRONT = { cx: 1690, cy: 1110, r: 840, dir: [0, 0, 1] };
const FRONT_BACK = { cx: 1690, cy: 1110, r: 840, dir: [0, 0, -1] };
// Trionda Final is a different ball: black panels and gold, its own photo.
const FINAL = { cx: 800, cy: 470, r: 373, dir: [0, 0, 1] };
const FINAL_BACK = { cx: 800, cy: 470, r: 373, dir: [0, 0, -1] };
const CAMERA_DISTANCE = D;

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("ball photo failed"));
    img.src = url;
  });
}

function sample(data, w, h, x, y) {
  if (x < 0 || y < 0 || x >= w - 1 || y >= h - 1) return null;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = x - x0;
  const ty = y - y0;
  const at = (ix, iy) => {
    const i = (iy * w + ix) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const a = at(x0, y0);
  const b = at(x0 + 1, y0);
  const c = at(x0, y0 + 1);
  const d = at(x0 + 1, y0 + 1);
  const mix = (i) =>
    a[i] * (1 - tx) * (1 - ty) +
    b[i] * tx * (1 - ty) +
    c[i] * (1 - tx) * ty +
    d[i] * tx * ty;
  return [mix(0), mix(1), mix(2)];
}

function viewOf(photo) {
  const [dx, dy, dz] = photo.dir;
  const D = CAMERA_DISTANCE;
  const tanAlpha = 1 / Math.sqrt(D * D - 1);
  const zCut = 1 / D;
  const lx = -dx;
  const ly = -dy;
  const lz = -dz;
  const rx = ly * 0 - lz * 1;
  const ry = lz * 0 - lx * 0;
  const rz = lx * 1 - ly * 0;
  return { D, tanAlpha, zCut, rx, ry, rz, dx, dy, dz, ring: Math.sqrt(1 - zCut * zCut) };
}

async function pixels(url) {
  const img = await loadImage(url);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const g = canvas.getContext("2d", { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  return {
    data: g.getImageData(0, 0, img.width, img.height).data,
    w: img.width,
    h: img.height,
  };
}

function lookup(view, photo, px, X, Y, Z) {
  const facing = X * view.dx + Y * view.dy + Z * view.dz;
  const forward = view.D - facing;
  if (forward < 0.2) return null;
  const ix = (X * view.rx + Y * view.ry + Z * view.rz) / forward / view.tanAlpha;
  const iy = Y / forward / view.tanAlpha;
  let rgb = sample(px.data, px.w, px.h, photo.cx + ix * photo.r, photo.cy - iy * photo.r);
  if (!rgb) return null;
  if (photo.gain) {
    rgb = [
      Math.min(255, rgb[0] * photo.gain[0]),
      Math.min(255, rgb[1] * photo.gain[1]),
      Math.min(255, rgb[2] * photo.gain[2]),
    ];
  }
  return { rgb, facing, disk: ix * ix + iy * iy };
}

function rim(view, photo, px, X, Y, Z) {
  const facing = X * view.dx + Y * view.dy + Z * view.dz;
  let px_ = X - view.dx * facing;
  let py_ = Y - view.dy * facing;
  let pz_ = Z - view.dz * facing;
  const len = Math.hypot(px_, py_, pz_) || 1;
  return lookup(
    view,
    photo,
    px,
    view.dx * view.zCut + (px_ / len) * view.ring,
    view.dy * view.zCut + (py_ / len) * view.ring,
    view.dz * view.zCut + (pz_ / len) * view.ring
  );
}

function paint(views) {
  const W = 2048;
  const H = 1024;
  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const image = out.getContext("2d").getImageData(0, 0, W, H);
  const od = image.data;

  for (let y = 0; y < H; y++) {
    const phi = (y / (H - 1)) * Math.PI;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    for (let x = 0; x < W; x++) {
      const theta = (x / W) * Math.PI * 2;
      const X = -Math.cos(theta) * sinPhi;
      const Y = cosPhi;
      const Z = Math.sin(theta) * sinPhi;
      const hits = [];
      for (const v of views) {
        const hit = lookup(v.view, v.photo, v.px, X, Y, Z);
        if (hit && hit.facing >= v.view.zCut && hit.disk <= 1) hits.push(hit);
      }
      let rgb;
      if (hits.length) {
        let wsum = 0;
        rgb = [0, 0, 0];
        for (const hit of hits) {
          const w = Math.max(0.04, 1 - hit.disk);
          wsum += w;
          rgb[0] += hit.rgb[0] * w;
          rgb[1] += hit.rgb[1] * w;
          rgb[2] += hit.rgb[2] * w;
        }
        rgb = [rgb[0] / wsum, rgb[1] / wsum, rgb[2] / wsum];
      } else {
        let wsum = 0;
        rgb = [0, 0, 0];
        for (const v of views) {
          const facing = X * v.view.dx + Y * v.view.dy + Z * v.view.dz;
          const edge = rim(v.view, v.photo, v.px, X, Y, Z);
          if (!edge) continue;
          const w = Math.exp(facing * 6);
          wsum += w;
          rgb[0] += edge.rgb[0] * w;
          rgb[1] += edge.rgb[1] * w;
          rgb[2] += edge.rgb[2] * w;
        }
        rgb = wsum ? [rgb[0] / wsum, rgb[1] / wsum, rgb[2] / wsum] : [218, 220, 218];
      }
      const i = (y * W + x) * 4;
      od[i] = rgb[0];
      od[i + 1] = rgb[1];
      od[i + 2] = rgb[2];
      od[i + 3] = 255;
    }
  }

  out.getContext("2d").putImageData(image, 0, 0);
  return out;
}

export async function projectBallTexture() {
  const px = await pixels("/ball.jpg");
  return paint([
    { view: viewOf(FRONT), photo: FRONT, px },
    { view: viewOf(FRONT_BACK), photo: FRONT_BACK, px },
  ]);
}

export async function projectFinalTexture() {
  const px = await pixels("/ball-final.jpg");
  return paint([
    { view: viewOf(FINAL), photo: FINAL, px },
    { view: viewOf(FINAL_BACK), photo: FINAL_BACK, px },
  ]);
}
