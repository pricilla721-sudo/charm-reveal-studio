import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { JacketConfig } from "./config";

/* ============================================================
   runtime texture recolor
   The GLB ships one fabric atlas:
     - dark navy panels       -> body
     - heather grey sleeves   -> sleeves
     - royal blue rib stripes -> trim
     - white rib stripes      -> kept
   We re-tint per-pixel, preserving the woven shading, and paint
   over the creator watermark baked into the back panel.
   ============================================================ */

const WM = { x0: 330, y0: 845, x1: 460, y1: 905 }; // watermark rect in the 1024 atlas

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function recolorFabric(src: CanvasImageSource, cfg: JacketConfig): THREE.CanvasTexture | null {
  const size = 1024;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(src, 0, 0, size, size);

  // erase watermark first: fill with flat body navy (sampled tone)
  ctx.fillStyle = "#26394f";
  ctx.fillRect(WM.x0, WM.y0, WM.x1 - WM.x0, WM.y1 - WM.y0);

  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  const body = hexToRgb(cfg.bodyColor);
  const sleeve = hexToRgb(cfg.leather ? "#7C5B41" : cfg.sleeveColor);
  const trim = hexToRgb(cfg.trimColor);

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i] ?? 0, g = d[i + 1] ?? 0, b = d[i + 2] ?? 0;
    const lum = (r + g + b) / 3;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;

    let target: [number, number, number] | null = null;
    let ref = lum;

    if (b > 100 && b > g + 40 && b > r + 40 && sat > 0.3) {
      // royal-blue rib stripes (bright blue only — dark navy body must not match)
      target = trim;
      ref = 53;
    } else if (b > r + 6 && b > g && lum < 110) {
      // dark navy body panels
      target = body;
      ref = 40;
    } else if (sat < 0.12 && lum > 120 && lum < 235) {
      // heather grey sleeves
      target = sleeve;
      ref = 190;
    }

    if (target) {
      const k = Math.min(1.6, lum / ref);
      d[i] = Math.min(255, target[0] * k);
      d[i + 1] = Math.min(255, target[1] * k);
      d[i + 2] = Math.min(255, target[2] * k);
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.flipY = false; // glTF UV convention
  // model UVs wrap outside [0,1] — must repeat, not clamp
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
}

/* ============================================================
   chenille patch textures (letter / monogram / back name)
   ============================================================ */
function patchTexture(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  w: number,
  h: number,
) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/* shrink the font until the text fits inside the canvas with padding */
function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  makeFont: (px: number) => string,
  startPx: number,
) {
  let px = startPx;
  for (let i = 0; i < 40; i++) {
    ctx.font = makeFont(px);
    if (ctx.measureText(text).width <= maxWidth) break;
    px *= 0.94;
  }
  return px;
}

function letterTexture(char: string, feltColor: string) {
  return patchTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    const pad = h * 0.16; // room for the chenille outline stroke
    fitFont(ctx, char, w - pad * 2, (px) => `900 ${px}px "Arial Black", sans-serif`, h * 0.74);
    ctx.strokeStyle = "#f3ead2";
    ctx.lineWidth = h * 0.13;
    ctx.strokeText(char, w / 2, h / 2);
    ctx.fillStyle = feltColor;
    ctx.fillText(char, w / 2, h / 2);
  }, 320, 384);
}

function scriptTexture(lines: string[], color: string) {
  return patchTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const step = h / (lines.length + 0.4);
    const pad = w * 0.07;
    lines.forEach((line, i) => {
      fitFont(ctx, line, w - pad * 2, (px) => `italic 700 ${px}px Georgia, serif`, step * 0.6);
      ctx.fillText(line, w / 2, step * (i + 0.72));
    });
  }, 640, 288);
}

/* small sewn felt badge (year, jersey number, activity insert, mascot) */
function badgeTexture(text: string, fill: string, ink: string, round: boolean) {
  return patchTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const m = Math.min(w, h) * 0.08;
    ctx.beginPath();
    if (round) {
      ctx.ellipse(w / 2, h / 2, w / 2 - m, h / 2 - m, 0, 0, Math.PI * 2);
    } else {
      const r = Math.min(w, h) * 0.22;
      const x = m, y = m, ww = w - m * 2, hh = h - m * 2;
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + ww, y, x + ww, y + hh, r);
      ctx.arcTo(x + ww, y + hh, x, y + hh, r);
      ctx.arcTo(x, y + hh, x, y, r);
      ctx.arcTo(x, y, x + ww, y, r);
      ctx.closePath();
    }
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = Math.min(w, h) * 0.07;
    ctx.strokeStyle = "#f3ead2";
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = ink;
    fitFont(ctx, text, w * 0.72, (px) => `800 ${px}px "Arial Black", "DejaVu Sans", sans-serif`, h * 0.5);
    ctx.fillText(text, w / 2, h / 2);
  }, 320, 256);
}

/* ============================================================
   GLB jacket model
   ============================================================ */
const MODEL_URL = "/models/varsity-jacket.glb";
const RAW_HEIGHT = 733; // model units, z-up
const SCALE = 1.9 / RAW_HEIGHT;

function GLBJacket({ cfg }: { cfg: JacketConfig }) {
  const { scene } = useGLTF(MODEL_URL);

  const fabric = useMemo(() => {
    let src: CanvasImageSource | null = null;
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!src && m.isMesh) {
        const mat = m.material as THREE.MeshStandardMaterial;
        if (mat?.map?.image) src = mat.map.image as CanvasImageSource;
      }
    });
    return src ? recolorFabric(src, cfg) : null;
  }, [scene, cfg]);

  const model = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      // hide the model's baked "shine" veil (an unlit translucent white shell)
      if ((mesh.material as THREE.Material)?.type === "MeshBasicMaterial") {
        mesh.visible = false;
        return;
      }
      mesh.castShadow = true;
      mesh.receiveShadow = false;
      const src = mesh.material as THREE.MeshStandardMaterial;
      const hasFabric = !!src.map;
      const mat = new THREE.MeshStandardMaterial({
        map: hasFabric ? fabric : null,
        color: hasFabric ? "#ffffff" : cfg.trimColor,
        roughness: hasFabric ? 0.92 : 0.7,
        metalness: 0,
        side: THREE.DoubleSide,
        envMapIntensity: 0.5,
      });
      mesh.material = mat;
    });
    return root;
  }, [scene, fabric, cfg.trimColor]);

  /* every selectable decoration, with its target spot on the jacket */
  type Spec = {
    id: string;
    tex: THREE.CanvasTexture | null;
    w: number;
    h: number;
    x: number;
    y: number;
    front: boolean;
  };

  const specs = useMemo<Spec[]>(() => {
    const list: Spec[] = [];
    if (cfg.letter)
      list.push({
        id: "letter",
        tex: letterTexture(cfg.letterChar || "N", cfg.bodyColor),
        w: 0.19,
        h: 0.23,
        x: -0.17,
        y: 0.26,
        front: true,
      });
    if (cfg.mono)
      list.push({
        id: "mono",
        tex: scriptTexture([cfg.monoText || "Name"], cfg.trimColor),
        w: 0.26,
        h: 0.11,
        x: 0.18,
        y: 0.27,
        front: true,
      });
    if (cfg.year)
      list.push({
        id: "year",
        tex: badgeTexture(cfg.year, cfg.trimColor, cfg.bodyColor, false),
        w: 0.13,
        h: 0.1,
        x: -0.17,
        y: 0.1,
        front: true,
      });
    if (cfg.number)
      list.push({
        id: "number",
        tex: badgeTexture(cfg.number, cfg.bodyColor, cfg.trimColor, false),
        w: 0.12,
        h: 0.1,
        x: 0.18,
        y: 0.1,
        front: true,
      });
    if (cfg.mascot)
      list.push({
        id: "mascot",
        tex: badgeTexture("★", cfg.trimColor, cfg.bodyColor, true),
        w: 0.11,
        h: 0.11,
        x: -0.45,
        y: 0.17,
        front: true,
      });
    for (let i = 0; i < Math.min(cfg.inserts, 2); i++)
      list.push({
        id: "insert" + i,
        tex: badgeTexture(String(i + 1), cfg.bodyColor, cfg.trimColor, true),
        w: 0.11,
        h: 0.11,
        x: 0.45,
        y: 0.17 - i * 0.14,
        front: true,
      });
    if (cfg.backName)
      list.push({
        id: "backName",
        tex: scriptTexture(
          [cfg.backLine1 || "Last Name", ...(cfg.backLine2 ? [cfg.backLine2] : [])],
          "#f3ead2",
        ),
        w: 0.55,
        h: 0.26,
        x: 0,
        y: 0.28,
        front: false,
      });
    return list;
  }, [cfg]);

  /* Build each patch as a mesh that is projected onto the jacket surface:
     a grid of rays is fired at the fabric and every vertex is placed on the
     hit point (offset along the surface normal). Quads whose corners miss the
     fabric are dropped, so a patch never floats and never cuts through. */
  const groupRef = useRef<THREE.Group>(null);
  const [geos, setGeos] = useState<Map<string, THREE.BufferGeometry>>(new Map());

  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.updateWorldMatrix(true, true);
    const ray = new THREE.Raycaster();

    const conform = (s: Spec): THREE.BufferGeometry | null => {
      const seg = 8;
      const dir = new THREE.Vector3(0, 0, s.front ? -1 : 1);
      const sx = s.front ? 1 : -1; // mirror U on the back so text reads correctly
      const pts: (THREE.Vector3 | null)[] = [];
      let hits = 0;
      for (let j = 0; j <= seg; j++) {
        for (let i = 0; i <= seg; i++) {
          const u = i / seg;
          const v = j / seg;
          const wx = s.x + (u - 0.5) * s.w * sx;
          const wy = s.y + (0.5 - v) * s.h;
          ray.set(new THREE.Vector3(wx, wy + 0.06, s.front ? 3 : -3), dir);
          const hit = ray.intersectObject(model, true)[0];
          if (!hit || !hit.face) {
            pts.push(null);
            continue;
          }
          const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
          if (n.dot(dir) > 0) n.negate();
          const world = hit.point.clone().addScaledVector(n, 0.006);
          pts.push(g.worldToLocal(world));
          hits++;
        }
      }
      if (hits < (seg + 1) * (seg + 1) * 0.4) return null;

      const at = (i: number, j: number) => j * (seg + 1) + i;

      // fill gaps from the nearest hit neighbours so the patch stays one
      // continuous piece instead of showing holes / clipped edges
      for (let pass = 0; pass < seg * 2; pass++) {
        let filled = 0;
        for (let j = 0; j <= seg; j++) {
          for (let i = 0; i <= seg; i++) {
            if (pts[at(i, j)]) continue;
            const nb = [
              [i - 1, j],
              [i + 1, j],
              [i, j - 1],
              [i, j + 1],
            ]
              .filter(([a, b]) => a! >= 0 && a! <= seg && b! >= 0 && b! <= seg)
              .map(([a, b]) => pts[at(a!, b!)])
              .filter(Boolean) as THREE.Vector3[];
            if (!nb.length) continue;
            const avg = nb
              .reduce((acc, v) => acc.add(v), new THREE.Vector3())
              .multiplyScalar(1 / nb.length);
            // extend outward along the patch plane, keep the neighbour depth
            const u = i / seg;
            const v = j / seg;
            const world = new THREE.Vector3(
              s.x + (u - 0.5) * s.w * sx,
              s.y + (0.5 - v) * s.h + 0.06,
              0,
            );
            const local = g.worldToLocal(world);
            pts[at(i, j)] = new THREE.Vector3(local.x, local.y, avg.z);
            filled++;
          }
        }
        if (!filled) break;
      }

      const pos: number[] = [];
      const uv: number[] = [];
      const index: number[] = [];
      for (let j = 0; j <= seg; j++) {
        for (let i = 0; i <= seg; i++) {
          const p = pts[at(i, j)]!;
          pos.push(p.x, p.y, p.z);
          uv.push(i / seg, 1 - j / seg);
        }
      }
      for (let j = 0; j < seg; j++) {
        for (let i = 0; i < seg; i++) {
          const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
          if (s.front) index.push(a, d, c, a, c, b);
          else index.push(a, c, d, a, b, c);
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      geo.setIndex(index);
      geo.computeVertexNormals();
      return geo;
    };

    const next = new Map<string, THREE.BufferGeometry>();
    specs.forEach((s) => {
      const geo = conform(s);
      if (geo) next.set(s.id, geo);
    });
    setGeos(next);
    return () => next.forEach((geo) => geo.dispose());
  }, [model, specs]);

  return (
    <group ref={groupRef} position={[0, 0.06, 0]}>
      {/* GLB root already converts z-up -> y-up; just center + scale */}
      <group scale={SCALE}>
        <primitive object={model} position={[0, -1227, -20]} />
      </group>

      {/* decorations projected onto the fabric surface */}
      {specs.map((s) => {
        const geo = geos.get(s.id);
        if (!geo) return null;
        return (
          <mesh key={s.id} geometry={geo}>
            <meshStandardMaterial
              map={s.tex}
              transparent
              roughness={0.9}
              side={THREE.DoubleSide}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-4}
            />
          </mesh>
        );
      })}
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
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.1, 3.6], fov: 30 }}
      gl={{ antialias: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.0 }}
      onCreated={(state) => {
        (window as unknown as { __r3f?: unknown }).__r3f = state;
      }}
    >
      <color attach="background" args={["#F5F5F8"]} />
      <hemisphereLight args={["#eef2ff", "#b8b5ad", 0.4]} />
      <directionalLight
        position={[2.5, 3.5, 3]}
        intensity={1.6}
        castShadow
        shadow-bias={-0.0008}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />
      <directionalLight position={[-3, 1.5, -2.5]} intensity={0.5} />
      <spotLight position={[-2.2, 2.2, -3.2]} angle={0.7} penumbra={1} intensity={0.8} color="#dce4f5" />
      <Environment>
        <Lightformer intensity={1.6} position={[0, 4, 2]} scale={[8, 8, 1]} />
        <Lightformer intensity={0.9} color="#dfe6f2" position={[-4, 1, -2]} rotation-y={Math.PI / 2} scale={[12, 3, 1]} />
        <Lightformer intensity={0.7} color="#fff4e2" position={[4, 0.5, 1]} rotation-y={-Math.PI / 2} scale={[10, 3, 1]} />
      </Environment>
      <Suspense fallback={null}>
        <SpinGroup spin={spin} targetY={targetY} innerRef={inner}>
          <GLBJacket cfg={cfg} />
        </SpinGroup>
      </Suspense>
      <ContactShadows position={[0, -1.05, 0]} opacity={0.3} scale={5} blur={2.8} far={2} />
      <OrbitControls
        enablePan={false}
        minDistance={2.4}
        maxDistance={6}
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
