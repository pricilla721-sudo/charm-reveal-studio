import { createFileRoute } from "@tanstack/react-router";
import JacketViewer from "@/components/jacket/JacketViewer";

export const Route = createFileRoute("/jacket-test")({
  ssr: false,
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto max-w-lg p-6">
      <JacketViewer
        cfg={{
          bodyColor: "#1a2b3c",
          sleeveColor: "#EDE7DA",
          trimColor: "#C8102E",
          leather: true,
          letter: true,
          letterChar: "N",
          mono: true,
          monoText: "Alex",
          monoScript: true,
          inserts: 1,
          year: "'28",
          mascot: true,
          number: "23",
          backName: true,
          backLine1: "Johnson",
          backLine2: "",
          backScript: true,
        }}
      />
    </div>
  );
}
