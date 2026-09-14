import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Award,
  ChevronDown,
  CircleDollarSign,
  Grid2X2,
  LayoutList,
  Medal,
  Package,
  Pencil,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Store,
  Tag,
  Users,
} from "lucide-react";
import jacketCutout from "@/assets/jacket-cutout-business-card.png";
import dealerLogoAsset from "@/assets/all-star-letter-jackets.png.asset.json";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Dealer Product Catalogue — All-Star Letter Jackets" },
      {
        name: "description",
        content: "Browse, price, and manage letter jacket products offered to assigned schools.",
      },
      { property: "og:title", content: "Dealer Product Catalogue — All-Star Letter Jackets" },
      {
        property: "og:description",
        content: "A focused sales workspace for managing school product catalogues and pricing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SalesCatalogue,
});

type Category = "All items" | "Varsity jackets" | "Award letters" | "Mascot patches" | "Monograms";
type Product = {
  id: number;
  name: string;
  sku: string;
  category: Exclude<Category, "All items">;
  description: string;
  price: number;
  cost: number;
  offered: boolean;
  featured?: boolean;
  schools: number;
  sizes: string[];
  swatches: string[];
  mark: string;
};

const CATEGORIES: { name: Category; icon: typeof Package }[] = [
  { name: "All items", icon: Package },
  { name: "Varsity jackets", icon: Shield },
  { name: "Award letters", icon: Award },
  { name: "Mascot patches", icon: Medal },
  { name: "Monograms", icon: Tag },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Classic wool & leather varsity jacket",
    sku: "JKT-CL-01",
    category: "Varsity jackets",
    description: "24 oz premium Melton wool body with genuine cowhide leather sleeves and quilted lining.",
    price: 350,
    cost: 125,
    offered: true,
    featured: true,
    schools: 126,
    sizes: ["XS", "S", "M", "L", "XL", "2XL"],
    swatches: ["bg-navy", "bg-brand-red", "bg-gold", "bg-ok"],
    mark: "J",
  },
  {
    id: 2,
    name: "Varsity classic jacket",
    sku: "JKT-HR-02",
    category: "Varsity jackets",
    description: "Full wool body and raglan vinyl sleeves with traditional snap closure and quilted lining.",
    price: 220,
    cost: 110,
    offered: true,
    schools: 1530,
    sizes: ["S", "M", "L", "XL"],
    swatches: ["bg-navy", "bg-brand-red", "bg-muted-foreground"],
    mark: "J",
  },
  {
    id: 3,
    name: "Premium chenille award letter",
    sku: "LTR-CH-08",
    category: "Award letters",
    description: "Two-layer chenille school letter with felt backing and custom embroidered detail.",
    price: 42,
    cost: 17,
    offered: true,
    schools: 84,
    sizes: ["6 in", "8 in", "10 in"],
    swatches: ["bg-gold", "bg-brand-red", "bg-navy"],
    mark: "N",
  },
  {
    id: 4,
    name: "Mascot crest patch",
    sku: "PTC-MS-14",
    category: "Mascot patches",
    description: "Detailed embroidered mascot crest with merrowed edge and school-color thread matching.",
    price: 34,
    cost: 12,
    offered: true,
    schools: 62,
    sizes: ["4 in", "6 in"],
    swatches: ["bg-brand-red", "bg-navy", "bg-gold"],
    mark: "★",
  },
  {
    id: 5,
    name: "Script chest monogram",
    sku: "MON-SC-03",
    category: "Monograms",
    description: "Custom embroidered first or last name in a school-approved script style.",
    price: 18,
    cost: 6,
    offered: true,
    schools: 141,
    sizes: ["Standard"],
    swatches: ["bg-gold", "bg-navy"],
    mark: "Aa",
  },
  {
    id: 6,
    name: "Graduation year patch",
    sku: "PTC-YR-12",
    category: "Mascot patches",
    description: "Four-digit graduation year in block or script styling with two-color felt construction.",
    price: 22,
    cost: 8,
    offered: false,
    schools: 38,
    sizes: ["Block", "Script"],
    swatches: ["bg-navy", "bg-gold"],
    mark: "28",
  },
];

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function ProductMark({ product, compact = false }: { product: Product; compact?: boolean }) {
  if (product.category === "Varsity jackets") {
    return (
      <div className={`${compact ? "h-24" : "h-44"} flex items-center justify-center overflow-hidden bg-secondary`}>
        <img src={jacketCutout} alt="" className="h-[145%] w-full object-contain" />
      </div>
    );
  }
  return (
    <div className={`${compact ? "h-16 w-16" : "h-44 w-full"} flex shrink-0 items-center justify-center bg-secondary`}>
      <span className="font-display text-4xl text-navy">{product.mark}</span>
    </div>
  );
}

function SalesCatalogue() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [category, setCategory] = useState<Category>("All items");
  const [query, setQuery] = useState("");
  const [offering, setOffering] = useState("all");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sort, setSort] = useState("featured");
  const [view, setView] = useState<"list" | "grid">("list");
  const [editing, setEditing] = useState<Product | null>(null);
  const [draftPrice, setDraftPrice] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const next = products.filter((product) => {
      const matchesCategory = category === "All items" || product.category === category;
      const matchesQuery = !normalized || `${product.name} ${product.sku} ${product.description}`.toLowerCase().includes(normalized);
      const matchesOffering = offering === "all" || (offering === "offered" ? product.offered : !product.offered);
      const matchesSize = selectedSizes.length === 0 || selectedSizes.some((size) => product.sizes.includes(size));
      return matchesCategory && matchesQuery && matchesOffering && matchesSize;
    });
    return [...next].sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "name") return a.name.localeCompare(b.name);
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    });
  }, [products, category, query, offering, selectedSizes, sort]);

  const counts = useMemo(
    () => Object.fromEntries(CATEGORIES.map(({ name }) => [name, name === "All items" ? products.length : products.filter((p) => p.category === name).length])),
    [products],
  );

  const toggleOffering = (id: number, checked: boolean) => {
    setProducts((current) => current.map((product) => (product.id === id ? { ...product, offered: checked } : product)));
  };

  const beginEdit = (product: Product) => {
    setEditing(product);
    setDraftPrice(String(product.price));
  };

  const savePrice = () => {
    const price = Number(draftPrice);
    if (!editing || !Number.isFinite(price) || price < 0) return;
    setProducts((current) => current.map((product) => (product.id === editing.id ? { ...product, price } : product)));
    setEditing(null);
  };

  return (
    <TooltipProvider>
      <main className="min-h-screen bg-secondary/45">
        <header className="border-b border-primary-foreground/10 bg-navy text-primary-foreground">
          <div className="mx-auto flex max-w-[1500px] items-center gap-5 px-5 py-3 lg:px-8">
            <Link to="/" className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gold text-gold-foreground">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase text-gold">Paperless orders</div>
                <div className="truncate font-display text-lg leading-none">Sales catalogue</div>
              </div>
            </Link>
            <nav className="ml-auto hidden items-center gap-1 rounded-md bg-primary-foreground/8 p-1 md:flex" aria-label="Sales areas">
              <Button size="sm" variant="secondary">Catalogue</Button>
              <Button size="sm" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">Customer orders</Button>
            </nav>
            <div className="hidden border-l border-primary-foreground/15 pl-5 text-right lg:block">
              <div className="text-sm font-semibold">Morgan Lee</div>
              <div className="text-xs text-primary-foreground/60">All-Star · Sales</div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-5 py-6 lg:px-8">
          <section className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-4">
              <img src={dealerLogoAsset.url} alt="All-Star Letter Jackets" className="h-12 w-auto max-w-44 object-contain" />
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="eyebrow text-brand-red">Dealer workspace</p>
                <h1 className="mt-1 text-4xl text-navy sm:text-5xl">Product catalogue</h1>
              </div>
            </div>
            <Select defaultValue="portfolio">
              <SelectTrigger className="w-full bg-card lg:w-80" aria-label="School portfolio">
                <Store className="mr-2 h-4 w-4 text-brand-red" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portfolio">All assigned schools · 18</SelectItem>
                <SelectItem value="northstar">Northstar High</SelectItem>
                <SelectItem value="central">Central Academy</SelectItem>
                <SelectItem value="westlake">Westlake Prep</SelectItem>
              </SelectContent>
            </Select>
          </section>

          <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5" aria-label="Product categories">
            {CATEGORIES.map(({ name, icon: Icon }) => {
              const active = category === name;
              return (
                <Button
                  key={name}
                  variant="outline"
                  onClick={() => setCategory(name)}
                  className={`h-auto justify-start gap-3 px-4 py-4 ${active ? "border-navy bg-navy text-primary-foreground hover:bg-navy/95 hover:text-primary-foreground" : "bg-card"}`}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-md ${active ? "bg-gold text-gold-foreground" : "bg-secondary text-navy"}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 text-left">
                    <span className={`block text-[10px] uppercase ${active ? "text-primary-foreground/60" : "text-muted-foreground"}`}>Category</span>
                    <span className="block truncate text-sm font-semibold">{name}</span>
                  </span>
                  <span className={`ml-auto text-xs ${active ? "text-gold" : "text-muted-foreground"}`}>{counts[name]}</span>
                </Button>
              );
            })}
          </section>

          <section className="mt-6 flex flex-col gap-3 border-y border-border bg-card px-4 py-4 md:flex-row md:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, materials, or SKU…" className="pl-9" />
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured first</SelectItem>
                <SelectItem value="name">Name A–Z</SelectItem>
                <SelectItem value="price-low">Price: low to high</SelectItem>
                <SelectItem value="price-high">Price: high to low</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex rounded-md border border-input bg-background p-1">
              <Tooltip>
                <TooltipTrigger asChild><Button size="icon" variant={view === "list" ? "secondary" : "ghost"} onClick={() => setView("list")} aria-label="List view"><LayoutList /></Button></TooltipTrigger>
                <TooltipContent>List view</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild><Button size="icon" variant={view === "grid" ? "secondary" : "ghost"} onClick={() => setView("grid")} aria-label="Grid view"><Grid2X2 /></Button></TooltipTrigger>
                <TooltipContent>Grid view</TooltipContent>
              </Tooltip>
            </div>
          </section>

          <div className="mt-6 grid gap-6 xl:grid-cols-[220px_1fr]">
            <aside className="space-y-6">
              <div>
                <div className="flex items-center gap-2 border-b border-border pb-3 font-display text-lg text-navy"><SlidersHorizontal className="h-4 w-4 text-brand-red" /> Filters</div>
                <div className="mt-4 space-y-3">
                  <label className="flex cursor-pointer items-center gap-3 text-sm">
                    <Checkbox checked={offering === "all"} onCheckedChange={() => setOffering("all")} /> All catalogue items
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 text-sm">
                    <Checkbox checked={offering === "offered"} onCheckedChange={() => setOffering("offered")} /> In my offering
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 text-sm">
                    <Checkbox checked={offering === "hidden"} onCheckedChange={() => setOffering("hidden")} /> Hidden items
                  </label>
                </div>
              </div>
              <div>
                <div className="border-b border-border pb-3 font-display text-lg text-navy">Production sizes</div>
                <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-1">
                  {["XS", "S", "M", "L", "XL", "2XL"].map((size) => (
                    <label key={size} className="flex cursor-pointer items-center gap-3 text-sm">
                      <Checkbox
                        checked={selectedSizes.includes(size)}
                        onCheckedChange={(checked) => setSelectedSizes((current) => checked ? [...current, size] : current.filter((item) => item !== size))}
                      />
                      <span>{size}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{products.filter((p) => p.sizes.includes(size)).length}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="border-l-2 border-gold bg-card p-4 text-xs leading-relaxed text-muted-foreground">
                Prices shown here appear in the student order flow for the selected schools.
              </div>
            </aside>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <div><span className="font-semibold text-navy">{filtered.length}</span> <span className="text-sm text-muted-foreground">products found</span></div>
                {(query || category !== "All items" || offering !== "all" || selectedSizes.length > 0) && (
                  <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setCategory("All items"); setOffering("all"); setSelectedSizes([]); }}>Clear filters</Button>
                )}
              </div>
              {filtered.length === 0 ? (
                <div className="border border-dashed border-border bg-card px-6 py-16 text-center">
                  <Search className="mx-auto h-7 w-7 text-muted-foreground" />
                  <h2 className="mt-4 text-2xl text-navy">No products match</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Try a different category, size, or search phrase.</p>
                </div>
              ) : view === "list" ? (
                <div className="space-y-3">
                  {filtered.map((product) => (
                    <article key={product.id} className={`grid items-center gap-4 border bg-card p-4 shadow-[var(--shadow-card)] sm:grid-cols-[72px_1fr_auto] ${product.offered ? "border-border" : "border-border opacity-65"}`}>
                      <ProductMark product={product} compact />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {product.featured && <span className="rounded-sm bg-navy px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">Featured</span>}
                          <span className={`rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase ${product.offered ? "bg-ok-soft text-ok" : "bg-secondary text-muted-foreground"}`}>{product.offered ? "In offering" : "Hidden"}</span>
                          <span className="text-xs text-muted-foreground">{product.sku}</span>
                        </div>
                        <h2 className="mt-2 truncate text-xl text-navy">{product.name}</h2>
                        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{product.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{product.sizes.join(" · ")}</span>
                          <span aria-hidden="true">·</span>
                          <span className="flex gap-1" aria-label={`${product.swatches.length} color options`}>{product.swatches.map((swatch, index) => <i key={index} className={`h-2.5 w-2.5 rounded-full border border-border ${swatch}`} />)}</span>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {product.schools} schools</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-t border-border pt-4 sm:justify-end sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                        <div className="text-right">
                          <div className="font-display text-2xl text-navy">{money(product.price)}</div>
                          <div className="text-[11px] text-muted-foreground">Cost {money(product.cost)}</div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => beginEdit(product)}><Pencil /> Price</Button>
                        <Switch checked={product.offered} onCheckedChange={(checked) => toggleOffering(product.id, checked)} aria-label={`${product.offered ? "Hide" : "Offer"} ${product.name}`} />
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((product) => (
                    <article key={product.id} className={`overflow-hidden border bg-card shadow-[var(--shadow-card)] ${product.offered ? "border-border" : "border-border opacity-65"}`}>
                      <ProductMark product={product} />
                      <div className="p-5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-muted-foreground">{product.sku}</span>
                          <Switch checked={product.offered} onCheckedChange={(checked) => toggleOffering(product.id, checked)} aria-label={`${product.offered ? "Hide" : "Offer"} ${product.name}`} />
                        </div>
                        <h2 className="mt-3 min-h-10 text-xl text-navy">{product.name}</h2>
                        <p className="mt-2 line-clamp-2 min-h-10 text-sm text-muted-foreground">{product.description}</p>
                        <div className="mt-5 flex items-end justify-between border-t border-border pt-4">
                          <div><div className="font-display text-2xl text-navy">{money(product.price)}</div><div className="text-[11px] text-muted-foreground">Cost {money(product.cost)}</div></div>
                          <Button variant="outline" size="sm" onClick={() => beginEdit(product)}><Pencil /> Price</Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        <Dialog open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl text-navy">Set customer price</DialogTitle>
              <DialogDescription>{editing?.name} · {editing?.sku}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="rounded-md border-l-2 border-brand-red bg-secondary p-4 text-sm">
                <div className="flex items-center gap-2 font-semibold text-navy"><CircleDollarSign className="h-4 w-4" /> Pricing summary</div>
                <div className="mt-2 flex justify-between text-muted-foreground"><span>Your cost</span><span>{editing ? money(editing.cost) : "—"}</span></div>
              </div>
              <label>
                <span className="field-label">Customer price</span>
                <Input type="number" min="0" step="1" value={draftPrice} onChange={(event) => setDraftPrice(event.target.value)} autoFocus />
              </label>
              {editing && Number(draftPrice) >= 0 && (
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Gross margin</span><span className="font-semibold text-ok">{money(Number(draftPrice) - editing.cost)}</span></div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={savePrice}>Save price</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </TooltipProvider>
  );
}