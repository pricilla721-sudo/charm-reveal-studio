import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { JacketConfig } from "./config";

/* ============================================================
   canvas texture helpers
   ============================================================ */
function makeTexture(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  w = 256,
  h = 256,
  repeat?: [number, number],
) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

/** subtle melton-wool fibre bump */
function woolBump() {
  return makeTexture(
    (ctx, w, h) => {
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 26000; i++) {
        const v = 128 + (Math.random() - 0.5) * 90;
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 1.4, 1.4);
      }
    },
    512,
    512,
    [7, 7],
  );
}

/** vertical rib knit for collar / cuffs / waistband */
function ribBump() {
  return makeTexture(
    (ctx, w, h) => {
      for (let x = 0; x < w; x += 8) {
        const g = ctx.createLinearGradient(x, 0, x + 8, 0);
        g.addColorStop(0, "#4a4a4a");
        g.addColorStop(0.5, "#e2e2e2");
        g.addColorStop(1, "#4a4a4a");
        ctx.fillStyle = g;
        ctx.fillRect(x, 0, 8, h);
      }
    },
    256,
    64,
    [10, 1],
  );
}

/** fine grain for leather sleeves */
function leatherBump() {
  return makeTexture(
    (ctx, w, h) => {
      ctx.fillStyle = "#8a8a8a";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 5200; i++) {
        const r = 2 + Math.random() * 5;
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.16})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(0,0,0,${Math.random() * 0.12})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    },
    512,
    512,
    [4, 4],
  );
}


/* ============================================================
   procedural noise + normal maps (fabric realism)
   ============================================================ */
function hash2(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
/** value noise, seamless in u (period fx) */
function nz(u: number, v: number, fx: number, fy: number) {
  const x = u * fx;
  const y = v * fy;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const sm = (t: number) => t * t * (3 - 2 * t);
  const su = sm(xf);
  const sv = sm(yf);
  const wx = (i: number) => ((i % fx) + fx) % fx;
  const a = hash2(wx(xi), yi);
  const b = hash2(wx(xi + 1), yi);
  const c = hash2(wx(xi), yi + 1);
  const d = hash2(wx(xi + 1), yi + 1);
  return (a * (1 - su) + b * su) * (1 - sv) + (c * (1 - su) + d * su) * sv - 0.5;
}

/** build a tangent-space normal map from a height field */
function normalMap(height: (x: number, y: number) => number, size: number, repeat: [number, number], strength = 2.4) {
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) h[y * size + x] = height(x / size, y / size);
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const at = (x: number, y: number) => h[(((y % size) + size) % size) * size + (((x % size) + size) % size)]!;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.sqrt(dx * dx + dy * dy + 1);
      const i = (y * size + x) * 4;
      img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = (1 / len) * 0.5 * 255 + 127;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 8;
  return t;
}

/** melton wool: twill weave + fibre fuzz */
function woolNormal() {
  return normalMap(
    (x, y) => {
      const twill = Math.sin((x * 34 + y * 34) * Math.PI) * 0.45;
      const warp = Math.sin(x * 200 * Math.PI) * 0.18;
      const weft = Math.sin(y * 200 * Math.PI) * 0.18;
      const fuzz = (hash2(Math.floor(x * 512), Math.floor(y * 512)) - 0.5) * 0.5;
      return twill + warp + weft + fuzz;
    },
    512,
    [5, 5],
    1.9,
  );
}

/** ribbed knit for collar / cuffs / waistband */
function ribNormal() {
  return normalMap(
    (x, y) => {
      const rib = Math.cos(x * 46 * Math.PI) * 0.9;
      const purl = Math.sin(y * 120 * Math.PI) * 0.12;
      const fuzz = (hash2(Math.floor(x * 400), Math.floor(y * 400)) - 0.5) * 0.25;
      return rib + purl + fuzz;
    },
    256,
    [7, 2],
    2.6,
  );
}

/** pebbled leather grain */
function leatherNormal() {
  return normalMap(
    (x, y) => nz(x, y, 40, 40) * 1.0 + nz(x, y, 90, 90) * 0.5 + nz(x, y, 180, 180) * 0.25,
    512,
    [3, 3],
    3.2,
  );
}

/** chenille loop texture for patches */
function chenilleNormal() {
  return normalMap((x, y) => nz(x, y, 70, 70) * 0.9 + nz(x, y, 160, 160) * 0.4, 256, [3, 3], 2.2);
}

/* ---------- patch artwork (chenille felt look) ---------- */
const CHENILLE = "#F4EFE5";
const STITCH = "#8C8271";

function felt(ctx: CanvasRenderingContext2D, w: number, h: number, fill = CHENILLE) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(6, 6, w - 12, h - 12, Math.min(w, h) * 0.14);
  ctx.fill();
  ctx.strokeStyle = STITCH;
  ctx.lineWidth = 3;
  ctx.setLineDash([9, 7]);
  ctx.stroke();
  ctx.setLineDash([]);
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
}

function labelTexture(text: string, opts: { size?: number; color?: string; w?: number; h?: number } = {}) {
  const w = opts.w ?? 256;
  const h = opts.h ?? 160;
  return makeTexture(
    (ctx) => {
      felt(ctx, w, h);
      ctx.fillStyle = opts.color ?? "#3B3227";
      ctx.font = `700 ${opts.size ?? 64}px Georgia, serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, w / 2, h / 2 + 2);
    },
    w,
    h,
  );
}

function letterTexture(char: string, navy: string) {
  return makeTexture(
    (ctx, w, h) => {
      felt(ctx, w, h);
      ctx.strokeStyle = navy;
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.roundRect(34, 34, w - 68, h - 68, 10);
      ctx.stroke();
      ctx.fillStyle = navy;
      ctx.font = "700 160px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(char, w / 2, h / 2 + 8);
    },
    256,
    320,
  );
}

function scriptTexture(lines: string[], color: string, script: boolean) {
  const w = 512;
  const h = 256;
  return makeTexture(
    (ctx) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.25)";
      ctx.shadowBlur = 6;
      ctx.font = `${script ? "italic " : ""}700 ${lines.length > 1 ? 92 : 116}px Georgia, serif`;
      if (lines.length > 1) {
        ctx.fillText(lines[0] ?? "", w / 2, h / 2 - 50);
        ctx.font = `${script ? "italic " : ""}600 64px Georgia, serif`;
        ctx.fillText(lines[1] ?? "", w / 2, h / 2 + 54);
      } else {
        ctx.fillText(lines[0] ?? "", w / 2, h / 2);
      }
    },
    w,
    h,
  );
}

/* ============================================================
   geometry: lofted garment surfaces
   ============================================================ */
const N_EXP = 2.6; // superellipse exponent -> rounded torso cross-section

function ringPoint(u: number, rx: number, rz: number) {
  const a = u * Math.PI * 2;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const x = Math.sign(c) * Math.pow(Math.abs(c), 2 / N_EXP) * rx;
  const z = Math.sign(s) * Math.pow(Math.abs(s), 2 / N_EXP) * rz;
  return [x, z] as const;
}

type Ring = { y: number; rx: number; rz: number };

function loft(
  rings: Ring[],
  uSeg = 76,
  capBottom = true,
  capTop = true,
  wrinkle?: (u: number, v: number) => number,
) {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const V = rings.length;
  const row = uSeg + 1;

  for (let vi = 0; vi < V; vi++) {
    const r = rings[vi]!;
    for (let ui = 0; ui <= uSeg; ui++) {
      const u = ui / uSeg;
      const v = vi / (V - 1);
      const d = wrinkle ? wrinkle(u, v) : 0;
      const [x, z] = ringPoint(u, r.rx * (1 + d), r.rz * (1 + d));
      pos.push(x, r.y + (wrinkle ? d * 0.35 : 0), z);
      uv.push(u * 2.2, v * 2.4);
    }
  }
  for (let vi = 0; vi < V - 1; vi++) {
    for (let ui = 0; ui < uSeg; ui++) {
      const a = vi * row + ui;
      const b = a + 1;
      const c = a + row;
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const cap = (vi: number, yOff: number, flip: boolean) => {
    const center = pos.length / 3;
    pos.push(0, rings[vi]!.y + yOff, 0);
    uv.push(0.5, 0.5);
    for (let ui = 0; ui < uSeg; ui++) {
      const a = vi * row + ui;
      if (flip) idx.push(center, a + 1, a);
      else idx.push(center, a, a + 1);
    }
  };
  if (capBottom) cap(0, -0.01, false);
  if (capTop) cap(V - 1, 0.01, true);

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** smooth profile from keyframes -> rings */
function profileRings(keys: Ring[], steps: number): Ring[] {
  const curve = new THREE.CatmullRomCurve3(
    keys.map((k) => new THREE.Vector3(k.y, k.rx, k.rz)),
    false,
    "catmullrom",
    0.5,
  );
  const out: Ring[] = [];
  for (let i = 0; i <= steps; i++) {
    const p = curve.getPoint(i / steps);
    out.push({ y: p.x, rx: p.y, rz: p.z });
  }
  return out;
}

const BODY_KEYS: Ring[] = [
  { y: -0.78, rx: 0.5, rz: 0.2 },
  { y: -0.68, rx: 0.535, rz: 0.215 },
  { y: -0.42, rx: 0.5, rz: 0.2 },
  { y: -0.1, rx: 0.505, rz: 0.205 },
  { y: 0.2, rx: 0.53, rz: 0.215 },
  { y: 0.45, rx: 0.555, rz: 0.225 },
  { y: 0.6, rx: 0.545, rz: 0.222 },
  { y: 0.7, rx: 0.44, rz: 0.2 },
  { y: 0.78, rx: 0.26, rz: 0.15 },
  { y: 0.82, rx: 0.16, rz: 0.105 },
];

/** soft cloth drape: vertical folds at the hem, pull under the arms, general slack */
function bodyWrinkle(u: number, v: number) {
  const hem = Math.max(0, 1 - v / 0.3);
  const arm = Math.max(0, 1 - Math.abs(v - 0.8) / 0.18);
  const chest = Math.max(0, 1 - Math.abs(v - 0.55) / 0.3);
  let d = 0.013 * nz(u, v, 8, 4) + 0.007 * nz(u, v, 17, 9);
  d += 0.014 * hem * Math.sin(u * Math.PI * 2 * 11 + 0.7);
  d += 0.011 * arm * nz(u, v, 12, 5);
  d -= 0.008 * chest * Math.abs(nz(u, v, 6, 3));
  return d;
}

function useBodyGeometry() {
  return useMemo(() => loft(profileRings(BODY_KEYS, 92), 110, true, true, bodyWrinkle), []);
}

/** front surface z for a given x at chest height (used to curve patches onto the body) */
function frontZ(x: number, rx = 0.53, rz = 0.222) {
  const t = Math.min(Math.abs(x) / rx, 0.999);
  return rz * Math.pow(1 - Math.pow(t, N_EXP), 1 / N_EXP);
}

/** curved patch that hugs the torso (front or back) */
function patchGeometry(w: number, h: number, back: boolean, lift: number) {
  const seg = 16;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let j = 0; j <= seg; j++) {
    const py = (j / seg - 0.5) * h;
    for (let i = 0; i <= seg; i++) {
      const px = (i / seg - 0.5) * w;
      const z = frontZ(px) + lift;
      pos.push(px, py, back ? -z : z);
      uv.push(back ? 1 - i / seg : i / seg, j / seg);
    }
  }
  const row = seg + 1;
  for (let j = 0; j < seg; j++) {
    for (let i = 0; i < seg; i++) {
      const a = j * row + i;
      const b = a + 1;
      const c = a + row;
      const d = c + 1;
      if (back) idx.push(a, c, b, b, c, d);
      else idx.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** tapered, gently bent tube for raglan sleeves */
function tubeGeometry(
  points: THREE.Vector3[],
  radius: (t: number) => number,
  tub = 40,
  rad = 28,
  wrinkle?: (u: number, t: number) => number,
) {
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.4);
  const frames = curve.computeFrenetFrames(tub, false);
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= tub; i++) {
    const t = i / tub;
    const p = curve.getPoint(t);
    const N = frames.normals[Math.min(i, tub - 1)]!;
    const B = frames.binormals[Math.min(i, tub - 1)]!;
    for (let j = 0; j <= rad; j++) {
      const a = (j / rad) * Math.PI * 2;
      const r = radius(t) * (1 + (wrinkle ? wrinkle(j / rad, t) : 0));
      const sx = Math.cos(a) * r;
      const sy = Math.sin(a) * r;
      pos.push(p.x + N.x * sx + B.x * sy, p.y + N.y * sx + B.y * sy, p.z + N.z * sx + B.z * sy);
      uv.push((j / rad) * 1.6, t * 3.2);
    }
  }
  const row = rad + 1;
  for (let i = 0; i < tub; i++) {
    for (let j = 0; j < rad; j++) {
      const a = i * row + j;
      const b = a + 1;
      const c = a + row;
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* ============================================================
   parts
   ============================================================ */
function Sleeve({
  side,
  color,
  trim,
  leather,
  bump,
  ribMap,
}: {
  side: 1 | -1;
  color: string;
  trim: string;
  leather: boolean;
  bump: THREE.Texture;
  ribMap: THREE.Texture;
}) {
  const geo = useMemo(
    () =>
      tubeGeometry(
        [
          new THREE.Vector3(side * 0.3, 0.62, 0),
          new THREE.Vector3(side * 0.52, 0.44, 0.01),
          new THREE.Vector3(side * 0.68, 0.14, 0.03),
          new THREE.Vector3(side * 0.79, -0.18, 0.07),
          new THREE.Vector3(side * 0.86, -0.5, 0.12),
        ],
        (t) => 0.235 - 0.115 * Math.pow(t, 0.85),
        56,
        36,
        (u, t) => {
          const elbow = Math.max(0, 1 - Math.abs(t - 0.55) / 0.22);
          return 0.02 * nz(u, t, 7, 5) + 0.03 * elbow * Math.sin(u * Math.PI * 2 * 5 + t * 9);
        },
      ),
    [side],
  );
  const cuff = useMemo(
    () =>
      tubeGeometry(
        [new THREE.Vector3(side * 0.855, -0.46, 0.115), new THREE.Vector3(side * 0.875, -0.62, 0.145)],
        () => 0.125,
        6,
        24,
      ),
    [side],
  );
  return (
    <group>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={color}
          roughness={leather ? 0.45 : 0.94}
          metalness={0}
          normalMap={bump}
          normalScale={new THREE.Vector2(leather ? 1.1 : 0.9, leather ? 1.1 : 0.9)}
          clearcoat={leather ? 0.45 : 0}
          clearcoatRoughness={leather ? 0.55 : 1}
          sheen={leather ? 0 : 0.3}
          sheenRoughness={0.65}
          envMapIntensity={leather ? 0.9 : 0.45}
          side={THREE.FrontSide}
        />
      </mesh>
      <mesh geometry={cuff} castShadow>
        <meshPhysicalMaterial
          color={trim}
          roughness={0.98}
          normalMap={ribMap}
          normalScale={new THREE.Vector2(1.4, 1.4)}
          sheen={0.5}
          envMapIntensity={0.3}
          side={THREE.FrontSide}
        />
      </mesh>
    </group>
  );
}

function Patch({
  map,
  normal,
  size,
  position,
  back,
}: {
  map: THREE.Texture;
  normal?: THREE.Texture | null;
  size: [number, number];
  position: [number, number, number];
  back?: boolean;
}) {
  const geo = useMemo(() => patchGeometry(size[0], size[1], !!back, 0.012), [size[0], size[1], back]);
  return (
    <mesh geometry={geo} position={[position[0], position[1], 0]} castShadow>
      <meshPhysicalMaterial
        map={map}
        transparent
        roughness={0.95}
        normalMap={normal ?? null}
        normalScale={new THREE.Vector2(0.6, 0.6)}
        sheen={0.7}
        sheenRoughness={0.6}
        envMapIntensity={0.35}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

function JacketModel({ cfg }: { cfg: JacketConfig }) {
  const body = useBodyGeometry();
  const wool = useMemo(woolNormal, []);
  const rib = useMemo(ribNormal, []);
  const leatherTex = useMemo(leatherNormal, []);
  const chenille = useMemo(chenilleNormal, []);
  const placketGeo = useMemo(() => patchGeometry(0.1, 1.5, false, 0.006), []);
  const pocketGeo = useMemo(() => patchGeometry(0.26, 0.035, false, 0.008), []);
  const sleeveColor = cfg.leather ? "#7C5B41" : cfg.sleeveColor;

  const collar = useMemo(
    () =>
      loft(
        profileRings(
          [
            { y: 0.74, rx: 0.42, rz: 0.205 },
            { y: 0.8, rx: 0.36, rz: 0.185 },
            { y: 0.9, rx: 0.3, rz: 0.165 },
          ],
          12,
        ),
        60,
        false,
        false,
      ),
    [],
  );
  const band = useMemo(
    () =>
      loft(
        profileRings(
          [
            { y: -0.94, rx: 0.485, rz: 0.195 },
            { y: -0.86, rx: 0.515, rz: 0.207 },
            { y: -0.76, rx: 0.525, rz: 0.212 },
          ],
          12,
        ),
        60,
        false,
        false,
      ),
    [],
  );

  const letterMap = useMemo(
    () => (cfg.letter ? letterTexture(cfg.letterChar, cfg.bodyColor) : null),
    [cfg.letter, cfg.letterChar, cfg.bodyColor],
  );
  const monoMap = useMemo(
    () => (cfg.mono ? scriptTexture([cfg.monoText || "Name"], cfg.trimColor, cfg.monoScript) : null),
    [cfg.mono, cfg.monoText, cfg.monoScript, cfg.trimColor],
  );
  const yearMap = useMemo(() => (cfg.year ? labelTexture(cfg.year, { size: 78, w: 200, h: 150 }) : null), [cfg.year]);
  const mascotMap = useMemo(() => (cfg.mascot ? labelTexture("MASCOT", { size: 42, w: 240, h: 150 }) : null), [cfg.mascot]);
  const numberMap = useMemo(() => (cfg.number ? labelTexture(cfg.number, { size: 84, w: 200, h: 150 }) : null), [cfg.number]);
  const insertMap = useMemo(() => labelTexture("ACT", { size: 56, w: 220, h: 150 }), []);
  const backMap = useMemo(
    () =>
      cfg.backName
        ? scriptTexture([cfg.backLine1 || "Last Name", ...(cfg.backLine2 ? [cfg.backLine2] : [])], cfg.trimColor, cfg.backScript)
        : null,
    [cfg.backName, cfg.backLine1, cfg.backLine2, cfg.backScript, cfg.trimColor],
  );

  return (
    <group position={[0, 0.05, 0]}>
      {/* wool body */}
      <mesh geometry={body} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={cfg.bodyColor}
          roughness={0.96}
          metalness={0}
          normalMap={wool}
          normalScale={new THREE.Vector2(1.25, 1.25)}
          sheen={0.35}
          sheenRoughness={0.55}
          sheenColor={new THREE.Color("#b8c4dd")}
          envMapIntensity={0.45}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* ribbed knit collar + waistband */}
      <mesh geometry={collar} castShadow>
        <meshPhysicalMaterial
          color={cfg.trimColor}
          roughness={0.98}
          normalMap={rib}
          normalScale={new THREE.Vector2(1.5, 1.5)}
          sheen={0.5}
          sheenRoughness={0.85}
          envMapIntensity={0.3}
          side={THREE.FrontSide}
        />
      </mesh>
      <mesh geometry={band} castShadow>
        <meshPhysicalMaterial
          color={cfg.trimColor}
          roughness={0.98}
          normalMap={rib}
          normalScale={new THREE.Vector2(1.5, 1.5)}
          sheen={0.5}
          sheenRoughness={0.85}
          envMapIntensity={0.3}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* snap placket + snaps, curved to the body */}
      <mesh geometry={placketGeo} position={[0, -0.02, 0]} castShadow>
        <meshPhysicalMaterial
          color={cfg.bodyColor}
          roughness={0.9}
          normalMap={wool}
          normalScale={new THREE.Vector2(0.7, 0.7)}
          sheen={0.6}
          envMapIntensity={0.4}
          side={THREE.FrontSide}
        />
      </mesh>
      {[0.56, 0.28, 0, -0.28, -0.56].map((y) => (
        <mesh key={y} position={[0, y, frontZ(0) + 0.024]}>
          <sphereGeometry args={[0.026, 18, 12]} />
          <meshStandardMaterial color="#D9D3C5" roughness={0.25} metalness={0.9} />
        </mesh>
      ))}

      {/* welt pockets */}
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={pocketGeo} position={[s * 0.28, -0.5, 0]} rotation={[0, 0, s * 0.14]}>
          <meshStandardMaterial color={cfg.bodyColor} roughness={0.55} envMapIntensity={0.5} side={THREE.FrontSide} />
        </mesh>
      ))}

      <Sleeve side={-1} color={sleeveColor} trim={cfg.trimColor} leather={cfg.leather} bump={cfg.leather ? leatherTex : wool} ribMap={rib} />
      <Sleeve side={1} color={sleeveColor} trim={cfg.trimColor} leather={cfg.leather} bump={cfg.leather ? leatherTex : wool} ribMap={rib} />

      {/* front decoration */}
      {letterMap && <Patch normal={chenille} map={letterMap} size={[0.3, 0.375]} position={[-0.21, 0.3, 0]} />}
      {monoMap && <Patch normal={chenille} map={monoMap} size={[0.4, 0.2]} position={[0.24, 0.3, 0]} />}
      {yearMap && <Patch normal={chenille} map={yearMap} size={[0.2, 0.15]} position={[0.3, -0.22, 0]} />}
      {mascotMap && <Patch normal={chenille} map={mascotMap} size={[0.24, 0.15]} position={[0.3, -0.44, 0]} />}
      {numberMap && <Patch normal={chenille} map={numberMap} size={[0.2, 0.15]} position={[-0.3, -0.44, 0]} />}
      {Array.from({ length: Math.min(cfg.inserts, 3) }).map((_, i) => (
        <Patch key={i} map={insertMap} size={[0.22, 0.15]} position={[-0.3, -0.22 + i * -0.44, 0]} />
      ))}

      {/* back name */}
      {backMap && <Patch normal={chenille} map={backMap} size={[0.8, 0.4]} position={[0, 0.2, 0]} back />}
    </group>
  );
}

/* ============================================================
   scene
   ============================================================ */
export default function Jacket3D({
  cfg,
  spin,
  targetY,
}: {
  cfg: JacketConfig;
  spin: boolean;
  targetY: number | null;
}) {
  const inner = useRef<THREE.Group>(null);

  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0.1, 3.9], fov: 30 }} gl={{ antialias: true }}>
      <color attach="background" args={["#F5F5F8"]} />
      <hemisphereLight args={["#eef2ff", "#b8b5ad", 0.32]} />
      <directionalLight
        position={[2.5, 3.5, 3]}
        intensity={1.7}
        castShadow
        shadow-bias={-0.0008}
        shadow-radius={4}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />
      <directionalLight position={[-3, 1.5, -2.5]} intensity={0.45} />
      {/* rim light for fabric edge definition */}
      <spotLight position={[-2.2, 2.2, -3.2]} angle={0.7} penumbra={1} intensity={0.9} color="#dce4f5" />
      <Environment>
        <Lightformer intensity={1.7} position={[0, 4, 2]} scale={[8, 8, 1]} />
        <Lightformer intensity={0.9} color="#dfe6f2" position={[-4, 1, -2]} rotation-y={Math.PI / 2} scale={[12, 3, 1]} />
        <Lightformer intensity={0.7} color="#fff4e2" position={[4, 0.5, 1]} rotation-y={-Math.PI / 2} scale={[10, 3, 1]} />
      </Environment>
      <Suspense fallback={null}>
        <SpinGroup spin={spin} targetY={targetY} innerRef={inner}>
          <JacketModel cfg={cfg} />
        </SpinGroup>
      </Suspense>
      <ContactShadows position={[0, -1.05, 0]} opacity={0.3} scale={5} blur={2.8} far={2} />
      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={7}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.7}
        target={[0, 0, 0]}
        makeDefault
      />
    </Canvas>
  );
}

function SpinGroup({
  spin,
  targetY,
  innerRef,
  children,
}: {
  spin: boolean;
  targetY: number | null;
  innerRef: React.RefObject<THREE.Group | null>;
  children: React.ReactNode;
}) {
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const g = innerRef.current;
    if (!g) return;
    if (targetY !== null) {
      const diff = ((targetY - g.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
      g.rotation.y += diff * (1 - Math.exp(-7 * dt));
    } else if (spin) {
      g.rotation.y += dt * 0.45;
    }
  });
  return <group ref={innerRef}>{children}</group>;
}
