import { Suspense, lazy, useEffect, useState } from "react";
import type { JacketConfig } from "./config";

const Jacket3D = lazy(() => import("./Jacket3D"));

type View = "front" | "back" | "spin";

export default function JacketViewer({ cfg, className }: { cfg: JacketConfig; className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<View>("front");
  useEffect(() => setMounted(true), []);

  const targetY = view === "front" ? 0 : view === "back" ? Math.PI : null;

  return (
    <div className={className}>
      <div className="relative h-72 w-full overflow-hidden rounded-xl bg-[#F5F5F8]">
        {mounted ? (
          <Suspense fallback={<ViewerSkeleton />}>
            <Jacket3D cfg={cfg} spin={view === "spin"} targetY={targetY} />
          </Suspense>
        ) : (
          <ViewerSkeleton />
        )}
        <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-navy/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-navy-foreground">
          Drag to rotate
        </span>
      </div>
      <div className="mt-3 flex justify-center gap-2" role="group" aria-label="Jacket view">
        {(
          [
            ["front", "Front"],
            ["back", "Back"],
            ["spin", "360°"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
              view === id ? "bg-navy text-navy-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
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
