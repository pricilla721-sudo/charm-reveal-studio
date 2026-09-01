import { Suspense, useMemo, useRef } from "react";
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

    if (b > r + 14 && b > g + 6 && lum < 120 && sat > 0.25) {
      // royal-blue rib stripes
      target = trim;
      ref = 72;
    } else if (b > r + 6 && b > g && lum < 110) {
      // dark navy body panels
      target = body;
      ref = 46;
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

function letterTexture(char: string, feltColor: string) {
  return patchTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.font = `900 ${h * 0.86}px "Arial Black", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#f3ead2";
    ctx.lineWidth = h * 0.14;
    ctx.strokeText(char, w / 2, h / 2);
    ctx.fillStyle = feltColor;
    ctx.fillText(char, w / 2, h / 2);
  }, 256, 320);
}

function scriptTexture(lines: string[], color: string) {
  return patchTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const step = h / (lines.length + 0.4);
    lines.forEach((line, i) => {
      ctx.font = `italic 700 ${step * 0.62}px Georgia, serif`;
      ctx.fillText(line, w / 2, step * (i + 0.72));
    });
  }, 512, 256);
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

  const letter = useMemo(
    () => (cfg.letter ? letterTexture(cfg.letterChar || "N", cfg.bodyColor) : null),
    [cfg.letter, cfg.letterChar, cfg.bodyColor],
  );
  const mono = useMemo(
    () => (cfg.mono ? scriptTexture([cfg.monoText || "Name"], "#f3ead2") : null),
    [cfg.mono, cfg.monoText],
  );
  const backName = useMemo(
    () =>
      cfg.backName
        ? scriptTexture([cfg.backLine1 || "Last Name", ...(cfg.backLine2 ? [cfg.backLine2] : [])], "#f3ead2")
        : null,
    [cfg.backName, cfg.backLine1, cfg.backLine2],
  );

  return (
    <group position={[0, 0.06, 0]}>
      {/* GLB root already converts z-up -> y-up; just center + scale */}
      <group scale={SCALE}>
        <primitive object={model} position={[0, -1227, -20]} />
      </group>

      {/* front decorations (tuned against the GLB silhouette) */}
      {letter && (
        <mesh position={[-0.24, 0.28, 0.335]} rotation-y={0.18}>
          <planeGeometry args={[0.26, 0.32]} />
          <meshStandardMaterial map={letter} transparent roughness={0.9} />
        </mesh>
      )}
      {mono && (
        <mesh position={[0.25, 0.3, 0.335]} rotation-y={-0.18}>
          <planeGeometry args={[0.3, 0.15]} />
          <meshStandardMaterial map={mono} transparent roughness={0.9} />
        </mesh>
      )}
      {backName && (
        <mesh position={[0, 0.3, -0.35]} rotation-y={Math.PI}>
          <planeGeometry args={[0.7, 0.35]} />
          <meshStandardMaterial map={backName} transparent roughness={0.9} />
        </mesh>
      )}
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
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0.1, 3.6], fov: 30 }} gl={{ antialias: true }}>
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
