import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import jacketCutout from "@/assets/jacket-cutout.png";
import JacketViewer from "@/components/jacket/JacketViewer";
import type { JacketConfig } from "@/components/jacket/config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AllRec Paperless Order — Build Your Letter Jacket" },
      {
        name: "description",
        content:
          "Build and size your letter jacket from a phone. Choose a package, customize patches, confirm your size, and send the order home for approval.",
      },
      {
        property: "og:title",
        content: "AllRec Paperless Order — Build Your Letter Jacket",
      },
      {
        property: "og:description",
        content:
          "Choose a package, customize every patch, and confirm your size — all from one school link.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

/* ---------------- constants ---------------- */
const SCHOOL = {
  name: "Northstar High",
  initials: "NS",
  mascot: "Northstar",
  activity: "Football",
  closes: "October 15",
  colors: { body: "#14295F", sleeve: "#EFE9DD", trim: "#CD171E" },
};

const REP = {
  name: "Dilling Awards",
  short: "Dilling",
  collects: true,
  payNote:
    "Dilling Awards will email you an invoice with a card link, or you can pay at the school office.",
};

const PACKAGES = [
  {
    id: "essential",
    name: "Essential",
    price: 289,
    badge: "",
    blurb: "The jacket, your letter and your name on the chest.",
    inc: ["base", "letter", "mono"],
  },
  {
    id: "classic",
    name: "Classic",
    price: 379,
    badge: "Most popular",
    blurb: "Adds your graduation year, one activity insert and the mascot patch.",
    inc: ["base", "letter", "mono", "year", "insert1", "mascot"],
  },
  {
    id: "complete",
    name: "Complete",
    price: 489,
    badge: "",
    blurb: "Leather sleeves, your name on the back and your jersey number.",
    inc: ["base", "letter", "mono", "year", "insert1", "mascot", "leather", "backname", "number"],
  },
];

const PKG_LABEL: Record<string, string> = {
  base: "Jacket",
  letter: "Award letter",
  mono: "Chest monogram",
  year: "Year patch",
  insert1: "Activity insert",
  mascot: "Mascot patch",
  leather: "Leather sleeves",
  backname: "Back name",
  number: "Jersey number",
};

const PRICE = {
  base: 289,
  leather: 95,
  sailor: 35,
  year: 18,
  insert: 24,
  mascot: 28,
  number: 16,
  position: 18,
  backname: 32,
  backname2: 22,
  mono: 14,
  taxRate: 0.0825,
};

const SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];

const ACTIVITIES = ["Football", "Basketball", "Volleyball", "Band", "Cheer", "Soccer", "Track"];

const ORDER: Screen[] = [
  "welcome",
  "student",
  "package",
  "sizing-method",
  "sizing-photo",
  "sizing-quiz",
  "sizing-chart",
  "size-result",
  "build-sleeves",
  "build-letter",
  "build-patches",
  "build-mono",
  "build-placement",
  "build-review",
  "checkout",
  "confirmed",
];

const BUILD_STEPS = [
  { id: "build-sleeves", label: "Sleeves" },
  { id: "build-letter", label: "Letter & year" },
  { id: "build-patches", label: "Patches" },
  { id: "build-mono", label: "Monogram & name" },
  { id: "build-placement", label: "Placement" },
  { id: "build-review", label: "Review" },
];

/* ---------------- types ---------------- */
type Screen =
  | "welcome"
  | "student"
  | "package"
  | "sizing-method"
  | "sizing-photo"
  | "sizing-quiz"
  | "sizing-chart"
  | "size-result"
  | "build-sleeves"
  | "build-letter"
  | "build-patches"
  | "build-mono"
  | "build-placement"
  | "build-review"
  | "checkout"
  | "confirmed";

interface OrderState {
  screen: Screen;
  pkg: string | null;
  sizingMethod: "photo" | "quiz" | "chart" | "measured" | null;
  size: string | null;
  sizeConfirmed: boolean;
  sleeveAdj: string;
  bodyAdj: string;
  sleeves: "vinyl" | "leather";
  sailor: boolean;
  letter: "make" | "none" | "loose" | "included";
  year: boolean;
  yearStyle: string;
  inserts: string[];
  mascotPatch: boolean;
  number: boolean;
  numberVal: string;
  position: boolean;
  positionVal: string;
  backName: boolean;
  backNameL1: string;
  backNameL2: string;
  backNameStyle: string;
  mono: boolean;
  monoText: string;
  monoStyle: string;
  placement: string;
  placementNote: string;
  student: { first: string; last: string; email: string; phone: string; grad: string };
  payer: "parent" | "self" | null;
  parent: { name: string; email: string; phone: string; rel: string };
  policyAck: boolean;
  paid: boolean;
}

/* ---------------- helpers ---------------- */
function money(n: number) {
  return "$" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function money0(n: number) {
  return "$" + Math.round(n).toLocaleString();
}

function useOrderState() {
  return useState<OrderState>({
    screen: "welcome",
    pkg: "classic",
    sizingMethod: null,
    size: null,
    sizeConfirmed: false,
    sleeveAdj: "0",
    bodyAdj: "0",
    sleeves: "vinyl",
    sailor: false,
    letter: "make",
    year: true,
    yearStyle: "Block",
    inserts: ["Football"],
    mascotPatch: true,
    number: false,
    numberVal: "",
    position: false,
    positionVal: "",
    backName: false,
    backNameL1: "",
    backNameL2: "",
    backNameStyle: "Script",
    mono: true,
    monoText: "",
    monoStyle: "Script",
    placement: "standard",
    placementNote: "",
    student: { first: "", last: "", email: "", phone: "", grad: "2028" },
    payer: null,
    parent: { name: "", email: "", phone: "", rel: "Parent" },
    policyAck: false,
    paid: false,
  });
}

function lineItems(state: OrderState) {
  const P = PACKAGES.find((p) => p.id === state.pkg) || null;
  const L: { k: string; v: number; inc?: boolean }[] = [];

  if (P) L.push({ k: P.name + " package", v: P.price });
  else L.push({ k: "Jacket — wool body, vinyl raglan sleeves", v: PRICE.base });

  const add = (key: string, label: string, price: number) => {
    const included = !!(P && P.inc.includes(key));
    L.push(included ? { k: label, v: 0, inc: true } : { k: label, v: price });
  };

  if (state.sleeves === "leather") add("leather", "Leather sleeve upgrade", PRICE.leather);
  if (state.sailor) add("sailor", "Sailor collar upgrade", PRICE.sailor);
  if (state.letter === "make") L.push({ k: "Award letter (make letter)", v: 0, inc: true });
  if (state.letter === "loose") L.push({ k: "Award letter — loose (not sewn on)", v: 0, inc: true });
  if (state.year) add("year", "Graduation year patch — " + state.yearStyle, PRICE.year);
  state.inserts.forEach((i, n) => add("insert" + (n + 1), "Activity insert — " + i, PRICE.insert));
  if (state.mascotPatch) add("mascot", "Mascot on sleeve — Pirate Flag", PRICE.mascot);
  if (state.number) add("number", "Jersey number" + (state.numberVal ? " — " + state.numberVal : ""), PRICE.number);
  if (state.position) add("position", "Position patch" + (state.positionVal ? " — " + state.positionVal : ""), PRICE.position);
  if (state.backName) {
    add("backname", "Back name — " + (state.backNameL1 || "line 1"), PRICE.backname);
    if (state.backNameL2) add("backname2", "Back name — second line", PRICE.backname2);
  }
  if (state.mono) add("mono", "Chest monogram" + (state.monoText ? " — " + state.monoText : ""), PRICE.mono);
  return L;
}

function subtotal(state: OrderState) {
  return lineItems(state).reduce((s, l) => s + l.v, 0);
}
function tax(state: OrderState) {
  return Math.round(subtotal(state) * PRICE.taxRate * 100) / 100;
}
function total(state: OrderState) {
  return Math.round((subtotal(state) + tax(state)) * 100) / 100;
}

function nextScreen(state: OrderState): Screen {
  const idx = ORDER.indexOf(state.screen);
  return ORDER[idx + 1] || state.screen;
}
function prevScreen(state: OrderState): Screen {
  const idx = ORDER.indexOf(state.screen);
  return ORDER[idx - 1] || state.screen;
}

/* ---------------- jacket preview ---------------- */
function JacketPreview({ state, view }: { state: OrderState; view: "front" | "back" }) {
  const body = SCHOOL.colors.body;
  const sleeve = state.sleeves === "leather" ? "#8A6A4F" : SCHOOL.colors.sleeve;
  const trim = SCHOOL.colors.trim;

  return (
    <svg viewBox="0 0 400 480" className="mx-auto h-full w-full" aria-label={`${view === "back" ? "Back" : "Front"} jacket preview`}>
      {/* body */}
      <path d="M120 60 L280 60 L290 420 L110 420 Z" fill={body} />
      {/* left sleeve */}
      <path d="M120 70 L60 120 L40 280 L95 290 L130 180 Z" fill={sleeve} />
      {/* right sleeve */}
      <path d="M280 70 L340 120 L360 280 L305 290 L270 180 Z" fill={sleeve} />
      {/* collar / trim */}
      <path d="M120 60 Q200 20 280 60 L280 80 Q200 50 120 80 Z" fill={trim} />
      {/* cuffs */}
      <rect x="45" y="280" width="55" height="18" fill={trim} />
      <rect x="300" y="280" width="55" height="18" fill={trim} />
      {/* waistband */}
      <rect x="110" y="410" width="180" height="22" fill={trim} />

      {view === "front" ? (
        <>
          {/* award letter */}
          {(state.letter === "make" || state.letter === "included") && (
            <g>
              <rect x="155" y="130" width="90" height="110" rx="8" fill="#F2EDE3" stroke="#7E7364" strokeWidth="2" />
              <rect x="165" y="140" width="70" height="90" rx="4" fill="none" stroke={body} strokeWidth="5" />
              <text x="200" y="210" fontSize="60" textAnchor="middle" fontFamily="Georgia,serif" fontWeight="700" fill={body}>
                N
              </text>
            </g>
          )}
          {/* monogram */}
          {state.mono && (
            <text
              x="200"
              y="280"
              fontSize="22"
              textAnchor="middle"
              fill={trim}
              fontFamily={state.monoStyle.includes("Script") ? "Snell Roundhand, Brush Script MT, cursive" : "Georgia, serif"}
              fontStyle={state.monoStyle.includes("Script") ? "italic" : "normal"}
            >
              {state.monoText || "Name"}
            </text>
          )}
          {/* inserts */}
          {state.inserts.map((_, i) => (
            <g key={i}>
              <rect x={55 + i * 6} y={300 + i * 50} width="52" height="34" rx="6" fill="#F2EDE3" stroke="#8C8271" strokeWidth="1.2" />
              <text x={81 + i * 6} y={322 + i * 50} fontSize="12" textAnchor="middle" fill="#3B3227" fontFamily="Georgia,serif" fontWeight="700">
                ACT
              </text>
            </g>
          ))}
          {/* year */}
          {state.year && (
            <g>
              <rect x="305" y="300" width="50" height="34" rx="6" fill="#F2EDE3" stroke="#8C8271" strokeWidth="1.2" />
              <text x="330" y="322" fontSize="14" textAnchor="middle" fill="#3B3227" fontFamily="Georgia,serif" fontWeight="700">
                '{String(state.student.grad).slice(-2)}
              </text>
            </g>
          )}
          {/* mascot */}
          {state.mascotPatch && (
            <g>
              <rect x="305" y="345" width="54" height="34" rx="6" fill="#F2EDE3" stroke="#8C8271" strokeWidth="1.2" />
              <text x="332" y="367" fontSize="10" textAnchor="middle" fill="#3B3227" fontFamily="Georgia,serif" fontWeight="700">
                MASCOT
              </text>
            </g>
          )}
          {/* number */}
          {state.number && (
            <g>
              <rect x="307" y="390" width="50" height="34" rx="6" fill="#F2EDE3" stroke="#8C8271" strokeWidth="1.2" />
              <text x="332" y="412" fontSize="14" textAnchor="middle" fill="#3B3227" fontFamily="Georgia,serif" fontWeight="700">
                {state.numberVal || "##"}
              </text>
            </g>
          )}
        </>
      ) : (
        <>
          {state.backName && (
            <>
              <text
                x="200"
                y="220"
                fontSize="34"
                textAnchor="middle"
                fill={trim}
                fontFamily={state.backNameStyle === "Script" ? "Snell Roundhand, Brush Script MT, cursive" : "Georgia, serif"}
                fontStyle={state.backNameStyle === "Script" ? "italic" : "normal"}
                fontWeight="600"
              >
                {state.backNameL1 || "Last Name"}
              </text>
              {state.backNameL2 && (
                <text x="200" y="260" fontSize="20" textAnchor="middle" fill={trim} fontFamily="Georgia,serif">
                  {state.backNameL2}
                </text>
              )}
            </>
          )}
        </>
      )}
    </svg>
  );
}

/* ---------------- shared chrome ---------------- */
function AppBar({ sub, inverse }: { sub?: string; inverse?: boolean }) {
  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur ${
        inverse
          ? "border-b border-white/10 bg-navy-deep/60"
          : "border-b border-border/70 bg-background/85"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy font-display text-sm font-bold text-navy-foreground ring-2 ring-brand-red">
          {SCHOOL.initials}
        </div>
        <div className="flex-1">
          <div className={`text-sm font-semibold leading-tight ${inverse ? "text-navy-foreground" : ""}`}>
            {SCHOOL.name}
          </div>
          <div className={`text-xs ${inverse ? "text-navy-foreground/70" : "text-muted-foreground"}`}>
            {sub || "Letter jacket ordering"}
          </div>
        </div>
        <div className={`hidden text-right text-xs sm:block ${inverse ? "text-navy-foreground/70" : "text-muted-foreground"}`}>
          Fulfilled by
          <br />
          <span className={`font-semibold ${inverse ? "text-navy-foreground" : "text-foreground"}`}>
            AllRec Awards
          </span>
        </div>
      </div>
    </header>
  );
}

function Stepper({ current }: { current: string }) {
  const i = BUILD_STEPS.findIndex((s) => s.id === current);
  return (
    <nav className="stepper" aria-label="Jacket builder steps">
      {BUILD_STEPS.map((s, n) => (
        <div
          key={s.id}
          className={`stepper-step ${n === i ? "stepper-step-active" : ""} ${n < i ? "stepper-step-done" : ""}`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
            {n < i ? "✓" : n + 1}
          </span>
          <span dangerouslySetInnerHTML={{ __html: s.label }} />
        </div>
      ))}
    </nav>
  );
}

function PriceRail({ state }: { state: OrderState }) {
  const L = lineItems(state);
  return (
    <aside className="price-rail">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Running total</div>
      <div className="mt-1 font-display text-4xl text-navy">{money(total(state))}</div>
      <div className="text-xs text-muted-foreground">Includes estimated tax</div>
      <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
        {L.map((l) => (
          <div key={l.k} className="flex justify-between gap-3">
            <span className={l.inc ? "text-muted-foreground line-through" : ""}>{l.k}</span>
            <span className="shrink-0">{l.inc ? "Included" : money(l.v)}</span>
          </div>
        ))}
        <div className="flex justify-between gap-3 border-t border-border pt-2 text-muted-foreground">
          <span>Subtotal</span>
          <span className="shrink-0">{money(subtotal(state))}</span>
        </div>
        <div className="flex justify-between gap-3 text-muted-foreground">
          <span>Estimated tax</span>
          <span className="shrink-0">{money(tax(state))}</span>
        </div>
        <div className="flex justify-between gap-3 font-semibold">
          <span>Total</span>
          <span className="shrink-0">{money(total(state))}</span>
        </div>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Prices come from {REP.name}'s package and pricing profile for {SCHOOL.name}. Amounts shown are placeholders.
      </p>
    </aside>
  );
}

function jacketConfig(state: OrderState): JacketConfig {
  return {
    bodyColor: SCHOOL.colors.body,
    sleeveColor: SCHOOL.colors.sleeve,
    trimColor: SCHOOL.colors.trim,
    leather: state.sleeves === "leather",
    letter: state.letter === "make" || state.letter === "included",
    letterChar: SCHOOL.initials.charAt(0),
    mono: state.mono,
    monoText: state.monoText || "Name",
    monoScript: state.monoStyle.includes("Script"),
    inserts: state.inserts.length,
    year: state.year ? "'" + String(state.student.grad).slice(-2) : null,
    mascot: state.mascotPatch,
    number: state.number ? state.numberVal || "##" : null,
    backName: state.backName,
    backLine1: state.backNameL1 || "Last Name",
    backLine2: state.backNameL2 || "",
    backScript: state.backNameStyle === "Script",
  };
}

function MobilePreview({ state }: { state: OrderState }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <JacketViewer cfg={jacketConfig(state)} />
    </div>
  );
}

function PkgChip({ state }: { state: OrderState }) {
  const P = PACKAGES.find((p) => p.id === state.pkg);
  return (
    <div className="pkgchip">
      {P ? (
        <>
          <span className="font-semibold text-foreground">{P.name} package</span>
          <span className="text-muted-foreground">· extras priced separately</span>
        </>
      ) : (
        <>
          <span className="font-semibold text-foreground">Build your own</span>
          <span className="text-muted-foreground">· every item priced separately</span>
        </>
      )}
    </div>
  );
}

/* ---------------- screens ---------------- */
function WelcomeScreen({ state, setState }: { state: OrderState; setState: React.Dispatch<React.SetStateAction<OrderState>> }) {
  return (
    <main className="min-h-screen">
      <AppBar inverse />
      <section className="surface-navy relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 md:grid-cols-[1.05fr_.95fr] md:py-28">
          <div>
            <p className="eyebrow text-gold">
              Class of {state.student.grad} <span className="text-brand-red-bright">· {SCHOOL.activity}</span>
            </p>
            <h1 className="mt-5 text-5xl sm:text-6xl lg:text-7xl">
              Wear what
              <br />
              you <span className="text-gold-gradient">earned.</span>
            </h1>
            <div className="rule-red mt-8 h-px w-24" />
            <p className="mt-7 max-w-lg text-base leading-relaxed text-navy-foreground/75">
              Build your {SCHOOL.mascot} jacket on screen. Every patch, every letter, exactly where you want it — with the price in front of you the whole way.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setState((s) => ({ ...s, screen: "student" }))}
                className="rounded-lg px-6 py-3 text-sm font-semibold text-gold-foreground shadow-[var(--shadow-lift)] transition-transform hover:-translate-y-0.5"
                style={{ background: "var(--gradient-gold)" }}
              >
                Start building
              </button>
            </div>
            <dl className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-navy-foreground/15 pt-7">
              {[
                ["Starting at", "$" + PRICE.base],
                ["Ordering closes", SCHOOL.closes],
                ["Delivered to", SCHOOL.name],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-navy-foreground/60">{k}</dt>
                  <dd className="mt-1 font-display text-xl text-gold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative">
            <div
              className="absolute left-1/2 top-1/2 -z-0 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
              style={{ background: "var(--gradient-gold)", opacity: 0.16 }}
            />
            <img
              src={jacketCutout}
              width={1024}
              height={1408}
              alt="Navy and bone letter jacket with a gold chenille chest letter"
              className="float-anim relative mx-auto w-full max-w-lg -rotate-3 drop-shadow-[0_40px_60px_oklch(0.1_0.04_268_/_0.55)] md:-mr-10 md:scale-110"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            ["1", "Build it", "Sleeves, size, letter, patches, monogram — priced as you go."],
            ["2", "Send it home", "A parent reviews the jacket and the total, then pays from a link."],
            ["3", "Wear it", "Track it through production; delivered to " + SCHOOL.name + "."],
          ].map(([n, t, d]) => (
            <div key={n} className="card-elevated p-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy font-display text-sm font-bold text-gold">
                {n}
              </span>
              <h3 className="mt-4 text-lg">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function StudentScreen({ state, setState }: { state: OrderState; setState: React.Dispatch<React.SetStateAction<OrderState>> }) {
  const update = (key: keyof OrderState["student"], value: string) => {
    setState((s) => ({ ...s, student: { ...s.student, [key]: value } }));
  };
  return (
    <main className="min-h-screen pb-24">
      <AppBar sub="Step 1 of 4 — about you" />
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h2 className="text-4xl sm:text-5xl">Who's this jacket for?</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          We'll print this name on the order and use it to reach you about your jacket.
        </p>
        <div className="card-elevated mt-8 space-y-5 p-6 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="field-label">First name</label>
              <input
                className="field-input"
                value={state.student.first}
                onChange={(e) => update("first", e.target.value)}
                autoComplete="given-name"
              />
            </div>
            <div>
              <label className="field-label">Last name</label>
              <input
                className="field-input"
                value={state.student.last}
                onChange={(e) => update("last", e.target.value)}
                autoComplete="family-name"
              />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="field-label">Your email</label>
              <input
                className="field-input"
                type="email"
                value={state.student.email}
                onChange={(e) => update("email", e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="field-label">Your mobile number</label>
              <input
                className="field-input"
                type="tel"
                value={state.student.phone}
                onChange={(e) => update("phone", e.target.value)}
                autoComplete="tel"
              />
              <p className="mt-1 text-xs text-muted-foreground">Used for order updates only.</p>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="field-label">Graduation year</label>
              <select className="field-input" value={state.student.grad} onChange={(e) => update("grad", e.target.value)}>
                {["2027", "2028", "2029", "2030"].map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Activity you lettered in</label>
              <select className="field-input" disabled>
                <option>
                  {SCHOOL.activity} (from your link)
                </option>
              </select>
              <p className="mt-1 text-xs text-muted-foreground">Set by the link your coordinator sent you.</p>
            </div>
          </div>
        </div>
      </div>
      <ActionBar state={state} setState={setState} nextLabel="Continue" />
    </main>
  );
}

function PackageScreen({ state, setState }: { state: OrderState; setState: React.Dispatch<React.SetStateAction<OrderState>> }) {
  return (
    <main className="min-h-screen pb-24">
      <AppBar sub="Step 2 of 4 — your package" />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
          <div>
            <p className="eyebrow text-brand-red">Packages</p>
            <h2 className="mt-4 text-4xl sm:text-5xl">Pick a package</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {REP.name} offers these for {SCHOOL.name}. Each one is a set price — you can still change colours, size and lettering, and add anything extra you want.
            </p>
            <div className="mt-8 space-y-4">
              {PACKAGES.map((p) => {
                const selected = state.pkg === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setState((s) => ({ ...s, pkg: p.id }))}
                    className={`opt ${selected ? "opt-selected" : ""}`}
                  >
                    <span className={`radio ${selected ? "radio-checked" : ""}`} />
                    <span className="flex-1">
                      <span className="block text-base font-semibold">
                        {p.name}{" "}
                        {p.badge && (
                          <span className="ml-2 rounded-md bg-brand-red px-2 py-0.5 text-xs font-semibold text-white">
                            {p.badge}
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">{p.blurb}</span>
                      <span className="mt-2 block text-xs text-muted-foreground">
                        {p.inc.map((k) => PKG_LABEL[k]).filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block font-display text-2xl text-navy">{money0(p.price)}</span>
                      <span className="block text-xs text-muted-foreground">before tax</span>
                    </span>
                  </button>
                );
              })}
              <button
                onClick={() => setState((s) => ({ ...s, pkg: null }))}
                className={`opt ${state.pkg === null ? "opt-selected" : ""}`}
              >
                <span className={`radio ${state.pkg === null ? "radio-checked" : ""}`} />
                <span className="flex-1">
                  <span className="block text-base font-semibold">Build your own</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    Start from the jacket and add only what you want, each item priced separately.
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-display text-2xl text-navy">from {money0(PRICE.base)}</span>
                  <span className="block text-xs text-muted-foreground">before tax</span>
                </span>
              </button>
            </div>
            <div className="banner banner-info mt-6">
              <span>💡</span>
              <span>Anything you add beyond your package is priced separately and shown as an add-on in your total.</span>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Figures shown are illustrative pending {REP.name} pricing profiles.
            </p>
          </div>
          <PriceRail state={state} />
        </div>
      </div>
      <ActionBar state={state} setState={setState} nextLabel="Continue to sizing" />
    </main>
  );
}

function SizingMethodScreen({ state, setState }: { state: OrderState; setState: React.Dispatch<React.SetStateAction<OrderState>> }) {
  const options: ["photo" | "quiz" | "chart" | "measured", string, string][] = [
    ["measured", "I was measured at a fitting", "Use the size recorded at your school's fitting event — the most accurate option."],
    ["photo", "Phone camera measurement", "Front-facing, arms at sides, plain background. On-screen guidance the whole way."],
    ["quiz", "Sizing questionnaire", "Height, weight, build and fit preference. A good fallback when a helper or good lighting isn't available."],
    ["chart", "Use the size chart", "Already know your size? Pick it directly from the production size chart."],
  ];
  return (
    <main className="min-h-screen pb-24">
      <AppBar sub="Step 3 of 4 — your size" />
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h2 className="text-4xl sm:text-5xl">How do you want to find your size?</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Letter jackets are made to order and can't be returned, so it's worth getting this right. All options end with you confirming the size before we build anything.
        </p>
        <div className="mt-8 space-y-4">
          {options.map(([key, title, desc]) => {
            const selected = state.sizingMethod === key;
            return (
              <button
                key={key}
                onClick={() => setState((s) => ({ ...s, sizingMethod: key }))}
                className={`opt ${selected ? "opt-selected" : ""}`}
              >
                <span className={`radio ${selected ? "radio-checked" : ""}`} />
                <span className="flex-1">
                  <span className="block text-base font-semibold">{title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{desc}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <ActionBar state={state} setState={setState} nextLabel="Continue" />
    </main>
  );
}

function SizingPhotoScreen({ state, setState }: { state: OrderState; setState: React.Dispatch<React.SetStateAction<OrderState>> }) {
  return (
    <main className="min-h-screen pb-24">
      <AppBar sub="Step 3 of 4 — your size" />
      <div className="mx-auto max-w-2xl px-6 py-12 text-center">
        <h2 className="text-4xl sm:text-5xl">Take a sizing photo</h2>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Stand front-facing, arms relaxed at your sides, against a plain wall. We'll estimate your size and you can override it.
        </p>
        <div className="card-elevated mx-auto mt-10 aspect-[3/4] max-w-sm">
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-muted-foreground">
            <div className="text-5xl">📷</div>
            <p className="text-sm">Camera preview would appear here.</p>
          </div>
        </div>
        <button
          onClick={() => setState((s) => ({ ...s, size: "L", screen: "size-result" }))}
          className="mt-8 rounded-lg px-6 py-3 text-sm font-semibold text-gold-foreground"
          style={{ background: "var(--gradient-gold)" }}
        >
          Use recommended size: L
        </button>
      </div>
      <ActionBar state={state} setState={setState} nextLabel="Continue" />
    </main>
  );
}

function SizingQuizScreen({ state, setState }: { state: OrderState; setState: React.Dispatch<React.SetStateAction<OrderState>> }) {
  return (
    <main className="min-h-screen pb-24">
      <AppBar sub="Step 3 of 4 — your size" />
      <div className="mx-auto max-w-xl px-6 py-12">
        <h2 className="text-4xl sm:text-5xl">Answer a few questions</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">We'll match you to the size that fits your build.</p>
        <div className="card-elevated mt-8 space-y-5 p-6 sm:p-8">
          {[
            ["Height", "5'10\"", "height"],
            ["Weight", "160 lbs", "weight"],
            ["Build", "Average", "build"],
            ["Fit preference", "Regular", "fit"],
          ].map(([label, placeholder, key]) => (
            <div key={key}>
              <label className="field-label">{label}</label>
              <input className="field-input" placeholder={placeholder} />
            </div>
          ))}
        </div>
        <button
          onClick={() => setState((s) => ({ ...s, size: "L", screen: "size-result" }))}
          className="mt-6 rounded-lg px-6 py-3 text-sm font-semibold text-gold-foreground"
          style={{ background: "var(--gradient-gold)" }}
        >
          Get recommended size
        </button>
      </div>
      <ActionBar state={state} setState={setState} nextLabel="Continue" />
    </main>
  );
}

function SizingChartScreen({ state, setState }: { state: OrderState; setState: React.Dispatch<React.SetStateAction<OrderState>> }) {
  return (
    <main className="min-h-screen pb-24">
      <AppBar sub="Step 3 of 4 — your size" />
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="text-4xl sm:text-5xl">Pick your size</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Sizes match the production work order sheet.</p>
        <div className="mt-8 grid grid-cols-4 gap-3 sm:grid-cols-8">
          {SIZES.map((sz) => (
            <button
              key={sz}
              onClick={() => setState((s) => ({ ...s, size: sz, screen: "size-result" }))}
              className={`rounded-xl border px-4 py-6 text-center font-display text-lg font-semibold transition-colors ${
                state.size === sz

                  ? "border-gold-deep bg-gold/10 text-navy"
                  : "border-border bg-card text-foreground hover:border-gold-deep"
              }`}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>
      <ActionBar state={state} setState={setState} nextLabel="Continue" />
    </main>
  );
}

function SizeResultScreen({ state, setState }: { state: OrderState; setState: React.Dispatch<React.SetStateAction<OrderState>> }) {
  return (
    <main className="min-h-screen pb-24">
      <AppBar sub="Step 3 of 4 — your size" />
      <div className="mx-auto max-w-2xl px-6 py-12 text-center">
        <p className="eyebrow text-brand-red">Recommended size</p>
        <h2 className="mt-4 text-6xl sm:text-7xl">{state.size || "L"}</h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          Based on your {state.sizingMethod === "photo" ? "photo" : state.sizingMethod === "quiz" ? "questionnaire" : "selection"}. You can change it below if you already know your size.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {SIZES.map((sz) => (
            <button
              key={sz}
              onClick={() => setState((s) => ({ ...s, size: sz, sizeConfirmed: true }))}
              className={`rounded-lg border px-5 py-2.5 text-sm font-semibold ${
                state.size === sz ? "border-gold-deep bg-gold/10 text-navy" : "border-border bg-card text-foreground hover:border-gold-deep"
              }`}
            >
              {sz}
            </button>
          ))}
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="field-label">Sleeve length adjustment</label>
            <select
              className="field-input"
              value={state.sleeveAdj}
              onChange={(e) => setState((s) => ({ ...s, sleeveAdj: e.target.value }))}
            >
              {[-6, -4, -2, 0, 1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={String(n)}>
                  {n > 0 ? `+${n}" longer` : n < 0 ? `${n}" shorter` : "No adjustment"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Body length adjustment</label>
            <select
              className="field-input"
              value={state.bodyAdj}
              onChange={(e) => setState((s) => ({ ...s, bodyAdj: e.target.value }))}
            >
              {[-6, -4, -2, 0, 1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={String(n)}>
                  {n > 0 ? `+${n}" longer` : n < 0 ? `${n}" shorter` : "No adjustment"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <ActionBar state={state} setState={setState} nextLabel="Continue to jacket" />
    </main>
  );
}

function BuildSleevesScreen({ state, setState }: { state: OrderState; setState: React.Dispatch<React.SetStateAction<OrderState>> }) {
  return (
    <main className="min-h-screen pb-24">
      <AppBar sub="Step 4 of 4 — build your jacket" />
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Stepper current="build-sleeves" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
          <div>
            <h2 className="text-4xl sm:text-5xl">Sleeves</h2>
            <div className="mt-8 space-y-4">
              {[
                ["vinyl", "Vinyl raglan sleeves", "Standard on most jackets."],
                ["leather", "Leather sleeves", "Premium upgrade."],
              ].map(([key, title, desc]) => {
                const selected = state.sleeves === key;
                return (
                  <button
                    key={key}
                    onClick={() => setState((s) => ({ ...s, sleeves: key as "vinyl" | "leather" }))}
                    className={`opt ${selected ? "opt-selected" : ""}`}
                  >
                    <span className={`radio ${selected ? "radio-checked" : ""}`} />
                    <span className="flex-1">
                      <span className="block text-base font-semibold">{title}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">{desc}</span>
                    </span>
                  </button>
                );
              })}
              <label className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <input
                  type="checkbox"
                  checked={state.sailor}
                  onChange={(e) => setState((s) => ({ ...s, sailor: e.target.checked }))}
                  className="h-5 w-5 accent-gold-deep"
                />
                <span className="text-sm font-semibold">Add sailor collar (+{money0(PRICE.sailor)})</span>
              </label>
            </div>
          </div>
          <MobilePreview state={state} />
        </div>
      </div>
      <ActionBar state={state} setState={setState} nextLabel="Continue" />
    </main>
  );
}

function BuildLetterScreen({ state, setState }: { state: OrderState; setState: React.Dispatch<React.SetStateAction<OrderState>> }) {
  return (
    <main className="min-h-screen pb-24">
      <AppBar sub="Step 4 of 4 — build your jacket" />
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Stepper current="build-letter" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
          <div>
            <h2 className="text-4xl sm:text-5xl">Letter & year</h2>
            <div className="mt-8 space-y-4">
              {[
                ["make", "Make my letter", "We'll produce the chenille letter and sew it on."],
                ["included", "My letter is included", "Your activity already provided the letter."],
                ["loose", "Loose letter", "We'll include the letter unattached."],
                ["none", "No letter", "Skip the letter entirely."],
              ].map(([key, title, desc]) => {
                const selected = state.letter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setState((s) => ({ ...s, letter: key as OrderState["letter"] }))}
                    className={`opt ${selected ? "opt-selected" : ""}`}
                  >
                    <span className={`radio ${selected ? "radio-checked" : ""}`} />
                    <span className="flex-1">
                      <span className="block text-base font-semibold">{title}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">{desc}</span>
                    </span>
                  </button>
                );
              })}
              <label className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <input
                  type="checkbox"
                  checked={state.year}
                  onChange={(e) => setState((s) => ({ ...s, year: e.target.checked }))}
                  className="h-5 w-5 accent-gold-deep"
                />
                <span className="text-sm font-semibold">Add graduation year patch</span>
              </label>
              {state.year && (
                <select
                  className="field-input"
                  value={state.yearStyle}
                  onChange={(e) => setState((s) => ({ ...s, yearStyle: e.target.value }))}
                >
                  <option>Block</option>
                  <option>Script</option>
                </select>
              )}
            </div>
          </div>
          <MobilePreview state={state} />
        </div>
      </div>
      <ActionBar state={state} setState={setState} nextLabel="Continue" />
    </main>
  );
}

function BuildPatchesScreen({ state, setState }: { state: OrderState; setState: React.Dispatch<React.SetStateAction<OrderState>> }) {
  const toggleInsert = (act: string) => {
    setState((s) => ({
      ...s,
      inserts: s.inserts.includes(act) ? s.inserts.filter((i) => i !== act) : [...s.inserts, act],
    }));
  };
  return (
    <main className="min-h-screen pb-24">
      <AppBar sub="Step 4 of 4 — build your jacket" />
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Stepper current="build-patches" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
          <div>
            <h2 className="text-4xl sm:text-5xl">Patches</h2>
            <div className="mt-8 space-y-6">
              <div>
                <h3 className="text-base font-semibold">Activity inserts</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ACTIVITIES.map((act) => {
                    const selected = state.inserts.includes(act);
                    return (
                      <button
                        key={act}
                        onClick={() => toggleInsert(act)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                          selected ? "border-gold-deep bg-gold/10 text-navy" : "border-border bg-card text-foreground hover:border-gold-deep"
                        }`}
                      >
                        {act}
                      </button>
                    );
                  })}
                </div>
              </div>
              <label className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <input
                  type="checkbox"
                  checked={state.mascotPatch}
                  onChange={(e) => setState((s) => ({ ...s, mascotPatch: e.target.checked }))}
                  className="h-5 w-5 accent-gold-deep"
                />
                <span className="text-sm font-semibold">Mascot patch on sleeve</span>
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <input
                  type="checkbox"
                  checked={state.number}
                  onChange={(e) => setState((s) => ({ ...s, number: e.target.checked }))}
                  className="h-5 w-5 accent-gold-deep"
                />
                <span className="text-sm font-semibold">Jersey number</span>
              </label>
              {state.number && (
                <input
                  className="field-input"
                  placeholder="##"
                  value={state.numberVal}
                  onChange={(e) => setState((s) => ({ ...s, numberVal: e.target.value }))}
                />
              )}
              <label className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <input
                  type="checkbox"
                  checked={state.position}
                  onChange={(e) => setState((s) => ({ ...s, position: e.target.checked }))}
                  className="h-5 w-5 accent-gold-deep"
                />
                <span className="text-sm font-semibold">Position patch</span>
              </label>
              {state.position && (
                <input
                  className="field-input"
                  placeholder="Position"
                  value={state.positionVal}
                  onChange={(e) => setState((s) => ({ ...s, positionVal: e.target.value }))}
                />
              )}
            </div>
          </div>
          <MobilePreview state={state} />
        </div>
      </div>
      <ActionBar state={state} setState={setState} nextLabel="Continue" />
    </main>
  );
}

function BuildMonoScreen({ state, setState }: { state: OrderState; setState: React.Dispatch<React.SetStateAction<OrderState>> }) {
  return (
    <main className="min-h-screen pb-24">
      <AppBar sub="Step 4 of 4 — build your jacket" />
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Stepper current="build-mono" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
          <div>
            <h2 className="text-4xl sm:text-5xl">Monogram & name</h2>
            <div className="mt-8 space-y-5">
              <label className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <input
                  type="checkbox"
                  checked={state.mono}
                  onChange={(e) => setState((s) => ({ ...s, mono: e.target.checked }))}
                  className="h-5 w-5 accent-gold-deep"
                />
                <span className="text-sm font-semibold">Chest monogram</span>
              </label>
              {state.mono && (
                <>
                  <input
                    className="field-input"
                    placeholder="First or last name"
                    value={state.monoText}
                    onChange={(e) => setState((s) => ({ ...s, monoText: e.target.value }))}
                  />
                  <select
                    className="field-input"
                    value={state.monoStyle}
                    onChange={(e) => setState((s) => ({ ...s, monoStyle: e.target.value }))}
                  >
                    <option>Script</option>
                    <option>Block</option>
                  </select>
                </>
              )}
              <label className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <input
                  type="checkbox"
                  checked={state.backName}
                  onChange={(e) => setState((s) => ({ ...s, backName: e.target.checked }))}
                  className="h-5 w-5 accent-gold-deep"
                />
                <span className="text-sm font-semibold">Back name</span>
              </label>
              {state.backName && (
                <>
                  <input
                    className="field-input"
                    placeholder="Last name"
                    value={state.backNameL1}
                    onChange={(e) => setState((s) => ({ ...s, backNameL1: e.target.value }))}
                  />
                  <input
                    className="field-input"
                    placeholder="Second line (optional)"
                    value={state.backNameL2}
                    onChange={(e) => setState((s) => ({ ...s, backNameL2: e.target.value }))}
                  />
                  <select
                    className="field-input"
                    value={state.backNameStyle}
                    onChange={(e) => setState((s) => ({ ...s, backNameStyle: e.target.value }))}
                  >
                    <option>Script</option>
                    <option>Block</option>
                  </select>
                </>
              )}
            </div>
          </div>
          <MobilePreview state={state} />
        </div>
      </div>
      <ActionBar state={state} setState={setState} nextLabel="Continue" />
    </main>
  );
}

function BuildPlacementScreen({ state, setState }: { state: OrderState; setState: React.Dispatch<React.SetStateAction<OrderState>> }) {
  return (
    <main className="min-h-screen pb-24">
      <AppBar sub="Step 4 of 4 — build your jacket" />
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Stepper current="build-placement" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
          <div>
            <h2 className="text-4xl sm:text-5xl">Placement</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Standard placement follows your school's spec. Use the note only if you have a documented exception.
            </p>
            <div className="mt-8 space-y-4">
              {(
                [
                  ["standard", "Standard placement", "Follow the school-approved spec for every patch."],
                  ["custom", "Custom placement", "I'll describe where something should go differently."],
                ] as const
              ).map(([key, title, desc]) => {

                const selected = state.placement === key;
                return (
                  <button
                    key={key}
                    onClick={() => setState((s) => ({ ...s, placement: key }))}
                    className={`opt ${selected ? "opt-selected" : ""}`}
                  >
                    <span className={`radio ${selected ? "radio-checked" : ""}`} />
                    <span className="flex-1">
                      <span className="block text-base font-semibold">{title}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">{desc}</span>
                    </span>
                  </button>
                );
              })}
              {state.placement === "custom" && (
                <textarea
                  className="field-input min-h-[100px]"
                  placeholder="Describe the placement exception..."
                  value={state.placementNote}
                  onChange={(e) => setState((s) => ({ ...s, placementNote: e.target.value }))}
                />
              )}
            </div>
          </div>
          <MobilePreview state={state} />
        </div>
      </div>
      <ActionBar state={state} setState={setState} nextLabel="Review order" />
    </main>
  );
}

function BuildReviewScreen({ state, setState }: { state: OrderState; setState: React.Dispatch<React.SetStateAction<OrderState>> }) {
  const L = lineItems(state);
  return (
    <main className="min-h-screen pb-24">
      <AppBar sub="Review your jacket" />
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Stepper current="build-review" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
          <div>
            <h2 className="text-4xl sm:text-5xl">Review</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Double-check everything before it goes home for approval.
            </p>
            <div className="card-elevated mt-8 space-y-4 p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Student</span>
                <span className="text-muted-foreground">
                  {state.student.first} {state.student.last}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Size</span>
                <span className="text-muted-foreground">
                  {state.size} · sleeve {state.sleeveAdj}" · body {state.bodyAdj}"
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Sleeves</span>
                <span className="text-muted-foreground capitalize">{state.sleeves}</span>
              </div>
              <div className="border-t border-border pt-4">
                <span className="font-semibold">Line items</span>
                <ul className="mt-3 space-y-2 text-sm">
                  {L.map((l) => (
                    <li key={l.k} className="flex justify-between">
                      <span className={l.inc ? "text-muted-foreground line-through" : ""}>{l.k}</span>
                      <span>{l.inc ? "Included" : money(l.v)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-8 space-y-4">
              <h3 className="text-lg">Who approves and pays?</h3>
              {[
                ["parent", "A parent approves", "We'll send them a review link."],
                ["self", "I'm paying for this myself", "Skip parent review and go straight to payment."],
              ].map(([key, title, desc]) => {
                const selected = state.payer === key;
                return (
                  <button
                    key={key}
                    onClick={() => setState((s) => ({ ...s, payer: key as "parent" | "self" }))}
                    className={`opt ${selected ? "opt-selected" : ""}`}
                  >
                    <span className={`radio ${selected ? "radio-checked" : ""}`} />
                    <span className="flex-1">
                      <span className="block text-base font-semibold">{title}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">{desc}</span>
                    </span>
                  </button>
                );
              })}
              {state.payer === "parent" && (
                <div className="card-elevated space-y-4 p-6">
                  <div>
                    <label className="field-label">Parent / guardian name</label>
                    <input
                      className="field-input"
                      value={state.parent.name}
                      onChange={(e) => setState((s) => ({ ...s, parent: { ...s.parent, name: e.target.value } }))}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="field-label">Email</label>
                      <input
                        className="field-input"
                        type="email"
                        value={state.parent.email}
                        onChange={(e) => setState((s) => ({ ...s, parent: { ...s.parent, email: e.target.value } }))}
                      />
                    </div>
                    <div>
                      <label className="field-label">Phone</label>
                      <input
                        className="field-input"
                        type="tel"
                        value={state.parent.phone}
                        onChange={(e) => setState((s) => ({ ...s, parent: { ...s.parent, phone: e.target.value } }))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-6">
            <MobilePreview state={state} />
            <PriceRail state={state} />
          </div>
        </div>
      </div>
      <ActionBar state={state} setState={setState} nextLabel="Continue to payment" />
    </main>
  );
}

function CheckoutScreen({ state, setState }: { state: OrderState; setState: React.Dispatch<React.SetStateAction<OrderState>> }) {
  const repCollects = REP.collects;
  return (
    <main className="min-h-screen pb-24">
      <AppBar sub="Payment" />
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h2 className="text-4xl sm:text-5xl">{state.payer === "self" ? "Payment" : "Approved · payment"}</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {repCollects
            ? `${REP.name} collects payment for ${SCHOOL.name}. Approving sends the order to them; nothing is charged here.`
            : "Complete payment to lock in your order."}
        </p>
        <div className="card-elevated mt-8 p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total due</span>
            <span className="font-display text-4xl text-navy">{money(total(state))}</span>
          </div>
          {!repCollects && (
            <div className="mt-6 space-y-3">
              <label className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <input
                  type="radio"
                  name="pay"
                  defaultChecked
                  className="h-5 w-5 accent-gold-deep"
                />
                <span className="text-sm font-semibold">Card</span>
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <input type="radio" name="pay" className="h-5 w-5 accent-gold-deep" />
                <span className="text-sm font-semibold">ACH bank transfer</span>
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <input type="radio" name="pay" className="h-5 w-5 accent-gold-deep" />
                <span className="text-sm font-semibold">Apple Pay / Google Pay</span>
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <input type="radio" name="pay" className="h-5 w-5 accent-gold-deep" />
                <span className="text-sm font-semibold">Pay in 4 instalments</span>
              </label>
            </div>
          )}
          <label className="mt-6 flex items-start gap-3">
            <input
              type="checkbox"
              checked={state.policyAck}
              onChange={(e) => setState((s) => ({ ...s, policyAck: e.target.checked }))}
              className="mt-0.5 h-5 w-5 accent-gold-deep"
            />
            <span className="text-sm text-muted-foreground">
              I understand this jacket is made to order and can't be returned or exchanged once production starts.
            </span>
          </label>
          <button
            onClick={() => setState((s) => ({ ...s, paid: true, screen: "confirmed" }))}
            disabled={!state.policyAck}
            className="mt-6 w-full rounded-lg px-6 py-3 text-sm font-semibold text-gold-foreground disabled:opacity-50"
            style={{ background: "var(--gradient-gold)" }}
          >
            {repCollects ? "Submit order" : "Pay " + money(total(state))}
          </button>
        </div>
        <div className="banner banner-warn mt-6">
          <span>⚠️</span>
          <span>
            <strong>Made to order.</strong> Once approved and paid, this jacket is personalised for {state.student.first || "your student"} and can't be returned or exchanged. You'll have 48 hours after payment to cancel.
          </span>
        </div>
      </div>
      <ActionBar state={state} setState={setState} nextLabel="Submit" />
    </main>
  );
}

function ConfirmedScreen({ state }: { state: OrderState }) {
  const timeline = [
    "Payment confirmed",
    "Patches enter Tajima",
    "Patches embroidered",
    "Match & pin complete",
    "Jacket assembled",
    "Final inspection",
    "Delivered to school",
  ];
  return (
    <main className="min-h-screen">
      <AppBar sub="Order confirmed" />
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ok/10 text-2xl text-ok">✓</div>
        <h2 className="mt-6 text-4xl sm:text-5xl">{state.paid ? "Payment received" : "Order submitted"}</h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          {state.paid
            ? `${state.student.first || "Your"}'s jacket is locked in. We'll email the confirmation and tracking updates.`
            : `${state.student.first || "Your"}'s jacket is submitted to ${REP.name}. Production starts once payment is confirmed.`}
        </p>
        <div className="card-elevated mt-10 p-6 text-left">
          <h3 className="text-lg">What happens next</h3>
          <ol className="mt-4 space-y-3">
            {timeline.map((step, i) => (
              <li key={step} className="flex items-center gap-3 text-sm">
                <span className="font-display text-xs text-gold-deep">{String(i + 1).padStart(2, "0")}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </main>
  );
}

/* ---------------- navigation ---------------- */
function ActionBar({
  state,
  setState,
  nextLabel,
}: {
  state: OrderState;
  setState: React.Dispatch<React.SetStateAction<OrderState>>;
  nextLabel: string;
}) {
  const handleNext = () => {
    if (state.screen === "sizing-method") {
      const next: Screen =
        state.sizingMethod === "photo"
          ? "sizing-photo"
          : state.sizingMethod === "quiz"
          ? "sizing-quiz"
          : state.sizingMethod === "chart"
          ? "sizing-chart"
          : "size-result";
      setState((s) => ({ ...s, screen: next }));
      return;
    }
    if (state.screen === "sizing-photo" || state.screen === "sizing-quiz" || state.screen === "sizing-chart") {
      setState((s) => ({ ...s, screen: "size-result" }));
      return;
    }
    setState((s) => ({ ...s, screen: nextScreen(s) }));
  };

  const handleBack = () => {
    if (state.screen === "sizing-photo" || state.screen === "sizing-quiz" || state.screen === "sizing-chart") {
      setState((s) => ({ ...s, screen: "sizing-method" }));
      return;
    }
    if (state.screen === "size-result") {
      setState((s) => ({ ...s, screen: "sizing-method" }));
      return;
    }
    setState((s) => ({ ...s, screen: prevScreen(s) }));
  };

  const showBack = state.screen !== "welcome" && state.screen !== "confirmed";

  return (
    <div className="mbar">
      <div>
        <div className="text-xs text-muted-foreground">Total</div>
        <div className="font-display text-2xl text-navy">{money(total(state))}</div>
      </div>
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={handleBack}
            className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Back
          </button>
        )}
        {state.screen !== "confirmed" && (
          <button
            onClick={handleNext}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-gold-foreground"
            style={{ background: "var(--gradient-gold)" }}
          >
            {nextLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------- main ---------------- */
function Index() {
  const [state, setState] = useOrderState();

  switch (state.screen) {
    case "welcome":
      return <WelcomeScreen state={state} setState={setState} />;
    case "student":
      return <StudentScreen state={state} setState={setState} />;
    case "package":
      return <PackageScreen state={state} setState={setState} />;
    case "sizing-method":
      return <SizingMethodScreen state={state} setState={setState} />;
    case "sizing-photo":
      return <SizingPhotoScreen state={state} setState={setState} />;
    case "sizing-quiz":
      return <SizingQuizScreen state={state} setState={setState} />;
    case "sizing-chart":
      return <SizingChartScreen state={state} setState={setState} />;
    case "size-result":
      return <SizeResultScreen state={state} setState={setState} />;
    case "build-sleeves":
      return <BuildSleevesScreen state={state} setState={setState} />;
    case "build-letter":
      return <BuildLetterScreen state={state} setState={setState} />;
    case "build-patches":
      return <BuildPatchesScreen state={state} setState={setState} />;
    case "build-mono":
      return <BuildMonoScreen state={state} setState={setState} />;
    case "build-placement":
      return <BuildPlacementScreen state={state} setState={setState} />;
    case "build-review":
      return <BuildReviewScreen state={state} setState={setState} />;
    case "checkout":
      return <CheckoutScreen state={state} setState={setState} />;
    case "confirmed":
      return <ConfirmedScreen state={state} />;
    default:
      return <WelcomeScreen state={state} setState={setState} />;
  }
}
