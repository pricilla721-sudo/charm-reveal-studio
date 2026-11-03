import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Check, ChevronLeft, Drama, Maximize2, Minimize2, Music2, Sparkles, Trophy } from "lucide-react";
import albanyStudents from "@/assets/albany-students-right.jpg";
import jacketCutout from "@/assets/jacket-cutout-business-card.png";
import dealerLogoAsset from "@/assets/all-star-letter-jackets.png.asset.json";
import JacketViewer, { type JacketView } from "@/components/jacket/JacketViewer";
import type { JacketConfig } from "@/components/jacket/config";
import { Button } from "@/components/ui/button";

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
  name: "Albany H.S.",
  initials: "A",
  mascot: "Lions",
  activity: "Football",
  closes: "October 15",
  colors: { body: "#111B45", sleeve: "#C72A2F", trim: "#D6A928" },
};

const REP = {
  name: "All-Star Letter Jackets",
  short: "All-Star",
  collects: true,
  payNote:
    "All-Star Letter Jackets will email you an invoice with a card link, or you can pay at the school office.",
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

const SCHOOL_ACTIVITIES = [
  { name: "Football", category: "Athletics", icon: Trophy },
  { name: "Basketball", category: "Athletics", icon: Trophy },
  { name: "Baseball", category: "Athletics", icon: Trophy },
  { name: "Track & Field", category: "Athletics", icon: Trophy },
  { name: "Cheer", category: "Spirit", icon: Sparkles },
  { name: "Band", category: "Fine Arts", icon: Music2 },
  { name: "Choir", category: "Fine Arts", icon: Music2 },
  { name: "Theatre", category: "Fine Arts", icon: Drama },
  { name: "Academics", category: "Academics", icon: BookOpen },
];

const ORDER: Screen[] = [
  "school",
  "welcome",
  "student",
  "package",
  "sizing-method",
  "sizing-photo",
  "sizing-quiz",
  "sizing-chart",
  "size-result",
  "build",
  "build-review",
  "checkout",
  "confirmed",
];

/** sections of the one-page jacket builder, in scroll order */
const BUILD_SECTIONS = [
  { id: "upgrades", label: "Upgrades" },
  { id: "letter", label: "Your letter" },
  { id: "patches", label: "Patches" },
  { id: "monogram", label: "Monogram & name" },
  { id: "placement", label: "Placement" },
  { id: "summary", label: "Summary" },
] as const;
type SectionId = (typeof BUILD_SECTIONS)[number]["id"];

/* ---------------- types ---------------- */
type Screen =
  | "school"
  | "welcome"
  | "student"
  | "package"
  | "sizing-method"
  | "sizing-photo"
  | "sizing-quiz"
  | "sizing-chart"
  | "size-result"
  | "build"
  | "build-review"
  | "checkout"
  | "confirmed";

interface OrderState {
  screen: Screen;
  /** builder section to scroll to when (re)entering the builder */
  jumpTo: SectionId | null;
  selectedActivity: string | null;
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
    screen: "school",
    jumpTo: null,
    selectedActivity: null,
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

/* ---------------- shared chrome ---------------- */
function AppBar({ sub, inverse, sticky = true }: { sub?: string; inverse?: boolean; sticky?: boolean }) {
  return (
    <header
      className={`${sticky ? "sticky top-0 z-50" : "relative"} backdrop-blur ${
        inverse
          ? "border-b border-white/10 bg-navy-deep/60"
          : "border-b border-border/70 bg-background/85"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
        <img
          src={dealerLogoAsset.url}
          width={401}
          height={154}
          alt={`${REP.name} logo`}
          className="h-10 w-auto max-w-[190px] object-contain"
        />
        <div className="flex-1">
          <div className={`text-sm font-semibold leading-tight ${inverse ? "text-navy-foreground" : ""}`}>
            {REP.name}
          </div>
          <div className={`text-xs ${inverse ? "text-navy-foreground/70" : "text-muted-foreground"}`}>
            {sub || "Letter jacket ordering"}
          </div>
        </div>
        <div className={`hidden text-right text-xs sm:block ${inverse ? "text-navy-foreground/70" : "text-muted-foreground"}`}>
          Ordering for
          <br />
          <span className={`font-semibold ${inverse ? "text-navy-foreground" : "text-foreground"}`}>
            {SCHOOL.name}
          </span>
        </div>
      </div>
    </header>
  );
}

/** review-page links back into the builder sections */
function ReviewNav({ setState }: { setState: React.Dispatch<React.SetStateAction<OrderState>> }) {
  return (
    <nav className="stepper" aria-label="Edit jacket sections">
      {BUILD_SECTIONS.filter((s) => s.id !== "summary").map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => setState((st) => ({ ...st, screen: "build", jumpTo: s.id }))}
          className="stepper-step stepper-step-done rounded-full border border-border bg-card px-3 py-1.5 hover:border-gold-deep"
        >
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          {s.label}
        </button>
      ))}
      <span className="stepper-step stepper-step-active rounded-full border border-gold-deep bg-gold/10 px-3 py-1.5">Review</span>
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
function SchoolScreen({ state, setState }: { state: OrderState; setState: React.Dispatch<React.SetStateAction<OrderState>> }) {
  const [category, setCategory] = useState("All");
  const categories = ["All", "Athletics", "Spirit", "Fine Arts", "Academics"];
  const visibleActivities = category === "All"
    ? SCHOOL_ACTIVITIES
    : SCHOOL_ACTIVITIES.filter((activity) => activity.category === category);

  const continueToOrder = () => {
    if (!state.selectedActivity) return;
    setState((current) => ({
      ...current,
      screen: "welcome",
      inserts: [state.selectedActivity as string],
    }));
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="absolute inset-x-0 top-0 z-40 border-b border-navy-foreground/15 bg-navy-deep/55 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-4 lg:px-8">
          <div className="relative flex h-10 w-10 items-center justify-center border border-gold/70 bg-navy font-display text-2xl text-gold">
            A
            <span className="absolute -bottom-px -right-px h-2 w-2 bg-brand-red" aria-hidden="true" />
          </div>
          <div className="leading-none">
            <div className="font-display text-xl text-navy-foreground">ALBANY H.S.</div>
            <div className="mt-1 text-[10px] font-semibold uppercase text-navy-foreground/60">Official jacket ordering</div>
          </div>
          <div className="ml-auto hidden text-right sm:block">
            <div className="text-[10px] font-semibold uppercase text-gold">Ordering is open</div>
            <div className="mt-1 text-xs text-navy-foreground/65">September 1 — October 15, 2026</div>
          </div>
        </div>
      </header>

      <section className="relative min-h-[680px] overflow-hidden bg-navy-deep pt-20 lg:min-h-[760px]">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={albanyStudents}
            width={1536}
            height={1024}
            alt="Four Albany students wearing the school's navy, cream and gold letter jacket"
            className="h-full w-full object-cover object-[center_top]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/45 to-navy-deep/20 lg:bg-gradient-to-r lg:from-navy-deep lg:via-navy-deep/55 lg:to-navy-deep/15" />
        </div>

        <div className="relative mx-auto grid min-h-[600px] max-w-7xl items-end px-5 pb-14 pt-16 lg:min-h-[680px] lg:grid-cols-[1.25fr_.75fr] lg:items-center lg:px-8 lg:pb-8">
          <div className="max-w-sm lg:col-start-1 2xl:max-w-md">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-10 bg-brand-red" />
              <p className="font-display text-sm uppercase text-gold">Albany Lions · Class of 2027</p>
            </div>
            <h1 className="text-6xl text-navy-foreground sm:text-7xl lg:text-[6.8rem]">
              Your school.<br />Your <span className="text-gold">story.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-navy-foreground/75">
              One Albany jacket, made personal by what you earned. Choose your activity to open the official jacket and patches approved for you.
            </p>
            <div className="mt-8 flex items-center gap-3 border-l-2 border-brand-red pl-4 text-sm text-navy-foreground/70">
              <span className="h-2 w-2 rounded-full bg-gold" />
              Ordering closes October 15, 2026
            </div>
          </div>

        </div>
        <div className="absolute bottom-0 inset-x-0 h-px bg-brand-red" />
      </section>

      <section className="relative bg-background py-16 sm:py-24" aria-labelledby="activity-heading">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[20rem_1fr] lg:gap-16">
            <div>
              <p className="eyebrow text-gold-deep">Start your order</p>
              <h2 id="activity-heading" className="mt-3 text-5xl text-navy sm:text-6xl">What did you letter in?</h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                Choose your primary activity. You can add other earned patches while building your jacket.
              </p>
              <div className="mt-8 flex flex-wrap gap-2.5 lg:flex-col lg:items-start lg:gap-3">
                {categories.map((item) => (
                  <Button
                    key={item}
                    type="button"
                    variant={category === item ? "default" : "ghost"}
                    onClick={() => setCategory(item)}
                    className="h-11 justify-start px-5 text-sm font-semibold uppercase tracking-wide"
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                {visibleActivities.map(({ name, category: activityCategory, icon: Icon }) => {
                  const selected = state.selectedActivity === name;
                  return (
                    <Button
                      key={name}
                      type="button"
                      variant="outline"
                      onClick={() => setState((current) => ({ ...current, selectedActivity: name }))}
                      className={`h-auto min-h-24 justify-start gap-4 whitespace-normal border p-5 text-left shadow-none ${selected ? "border-gold-deep bg-gold/10 ring-1 ring-gold-deep" : "bg-card hover:border-gold-deep hover:bg-card"}`}
                      aria-pressed={selected}
                    >
                      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${selected ? "bg-navy text-gold" : "bg-muted text-muted-foreground"}`}>
                        <Icon aria-hidden="true" className="h-6 w-6" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-base font-bold text-foreground">{name}</span>
                        <span className="mt-1 block text-sm font-normal text-muted-foreground">{activityCategory}</span>
                      </span>
                      <span className={`h-5 w-5 shrink-0 rounded-full border-2 ${selected ? "border-gold-deep bg-gold shadow-[inset_0_0_0_3px_var(--color-card)]" : "border-border"}`} />
                    </Button>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-col gap-4 border-t border-border pt-7 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">Don't see yours? Ask your school's jacket coordinator.</p>
                <Button
                  type="button"
                  size="lg"
                  onClick={continueToOrder}
                  disabled={!state.selectedActivity}
                  className="h-14 min-w-56 bg-gold text-base font-bold uppercase text-gold-foreground hover:bg-gold-deep"
                >
                  Continue <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function WelcomeScreen({ state, setState }: { state: OrderState; setState: React.Dispatch<React.SetStateAction<OrderState>> }) {
  return (
    <main className="min-h-screen bg-background">
      <AppBar />
      <section className="hero-editorial relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 hidden w-[8%] bg-navy lg:block" />
        <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-8 px-6 py-12 md:grid-cols-[.9fr_1.1fr] md:py-16 lg:px-16">
          <div className="relative z-10 md:pl-4">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy font-display text-base font-bold text-gold ring-2 ring-gold">
                {SCHOOL.initials}
              </div>
              <div>
                <div className="font-display text-xl font-semibold uppercase text-navy">{SCHOOL.name}</div>
                <div className="text-xs font-medium uppercase text-muted-foreground">Official letter jacket order</div>
              </div>
            </div>
            <p className="eyebrow text-brand-red">
              Class of {state.student.grad} <span className="text-navy">· {state.selectedActivity || SCHOOL.activity}</span>
            </p>
            <h1 className="mt-5 text-6xl text-navy sm:text-7xl lg:text-8xl">
              Wear what
              <br />
              you <span className="text-brand-red">earned.</span>
            </h1>
            <div className="rule-red mt-7 h-1 w-28" />
            <p className="mt-7 max-w-lg text-base leading-relaxed text-muted-foreground">
              Build your {SCHOOL.mascot} jacket on screen. Every patch, every letter, exactly where you want it — with the price in front of you the whole way.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setState((s) => ({ ...s, screen: "student" }))}
                className="rounded-md bg-navy px-7 py-3 text-sm font-semibold uppercase text-primary-foreground shadow-[var(--shadow-lift)] transition-transform hover:-translate-y-0.5"
              >
                Start building
              </button>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-6">
              {[
                ["Starting at", "$" + PRICE.base],
                ["Ordering closes", SCHOOL.closes],
                ["Delivered to", SCHOOL.name],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="mt-1 font-display text-xl text-navy">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative flex min-h-[440px] items-center justify-center md:min-h-[640px]">
            <div className="absolute inset-y-6 right-[-12vw] left-[18%] bg-navy" />
            <div className="absolute bottom-6 right-[-12vw] left-[18%] h-2 bg-brand-red" />
            <div className="absolute right-0 top-10 font-display text-[9rem] leading-none text-primary-foreground/5 md:text-[13rem]">NS</div>
            <img
              src={jacketCutout}
              width={1024}
              height={1408}
              alt="Navy and red Northstar letter jacket with white and gold chenille details"
              className="float-anim relative mx-auto w-full max-w-lg drop-shadow-[0_40px_50px_oklch(0.1_0.04_268_/_0.42)] md:scale-110"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
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
                  {state.selectedActivity || SCHOOL.activity} (from your school page)
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

/* ---------------- one-page jacket builder ---------------- */
type SetOrder = React.Dispatch<React.SetStateAction<OrderState>>;

function addOnPrice(state: OrderState, key: string, price: number) {
  const P = PACKAGES.find((p) => p.id === state.pkg);
  return P && P.inc.includes(key) ? "Included" : "+" + money0(price);
}

function OptionCard({
  selected,
  title,
  desc,
  price,
  onClick,
}: {
  selected: boolean;
  title: string;
  desc: string;
  price?: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={`opt ${selected ? "opt-selected" : ""}`}>
      <span className={`radio ${selected ? "radio-checked" : ""}`} />
      <span className="flex-1">
        <span className="block text-base font-semibold">{title}</span>
        <span className="mt-1 block text-sm text-muted-foreground">{desc}</span>
      </span>
      {price && (
        <span className={`shrink-0 text-sm font-semibold ${price === "Included" ? "text-ok" : "text-foreground"}`}>{price}</span>
      )}
    </button>
  );
}

function ToggleRow({
  checked,
  label,
  price,
  onChange,
}: {
  checked: boolean;
  label: string;
  price?: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border bg-card p-4 transition ${
        checked ? "border-gold-deep shadow-[0_0_0_1px_var(--color-gold-deep)]" : "border-border"
      }`}
    >
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-gold-deep" />
      <span className="flex-1 text-sm font-semibold">{label}</span>
      {price && <span className={`text-sm font-semibold ${price === "Included" ? "text-ok" : "text-muted-foreground"}`}>{price}</span>}
    </label>
  );
}

function BuildSection({
  id,
  index,
  title,
  blurb,
  children,
}: {
  id: SectionId;
  index: number;
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section id={`section-${id}`} aria-labelledby={`section-${id}-title`} className="border-b border-border py-10 last:border-b-0 lg:py-14">
      <div className="flex items-center gap-3">
        <span className="h-px w-6 bg-brand-red" aria-hidden="true" />
        <span className="eyebrow text-muted-foreground">
          {String(index + 1).padStart(2, "0")} / {String(BUILD_SECTIONS.length).padStart(2, "0")}
        </span>
      </div>
      <h2 id={`section-${id}-title`} className="mt-3 text-4xl sm:text-5xl">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{blurb}</p>
      <div className="mt-6 space-y-3">{children}</div>
    </section>
  );
}

function BuilderScreen({ state, setState }: { state: OrderState; setState: SetOrder }) {
  const [active, setActive] = useState<SectionId>(BUILD_SECTIONS[0].id);
  const [view, setView] = useState<JacketView>("front");
  const [compact, setCompact] = useState(false);
  const mobileStickyRef = useRef<HTMLDivElement>(null);
  const desktopNavRef = useRef<HTMLDivElement>(null);
  const chipRowRef = useRef<HTMLDivElement>(null);
  const set = (patch: Partial<OrderState>) => setState((s) => ({ ...s, ...patch }));
  const activeIndex = BUILD_SECTIONS.findIndex((s) => s.id === active);
  const P = PACKAGES.find((p) => p.id === state.pkg);

  // height of whatever is pinned to the top of the viewport (jacket on mobile, section bar on desktop)
  const stickyOffset = useCallback(() => {
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    const el = desktop ? desktopNavRef.current : mobileStickyRef.current;
    return el ? el.getBoundingClientRect().height : 0;
  }, []);

  const jump = useCallback(
    (id: SectionId, smooth = true) => {
      const el = document.getElementById(`section-${id}`);
      if (!el) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const top = el.getBoundingClientRect().top + window.scrollY - stickyOffset() + 1;
      window.scrollTo({ top, behavior: smooth && !reduce ? "smooth" : "auto" });
    },
    [stickyOffset],
  );

  // scroll-spy: highlight the section currently under the pinned header
  useEffect(() => {
    const onScroll = () => {
      const line = stickyOffset() + 96;
      let current: SectionId = BUILD_SECTIONS[0].id;
      for (const s of BUILD_SECTIONS) {
        const el = document.getElementById(`section-${s.id}`);
        if (el && el.getBoundingClientRect().top <= line) current = s.id;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = "summary";
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [stickyOffset]);

  // arriving from the review page with a section to edit
  useEffect(() => {
    if (!state.jumpTo) return;
    const target = state.jumpTo;
    requestAnimationFrame(() => jump(target, false));
    setState((s) => ({ ...s, jumpTo: null }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep the active chip visible in the mobile chip row
  useEffect(() => {
    const row = chipRowRef.current;
    const chip = row?.querySelector<HTMLElement>(`[data-section="${active}"]`);
    if (!row || !chip) return;
    row.scrollTo({ left: chip.offsetLeft - row.clientWidth / 2 + chip.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  const goReview = () => setState((s) => ({ ...s, screen: "build-review" }));
  const goBack = () => setState((s) => ({ ...s, screen: "size-result" }));

  const toggleInsert = (act: string) =>
    setState((s) => ({
      ...s,
      inserts: s.inserts.includes(act) ? s.inserts.filter((i) => i !== act) : [...s.inserts, act],
    }));

  const sectionLink = (s: (typeof BUILD_SECTIONS)[number], n: number, variant: "chip" | "tab") => {
    const isActive = s.id === active;
    const done = n < activeIndex;
    const base =
      variant === "chip"
        ? `inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
            isActive
              ? "border-navy bg-navy text-navy-foreground"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          }`
        : `relative inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-5 text-sm font-semibold transition xl:px-4 ${
            isActive
              ? "text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-gold-deep"
              : "text-muted-foreground hover:text-foreground"
          }`;
    return (
      <a
        key={s.id}
        href={`#section-${s.id}`}
        data-section={s.id}
        aria-current={isActive ? "true" : undefined}
        onClick={(e) => {
          e.preventDefault();
          jump(s.id);
        }}
        className={base}
      >
        {done && <Check className={`h-3.5 w-3.5 ${isActive ? "" : "text-ok"}`} aria-hidden="true" />}
        {s.label}
      </a>
    );
  };

  return (
    <main className="min-h-screen bg-background pb-28 lg:pb-0">
      <AppBar sub="Step 4 of 4 — build your jacket" sticky={false} />

      {/* desktop: section links pinned under the app bar */}
      <div
        ref={desktopNavRef}
        className="sticky top-0 z-40 hidden border-b border-border/70 bg-background/90 backdrop-blur lg:block"
      >
        <div className="mx-auto flex max-w-[90rem] items-center gap-4 px-8">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Size
          </button>
          <nav className="flex flex-1 justify-center" aria-label="Jacket sections">
            {BUILD_SECTIONS.map((s, n) => sectionLink(s, n, "tab"))}
          </nav>
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total</div>
            <div className="font-display text-2xl leading-none text-navy">{money(total(state))}</div>
          </div>
          <button
            type="button"
            onClick={goReview}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-gold-foreground"
            style={{ background: "var(--gradient-gold)" }}
          >
            Review order
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[90rem] lg:grid lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:px-8">
        {/* jacket: pinned to the top on mobile, pinned to the right on desktop */}
        <aside
          ref={mobileStickyRef}
          className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur lg:order-2 lg:top-16 lg:z-0 lg:h-[calc(100svh-4rem)] lg:self-start lg:border-b-0 lg:bg-transparent lg:py-6 lg:backdrop-blur-none"
        >
          <div className="relative px-3 pt-3 lg:flex lg:h-full lg:flex-col lg:p-0">
            <JacketViewer
              cfg={jacketConfig(state)}
              view={view}
              onViewChange={setView}
              overlayControls
              showCredit={false}
              className="lg:min-h-0 lg:flex-1"
              stageClassName={`transition-[height] duration-300 lg:h-full lg:rounded-2xl ${compact ? "h-[20svh]" : "h-[36svh]"}`}
            />
            <button
              type="button"
              onClick={() => setCompact((c) => !c)}
              aria-label={compact ? "Enlarge jacket preview" : "Shrink jacket preview"}
              className="absolute left-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-card/85 text-foreground shadow-[var(--shadow-card)] backdrop-blur lg:hidden"
            >
              {compact ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
            <div className="hidden items-end justify-between gap-6 pt-5 lg:flex">
              <div>
                <div className="eyebrow text-muted-foreground">{SCHOOL.name} · {state.selectedActivity || SCHOOL.activity}</div>
                <div className="mt-1 font-display text-2xl uppercase leading-none xl:text-3xl">
                  {P ? `${P.name} letter jacket` : "Custom letter jacket"}
                </div>
              </div>
              <p className="max-w-[16rem] text-right text-[10px] text-muted-foreground/70">
                3D model: “Varsity Jacket” by 3DEE via Sketchfab (CC-BY)
              </p>
            </div>
          </div>
          {/* mobile: section chips sit under the jacket so they stay reachable */}
          <nav
            ref={chipRowRef}
            aria-label="Jacket sections"
            className="flex gap-2 overflow-x-auto px-3 py-2.5 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
          >
            {BUILD_SECTIONS.map((s, n) => sectionLink(s, n, "chip"))}
          </nav>
        </aside>

        {/* options: one continuous scroll */}
        <div className="px-5 sm:px-8 lg:order-1 lg:px-0 lg:pb-[30vh]">
          <button
            type="button"
            onClick={goBack}
            className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground lg:hidden"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back to size
          </button>
          <div className="mt-4 lg:mt-10">
            <PkgChip state={state} />
          </div>

          <BuildSection id="upgrades" index={0} title="Upgrades" blurb="Choose the sleeve material and collar for your jacket.">
            <OptionCard
              selected={state.sleeves === "vinyl"}
              title="Vinyl raglan sleeves"
              desc="Standard on most jackets."
              price="Included"
              onClick={() => set({ sleeves: "vinyl" })}
            />
            <OptionCard
              selected={state.sleeves === "leather"}
              title="Leather sleeves"
              desc="Premium upgrade with a softer hand and richer sheen."
              price={addOnPrice(state, "leather", PRICE.leather)}
              onClick={() => set({ sleeves: "leather" })}
            />
            <ToggleRow
              checked={state.sailor}
              label="Sailor collar"
              price={"+" + money0(PRICE.sailor)}
              onChange={(v) => set({ sailor: v })}
            />
          </BuildSection>

          <BuildSection id="letter" index={1} title="Your letter" blurb="Your chenille award letter and graduation year.">
            {(
              [
                ["make", "Make my letter", "We'll produce the chenille letter and sew it on."],
                ["included", "My letter is included", "Your activity already provided the letter."],
                ["loose", "Loose letter", "We'll include the letter unattached."],
                ["none", "No letter", "Skip the letter entirely."],
              ] as const
            ).map(([key, title, desc]) => (
              <OptionCard
                key={key}
                selected={state.letter === key}
                title={title}
                desc={desc}
                onClick={() => {
                  set({ letter: key });
                  setView("front");
                }}
              />
            ))}
            <ToggleRow
              checked={state.year}
              label="Graduation year patch"
              price={addOnPrice(state, "year", PRICE.year)}
              onChange={(v) => set({ year: v })}
            />
            {state.year && (
              <select className="field-input" aria-label="Year patch style" value={state.yearStyle} onChange={(e) => set({ yearStyle: e.target.value })}>
                <option>Block</option>
                <option>Script</option>
              </select>
            )}
          </BuildSection>

          <BuildSection id="patches" index={2} title="Patches" blurb="Activity inserts, mascot and numbers for your sleeves.">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-sans text-sm font-semibold normal-case">Activity inserts</h3>
                <span className="text-xs text-muted-foreground">
                  {P && P.inc.includes("insert1") ? "1st included · " : ""}+{money0(PRICE.insert)} each
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {ACTIVITIES.map((act) => {
                  const selected = state.inserts.includes(act);
                  return (
                    <button
                      key={act}
                      type="button"
                      aria-pressed={selected}
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
            <ToggleRow
              checked={state.mascotPatch}
              label="Mascot patch on sleeve"
              price={addOnPrice(state, "mascot", PRICE.mascot)}
              onChange={(v) => set({ mascotPatch: v })}
            />
            <ToggleRow
              checked={state.number}
              label="Jersey number"
              price={addOnPrice(state, "number", PRICE.number)}
              onChange={(v) => set({ number: v })}
            />
            {state.number && (
              <input
                className="field-input"
                aria-label="Jersey number"
                placeholder="##"
                inputMode="numeric"
                value={state.numberVal}
                onChange={(e) => set({ numberVal: e.target.value })}
              />
            )}
            <ToggleRow
              checked={state.position}
              label="Position patch"
              price={"+" + money0(PRICE.position)}
              onChange={(v) => set({ position: v })}
            />
            {state.position && (
              <input
                className="field-input"
                aria-label="Position"
                placeholder="Position"
                value={state.positionVal}
                onChange={(e) => set({ positionVal: e.target.value })}
              />
            )}
          </BuildSection>

          <BuildSection id="monogram" index={3} title="Monogram & name" blurb="Your name on the chest, and optionally across the back.">
            <ToggleRow
              checked={state.mono}
              label="Chest monogram"
              price={addOnPrice(state, "mono", PRICE.mono)}
              onChange={(v) => {
                set({ mono: v });
                setView("front");
              }}
            />
            {state.mono && (
              <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
                <input
                  className="field-input"
                  aria-label="Monogram text"
                  placeholder="First or last name"
                  value={state.monoText}
                  onFocus={() => setView("front")}
                  onChange={(e) => set({ monoText: e.target.value })}
                />
                <select className="field-input" aria-label="Monogram style" value={state.monoStyle} onChange={(e) => set({ monoStyle: e.target.value })}>
                  <option>Script</option>
                  <option>Block</option>
                </select>
              </div>
            )}
            <ToggleRow
              checked={state.backName}
              label="Back name"
              price={addOnPrice(state, "backname", PRICE.backname)}
              onChange={(v) => {
                set({ backName: v });
                setView(v ? "back" : "front");
              }}
            />
            {state.backName && (
              <div className="space-y-3">
                <input
                  className="field-input"
                  aria-label="Back name, line 1"
                  placeholder="Last name"
                  value={state.backNameL1}
                  onFocus={() => setView("back")}
                  onChange={(e) => set({ backNameL1: e.target.value })}
                />
                <input
                  className="field-input"
                  aria-label="Back name, line 2"
                  placeholder={`Second line (optional, +${money0(PRICE.backname2)})`}
                  value={state.backNameL2}
                  onFocus={() => setView("back")}
                  onChange={(e) => set({ backNameL2: e.target.value })}
                />
                <select className="field-input" aria-label="Back name style" value={state.backNameStyle} onChange={(e) => set({ backNameStyle: e.target.value })}>
                  <option>Script</option>
                  <option>Block</option>
                </select>
              </div>
            )}
          </BuildSection>

          <BuildSection
            id="placement"
            index={4}
            title="Placement"
            blurb="Standard placement follows your school's spec. Use the note only if you have a documented exception."
          >
            <OptionCard
              selected={state.placement === "standard"}
              title="Standard placement"
              desc="Follow the school-approved spec for every patch."
              onClick={() => set({ placement: "standard" })}
            />
            <OptionCard
              selected={state.placement === "custom"}
              title="Custom placement"
              desc="I'll describe where something should go differently."
              onClick={() => set({ placement: "custom" })}
            />
            {state.placement === "custom" && (
              <textarea
                className="field-input min-h-[100px]"
                aria-label="Placement note"
                placeholder="Describe the placement exception..."
                value={state.placementNote}
                onChange={(e) => set({ placementNote: e.target.value })}
              />
            )}
          </BuildSection>

          <BuildSection id="summary" index={5} title="Summary" blurb="Everything on your jacket so far. Tap any section above to change it.">
            <div className="card-elevated p-5 sm:p-6">
              <ul className="space-y-2 text-sm">
                {lineItems(state).map((l) => (
                  <li key={l.k} className="flex justify-between gap-3">
                    <span className={l.inc ? "text-muted-foreground" : ""}>{l.k}</span>
                    <span className={`shrink-0 ${l.inc ? "text-ok" : ""}`}>{l.inc ? "Included" : money(l.v)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Estimated tax</span>
                  <span>{money(tax(state))}</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-display text-3xl leading-none text-navy">{money(total(state))}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={goReview}
                className="mt-6 w-full rounded-lg px-6 py-3.5 text-sm font-semibold text-gold-foreground"
                style={{ background: "var(--gradient-gold)" }}
              >
                Review &amp; send for approval
              </button>
            </div>
            <p className="pt-2 text-center text-[10px] text-muted-foreground/70 lg:hidden">
              3D model: “Varsity Jacket” by 3DEE via Sketchfab (CC-BY)
            </p>
          </BuildSection>
        </div>
      </div>

      {/* mobile: total + review always within thumb reach */}
      <div className="lg:hidden">
        <div className="mbar">
          <div>
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="font-display text-2xl text-navy">{money(total(state))}</div>
          </div>
          <button
            type="button"
            onClick={goReview}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-gold-foreground"
            style={{ background: "var(--gradient-gold)" }}
          >
            Review order
          </button>
        </div>
      </div>
    </main>
  );
}

function BuildReviewScreen({ state, setState }: { state: OrderState; setState: React.Dispatch<React.SetStateAction<OrderState>> }) {
  const L = lineItems(state);
  return (
    <main className="min-h-screen pb-24">
      <AppBar sub="Review your jacket" />
      <div className="mx-auto max-w-6xl px-6 py-8">
        <ReviewNav setState={setState} />
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

  // each step starts at the top, unless we're jumping back into a builder section
  useEffect(() => {
    if (state.screen === "build" && state.jumpTo) return;
    window.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.screen]);

  switch (state.screen) {
    case "school":
      return <SchoolScreen state={state} setState={setState} />;
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
    case "build":
      return <BuilderScreen state={state} setState={setState} />;
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
