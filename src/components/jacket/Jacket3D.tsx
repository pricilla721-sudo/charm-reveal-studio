import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { JacketConfig } from "./config";

/* ---------- canvas texture helpers ---------- */
function patchTexture(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w = 256, h = 256) {
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

const CHENILLE = "#F2EDE3";
const STITCH = "#8C8271";

function felt(ctx: CanvasRenderingContext2D, w: number, h: number, fill = CHENILLE) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  const r = Math.min(w, h) * 0.12;
  ctx.roundRect(4, 4, w - 8, h - 8, r);
  ctx.fill();
  ctx.strokeStyle = STITCH;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.stroke();
  ctx.setLineDash([]);
  // fibrous noise for chenille feel
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
}

function labelTexture(text: string, opts: { size?: number; color?: string; script?: boolean; w?: number; h?: number } = {}) {
  const w = opts.w ?? 256;
  const h = opts.h ?? 160;
  return patchTexture((ctx) => {
    felt(ctx, w, h);
    ctx.fillStyle = opts.color ?? "#3B3227";
    ctx.font = `700 ${opts.size ?? 64}px ${opts.script ? "Georgia, serif" : "Georgia, serif"}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, w / 2, h / 2 + 2);
  }, w, h);
}

function letterTexture(char: string, navy: string) {
  return patchTexture((ctx, w, h) => {
    felt(ctx, w, h);
    ctx.strokeStyle = navy;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.roundRect(34, 34, w - 68, h - 68, 8);
    ctx.stroke();
    ctx.fillStyle = navy;
    ctx.font = "700 150px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(char, w / 2, h / 2 + 8);
  }, 256, 320);
}

function scriptTexture(lines: string[], color: string, script: boolean) {
  const w = 512;
  const h = 256;
  return patchTexture((ctx) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${script ? "italic " : ""}700 ${lines.length > 1 ? 88 : 110}px Georgia, serif`;
    if (lines.length > 1) {
      ctx.fillText(lines[0] ?? "", w / 2, h / 2 - 48);
      ctx.font = `${script ? "italic " : ""}600 62px Georgia, serif`;
      ctx.fillText(lines[1] ?? "", w / 2, h / 2 + 52);
    } else {
      ctx.fillText(lines[0] ?? "", w / 2, h / 2);
    }
  }, w, h);
}

/* ---------- geometry ---------- */
const DEPTH = 0.42;
const FRONT = DEPTH / 2 + 0.012;
const BACK = -FRONT;

function useTorsoGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    // half-width top 0.5, waist 0.46, hem 0.52
    s.moveTo(-0.5, 0.62);
    s.quadraticCurveTo(-0.53, 0.2, -0.5, -0.2);
    s.quadraticCurveTo(-0.52, -0.5, -0.51, -0.66);
    s.lineTo(0.51, -0.66);
    s.quadraticCurveTo(0.52, -0.5, 0.5, -0.2);
    s.quadraticCurveTo(0.53, 0.2, 0.5, 0.62);
    s.quadraticCurveTo(0.26, 0.74, 0, 0.75);
    s.quadraticCurveTo(-0.26, 0.74, -0.5, 0.62);
    const g = new THREE.ExtrudeGeometry(s, {
      depth: DEPTH,
      bevelEnabled: true,
      bevelSize: 0.07,
      bevelThickness: 0.07,
      bevelSegments: 6,
      curveSegments: 24,
    });
    g.translate(0, 0, -DEPTH / 2);
    g.computeVertexNormals();
    return g;
  }, []);
}

function Sleeve({ side, color, trim, leather }: { side: 1 | -1; color: string; trim: string; leather: boolean }) {
  const len = 1.02;
  return (
    <group position={[side * 0.47, 0.55, 0]} rotation={[0, 0, side * -0.3]}>
      <mesh position={[0, -len / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.115, len, 28, 1, false]} />
        <meshStandardMaterial
          color={color}
          roughness={leather ? 0.42 : 0.92}
          metalness={leather ? 0.06 : 0}
        />
      </mesh>
      {/* shoulder cap */}
      <mesh position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[0.2, 24, 16]} />
        <meshStandardMaterial color={color} roughness={leather ? 0.42 : 0.92} metalness={leather ? 0.06 : 0} />
      </mesh>
      {/* knit cuff */}
      <mesh position={[0, -len - 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.125, 0.122, 0.15, 24]} />
        <meshStandardMaterial color={trim} roughness={0.95} />
      </mesh>
    </group>
  );
}

function Patch({
  position,
  size,
  map,
  rotation,
}: {
  position: [number, number, number];
  size: [number, number];
  map: THREE.Texture;
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation ?? [0, 0, 0]} castShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial map={map} transparent roughness={0.85} />
    </mesh>
  );
}

function JacketModel({ cfg }: { cfg: JacketConfig }) {
  const torso = useTorsoGeometry();
  const sleeveColor = cfg.leather ? "#8A6A4F" : cfg.sleeveColor;

  const letterMap = useMemo(() => (cfg.letter ? letterTexture(cfg.letterChar, cfg.bodyColor) : null), [cfg.letter, cfg.letterChar, cfg.bodyColor]);
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
    <group position={[0, -0.05, 0]}>
      {/* body */}
      <mesh geometry={torso} castShadow receiveShadow>
        <meshStandardMaterial color={cfg.bodyColor} roughness={0.94} />
      </mesh>

      {/* knit collar */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[0.56, 0.13, DEPTH + 0.16]} />
        <meshStandardMaterial color={cfg.trimColor} roughness={0.95} />
      </mesh>

      {/* knit waistband */}
      <mesh position={[0, -0.73, 0]} castShadow>
        <boxGeometry args={[1.09, 0.17, DEPTH + 0.14]} />
        <meshStandardMaterial color={cfg.trimColor} roughness={0.95} />
      </mesh>

      {/* snap placket */}
      <mesh position={[0, 0.02, FRONT + 0.004]} castShadow>
        <boxGeometry args={[0.09, 1.38, 0.02]} />
        <meshStandardMaterial color={cfg.bodyColor} roughness={0.8} />
      </mesh>
      {[0.5, 0.22, -0.06, -0.34, -0.6].map((y) => (
        <mesh key={y} position={[0, y, FRONT + 0.02]}>
          <sphereGeometry args={[0.028, 16, 12]} />
          <meshStandardMaterial color="#D8D2C4" roughness={0.28} metalness={0.85} />
        </mesh>
      ))}

      <Sleeve side={-1} color={sleeveColor} trim={cfg.trimColor} leather={cfg.leather} />
      <Sleeve side={1} color={sleeveColor} trim={cfg.trimColor} leather={cfg.leather} />

      {/* front decoration */}
      {letterMap && <Patch position={[-0.2, 0.3, FRONT]} size={[0.3, 0.375]} map={letterMap} />}
      {monoMap && <Patch position={[0.24, 0.3, FRONT]} size={[0.4, 0.2]} map={monoMap} />}
      {yearMap && <Patch position={[0.3, -0.24, FRONT]} size={[0.2, 0.15]} map={yearMap} />}
      {mascotMap && <Patch position={[0.3, -0.46, FRONT]} size={[0.24, 0.15]} map={mascotMap} />}
      {numberMap && <Patch position={[-0.3, -0.46, FRONT]} size={[0.2, 0.15]} map={numberMap} />}
      {Array.from({ length: Math.min(cfg.inserts, 3) }).map((_, i) => (
        <Patch key={i} position={[-0.3, -0.24 + i * -0.44, FRONT]} size={[0.22, 0.15]} map={insertMap} />
      ))}

      {/* back name */}
      {backMap && <Patch position={[0, 0.18, BACK]} size={[0.8, 0.4]} map={backMap} rotation={[0, Math.PI, 0]} />}
    </group>
  );
}

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
      camera={{ position: [0, 0.15, 3.2], fov: 34 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#F5F5F8"]} />
      <hemisphereLight args={["#ffffff", "#c9c6bd", 0.7]} />
      <directionalLight
        position={[2.5, 3.5, 3]}
        intensity={1.6}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />
      <directionalLight position={[-3, 1.5, -2.5]} intensity={0.55} />
      <Environment>
        <Lightformer intensity={1.8} position={[0, 4, 2]} scale={[8, 8, 1]} />
        <Lightformer intensity={0.9} color="#dfe6f2" position={[-4, 1, -2]} rotation-y={Math.PI / 2} scale={[12, 3, 1]} />
      </Environment>
      <Suspense fallback={null}>
        <SpinGroup spin={spin} targetY={targetY} innerRef={inner}>
          <JacketModel cfg={cfg} />
        </SpinGroup>
      </Suspense>
      <ContactShadows position={[0, -1.02, 0]} opacity={0.32} scale={5} blur={2.6} far={2} />
      <OrbitControls
        enablePan={false}
        minDistance={2.1}
        maxDistance={5}
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
