import { Suspense, lazy, useEffect, useState } from "react";
import type { JacketConfig } from "./config";

const Jacket3D = lazy(() => import("./Jacket3D"));

export type JacketView = "front" | "back" | "spin";

const VIEWS = [
  ["front", "Front"],
  ["back", "Back"],
  ["spin", "360°"],
] as const;

export default function JacketViewer({
  cfg,
  className,
  stageClassName = "h-72",
  overlayControls = false,
  showCredit = true,
  view: controlledView,
  onViewChange,
}: {
  cfg: JacketConfig;
  className?: string;
  /** size classes for the 3D stage */
  stageClassName?: string;
  /** float the front/back toggle on top of the stage (for sticky / compact layouts) */
  overlayControls?: boolean;
  showCredit?: boolean;
  view?: JacketView;
  onViewChange?: (v: JacketView) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [localView, setLocalView] = useState<JacketView>("front");
  useEffect(() => setMounted(true), []);

  const view = controlledView ?? localView;
  const setView = (v: JacketView) => {
    setLocalView(v);
    onViewChange?.(v);
  };
  const targetY = view === "front" ? 0 : view === "back" ? Math.PI : null;

  const controls = (
    <div
      className={`flex justify-center gap-1.5 ${
        overlayControls ? "rounded-full bg-card/85 p-1 shadow-[var(--shadow-card)] backdrop-blur" : "mt-3 gap-2"
      }`}
      role="group"
      aria-label="Jacket view"
    >
      {VIEWS.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => setView(id)}
          aria-pressed={view === id}
          className={`font-semibold transition ${overlayControls ? "rounded-full px-3 py-1 text-[11px]" : "rounded-md px-3 py-1 text-xs"} ${
            view === id ? "bg-navy text-navy-foreground" : "bg-transparent text-muted-foreground hover:bg-muted"
          } ${!overlayControls && view !== id ? "bg-muted" : ""}`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <div className={className}>
      <div className={`relative w-full overflow-hidden rounded-lg bg-secondary ${stageClassName}`}>
        {mounted ? (
          <Suspense fallback={<ViewerSkeleton />}>
            <Jacket3D cfg={cfg} spin={view === "spin"} targetY={targetY} />
          </Suspense>
        ) : (
          <ViewerSkeleton />
        )}
        <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-navy/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-navy-foreground">
          Drag to rotate
        </span>
        {overlayControls && <div className="absolute inset-x-0 bottom-2 flex justify-center">{controls}</div>}
      </div>
      {!overlayControls && controls}
      {showCredit && (
        <p className="mt-2 text-center text-[10px] text-muted-foreground/70">
          3D model: “Varsity Jacket” by 3DEE via Sketchfab (CC-BY)
        </p>
      )}
    </div>
  );
}

function ViewerSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
      Loading jacket…
    </div>
  );
}
