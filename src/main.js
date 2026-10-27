import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { projectBallTexture, projectFinalTexture } from "./photo.js";

const CHAPTERS = [
  {
    rot: 0,
    kicker: "КУБОК МИРА",
    title: "48 СБОРНЫХ.<br />3 СТРАНЫ.<br />1 МЯЧ.",
    lead: "Trionda — официальный мяч чемпионата. Рисунок повторяет волну «ла ола»: три страны, один узор.",
  },
  {
    rot: 0.16,
    kicker: "ВОЛНА",
    title: "ЧЕТЫРЕ ПАНЕЛИ.<br />ОДНА ВОЛНА.",
    lead: "В названии три волны. Четыре панели сходятся треугольником: США, Канада и Мексика на одном мяче.",
  },
  {
    rot: -0.18,
    kicker: "ТРИ ХОЗЯИНА",
    title: "КРАСНЫЙ. СИНИЙ.<br />ЗЕЛЁНЫЙ.",
    lead: "Кленовый лист — Канада, звезда — США, орёл — Мексика. Золотые линии ведут к кубку.",
  },
  {
    rot: 0.1,
    kicker: "TRIONDA PRO",
    title: "СОБРАН ДЛЯ<br />ГЛАВНОЙ СЦЕНЫ.",
    lead: "Глубокие швы держат полёт. Тиснение не скользит под дождём. В матчевом мяче датчик 500 Гц, он сразу говорит с судьями.",
  },
  {
    rot: 0,
    final: true,
    kicker: "ФИНАЛ",
    title: "TRIONDA<br />FINAL.",
    lead: "Финальный мяч чемпионата. Чёрные панели, золото и белая основа. Тот же крой, другой рисунок.",
  },
];

const W = 2048;
const H = 1024;

const $ = (id) => document.getElementById(id);

function startCrowd() {
  if (startCrowd.started) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  startCrowd.started = true;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0.42;
  master.connect(ctx.destination);

  const fadeEdges = (buf, ms) => {
    const n = Math.min(buf.length - 1, Math.floor(buf.sampleRate * ms / 1000));
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < n; i++) {
        const g = i / n;
        d[i] *= g;
        d[d.length - 1 - i] *= g;
      }
    }
  };

  const load = (url) =>
    fetch(url)
      .then((res) => res.arrayBuffer())
      .then((raw) => ctx.decodeAudioData(raw));

  const asset = (path) => `${import.meta.env.BASE_URL}${path}`;
  Promise.all([load(asset("audio/crowd.wav")), load(asset("audio/fans.mp3"))])
    .then(([bedBuf, fansBuf]) => {
      fadeEdges(bedBuf, 180);
      fadeEdges(fansBuf, 40);
      const bed = ctx.createBufferSource();
      bed.buffer = bedBuf;
      bed.loop = true;
      const bedGain = ctx.createGain();
      bedGain.gain.value = 0.16;
      bed.connect(bedGain);
      bedGain.connect(master);
      bed.start();

      const fans = ctx.createBufferSource();
      fans.buffer = fansBuf;
      fans.loop = true;
      const fansGain = ctx.createGain();
      fansGain.gain.value = 0.55;
      fans.connect(fansGain);
      fansGain.connect(master);
      fans.start();

      startCrowd.playCheer = () => {
        const src = ctx.createBufferSource();
        src.buffer = fansBuf;
        const burst = ctx.createGain();
        burst.gain.value = 1.25;
        src.connect(burst);
        burst.connect(master);
        src.start();
      };
    })
    .catch(() => {
      startCrowd.started = false;
    });
  ctx.resume();
}

window.addEventListener("pointerdown", startCrowd);

function blob(pts) {
  const p = new Path2D();
  const n = pts.length;
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    p.bezierCurveTo(
      p1[0] + (p2[0] - p0[0]) / 6,
      p1[1] + (p2[1] - p0[1]) / 6,
      p2[0] - (p3[0] - p1[0]) / 6,
      p2[1] - (p3[1] - p1[1]) / 6,
      p2[0],
      p2[1]
    );
  }
  p.closePath();
  return p;
}

function shift(pts, x, y) {
  return pts.map(([px, py]) => [px + x, py + y]);
}

function starPath(x, y, r, inner = 0.42) {
  const p = new Path2D();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * (Math.PI / 5);
    const rr = i % 2 ? r * inner : r;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) p.moveTo(px, py);
    else p.lineTo(px, py);
  }
  p.closePath();
  return p;
}

function maplePath(x, y, s) {
  const p = new Path2D();
  const pts = [
    [0, -1.15], [0.18, -0.72], [0.55, -0.82], [0.38, -0.42],
    [0.95, -0.28], [0.42, -0.05], [0.72, 0.38], [0.22, 0.22],
    [0.12, 0.72], [0, 0.28],
    [-0.12, 0.72], [-0.22, 0.22], [-0.72, 0.38], [-0.42, -0.05],
    [-0.95, -0.28], [-0.38, -0.42], [-0.55, -0.82], [-0.18, -0.72],
  ];
  pts.forEach(([px, py], i) => {
    const X = x + px * s;
    const Y = y + py * s;
    if (i === 0) p.moveTo(X, Y);
    else p.lineTo(X, Y);
  });
  p.closePath();
  return p;
}

function eaglePath(x, y, s) {
  const p = new Path2D();
  p.moveTo(x, y - 0.15 * s);
  p.bezierCurveTo(x + 0.35 * s, y - 0.55 * s, x + 1.05 * s, y - 0.15 * s, x + 1.15 * s, y + 0.05 * s);
  p.bezierCurveTo(x + 0.7 * s, y + 0.02 * s, x + 0.35 * s, y + 0.18 * s, x, y + 0.08 * s);
  p.bezierCurveTo(x - 0.35 * s, y + 0.18 * s, x - 0.7 * s, y + 0.02 * s, x - 1.15 * s, y + 0.05 * s);
  p.bezierCurveTo(x - 1.05 * s, y - 0.15 * s, x - 0.35 * s, y - 0.55 * s, x, y - 0.15 * s);
  p.moveTo(x, y + 0.05 * s);
  p.lineTo(x, y + 0.55 * s);
  return p;
}

function paintBoth(g, b, draw) {
  draw(g, false);
  draw(b, true);
}

function fillShape(g, b, path, color, height) {
  g.save();
  g.fillStyle = color;
  g.fill(path);
  g.restore();
  b.save();
  b.fillStyle = height;
  b.fill(path);
  b.restore();
}

function strokeShape(g, b, path, color, width, height, hWidth) {
  g.save();
  g.strokeStyle = color;
  g.lineWidth = width;
  g.lineJoin = "round";
  g.lineCap = "round";
  g.stroke(path);
  g.restore();
  b.save();
  b.strokeStyle = height;
  b.lineWidth = hWidth;
  b.lineJoin = "round";
  b.lineCap = "round";
  b.stroke(path);
  b.restore();
}

function hatch(ctx, color, gap, angle, alpha) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 2;
  ctx.translate(W / 2, H / 2);
  ctx.rotate(angle);
  for (let y = -H * 1.4; y < H * 1.4; y += gap) {
    ctx.beginPath();
    ctx.moveTo(-W, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();
}

function topo(ctx, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.7;
  ctx.globalAlpha = 0.8;
  for (let i = 0; i < 46; i++) {
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const y =
        i * 18 +
        Math.sin(x * 0.018 + i * 0.55) * 12 +
        Math.sin(x * 0.006 + i) * 26;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function clipDraw(g, b, path, fn) {
  g.save();
  g.clip(path);
  b.save();
  b.clip(path);
  fn(g, b);
  b.restore();
  g.restore();
}

function stripes(g, b, x, y, rot) {
  paintBoth(g, b, (ctx, isH) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = isH ? "#e8e8e8" : "#ffffff";
    for (const bx of [-78, 0, 78]) {
      ctx.beginPath();
      ctx.roundRect(bx - 16, -78, 32, 168, 9);
      ctx.fill();
    }
    ctx.restore();
  });
}

function label(g, b, text, x, y, font, rot, color = "#ffffff") {
  paintBoth(g, b, (ctx, isH) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = isH ? "#cfcfcf" : color;
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 0, 0);
    ctx.restore();
  });
}

function specks(g, b, path, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    pts.push([Math.random() * W, Math.random() * H, 0.4 + Math.random() * 1.6]);
  }
  g.save();
  g.clip(path);
  b.save();
  b.clip(path);
  for (const [x, y, r] of pts) {
    g.fillStyle = `rgba(227, 195, 122, ${0.35 + Math.random() * 0.55})`;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
    b.fillStyle = "#dddddd";
    b.beginPath();
    b.arc(x, y, r, 0, Math.PI * 2);
    b.fill();
  }
  b.restore();
  g.restore();
}

function drawFace(g, b, cx, cy, variant) {
  const bluePts = shift(
    variant === 0
      ? [
          [-420, -30],
          [-300, -190],
          [-40, -250],
          [220, -210],
          [340, -60],
          [260, 70],
          [40, 30],
          [-160, 50],
          [-340, 40],
        ]
      : [
          [-200, -230],
          [40, -250],
          [230, -140],
          [180, 10],
          [20, 40],
          [-180, -20],
          [-250, -120],
        ],
    cx,
    cy
  );
  const redPts = shift(
    variant === 0
      ? [
          [80, 90],
          [280, 40],
          [460, 150],
          [420, 320],
          [200, 370],
          [20, 250],
          [10, 150],
        ]
      : [
          [-40, 20],
          [180, -10],
          [340, 110],
          [300, 280],
          [80, 320],
          [-80, 180],
        ],
    cx,
    cy
  );
  const greenPts = shift(
    variant === 0
      ? [
          [-460, 80],
          [-280, 150],
          [-120, 250],
          [-200, 360],
          [-390, 330],
          [-480, 180],
        ]
      : [
          [-430, -40],
          [-180, 20],
          [-40, 160],
          [-120, 300],
          [-320, 340],
          [-470, 180],
          [-490, 40],
        ],
    cx,
    cy
  );

  const blue = blob(bluePts);
  const red = blob(redPts);
  const green = blob(greenPts);

  const blueGrad = g.createLinearGradient(cx - 200, cy - 220, cx + 180, cy + 80);
  blueGrad.addColorStop(0, "#2f7fe0");
  blueGrad.addColorStop(0.5, "#1558c4");
  blueGrad.addColorStop(1, "#0c3f96");
  const redGrad = g.createLinearGradient(cx, cy, cx + 300, cy + 280);
  redGrad.addColorStop(0, "#ff3b2e");
  redGrad.addColorStop(1, "#c11212");
  const greenGrad = g.createLinearGradient(cx - 400, cy + 40, cx - 80, cy + 300);
  greenGrad.addColorStop(0, "#2fbe55");
  greenGrad.addColorStop(1, "#0d7a32");

  fillShape(g, b, green, greenGrad, "#9a9a9a");
  fillShape(g, b, red, redGrad, "#9c9c9c");
  fillShape(g, b, blue, blueGrad, "#9e9e9e");

  clipDraw(g, b, blue, (cg, cb) => {
    hatch(cg, "#d5e6ff", 8, -0.65, 0.55);
    hatch(cb, "#b8b8b8", 8, -0.65, 1);
  });
  clipDraw(g, b, red, (cg, cb) => {
    hatch(cg, "#6d0c10", 7, 0.9, 0.7);
    hatch(cb, "#bdbdbd", 7, 0.9, 1);
  });
  clipDraw(g, b, green, (cg, cb) => {
    topo(cg, "#083d18");
    topo(cb, "#bcbcbc");
  });

  specks(g, b, blue, 90);

  strokeShape(g, b, green, "#e3c37a", 7, "#d8d8d8", 4);
  strokeShape(g, b, red, "#e3c37a", 7, "#d8d8d8", 4);
  strokeShape(g, b, blue, "#e3c37a", 7, "#d8d8d8", 4);

  if (variant === 0) {
    const big = starPath(cx - 30, cy - 20, 58);
    const s2 = starPath(cx + 90, cy - 150, 26);
    const s3 = starPath(cx - 150, cy - 170, 16);
    fillShape(g, b, big, "#f7f9ff", "#c8c8c8");
    strokeShape(g, b, big, "#e3c37a", 3.5, "#dcdcdc", 2);
    fillShape(g, b, s2, "#ffffff", "#c8c8c8");
    fillShape(g, b, s3, "#e7f0ff", "#c4c4c4");
    clipDraw(g, b, red, () => {
      stripes(g, b, cx + 210, cy + 190, -0.7);
    });
    label(g, b, "26", cx - 250, cy - 70, 'italic 700 118px "Barlow Condensed", Impact, sans-serif', -0.08);
    label(g, b, "FIFA", cx - 246, cy + 2, '600 20px "Barlow Condensed", Impact, sans-serif', -0.08, "#f4f7ff");
  } else {
    const big = starPath(cx + 40, cy - 110, 54);
    fillShape(g, b, big, "#f7f9ff", "#c8c8c8");
    strokeShape(g, b, big, "#e3c37a", 3, "#dcdcdc", 2);
    clipDraw(g, b, red, () => {
      stripes(g, b, cx + 120, cy + 140, -0.55);
    });
    label(g, b, "TRIONDA", cx - 130, cy + 200, 'italic 700 64px "Barlow Condensed", Impact, sans-serif', -0.22);
    const leaf = maplePath(cx - 80, cy + 250, 16);
    fillShape(g, b, leaf, "rgba(255,255,255,0.92)", "#c6c6c6");
    const leaf2 = maplePath(cx + 300, cy + 40, 14);
    fillShape(g, b, leaf2, "rgba(255,255,255,0.9)", "#c6c6c6");
  }

}

function embossField(g, b) {
  for (let y = 28; y < H; y += 34) {
    for (let x = 18; x < W; x += 34) {
      const kind = ((x / 34) | 0) + ((y / 34) | 0);
      const mark = kind % 3;
      g.save();
      g.fillStyle = "rgba(90, 90, 90, 0.055)";
      g.translate(x, y);
      if (mark === 0) g.fill(starPath(0, 0, 5, 0.45));
      else if (mark === 1) g.fill(maplePath(0, 0, 5.5));
      else {
        g.beginPath();
        g.arc(0, 0, 2.2, 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
      b.save();
      b.fillStyle = "#8e8e8e";
      b.translate(x, y);
      if (mark === 0) b.fill(starPath(0, 0, 5, 0.45));
      else if (mark === 1) b.fill(maplePath(0, 0, 5.5));
      else {
        b.beginPath();
        b.arc(0, 0, 2.2, 0, Math.PI * 2);
        b.fill();
      }
      b.restore();
    }
  }
}

function noise(ctx, amount) {
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);
}

function normalsFrom(heightCanvas, strength) {
  const srcCtx = heightCanvas.getContext("2d", { willReadFrequently: true });
  const src = srcCtx.getImageData(0, 0, W, H).data;
  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const octx = out.getContext("2d");
  const img = octx.createImageData(W, H);
  const od = img.data;
  const sample = (x, y) => {
    x = (x + W) % W;
    if (y < 0) y = 0;
    if (y > H - 1) y = H - 1;
    return src[(y * W + x) * 4] / 255;
  };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = (sample(x + 1, y) - sample(x - 1, y)) * strength;
      const dy = (sample(x, y + 1) - sample(x, y - 1)) * strength;
      const nx = -dx;
      const ny = -dy;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz) || 1;
      const i = (y * W + x) * 4;
      od[i] = (nx / len * 0.5 + 0.5) * 255;
      od[i + 1] = (ny / len * 0.5 + 0.5) * 255;
      od[i + 2] = (nz / len * 0.5 + 0.5) * 255;
      od[i + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  return out;
}

function makeBallTextures() {
  const albedo = document.createElement("canvas");
  albedo.width = W;
  albedo.height = H;
  const g = albedo.getContext("2d", { willReadFrequently: true });

  const height = document.createElement("canvas");
  height.width = W;
  height.height = H;
  const b = height.getContext("2d", { willReadFrequently: true });

  const base = g.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, "#f7f7f5");
  base.addColorStop(0.5, "#ffffff");
  base.addColorStop(1, "#efefec");
  g.fillStyle = base;
  g.fillRect(0, 0, W, H);
  b.fillStyle = "#8c8c8c";
  b.fillRect(0, 0, W, H);

  embossField(g, b);
  drawFace(g, b, W * 0.25, H * 0.5, 0);
  drawFace(g, b, W * 0.75, H * 0.5, 1);

  // Accent ribbons that wrap each face without crossing the texture seam.
  const ribbon = (cx, color, yOff, amp) => {
    g.save();
    g.strokeStyle = color;
    g.lineWidth = 28;
    g.lineCap = "round";
    g.beginPath();
    const x0 = cx - 460;
    for (let i = 0; i <= 48; i++) {
      const t = i / 48;
      const x = x0 + t * 920;
      const y = H * 0.5 + yOff + Math.sin(t * Math.PI) * amp;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.globalAlpha = 0.95;
    g.stroke();
    g.restore();
  };
  ribbon(W * 0.25, "#c41616", 250, -30);
  ribbon(W * 0.25, "#147a38", 310, 20);
  ribbon(W * 0.75, "#1d4fae", -250, 40);

  noise(g, 6);
  paintSeams(g);

  return {
    albedo,
    normal: normalsFrom(height, 1.35),
  };
}

function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  const r = g.createRadialGradient(128, 128, 20, 128, 128, 120);
  r.addColorStop(0, "rgba(0,0,0,0.55)");
  r.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 256, 256);
  return c;
}

function softSprite() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d");
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)");
  r.addColorStop(0.35, "rgba(255,255,255,0.45)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function makeTrophy(map) {
  const img = map.image;
  const height = 1.48;
  const width = height * (img.width / img.height);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      map,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    })
  );
  mesh.position.y = height / 2;
  const g = new THREE.Group();
  g.add(mesh);
  g.userData.face = height / 2;
  return g;
}

function sitOnFloor(root, height) {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  root.scale.setScalar(height / Math.max(size.y, 1e-4));
  const fitted = new THREE.Box3().setFromObject(root);
  const center = fitted.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= fitted.min.y;
  const g = new THREE.Group();
  g.add(root);
  return g;
}

const KITS = [
  {
    id: "por",
    player: "RONALDO",
    number: "7",
    title: "Португалия",
    place: "1/8 финала",
    body: "#8d1c2e",
    wave: "rgba(92, 16, 32, 0.55)",
    trim: "#0c7a4e",
    gold: "#c6a15a",
    waves: true,
    path: "Группа K, 2-е место: 1:1 ДР Конго, 5:0 Узбекистан, 0:0 Колумбия. 6:1, 5 очков. 1/16 — 2:1 с Хорватией. 1/8 — 0:1 от Испании.",
    fact: "Роналду в 41 год сыграл на шестом чемпионате мира. Тренер — Роберто Мартинес. В группе Португалия разнесла Узбекистан 5:0.",
    squad: "Вратари: 1 Diogo Costa, 12 Jose Sa, 22 Rui Silva\nЗащита: 2 Nelson Semedo, 3 Ruben Dias, 4 Tomas Araujo, 5 Diogo Dalot, 13 Renato Veiga, 14 Goncalo Inacio, 20 Joao Cancelo, 25 Nuno Mendes\nПолузащита: 6 Matheus Nunes, 8 Bruno Fernandes, 10 Bernardo Silva, 15 Joao Neves, 21 Ruben Neves, 23 Vitinha, 24 Samu Costa\nНападение: 7 Cristiano Ronaldo, 9 Goncalo Ramos, 11 Joao Felix, 16 Trincao, 17 Rafael Leao, 18 Pedro Neto, 19 Goncalo Guedes, 26 Francisco Conceicao",
  },
  {
    id: "bra",
    player: "NEYMAR",
    number: "10",
    title: "Бразилия",
    place: "1/8 финала",
    body: "#ffe14a",
    trim: "#009739",
    gold: "#002776",
    path: "Группа C, 1-е место: 1:1 Марокко, 3:0 Гаити, 3:0 Шотландия. 7:1, 7 очков. 1/16 — 2:1 с Японией. 1/8 — 1:2 от Норвегии.",
    fact: "Тренер — Карло Анчелотти. В 1/8 Неймар забил с пенальти на 100-й минуте, Холанд ответил дублем.",
    squad: "Вратари: 1 Alisson, 12 Weverton, 23 Ederson\nЗащита: 3 Gabriel Magalhaes, 4 Marquinhos, 6 Alex Sandro, 13 Danilo, 14 Bremer, 15 Leo Pereira, 16 Douglas Santos, 24 Roger Ibanez\nПолузащита: 2 Ederson Silva, 5 Casemiro, 8 Bruno Guimaraes, 17 Fabinho, 18 Danilo Santos, 20 Lucas Paqueta, 21 Luiz Henrique\nНападение: 7 Vinicius Junior, 9 Matheus Cunha, 10 Neymar, 11 Raphinha, 19 Endrick, 22 Gabriel Martinelli, 25 Igor Thiago, 26 Rayan",
  },
  {
    id: "arg",
    player: "LAUTARO",
    number: "22",
    title: "Аргентина",
    place: "Финал · серебро",
    body: "#f4f7fb",
    trim: "#75aadb",
    gold: "#1d4e89",
    stripes: "#75aadb",
    path: "Группа J, 1-е место, три победы, 8:1, 9 очков. 1/16 — 3:2 Кабо-Верде. 1/8 — 3:2 Египет. 1/4 — 3:1 Швейцария. 1/2 — 2:1 Англия. Финал — 0:1 Испания, гол Феррана Торреса на 106-й.",
    fact: "Лаутаро Мартинес забил в четвертьфинале Швейцарии и в полуфинале Англии. В финале Энсо Фернандес удалён на 90+3, на стадионе было 80 660 человек.",
    squad: "Вратари: 1 J. Musso, 12 G. Rulli, 23 E. Martinez\nЗащита: 2 M. Senesi, 3 N. Tagliafico, 4 G. Montiel, 6 Lisandro Martinez, 13 C. Romero, 19 N. Otamendi, 25 F. Medina, 26 N. Molina\nПолузащита: 5 L. Paredes, 7 R. De Paul, 8 V. Barco, 11 G. Lo Celso, 14 E. Palacios, 16 T. Almada, 20 A. Mac Allister, 24 E. Fernandez\nНападение: 9 J. Alvarez, 15 N. Gonzalez, 17 G. Simeone, 18 N. Paz, 21 J. Lopez, 22 Lautaro Martinez\nФинал: Dibu Martinez, Montiel, Romero, Lisandro Martinez, Tagliafico, De Paul, Enzo Fernandez, Mac Allister, Nico Gonzalez, Julian Alvarez. Тренер Скалони.",
  },
  {
    id: "fra",
    player: "MBAPPÉ",
    number: "10",
    title: "Франция",
    place: "4-е место",
    body: "#1e3a8a",
    trim: "#c8102e",
    gold: "#f4f7fb",
    path: "Группа I, 1-е место, три победы, 10:2, 9 очков. 1/16 — 3:0 Швеция. 1/8 — 1:0 Парагвай. 1/4 — 2:0 Марокко. 1/2 — 0:2 Испания. Матч за третье место — 4:6 Англия.",
    fact: "Мбаппе — лучший бомбардир чемпионата, 10 голов. Тренер — Дидье Дешам.",
    squad: "Вратари: 1 B. Samba, 16 M. Maignan, 23 R. Risser\nЗащита: 2 M. Gusto, 3 L. Digne, 4 D. Upamecano, 5 J. Kounde, 15 I. Konate, 17 W. Saliba, 19 T. Hernandez, 21 L. Hernandez, 26 M. Lacroix\nПолузащита: 6 M. Kone, 8 A. Tchouameni, 11 M. Olise, 13 N. Kante, 14 A. Rabiot, 18 W. Zaire-Emery, 24 R. Cherki, 25 M. Akliouche\nНападение: 7 O. Dembele, 9 M. Thuram, 10 K. Mbappe, 12 B. Barcola, 20 D. Doue, 22 J. Mateta",
  },
];

function shirtShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.3, 0.02);
  s.lineTo(0.3, 0.02);
  s.lineTo(0.32, 0.62);
  s.lineTo(0.5, 0.66);
  s.lineTo(0.5, 0.8);
  s.lineTo(0.28, 0.92);
  s.lineTo(0.13, 0.98);
  s.lineTo(0, 0.84);
  s.lineTo(-0.13, 0.98);
  s.lineTo(-0.28, 0.92);
  s.lineTo(-0.5, 0.8);
  s.lineTo(-0.5, 0.66);
  s.lineTo(-0.32, 0.62);
  s.closePath();
  return s;
}

function drawBadge(g, px, id) {
  const [cx, cy] = px(0.15, 0.72);
  const w = 28;
  const h = 34;
  g.save();
  g.beginPath();
  g.moveTo(cx - w, cy - h);
  g.lineTo(cx + w, cy - h);
  g.lineTo(cx + w, cy + h * 0.25);
  g.quadraticCurveTo(cx, cy + h, cx - w, cy + h * 0.25);
  g.closePath();
  g.clip();
  if (id === "por") {
    g.fillStyle = "#0c7a4e";
    g.fillRect(cx - w, cy - h, w, h * 2);
    g.fillStyle = "#c8102e";
    g.fillRect(cx, cy - h, w, h * 2);
    g.fillStyle = "#f4f1ea";
    g.fillRect(cx - 8, cy - 10, 16, 22);
    g.fillStyle = "#c6a15a";
    g.fillRect(cx - 3, cy - 6, 6, 14);
  } else if (id === "bra") {
    g.fillStyle = "#009739";
    g.fillRect(cx - w, cy - h, w * 2, h * 2);
    g.fillStyle = "#ffe14a";
    g.beginPath();
    g.moveTo(cx, cy - 18);
    g.lineTo(cx + 16, cy + 2);
    g.lineTo(cx, cy + 20);
    g.lineTo(cx - 16, cy + 2);
    g.closePath();
    g.fill();
    g.fillStyle = "#002776";
    g.beginPath();
    g.arc(cx, cy + 1, 7, 0, Math.PI * 2);
    g.fill();
  } else if (id === "arg") {
    g.fillStyle = "#75aadb";
    g.fillRect(cx - w, cy - h, w * 2, h * 2);
    g.fillStyle = "#f4f7fb";
    g.fillRect(cx - w, cy - 8, w * 2, 16);
    g.fillStyle = "#c6a15a";
    g.beginPath();
    g.arc(cx, cy, 6, 0, Math.PI * 2);
    g.fill();
  } else {
    g.fillStyle = "#1e3a8a";
    g.fillRect(cx - w, cy - h, (w * 2) / 3, h * 2);
    g.fillStyle = "#f4f7fb";
    g.fillRect(cx - w / 3, cy - h, (w * 2) / 3, h * 2);
    g.fillStyle = "#c8102e";
    g.fillRect(cx + w / 3, cy - h, (w * 2) / 3, h * 2);
  }
  g.restore();
  g.beginPath();
  g.moveTo(cx - w, cy - h);
  g.lineTo(cx + w, cy - h);
  g.lineTo(cx + w, cy + h * 0.25);
  g.quadraticCurveTo(cx, cy + h, cx - w, cy + h * 0.25);
  g.closePath();
  g.lineWidth = 3;
  g.strokeStyle = "#f4f1ea";
  g.stroke();
}

function paintKit(kit, back) {
  const W = 512;
  const H = 492;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  const px = (x, y) => [
    ((x + 0.5) / 1) * W,
    (1 - (y - 0.02) / 0.96) * H,
  ];
  const block = (x0, y0, x1, y1, color) => {
    const a = px(x0, y0);
    const b = px(x1, y1);
    g.fillStyle = color;
    g.fillRect(
      Math.min(a[0], b[0]),
      Math.min(a[1], b[1]),
      Math.abs(b[0] - a[0]),
      Math.abs(b[1] - a[1])
    );
  };
  g.fillStyle = kit.body;
  g.fillRect(0, 0, W, H);
  if (kit.waves) {
    g.strokeStyle = kit.wave;
    g.lineWidth = 8;
    for (let i = 0; i < 16; i++) {
      const base = 16 + i * (H / 16);
      g.beginPath();
      for (let x = 0; x <= W; x += 6) {
        const y = base + Math.sin(x * 0.04 + i * 0.7) * 6;
        if (x === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
    }
  }
  if (kit.stripes) {
    for (const x of [-0.14, 0, 0.14]) block(x - 0.045, 0.02, x + 0.045, 0.98, kit.stripes);
  }
  block(-0.5, 0.66, -0.445, 0.81, kit.trim);
  block(0.445, 0.66, 0.5, 0.81, kit.trim);
  g.strokeStyle = kit.trim;
  g.lineWidth = 18;
  g.lineJoin = "round";
  g.lineCap = "round";
  const neck = [px(0.16, 0.93), px(0, 0.78), px(-0.16, 0.93)];
  g.beginPath();
  g.moveTo(neck[0][0], neck[0][1]);
  g.lineTo(neck[1][0], neck[1][1]);
  g.lineTo(neck[2][0], neck[2][1]);
  g.stroke();
  g.strokeStyle = kit.gold;
  g.lineWidth = 4;
  g.stroke();
  if (!back) drawBadge(g, px, kit.id);
  if (back) {
    g.fillStyle = kit.gold;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = "700 32px Oswald, sans-serif";
    const at = px(0, 0.66);
    g.fillText(kit.player, at[0], at[1]);
    g.font = "700 88px Oswald, sans-serif";
    const num = px(0, 0.5);
    g.fillText(kit.number, num[0], num[1]);
  }
  return canvasTexture(c, THREE.SRGBColorSpace);
}

function makeStraightKit(kit) {
  const depth = 0.055;
  const geo = new THREE.ExtrudeGeometry(shirtShape(), { depth, bevelEnabled: false });
  geo.translate(0, 0, -depth / 2);
  const src = geo.attributes.position;
  const front = [];
  const back = [];
  const side = [];
  for (let i = 0; i < src.count; i += 3) {
    const ax = src.getX(i);
    const ay = src.getY(i);
    const az = src.getZ(i);
    const bx = src.getX(i + 1);
    const by = src.getY(i + 1);
    const bz = src.getZ(i + 1);
    const cx = src.getX(i + 2);
    const cy = src.getY(i + 2);
    const cz = src.getZ(i + 2);
    const nz = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    const len = Math.hypot(
      (by - ay) * (cz - az) - (bz - az) * (cy - ay),
      (bz - az) * (cx - ax) - (bx - ax) * (cz - az),
      nz
    ) || 1;
    const face = nz / len > 0.7 ? front : nz / len < -0.7 ? back : side;
    face.push(ax, ay, az, bx, by, bz, cx, cy, cz);
  }
  geo.dispose();

  const meshOf = (flat, map, flipU) => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(flat);
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    if (map) {
      const uv = new Float32Array((flat.length / 3) * 2);
      for (let i = 0; i < flat.length; i += 3) {
        let u = flat[i] + 0.5;
        const v = (flat[i + 1] - 0.02) / 0.96;
        if (flipU) u = 1 - u;
        uv[(i / 3) * 2] = u;
        uv[(i / 3) * 2 + 1] = v;
      }
      g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    }
    return new THREE.Mesh(
      g,
      map
        ? new THREE.MeshBasicMaterial({ map })
        : new THREE.MeshBasicMaterial({ color: kit.trim })
    );
  };

  const group = new THREE.Group();
  group.add(meshOf(front, paintKit(kit, false), false));
  group.add(meshOf(back, paintKit(kit, true), true));
  group.add(meshOf(side, null, false));
  return group;
}

function faceCamera(object, camera) {
  const dx = camera.position.x - object.position.x;
  const dz = camera.position.z - object.position.z;
  const dist = Math.hypot(dx, dz) || 1;
  const dy = camera.position.y - (object.position.y + (object.userData.face || 0));
  object.rotation.order = "YXZ";
  object.rotation.y = Math.atan2(dx, dz);
  object.rotation.x = -Math.atan2(dy, dist);
}

function makeOla() {
  const N = 2200;
  const positions = new Float32Array(N * 3);
  const colors = new Float32Array(N * 3);
  const phases = new Float32Array(N);
  const radii = new Float32Array(N);
  const palette = ["#e10600", "#f4f7fb", "#1d6fe0", "#1b9a3c", "#e3c37a"].map(
    (hex) => new THREE.Color(hex)
  );
  for (let i = 0; i < N; i++) {
    const a = Math.PI * (1.15 + (i / N) * 0.7);
    const rad = 3.4 + (Math.random() - 0.5) * 0.28;
    phases[i] = a;
    radii[i] = rad;
    positions[i * 3] = Math.cos(a) * rad;
    positions[i * 3 + 1] = Math.sin(a * 3) * 0.42;
    positions[i * 3 + 2] = Math.sin(a) * rad;
    const col = palette[i % palette.length];
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.035,
    map: softSprite(),
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.9,
  });
  const points = new THREE.Points(geo, mat);
  points.userData.phases = phases;
  points.userData.radii = radii;
  return points;
}

function pitchMarkings() {
  const group = new THREE.Group();
  const paint = new THREE.MeshBasicMaterial({ color: 0xf7f4ee });
  const u = 5.02 / 7.32;
  const gx = 0.2;
  const gz = -1.36;
  const along = new THREE.Vector3(1, 0, 0);
  const addLine = (x1, z1, x2, z2, width = 0.09) => {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    if (len < 0.02) return;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(len, 0.012, width), paint);
    mesh.quaternion.setFromUnitVectors(along, new THREE.Vector3(dx / len, 0, dz / len));
    mesh.position.set((x1 + x2) / 2, -1.0, (z1 + z2) / 2);
    group.add(mesh);
  };
  const box = (widthM, depthM) => {
    const hw = widthM * u * 0.5;
    const d = depthM * u;
    addLine(gx - hw, gz, gx + hw, gz);
    addLine(gx + hw, gz, gx + hw, gz + d);
    addLine(gx + hw, gz + d, gx - hw, gz + d);
    addLine(gx - hw, gz + d, gx - hw, gz);
  };
  addLine(gx - 34 * u, gz, gx + 34 * u, gz, 0.12);
  addLine(gx - 34 * u, gz, gx - 34 * u, gz + 52 * u, 0.12);
  addLine(gx + 34 * u, gz, gx + 34 * u, gz + 52 * u, 0.12);
  box(40.32, 16.5);
  box(18.32, 5.5);
  const spotZ = gz + 11 * u;
  const spot = new THREE.Mesh(new THREE.CircleGeometry(0.09, 24), paint);
  spot.rotation.x = -Math.PI / 2;
  spot.position.set(gx, -0.998, spotZ);
  group.add(spot);
  const arcR = 9.15 * u;
  const arcLimit = gz + 16.5 * u;
  let prev = null;
  for (let i = 0; i <= 48; i++) {
    const ang = -0.7 + (1.4 * i) / 48;
    const x = gx + Math.sin(ang) * arcR;
    const z = spotZ + Math.cos(ang) * arcR;
    if (z >= arcLimit && prev) addLine(prev[0], prev[1], x, z, 0.045);
    prev = z >= arcLimit ? [x, z] : null;
  }
  return group;
}

function canvasTexture(canvas, colorSpace) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = colorSpace;
  tex.anisotropy = 8;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function makeGoalNet(root) {
  let mesh = null;
  root.traverse((obj) => {
    if (!mesh && obj.isMesh && obj.geometry?.attributes?.position) mesh = obj;
  });
  if (!mesh) return null;
  const src = mesh.geometry.attributes.position;
  const count = src.count;
  const live = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    live[i * 3] = src.getX(i);
    live[i * 3 + 1] = src.getY(i);
    live[i * 3 + 2] = src.getZ(i);
  }
  mesh.geometry.setAttribute("position", new THREE.BufferAttribute(live, 3));
  mesh.frustumCulled = false;
  if (mesh.material) mesh.material.side = THREE.DoubleSide;

  const weld = 0.012;
  const rx = [];
  const ry = [];
  const rz = [];
  const vert = new Int32Array(count);
  const grid = new Map();
  for (let i = 0; i < count; i++) {
    const px = live[i * 3];
    const py = live[i * 3 + 1];
    const pz = live[i * 3 + 2];
    const cx = Math.floor(px / weld);
    const cy = Math.floor(py / weld);
    const cz = Math.floor(pz / weld);
    let found = -1;
    for (let dx = -1; dx <= 1 && found < 0; dx++) {
      for (let dy = -1; dy <= 1 && found < 0; dy++) {
        for (let dz = -1; dz <= 1 && found < 0; dz++) {
          const list = grid.get(`${cx + dx},${cy + dy},${cz + dz}`);
          if (!list) continue;
          for (const pi of list) {
            const ox = rx[pi] - px;
            const oy = ry[pi] - py;
            const oz = rz[pi] - pz;
            if (ox * ox + oy * oy + oz * oz <= weld * weld) {
              found = pi;
              break;
            }
          }
        }
      }
    }
    if (found < 0) {
      found = rx.length;
      rx.push(px);
      ry.push(py);
      rz.push(pz);
      const key = `${cx},${cy},${cz}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(found);
    }
    vert[i] = found;
  }

  const off = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const p = vert[i];
    off[i * 3] = live[i * 3] - rx[p];
    off[i * 3 + 1] = live[i * 3 + 1] - ry[p];
    off[i * 3 + 2] = live[i * 3 + 2] - rz[p];
  }

  const n = rx.length;
  const x = Float32Array.from(rx);
  const y = Float32Array.from(ry);
  const z = Float32Array.from(rz);
  const pinned = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    pinned[i] = Math.abs(x[i]) > 0.97 || Math.abs(y[i]) > 0.325 || Math.abs(z[i]) > 0.272 ? 1 : 0;
  }

  const linkI = [];
  const linkJ = [];
  const linkL = [];
  const span = 0.085;
  const buckets = new Map();
  const bucketKey = (i) => `${Math.floor(x[i] / span)},${Math.floor(y[i] / span)},${Math.floor(z[i] / span)}`;
  for (let i = 0; i < n; i++) {
    const key = bucketKey(i);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(i);
  }
  for (let i = 0; i < n; i++) {
    const cx = Math.floor(x[i] / span);
    const cy = Math.floor(y[i] / span);
    const cz = Math.floor(z[i] / span);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const list = buckets.get(`${cx + dx},${cy + dy},${cz + dz}`);
          if (!list) continue;
          for (const j of list) {
            if (j <= i) continue;
            const ox = x[j] - x[i];
            const oy = y[j] - y[i];
            const oz = z[j] - z[i];
            const dist = Math.hypot(ox, oy, oz);
            if (dist > 0.004 && dist < span) {
              linkI.push(i);
              linkJ.push(j);
              linkL.push(dist);
            }
          }
        }
      }
    }
  }

  return {
    mesh,
    n,
    x,
    y,
    z,
    rx: Float32Array.from(rx),
    ry: Float32Array.from(ry),
    rz: Float32Array.from(rz),
    vx: new Float32Array(n),
    vy: new Float32Array(n),
    vz: new Float32Array(n),
    pinned,
    vert,
    off,
    linkI,
    linkJ,
    linkL,
    awake: 0,
    havePrev: false,
    prev: new THREE.Vector3(),
    ball: new THREE.Vector3(),
    ahead: new THREE.Vector3(),
    vel: new THREE.Vector3(),
  };
}

function stepGoalNet(net, dt, ballWorld, pushing) {
  if (!net) return;
  const { n, x, y, z, rx, ry, rz, vx, vy, vz, pinned, linkI, linkJ, linkL } = net;
  if (pushing && ballWorld) {
    net.mesh.updateWorldMatrix(true, false);
    net.ball.copy(ballWorld);
    net.mesh.worldToLocal(net.ball);
    if (net.havePrev) {
      net.ahead.copy(ballWorld);
      net.mesh.worldToLocal(net.ahead);
      net.vel.subVectors(net.ahead, net.prev);
    } else {
      net.vel.set(0, 0, 0);
    }
    net.prev.copy(net.ball);
    net.havePrev = true;
    const speed = net.vel.length();
    if (speed > 0.004) {
      const dz = net.vel.z / speed;
      const reach = 0.58;
      for (let i = 0; i < n; i++) {
        if (pinned[i]) continue;
        const ox = x[i] - net.ball.x;
        const oy = y[i] - net.ball.y;
        const oz = z[i] - net.ball.z;
        const dist = Math.hypot(ox, oy, oz);
        if (dist > reach) continue;
        const w = (1 - dist / reach) ** 2;
        const nx = ox / (dist || 1);
        const ny = oy / (dist || 1);
        const nz = oz / (dist || 1);
        x[i] += nx * w * 0.12;
        y[i] += ny * w * 0.05 - w * 0.28;
        z[i] += dz * w * 0.2 + nz * w * 0.08;
        vx[i] += nx * w * 0.12;
        vy[i] -= w * 0.7;
        vz[i] += dz * w * 0.25;
        net.awake = 5;
      }
    }
  } else {
    net.havePrev = false;
  }
  if (net.awake <= 0) return;
  net.awake -= dt;
  const stiffness = 1.6;
  const restore = 0.35;
  const damping = 1.4;
  const steps = 2;
  const h = Math.min(dt, 0.05) / steps;
  for (let sub = 0; sub < steps; sub++) {
    for (let k = 0; k < linkI.length; k++) {
      const i = linkI[k];
      const j = linkJ[k];
      let ox = x[j] - x[i];
      let oy = y[j] - y[i];
      let oz = z[j] - z[i];
      const dist = Math.hypot(ox, oy, oz) || 1e-5;
      const mag = ((dist - linkL[k]) / dist) * stiffness * h;
      ox *= mag;
      oy *= mag;
      oz *= mag;
      if (!pinned[i]) {
        vx[i] += ox;
        vy[i] += oy;
        vz[i] += oz;
      }
      if (!pinned[j]) {
        vx[j] -= ox;
        vy[j] -= oy;
        vz[j] -= oz;
      }
    }
    const damp = Math.exp(-damping * h);
    const cap = 0.46;
    let far = 0;
    for (let i = 0; i < n; i++) {
      if (pinned[i]) continue;
      vx[i] += (rx[i] - x[i]) * restore * h;
      vy[i] += (ry[i] - y[i]) * restore * h;
      vz[i] += (rz[i] - z[i]) * restore * h;
      vx[i] *= damp;
      vy[i] *= damp;
      vz[i] *= damp;
      x[i] += vx[i] * h;
      y[i] += vy[i] * h;
      z[i] += vz[i] * h;
      const ox = x[i] - rx[i];
      const oy = y[i] - ry[i];
      const oz = z[i] - rz[i];
      const od = Math.hypot(ox, oy, oz);
      if (od > far) far = od;
      if (od > cap) {
        const scale = cap / od;
        x[i] = rx[i] + ox * scale;
        y[i] = ry[i] + oy * scale;
        z[i] = rz[i] + oz * scale;
      }
    }
    if (far > 0.012) net.awake = Math.max(net.awake, 0.4);
  }
  const arr = net.mesh.geometry.attributes.position.array;
  const vert = net.vert;
  const off = net.off;
  for (let i = 0; i < vert.length; i++) {
    const p = vert[i];
    arr[i * 3] = x[p] + off[i * 3];
    arr[i * 3 + 1] = y[p] + off[i * 3 + 1];
    arr[i * 3 + 2] = z[p] + off[i * 3 + 2];
  }
  net.mesh.geometry.attributes.position.needsUpdate = true;
}

async function boot() {
  const part = { font: 0, ball: 0, final: 0, trophy: 0, grass: 0, goal: 0 };
  const weight = { font: 0.02, ball: 0.4, final: 0.4, trophy: 0.04, grass: 0.08, goal: 0.06 };
  const setLoad = (ratio) => {
    $("loader-pct").textContent = `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`;
  };
  const tick = () => {
    let sum = 0;
    for (const key in part) sum += part[key] * weight[key];
    setLoad(sum);
  };
  const trackTexture = (url, key) =>
    new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(
        url,
        (tex) => {
          part[key] = 1;
          tick();
          resolve(tex);
        },
        (event) => {
          if (event.lengthComputable && event.total) {
            part[key] = event.loaded / event.total;
            tick();
          }
        },
        reject
      );
    });
  setLoad(0);

  const loader = new GLTFLoader();
  const asset = (path) => `${import.meta.env.BASE_URL}${path}`;
  const [, albedo, finalAlbedo, trophyMap, grassMap, goalGltf] = await Promise.all([
    Promise.race([
      document.fonts.load("700 96px Oswald"),
      new Promise((resolve) => setTimeout(resolve, 800)),
    ]).then((value) => {
      part.font = 1;
      tick();
      return value;
    }),
    projectBallTexture((p) => {
      part.ball = p;
      tick();
    }),
    projectFinalTexture((p) => {
      part.final = p;
      tick();
    }),
    trackTexture(asset("trophy.png"), "trophy"),
    trackTexture(asset("grass.jpg"), "grass"),
    new Promise((resolve, reject) => {
      loader.load(
        asset("models/goal.glb"),
        (gltf) => {
          part.goal = 1;
          tick();
          resolve(gltf);
        },
        (event) => {
          if (event.lengthComputable && event.total) {
            part.goal = event.loaded / event.total;
            tick();
          }
        },
        reject
      );
    }),
  ]);
  trophyMap.colorSpace = THREE.SRGBColorSpace;
  trophyMap.anisotropy = 8;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1;
  document.body.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#07090d");
  scene.fog = new THREE.Fog("#07090d", 8, 18);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.05).texture;

  const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 50);

  const ball = new THREE.Group();
  scene.add(ball);
  const finalBall = new THREE.Group();
  finalBall.position.set(1.55, -0.02, -0.55);
  finalBall.scale.setScalar(0.66);
  scene.add(finalBall);

  const geo = new THREE.SphereGeometry(1, 192, 128);
  const matchMap = canvasTexture(albedo, THREE.SRGBColorSpace);
  const finalMap = canvasTexture(finalAlbedo, THREE.SRGBColorSpace);
  ball.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: matchMap })));
  finalBall.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: finalMap })));

  grassMap.colorSpace = THREE.SRGBColorSpace;
  grassMap.wrapS = THREE.RepeatWrapping;
  grassMap.wrapT = THREE.RepeatWrapping;
  grassMap.repeat.set(18, 18);
  grassMap.offset.set(0.17, 0.31);
  grassMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const pitch = new THREE.Mesh(
    new THREE.PlaneGeometry(36, 36),
    new THREE.MeshBasicMaterial({ map: grassMap })
  );
  pitch.rotation.x = -Math.PI / 2;
  pitch.position.y = -1.02;
  scene.add(pitch);
  scene.add(pitchMarkings());

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.86, 40),
    new THREE.MeshBasicMaterial({
      map: canvasTexture(shadowTexture(), THREE.SRGBColorSpace),
      transparent: true,
      depthWrite: false,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, -1.0, 0.05);
  scene.add(shadow);
  const finalShadow = shadow.clone();
  finalShadow.scale.setScalar(0.66);
  finalShadow.position.set(finalBall.position.x, -1.0, finalBall.position.z);
  scene.add(finalShadow);

  const trophy = makeTrophy(trophyMap);
  trophy.position.set(-1.15, -1.02, 0.72);
  scene.add(trophy);
  const trophyShadow = shadow.clone();
  trophyShadow.scale.set(0.42, 0.42, 0.26);
  trophyShadow.position.set(trophy.position.x, -1.0, trophy.position.z + 0.08);
  scene.add(trophyShadow);

  const goal = sitOnFloor(goalGltf.scene, 1.7);
  goal.position.set(0.2, -1.02, -2.05);
  scene.add(goal);
  const goalBox = new THREE.Box3().setFromObject(goal);
  const goalMouth = new THREE.Mesh(
    new THREE.PlaneGeometry(goalBox.max.x - goalBox.min.x, goalBox.max.y - goalBox.min.y),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })
  );
  goalMouth.position.set(
    (goalBox.min.x + goalBox.max.x) / 2,
    (goalBox.min.y + goalBox.max.y) / 2,
    goalBox.max.z
  );
  scene.add(goalMouth);
  const goalNet = makeGoalNet(goal);

  let shotCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, -0.72, 1),
    new THREE.Vector3(0, 0.2, 0),
    new THREE.Vector3(0, 0.2, -1),
    new THREE.Vector3(0, -0.2, -1.8)
  );
  const shotBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 64, 48),
    new THREE.MeshBasicMaterial({ map: matchMap })
  );
  shotBall.visible = false;
  scene.add(shotBall);
  const shotTrail = new THREE.Mesh(
    new THREE.TubeGeometry(shotCurve, 96, 0.02, 8, false),
    new THREE.MeshBasicMaterial({ color: 0xc6a15a, transparent: true, opacity: 0.8 })
  );
  shotTrail.visible = false;
  scene.add(shotTrail);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xc6a15a,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.95,
  });
  const shotFrom = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.26, 40), ringMat);
  shotFrom.rotation.x = -Math.PI / 2;
  shotFrom.position.set(0, -1.005, 1);
  shotFrom.visible = false;
  scene.add(shotFrom);
  const shotTo = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.3, 40), ringMat);
  shotTo.position.copy(shotCurve.getPoint(1));
  shotTo.visible = false;
  scene.add(shotTo);

  const kits = KITS.map((kit, i) => {
    const mesh = sitOnFloor(makeStraightKit(kit), 0.44);
    const kitX = [0.06, 0.52, 0.98, 1.42];
    mesh.position.set(kitX[i], -1.02, 1.12);
    mesh.userData.kit = kit;
    scene.add(mesh);
    return mesh;
  });

  const ola = makeOla();
  ola.position.copy(ball.position);
  scene.add(ola);

  scene.add(new THREE.HemisphereLight("#d5e6ff", "#14301f", 0.45));
  const key = new THREE.DirectionalLight("#fff6ec", 0.22);
  key.position.set(4.5, 7.5, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight("#9dc8ff", 0.45);
  rim.position.set(-6, 3.2, -3);
  scene.add(rim);
  const fill = new THREE.DirectionalLight("#ffe0cc", 0.4);
  fill.position.set(-2, 2, 6);
  scene.add(fill);

  let shotT = -1;
  let goalMode = false;
  let curl = true;
  let aiming = "from";
  let fromPoint = null;
  let toPoint = null;
  const shotPoint = new THREE.Vector3();
  const groundHit = new THREE.Vector3();
  let power = 80;
  let shotPower = 80;
  let shotDur = 0.53;
  const shotDuration = (value) => 1.45 - (Math.min(100, Math.max(1, value)) / 100) * 1.12;
  const goalCam = new THREE.Vector3(0.2, 6.4, 9.8);
  const goalLook = new THREE.Vector3(0.2, -0.55, -0.2);
  const mouthZ = -1.35;
  let cheered = false;
  let shotPrevZ = 0;

  function makeCurve(from, to, withCurl) {
    const dir = new THREE.Vector3().subVectors(to, from);
    const flat = Math.hypot(dir.x, dir.z) || 1;
    const side = new THREE.Vector3(-dir.z / flat, 0, dir.x / flat);
    const bend = withCurl ? flat * 0.28 : 0;
    const past = to.clone().add(dir.clone().normalize().multiplyScalar(Math.max(1.8, flat * 0.5)));
    const c1 = from.clone().lerp(to, 0.38).addScaledVector(side, bend);
    const c2 = to.clone().lerp(past, 0.2).addScaledVector(side, bend * 0.12);
    c1.y = Math.max(from.y, to.y) + (withCurl ? 0.75 : 0.38);
    c2.y = to.y + 0.06;
    return new THREE.CubicBezierCurve3(from.clone(), c1, c2, past);
  }

  function refreshPath() {
    const ready = fromPoint && toPoint;
    $("shot-play").disabled = !ready;
    if (!ready) {
      shotTrail.visible = false;
      return;
    }
    shotCurve = makeCurve(fromPoint, toPoint, curl);
    shotTrail.geometry.dispose();
    shotTrail.geometry = new THREE.TubeGeometry(shotCurve, 80, 0.02, 6, false);
    shotTrail.visible = true;
    if (shotT < 0) {
      shotBall.position.copy(fromPoint);
      shotBall.visible = true;
    }
  }

  function placeShotPoint(e) {
    if (shotT >= 0) return;
    const rect = el.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    let point = null;
    if (aiming === "to") {
      const goalHits = raycaster.intersectObjects([goalMouth, goal], true);
      if (!goalHits.length) return;
      point = goalHits[0].point.clone();
    } else if (raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 1.02), groundHit)) {
      point = groundHit.clone();
    }
    if (!point || Math.abs(point.x) > 16 || Math.abs(point.z) > 16) return;
    if (aiming === "from") {
      fromPoint = point;
      fromPoint.y = -0.72;
      shotFrom.position.set(fromPoint.x, -1.005, fromPoint.z);
      shotFrom.visible = true;
      aiming = "to";
      $("shot-from").classList.remove("on");
      $("shot-to").classList.add("on");
      $("shot-hint").textContent = "Кликни ворота — куда бьёт";
    } else {
      toPoint = point;
      shotTo.position.copy(toPoint);
      shotTo.rotation.set(0, 0, 0);
      shotTo.visible = true;
      $("shot-hint").textContent = "Жми удар. Мяч пролетит точку.";
    }
    refreshPath();
  }

  function enterGoal() {
    goalMode = true;
    shotT = -1;
    $("ui").classList.add("goal-mode");
    document.body.classList.add("goal-mode");
    $("shot-panel").hidden = false;
    $("dossier").hidden = true;
    faceBack = null;
    for (const obj of [ball, finalBall, shadow, finalShadow, trophy, trophyShadow, ola, ...kits]) {
      obj.visible = false;
    }
  }

  function leaveGoal() {
    goalMode = false;
    shotT = -1;
    $("ui").classList.remove("goal-mode");
    document.body.classList.remove("goal-mode");
    $("shot-panel").hidden = true;
    shotBall.visible = false;
    shotTrail.visible = false;
    shotFrom.visible = false;
    shotTo.visible = false;
    for (const obj of [ball, finalBall, shadow, finalShadow, trophy, trophyShadow, ola, ...kits]) {
      obj.visible = true;
    }
  }

  $("goal-btn").addEventListener("click", enterGoal);
  $("shot-back").addEventListener("click", leaveGoal);
  $("shot-from").addEventListener("click", () => {
    aiming = "from";
    $("shot-from").classList.add("on");
    $("shot-to").classList.remove("on");
    $("shot-hint").textContent = "Кликни газон — откуда бьёт";
  });
  $("shot-to").addEventListener("click", () => {
    aiming = "to";
    $("shot-to").classList.add("on");
    $("shot-from").classList.remove("on");
    $("shot-hint").textContent = "Кликни ворота — куда бьёт";
  });
  $("shot-curl").addEventListener("click", () => {
    curl = true;
    $("shot-curl").classList.add("on");
    $("shot-straight").classList.remove("on");
    refreshPath();
  });
  $("shot-straight").addEventListener("click", () => {
    curl = false;
    $("shot-straight").classList.add("on");
    $("shot-curl").classList.remove("on");
    refreshPath();
  });
  $("shot-play").addEventListener("click", () => {
    if (!fromPoint || !toPoint || shotT >= 0) return;
    refreshPath();
    cheered = false;
    shotPower = power;
    shotDur = shotDuration(power);
    shotPrevZ = fromPoint.z;
    shotT = 0;
    shotBall.position.copy(fromPoint);
    shotBall.rotation.set(0, 0, 0);
    shotBall.visible = true;
    $("shot-hint").textContent = "Удар";
  });
  $("shot-power").addEventListener("input", (e) => {
    power = Number(e.target.value);
    $("shot-power-val").textContent = `${power}%`;
  });
  $("shot-match").addEventListener("click", () => {
    shotBall.material.map = matchMap;
    shotBall.material.needsUpdate = true;
    $("shot-match").classList.add("on");
    $("shot-final").classList.remove("on");
  });
  $("shot-final").addEventListener("click", () => {
    shotBall.material.map = finalMap;
    shotBall.material.needsUpdate = true;
    $("shot-final").classList.add("on");
    $("shot-match").classList.remove("on");
  });

  let chapter = 0;
  let targetRot = CHAPTERS[0].rot;
  let focusFinal = false;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let velY = 0;
  let spin = 0;
  let lockChapter = false;
  let wheelLock = 0;

  const title = $("title");
  const kicker = $("kicker");
  const lead = $("lead");
  const hero = $("hero");
  const buttons = [...document.querySelectorAll("nav button")];

  function applyCopy(i) {
    const c = CHAPTERS[i];
    hero.classList.add("out");
    setTimeout(() => {
      kicker.textContent = c.kicker;
      title.innerHTML = c.title;
      lead.textContent = c.lead;
      hero.classList.remove("out");
    }, 220);
    buttons.forEach((btn, idx) => btn.classList.toggle("on", idx === i));
    focusFinal = !!c.final;
    targetRot = c.rot;
    lockChapter = true;
    spin = 0;
    setTimeout(() => {
      lockChapter = false;
      spin = 0;
    }, 1800);
  }

  function setChapter(i) {
    const next = Math.max(0, Math.min(CHAPTERS.length - 1, i));
    if (next === chapter) return;
    chapter = next;
    applyCopy(chapter);
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => setChapter(Number(btn.dataset.ch)));
  });

  window.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      if (goalMode) return;
      const now = performance.now();
      if (now < wheelLock) return;
      if (Math.abs(e.deltaY) < 8) return;
      wheelLock = now + 700;
      setChapter(chapter + Math.sign(e.deltaY));
    },
    { passive: false }
  );

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") setChapter(chapter + 1);
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") setChapter(chapter - 1);
  });

  const el = renderer.domElement;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const spinnable = [ball, finalBall, goal, ...kits];
  let dragged = ball;
  let downX = 0;
  let downY = 0;
  let faceBack = null;
  const dossier = $("dossier");

  function openTeam(mesh) {
    const kit = mesh.userData.kit;
    $("d-place").textContent = kit.place;
    $("d-team").textContent = kit.title;
    $("d-path").textContent = kit.path;
    $("d-fact").textContent = kit.fact;
    $("d-squad").textContent = kit.squad;
    dossier.hidden = false;
    faceBack = mesh;
    velY = 0;
  }

  $("dossier-close").addEventListener("click", () => {
    dossier.hidden = true;
    faceBack = null;
  });

  function pickObject(e) {
    const rect = el.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects([trophy, ...spinnable], true);
    if (!hits.length) return focusFinal ? finalBall : ball;
    let obj = hits[0].object;
    while (obj.parent && obj.parent !== scene) obj = obj.parent;
    if (obj === trophy) return null;
    return spinnable.includes(obj) ? obj : focusFinal ? finalBall : ball;
  }

  el.addEventListener("pointerdown", (e) => {
    if (goalMode) {
      placeShotPoint(e);
      return;
    }
    const picked = pickObject(e);
    if (!picked) return;
    dragging = true;
    dragged = picked;
    downX = lastX = e.clientX;
    downY = lastY = e.clientY;
    if (faceBack === picked) faceBack = null;
    velY = 0;
    spin = 0;
    lockChapter = false;
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    velY = dx * 0.008;
    dragged.rotation.y += velY;
    if (dragged === ball || dragged === finalBall) {
      dragged.rotation.x = Math.max(-0.6, Math.min(0.6, dragged.rotation.x + dy * 0.005));
    }
  });
  const endDrag = (e) => {
    const moved = Math.hypot((e.clientX || downX) - downX, (e.clientY || downY) - downY);
    if (dragging && moved < 7 && kits.includes(dragged)) openTeam(dragged);
    dragging = false;
  };
  el.addEventListener("pointerup", endDrag);
  el.addEventListener("pointercancel", endDrag);

  const clock = new THREE.Clock();
  const camTarget = new THREE.Vector3();

  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!dragging) {
      velY *= 0.94;
      const turned = focusFinal ? finalBall : ball;
      if (lockChapter && dragged === turned) {
        const diff = Math.atan2(Math.sin(targetRot - turned.rotation.y), Math.cos(targetRot - turned.rotation.y));
        turned.rotation.y += diff * 0.18;
        turned.rotation.x += (0 - turned.rotation.x) * 0.06;
      } else {
        dragged.rotation.y += velY;
        dragged.rotation.y += spin * dt;
      }
    }
    if (faceBack && !(dragging && dragged === faceBack)) {
      const turn = Math.atan2(Math.sin(Math.PI - faceBack.rotation.y), Math.cos(Math.PI - faceBack.rotation.y));
      faceBack.rotation.y += turn * 0.16;
    }
    faceCamera(trophy, camera);
    const t = clock.elapsedTime;
    const pos = ola.geometry.attributes.position;
    const phases = ola.userData.phases;
    const radii = ola.userData.radii;
    for (let i = 0; i < phases.length; i++) {
      const a = phases[i];
      pos.setY(i, Math.sin(a * 3 + t * 1.4) * 0.48);
      pos.setX(i, Math.cos(a) * radii[i]);
      pos.setZ(i, Math.sin(a) * radii[i]);
    }
    pos.needsUpdate = true;
    ola.position.y = ball.position.y;

    if (goalMode) {
      camera.position.x += (goalCam.x - camera.position.x) * 0.08;
      camera.position.y += (goalCam.y - camera.position.y) * 0.08;
      camera.position.z += (goalCam.z - camera.position.z) * 0.08;
      camera.lookAt(goalLook);
      if (toPoint && toPoint.y > -0.5) shotTo.lookAt(camera.position);
      if (shotT >= 0) {
        shotT += dt;
        const flight = Math.min(shotT / shotDur, 1);
        const eased = 1 - (1 - flight) * (1 - flight);
        shotCurve.getPoint(eased, shotPoint);
        const inside =
          shotPoint.x > -2.05 &&
          shotPoint.x < 2.45 &&
          shotPoint.y > -0.9 &&
          shotPoint.y < 0.42;
        if (!cheered && shotPrevZ > mouthZ && shotPoint.z <= mouthZ && inside) {
          cheered = true;
          if (startCrowd.playCheer) startCrowd.playCheer();
          $("shot-hint").textContent = "Гол";
        } else if (!cheered && shotPrevZ > mouthZ && shotPoint.z <= mouthZ) {
          $("shot-hint").textContent = "Мимо";
        }
        shotPrevZ = shotPoint.z;
        shotBall.position.copy(shotPoint);
        const spinK = 0.55 + shotPower / 100;
        shotBall.rotation.y += dt * (curl ? 18 : 3) * spinK;
        if (curl) shotBall.rotation.z += dt * 7 * spinK;
        if (flight >= 1) shotT = -1;
      }
    } else {
      const narrow = window.innerWidth < 900;
      const focus = focusFinal ? finalBall : ball;
      const eyeY = focus.position.y + (narrow ? -0.28 : 0);
      camera.position.z += (focus.position.z + 3.8 - camera.position.z) * 0.08;
      camera.position.y += (eyeY - camera.position.y) * 0.08;
      camera.position.x += (focus.position.x - camera.position.x) * 0.08;
      camTarget.copy(focus.position);
      camera.lookAt(camTarget);
    }
    stepGoalNet(goalNet, dt, shotT >= 0 && shotBall.visible ? shotBall.position : null, goalMode && shotT >= 0 && shotBall.visible);
    renderer.render(scene, camera);
  }

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.fov = window.innerWidth < 900 ? 62 : 48;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  camera.fov = window.innerWidth < 900 ? 62 : 48;
  camera.updateProjectionMatrix();
  camera.position.set(0, 0, 3.8);
  ball.rotation.y = CHAPTERS[0].rot;
  setLoad(1);
  await new Promise((resolve) => requestAnimationFrame(resolve));
  $("loader").classList.add("hide");
  frame();
}

boot();
