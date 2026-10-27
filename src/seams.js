import * as THREE from "three";

const W = 2048;
const H = 1024;

function curve(pts, steps = 56) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i += 3) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const p2 = pts[i + 2];
    const p3 = pts[i + 3];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const mt = 1 - t;
      out.push([
        mt * mt * mt * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t * t * t * p3[0],
        mt * mt * mt * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t * t * t * p3[1],
      ]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function faceSeams(cx, cy) {
  return [
    curve([
      [cx - 430, cy - 250],
      [cx - 180, cy - 310],
      [cx + 80, cy - 180],
      [cx + 300, cy - 40],
      [cx + 460, cy + 80],
      [cx + 380, cy + 220],
      [cx + 140, cy + 300],
    ]),
    curve([
      [cx - 480, cy + 20],
      [cx - 240, cy + 90],
      [cx - 20, cy + 40],
      [cx + 180, cy + 110],
      [cx + 360, cy + 200],
      [cx + 300, cy + 340],
      [cx + 40, cy + 390],
    ]),
    curve([
      [cx - 80, cy - 360],
      [cx + 40, cy - 220],
      [cx - 40, cy - 40],
      [cx + 80, cy + 120],
      [cx + 200, cy + 260],
      [cx + 80, cy + 400],
      [cx - 60, cy + 460],
    ]),
  ];
}

export function seamLines() {
  return [...faceSeams(W * 0.25, H * 0.5), ...faceSeams(W * 0.75, H * 0.5)];
}

function strokeLine(ctx, line, width, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  line.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.stroke();
  ctx.restore();
}

export function paintSeams(ctx) {
  for (const line of seamLines()) {
    strokeLine(ctx, line, 22, "rgba(20, 20, 18, 0.22)");
    strokeLine(ctx, line, 9, "rgba(255, 255, 255, 0.42)");
    strokeLine(ctx, line, 2.4, "rgba(28, 28, 26, 0.92)");
  }
}

function buildField() {
  const fw = 640;
  const fh = 320;
  const dist = new Float32Array(fw * fh);
  dist.fill(999);
  const reach = 14;
  for (const line of seamLines()) {
    for (let i = 1; i < line.length; i++) {
      const a = line[i - 1];
      const b = line[i];
      const steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const x = ((a[0] + (b[0] - a[0]) * t) / W) * fw;
        const y = ((a[1] + (b[1] - a[1]) * t) / H) * fh;
        const x0 = Math.floor(x - reach);
        const x1 = Math.ceil(x + reach);
        const y0 = Math.max(0, Math.floor(y - reach));
        const y1 = Math.min(fh - 1, Math.ceil(y + reach));
        for (let iy = y0; iy <= y1; iy++) {
          for (let ix = x0; ix <= x1; ix++) {
            const d = Math.hypot(ix - x, iy - y);
            if (d > reach) continue;
            const wx = ((ix % fw) + fw) % fw;
            const k = iy * fw + wx;
            if (d < dist[k]) dist[k] = d;
          }
        }
      }
    }
  }
  return { dist, fw, fh };
}

function sample(field, u, threeV) {
  const { dist, fw, fh } = field;
  const x = u * fw;
  const y = (1 - threeV) * fh;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = x - x0;
  const ty = y - y0;
  const at = (ix, iy) => {
    if (iy < 0 || iy >= fh) return 999;
    const wx = ((ix % fw) + fw) % fw;
    return dist[iy * fw + wx];
  };
  const d00 = at(x0, y0);
  const d10 = at(x0 + 1, y0);
  const d01 = at(x0, y0 + 1);
  const d11 = at(x0 + 1, y0 + 1);
  return d00 * (1 - tx) * (1 - ty) + d10 * tx * (1 - ty) + d01 * (1 - tx) * ty + d11 * tx * ty;
}

function profile(dPx) {
  if (dPx > 12) return 0.004;
  const width = 4.6;
  let inset = 0;
  if (dPx < width) {
    const t = dPx / width;
    const belly = Math.cos(t * Math.PI * 0.5);
    inset = belly * belly * 0.038;
    if (dPx < 0.9) inset += 0.014 * (1 - dPx / 0.9);
  }
  const lip = Math.exp(-((dPx - width) * (dPx - width)) / 2.4) * 0.008;
  return lip - inset;
}

export function carveSphere(geo) {
  const field = buildField();
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const normal = geo.attributes.normal;
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    const d = sample(field, uv.getX(i), uv.getY(i));
    const y = pos.getY(i);
    const pole = Math.sin(Math.acos(Math.max(-1, Math.min(1, y))));
    const fade = Math.min(1, pole / 0.22);
    const offset = profile(d) * fade;
    v.fromBufferAttribute(pos, i);
    n.fromBufferAttribute(normal, i);
    v.addScaledVector(n, offset);
    pos.setXYZ(i, v.x, v.y, v.z);
  }

  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}
