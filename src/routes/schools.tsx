import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BarChart3,
  Boxes,
  Building2,
  CalendarClock,
  ClipboardList,
  Grid2X2,
  LayoutList,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  UserRound,
} from "lucide-react";
import dealerLogoAsset from "@/assets/all-star-letter-jackets.png.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/schools")({
  head: () => ({
    meta: [
      { title: "Assigned Schools — All-Star Letter Jackets" },
      {
        name: "description",
        content: "Review every school in your territory: enrollment, order activity, revenue, and season status.",
      },
      { property: "og:title", content: "Assigned Schools — All-Star Letter Jackets" },
      {
        property: "og:description",
        content: "A territory view of assigned schools with order activity, revenue, and season status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SchoolsPage,
});

type SchoolStatus = "Ordering open" | "Ordering closed" | "Setup";

type School = {
  id: string;
  name: string;
  city: string;
  state: string;
  mascot: string;
  initials: string;
  enrollment: number;
  seniors: number;
  orders: number;
  revenue: number;
  status: SchoolStatus;
  closesOn: string;
  bodyClass: string;
  trimClass: string;
};

const SCHOOLS: School[] = [
  { id: "albany", name: "Albany H.S.", city: "Albany", state: "OR", mascot: "Lions", initials: "A", enrollment: 1420, seniors: 342, orders: 288, revenue: 86400, status: "Ordering open", closesOn: "Nov 14", bodyClass: "bg-navy", trimClass: "bg-gold" },
  { id: "northstar", name: "Northstar High", city: "Cedar Falls", state: "IA", mascot: "Comets", initials: "N", enrollment: 1180, seniors: 296, orders: 241, revenue: 79530, status: "Ordering open", closesOn: "Nov 21", bodyClass: "bg-navy-deep", trimClass: "bg-brand-red" },
  { id: "central", name: "Central Academy", city: "Springfield", state: "IL", mascot: "Eagles", initials: "C", enrollment: 960, seniors: 231, orders: 174, revenue: 53940, status: "Ordering open", closesOn: "Dec 5", bodyClass: "bg-brand-red", trimClass: "bg-gold" },
  { id: "westlake", name: "Westlake Prep", city: "Austin", state: "TX", mascot: "Chaparrals", initials: "W", enrollment: 870, seniors: 214, orders: 139, revenue: 51430, status: "Ordering open", closesOn: "Dec 12", bodyClass: "bg-navy", trimClass: "bg-brand-red" },
  { id: "riverside", name: "Riverside Union", city: "Riverside", state: "OH", mascot: "Ravens", initials: "R", enrollment: 1310, seniors: 318, orders: 122, revenue: 35380, status: "Ordering closed", closesOn: "Oct 24", bodyClass: "bg-navy-deep", trimClass: "bg-gold" },
  { id: "harmony", name: "Harmony Grove", city: "Bentonville", state: "AR", mascot: "Hornets", initials: "H", enrollment: 640, seniors: 158, orders: 96, revenue: 24480, status: "Ordering open", closesOn: "Dec 18", bodyClass: "bg-gold", trimClass: "bg-navy" },
  { id: "summit", name: "Summit Ridge", city: "Boise", state: "ID", mascot: "Wolves", initials: "S", enrollment: 1040, seniors: 252, orders: 74, revenue: 19980, status: "Ordering open", closesOn: "Jan 9", bodyClass: "bg-navy", trimClass: "bg-gold" },
  { id: "lakewood", name: "Lakewood", city: "Lakewood", state: "WA", mascot: "Cougars", initials: "L", enrollment: 1220, seniors: 305, orders: 61, revenue: 16470, status: "Setup", closesOn: "—", bodyClass: "bg-navy-deep", trimClass: "bg-brand-red" },
  { id: "fairview", name: "Fairview", city: "Boulder", state: "CO", mascot: "Knights", initials: "F", enrollment: 1490, seniors: 366, orders: 58, revenue: 15370, status: "Ordering open", closesOn: "Jan 16", bodyClass: "bg-brand-red", trimClass: "bg-primary-foreground" },
  { id: "maplewood", name: "Maplewood", city: "St. Paul", state: "MN", mascot: "Bears", initials: "M", enrollment: 780, seniors: 189, orders: 43, revenue: 11180, status: "Ordering closed", closesOn: "Oct 10", bodyClass: "bg-navy", trimClass: "bg-gold" },
  { id: "cedar", name: "Cedar Point", city: "Tulsa", state: "OK", mascot: "Yellowjackets", initials: "C", enrollment: 910, seniors: 224, orders: 27, revenue: 7290, status: "Setup", closesOn: "—", bodyClass: "bg-gold", trimClass: "bg-brand-red" },
  { id: "bayside", name: "Bayside", city: "Portland", state: "ME", mascot: "Mariners", initials: "B", enrollment: 700, seniors: 172, orders: 12, revenue: 3240, status: "Ordering open", closesOn: "Feb 6", bodyClass: "bg-navy-deep", trimClass: "bg-gold" },
];

const STATUS_STYLES: Record<SchoolStatus, string> = {
  "Ordering open": "bg-ok-soft text-ok",
  "Ordering closed": "bg-secondary text-muted-foreground",
  Setup: "bg-gold/20 text-gold-deep",
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function num(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function Crest({ school, size = "md" }: { school: School; size?: "md" | "lg" }) {
  const dims = size === "lg" ? "h-16 w-16" : "h-12 w-12";
  return (
    <div className={cn(dims, "relative flex shrink-0 items-center justify-center overflow-hidden rounded-md text-primary-foreground", school.bodyClass)}>
      <span className="font-display text-2xl leading-none">{school.initials}</span>
      <span className={cn("absolute inset-x-0 bottom-0 h-1", school.trimClass)} />
    </div>
  );
}

function SchoolsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("orders");
  const [view, setView] = useState<"list" | "grid">("list");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const next = SCHOOLS.filter((school) => {
      const matchesQuery =
        !normalized ||
        `${school.name} ${school.city} ${school.state} ${school.mascot}`.toLowerCase().includes(normalized);
      const matchesStatus = status === "all" || school.status.toLowerCase().replace(" ", "-") === status;
      return matchesQuery && matchesStatus;
    });
    return [...next].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "revenue") return b.revenue - a.revenue;
      if (sort === "deadline") return a.closesOn.localeCompare(b.closesOn);
      return b.orders - a.orders;
    });
  }, [query, status, sort]);

  const totals = useMemo(() => {
    const revenue = SCHOOLS.reduce((sum, school) => sum + school.revenue, 0);
    const orders = SCHOOLS.reduce((sum, school) => sum + school.orders, 0);
    const seniors = SCHOOLS.reduce((sum, school) => sum + school.seniors, 0);
    const open = SCHOOLS.filter((school) => school.status === "Ordering open").length;
    return { revenue, orders, seniors, open };
  }, []);

  return (
    <main className="min-h-screen bg-secondary/45">
      <header className="sticky top-0 z-40 border-b border-primary-foreground/10 bg-navy/95 text-primary-foreground shadow-[var(--shadow-card)] backdrop-blur-xl print:hidden">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center px-4 sm:px-5 lg:flex-nowrap lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3 py-3 lg:mr-10">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary-foreground text-navy">
              <Sparkles className="absolute right-1 top-1 h-3 w-3 text-brand-red" />
              <span className="font-display text-xl leading-none">AS</span>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase text-brand-red-bright">All-Star Letter Jackets</div>
              <div className="truncate font-display text-lg leading-none">Dealer workspace</div>
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-3 py-3 lg:order-3 lg:ml-6">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold leading-tight">Morgan Lee</div>
              <div className="text-xs text-primary-foreground/55">Dealer representative</div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full border border-primary-foreground/15 bg-primary-foreground/8 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
              aria-label="Open account menu"
            >
              <UserRound />
            </Button>
          </div>

          <nav className="order-3 flex w-full items-stretch gap-1 overflow-x-auto border-t border-primary-foreground/10 lg:order-2 lg:w-auto lg:flex-1 lg:self-stretch lg:border-t-0" aria-label="Sales areas">
            {[
              { label: "Orders", icon: ClipboardList },
              { label: "Catalogue", icon: ShoppingBag, to: "/sales" },
              { label: "Packages", icon: Boxes },
              { label: "Schools", icon: Building2, to: "/schools", active: true },
              { label: "Totals", icon: BarChart3 },
            ].map(({ label, icon: Icon, to, active }) => {
              const classes = cn(
                "relative h-12 shrink-0 items-center gap-2 rounded-none text-sm font-medium text-primary-foreground/65 hover:bg-primary-foreground/8 hover:text-primary-foreground lg:h-auto lg:px-4",
                to ? "flex" : "",
                active ? "text-primary-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-gold" : "",
              );
              const icon = <Icon className={active ? "text-gold" : ""} />;
              return to ? (
                <Link key={label} to={to} className={classes} aria-current={active ? "page" : undefined}>
                  {icon}
                  <span>{label}</span>
                </Link>
              ) : (
                <Button key={label} type="button" variant="ghost" className={classes} aria-current={active ? "page" : undefined}>
                  {icon}
                  <span>{label}</span>
                </Button>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-6 lg:px-8">
        <section className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            <img src={dealerLogoAsset.url} alt="All-Star Letter Jackets" className="h-12 w-auto max-w-44 object-contain" />
            <div className="h-10 w-px bg-border" />
            <div>
              <p className="eyebrow text-brand-red">Dealer workspace</p>
              <h1 className="mt-1 text-4xl text-navy sm:text-5xl">Schools</h1>
            </div>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full bg-card lg:w-52" aria-label="Season status">
                <Store className="mr-2 h-4 w-4 text-brand-red" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="focus:bg-primary focus:text-primary-foreground" value="all">All statuses</SelectItem>
                <SelectItem className="focus:bg-primary focus:text-primary-foreground" value="ordering-open">Ordering open</SelectItem>
                <SelectItem className="focus:bg-primary focus:text-primary-foreground" value="ordering-closed">Ordering closed</SelectItem>
                <SelectItem className="focus:bg-primary focus:text-primary-foreground" value="setup">Setup</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Territory summary">
          {[
            { label: "Assigned schools", value: String(SCHOOLS.length), hint: `${totals.open} ordering open` },
            { label: "Orders this season", value: num(totals.orders), hint: "across your territory" },
            { label: "Season revenue", value: money(totals.revenue), hint: "customer price basis" },
            { label: "Seniors in territory", value: num(totals.seniors), hint: "eligible this year" },
          ].map((stat) => (
            <div key={stat.label} className="border border-border bg-card p-4 shadow-[var(--shadow-card)]">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</div>
              <div className="mt-1 font-display text-3xl text-navy">{stat.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{stat.hint}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 flex flex-col gap-3 border-y border-border bg-card px-4 py-4 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search schools, cities, or mascots…" className="pl-9" />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full md:w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="orders">Most orders</SelectItem>
              <SelectItem value="revenue">Highest revenue</SelectItem>
              <SelectItem value="deadline">Deadline soonest</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex rounded-md border border-input bg-background p-1">
            <Button size="icon" variant={view === "list" ? "secondary" : "ghost"} onClick={() => setView("list")} aria-label="List view"><LayoutList /></Button>
            <Button size="icon" variant={view === "grid" ? "secondary" : "ghost"} onClick={() => setView("grid")} aria-label="Grid view"><Grid2X2 /></Button>
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div><span className="font-semibold text-navy">{filtered.length}</span> <span className="text-sm text-muted-foreground">schools shown</span></div>
            {(query || status !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setStatus("all"); }}>Clear filters</Button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="border border-dashed border-border bg-card px-6 py-16 text-center">
              <Search className="mx-auto h-7 w-7 text-muted-foreground" />
              <h2 className="mt-4 text-2xl text-navy">No schools match</h2>
              <p className="mt-2 text-sm text-muted-foreground">Try a different name, city, or status filter.</p>
            </div>
          ) : view === "list" ? (
            <div className="space-y-3">
              {filtered.map((school) => {
                const takeRate = Math.round((school.orders / school.seniors) * 100);
                return (
                  <article key={school.id} className="grid items-center gap-4 border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:grid-cols-[1fr_auto] lg:grid-cols-[auto_1fr_auto]">
                    <div className="flex items-center gap-4">
                      <Crest school={school} />
                      <div className="min-w-0">
                        <h2 className="truncate text-xl text-navy">{school.name}</h2>
                        <p className="truncate text-sm text-muted-foreground">{school.city}, {school.state} · {school.mascot}</p>
                      </div>
                    </div>

                    <div className="hidden min-w-0 gap-6 border-l border-border pl-6 lg:flex">
                      <div className="min-w-24">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Orders</div>
                        <div className="font-display text-xl text-navy">{school.orders}</div>
                        <div className="text-[11px] text-muted-foreground">{takeRate}% of seniors</div>
                      </div>
                      <div className="min-w-24">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Revenue</div>
                        <div className="font-display text-xl text-navy">{money(school.revenue)}</div>
                        <div className="text-[11px] text-muted-foreground">avg {money(Math.round(school.revenue / Math.max(school.orders, 1)))}/order</div>
                      </div>
                      <div className="min-w-28">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Season</div>
                        <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-secondary">
                          <div className="h-full bg-gold" style={{ width: `${Math.min(takeRate, 100)}%` }} />
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <CalendarClock className="h-3 w-3" /> closes {school.closesOn}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t border-border pt-4 sm:justify-end sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                      <span className={cn("rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase", STATUS_STYLES[school.status])}>{school.status}</span>
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/">Order page <ArrowUpRight /></Link>
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((school) => {
                const takeRate = Math.round((school.orders / school.seniors) * 100);
                return (
                  <article key={school.id} className="border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                    <div className="flex items-start justify-between gap-3">
                      <Crest school={school} size="lg" />
                      <span className={cn("rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase", STATUS_STYLES[school.status])}>{school.status}</span>
                    </div>
                    <h2 className="mt-4 text-xl text-navy">{school.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{school.city}, {school.state} · {school.mascot}</p>
                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Orders</div>
                        <div className="font-display text-xl text-navy">{school.orders}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Revenue</div>
                        <div className="font-display text-xl text-navy">{money(school.revenue)}</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{takeRate}% of {num(school.seniors)} seniors</span>
                        <span className="flex items-center gap-1"><CalendarClock className="h-3 w-3" /> closes {school.closesOn}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full bg-gold" style={{ width: `${Math.min(takeRate, 100)}%` }} />
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/">Order page <ArrowUpRight /></Link>
                      </Button>
                      <Link to="/sales" className="text-sm font-semibold text-navy underline-offset-4 hover:underline">Catalogue</Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
