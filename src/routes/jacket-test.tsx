import { createFileRoute } from "@tanstack/react-router";
import JacketViewer from "@/components/jacket/JacketViewer";

export const Route = createFileRoute("/jacket-test")({
  ssr: false,
  component: () => (
    <div className="h-screen w-full">
      <JacketViewer
        cfg={{
          bodyColor: "#14295F",
          sleeveColor: "#EFE9DD",
          trimColor: "#CD171E",
          leather: false,
          letter: true,
          letterChar: "N",
          mono: true,
          monoText: "Avery",
          monoScript: true,
          inserts: 1,
          year: "2028",
          mascot: true,
          number: "23",
          backName: true,
          backLine1: "Johnson",
          backLine2: "",
          backScript: true,
        }}
      />
    </div>
  ),
});
