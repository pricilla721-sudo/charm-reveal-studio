import { createFileRoute } from "@tanstack/react-router";
import heroJacket from "@/assets/hero-jacket.jpg";
import sizingImg from "@/assets/sizing.jpg";
import patchesImg from "@/assets/patches.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AllRec Paperless Order — Letter Jackets, Ordered From a Phone" },
      {
        name: "description",
        content:
          "Students build and size their letter jacket, parents approve with one link, payment closes the order and production gets a clean slip. No paper forms.",
      },
      {
        property: "og:title",
        content: "AllRec Paperless Order — Letter Jackets, Ordered From a Phone",
      },
      {
        property: "og:description",
        content:
          "Build, size, approve and pay in one link. Every order lands in production as a complete jacket slip.",
      },
    ],
  }),
  component: Index,
});

const STEPS = [
  {
    n: "01",
    t: "The link arrives",
    d: "The dealer rep sends one ordering link. School colours, mascot, activity and spec arrive with it — nothing to look up, nothing to sign in to.",
  },
  {
    n: "02",
    t: "The student builds",
    d: "Package or à la carte. Letter, year, inserts, mascot, number, back name, monogram — all rendered on the jacket as they choose, with every price on its own row.",
  },
  {
    n: "03",
    t: "A parent approves",
    d: "One email or text opens the review page. Approve as-is, or send it back with notes. The link is the access — no account, no password.",
  },
  {
    n: "04",
    t: "Payment closes it",
    d: "Card, wallet or an invoice from the rep. On approval a payment window opens with reminders on day 1, 3, 5 and 7.",
  },
];

const PACKAGES = [
  {
    id: "essential",
    name: "Essential",
    price: "$289",
    badge: "",
    blurb: "The jacket, your letter and your name on the chest.",
    inc: ["Wool body, vinyl raglan sleeves", "Award letter, made and sewn on", "Chest monogram"],
  },
  {
    id: "classic",
    name: "Classic",
    price: "$379",
    badge: "Most popular",
    blurb: "Adds your graduation year, one activity insert and the mascot patch.",
    inc: [
      "Everything in Essential",
      "Graduation year patch",
      "One activity insert",
      "Mascot patch on the sleeve",
    ],
  },
  {
    id: "complete",
    name: "Complete",
    price: "$489",
    badge: "",
    blurb: "Leather sleeves, your name on the back and your jersey number.",
    inc: [
      "Everything in Classic",
      "Leather sleeve upgrade",
      "Back name, one or two lines",
      "Jersey number",
    ],
  },
];

const BUILDER = [
  {
    t: "Rendered as they choose",
    d: "The jacket turns front to back so a student sees the back name and number before they commit — not after the slip is cut.",
  },
  {
    t: "Required patches pre-filled",
    d: "Letter and year date come from the school and activity configuration, so the fields that always get filled stop being questions.",
  },
  {
    t: "Prices on the row",
    d: "Every add-on carries its price where it is chosen. The running total never moves for a reason the student can't see.",
  },
  {
    t: "Sizes production already uses",
    d: "XS–4XL, matching the current work orders, with sleeve and body adjustments from ±1 to ±6 inches.",
  },
  {
    t: "Edit without restarting",
    d: "Every section on the review screen links back to its step. A correction is a correction, not a restart.",
  },
  {
    t: "Contacts that reach the CRM",
    d: "Student and parent name, email, phone and relationship land in Zoho so AEs can see who ordered at which school.",
  },
];

const TIMELINE = [
  "Payment confirmed",
  "Patches enter Tajima",
  "Patches embroidered",
  "Match & pin complete",
  "Jacket assembled",
  "Final inspection",
  "Delivered to school",
];

function Index() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-4">
          <a href="#top" className="font-display text-lg font-bold tracking-[0.14em] uppercase">
            AllRec
          </a>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#how" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#sizing" className="transition-colors hover:text-foreground">
              Sizing
            </a>
            <a href="#packages" className="transition-colors hover:text-foreground">
              Packages
            </a>
            <a href="#dealers" className="transition-colors hover:text-foreground">
              For dealers
            </a>
          </nav>
          <a
            href="#demo"
            className="ml-auto rounded-lg border border-navy/25 px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-secondary"
          >
            Request a walkthrough
          </a>
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="surface-navy relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 md:grid-cols-[1.05fr_.95fr] md:py-28">
            <div>
              <p className="eyebrow text-gold">Paperless Order Module</p>
              <h1 className="mt-5 text-5xl sm:text-6xl lg:text-7xl">
                The paper order
                <br />
                form <span className="text-gold-gradient">retires</span>
                <br />
                this season.
              </h1>
              <div className="rule-gold mt-8 h-px w-24" />
              <p className="mt-7 max-w-lg text-base leading-relaxed text-navy-foreground/75">
                Students build their letter jacket on a phone, get sized without a tape measure,
                and a parent approves with one link. Production receives a complete jacket slip —
                no handwriting, no missing fields, no second phone call.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <a
                  href="#demo"
                  className="rounded-lg px-6 py-3 text-sm font-semibold text-gold-foreground shadow-[var(--shadow-lift)] transition-transform hover:-translate-y-0.5"
                  style={{ background: "var(--gradient-gold)" }}
                >
                  Request a walkthrough
                </a>
                <a
                  href="#how"
                  className="rounded-lg border border-navy-foreground/25 px-6 py-3 text-sm font-semibold text-navy-foreground transition-colors hover:bg-navy-foreground/10"
                >
                  See the flow
                </a>
              </div>
              <dl className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-navy-foreground/15 pt-7">
                {[
                  ["4 steps", "Start to submitted"],
                  ["No sign-in", "The link is the access"],
                  ["XS–4XL", "Sizes production uses"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-display text-xl text-gold">{k}</dt>
                    <dd className="mt-1 text-xs leading-snug text-navy-foreground/60">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="relative">
              <div
                className="absolute -inset-8 -z-10 rounded-full opacity-40 blur-3xl"
                style={{ background: "var(--gradient-gold)", opacity: 0.14 }}
              />
              <img
                src={heroJacket}
                width={1280}
                height={1600}
                alt="Maroon and bone letter jacket with a chenille chest letter and gold sleeve patch"
                className="mx-auto w-full max-w-md rounded-2xl shadow-[var(--shadow-lift)]"
              />
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <div className="grid gap-10 md:grid-cols-[.9fr_1.1fr]">
              <h2 className="text-3xl sm:text-4xl">Why the form had to go</h2>
              <div className="grid gap-6 sm:grid-cols-3">
                {[
                  [
                    "Illegible slips",
                    "A carbon form filled in a gym at a folding table is the least reliable document in the whole build.",
                  ],
                  [
                    "Missing fields",
                    "Monogram spelling, year style, mascot placement — the fields most often blank are the ones that stop production.",
                  ],
                  [
                    "Money at the table",
                    "Cash and cheques collected on site, reconciled weeks later, with nothing tying a payment to a jacket.",
                  ],
                ].map(([t, d]) => (
                  <div key={t}>
                    <div className="h-0.5 w-8 bg-brand-red" />
                    <h3 className="mt-4 text-base tracking-normal">{t}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <p className="eyebrow text-muted-foreground">How it works</p>
          <h2 className="mt-4 max-w-2xl text-4xl sm:text-5xl">
            One link, four steps, one clean order
          </h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="bg-card p-7">
                <span className="font-display text-3xl text-gold-deep">{s.n}</span>
                <h3 className="mt-4 text-lg tracking-normal">{s.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sizing */}
        <section id="sizing" className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 md:grid-cols-2 md:py-28">
            <img
              src={sizingImg}
              width={1200}
              height={912}
              loading="lazy"
              alt="Student in a school hallway holding a phone to take a full-body sizing photo"
              className="rounded-2xl border border-border shadow-[var(--shadow-card)]"
            />
            <div>
              <p className="eyebrow text-muted-foreground">Sizing</p>
              <h2 className="mt-4 text-4xl sm:text-5xl">
                Three ways to get
                <br />
                the size right
              </h2>
              <div className="mt-8 space-y-6">
                {[
                  [
                    "Phone camera measurement",
                    "Front-facing, arms at sides, plain background. On-screen guidance the whole way, with a recommended size the student can override.",
                  ],
                  [
                    "Sizing questionnaire",
                    "Height, weight, build and fit preference. Always offered as an escape hatch — poor lighting and no helper are common at home.",
                  ],
                  [
                    "The size chart",
                    "In-person measurement is not going away. A student who already knows their size just picks it.",
                  ],
                ].map(([t, d]) => (
                  <div key={t} className="flex gap-4">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-gold-deep" />
                    <div>
                      <h3 className="text-base tracking-normal">{t}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-9 border-l-2 border-gold pl-4 text-sm leading-relaxed text-muted-foreground">
                Target accuracy: match or beat a tape measure in the hands of an untrained person.
              </p>
            </div>
          </div>
        </section>

        {/* Builder features */}
        <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <p className="eyebrow text-muted-foreground">The builder</p>
          <h2 className="mt-4 max-w-2xl text-4xl sm:text-5xl">
            Built so the answer is never “I'll check”
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {BUILDER.map((f) => (
              <div key={f.t} className="card-elevated p-7">
                <h3 className="text-base tracking-normal">{f.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Packages */}
        <section id="packages" className="border-y border-border bg-card">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
            <p className="eyebrow text-muted-foreground">Packages</p>
            <h2 className="mt-4 text-4xl sm:text-5xl">Priced by the rep, not by us</h2>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Every dealer builds their own packages from the products they offer. A package sets a
              fixed retail price; anything outside it is priced as an add-on. À la carte stays
              available unless the rep turns it off.
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {PACKAGES.map((p) => {
                const featured = p.badge !== "";
                return (
                  <div
                    key={p.id}
                    className={
                      featured
                        ? "surface-navy relative rounded-2xl p-8 shadow-[var(--shadow-lift)]"
                        : "card-elevated p-8"
                    }
                  >
                    {featured && (
                      <span className="eyebrow absolute -top-3 left-8 rounded-md px-3 py-1 text-gold-foreground" style={{ background: "var(--gradient-gold)" }}>
                        {p.badge}
                      </span>
                    )}
                    <h3 className="text-xl tracking-normal">{p.name}</h3>
                    <p
                      className={
                        featured
                          ? "mt-4 font-display text-5xl text-gold"
                          : "mt-4 font-display text-5xl text-navy"
                      }
                    >
                      {p.price}
                    </p>
                    <p
                      className={
                        featured
                          ? "mt-4 text-sm leading-relaxed text-navy-foreground/75"
                          : "mt-4 text-sm leading-relaxed text-muted-foreground"
                      }
                    >
                      {p.blurb}
                    </p>
                    <ul
                      className={
                        featured
                          ? "mt-6 space-y-2.5 border-t border-navy-foreground/15 pt-6 text-sm text-navy-foreground/80"
                          : "mt-6 space-y-2.5 border-t border-border pt-6 text-sm text-muted-foreground"
                      }
                    >
                      {p.inc.map((i) => (
                        <li key={i} className="flex gap-3">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-deep" />
                          {i}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            <p className="mt-8 text-xs text-muted-foreground">
              Figures shown are illustrative pending AllRec pricing profiles.
            </p>
          </div>
        </section>

        {/* Payment */}
        <section className="surface-navy">
          <div className="mx-auto grid max-w-6xl gap-14 px-6 py-20 md:grid-cols-2 md:py-28">
            <div>
              <p className="eyebrow text-gold">Collection</p>
              <h2 className="mt-4 text-4xl sm:text-5xl">
                Whoever collects,
                <br />
                collects properly
              </h2>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-navy-foreground/75">
                Collection is set on the rep and can be overridden per school — some are
                student-pay, some school-pay. Either way the order and the money stay tied together.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                [
                  "Rep collects",
                  "The dealer emails an invoice with a card link, or the family pays at the school office.",
                ],
                ["AllRec collects", "Payment runs directly through the AllRec portal."],
                [
                  "Card, ACH and wallets",
                  "Credit and debit, with Apple Pay and Google Pay to cut mobile friction.",
                ],
                [
                  "A visible window",
                  "Seven days by default with automated reminders. If it expires, the order expires and everyone is told.",
                ],
              ].map(([t, d]) => (
                <div
                  key={t}
                  className="rounded-xl border border-navy-foreground/15 bg-navy-foreground/[0.06] p-6"
                >
                  <h3 className="text-base tracking-normal text-navy-foreground">{t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-foreground/65">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <p className="eyebrow text-muted-foreground">After the order</p>
          <h2 className="mt-4 max-w-xl text-4xl sm:text-5xl">
            The family can watch it get made
          </h2>
          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TIMELINE.map((step, i) => (
              <li key={step} className="card-elevated flex items-center gap-4 p-5">
                <span className="font-display text-sm text-gold-deep">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-medium">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Dealers */}
        <section id="dealers" className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 md:grid-cols-2 md:py-28">
            <div>
              <p className="eyebrow text-muted-foreground">For dealers</p>
              <h2 className="mt-4 text-4xl sm:text-5xl">
                Your catalogue,
                <br />
                your prices,
                <br />
                your schools
              </h2>
              <div className="mt-8 space-y-5 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Configure what each school can order and how money is collected. Load colours,
                  mascot, activities and spec once — every ordering link for that school carries
                  them.
                </p>
                <p>
                  Orders arrive as complete jacket slips with the fields production already reads:
                  spec, sizes and adjustments, letter, year style, inserts, mascot placement,
                  number, position, back name and monogram.
                </p>
              </div>
              <a
                href="#demo"
                className="mt-9 inline-block rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-navy-foreground transition-transform hover:-translate-y-0.5"
              >
                Talk to us about your schools
              </a>
            </div>
            <img
              src={patchesImg}
              width={1200}
              height={912}
              loading="lazy"
              alt="Chenille and embroidered varsity patches on a dark slate surface"
              className="rounded-2xl border border-border shadow-[var(--shadow-card)]"
            />
          </div>
        </section>

        {/* CTA */}
        <section id="demo" className="mx-auto max-w-3xl px-6 py-24 text-center md:py-32">
          <div className="rule-gold mx-auto h-px w-16" />
          <h2 className="mt-8 text-4xl sm:text-5xl">Walk the flow with us</h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Twenty minutes, one school's configuration, and an order placed end to end on a phone.
            Bring your current order form and we'll show you what replaces every line of it.
          </p>
          <form
            className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:flex-row"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              required
              placeholder="you@dealership.com"
              aria-label="Work email"
              className="flex-1 rounded-lg border border-input bg-card px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="submit"
              className="rounded-lg px-6 py-3 text-sm font-semibold text-gold-foreground transition-transform hover:-translate-y-0.5"
              style={{ background: "var(--gradient-gold)" }}
            >
              Request a walkthrough
            </button>
          </form>
        </section>
      </main>

      <footer className="surface-navy">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-8">
          <span className="font-display text-base font-bold tracking-[0.14em] uppercase">
            AllRec
          </span>
          <span className="text-xs text-navy-foreground/50">
            Paperless Order Module · Project Northstar
          </span>
          <span className="ml-auto text-xs text-navy-foreground/50">
            © {new Date().getFullYear()} AllRec
          </span>
        </div>
      </footer>
    </div>
  );
}
